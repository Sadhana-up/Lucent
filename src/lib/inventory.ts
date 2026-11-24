import { prisma } from "@/lib/prisma";

export const RESERVATION_TTL_MS = 15 * 60 * 1000;

export class InventoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "InventoryError";
  }
}

export async function releaseOrderStock(
  orderId: string,
  sellerId?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({
      where: {
        orderId,
        stockReserved: true,
        ...(sellerId ? { product: { sellerId } } : {}),
      },
      select: { id: true, productId: true, quantity: true },
    });

    for (const item of items) {
      const claimed = await tx.orderItem.updateMany({
        where: { id: item.id, stockReserved: true },
        data: { stockReserved: false },
      });
      if (claimed.count !== 1) continue;

      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}

export async function releaseExpiredReservations(): Promise<void> {
  const expired = await prisma.order.findMany({
    where: {
      paymentStatus: "UNPAID",
      status: "PENDING",
      reservationExpiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  for (const order of expired) {
    await releaseOrderStock(order.id);
  }
}
