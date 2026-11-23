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

    // Calculate total amount & verify items
    let totalAmount = 0;
    const orderItemsData = [];
    const productTitles: string[] = [];

    for (const item of items) {
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: "Each item must have a valid quantity" },
          { status: 400 },
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const price = product.discountPrice ?? product.price;
      totalAmount += price * quantity;
      productTitles.push(product.title);

      orderItemsData.push({
        productId: product.id,
        quantity,
        price,
      });
    }

    const orderNumber = `LUC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
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
        items: {
          create: orderItemsData,
        },
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

    // Hand off to Khalti. The order stays PENDING/UNPAID until the return
    // callback is verified against Khalti's lookup API.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;

    try {
      const payment = await initiateKhaltiPayment({
        return_url: `${appUrl}/api/payment/khalti/return`,
        website_url: appUrl,
        amount: toPaisa(totalAmount),
        purchase_order_id: order.id,
        purchase_order_name: productTitles[0] || orderNumber,
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
      // Nothing was charged, so remove the pending order instead of leaving
      // an unpaid order behind.
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
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
