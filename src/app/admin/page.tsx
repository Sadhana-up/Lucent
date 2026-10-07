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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

  const metricCards = stats
    ? [
        { label: "Total Revenue", value: formatCurrency(stats.orders.revenue), icon: ShoppingBag, note: `${stats.orders.total} orders` },
        { label: "Total Users", value: stats.users.total.toString(), icon: Users, note: `+${stats.users.newLast7Days} this week` },
        { label: "Active Products", value: stats.products.active.toString(), icon: Package, note: `${stats.products.total} total` },
        { label: "Sellers", value: (stats.users.byRole.seller ?? 0).toString(), icon: Store, note: `${stats.users.unverifiedSellers} unverified` },
        { label: "Pending Orders", value: (stats.orders.byStatus.PENDING ?? 0).toString(), icon: ShieldCheck, note: `${stats.orders.newLast7Days} new this week` },
        { label: "Low Stock Items", value: stats.products.lowStock.toString(), icon: AlertTriangle, note: `${stats.products.categories} categories` },
        { label: "Admins", value: (stats.users.byRole.admin ?? 0).toString(), icon: UserCog, note: `${stats.reviews.total} reviews` },
      ]
    : [];

  return (
    <div className="flex-1 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
            Welcome back, {session?.user?.name || "Admin"}
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${C.borderLight}` }}>
            <p className="text-sm" style={{ color: C.textMuted }}>Loading platform stats…</p>
          </div>
        )}

        {!loading && failed && (
          <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${C.borderLight}` }}>
            <p className="text-sm" style={{ color: C.textSecondary }}>
              You don&apos;t have access to admin stats, or the request failed.
            </p>
          </div>
        )}

        {!loading && !failed && stats && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metricCards.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-2xl p-5 hover-lift animate-fade-in-up opacity-0"
                    style={{
                      background: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(16px) saturate(180%)",
                      WebkitBackdropFilter: "blur(16px) saturate(180%)",
                      border: `1px solid ${C.borderLight}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                        {metric.label}
                      </span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primaryGhost }}>
                        <Icon size={14} style={{ color: C.primary }} />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
                      {metric.value}
                    </p>
                    {metric.note && (
                      <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                        {metric.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Order status breakdown */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: "rgba(255,255,255,0.72)",
                border: `1px solid ${C.borderLight}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
              }}
            >
              <h3 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Orders by Status</h3>
              <div className="flex flex-wrap gap-3">
                {Object.keys(stats.orders.byStatus).length === 0 ? (
                  <p className="text-sm" style={{ color: C.textMuted }}>No orders yet</p>
                ) : (
                  Object.entries(stats.orders.byStatus).map(([status, count]) => (
                    <span
                      key={status}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{
                        background: status === "DELIVERED" ? C.primaryGhost : C.accentGhost,
                        color: status === "DELIVERED" ? C.primary : C.accent,
                      }}
                    >
                      {status}: {count}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: `1px solid ${C.borderLight}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
                }}
              >
                <div className="p-5" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <h3 className="text-sm font-semibold" style={{ color: C.text }}>Recent Orders</h3>
                </div>
                <div className="p-5">
                  {stats.recentOrders.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: C.textMuted }}>No orders yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-xl transition-colors duration-200 hover:bg-[rgba(45,90,61,0.04)]">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: C.text }}>
                              {order.orderNumber}
                            </p>
                            <p className="text-xs truncate" style={{ color: C.textMuted }}>
                              {order.customer?.name} · {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-sm font-semibold" style={{ color: C.text }}>
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                background: order.status === "DELIVERED" ? C.primaryGhost : C.accentGhost,
                                color: order.status === "DELIVERED" ? C.primary : C.accent,
                              }}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: `1px solid ${C.borderLight}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
                }}
              >
                <div className="p-5" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <h3 className="text-sm font-semibold" style={{ color: C.text }}>Recent Users</h3>
                </div>
                <div className="p-5">
                  {stats.recentUsers.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: C.textMuted }}>No users yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl transition-colors duration-200">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{user.name}</p>
                            <p className="text-xs truncate" style={{ color: C.textMuted }}>{user.email}</p>
                          </div>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-3"
                            style={{
                              background: user.role === "admin" ? C.accentGhost : C.primaryGhost,
                              color: user.role === "admin" ? C.accent : C.primary,
                            }}
                          >
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
