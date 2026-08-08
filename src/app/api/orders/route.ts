import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateNepaliPhone } from "@/lib/utils";

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

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const orderNumber = `LUC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: session.user.id,
        status: "PENDING",
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

    return NextResponse.json(order, { status: 201 });
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
