"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MapPin,
  User,
  Truck,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  SELLER_STATUS_TRANSITIONS,
  canSellerMarkRefunded,
  type SellerOrder,
} from "@/lib/orders";

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

const statusColors: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: "rgba(124, 107, 234, 0.1)", fg: "#7C6BEA" },
  CONFIRMED: { bg: "rgba(59, 130, 246, 0.1)", fg: "#3B82F6" },
  PROCESSING: { bg: "rgba(45, 90, 61, 0.08)", fg: "#2D5A3D" },
  SHIPPED: { bg: "rgba(45, 90, 61, 0.08)", fg: "#2D5A3D" },
  DELIVERED: { bg: "rgba(45, 90, 61, 0.12)", fg: "#1E3D2A" },
  CANCELLED: { bg: "rgba(181, 74, 74, 0.08)", fg: "#b54a4a" },
  RETURN_REQUESTED: { bg: "rgba(217, 119, 6, 0.1)", fg: "#B45309" },
  RETURNED: { bg: "rgba(217, 119, 6, 0.12)", fg: "#B45309" },
  REFUNDED: { bg: "rgba(100, 116, 139, 0.12)", fg: "#475569" },
};

const actionButtonStyle = {
  border: `1px solid ${C.border}`,
  background: "rgba(255,255,255,0.72)",
  color: C.text,
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingDrafts, setTrackingDrafts] = useState<
    Record<string, { trackingNumber: string; carrier: string }>
  >({});

  async function fetchOrders() {
    try {
      const res = await fetch("/api/seller/orders");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load orders");
      }
      setOrders(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      await fetchOrders();
    });
  }, []);

  async function handleAction(
    order: SellerOrder,
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    setBusyOrderId(order.id);
    setError(null);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action, ...extra }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update order");
      }

      const updated = await res.json();
      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: updated.status,
                refundStatus: updated.refundStatus,
                refundReason: updated.refundReason,
                refundedAt: updated.refundedAt,
                trackingNumber: updated.trackingNumber,
                carrier: updated.carrier,
                cancelledAt: updated.cancelledAt,
                cancelReason: updated.cancelReason,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setBusyOrderId(null);
    }
  }

  function getTrackingDraft(order: SellerOrder) {
    return (
      trackingDrafts[order.id] ?? {
        trackingNumber: order.trackingNumber ?? "",
        carrier: order.carrier ?? "",
      }
    );
  }

  function updateTrackingDraft(
    order: SellerOrder,
    field: "trackingNumber" | "carrier",
    value: string,
  ) {
    const current = getTrackingDraft(order);
    setTrackingDrafts((previous) => ({
      ...previous,
      [order.id]: { ...current, [field]: value },
    }));
  }

  return (
    <div className="space-y-6">
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
        <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
          Review incoming orders, add tracking, and handle returns and refunds
          for your products.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(181, 74, 74, 0.08)",
            color: "#b54a4a",
            border: "1px solid rgba(181, 74, 74, 0.2)",
          }}
        >
          {error}
        </div>
      )}

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
          className="rounded-2xl p-16 text-center animate-fade-in-up"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: `1px solid ${C.borderLight}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
          }}
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
            const sc = statusColors[order.status] ?? statusColors.PENDING;
            const transitions = SELLER_STATUS_TRANSITIONS[order.status] ?? [];
            const isBusy = busyOrderId === order.id;
            const draft = getTrackingDraft(order);

            return (
              <Card
                key={order.id}
                className="rounded-2xl overflow-hidden hover-lift animate-fade-in-up opacity-0"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(16px) saturate(180%)",
                  WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  border: `1px solid ${C.borderLight}`,
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  style={{ borderBottom: `1px solid ${C.borderLight}` }}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono font-semibold text-base"
                      style={{ color: C.text }}
                    >
                      {order.orderNumber}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.fg }}
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background:
                          order.paymentStatus === "PAID"
                            ? C.primaryGhost
                            : C.accentGhost,
                        color:
                          order.paymentStatus === "PAID" ? C.primary : C.accent,
                      }}
                    >
                      {order.paymentStatus}
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
                      {formatCurrency(order.sellerSubtotal)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: C.textMuted }}
                      >
                        Status:
                      </span>
                      {transitions.length > 0 ? (
                        <select
                          value={order.status}
                          disabled={isBusy}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            void handleAction(order, "set_status", {
                              status: e.target.value,
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none cursor-pointer transition-all duration-300 input-focus-glow disabled:opacity-50"
                          style={{
                            border: `1px solid ${C.border}`,
                            background: "rgba(255,255,255,0.72)",
                            backdropFilter: "blur(8px)",
                            color: C.text,
                          }}
                        >
                          <option value={order.status} disabled>
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </option>
                          {transitions.map((status) => (
                            <option key={status} value={status}>
                              {ORDER_STATUS_LABELS[status] ?? status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs" style={{ color: C.textMuted }}>
                          No further changes
                        </span>
                      )}
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

                {isExpanded && (
                  <CardContent
                    className="p-4 sm:p-6 space-y-4 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      {order.items.map((item) => (
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
                              {item.product.images[0]?.url ? (
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
                                className="font-semibold text-sm"
                                style={{ color: C.text }}
                              >
                                {item.product.title}
                              </h4>
                              <span
                                className="text-xs"
                                style={{ color: C.textMuted }}
                              >
                                Qty: {item.quantity} x {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>
                          <span
                            className="font-semibold text-sm"
                            style={{ color: C.text }}
                          >
                            {formatCurrency(item.quantity * item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

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
                            className="font-semibold"
                            style={{ color: C.text }}
                          >
                            {order.customer?.name}
                          </p>
                          <p style={{ color: C.textSecondary }}>
                            {order.customer?.email}
                          </p>
                          <p
                            className="mt-0.5"
                            style={{ color: C.textSecondary }}
                          >
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
                            style={{ color: C.textSecondary }}
                          >
                            {order.shippingAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-xs" style={{ color: C.textSecondary }}>
                        <strong>Buyer notes:</strong> {order.notes}
                      </p>
                    )}

                    <div
                      className="pt-4 space-y-3"
                      style={{ borderTop: `1px solid ${C.borderLight}` }}
                    >
                      <div className="flex items-center gap-2">
                        <Truck size={15} style={{ color: C.primary }} />
                        <h4
                          className="text-sm font-semibold"
                          style={{ color: C.text }}
                        >
                          Shipment tracking
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={draft.carrier}
                          onChange={(e) =>
                            updateTrackingDraft(order, "carrier", e.target.value)
                          }
                          placeholder="Carrier (e.g. Kathmandu Post)"
                          className="px-3 py-2 rounded-lg text-xs outline-none"
                          style={{ border: `1px solid ${C.border}`, color: C.text }}
                        />
                        <input
                          value={draft.trackingNumber}
                          onChange={(e) =>
                            updateTrackingDraft(
                              order,
                              "trackingNumber",
                              e.target.value,
                            )
                          }
                          placeholder="Tracking number"
                          className="px-3 py-2 rounded-lg text-xs outline-none"
                          style={{ border: `1px solid ${C.border}`, color: C.text }}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isBusy || !draft.trackingNumber}
                        onClick={() =>
                          void handleAction(order, "update_tracking", draft)
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                        style={actionButtonStyle}
                      >
                        Save tracking
                      </button>
                    </div>

                    {(order.refundStatus !== "NONE" ||
                      order.status === "RETURN_REQUESTED") && (
                      <div
                        className="pt-4 space-y-3"
                        style={{ borderTop: `1px solid ${C.borderLight}` }}
                      >
                        <div className="flex items-center gap-2">
                          <RotateCcw size={15} style={{ color: C.accent }} />
                          <h4
                            className="text-sm font-semibold"
                            style={{ color: C.text }}
                          >
                            Return &amp; refund
                          </h4>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: C.accentGhost, color: C.accent }}
                          >
                            {REFUND_STATUS_LABELS[order.refundStatus] ??
                              order.refundStatus}
                          </span>
                        </div>
                        {order.refundReason && (
                          <p
                            className="text-xs"
                            style={{ color: C.textSecondary }}
                          >
                            Reason: {order.refundReason}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {order.status === "RETURN_REQUESTED" && (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleAction(order, "approve_return")
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                                style={actionButtonStyle}
                              >
                                Approve return
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleAction(order, "reject_return")
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                                style={actionButtonStyle}
                              >
                                Reject return
                              </button>
                            </>
                          )}
                          {order.refundStatus === "REQUESTED" && (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleAction(order, "approve_refund")
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                                style={actionButtonStyle}
                              >
                                Approve refund
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleAction(order, "reject_refund")
                                }
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                                style={actionButtonStyle}
                              >
                                Reject refund
                              </button>
                            </>
                          )}
                          {canSellerMarkRefunded(order.refundStatus) && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleAction(order, "mark_refunded")
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                              style={actionButtonStyle}
                            >
                              Mark as refunded
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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
