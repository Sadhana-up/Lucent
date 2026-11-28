import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateNepaliPhone } from "@/lib/utils";
import {
  initiateKhaltiPayment,
  isKhaltiConfigured,
  KhaltiError,
  toKhaltiPhone,
  toPaisa,
} from "@/lib/khalti";
import { RESERVATION_TTL_MS } from "@/lib/inventory";

const MAX_QUANTITY = 20;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { items, shippingAddress, contactPhone, notes, paymentMethod = "khalti" } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!shippingAddress || !contactPhone) {
      return NextResponse.json(
        { error: "Shipping address and contact phone are required" },
        { status: 400 }
      );
    }

    if (!validateNepaliPhone(contactPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter a valid Nepali phone number (e.g., +977-98XXXXXXXX)" },
        { status: 400 }
      );
    }

    // Validate items — deduplicate, check quantities
    const seenProducts = new Set<string>();
    const validatedItems: Array<{
      productId: string;
      quantity: number;
    }> = [];

    for (const item of items) {
      if (!item.productId || typeof item.productId !== "string") {
        return NextResponse.json({ error: "Each item must have a productId" }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
        return NextResponse.json(
          { error: `Quantity for item must be between 1 and ${MAX_QUANTITY}` },
          { status: 400 }
        );
      }
      if (seenProducts.has(item.productId)) {
        // merge duplicates
        const existing = validatedItems.find((v) => v.productId === item.productId);
        if (existing) existing.quantity += qty;
      } else {
        seenProducts.add(item.productId);
        validatedItems.push({ productId: item.productId, quantity: qty });
      }
    }

    // Build order inside a transaction with atomic stock decrement
    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: Array<{
        productId: string;
        quantity: number;
        price: number;
        titleSnapshot: string;
        priceSnapshot: number;
        imageSnapshot: string | null;
        sellerIdSnapshot: string;
        stockReserved: boolean;
      }> = [];
      const productTitles: string[] = [];

      for (const item of validatedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { images: { where: { isPrimary: true }, take: 1 } },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (product.status !== "ACTIVE") {
          throw new Error(`Product "${product.title}" is not available`);
        }

        // Atomic stock check and decrement
        const effectivePrice = product.discountPrice !== null && Number(product.discountPrice) > 0
          ? Number(product.discountPrice)
          : Number(product.price);

        const updated = await tx.product.updateMany({
          where: {
            id: product.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error(`Insufficient stock for "${product.title}"`);
        }

        subtotal += effectivePrice * item.quantity;
        productTitles.push(product.title);

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: effectivePrice,
          titleSnapshot: product.title,
          priceSnapshot: effectivePrice,
          imageSnapshot: product.images[0]?.url ?? null,
          sellerIdSnapshot: product.sellerId,
          stockReserved: true,
        });
      }

      const totalAmount = subtotal; // could add shippingFee, discounts later
      const isCod = paymentMethod === "cod" || paymentMethod === "cash_on_delivery" || !isKhaltiConfigured();
      const reservationExpiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

      // Generate a unique order number (UUID-based to prevent collisions)
      const { randomBytes } = await import("crypto");
      const suffix = randomBytes(4).toString("hex").toUpperCase();
      const orderNumber = `LUC-${Date.now().toString().slice(-6)}-${suffix}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          status: "PENDING",
          paymentProvider: isCod ? "cod" : "khalti",
          paymentStatus: "UNPAID",
          subtotal,
          totalAmount,
          shippingAddress,
          contactPhone,
          notes,
          reservationExpiresAt,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      });

      // Log order event
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          actorId: session.user.id,
          actorRole: "customer",
          event: "order_created",
          note: "Order placed",
        },
      });

      return { order, isCod, totalAmount };
    });

    const { order, isCod, totalAmount } = orderResult;

    if (isCod) {
      return NextResponse.json(
        { order, paymentMethod: "cod", message: "Order placed successfully with Cash on Delivery" },
        { status: 201 }
      );
    }

    // Hand off to Khalti
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;

    try {
      const payment = await initiateKhaltiPayment({
        return_url: `${appUrl}/api/payment/khalti/return`,
        website_url: appUrl,
        amount: toPaisa(totalAmount),
        purchase_order_id: order.id,
        purchase_order_name: order.items[0]?.titleSnapshot || order.orderNumber,
        customer_info: {
          name: session.user.name,
          email: session.user.email,
          phone: toKhaltiPhone(contactPhone),
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentRef: payment.pidx },
      });

      return NextResponse.json(
        { order, paymentUrl: payment.payment_url, pidx: payment.pidx },
        { status: 201 }
      );
    } catch (paymentError) {
      console.warn("Khalti initiation failed, falling back to COD:", paymentError);
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { paymentProvider: "cod" },
        include: {
          items: {
            include: {
              product: { include: { images: { take: 1 } } },
            },
          },
        },
      });
      return NextResponse.json(
        {
          order: updatedOrder,
          paymentMethod: "cod",
          fallback: true,
          message: "Khalti gateway unavailable, placed as Cash on Delivery",
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    if (message.includes("not found") || message.includes("not available") || message.includes("Insufficient stock")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: session.user.id },
        include: {
          items: {
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { customerId: session.user.id } }),
    ]);

    return NextResponse.json({ orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
