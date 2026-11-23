import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateNepaliPhone } from "@/lib/utils";
import {
  initiateKhaltiPayment,
  KhaltiError,
  toKhaltiPhone,
  toPaisa,
} from "@/lib/khalti";
import {
  InventoryError,
  RESERVATION_TTL_MS,
  releaseExpiredReservations,
  releaseOrderStock,
} from "@/lib/inventory";
import { MAX_QUANTITY_PER_PRODUCT } from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, contactPhone, notes } = body;

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

    await releaseExpiredReservations();

    const quantities = new Map<string, number>();
    for (const item of items) {
      const productId =
        typeof item?.productId === "string" ? item.productId.trim() : "";
      if (!productId) {
        return NextResponse.json(
          { error: "Each item must reference a product" },
          { status: 400 },
        );
      }

      const quantity = Number(item?.quantity);
      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > MAX_QUANTITY_PER_PRODUCT
      ) {
        return NextResponse.json(
          {
            error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_PRODUCT} per product`,
          },
          { status: 400 },
        );
      }

      const combined = (quantities.get(productId) ?? 0) + quantity;
      if (combined > MAX_QUANTITY_PER_PRODUCT) {
        return NextResponse.json(
          {
            error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_PRODUCT} per product`,
          },
          { status: 400 },
        );
      }
      quantities.set(productId, combined);
    }

    const orderResult = await prisma
      .$transaction(async (tx) => {
        let totalAmount = 0;
        const orderItemsData: {
          productId: string;
          quantity: number;
          price: number;
          stockReserved: boolean;
        }[] = [];
        const productTitles: string[] = [];

        for (const [productId, quantity] of quantities) {
          const product = await tx.product.findUnique({
            where: { id: productId },
          });

          if (!product || product.status !== "ACTIVE") {
            throw new InventoryError(
              "One or more products are no longer available.",
              409,
            );
          }

          if (product.stock < quantity) {
            throw new InventoryError(
              `Only ${product.stock} left for ${product.title}.`,
              409,
            );
          }

          const reserved = await tx.product.updateMany({
            where: {
              id: productId,
              status: "ACTIVE",
              stock: { gte: quantity },
            },
            data: { stock: { decrement: quantity } },
          });

          if (reserved.count !== 1) {
            throw new InventoryError(
              `Only ${product.stock} left for ${product.title}.`,
              409,
            );
          }

          const price = product.discountPrice ?? product.price;
          totalAmount += price * quantity;
          productTitles.push(product.title);
          orderItemsData.push({
            productId,
            quantity,
            price,
            stockReserved: true,
          });
        }

        const orderNumber = `LUC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        return tx.order.create({
          data: {
            orderNumber,
            customerId: session.user.id,
            status: "PENDING",
            paymentProvider: "khalti",
            paymentStatus: "UNPAID",
            totalAmount,
            shippingAddress,
            contactPhone,
            notes,
            reservationExpiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
            items: { create: orderItemsData },
          },
          include: {
            items: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        });
      })
      .then((order) => ({ order }))
      .catch((error: unknown) => {
        if (error instanceof InventoryError) {
          return {
            error: NextResponse.json(
              { error: error.message },
              { status: error.status },
            ),
          };
        }
        throw error;
      });

    if ("error" in orderResult) {
      return orderResult.error;
    }

    const { order } = orderResult;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;

    try {
      const payment = await initiateKhaltiPayment({
        return_url: `${appUrl}/api/payment/khalti/return`,
        website_url: appUrl,
        amount: toPaisa(order.totalAmount),
        purchase_order_id: order.id,
        purchase_order_name: order.items[0]?.product.title ?? order.orderNumber,
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
        { status: 201 },
      );
    } catch (paymentError) {
      await releaseOrderStock(order.id);
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {});

      console.error("Error initiating Khalti payment:", paymentError);
      const status = paymentError instanceof KhaltiError ? paymentError.status : 502;
      return NextResponse.json(
        { error: "Unable to start payment. Please try again." },
        { status: status >= 400 && status < 600 ? status : 502 },
      );
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json({ error: "Failed to fetch user orders" }, { status: 500 });
  }
}
