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
  ExternalLink,
  Sparkles,
  Home,
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

export function SellerSidebar({
  storeName,
  isVerified,
  storeSlug,
}: {
  storeName?: string;
  isVerified?: boolean;
  storeSlug?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("lucent_cart");
    } catch {}
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

  const marketplaceLinks = [
    { label: "Marketplace Home", href: "/", icon: Home },
    { label: "Shop Formulations", href: "/shop", icon: ShoppingBag },
    { label: "Artisan Apothecaries", href: "/shops", icon: Store },
    { label: "AI Skin Consult", href: "/chat", icon: Sparkles },
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

        {storeName ? (
          <div
            className="mt-4 p-2.5 rounded-xl transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{storeName}</p>
                <p className="text-[10px] font-medium" style={{ color: isVerified ? C.primary : "#D97706" }}>
                  {isVerified ? "✓ Verified Artisan Lab" : "Pending Verification"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.textMuted }} />
            </div>
            {storeSlug && (
              <Link
                href={`/shops/${storeSlug}`}
                target="_blank"
                className="mt-2 pt-2 border-t flex items-center gap-1.5 text-[11px] font-bold text-[#2D5A3D] hover:underline"
                style={{ borderColor: C.borderLight }}
              >
                <span>View Live Boutique</span>
                <ExternalLink size={11} />
              </Link>
            )}
          </div>
        ) : (
          <Link
            href="/seller/profile"
            className="mt-4 p-2.5 rounded-xl flex items-center justify-between transition-all duration-300 bg-amber-50/80 border border-amber-200 hover:bg-amber-100/80"
          >
            <div className="truncate">
              <p className="text-xs font-semibold text-amber-900 truncate">Store Setup Needed</p>
              <p className="text-[10px] text-amber-700 font-medium">Click to configure store →</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
          </Link>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8C85]">
            Seller Tools
          </p>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300"
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
        </div>

        {/* Marketplace Explorer Links */}
        <div className="pt-3 border-t space-y-1" style={{ borderColor: C.borderLight }}>
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8C85]">
            Buyer Storefront
          </p>
          {marketplaceLinks.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-black/5 transition-colors"
              >
                <Icon className="w-4 h-4 text-[#8C8C85]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
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
