import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
  if (userRole === "seller" || userRole === "admin") {
    redirect("/seller/dashboard");
  }

  return <>{children}</>;
}
