"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Leaf, Clock, CheckCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { StoreNavbar } from "@/components/store-navbar";

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
  PROCESSING: { icon: Clock, color: "#3B82F6", label: "Processing" },
  CONFIRMED: { icon: CheckCircle, color: "#3B82F6", label: "Confirmed" },
  SHIPPED: { icon: Truck, color: "#8B5CF6", label: "Shipped" },
  DELIVERED: { icon: CheckCircle, color: C.primary, label: "Delivered" },
  CANCELLED: { icon: Clock, color: "#EF4444", label: "Cancelled" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : data?.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: "Cancelled by customer" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
        );
      }
    } catch (err) {
      console.error("Failed to cancel order:", err);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg }}>
      <StoreNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1A1D21]">My Orders & Tracking</h1>
            <p className="text-xs text-[#8C8C85] mt-0.5">Track real-time status and view details of your botanical formulations</p>
          </div>
        </div>
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

                  <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" style={{ borderTop: `1px solid ${C.borderLight}` }}>
                    <div style={{ color: C.textSecondary }}>
                      <span>Address: {order.shippingAddress}</span>
                      <span className="mx-2">·</span>
                      <span>Phone: {order.contactPhone}</span>
                      <span className="mx-2">·</span>
                      <span className="font-mono uppercase font-semibold" style={{ color: order.paymentStatus === "PAID" ? C.primary : "#D97706" }}>
                        Payment: {order.paymentProvider?.toUpperCase() || "COD"} ({order.paymentStatus})
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-sm font-bold" style={{ color: C.primary }}>
                        {formatCurrency(order.totalAmount ?? 0)}
                      </span>
                      {order.status === "PENDING" && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      )}
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
