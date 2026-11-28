import { PrismaClient } from "@prisma/client";

export async function seedOrdersAndReviews(prisma: PrismaClient) {
  console.log("🛒 Seeding interconnected orders, order items, events, reviews, carts, wishlists, and audit logs...");

  // Clean slate for commerce transactions so every seed is deterministic and clean
  console.log("🧹 Clearing previous orders, events, reviews, carts, wishlists, and audit logs...");
  await prisma.review.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.auditLog.deleteMany();

  const customers = await prisma.user.findMany({ where: { role: "customer" } });
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });

  if (customers.length === 0 || products.length === 0) {
    console.warn("⚠️ Customers or products missing, skipping commerce seed.");
    return;
  }

  const sophie = customers.find((c) => c.email === "sophie@example.com") || customers[0];
  const ethan = customers.find((c) => c.email === "ethan@example.com") || customers[1];
  const luna = customers.find((c) => c.email === "luna@example.com") || customers[2];
  const noah = customers.find((c) => c.email === "noah@example.com") || customers[3];
  const zoe = customers.find((c) => c.email === "zoe@example.com") || customers[4];
  const aarav = customers.find((c) => c.email === "aarav@example.com") || customers[5];

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const getProd = (slug: string) => {
    const p = bySlug.get(slug);
    if (!p) throw new Error(`Missing expected product slug: ${slug}`);
    return p;
  };

  const pCleanser = getProd("gentle-foam-cleanser");
  const pVitC = getProd("vitamin-c-brightening-serum");
  const pHydraGel = getProd("hydra-gel-moisturizer");
  const pBha = getProd("salicylic-acid-exfoliant");
  const pNiacinamide = getProd("niacinamide-pore-minimizer");
  const pSpf = getProd("everyday-spf-50-sunscreen");
  const pTurmeric = getProd("turmeric-glow-face-mask");
  const pRoseToner = getProd("rose-water-hydrating-toner");
  const pLipCare = getProd("ceramide-repair-lip-treatment");
  const pEyeCream = getProd("saffron-anti-aging-eye-cream");

  // Helper for effective price
  const getEffPrice = (p: typeof pCleanser) =>
    p.discountPrice !== null && Number(p.discountPrice) > 0
      ? Number(p.discountPrice)
      : Number(p.price);

  // ── ORDER 1: Delivered & Paid via Khalti (Sophie Kim) ─────────────────────
  const o1Price1 = getEffPrice(pCleanser);
  const o1Price2 = getEffPrice(pVitC);
  const o1Total = o1Price1 + o1Price2;

  const order1 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100001-DELIVERED" },
    update: {},
    create: {
      orderNumber: "LUC-100001-DELIVERED",
      customerId: sophie.id,
      status: "DELIVERED",
      paymentProvider: "khalti",
      paymentStatus: "PAID",
      paymentRef: "khalti_pidx_demo_001",
      paymentTxnId: "TXN-KHL-884910",
      subtotal: o1Total,
      totalAmount: o1Total,
      currency: "NPR",
      shippingAddress: "House 42, Lazimpat Road, Kathmandu, Bagmati, Nepal",
      contactPhone: sophie.phone || "+977-9800000001",
      notes: "Please leave package with building reception if unavailable.",
      carrier: "Nepal Express",
      trackingNumber: "NEX-987654",
      paidAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      confirmedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000),
      shippedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pCleanser.id,
            quantity: 1,
            price: o1Price1,
            titleSnapshot: pCleanser.title,
            priceSnapshot: o1Price1,
            imageSnapshot: pCleanser.images[0]?.url ?? null,
            sellerIdSnapshot: pCleanser.sellerId,
          },
          {
            productId: pVitC.id,
            quantity: 1,
            price: o1Price2,
            titleSnapshot: pVitC.title,
            priceSnapshot: o1Price2,
            imageSnapshot: pVitC.images[0]?.url ?? null,
            sellerIdSnapshot: pVitC.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Events for Order 1
  await prisma.orderEvent.createMany({
    data: [
      { orderId: order1.id, actorId: sophie.id, actorRole: "customer", event: "order_created", note: "Order placed via Khalti online payment.", createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000) },
      { orderId: order1.id, actorId: sophie.id, actorRole: "customer", event: "payment_confirmed", note: "Khalti payment confirmed (Ref: TXN-KHL-884910).", createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000 + 120000) },
      { orderId: order1.id, actorId: null, actorRole: "seller", event: "order_shipped", note: "Dispatched with Nepal Express (Tracking: NEX-987654).", createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      { orderId: order1.id, actorId: null, actorRole: "carrier", event: "order_delivered", note: "Delivered to recipient at Lazimpat Road.", createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 2: Processing & Paid via Khalti (Ethan Brooks) ───────────────────
  const o2Price = getEffPrice(pBha) * 2;
  const order2 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100002-PROCESSING" },
    update: {},
    create: {
      orderNumber: "LUC-100002-PROCESSING",
      customerId: ethan.id,
      status: "PROCESSING",
      paymentProvider: "khalti",
      paymentStatus: "PAID",
      paymentRef: "khalti_pidx_demo_002",
      paymentTxnId: "TXN-KHL-992104",
      subtotal: o2Price,
      totalAmount: o2Price,
      currency: "NPR",
      shippingAddress: "Lakeside Marg, Street 14, Pokhara, Gandaki, Nepal",
      contactPhone: ethan.phone || "+977-9800000002",
      paidAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      confirmedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pBha.id,
            quantity: 2,
            price: getEffPrice(pBha),
            titleSnapshot: pBha.title,
            priceSnapshot: getEffPrice(pBha),
            imageSnapshot: pBha.images[0]?.url ?? null,
            sellerIdSnapshot: pBha.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order2.id, actorId: ethan.id, actorRole: "customer", event: "order_created", note: "Order placed via Khalti.", createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
      { orderId: order2.id, actorId: ethan.id, actorRole: "customer", event: "payment_confirmed", note: "Payment verified successfully.", createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 60000) },
      { orderId: order2.id, actorId: null, actorRole: "seller", event: "order_confirmed", note: "Seller confirmed order and began laboratory packaging.", createdAt: new Date(Date.now() - 20 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 3: Shipped & In-Transit (Luna Martinez) ──────────────────────────
  const o3Price = getEffPrice(pRoseToner) + getEffPrice(pTurmeric);
  const order3 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100003-SHIPPED" },
    update: {},
    create: {
      orderNumber: "LUC-100003-SHIPPED",
      customerId: luna.id,
      status: "SHIPPED",
      paymentProvider: "khalti",
      paymentStatus: "PAID",
      paymentRef: "khalti_pidx_demo_003",
      paymentTxnId: "TXN-KHL-441890",
      subtotal: o3Price,
      totalAmount: o3Price,
      currency: "NPR",
      shippingAddress: "Suryabinayak Heights, Ward 5, Bhaktapur, Bagmati, Nepal",
      contactPhone: luna.phone || "+977-9800000003",
      carrier: "Aramex Nepal",
      trackingNumber: "ARX-554190",
      paidAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      confirmedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      shippedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pRoseToner.id,
            quantity: 1,
            price: getEffPrice(pRoseToner),
            titleSnapshot: pRoseToner.title,
            priceSnapshot: getEffPrice(pRoseToner),
            imageSnapshot: pRoseToner.images[0]?.url ?? null,
            sellerIdSnapshot: pRoseToner.sellerId,
          },
          {
            productId: pTurmeric.id,
            quantity: 1,
            price: getEffPrice(pTurmeric),
            titleSnapshot: pTurmeric.title,
            priceSnapshot: getEffPrice(pTurmeric),
            imageSnapshot: pTurmeric.images[0]?.url ?? null,
            sellerIdSnapshot: pTurmeric.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order3.id, actorId: luna.id, actorRole: "customer", event: "order_created", note: "Order placed via Khalti.", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
      { orderId: order3.id, actorId: luna.id, actorRole: "customer", event: "payment_confirmed", note: "Khalti payment confirmed.", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 45000) },
      { orderId: order3.id, actorId: null, actorRole: "seller", event: "order_shipped", note: "Handed over to Aramex Nepal. In transit to Bhaktapur hub.", createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 4: COD Pending (Noah Patel) ─────────────────────────────────────
  const o4Price = getEffPrice(pHydraGel);
  const order4 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100004-COD-PENDING" },
    update: {},
    create: {
      orderNumber: "LUC-100004-COD-PENDING",
      customerId: noah.id,
      status: "PENDING",
      paymentProvider: "cod",
      paymentStatus: "UNPAID",
      subtotal: o4Price,
      totalAmount: o4Price,
      currency: "NPR",
      shippingAddress: "Main Road, Ward 2, Biratnagar, Morang, Koshi, Nepal",
      contactPhone: noah.phone || "+977-9800000004",
      notes: "Cash on delivery - please call before arrival.",
      reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      items: {
        create: [
          {
            productId: pHydraGel.id,
            quantity: 1,
            price: o4Price,
            titleSnapshot: pHydraGel.title,
            priceSnapshot: o4Price,
            imageSnapshot: pHydraGel.images[0]?.url ?? null,
            sellerIdSnapshot: pHydraGel.sellerId,
            stockReserved: true,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order4.id,
      actorId: noah.id,
      actorRole: "customer",
      event: "order_created",
      note: "Cash on Delivery order placed. Awaiting dispatch confirmation.",
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  // ── ORDER 5: COD Delivered & Paid (Zoe Williams) ───────────────────────────
  const o5Price = getEffPrice(pSpf);
  const order5 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100005-COD-DELIVERED" },
    update: {},
    create: {
      orderNumber: "LUC-100005-COD-DELIVERED",
      customerId: zoe.id,
      status: "DELIVERED",
      paymentProvider: "cod",
      paymentStatus: "PAID",
      subtotal: o5Price,
      totalAmount: o5Price,
      currency: "NPR",
      shippingAddress: "Baneshwor Heights, Ward 10, Kathmandu, Bagmati, Nepal",
      contactPhone: zoe.phone || "+977-9800000005",
      carrier: "Nepal Express",
      trackingNumber: "NEX-112288",
      paidAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      confirmedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      shippedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pSpf.id,
            quantity: 1,
            price: o5Price,
            titleSnapshot: pSpf.title,
            priceSnapshot: o5Price,
            imageSnapshot: pSpf.images[0]?.url ?? null,
            sellerIdSnapshot: pSpf.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order5.id, actorId: zoe.id, actorRole: "customer", event: "order_created", note: "Placed with Cash on Delivery.", createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000) },
      { orderId: order5.id, actorId: null, actorRole: "seller", event: "order_confirmed", note: "Seller approved COD request.", createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      { orderId: order5.id, actorId: null, actorRole: "carrier", event: "order_delivered", note: "Cash received and order marked delivered.", createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 6: Cancelled by Customer (Aarav Shrestha) ───────────────────────
  const o6Price = getEffPrice(pNiacinamide);
  const order6 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100006-CANCELLED" },
    update: {},
    create: {
      orderNumber: "LUC-100006-CANCELLED",
      customerId: aarav.id,
      status: "CANCELLED",
      paymentProvider: "cod",
      paymentStatus: "UNPAID",
      subtotal: o6Price,
      totalAmount: o6Price,
      currency: "NPR",
      shippingAddress: "Traffic Chowk, Ward 7, Butwal, Rupandehi, Nepal",
      contactPhone: aarav.phone || "+977-9800000006",
      cancelledAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      cancelReason: "Ordered wrong formulation by mistake; re-ordering different serum.",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 3600000),
      items: {
        create: [
          {
            productId: pNiacinamide.id,
            quantity: 1,
            price: o6Price,
            titleSnapshot: pNiacinamide.title,
            priceSnapshot: o6Price,
            imageSnapshot: pNiacinamide.images[0]?.url ?? null,
            sellerIdSnapshot: pNiacinamide.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order6.id, actorId: aarav.id, actorRole: "customer", event: "order_created", note: "Order initiated.", createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 3600000) },
      { orderId: order6.id, actorId: aarav.id, actorRole: "customer", event: "order_cancelled", note: "Cancelled before dispatch. Reason: Ordered wrong formulation.", createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 7: Return Requested (Sophie Kim) ─────────────────────────────────
  const o7Price = getEffPrice(pTurmeric);
  const order7 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100007-RETURN-REQUEST" },
    update: {},
    create: {
      orderNumber: "LUC-100007-RETURN-REQUEST",
      customerId: sophie.id,
      status: "RETURN_REQUESTED",
      paymentProvider: "khalti",
      paymentStatus: "PAID",
      paymentRef: "khalti_pidx_demo_007",
      paymentTxnId: "TXN-KHL-559012",
      subtotal: o7Price,
      totalAmount: o7Price,
      currency: "NPR",
      shippingAddress: "House 42, Lazimpat Road, Kathmandu, Bagmati, Nepal",
      contactPhone: sophie.phone || "+977-9800000001",
      carrier: "Nepal Express",
      trackingNumber: "NEX-334455",
      paidAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      returnRequestedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      returnReason: "Developed mild sensitivity tingling to herbal wild turmeric; requested return under clean-formula guarantee.",
      refundStatus: "REQUESTED",
      refundRequestedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      refundReason: "Customer skin sensitivity return.",
      createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pTurmeric.id,
            quantity: 1,
            price: o7Price,
            titleSnapshot: pTurmeric.title,
            priceSnapshot: o7Price,
            imageSnapshot: pTurmeric.images[0]?.url ?? null,
            sellerIdSnapshot: pTurmeric.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order7.id, actorId: sophie.id, actorRole: "customer", event: "order_created", note: "Order placed via Khalti.", createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000) },
      { orderId: order7.id, actorId: null, actorRole: "carrier", event: "order_delivered", note: "Delivered to customer.", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
      { orderId: order7.id, actorId: sophie.id, actorRole: "customer", event: "request_return", note: "Buyer requested return due to ingredient sensitivity.", createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 8: Completed Return & Full Refund (Ethan Brooks) ────────────────
  const o8Price = getEffPrice(pHydraGel);
  const order8 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100008-REFUNDED" },
    update: {},
    create: {
      orderNumber: "LUC-100008-REFUNDED",
      customerId: ethan.id,
      status: "REFUNDED",
      paymentProvider: "khalti",
      paymentStatus: "REFUNDED",
      paymentRef: "khalti_pidx_demo_008",
      paymentTxnId: "TXN-KHL-119283",
      subtotal: o8Price,
      totalAmount: o8Price,
      currency: "NPR",
      shippingAddress: "Lakeside Marg, Street 14, Pokhara, Gandaki, Nepal",
      contactPhone: ethan.phone || "+977-9800000002",
      carrier: "Nepal Express",
      trackingNumber: "NEX-778899",
      paidAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      returnRequestedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      returnReason: "Defective pump nozzle on delivery.",
      refundStatus: "REFUNDED",
      refundRequestedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      refundedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      refundAmount: o8Price,
      refundReason: "Full refund processed to original Khalti wallet (Ref: RFND-88310).",
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pHydraGel.id,
            quantity: 1,
            price: o8Price,
            titleSnapshot: pHydraGel.title,
            priceSnapshot: o8Price,
            imageSnapshot: pHydraGel.images[0]?.url ?? null,
            sellerIdSnapshot: pHydraGel.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order8.id, actorId: ethan.id, actorRole: "customer", event: "order_created", note: "Order placed via Khalti.", createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000) },
      { orderId: order8.id, actorId: null, actorRole: "carrier", event: "order_delivered", note: "Delivered to buyer.", createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000) },
      { orderId: order8.id, actorId: ethan.id, actorRole: "customer", event: "request_return", note: "Requested return for defective packaging.", createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000) },
      { orderId: order8.id, actorId: null, actorRole: "seller", event: "approve_return", note: "Seller inspected returned unit and approved 100% refund.", createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      { orderId: order8.id, actorId: null, actorRole: "admin", event: "refund_completed", note: "Khalti gateway refund processed (Ref: RFND-88310).", createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 9: Pending Payment with Active Stock Reservation (Noah Patel) ──
  const o9Price = getEffPrice(pTurmeric);
  const order9 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100009-ACTIVE-RESERVED" },
    update: {},
    create: {
      orderNumber: "LUC-100009-ACTIVE-RESERVED",
      customerId: noah.id,
      status: "PENDING",
      paymentProvider: "khalti",
      paymentStatus: "UNPAID",
      subtotal: o9Price,
      totalAmount: o9Price,
      currency: "NPR",
      shippingAddress: "Boudha Stupa Gate, Kathmandu, Bagmati, Nepal",
      contactPhone: noah.phone || "+977-9800000004",
      notes: "Stock hold active. Payment pending customer redirection in Khalti.",
      reservationExpiresAt: new Date(Date.now() + 25 * 60 * 1000), // 25 minutes left
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      items: {
        create: [
          {
            productId: pTurmeric.id,
            quantity: 1,
            price: o9Price,
            titleSnapshot: pTurmeric.title,
            priceSnapshot: o9Price,
            imageSnapshot: pTurmeric.images[0]?.url ?? null,
            sellerIdSnapshot: pTurmeric.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      {
        orderId: order9.id,
        actorId: noah.id,
        actorRole: "customer",
        event: "order_created",
        note: "Checkout session created. Product inventory reserved for 30 minutes pending Khalti payment.",
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  // ── ORDER 10: Multi-Seller Marketplace Basket Delivered (Aarav Shrestha) ─
  const o10Item1 = getEffPrice(pCleanser);
  const o10Item2 = getEffPrice(pNiacinamide);
  const o10Item3 = getEffPrice(pLipCare);
  const o10Total = o10Item1 + o10Item2 + o10Item3;

  const order10 = await prisma.order.upsert({
    where: { orderNumber: "LUC-100010-MULTI-SELLER-DELIVERED" },
    update: {},
    create: {
      orderNumber: "LUC-100010-MULTI-SELLER-DELIVERED",
      customerId: aarav.id,
      status: "DELIVERED",
      paymentProvider: "khalti",
      paymentStatus: "PAID",
      paymentRef: "khalti_pidx_demo_010",
      paymentTxnId: "TXN-KHL-992384",
      subtotal: o10Total,
      totalAmount: o10Total,
      currency: "NPR",
      shippingAddress: "House 18, Thamel Marg, Kathmandu, Bagmati, Nepal",
      contactPhone: aarav.phone || "+977-9800000006",
      carrier: "Nepal Express",
      trackingNumber: "NEX-102938",
      paidAt: new Date(Date.now() - 12 * 24 * 3600 * 1000),
      confirmedAt: new Date(Date.now() - 11 * 24 * 3600 * 1000),
      shippedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            productId: pCleanser.id,
            quantity: 1,
            price: o10Item1,
            titleSnapshot: pCleanser.title,
            priceSnapshot: o10Item1,
            imageSnapshot: pCleanser.images[0]?.url ?? null,
            sellerIdSnapshot: pCleanser.sellerId,
          },
          {
            productId: pNiacinamide.id,
            quantity: 1,
            price: o10Item2,
            titleSnapshot: pNiacinamide.title,
            priceSnapshot: o10Item2,
            imageSnapshot: pNiacinamide.images[0]?.url ?? null,
            sellerIdSnapshot: pNiacinamide.sellerId,
          },
          {
            productId: pLipCare.id,
            quantity: 1,
            price: o10Item3,
            titleSnapshot: pLipCare.title,
            priceSnapshot: o10Item3,
            imageSnapshot: pLipCare.images[0]?.url ?? null,
            sellerIdSnapshot: pLipCare.sellerId,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.orderEvent.createMany({
    data: [
      { orderId: order10.id, actorId: aarav.id, actorRole: "customer", event: "order_created", note: "Multi-brand routine order placed via Khalti.", createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000) },
      { orderId: order10.id, actorId: aarav.id, actorRole: "customer", event: "payment_confirmed", note: "Khalti payment confirmed (Ref: TXN-KHL-992384).", createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000 + 45000) },
      { orderId: order10.id, actorId: null, actorRole: "seller", event: "order_shipped", note: "Consolidated package dispatched with Nepal Express.", createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000) },
      { orderId: order10.id, actorId: null, actorRole: "carrier", event: "order_delivered", note: "Delivered to buyer at Thamel Marg.", createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000) },
    ],
    skipDuplicates: true,
  });

  console.log("  ✓ Seeded 10 lifecycle orders (Delivered, Processing, Shipped, COD Pending, COD Delivered, Cancelled, Return Requested, Refunded, Active Reserved, Multi-Seller Basket)");

  // ── 2. VERIFIED REVIEWS (Linked to actual delivered OrderItems) ────────────
  console.log("⭐ Seeding verified buyer reviews...");

  const reviewsToSeed = [
    {
      productId: pCleanser.id,
      userId: sophie.id,
      orderItemId: order1.items.find((i) => i.productId === pCleanser.id)?.id,
      rating: 5,
      comment:
        "The best gentle morning cleanser I have used. I have reactive eczema-prone skin and this leaves zero tightness or red blotches. Smells fresh and washes cleanly.",
      isVerified: true,
    },
    {
      productId: pVitC.id,
      userId: sophie.id,
      orderItemId: order1.items.find((i) => i.productId === pVitC.id)?.id,
      rating: 5,
      comment:
        "Visible brightening within 3 weeks! My acne marks faded significantly. The 15% Ethyl Ascorbic Acid does not oxidize like pure L-ascorbic acid serums.",
      isVerified: true,
    },
    {
      productId: pSpf.id,
      userId: zoe.id,
      orderItemId: order5.items.find((i) => i.productId === pSpf.id)?.id,
      rating: 5,
      comment:
        "No white cast on olive undertones! Sits gorgeously under powder and foundation. Doesn't sting my eyes during midday workouts.",
      isVerified: true,
    },
    {
      productId: pBha.id,
      userId: ethan.id,
      orderItemId: order2.items.find((i) => i.productId === pBha.id)?.id,
      rating: 4,
      comment:
        "Cleared up stubborn blackheads on my nose in under 2 weeks. Strong formulation, so I only use it every other night, but results are undeniable.",
      isVerified: true,
    },
    {
      productId: pRoseToner.id,
      userId: luna.id,
      orderItemId: order3.items.find((i) => i.productId === pRoseToner.id)?.id,
      rating: 5,
      comment:
        "The organic Damask rose scent is heavenly and natural. Instantly plumps and prepares my skin for serums. Highly recommend!",
      isVerified: true,
    },
    {
      productId: pNiacinamide.id,
      userId: aarav.id,
      orderItemId: order10.items.find((i) => i.productId === pNiacinamide.id)?.id,
      rating: 5,
      comment:
        "Remarkable sebum control for T-zone shine. Reduced oiliness during humid monsoon days without causing flakiness or irritation.",
      isVerified: true,
    },
    {
      productId: pLipCare.id,
      userId: aarav.id,
      orderItemId: order10.items.find((i) => i.productId === pLipCare.id)?.id,
      rating: 5,
      comment:
        "Repaired cracked lips in just two nights. Thick but completely non-sticky cushion texture. Will definitely repurchase.",
      isVerified: true,
    },
  ];

  for (const rev of reviewsToSeed) {
    await prisma.review.upsert({
      where: {
        productId_userId: { productId: rev.productId, userId: rev.userId },
      },
      update: {
        rating: rev.rating,
        comment: rev.comment,
        isVerified: rev.isVerified,
        orderItemId: rev.orderItemId,
      },
      create: {
        productId: rev.productId,
        userId: rev.userId,
        orderItemId: rev.orderItemId,
        rating: rev.rating,
        comment: rev.comment,
        isVerified: rev.isVerified,
      },
    });
  }
  console.log(`  ✓ Seeded ${reviewsToSeed.length} verified reviews backed by OrderItem joins`);

  // ── 3. LIVE CARTS & CART ITEMS ────────────────────────────────────────────
  console.log("🛍️ Seeding active customer shopping carts...");

  // Sophie's active cart
  const sophieCart = await prisma.cart.upsert({
    where: { userId: sophie.id },
    update: {},
    create: { userId: sophie.id },
  });

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: sophieCart.id, productId: pHydraGel.id } },
    update: { quantity: 1 },
    create: { cartId: sophieCart.id, productId: pHydraGel.id, quantity: 1 },
  });

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: sophieCart.id, productId: pLipCare.id } },
    update: { quantity: 2 },
    create: { cartId: sophieCart.id, productId: pLipCare.id, quantity: 2 },
  });

  // Ethan's active cart
  const ethanCart = await prisma.cart.upsert({
    where: { userId: ethan.id },
    update: {},
    create: { userId: ethan.id },
  });

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: ethanCart.id, productId: pNiacinamide.id } },
    update: { quantity: 1 },
    create: { cartId: ethanCart.id, productId: pNiacinamide.id, quantity: 1 },
  });
  console.log("  ✓ Seeded live carts for Sophie Kim (2 items) and Ethan Brooks (1 item)");

  // ── 4. CUSTOMER WISHLISTS ─────────────────────────────────────────────────
  console.log("❤️ Seeding customer wishlists...");

  const wishlists = [
    { userId: sophie.id, productId: pEyeCream.id },
    { userId: sophie.id, productId: pTurmeric.id },
    { userId: luna.id, productId: pVitC.id },
    { userId: luna.id, productId: pSpf.id },
    { userId: zoe.id, productId: pBha.id },
    { userId: zoe.id, productId: pHydraGel.id },
    { userId: noah.id, productId: pCleanser.id },
  ];

  for (const w of wishlists) {
    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: w.userId, productId: w.productId } },
      update: {},
      create: { userId: w.userId, productId: w.productId },
    });
  }
  console.log(`  ✓ Seeded ${wishlists.length} customer wishlist items`);

  // ── 5. RECENTLY VIEWED PRODUCTS ───────────────────────────────────────────
  console.log("👁️ Seeding recently viewed history...");

  const recentViews = [
    { userId: sophie.id, productId: pEyeCream.id, minsAgo: 5 },
    { userId: sophie.id, productId: pVitC.id, minsAgo: 25 },
    { userId: ethan.id, productId: pNiacinamide.id, minsAgo: 10 },
    { userId: ethan.id, productId: pBha.id, minsAgo: 45 },
    { userId: luna.id, productId: pTurmeric.id, minsAgo: 15 },
  ];

  for (const rv of recentViews) {
    await prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId: rv.userId, productId: rv.productId } },
      update: { viewedAt: new Date(Date.now() - rv.minsAgo * 60 * 1000) },
      create: {
        userId: rv.userId,
        productId: rv.productId,
        viewedAt: new Date(Date.now() - rv.minsAgo * 60 * 1000),
      },
    });
  }
  console.log(`  ✓ Seeded ${recentViews.length} recently viewed items`);

  // ── 6. ADMINISTRATIVE AUDIT LOGS ──────────────────────────────────────────
  console.log("🛡️ Seeding administrative audit logs...");

  if (admin) {
    const auditEntries = [
      {
        actorId: admin.id,
        action: "verify_seller",
        target: "seller:glow-lab",
        metadata: { storeName: "Glow Lab Skincare", certifiedBy: "Nepal Department of Drug Administration (DDA) Lab Certificate #4410" },
        createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000),
      },
      {
        actorId: admin.id,
        action: "verify_seller",
        target: "seller:skinchemy",
        metadata: { storeName: "Skinchemy", certifiedBy: "ISO-22716 Good Manufacturing Practice Inspection Verified" },
        createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      },
      {
        actorId: admin.id,
        action: "verify_seller",
        target: "seller:botana-beauty",
        metadata: { storeName: "Botana Beauty", certifiedBy: "Himalayan Organic Herb Sourcing Verification #9921" },
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      },
      {
        actorId: admin.id,
        action: "ban_user",
        target: "user:vikram-thapa",
        metadata: { email: "banned@example.com", reason: "Fraudulent chargebacks and review spamming" },
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      },
      {
        actorId: admin.id,
        action: "update_taxonomy",
        target: "category:sunscreens",
        metadata: { action: "verified_sp_standards", minSpf: 50 },
        createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      },
    ];

    for (const entry of auditEntries) {
      await prisma.auditLog.create({
        data: entry,
      });
    }
    console.log(`  ✓ Seeded ${auditEntries.length} admin security & audit trail records\n`);
  }
}
