import { SellerSidebar } from "@/components/seller-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/seller/dashboard");
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "seller" && userRole !== "admin") {
    redirect("/");
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="flex min-h-screen" style={{ background: "#FAFBFC" }}>
      <SellerSidebar storeName={sellerProfile?.storeName} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
