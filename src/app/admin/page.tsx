"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Search,
  Clock,
  Sparkles,
  Layers,
  RefreshCw,
  Eye,
  Ban,
  ArrowUpDown,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminOrderModal } from "@/components/admin-order-modal";

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  info: "#3B82F6",
  infoBg: "#EFF6FF",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = {
  users: { total: number; byRole: Record<string, number>; newInPeriod: number; unverifiedSellers: number };
  products: { total: number; active: number; lowStock: number; categories: number };
  orders: { total: number; byStatus: Record<string, number>; newInPeriod: number; revenue: number; revenueExcludingCancelled: number; pendingRefunds: number };
  reviews: { total: number };
  recentOrders: { id: string; orderNumber: string; status: string; totalAmount: number; paymentStatus: string; createdAt: string; customer: { name: string; email: string } }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
};

type TabId = "overview" | "users" | "sellers" | "orders" | "categories" | "audit";

// ─── Status badge colour helpers ──────────────────────────────────────────────
const orderStatusStyle = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    DELIVERED: { bg: C.successBg, color: C.primaryDark },
    SHIPPED: { bg: C.infoBg, color: C.info },
    PROCESSING: { bg: C.accentGhost, color: C.accent },
    CONFIRMED: { bg: C.primaryGhost, color: C.primary },
    PENDING: { bg: C.warningBg, color: C.warning },
    CANCELLED: { bg: C.dangerBg, color: C.danger },
    REFUNDED: { bg: "#F3F4F6", color: "#6B7280" },
    RETURN_REQUESTED: { bg: C.warningBg, color: C.warning },
  };
  return map[status] ?? { bg: "#F3F4F6", color: "#6B7280" };
};

const roleStyle = (role: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    admin: { bg: "#FEF3C7", color: "#D97706" },
    seller: { bg: "#EDE9FE", color: C.accent },
    customer: { bg: C.primaryGhost, color: C.primary },
  };
  return map[role] ?? { bg: "#F3F4F6", color: "#6B7280" };
};

