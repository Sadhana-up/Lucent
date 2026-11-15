import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/chat");
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole === "admin") {
    redirect("/admin");
  }
  if (userRole === "seller") {
    redirect("/seller/dashboard");
  }

  return <>{children}</>;
}
