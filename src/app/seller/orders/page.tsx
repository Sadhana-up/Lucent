"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MapPin,
  User,
} from "lucide-react";

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

const statusColors: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: "rgba(196, 149, 106, 0.12)", fg: "#c4956a" },
  PROCESSING: { bg: "rgba(74, 103, 65, 0.1)", fg: "#4a6741" },
  SHIPPED: { bg: "rgba(74, 103, 65, 0.1)", fg: "#4a6741" },
  DELIVERED: { bg: "rgba(74, 103, 65, 0.15)", fg: "#3a5233" },
  CANCELLED: { bg: "rgba(181, 74, 74, 0.08)", fg: "#b54a4a" },
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/seller/orders");
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch seller orders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      if (res.ok) {
        setOrders(
          orders.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="pb-6 animate-fade-in"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: C.text }}
        >
          Customer Orders
        </h1>
        <p className="text-sm mt-1" style={{ color: C.textLight }}>
          Review incoming orders for your products and update shipping status.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin mx-auto"
            style={{ borderColor: C.border, borderTopColor: C.primary }}
          />
          <p className="text-sm mt-3" style={{ color: C.textMuted }}>
            Loading orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <Card
          className="glass-card rounded-2xl p-16 text-center animate-fade-in-up"
          style={{ border: `1px solid ${C.border}` }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: C.primaryGhost }}
          >
            <ShoppingBag size={32} style={{ color: C.primary }} />
          </div>
          <p className="font-semibold text-base" style={{ color: C.text }}>
            No customer orders yet
          </p>
          <p className="text-xs mt-1" style={{ color: C.textMuted }}>
            Orders placed by customers will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const isExpanded = expandedOrder === order.id;
            const sc = statusColors[order.status] || statusColors.PENDING;

            return (
              <Card
                key={order.id}
                className="glass-card rounded-2xl overflow-hidden hover-lift animate-fade-in-up opacity-0"
                style={{
                  border: `1px solid ${C.border}`,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                {/* Order Header */}
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  style={{ borderBottom: `1px solid ${C.borderLight}` }}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono font-semibold text-base"
                      style={{ color: C.text }}
                    >
                      {order.orderNumber}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: sc.bg, color: sc.fg }}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs" style={{ color: C.textMuted }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: C.text }}
                    >
                      $
                      {order.items
                        .reduce(
                          (sum: number, item: any) =>
                            sum + item.quantity * item.price,
                          0
                        )
                        .toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium"
                        style={{ color: C.textMuted }}
                      >
                        Status:
                      </span>
                      <select
                        value={order.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer transition-all duration-300 input-focus-glow"
                        style={{
                          border: `1px solid ${C.border}`,
                          background: "rgba(255,255,255,0.7)",
                          backdropFilter: "blur(8px)",
                          color: C.text,
                        }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg transition-all duration-200"
                      style={{ color: C.textMuted }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {isExpanded && (
                  <CardContent className="p-4 sm:p-6 space-y-4 animate-fade-in">
                    {/* Items list */}
                    <div className="space-y-3">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 p-3 rounded-xl transition-colors duration-200"
                          style={{ background: C.primaryGhost }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                              style={{
                                background: C.bgWarm,
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              {item.product?.images[0]?.url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ color: C.textMuted }}
                                >
                                  <Package size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4
                                className="font-medium text-sm"
                                style={{ color: C.text }}
                              >
                                {item.product?.title || "Skincare Product"}
                              </h4>
                              <span
                                className="text-xs"
                                style={{ color: C.textMuted }}
                              >
                                Qty: {item.quantity} × $
                                {item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <span
                            className="font-semibold text-sm"
                            style={{ color: C.text }}
                          >
                            ${(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Customer Details */}
                    <div
                      className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                      style={{ borderTop: `1px solid ${C.borderLight}` }}
                    >
                      <div className="flex items-start gap-2">
                        <User
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.primary }}
                        />
                        <div>
                          <span
                            className="font-semibold uppercase tracking-wider block mb-1"
                            style={{ color: C.textMuted }}
                          >
                            Customer Info
                          </span>
                          <p
                            className="font-medium"
                            style={{ color: C.text }}
                          >
                            {order.customer?.name}
                          </p>
                          <p style={{ color: C.textLight }}>
                            {order.customer?.email}
                          </p>
                          <p className="mt-0.5" style={{ color: C.textLight }}>
                            Phone: {order.contactPhone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: C.accent }}
                        />
                        <div>
                          <span
                            className="font-semibold uppercase tracking-wider block mb-1"
                            style={{ color: C.textMuted }}
                          >
                            Shipping Address
                          </span>
                          <p
                            className="whitespace-pre-line"
                            style={{ color: C.textLight }}
                          >
                            {order.shippingAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
