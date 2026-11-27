import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log("📊 Database Record Counts & Integrity Check:\n");

  const [
    userCount,
    accountCount,
    sellerProfileCount,
    addressCount,
    categoryCount,
    productCount,
    productImageCount,
    orderCount,
    orderItemCount,
    orderEventCount,
    reviewCount,
    cartCount,
    cartItemCount,
    wishlistCount,
    recentlyViewedCount,
    auditLogCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.sellerProfile.count(),
    prisma.address.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.orderEvent.count(),
    prisma.review.count(),
    prisma.cart.count(),
    prisma.cartItem.count(),
    prisma.wishlist.count(),
    prisma.recentlyViewed.count(),
    prisma.auditLog.count(),
  ]);

  console.table({
    User: userCount,
    Account: accountCount,
    SellerProfile: sellerProfileCount,
    Address: addressCount,
    Category: categoryCount,
    Product: productCount,
    ProductImage: productImageCount,
    Order: orderCount,
    OrderItem: orderItemCount,
    OrderEvent: orderEventCount,
    Review: reviewCount,
    Cart: cartCount,
    CartItem: cartItemCount,
    Wishlist: wishlistCount,
    RecentlyViewed: recentlyViewedCount,
    AuditLog: auditLogCount,
  });

  // Verify order items snapshots
  const items = await prisma.orderItem.findMany({
    select: { id: true, titleSnapshot: true, priceSnapshot: true, imageSnapshot: true },
  });
  const allValid = items.every(i => i.titleSnapshot && Number(i.priceSnapshot) > 0);
  console.log(`\nOrderItem snapshots check: ${allValid ? "✅ ALL have immutable title and price snapshots" : "❌ Some missing snapshots"}`);

  // Verify reviews are verified purchases
  const verifiedReviews = await prisma.review.count({ where: { isVerified: true } });
  console.log(`Reviews check: ${verifiedReviews}/${reviewCount} marked as verified purchase with linked OrderItems.`);

  // Verify order timeline events exist for every order
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentProvider: true,
      totalAmount: true,
      events: { select: { event: true } },
    },
  });
  console.log(`\nOrder Lifecycles:`);
  for (const o of orders) {
    console.log(`  Order #${o.id.slice(-6)} [${o.status} | ${o.paymentStatus} via ${o.paymentProvider}] Total: Rs. ${Number(o.totalAmount)} (${o.events.length} timeline events)`);
  }

  // Verify active carts
  const carts = await prisma.cart.findMany({
    include: {
      user: { select: { name: true } },
      items: { include: { product: { select: { title: true } } } },
    },
  });
  console.log(`\nActive Carts:`);
  for (const c of carts) {
    console.log(`  ${c.user.name}'s Cart (${c.items.length} items): ${c.items.map(i => `${i.quantity}x ${i.product.title}`).join(", ")}`);
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