// ─── Notification stack ───────────────────────────────────────────────────────
type Toast = { id: number; msg: string; type: "success" | "error" };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let _id = 0;
  const push = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, push };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabId | null;
  const { toasts, push: notify } = useToasts();

  // ── Global stats ──────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsFailed, setStatsFailed] = useState(false);

  // ── Active tab ────────────────────────────────────────────
  const [tab, setTab] = useState<TabId>((urlTab && ["overview", "users", "sellers", "orders", "categories", "audit"].includes(urlTab)) ? urlTab : "overview");

  useEffect(() => {
    if (urlTab && ["overview", "users", "sellers", "orders", "categories", "audit"].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [urlTab]);

  // ── Users ─────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // ── Sellers ───────────────────────────────────────────────
  const [sellers, setSellers] = useState<any[]>([]);
  const [sellersLoading, setSellersLoading] = useState(false);

  // ── Orders ────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [inspectingOrder, setInspectingOrder] = useState<any | null>(null);

  // ── Categories ────────────────────────────────────────────
  const [categories, setCategories] = useState<any[]>([]);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  // ── Audit logs ────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);

  // ═══════════════════════════════════════════════════════════
  //  Data fetching
  // ═══════════════════════════════════════════════════════════

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsFailed(false);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) { setStatsFailed(true); return; }
      setStats(await res.json());
    } catch {
      setStatsFailed(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Users
  useEffect(() => {
    if (tab !== "users") return;
    setUsersLoading(true);
    const params = new URLSearchParams({ page: String(userPage), limit: "20" });
    if (userQuery) params.set("search", userQuery);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setUserTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setUsersLoading(false));
  }, [tab, userQuery, userPage]);

  // Sellers
  useEffect(() => {
    if (tab !== "sellers") return;
    setSellersLoading(true);
    fetch("/api/admin/sellers?limit=50")
      .then((r) => r.json())
      .then((d) => setSellers(d.sellers ?? []))
      .catch(console.error)
      .finally(() => setSellersLoading(false));
  }, [tab]);

  // Orders
  useEffect(() => {
    if (tab !== "orders") return;
    setOrdersLoading(true);
    const params = new URLSearchParams({ page: String(orderPage), limit: "20" });
    if (orderStatus) params.set("status", orderStatus);
    if (orderSearch) params.set("search", orderSearch);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders ?? []); setOrderTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  }, [tab, orderStatus, orderSearch, orderPage]);

  // Categories
  useEffect(() => {
    if (tab !== "categories") return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : d.categories ?? []))
      .catch(console.error);
  }, [tab]);

  // Audit logs
  useEffect(() => {
    if (tab !== "audit") return;
    setAuditLoading(true);
    fetch("/api/admin/audit?limit=50")
      .then((r) => r.json())
      .then((d) => { setAuditLogs(d.logs ?? []); setAuditTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setAuditLoading(false));
  }, [tab]);

  // ═══════════════════════════════════════════════════════════
  //  Actions
  // ═══════════════════════════════════════════════════════════

  const handleVerifySeller = async (sellerId: string, current: boolean) => {
    const res = await fetch("/api/admin/sellers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, isVerified: !current }),
    });
    if (res.ok) {
      setSellers((prev) => prev.map((s) => s.id === sellerId ? { ...s, isVerified: !current } : s));
      notify(!current ? "Seller verified!" : "Verification revoked.");
    } else {
      notify("Action failed.", "error");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      notify(`Role updated to ${newRole}.`);
    } else {
      const d = await res.json().catch(() => ({}));
      notify(d.error ?? "Failed to update role.", "error");
    }
  };

  const handleToggleBan = async (userId: string, banned: boolean) => {
    const action = banned ? "unban" : "ban";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, banReason: !banned ? "Suspended by Administrator" : undefined }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned: !banned } : u));
      notify(!banned ? "User suspended." : "User ban lifted.");
    } else {
      notify("Action failed.", "error");
    }
  };

  /** Uses Better Auth adminClient for impersonation — sets session cookie client-side */
  const handleImpersonate = async (userId: string, userName: string) => {
    setImpersonating(userId);
    try {
      const { error } = await authClient.admin.impersonateUser({ userId });
      if (error) {
        notify(`Impersonation failed: ${error.message}`, "error");
        return;
      }
      notify(`Now impersonating ${userName}. Redirecting…`);
      setTimeout(() => { window.location.href = "/"; }, 1200);
    } catch (err) {
      notify("Impersonation failed.", "error");
    } finally {
      setImpersonating(null);
    }
  };

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
        setCatName(""); setCatDesc("");
        notify("Category created!");
      } else {
        notify("Failed to create category.", "error");
      }
    } finally {
      setCatLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  Metric cards
  // ═══════════════════════════════════════════════════════════
  const metricCards = stats ? [
    { label: "Net Revenue", value: formatCurrency(stats.orders.revenueExcludingCancelled), icon: TrendingUp, note: `${stats.orders.total} paid orders` },
    { label: "Total Users", value: stats.users.total.toString(), icon: Users, note: `+${stats.users.newInPeriod} this week` },
    { label: "Active Products", value: stats.products.active.toString(), icon: Package, note: `${stats.products.total} total · ${stats.products.lowStock} low stock` },
    { label: "Sellers", value: (stats.users.byRole.seller ?? 0).toString(), icon: Store, note: `${stats.users.unverifiedSellers} pending verification` },
    { label: "Pending Orders", value: (stats.orders.byStatus.PENDING ?? 0).toString(), icon: ShoppingBag, note: `${stats.orders.newInPeriod} new this week` },
    { label: "Pending Refunds", value: (stats.orders.pendingRefunds ?? 0).toString(), icon: Receipt, note: "Awaiting review" },
    { label: "Reviews", value: stats.reviews.total.toString(), icon: Sparkles, note: "Across catalogue" },
    { label: "Admins", value: (stats.users.byRole.admin ?? 0).toString(), icon: UserCog, note: "Security operators" },
  ] : [];

  // ═══════════════════════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════════════════════
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "users", label: "Users", icon: Users },
    { id: "sellers", label: "Sellers", icon: Store },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "categories", label: "Categories", icon: Package },
    { id: "audit", label: "Audit Log", icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 p-6 sm:p-8" style={{ background: C.bg, minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ background: C.primaryGhost, color: C.primary }}>
              CONTROL SUITE
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-2" style={{ color: C.text }}>
              Platform Admin
            </h1>
            <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
              Signed in as <strong>{session?.user?.name}</strong> · {session?.user?.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ borderColor: C.border, color: C.textSecondary, background: "#FFFFFF" }}
            >
              ← Marketplace Home
            </Link>
            <Link
              href="/shop"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ borderColor: C.border, color: C.textSecondary, background: "#FFFFFF" }}
            >
              Shop Formulations
            </Link>
            <Link
              href="/shops"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ borderColor: C.border, color: C.textSecondary, background: "#FFFFFF" }}
            >
              Artisan Apothecaries
            </Link>
            <button
              onClick={loadStats}
              disabled={statsLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ borderColor: C.border, color: C.textSecondary, background: "#FFFFFF" }}
            >
              <RefreshCw size={13} className={statsLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0"
                style={{ background: active ? C.primary : "transparent", color: active ? "#FFFFFF" : C.textSecondary }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Toast stack ── */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in pointer-events-auto"
                style={{
                  background: t.type === "error" ? C.dangerBg : C.successBg,
                  borderColor: t.type === "error" ? "#FCA5A5" : "#A7F3D0",
                  color: t.type === "error" ? C.danger : C.primaryDark,
                }}
              >
                {t.type === "error" ? <XCircle size={15} /> : <CheckCircle size={15} />}
                {t.msg}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: OVERVIEW
        ═══════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {statsLoading && (
              <div className="rounded-2xl p-12 text-center border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm" style={{ color: C.textMuted }}>Loading platform metrics…</p>
              </div>
            )}
            {!statsLoading && statsFailed && (
              <div className="rounded-2xl p-12 text-center border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                <AlertTriangle className="mx-auto mb-3 text-amber-500" size={32} />
                <p className="text-sm font-semibold" style={{ color: C.text }}>Failed to load stats. Check your session or server.</p>
              </div>
            )}
            {!statsLoading && stats && (
              <>
                {/* Metric cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {metricCards.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className="rounded-2xl p-5 border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>{m.label}</span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primaryGhost }}>
                            <Icon size={15} style={{ color: C.primary }} />
                          </div>
                        </div>
                        <div className="text-2xl font-bold" style={{ color: C.text }}>{m.value}</div>
                        <p className="text-xs mt-1" style={{ color: C.textMuted }}>{m.note}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Order status breakdown */}
                <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                  <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Order Status Breakdown</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(stats.orders.byStatus).map(([status, count]) => {
                      const style = orderStatusStyle(status);
                      return (
                        <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold" style={{ background: style.bg, borderColor: style.bg, color: style.color }}>
                          <span className="font-mono">{status}</span>
                          <span className="font-bold">{count as number}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent orders + users */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border p-5" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                    <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Recent Orders</h3>
                    <div className="space-y-2.5">
                      {stats.recentOrders.map((o) => {
                        const s = orderStatusStyle(o.status);
                        return (
                          <div
                            key={o.id}
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/orders/${o.id}`);
                                if (res.ok) {
                                  const full = await res.json();
                                  setInspectingOrder(full);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:border-[#2D5A3D]/40 transition-colors"
                            style={{ background: C.bgWarm, borderColor: C.borderLight }}
                          >
                            <div>
                              <span className="text-xs font-mono font-bold" style={{ color: C.primary }}>{o.orderNumber}</span>
                              <p className="text-[11px] mt-0.5" style={{ color: C.textSecondary }}>{o.customer?.name}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold" style={{ color: C.text }}>{formatCurrency(o.totalAmount)}</span>
                              <div className="mt-0.5">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: s.bg, color: s.color }}>{o.status}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border p-5" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                    <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Recent Registrations</h3>
                    <div className="space-y-2.5">
                      {stats.recentUsers.map((u) => {
                        const rs = roleStyle(u.role);
                        return (
                          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ background: C.bgWarm, borderColor: C.borderLight }}>
                            <div>
                              <span className="text-sm font-semibold" style={{ color: C.text }}>{u.name}</span>
                              <p className="text-[11px]" style={{ color: C.textSecondary }}>{u.email}</p>
                            </div>
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full" style={{ background: rs.bg, color: rs.color }}>{u.role}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: USERS + IMPERSONATION
        ═══════════════════════════════════════════════════ */}
        {tab === "users" && (
          <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ color: C.text }}>Member Directory</h3>
                <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                  {userTotal} users total · manage roles, bans, and impersonation
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: C.textMuted }} />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={userQuery}
                  onChange={(e) => { setUserQuery(e.target.value); setUserPage(1); }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none"
                  style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Loading…</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: C.borderLight }}>
                      {["User", "Role", "Store", "Orders", "Actions"].map((h) => (
                        <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]" style={{ color: C.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const rs = roleStyle(u.role);
                      const isSelf = u.id === session?.user?.id;
                      return (
                        <tr key={u.id} className="border-b hover:bg-[rgba(45,90,61,0.02)] transition-colors" style={{ borderColor: C.borderLight }}>
                          {/* User */}
                          <td className="py-3.5 pr-4">
                            <span className="font-semibold block" style={{ color: C.text }}>{u.name}</span>
                            <span className="block" style={{ color: C.textMuted }}>{u.email}</span>
                            {u.banned && (
                              <span className="inline-block mt-0.5 text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: C.dangerBg, color: C.danger }}>BANNED</span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 pr-4">
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: rs.bg, color: rs.color }}>{u.role}</span>
                          </td>

                          {/* Seller store */}
                          <td className="py-3.5 pr-4" style={{ color: C.textSecondary }}>
                            {u.sellerProfile?.storeName ?? "—"}
                          </td>

                          {/* Order count */}
                          <td className="py-3.5 pr-4" style={{ color: C.textSecondary }}>
                            {u._count?.orders ?? 0}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Impersonate */}
                              {!isSelf && u.role !== "admin" && (
                                <button
                                  onClick={() => handleImpersonate(u.id, u.name)}
                                  disabled={impersonating === u.id}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors disabled:opacity-50"
                                  style={{ borderColor: C.accent, color: C.accent }}
                                  title="Impersonate — view the app as this user"
                                >
                                  <Eye size={11} />
                                  {impersonating === u.id ? "Starting…" : "Impersonate"}
                                </button>
                              )}

                              {/* Role toggle */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleUpdateRole(u.id, u.role === "admin" ? "customer" : "admin")}
                                  className="px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors"
                                  style={{ borderColor: C.border, color: C.text }}
                                >
                                  {u.role === "admin" ? "Demote" : "Make Admin"}
                                </button>
                              )}

                              {/* Ban toggle */}
                              {!isSelf && (
                                <button
                                  onClick={() => handleToggleBan(u.id, !!u.banned)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-colors"
                                  style={{ borderColor: u.banned ? C.primary : C.danger, color: u.banned ? C.primary : C.danger }}
                                >
                                  <Ban size={11} />
                                  {u.banned ? "Unban" : "Ban"}
                                </button>
                              )}

                              {isSelf && <span className="text-[11px]" style={{ color: C.textMuted }}>You</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {userTotal > 20 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs" style={{ borderColor: C.borderLight, color: C.textSecondary }}>
                    <span>Showing {(userPage - 1) * 20 + 1}–{Math.min(userPage * 20, userTotal)} of {userTotal}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1} className="px-3 py-1 rounded-lg border disabled:opacity-40" style={{ borderColor: C.border }}>Prev</button>
                      <button onClick={() => setUserPage((p) => p + 1)} disabled={userPage * 20 >= userTotal} className="px-3 py-1 rounded-lg border disabled:opacity-40" style={{ borderColor: C.border }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: SELLERS
        ═══════════════════════════════════════════════════ */}
        {tab === "sellers" && (
          <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <div className="mb-5">
              <h3 className="text-base font-semibold" style={{ color: C.text }}>Seller Verification Pipeline</h3>
              <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>Review and approve seller accounts.</p>
            </div>

            {sellersLoading ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Loading…</div>
            ) : sellers.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>No seller profiles found.</div>
            ) : (
              <div className="space-y-3">
                {sellers.map((seller) => (
                  <div key={seller.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border" style={{ background: C.bgWarm, borderColor: C.borderLight }}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 text-sm" style={{ background: C.primary }}>
                        {seller.storeName?.[0]?.toUpperCase() ?? "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: C.text }}>{seller.storeName}</span>
                          {seller.isVerified ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: C.successBg, color: C.primaryDark }}>
                              <CheckCircle size={10} /> VERIFIED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: C.warningBg, color: C.warning }}>
                              <Clock size={10} /> PENDING
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                          {seller.user?.name} · {seller.user?.email} · {seller._count?.products ?? 0} products
                        </p>
                        {seller.bio && (
                          <p className="text-xs mt-1 italic line-clamp-1" style={{ color: C.textMuted }}>&ldquo;{seller.bio}&rdquo;</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Impersonate as seller */}
                      {seller.user?.id && (
                        <button
                          onClick={() => handleImpersonate(seller.user.id, seller.user.name)}
                          disabled={impersonating === seller.user.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors"
                          style={{ borderColor: C.accent, color: C.accent }}
                        >
                          <Eye size={12} />
                          Impersonate
                        </button>
                      )}
                      <button
                        onClick={() => handleVerifySeller(seller.id, seller.isVerified)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border"
                        style={seller.isVerified ? { borderColor: C.danger, color: C.danger } : { background: C.primary, color: "#fff", borderColor: C.primary }}
                      >
                        {seller.isVerified ? "Revoke" : "Verify"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: ORDERS
        ═══════════════════════════════════════════════════ */}
        {tab === "orders" && (
          <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ color: C.text }}>Order Management</h3>
                <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>{orderTotal} orders total · click any order to inspect items and update fulfillment</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search order #, customer..."
                    value={orderSearch}
                    onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
                    className="pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none w-44 sm:w-56 bg-white"
                    style={{ borderColor: C.border, color: C.text }}
                  />
                </div>
                <select
                  value={orderStatus}
                  onChange={(e) => { setOrderStatus(e.target.value); setOrderPage(1); }}
                  className="px-3 py-1.5 rounded-xl border text-xs outline-none bg-white font-medium"
                  style={{ borderColor: C.border, color: C.text }}
                >
                  <option value="">All statuses</option>
                  {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {ordersLoading ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: C.borderLight }}>
                      {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date", "Action"].map((h) => (
                        <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]" style={{ color: C.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const ss = orderStatusStyle(o.status);
                      const ps = o.paymentStatus === "PAID"
                        ? { bg: C.successBg, color: C.primaryDark }
                        : o.paymentStatus === "FAILED"
                          ? { bg: C.dangerBg, color: C.danger }
                          : { bg: C.warningBg, color: C.warning };
                      return (
                        <tr
                          key={o.id}
                          onClick={() => setInspectingOrder(o)}
                          className="border-b hover:bg-[rgba(45,90,61,0.03)] transition-colors cursor-pointer"
                          style={{ borderColor: C.borderLight }}
                        >
                          <td className="py-3 pr-4 font-mono font-bold" style={{ color: C.primary }}>{o.orderNumber}</td>
                          <td className="py-3 pr-4">
                            <span className="font-medium block" style={{ color: C.text }}>{o.customer?.name}</span>
                            <span style={{ color: C.textMuted }}>{o.customer?.email}</span>
                          </td>
                          <td className="py-3 pr-4" style={{ color: C.textSecondary }}>{o.items?.length ?? 0} item{o.items?.length !== 1 ? "s" : ""}</td>
                          <td className="py-3 pr-4 font-semibold" style={{ color: C.text }}>{formatCurrency(Number(o.totalAmount))}</td>
                          <td className="py-3 pr-4">
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.color }}>{o.paymentStatus}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{o.status}</span>
                          </td>
                          <td className="py-3 pr-4" style={{ color: C.textMuted }}>
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingOrder(o);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#2D5A3D]/10 text-[#2D5A3D] hover:bg-[#2D5A3D] hover:text-white transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {orderTotal > 20 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs" style={{ borderColor: C.borderLight, color: C.textSecondary }}>
                    <span>Showing {(orderPage - 1) * 20 + 1}–{Math.min(orderPage * 20, orderTotal)} of {orderTotal}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setOrderPage((p) => Math.max(1, p - 1))} disabled={orderPage === 1} className="px-3 py-1 rounded-lg border disabled:opacity-40" style={{ borderColor: C.border }}>Prev</button>
                      <button onClick={() => setOrderPage((p) => p + 1)} disabled={orderPage * 20 >= orderTotal} className="px-3 py-1 rounded-lg border disabled:opacity-40" style={{ borderColor: C.border }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: CATEGORIES
        ═══════════════════════════════════════════════════ */}
        {tab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
              <h3 className="font-semibold text-sm mb-1" style={{ color: C.text }}>Add Category</h3>
              <p className="text-xs mb-4" style={{ color: C.textSecondary }}>Create a new product category.</p>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Name *</label>
                  <input
                    type="text" required placeholder="e.g. Eye Creams"
                    value={catName} onChange={(e) => setCatName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none"
                    style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Description</label>
                  <textarea
                    rows={3} placeholder="Optional description…"
                    value={catDesc} onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none"
                    style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                  />
                </div>
                <Button type="submit" disabled={catLoading || !catName.trim()} className="w-full rounded-xl text-xs font-semibold" style={{ background: C.primary }}>
                  {catLoading ? "Creating…" : "Create Category"}
                </Button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
              <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>All Categories ({categories.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-xl border" style={{ background: C.bgWarm, borderColor: C.borderLight }}>
                    <span className="font-semibold text-sm block" style={{ color: C.text }}>{cat.name}</span>
                    <span className="text-[11px] font-mono block mt-0.5" style={{ color: C.primary }}>/{cat.slug}</span>
                    {cat.description && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: C.textSecondary }}>{cat.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: AUDIT LOG
        ═══════════════════════════════════════════════════ */}
        {tab === "audit" && (
          <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ color: C.text }}>Audit Trail</h3>
                <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>Immutable log of all admin actions · {auditTotal} records</p>
              </div>
              <ShieldCheck className="w-5 h-5" style={{ color: C.primary }} />
            </div>

            {auditLoading ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Loading audit records…</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>No audit actions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: C.borderLight }}>
                      {["Actor", "Action", "Target", "Details", "Timestamp"].map((h) => (
                        <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[11px]" style={{ color: C.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => {
                      const isImpersonate = log.action?.includes("impersonate");
                      return (
                        <tr key={log.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: C.borderLight }}>
                          <td className="py-3 pr-4">
                            <span className="font-semibold block" style={{ color: C.text }}>{log.actor?.name ?? "System"}</span>
                            <span style={{ color: C.textMuted }}>{log.actor?.email}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                              style={isImpersonate
                                ? { background: "#EDE9FE", color: C.accent, borderColor: "#DDD6FE" }
                                : { background: C.successBg, color: "#065F46", borderColor: "#A7F3D0" }
                              }
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-mono" style={{ color: C.textSecondary }}>{log.target}</td>
                          <td className="py-3 pr-4" style={{ color: C.textMuted }}>
                            {log.metadata ? (
                              <span className="font-mono text-[10px]">{JSON.stringify(log.metadata)}</span>
                            ) : "—"}
                          </td>
                          <td className="py-3 font-mono" style={{ color: C.textMuted }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Order Details & Fulfillment Modal */}
        {inspectingOrder && (
          <AdminOrderModal
            order={inspectingOrder}
            onClose={() => setInspectingOrder(null)}
            onOrderUpdated={(updated) => {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              setInspectingOrder(updated);
            }}
          />
        )}

      </div>
    </div>
  );
}
