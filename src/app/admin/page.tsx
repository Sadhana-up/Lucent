"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Users,
  ShoppingBag,
  Package,
  ShieldCheck,
  UserCog,
  Store,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
};

type Stats = {
  users: {
    total: number;
    byRole: Record<string, number>;
    newLast7Days: number;
    unverifiedSellers: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    categories: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    newLast7Days: number;
    revenue: number;
    revenueExcludingCancelled: number;
  };
  reviews: { total: number };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    customer: { name: string; email: string };
  }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
};

export default function AdminDashboard() {
  const { data: session } = authClient.useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Active module tab
  const [tab, setTab] = useState<"overview" | "sellers" | "users" | "categories">("overview");

  // Module data
  const [sellers, setSellers] = useState<any[]>([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3500);
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          setFailed(true);
          return;
        }
        setStats(await res.json());
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Fetch sellers when sellers tab is active
  useEffect(() => {
    if (tab === "sellers") {
      setSellersLoading(true);
      fetch("/api/admin/sellers")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSellers(data);
        })
        .catch(console.error)
        .finally(() => setSellersLoading(false));
    }
  }, [tab]);

  // Fetch users when users tab is active
  useEffect(() => {
    if (tab === "users") {
      setUsersLoading(true);
      fetch(`/api/admin/users${userQuery ? `?search=${encodeURIComponent(userQuery)}` : ""}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(console.error)
        .finally(() => setUsersLoading(false));
    }
  }, [tab, userQuery]);

  // Fetch categories when categories tab is active
  useEffect(() => {
    if (tab === "categories") {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(console.error);
    }
  }, [tab]);

  // Toggle seller verification
  const handleVerifySeller = async (sellerId: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, isVerified: !current }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) => (s.id === sellerId ? { ...s, isVerified: !current } : s))
        );
        showNotification(!current ? "Apothecary verified successfully!" : "Verification revoked.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change user role
  const handleUpdateRole = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: targetRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
        );
        showNotification(`User role updated to ${targetRole}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle ban user
  const handleToggleBan = async (userId: string, banned: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          banned: !banned,
          banReason: !banned ? "Suspended by Administrator" : undefined,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, banned: !banned } : u))
        );
        showNotification(!banned ? "User account suspended." : "User ban lifted.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories((prev) => [...prev, newCat]);
        setCatName("");
        setCatDesc("");
        showNotification("Category added successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCatLoading(false);
    }
  };

  const metricCards = stats
    ? [
        { label: "Total Revenue", value: formatCurrency(stats.orders.revenue), icon: ShoppingBag, note: `${stats.orders.total} orders` },
        { label: "Total Users", value: stats.users.total.toString(), icon: Users, note: `+${stats.users.newLast7Days} this week` },
        { label: "Active Products", value: stats.products.active.toString(), icon: Package, note: `${stats.products.total} total` },
        { label: "Sellers", value: (stats.users.byRole.seller ?? 0).toString(), icon: Store, note: `${stats.users.unverifiedSellers} unverified` },
        { label: "Pending Orders", value: (stats.orders.byStatus.PENDING ?? 0).toString(), icon: ShieldCheck, note: `${stats.orders.newLast7Days} new this week` },
        { label: "Low Stock Items", value: stats.products.lowStock.toString(), icon: AlertTriangle, note: `${stats.products.categories} categories` },
        { label: "Reviews", value: stats.reviews.total.toString(), icon: Sparkles, note: "Across catalogue" },
        { label: "Admins", value: (stats.users.byRole.admin ?? 0).toString(), icon: UserCog, note: "Security operators" },
      ]
    : [];

  return (
    <div className="flex-1 p-6 sm:p-8" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: C.primaryGhost, color: C.primary }}>
                CONTROL SUITE
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mt-1" style={{ color: C.text }}>
              Operations & Platform Admin
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
              Signed in as {session?.user?.name || "Administrator"} ({session?.user?.email})
            </p>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "sellers", label: "Sellers", icon: Store },
              { id: "users", label: "Users", icon: Users },
              { id: "categories", label: "Categories", icon: Package },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: active ? C.primary : "transparent",
                    color: active ? "#FFFFFF" : C.textSecondary,
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 border animate-fade-in" style={{ background: C.successBg, borderColor: "#A7F3D0", color: C.primaryDark }}>
            <CheckCircle size={18} />
            <span className="text-sm font-medium">{feedback}</span>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: C.textMuted }}>Compiling real-time platform metrics…</p>
          </div>
        )}

        {!loading && failed && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <AlertTriangle className="mx-auto mb-3 text-amber-500" size={32} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>Admin privileges required or request failed.</p>
          </div>
        )}

        {!loading && !failed && stats && (
          <>
            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW & LIVE STREAM                             */}
            {/* ========================================================= */}
            {tab === "overview" && (
              <div className="space-y-8">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metricCards.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className="rounded-2xl p-5 border hover-lift transition-all duration-300"
                        style={{
                          background: "#FFFFFF",
                          borderColor: C.borderLight,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>
                            {metric.label}
                          </span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primaryGhost }}>
                            <Icon size={16} style={{ color: C.primary }} />
                          </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight" style={{ color: C.text }}>
                          {metric.value}
                        </div>
                        <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                          {metric.note}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Real-time Order & User Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="rounded-2xl p-6 border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-base" style={{ color: C.text }}>
                        Recent Customer Orders
                      </h3>
                      <span className="text-xs font-mono" style={{ color: C.textMuted }}>REALTIME</span>
                    </div>

                    <div className="space-y-3">
                      {stats.recentOrders?.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border"
                          style={{ background: C.bgWarm, borderColor: C.borderLight }}
                        >
                          <div>
                            <span className="text-xs font-mono font-bold" style={{ color: C.primary }}>
                              {order.orderNumber}
                            </span>
                            <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                              {order.customer?.name} ({order.customer?.email})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold" style={{ color: C.text }}>
                              {formatCurrency(order.totalAmount)}
                            </span>
                            <div className="mt-0.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase" style={{ background: order.status === "DELIVERED" ? C.successBg : C.warningBg, color: order.status === "DELIVERED" ? C.primaryDark : C.warning }}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Users */}
                  <div className="rounded-2xl p-6 border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-base" style={{ color: C.text }}>
                        Recent Registrations
                      </h3>
                      <span className="text-xs font-mono" style={{ color: C.textMuted }}>LUCENT ACCOUNTS</span>
                    </div>

                    <div className="space-y-3">
                      {stats.recentUsers?.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border"
                          style={{ background: C.bgWarm, borderColor: C.borderLight }}
                        >
                          <div>
                            <span className="text-sm font-semibold" style={{ color: C.text }}>
                              {u.name}
                            </span>
                            <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                              {u.email}
                            </p>
                          </div>
                          <div>
                            <span
                              className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full"
                              style={{
                                background: u.role === "admin" ? "#FEF3C7" : u.role === "seller" ? "#EDE9FE" : C.primaryGhost,
                                color: u.role === "admin" ? "#D97706" : u.role === "seller" ? C.accent : C.primary,
                              }}
                            >
                              {u.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: SELLER VERIFICATION QUEUE                          */}
            {/* ========================================================= */}
            {tab === "sellers" && (
              <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: C.text }}>
                      Apothecary Lab Verification Pipeline
                    </h3>
                    <p className="text-xs mt-1" style={{ color: C.textSecondary }}>
                      Review cosmetic artisan credentials, verify laboratory purity, or revoke badges.
                    </p>
                  </div>
                </div>

                {sellersLoading ? (
                  <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Loading stores…</div>
                ) : sellers.length === 0 ? (
                  <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>No seller profiles found.</div>
                ) : (
                  <div className="space-y-4">
                    {sellers.map((seller) => (
                      <div
                        key={seller.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border"
                        style={{ background: C.bgWarm, borderColor: C.borderLight }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-serif text-lg font-bold text-white shrink-0" style={{ background: C.primary }}>
                            {seller.storeName?.[0]?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base" style={{ color: C.text }}>
                                {seller.storeName}
                              </span>
                              {seller.isVerified ? (
                                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold" style={{ background: C.successBg, color: C.primaryDark }}>
                                  <CheckCircle size={11} /> VERIFIED
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold" style={{ background: C.warningBg, color: C.warning }}>
                                  <Clock size={11} /> UNVERIFIED
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-1" style={{ color: C.textSecondary }}>
                              Owner: {seller.user?.name} ({seller.user?.email}) · {seller._count?.products || 0} formulations
                            </p>
                            {seller.bio && (
                              <p className="text-xs mt-1.5 line-clamp-1 italic" style={{ color: C.textMuted }}>
                                &ldquo;{seller.bio}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant={seller.isVerified ? "outline" : "default"}
                            size="sm"
                            className="rounded-xl font-semibold text-xs"
                            onClick={() => handleVerifySeller(seller.id, seller.isVerified)}
                            style={seller.isVerified ? { borderColor: C.danger, color: C.danger } : { background: C.primary }}
                          >
                            {seller.isVerified ? "Revoke Verification" : "Grant Verified Badge"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: USER DIRECTORY & ROLE MANAGEMENT                   */}
            {/* ========================================================= */}
            {tab === "users" && (
              <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: C.text }}>
                      Member Directory & Access Control
                    </h3>
                    <p className="text-xs mt-1" style={{ color: C.textSecondary }}>
                      Manage role hierarchy, assign permissions, or suspend accounts.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: C.textMuted }} />
                    <input
                      type="text"
                      placeholder="Search member name or email…"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none transition-all"
                      style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                    />
                  </div>
                </div>

                {usersLoading ? (
                  <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Loading directory…</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: C.borderLight, color: C.textMuted }}>
                          <th className="pb-3 font-semibold uppercase tracking-wider">Member</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider">Role</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider">Store</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider">Activity</th>
                          <th className="pb-3 font-semibold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: C.borderLight }}>
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-[rgba(45,90,61,0.02)] transition-colors">
                            <td className="py-3.5 pr-4">
                              <span className="font-semibold" style={{ color: C.text }}>{u.name}</span>
                              <p className="text-[11px]" style={{ color: C.textMuted }}>{u.email}</p>
                            </td>
                            <td className="py-3.5 pr-4">
                              <span
                                className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                                style={{
                                  background: u.role === "admin" ? "#FEF3C7" : u.role === "seller" ? "#EDE9FE" : C.primaryGhost,
                                  color: u.role === "admin" ? "#D97706" : u.role === "seller" ? C.accent : C.primary,
                                }}
                              >
                                {u.role}
                              </span>
                              {u.banned && (
                                <span className="ml-1.5 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: C.dangerBg, color: C.danger }}>
                                  BANNED
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4" style={{ color: C.textSecondary }}>
                              {u.sellerProfile?.storeName || "—"}
                            </td>
                            <td className="py-3.5 pr-4" style={{ color: C.textSecondary }}>
                              {u._count?.orders || 0} orders
                            </td>
                            <td className="py-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleUpdateRole(u.id, u.role === "admin" ? "customer" : "admin")}
                                className="px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors"
                                style={{ borderColor: C.border, color: C.text }}
                              >
                                {u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                              <button
                                onClick={() => handleToggleBan(u.id, !!u.banned)}
                                className="px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors"
                                style={{
                                  borderColor: u.banned ? C.primary : C.danger,
                                  color: u.banned ? C.primary : C.danger,
                                }}
                              >
                                {u.banned ? "Unban" : "Ban"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: CATEGORIES MANAGER                                 */}
            {/* ========================================================= */}
            {tab === "categories" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to create new category */}
                <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                  <h3 className="font-semibold text-base mb-2" style={{ color: C.text }}>
                    Add Skincare Category
                  </h3>
                  <p className="text-xs mb-4" style={{ color: C.textSecondary }}>
                    Define new categories for botanical formulators.
                  </p>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Eye Creams & Peptides"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none"
                        style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                        Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Formulations specifically targeting the delicate periorbital zone..."
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none"
                        style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={catLoading || !catName.trim()}
                      className="w-full rounded-xl text-xs font-semibold"
                      style={{ background: C.primary }}
                    >
                      <Plus size={14} className="mr-1.5" /> Create Category
                    </Button>
                  </form>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2 rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                  <h3 className="font-semibold text-base mb-4" style={{ color: C.text }}>
                    Active Skincare Categories ({categories.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-4 rounded-xl border" style={{ background: C.bgWarm, borderColor: C.borderLight }}>
                        <span className="font-semibold text-sm block" style={{ color: C.text }}>
                          {cat.name}
                        </span>
                        <span className="text-[11px] font-mono block mt-0.5" style={{ color: C.primary }}>
                          slug: {cat.slug}
                        </span>
                        {cat.description && (
                          <p className="text-xs mt-2 line-clamp-2" style={{ color: C.textSecondary }}>
                            {cat.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
