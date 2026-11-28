"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  Package,
  ShieldCheck,
  Leaf,
  LogOut,
  ChevronRight,
  Sparkles,
  Home,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.08)",
  bg: "#FAF6F0",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#8C8C85",
  border: "#EAE2D9",
  borderLight: "#F4EFE7",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get("tab") || "overview";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const navItems = [
    { label: "Overview", tabId: "overview", href: "/admin", icon: LayoutDashboard },
    { label: "Orders Queue", tabId: "orders", href: "/admin?tab=orders", icon: ShoppingBag },
    { label: "Sellers & Verification", tabId: "sellers", href: "/admin?tab=sellers", icon: Store },
    { label: "Member Directory", tabId: "users", href: "/admin?tab=users", icon: Users },
    { label: "Product Categories", tabId: "categories", href: "/admin?tab=categories", icon: Package },
    { label: "Security & Audit", tabId: "audit", href: "/admin?tab=audit", icon: ShieldCheck },
  ];

  return (
    <aside
      className="w-64 flex flex-col min-h-screen sticky top-0 shrink-0"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRight: `1px solid ${C.border}`,
      }}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-[#EAE2D9]">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/logo.jpeg"
              alt="Lucent Logo"
              className="h-9 w-9 object-cover rounded-xl border border-[rgba(45,90,61,0.15)] shadow-xs"
            />
          </div>
          <div>
            <span className="text-lg font-serif font-bold tracking-tight block leading-none text-[#1A1D21]">
              Lucent
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest block mt-1 text-[#2D5A3D]">
              Admin Console
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8C85]">
            Admin Modules
          </p>
          {navItems.map((item) => {
            const isActive = pathname === "/admin" && currentTab === item.tabId;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#2D5A3D] text-white shadow-xs"
                    : "text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0]"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-white" : "text-[#8C8C85]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Marketplace Storefront Links */}
        <div className="pt-3 border-t border-[#EAE2D9] space-y-1">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8C85]">
            Marketplace Storefront
          </p>
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0] transition-colors"
          >
            <Home size={15} className="text-[#8C8C85]" />
            <span>Storefront Home</span>
          </Link>
          <Link
            href="/shop"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0] transition-colors"
          >
            <ShoppingBag size={15} className="text-[#8C8C85]" />
            <span>Shop Formulations</span>
          </Link>
          <Link
            href="/shops"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0] transition-colors"
          >
            <Store size={15} className="text-[#8C8C85]" />
            <span>Artisan Apothecaries</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0] transition-colors"
          >
            <Sparkles size={15} className="text-[#8C8C85]" />
            <span>AI Skin Consult</span>
          </Link>
        </div>
      </nav>

      {/* Footer / Exit */}
      <div className="p-4 space-y-2 border-t border-[#EAE2D9]">
        <Link
          href="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0] transition-colors"
        >
          <span>Marketplace Storefront</span>
          <ChevronRight size={14} className="text-[#8C8C85]" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
