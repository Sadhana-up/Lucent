"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Store,
  Sparkles,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
    <aside className="w-64 border-r border-pink-200/60 bg-gradient-to-b from-pink-50/80 via-white to-pink-50/30 flex flex-col min-h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-pink-200/40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-900 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-pink-100" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-rose-950 block leading-none">
              Lucent
            </span>
            <span className="text-[11px] font-medium text-rose-700 uppercase tracking-wider block mt-1">
              Seller Hub
            </span>
          </div>
        </Link>

        {storeName && (
          <div className="mt-4 p-2.5 rounded-lg bg-pink-100/50 border border-pink-200/60 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-rose-950 truncate">{storeName}</p>
              <p className="text-[10px] text-stone-500">Verified Seller</p>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-800 shrink-0" />
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-rose-900 text-white shadow-sm"
                  : "text-stone-700 hover:bg-pink-100/60 hover:text-rose-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-pink-200" : "text-stone-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Exit */}
      <div className="p-4 border-t border-pink-200/40 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-rose-950 hover:bg-pink-100/40 transition-colors"
        >
          <span>Back to Marketplace</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-100/60 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
