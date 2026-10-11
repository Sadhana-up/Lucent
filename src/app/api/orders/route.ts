import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateNepaliPhone } from "@/lib/utils";
import {
  sendNewOrderSellerEmail,
  type SellerOrderEmailItem,
} from "@/lib/email";

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
    const sellerNotifications = new Map<
      string,
      { to: string; storeName: string; items: SellerOrderEmailItem[] }
    >();

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { seller: { include: { user: true } } },
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

      // Group purchased items by seller so each seller only hears about their
      // own products.
      const seller = product.seller;
      const recipient = seller.contactEmail || seller.user?.email;
      if (recipient) {
        const group = sellerNotifications.get(seller.id) ?? {
          to: recipient,
          storeName: seller.storeName,
          items: [],
        };
        group.items.push({
          title: product.title,
          quantity: item.quantity,
          price: product.price,
        });
        sellerNotifications.set(seller.id, group);
      }
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

    // Notify each seller that their product was purchased. Failures are
    // logged but never block the order from being created.
    if (sellerNotifications.size > 0) {
      const buyerName = session.user.name || "A customer";
      const buyerEmail = session.user.email;

      await Promise.all(
        Array.from(sellerNotifications.values()).map((notification) =>
          sendNewOrderSellerEmail({
            to: notification.to,
            storeName: notification.storeName,
            orderNumber,
            items: notification.items,
            buyerName,
            buyerEmail,
            contactPhone,
            shippingAddress,
            notes,
          }).catch((error: unknown) => {
            console.error("[Email Delivery Error] new_order_seller", {
              orderNumber,
              to: notification.to,
              error,
            });
          }),
        ),
      );
    }

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
