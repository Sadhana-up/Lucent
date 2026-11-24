"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Leaf,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  PENDING: { icon: Clock, color: "#F59E0B", label: "Pending" },
  CONFIRMED: { icon: CheckCircle, color: "#3B82F6", label: "Confirmed" },
  PROCESSING: { icon: Package, color: "#2D5A3D", label: "Processing" },
  SHIPPED: { icon: Truck, color: "#8B5CF6", label: "Shipped" },
  DELIVERED: { icon: CheckCircle, color: C.primary, label: "Delivered" },
  CANCELLED: { icon: XCircle, color: "#b54a4a", label: "Cancelled" },
  RETURN_REQUESTED: { icon: RotateCcw, color: "#D97706", label: "Return requested" },
  RETURNED: { icon: RotateCcw, color: "#6B7280", label: "Returned" },
  REFUNDED: { icon: CheckCircle, color: "#059669", label: "Refunded" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.85)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/shop" className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70" style={{ color: C.primary }}>
            <ArrowLeft size={16} />
            Shop
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
              <Leaf size={14} className="text-white" />
            </div>
            <span className="text-lg font-serif font-semibold" style={{ color: C.text }}>My Orders</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} style={{ color: C.textMuted }} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2" style={{ color: C.text }}>No orders yet</h2>
            <p className="text-sm mb-6" style={{ color: C.textSecondary }}>Start shopping to see your orders here.</p>
            <Link href="/shop">
              <Button variant="premium">Browse Shop</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = status.icon;
              return (
                <div key={order.id} className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ background: "#fff", borderColor: C.borderLight }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-mono" style={{ color: C.textMuted }}>#{order.orderNumber}</p>
                      <p className="text-sm font-medium mt-1" style={{ color: C.text }}>
                        {new Date(order.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: `${status.color}15`, color: status.color }}>
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: C.bgWarm }}>
                          {item.product?.images?.[0]?.url ? (
                            <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={16} style={{ color: C.textMuted }} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: C.text }}>{item.product?.title}</p>
                          <p className="text-xs" style={{ color: C.textMuted }}>Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3"
                    style={{ borderTop: `1px solid ${C.borderLight}` }}
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: C.textMuted }}>
                      <span>{order.items?.length || 0} item(s)</span>
                      {order.trackingNumber && (
                        <span>
                          Tracking: {order.carrier ? `${order.carrier} · ` : ""}
                          {order.trackingNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold" style={{ color: C.primary }}>
                        {formatCurrency(order.totalAmount ?? 0)}
                      </span>
                      <Link
                        href={`/shop/orders/${order.id}`}
                        className="flex items-center gap-1 text-xs font-semibold hover:opacity-70"
                        style={{ color: C.primary }}
                      >
                        View details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
