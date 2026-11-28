import { prisma } from "@/lib/prisma";
import {
  sendNewOrderSellerEmail,
  sendOrderConfirmationEmail,
  sendBuyerOrderUpdateEmail,
  sendSellerOrderUpdateEmail,
  type SellerOrderEmailItem,
} from "@/lib/email";

/**
 * Notify every seller whose product appears in the given order. Items are
 * grouped per seller so each seller only receives their own products.
 *
 * Delivery failures are logged and never thrown — a failed notification must
 * not undo a confirmed payment.
 */
export async function notifySellersForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            include: { seller: { include: { user: true } } },
          },
        },
      },
    },
  });

  if (!order) return;

  const groups = new Map<
    string,
    { to: string; storeName: string; items: SellerOrderEmailItem[] }
  >();

  for (const item of order.items) {
    const seller = item.product.seller;
    const recipient = seller.contactEmail || seller.user?.email;
    if (!recipient) continue;

    const group = groups.get(seller.id) ?? {
      to: recipient,
      storeName: seller.storeName,
      items: [],
    };
    group.items.push({
      title: item.product.title,
      quantity: item.quantity,
      price: Number(item.price),
    });
    groups.set(seller.id, group);
  }

  await Promise.all(
    Array.from(groups.values()).map((notification) =>
      sendNewOrderSellerEmail({
        to: notification.to,
        storeName: notification.storeName,
        orderNumber: order.orderNumber,
        items: notification.items,
        buyerName: order.customer.name || "A customer",
        buyerEmail: order.customer.email,
        contactPhone: order.contactPhone,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
      }).catch((error: unknown) => {
        console.error("[Email Delivery Error] new_order_seller", {
          orderNumber: order.orderNumber,
          to: notification.to,
          error,
        });
      }),
    ),
  );
}

/**
 * Send the buyer a receipt after payment has been verified. Failures are
 * logged and never thrown so a receipt problem cannot undo the order.
 */
export async function notifyBuyerOrderConfirmed(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { name: true, email: true } },
      items: { include: { product: { select: { title: true } } } },
    },
  });

  if (!order?.customer?.email) return;

  await sendOrderConfirmationEmail({
    to: order.customer.email,
    customerName: order.customer.name || "there",
    orderNumber: order.orderNumber,
    orderId: order.id,
    items: order.items.map((item) => ({
      title: item.product.title,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    totalAmount: Number(order.totalAmount),
    shippingAddress: order.shippingAddress,
    contactPhone: order.contactPhone,
    paidAt: order.paidAt ?? new Date(),
  }).catch((error: unknown) => {
    console.error("[Email Delivery Error] order_confirmation", {
      orderNumber: order.orderNumber,
      error,
    });
  });
}

/**
 * Notify the buyer about a cancellation, return, or refund request.
 */
/**
 * Notify every seller with items in an order about a cancellation, return, or
 * refund request. Failures are logged and never thrown.
 */
export async function notifySellersOrderUpdated(
  orderId: string,
  statusLabel: string,
  refundStatusLabel: string,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { seller: { include: { user: true } } },
          },
        },
      },
    },
  });

  if (!order) return;

  const groups = new Map<string, { to: string; storeName: string }>();

  for (const item of order.items) {
    const seller = item.product.seller;
    const recipient = seller.contactEmail || seller.user?.email;
    if (!recipient || groups.has(seller.id)) continue;
    groups.set(seller.id, { to: recipient, storeName: seller.storeName });
  }

  await Promise.all(
    Array.from(groups.values()).map((notification) =>
      sendSellerOrderUpdateEmail({
        to: notification.to,
        storeName: notification.storeName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        statusLabel,
        refundStatusLabel,
        reason: order.cancelReason ?? order.refundReason,
      }).catch((error: unknown) => {
        console.error("[Email Delivery Error] order_update_seller", {
          orderNumber: order.orderNumber,
          to: notification.to,
          error,
        });
      }),
    ),
  );
}

export async function notifyBuyerOrderUpdated(
  orderId: string,
  statusLabel: string,
  refundStatusLabel: string,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { select: { name: true, email: true } } },
  });

  if (!order?.customer?.email) return;

  await sendBuyerOrderUpdateEmail({
    to: order.customer.email,
    customerName: order.customer.name || "there",
    orderNumber: order.orderNumber,
    orderId: order.id,
    statusLabel,
    refundStatusLabel,
    reason: order.cancelReason ?? order.refundReason,
  }).catch((error: unknown) => {
    console.error("[Email Delivery Error] order_update", {
      orderNumber: order.orderNumber,
      error,
    });
  });
}
