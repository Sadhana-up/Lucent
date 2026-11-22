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
