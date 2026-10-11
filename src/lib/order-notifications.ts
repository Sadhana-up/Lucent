import { prisma } from "@/lib/prisma";
import {
  sendNewOrderSellerEmail,
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
      price: item.price,
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
