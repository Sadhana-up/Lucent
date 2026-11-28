import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files and internal API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // 1. Unauthenticated users
  if (!sessionToken) {
    if (pathname === "/onboarding") {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", "/onboarding");
      return NextResponse.redirect(signInUrl);
    }

    if (
      pathname === "/chat" ||
      pathname.startsWith("/chat/") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/admin")
    ) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  // 2. Authenticated users: verify session
  let session = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    console.error("Middleware session fetch error:", err);
  }

  if (!session?.user) {
    // If cookie is stale/invalid, redirect protected routes to sign-in
    if (
      pathname === "/onboarding" ||
      pathname === "/chat" ||
      pathname.startsWith("/chat/") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/admin")
    ) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  const user = session.user as { role?: string; onboardingCompleted?: boolean };
  const role = user.role || "customer";
  const onboardingCompleted = user.onboardingCompleted === true;

  // Auth pages (/sign-in, /sign-up, etc.) for authenticated users
  if (
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    if (role === "customer" && !onboardingCompleted) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "seller") {
      return NextResponse.redirect(new URL("/seller", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Onboarding page routing
  if (pathname === "/onboarding") {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "seller") {
      return NextResponse.redirect(new URL("/seller/profile", request.url));
    }
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL("/shop", request.url));
    }
    return NextResponse.next();
  }

  // Customers must complete onboarding before accessing other app pages
  if (role === "customer" && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Protect Seller and Admin routes
  if (pathname.startsWith("/seller") && role !== "seller" && role !== "admin") {
    return NextResponse.redirect(new URL("/seller/profile", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads/|api/).*)",
  ],
};
