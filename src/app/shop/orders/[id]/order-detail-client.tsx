"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { StoreNavbar } from "@/components/store-navbar";
import {
  ORDER_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  canCancelOrder,
  canRequestRefund,
  canRequestReturn,
} from "@/lib/orders";

const C = {
  primary: "#2D5A3D",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  danger: "#b54a4a",
};

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  refundStatus: string;
  totalAmount: number;
  shippingAddress: string;
  contactPhone: string;
  notes: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundReason: string | null;
  refundRequestedAt: string | null;
  refundedAt: string | null;
  returnRequestedAt: string | null;
  createdAt: string;
  paidAt: string | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      title: string;
      slug: string;
      image: string | null;
      seller: string;
    };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#3B82F6",
  PROCESSING: C.primary,
  SHIPPED: "#8B5CF6",
  DELIVERED: C.primary,
  CANCELLED: C.danger,
  RETURN_REQUESTED: "#D97706",
  RETURNED: "#6B7280",
  REFUNDED: "#059669",
};

const TIMELINE = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

type Action = "cancel" | "request_return" | "request_refund";

export function OrderDetailClient({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const statusColor = STATUS_COLORS[order.status] ?? C.textMuted;
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const refundLabel = REFUND_STATUS_LABELS[order.refundStatus] ?? order.refundStatus;
  const timelineIndex = TIMELINE.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";
  const isReturn = order.status === "RETURN_REQUESTED";

  const cancelAllowed = canCancelOrder(order);
  const returnAllowed = canRequestReturn(order);
  const refundAllowed = canRequestRefund(order);

  const submitAction = async () => {
    if (!action) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update order");
      setAction(null);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSubmitting(false);
    }
  };

  const actionTitle =
    action === "cancel"
      ? "Cancel this order?"
      : action === "request_return"
        ? "Request a return"
        : "Request a refund";

  const actionHint =
    action === "cancel"
      ? order.paymentStatus === "PAID"
        ? "Your order will be cancelled and a refund request will be recorded."
        : "Your unpaid order will be cancelled."
      : action === "request_return"
        ? "Tell us why you want to return the delivered items."
        : "Tell us why you are requesting a refund.";

  return (
    <div className="min-h-screen pb-20 font-sans" style={{ background: C.bg, color: C.text }}>
      <StoreNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/shop/orders"
            className="flex items-center gap-2 text-xs font-semibold text-[#5A5F6B] hover:text-[#2D5A3D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
          </Link>
          <span className="text-xs font-mono font-bold text-[#2D5A3D]">
            Order #{order.orderNumber}
          </span>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs" style={{ color: C.textMuted }}>
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="text-xl font-bold mt-1">Order #{order.orderNumber}</h1>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit"
              style={{ background: `${statusColor}15`, color: statusColor }}
            >
              <Package size={13} />
              {statusLabel}
            </div>
          </div>

          {!isCancelled && (
            <div className="mt-6">
              {isReturn ? (
                <div
                  className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                  style={{ background: "rgba(217, 119, 6, 0.08)", color: "#B45309" }}
                >
                  <RotateCcw size={16} />
                  Return requested. We will contact you with next steps.
                </div>
              ) : (
                <div className="flex items-center">
                  {TIMELINE.map((step, index) => {
                    const done = timelineIndex >= index;
                    const Icon =
                      step === "SHIPPED"
                        ? Truck
                        : step === "DELIVERED"
                          ? CheckCircle
                          : index === 0
                            ? Clock
                            : CheckCircle;
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              background: done ? C.primary : C.bgWarm,
                              color: done ? "#fff" : C.textMuted,
                            }}
                          >
                            <Icon size={15} />
                          </div>
                          <span
                            className="text-[10px] font-semibold hidden sm:block"
                            style={{ color: done ? C.text : C.textMuted }}
                          >
                            {ORDER_STATUS_LABELS[step]}
                          </span>
                        </div>
                        {index < TIMELINE.length - 1 && (
                          <div
                            className="flex-1 h-0.5 mx-1.5 mb-4 sm:mb-5"
                            style={{
                              background: timelineIndex > index ? C.primary : C.border,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isCancelled && (
            <div
              className="mt-5 rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(181, 74, 74, 0.08)", color: C.danger }}
            >
              <p className="font-semibold">Order cancelled</p>
              {order.cancelledAt && (
                <p className="text-xs mt-1">
                  {new Date(order.cancelledAt).toLocaleString("en-GB")}
                </p>
              )}
              {order.cancelReason && <p className="text-xs mt-1">Reason: {order.cancelReason}</p>}
            </div>
          )}
        </div>

        {order.trackingNumber && (
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Truck size={17} style={{ color: C.primary }} />
              <h2 className="font-semibold">Shipment tracking</h2>
            </div>
            <p className="text-sm" style={{ color: C.textSecondary }}>
              {order.carrier ? `${order.carrier} · ` : ""}
              <span className="font-mono font-semibold" style={{ color: C.text }}>
                {order.trackingNumber}
              </span>
            </p>
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}>
          <h2 className="font-semibold mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
                  style={{ background: C.bgWarm }}
                >
                  {item.product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={18} style={{ color: C.textMuted }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="text-sm font-semibold truncate block hover:opacity-70"
                    style={{ color: C.text }}
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs" style={{ color: C.textMuted }}>
                    {item.product.seller} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-4 pt-3 flex justify-between items-center"
            style={{ borderTop: `1px solid ${C.borderLight}` }}
          >
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-bold" style={{ color: C.primary }}>
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} style={{ color: C.primary }} />
              <h2 className="font-semibold">Delivery</h2>
            </div>
            <p className="text-sm whitespace-pre-line" style={{ color: C.textSecondary }}>
              {order.shippingAddress}
            </p>
            <p className="text-sm mt-2" style={{ color: C.textSecondary }}>
              Phone: {order.contactPhone}
            </p>
            {order.notes && (
              <p className="text-xs mt-2" style={{ color: C.textMuted }}>
                Note: {order.notes}
              </p>
            )}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}>
            <h2 className="font-semibold mb-2">Payment & refunds</h2>
            <p className="text-sm" style={{ color: C.textSecondary }}>
              Payment status:{" "}
              <span className="font-semibold" style={{ color: C.text }}>
                {order.paymentStatus}
              </span>
            </p>
            {order.paidAt && (
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                Paid {new Date(order.paidAt).toLocaleString("en-GB")}
              </p>
            )}
            <p className="text-sm mt-2" style={{ color: C.textSecondary }}>
              Refund status:{" "}
              <span className="font-semibold" style={{ color: C.text }}>
                {refundLabel}
              </span>
            </p>
            {order.refundReason && (
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                Reason: {order.refundReason}
              </p>
            )}
            {order.refundRequestedAt && (
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                Requested {new Date(order.refundRequestedAt).toLocaleString("en-GB")}
              </p>
            )}
          </div>
        </div>

        {(cancelAllowed || returnAllowed || refundAllowed) && (
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}>
            <h2 className="font-semibold mb-3">Need help with this order?</h2>
            <div className="flex flex-wrap gap-2">
              {cancelAllowed && (
                <Button variant="outline" className="rounded-xl" onClick={() => setAction("cancel")}>
                  <XCircle className="w-4 h-4 mr-2" style={{ color: C.danger }} />
                  Cancel order
                </Button>
              )}
              {returnAllowed && (
                <Button variant="outline" className="rounded-xl" onClick={() => setAction("request_return")}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Request return
                </Button>
              )}
              {refundAllowed && (
                <Button variant="outline" className="rounded-xl" onClick={() => setAction("request_refund")}>
                  Request refund
                </Button>
              )}
            </div>

            {action && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold">{actionTitle}</p>
                <p className="text-xs" style={{ color: C.textSecondary }}>
                  {actionHint}
                </p>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none input-focus-glow"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}
                />
                {error && (
                  <p className="text-xs" style={{ color: C.danger }}>
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="premium"
                    size="sm"
                    disabled={submitting}
                    className="rounded-lg"
                    onClick={submitAction}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={submitting}
                    onClick={() => {
                      setAction(null);
                      setReason("");
                      setError("");
                    }}
                  >
                    Keep order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
