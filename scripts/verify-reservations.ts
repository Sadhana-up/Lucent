import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import { releaseExpiredReservations } from "../src/lib/inventory";

async function run() {
  const t = Date.now();
  const user = await prisma.user.create({
    data: { name: "Reservation Test", email: `res-check-${t}@example.com`, role: "customer" },
  });
  const seller = await prisma.sellerProfile.create({
    data: { userId: user.id, storeName: "Reservation Test Store", storeSlug: `res-store-${t}` },
  });
  const category = await prisma.category.findFirst();
  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      categoryId: category?.id ?? null,
      title: `Reservation Test Product ${t}`,
      slug: `res-product-${t}`,
      description: "Reservation test product",
      price: 1000,
      stock: 5,
    },
  });
  const order = await prisma.order.create({
    data: {
      orderNumber: `RES-TEST-${t}`,
      customerId: user.id,
      status: "PENDING",
      paymentStatus: "UNPAID",
      totalAmount: 2000,
      shippingAddress: "Test address",
      contactPhone: "9800000000",
      reservationExpiresAt: new Date(Date.now() - 60_000),
    },
  });
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      quantity: 2,
      price: 1000,
      titleSnapshot: product.title,
      priceSnapshot: 1000,
      stockReserved: true,
    },
  });

  try {
    const processed = await releaseExpiredReservations();
    assert.ok(processed >= 1, "Expired reservation must be processed");

    const cancelled = await prisma.order.findUnique({ where: { id: order.id } });
    assert.strictEqual(cancelled?.status, "CANCELLED", "Expired unpaid order must be cancelled");

    const restored = await prisma.product.findUnique({ where: { id: product.id } });
    assert.strictEqual(restored?.stock, 7, "Reserved units must return to stock");

    const item = await prisma.orderItem.findFirst({ where: { orderId: order.id } });
    assert.strictEqual(item?.stockReserved, false, "Reservation flag must be cleared");

    await releaseExpiredReservations();
    const afterSecondSweep = await prisma.product.findUnique({ where: { id: product.id } });
    assert.strictEqual(afterSecondSweep?.stock, 7, "A second sweep must not restore stock twice");

    console.log("🎉 Reservation expiry/release checks passed!");
  } finally {
    await prisma.orderEvent.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.sellerProfile.delete({ where: { id: seller.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

run()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
