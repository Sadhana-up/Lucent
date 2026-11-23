export const MAX_QUANTITY_PER_PRODUCT = 10;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  NONE: "Not requested",
  REQUESTED: "Refund requested",
  APPROVED: "Refund approved",
  PROCESSING: "Refund processing",
  REFUNDED: "Refunded",
  REJECTED: "Refund rejected",
};

const CANCELLABLE_STATUSES = new Set(["PENDING", "CONFIRMED", "PROCESSING"]);

export function canCancelOrder(order: {
  status: string;
  paymentStatus: string;
}): boolean {
  return CANCELLABLE_STATUSES.has(order.status);
}

export function canRequestReturn(order: { status: string }): boolean {
  return order.status === "DELIVERED";
}

export function canRequestRefund(order: {
  status: string;
  paymentStatus: string;
  refundStatus: string;
}): boolean {
  return (
    order.paymentStatus === "PAID" &&
    order.refundStatus === "NONE" &&
    order.status !== "CANCELLED" &&
    order.status !== "REFUNDED"
  );
}

export function isTerminalOrderStatus(status: string): boolean {
  return ["CANCELLED", "REFUNDED"].includes(status);
}

export const SELLER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const REFUND_STATUSES = [
  "NONE",
  "REQUESTED",
  "APPROVED",
  "PROCESSING",
  "REFUNDED",
  "REJECTED",
];

export function canSellerSetStatus(current: string, next: string): boolean {
  return (SELLER_STATUS_TRANSITIONS[current] ?? []).includes(next);
}

export function canSellerReviewRefund(refundStatus: string): boolean {
  return refundStatus === "REQUESTED";
}

export function canSellerMarkRefunded(refundStatus: string): boolean {
  return refundStatus === "APPROVED" || refundStatus === "PROCESSING";
}

export type SellerOrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: { url: string }[];
  };
};

export type SellerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string | null;
  totalAmount: number;
  sellerSubtotal: number;
  shippingAddress: string;
  contactPhone: string;
  notes: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundStatus: string;
  refundReason: string | null;
  refundRequestedAt: string | null;
  refundedAt: string | null;
  returnRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; email: string };
  items: SellerOrderItem[];
};
