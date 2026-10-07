import { AdminSidebar } from "@/components/admin-sidebar";
import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#FAFBFC" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
