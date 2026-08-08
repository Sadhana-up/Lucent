"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  PlusCircle,
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

export default function SellerDashboard() {
  const { data: session } = authClient.useSession();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch("/api/seller/orders"),
          fetch("/api/seller/products"),
        ]);

        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setRecentOrders(orders.slice(0, 5));
          const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
          setStats((prev) => ({ ...prev, revenue: totalRevenue, orders: orders.length }));
        }

        if (productsRes.ok) {
          const prods = await productsRes.json();
          setProducts(prods.slice(0, 5));
          setStats((prev) => ({ ...prev, products: prods.length }));
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const hasStoreName = (session?.user as any)?.name;

  if (!hasStoreName && !loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: C.primaryGhost }}>
            <LayoutDashboard size={32} style={{ color: C.primary }} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: C.text }}>
            Welcome to your Seller Hub
          </h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: C.textSecondary }}>
            Set up your store profile to start selling skincare products on the Lucent marketplace.
          </p>
          <Link href="/seller/profile">
            <Button className="rounded-xl magnetic-btn" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}>
              Set Up Store <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, change: "+12%" },
    { label: "Total Orders", value: stats.orders.toString(), icon: ShoppingBag, change: "+5%" },
    { label: "Active Products", value: stats.products.toString(), icon: Package, change: "" },
    { label: "Store Status", value: "Active", icon: TrendingUp, change: "" },
  ];

  return (
    <div className="flex-1 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
            Welcome back, {session?.user?.name || "Seller"}
          </p>
        </div>

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
                {metric.change && (
                  <p className="text-xs mt-1" style={{ color: C.primary }}>
                    {metric.change} this month
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: `1px solid ${C.borderLight}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
            }}
          >
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <h3 className="text-sm font-semibold" style={{ color: C.text }}>Recent Orders</h3>
              <Link href="/seller/orders" className="text-xs font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
                View all
              </Link>
            </div>
            <div className="p-5">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: C.textMuted }}>No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl transition-colors duration-200 hover:bg-[rgba(45,90,61,0.04)]">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>
                          {order.orderNumber || order.id?.slice(0, 8)}
                        </p>
                        <p className="text-xs" style={{ color: C.textMuted }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: C.text }}>
                          {formatCurrency(order.total ?? 0)}
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

          {/* Products */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: `1px solid ${C.borderLight}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
            }}
          >
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <h3 className="text-sm font-semibold" style={{ color: C.text }}>Products</h3>
              <Link href="/seller/products/new" className="text-xs font-semibold flex items-center gap-1 transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
                <PlusCircle size={12} /> Add new
              </Link>
            </div>
            <div className="p-5">
              {products.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm mb-3" style={{ color: C.textMuted }}>No products yet</p>
                  <Link href="/seller/products/new">
                    <Button variant="outline" size="sm" className="rounded-xl" style={{ borderColor: C.border, color: C.textSecondary }}>
                      Add your first product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-xl transition-colors duration-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: C.bgWarm }}>
                          {product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{product.title}</p>
                          <p className="text-xs" style={{ color: C.textMuted }}>{formatCurrency(product.price ?? 0)}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{
                          background: product.status === "ACTIVE" ? C.primaryGhost : C.accentGhost,
                          color: product.status === "ACTIVE" ? C.primary : C.accent,
                        }}
                      >
                        {product.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
