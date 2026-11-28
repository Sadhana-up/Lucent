import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getSession, getUserRole } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/admin");
  }

  if (getUserRole(session.user) !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] p-6 text-center">
        <div className="max-w-md p-8 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
            403
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-600">
            You are signed in as <span className="font-semibold">{session.user.email}</span>, but your account does not have administrator privileges.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
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
