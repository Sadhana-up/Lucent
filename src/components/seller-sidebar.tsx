"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Store,
  Leaf,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryDark: "#1E3D2A",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  primaryGlow: "rgba(45, 90, 61, 0.12)",
  accent: "#7C6BEA",
  accentGhost: "rgba(124, 107, 234, 0.08)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
};

export function SellerSidebar({ storeName }: { storeName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const navItems = [
    { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/seller/products", icon: Package },
    { label: "Add Product", href: "/seller/products/new", icon: PlusCircle },
    { label: "Orders", href: "/seller/orders", icon: ShoppingBag },
    { label: "Store Settings", href: "/seller/profile", icon: Store },
  ];

  return (
    <aside
      className="w-64 flex flex-col min-h-screen sticky top-0 shrink-0"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRight: `1px solid ${C.border}`,
      }}
    >
      {/* Brand Header */}
      <div className="p-6" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-shadow duration-300"
            style={{
              background: "linear-gradient(135deg, #2D5A3D, #3D7A52)",
              boxShadow: "0 0 20px rgba(45,90,61,0.15)",
            }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight block leading-none" style={{ color: C.text }}>
              Lucent
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider block mt-1" style={{ color: C.primary }}>
              Seller Hub
            </span>
          </div>
        </Link>

        {storeName && (
          <div
            className="mt-4 p-2.5 rounded-xl flex items-center justify-between transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div className="truncate">
              <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{storeName}</p>
              <p className="text-[10px]" style={{ color: C.textMuted }}>Verified Seller</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.textMuted }} />
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: active ? "linear-gradient(135deg, #2D5A3D, #3D7A52)" : "transparent",
                color: active ? "#fff" : C.textSecondary,
                boxShadow: active ? "0 4px 16px rgba(45, 90, 61, 0.2)" : "none",
              }}
            >
              <Icon className="w-4 h-4" style={{ color: active ? "rgba(255,255,255,0.8)" : C.textMuted }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Exit */}
      <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${C.borderLight}` }}>
        <Link
          href="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-200 hover:opacity-70"
          style={{ color: C.textSecondary }}
        >
          <span>Back to Marketplace</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer hover:opacity-70"
          style={{ color: C.primary }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
