"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Store,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "REFUNDED"];

const REFUND_STATUSES = ["NONE", "REQUESTED", "APPROVED", "PROCESSING", "REFUNDED", "REJECTED"];

interface AdminOrderModalProps {
  order: any;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: any) => void;
}

export function AdminOrderModal({ order, onClose, onOrderUpdated }: AdminOrderModalProps) {
  const [status, setStatus] = useState(order.status || "PENDING");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || "UNPAID");
  const [refundStatus, setRefundStatus] = useState(order.refundStatus || "NONE");
  const [carrier, setCarrier] = useState(order.carrier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status,
          paymentStatus,
          refundStatus,
          carrier,
          trackingNumber,
          note: adminNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update order");
      }

      const updated = await res.json();
      setFeedback({ type: "success", text: "Order successfully updated." });
      onOrderUpdated(updated);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update order",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    DELIVERED: { bg: "bg-emerald-100", text: "text-emerald-900" },
    SHIPPED: { bg: "bg-blue-100", text: "text-blue-900" },
    PROCESSING: { bg: "bg-purple-100", text: "text-purple-900" },
    CONFIRMED: { bg: "bg-cyan-100", text: "text-cyan-900" },
    PENDING: { bg: "bg-amber-100", text: "text-amber-900" },
    CANCELLED: { bg: "bg-rose-100", text: "text-rose-900" },
    RETURN_REQUESTED: { bg: "bg-orange-100", text: "text-orange-900" },
    REFUNDED: { bg: "bg-stone-100", text: "text-stone-900" },
  };

  const currentStatusStyle = statusColors[order.status] || {
    bg: "bg-stone-100",
    text: "text-stone-800",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(26, 29, 33, 0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl border border-[#EAE2D9] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#FAF6F0] border-b border-[#EAE2D9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D5A3D] text-white flex items-center justify-center shadow-xs">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-base text-[#1A1D21]">
                  {order.orderNumber}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${currentStatusStyle.bg} ${currentStatusStyle.text}`}
                >
                  {order.status}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-[#8C8C85] mt-0.5 flex items-center gap-1.5">
                <Calendar size={12} /> Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C8C85] hover:text-[#1A1D21] hover:bg-stone-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Quick Status & Logistics Update Card */}
          <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#EAE2D9] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D5A3D] flex items-center gap-1.5">
              <Truck size={14} />
              <span>Admin Order Controls & Logistics</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A5F6B] mb-1">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs font-semibold border border-[#EAE2D9] outline-none"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5F6B] mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs font-semibold border border-[#EAE2D9] outline-none"
                >
                  {PAYMENT_STATUSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5F6B] mb-1">
                  Refund Status
                </label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs font-semibold border border-[#EAE2D9] outline-none"
                >
                  {REFUND_STATUSES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A5F6B] mb-1">
                  Logistics Carrier (e.g. Nepal Post, Pathao, Delhivery)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sundar Express, Pathao"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs font-medium border border-[#EAE2D9] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5F6B] mb-1">
                  Tracking Waybill / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRK-983021"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl text-xs font-medium border border-[#EAE2D9] outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <input
                type="text"
                placeholder="Internal audit note (e.g. verified bank transaction)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="flex-1 mr-3 px-3 py-2 bg-white rounded-xl text-xs font-medium border border-[#EAE2D9] outline-none"
              />
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="text-white text-xs font-semibold rounded-xl shrink-0"
                style={{ background: "#2D5A3D" }}
              >
                <Save size={13} className="mr-1.5" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Ordered Formulations Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1D21] mb-3 flex items-center gap-1.5">
              <Package size={14} className="text-[#2D5A3D]" />
              <span>What Was Ordered ({order.items?.length || 0} items)</span>
            </h4>

            <div className="border border-[#EAE2D9] rounded-2xl overflow-hidden divide-y divide-[#EAE2D9]">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any) => {
                  const product = item.product || {};
                  const primaryImg = product.images?.[0]?.url;

                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-[#EAE2D9]">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8C8C85]">
                              <Package size={18} />
                            </div>
                          )}
                        </div>

                        <div>
                          <h5 className="font-semibold text-xs text-[#1A1D21] line-clamp-1">
                            {product.title || item.titleSnapshot || "Botanical Formulation"}
                          </h5>
                          {product.seller?.storeName && (
                            <p className="text-[11px] text-[#2D5A3D] flex items-center gap-1 mt-0.5 font-medium">
                              <Store size={11} /> {product.seller.storeName}
                            </p>
                          )}
                          <p className="text-[11px] text-[#8C8C85] mt-0.5">
                            Unit Price: {formatCurrency(Number(item.price))} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-semibold text-xs text-[#1A1D21] block">
                          {formatCurrency(Number(item.price) * (item.quantity || 1))}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-[#8C8C85]">
                  No order item records found for this order.
                </div>
              )}
            </div>
          </div>

          {/* Customer & Financial Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer & Shipping Card */}
            <div className="p-5 rounded-2xl border border-[#EAE2D9] bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1D21] flex items-center gap-1.5">
                <User size={14} className="text-[#2D5A3D]" />
                <span>Customer & Delivery Details</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#1A1D21]">
                  <span className="font-semibold">{order.customer?.name || "Guest Customer"}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A5F6B]">
                  <Mail size={13} className="text-[#8C8C85]" />
                  <span>{order.customer?.email || "No email"}</span>
                </div>
                {order.contactPhone && (
                  <div className="flex items-center gap-2 text-[#5A5F6B]">
                    <Phone size={13} className="text-[#8C8C85]" />
                    <a
                      href={`tel:${order.contactPhone}`}
                      className="hover:underline text-[#2D5A3D] font-medium"
                    >
                      {order.contactPhone}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-2 text-[#5A5F6B] pt-1">
                  <MapPin size={13} className="text-[#8C8C85] mt-0.5 shrink-0" />
                  <span className="leading-relaxed whitespace-pre-line">
                    {order.shippingAddress || "No shipping address specified"}
                  </span>
                </div>
                {order.notes && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#FAF6F0] text-[11px] text-[#5A5F6B]">
                    <span className="font-bold text-[#1A1D21]">Buyer Note:</span> {order.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="p-5 rounded-2xl border border-[#EAE2D9] bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1D21] flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#2D5A3D]" />
                <span>Payment & Totals Breakdown</span>
              </h4>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between text-[#5A5F6B]">
                  <span>Payment Provider</span>
                  <span className="font-semibold text-[#1A1D21] uppercase">
                    {order.paymentProvider || "COD"}
                  </span>
                </div>
                {order.paymentRef && (
                  <div className="flex justify-between text-[#5A5F6B]">
                    <span>Reference / Txn</span>
                    <span className="font-mono text-[11px] text-[#1A1D21]">{order.paymentRef}</span>
                  </div>
                )}
                <div className="border-t border-[#EAE2D9]/70 pt-2 flex justify-between text-[#5A5F6B]">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal || order.totalAmount))}</span>
                </div>
                <div className="flex justify-between text-[#5A5F6B]">
                  <span>Shipping Fee</span>
                  <span>
                    {Number(order.shippingFee) > 0
                      ? formatCurrency(Number(order.shippingFee))
                      : "Free Delivery"}
                  </span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>- {formatCurrency(Number(order.discount))}</span>
                  </div>
                )}
                <div className="border-t border-[#EAE2D9] pt-2 flex justify-between text-sm font-bold text-[#1A1D21]">
                  <span>Grand Total</span>
                  <span className="text-[#2D5A3D]">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit History Timeline if present */}
          {order.events && order.events.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1D21] mb-2.5 flex items-center gap-1.5">
                <Clock size={13} className="text-[#8C8C85]" />
                <span>Order Timeline & Event Log</span>
              </h4>
              <div className="space-y-1.5">
                {order.events.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-2.5 bg-[#FAF6F0] rounded-xl text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-[#1A1D21]">{e.note || e.event}</span>
                    <span className="text-[10px] text-[#8C8C85]">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF6F0] border-t border-[#EAE2D9] flex justify-end shrink-0">
          <Button onClick={onClose} variant="outline" size="sm" className="rounded-xl text-xs">
            Close Order
          </Button>
        </div>
      </div>
    </div>
  );
}
