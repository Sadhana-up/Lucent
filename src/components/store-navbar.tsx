"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Package,
  MapPin,
  Sparkles,
  Store,
  ShieldCheck,
  Menu,
  X,
  Search,
  CheckCircle2,
  Heart,
  SlidersHorizontal,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.08)",
  accent: "#7C6BEA",
  bg: "#FAF6F0",
  bgWarm: "#F5EFEB",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#8C8C85",
  border: "#EAE2D9",
  borderLight: "#F4EFE7",
};

interface StoreNavbarProps {
  className?: string;
  transparentOnTop?: boolean;
}

export function StoreNavbar({ className = "", transparentOnTop = false }: StoreNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync cart count — always server-side when logged in; zero when logged out
  useEffect(() => {
    if (isPending) return;

    const fetchCartCount = async () => {
      if (session?.user) {
        // Authenticated: strictly use server cart
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            const count = (data.items ?? []).reduce(
              (acc: number, item: { quantity?: number }) => acc + (item.quantity || 1),
              0
            );
            setCartCount(count);
          } else {
            setCartCount(0);
          }
        } catch {
          setCartCount(0);
        }
        return;
      }

      // Explicitly logged out: cart is strictly 0 and clear any stale localStorage
      try {
        localStorage.removeItem("lucent_cart");
      } catch {}
      setCartCount(0);
    };

    fetchCartCount();

    const handleStorage = () => fetchCartCount();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart-updated", handleStorage);
    window.addEventListener("focus", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart-updated", handleStorage);
      window.removeEventListener("focus", handleStorage);
    };
  }, [session?.user, isPending]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close menus on path change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setCartCount(0);
    try { localStorage.removeItem("lucent_cart"); } catch {}
    try {
      await authClient.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    router.push("/sign-in");
    router.refresh();
  };

  const userRole = (session?.user as { role?: string })?.role;
  const isSeller = userRole === "seller";
  const isAdmin = userRole === "admin";

  const navLinks = [
    { label: "Shop Formulations", href: "/shop" },
    { label: "Artisan Apothecaries", href: "/shops" },
    { label: "AI Skin Consult", href: "/chat" },
    { label: "Routine Builder", href: "/shop/routine" },
  ];

  const headerBg =
    transparentOnTop && !scrolled
      ? "rgba(250, 246, 240, 0.4)"
      : "rgba(250, 246, 240, 0.94)";

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${className}`}
      style={{
        background: headerBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${scrolled ? C.border : "rgba(234, 226, 217, 0.5)"}`,
        boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.03)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/logo.jpeg"
              alt="Lucent Logo"
              className="h-9 w-9 object-cover rounded-xl border border-[rgba(45,90,61,0.15)] shadow-xs transition-transform duration-300 group-hover:scale-105"
            />
            <span
              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ background: C.primary }}
            />
          </div>
          <div className="flex flex-col">
            <span
              className="font-serif text-xl sm:text-2xl font-bold tracking-tight leading-none"
              style={{ color: C.primary }}
            >
              Lucent
            </span>
            <span
              className="text-[9px] uppercase tracking-widest font-semibold mt-0.5"
              style={{ color: C.textMuted }}
            >
              Botanical Dermatology
            </span>
          </div>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 bg-white/70 px-3 py-1.5 rounded-full border border-[#EAE2D9] shadow-xs">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href.startsWith("/#")
                ? false
                : pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs lg:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? "text-white font-semibold shadow-xs"
                    : "text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#FAF6F0]"
                }`}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #2D5A3D, #3D7A52)",
                      }
                    : {}
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right action group */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick search button */}
          <Link
            href="/shop"
            title="Search formulations"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-[#5A5F6B] hover:text-[#2D5A3D] hover:bg-[#FAF6F0] border border-transparent hover:border-[#EAE2D9]"
          >
            <Search size={16} />
          </Link>

          {/* Cart Icon with reactive counter badge */}
          <Link
            href="/shop/cart"
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all text-[#2D5A3D] bg-white hover:bg-[#FAF6F0] border border-[#EAE2D9] shadow-xs hover:border-[#2D5A3D]/40"
            title="View Cart"
          >
            <ShoppingBag size={16} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-xs animate-scale-in"
                style={{ background: "#2D5A3D" }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* User Account / Sign In State */}
          {session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all duration-200 ${
                  dropdownOpen
                    ? "border-[#2D5A3D] bg-white shadow-sm ring-2 ring-[#2D5A3D]/10"
                    : "border-[#EAE2D9] bg-white/90 hover:bg-white hover:border-[#2D5A3D]/30"
                }`}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-[#2D5A3D]/30"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
                  >
                    {session.user.name?.[0]?.toUpperCase() || <User size={13} />}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#1A1D21] max-w-[85px] sm:max-w-[120px] truncate hidden sm:inline-block">
                  {session.user.name?.split(" ")[0] || "Account"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-[#8C8C85] transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180 text-[#2D5A3D]" : ""
                  }`}
                />
              </button>

              {/* Floating Luxury Account Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#EAE2D9] py-2 z-50 animate-scale-in overflow-hidden"
                  style={{
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* User Profile Header Card */}
                  <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#EAE2D9]/80 flex items-center gap-3">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-xs shrink-0"
                        style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
                      >
                        {session.user.name?.[0]?.toUpperCase() || <User size={16} />}
                      </div>
                    )}
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#1A1D21] truncate">
                          {session.user.name || "Lucent Member"}
                        </p>
                      </div>
                      <p className="text-[11px] text-[#8C8C85] truncate">{session.user.email}</p>
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1"
                        style={{
                          background: isAdmin
                            ? "rgba(124, 107, 234, 0.12)"
                            : isSeller
                            ? "rgba(217, 119, 6, 0.12)"
                            : "rgba(45, 90, 61, 0.1)",
                          color: isAdmin ? "#6352CA" : isSeller ? "#B45309" : "#2D5A3D",
                        }}
                      >
                        {isAdmin ? (
                          <>
                            <ShieldCheck size={10} /> Platform Admin
                          </>
                        ) : isSeller ? (
                          <>
                            <Store size={10} /> Verified Artisan
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={10} /> Verified Buyer
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Role-Specific Workspaces & Controls */}
                  {isAdmin && (
                    <div className="px-2 py-1.5 border-b border-[#EAE2D9]/60">
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8C8C85]">
                        Admin Workspace
                      </p>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                      >
                        <ShieldCheck size={14} className="text-[#7C6BEA]" />
                        <span>Admin Control Center</span>
                      </Link>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                      >
                        <ShoppingBag size={14} className="text-[#2D5A3D]" />
                        <span>Orders Management</span>
                      </Link>
                    </div>
                  )}

                  {isSeller && (
                    <div className="px-2 py-1.5 border-b border-[#EAE2D9]/60">
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8C8C85]">
                        Seller Workspace
                      </p>
                      <Link
                        href="/seller/dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-[#2D5A3D]" />
                        <span>Seller Hub</span>
                      </Link>
                      <Link
                        href="/seller/products"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                      >
                        <Package size={14} className="text-[#2D5A3D]" />
                        <span>My Formulations</span>
                      </Link>
                      <Link
                        href="/seller/orders"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                      >
                        <ShoppingBag size={14} className="text-[#2D5A3D]" />
                        <span>Customer Orders</span>
                      </Link>
                    </div>
                  )}

                  {/* Standard Buyer Links */}
                  <div className="px-2 py-1.5">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8C8C85]">
                      Account & Orders
                    </p>
                    <Link
                      href="/shop/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                    >
                      <LayoutDashboard size={14} className="text-[#5A5F6B]" />
                      <span>Buyer Dashboard</span>
                    </Link>
                    <Link
                      href="/shop/orders"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                    >
                      <Package size={14} className="text-[#5A5F6B]" />
                      <span>Orders & Tracking</span>
                    </Link>
                    <Link
                      href="/shop/wishlist"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                    >
                      <Heart size={14} className="text-[#5A5F6B]" />
                      <span>Wishlist</span>
                    </Link>
                    <Link
                      href="/shop/account"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                    >
                      <MapPin size={14} className="text-[#5A5F6B]" />
                      <span>Saved Addresses & Profile</span>
                    </Link>
                    <Link
                      href="/chat"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                    >
                      <Sparkles size={14} className="text-[#7C6BEA]" />
                      <span>Skin Diagnostic & Routine</span>
                    </Link>
                    <Link
                      href="/shop/routine"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#1A1D21] rounded-xl hover:bg-[#FAF6F0] hover:text-[#2D5A3D] transition-colors"
                    >
                      <SlidersHorizontal size={14} className="text-[#5A5F6B]" />
                      <span>Daily Routine Builder</span>
                    </Link>
                  </div>

                  {/* DIRECT LOGOUT BUTTON */}
                  <div className="px-2 pt-1 border-t border-[#EAE2D9]/80 mt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={14} className="text-rose-600" />
                      <span>Log Out of Lucent</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="text-xs font-semibold text-[#5A5F6B] hover:text-[#2D5A3D] px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-xs font-semibold text-white px-3.5 py-2 rounded-xl shadow-xs transition-all hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
              >
                Join Lucent
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-white border border-[#EAE2D9]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF6F0] border-b border-[#EAE2D9] px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? "bg-[#2D5A3D] text-white"
                    : "text-[#1A1D21] hover:bg-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {session?.user && (
            <div className="pt-3 border-t border-[#EAE2D9] space-y-2">
              <div className="px-3 py-2 bg-white rounded-xl border border-[#EAE2D9] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1A1D21]">{session.user.name}</p>
                  <p className="text-[10px] text-[#8C8C85]">{session.user.email}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                  {userRole || "Customer"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/shop/dashboard"
                  className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-center border border-[#EAE2D9]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/shop/orders"
                  className="px-3 py-2 bg-white rounded-xl text-xs font-medium text-center border border-[#EAE2D9]"
                >
                  My Orders
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="col-span-2 px-3 py-2 bg-indigo-50 text-indigo-900 rounded-xl text-xs font-semibold text-center border border-indigo-200"
                  >
                    Admin Control Center
                  </Link>
                )}
                {isSeller && (
                  <Link
                    href="/seller/dashboard"
                    className="col-span-2 px-3 py-2 bg-amber-50 text-amber-900 rounded-xl text-xs font-semibold text-center border border-amber-200"
                  >
                    Seller Portal
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full mt-2 py-2.5 px-4 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
