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

/**
 * Idempotently release reserved stock for an order back to product inventory.
 * Only order items with stockReserved === true are claimed, ensuring double-release is impossible.
 */
export async function releaseOrderStock(
  orderId: string,
  sellerId?: string,
): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({
      where: {
        orderId,
        stockReserved: true,
        ...(sellerId ? { product: { sellerId } } : {}),
      },
      select: { id: true, productId: true, quantity: true },
    });

    let totalReleased = 0;

    for (const item of items) {
      // Atomic conditional update: only claim if still marked as reserved
      const claimed = await tx.orderItem.updateMany({
        where: { id: item.id, stockReserved: true },
        data: { stockReserved: false },
      });
      if (claimed.count !== 1) continue;

      // Increment inventory
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });

      totalReleased += item.quantity;
    }

    if (totalReleased > 0) {
      await tx.orderEvent.create({
        data: {
          orderId,
          event: "stock_released",
          note: `Released ${totalReleased} reserved units back to inventory`,
        },
      });
    }

    return totalReleased;
  });
}

/**
 * Release expired reservations for UNPAID orders that have exceeded the TTL window.
 * Marks the order as CANCELLED (Reservation expired) and releases the reserved stock.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const expired = await prisma.order.findMany({
    where: {
      paymentStatus: "UNPAID",
      status: "PENDING",
      reservationExpiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  let processedCount = 0;

  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      // Confirm the order is still PENDING before updating
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: "PENDING",
          paymentStatus: "UNPAID",
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "Reservation expired",
        },
      });

      if (updated.count === 1) {
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            event: "reservation_expired",
            note: "Order auto-cancelled due to reservation expiration",
          },
        });
      }
    });

    await releaseOrderStock(order.id);
    processedCount++;
  }

  return processedCount;
}

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Throttled lazy sweep to expire stale reservations on normal user traffic
 * without requiring an external cron scheduler.
 */
export async function lazySweepExpiredReservations(): Promise<void> {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) {
    return;
  }
  lastSweepAt = now;
  try {
    await releaseExpiredReservations();
  } catch (err) {
    console.error("Lazy sweep error:", err);
  }
}
