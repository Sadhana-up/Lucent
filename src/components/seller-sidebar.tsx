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
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  accent: "#c4956a",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
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
    <aside className="w-64 flex flex-col min-h-screen sticky top-0 shrink-0 glass-panel" style={{ borderRight: `1px solid ${C.border}` }}>
      {/* Brand Header */}
      <div className="p-6" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-shadow duration-300 hover:shadow-[0_0_16px_rgba(74,103,65,0.2)]" style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)" }}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-medium tracking-tight block leading-none" style={{ color: C.text }}>
              Lucent
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider block mt-1" style={{ color: C.primary }}>
              Seller Hub
            </span>
          </div>
        </Link>

        {storeName && (
          <div className="mt-4 p-2.5 rounded-xl flex items-center justify-between glass-card transition-all duration-300 hover:shadow-sm">
            <div className="truncate">
              <p className="text-xs font-medium truncate" style={{ color: C.text }}>{storeName}</p>
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
                background: active ? "linear-gradient(135deg, #4a6741, #6b8c62)" : "transparent",
                color: active ? "#fff" : C.textLight,
                boxShadow: active ? "0 4px 12px rgba(74, 103, 65, 0.2)" : "none",
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
          style={{ color: C.textLight }}
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
