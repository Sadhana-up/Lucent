import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, image: true },
        },
        items: {
          include: {
            product: {
              include: {
                images: true,
                seller: {
                  select: { storeName: true, storeSlug: true, logo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    const isOwner = order.customerId === session.user.id;
    const isSeller = order.items.some(
      (item) => item.product.seller?.storeSlug && (session.user as any).sellerProfile?.id === item.product.sellerId
    );

    if (!isOwner && userRole !== "admin" && !isSeller) {
      // Check seller profile if needed
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
      });
      const sellerOwnsItem = sellerProfile && order.items.some((i) => i.product.sellerId === sellerProfile.id);
      if (!sellerOwnsItem) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus } = body;

    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    const isOwner = existing.customerId === session.user.id;

    // Customers can only cancel their own order if still PENDING
    if (isOwner && userRole !== "admin" && userRole !== "seller") {
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "Customers can only cancel orders" }, { status: 403 });
      }
      if (existing.status !== "PENDING") {
        return NextResponse.json({ error: "Cannot cancel an order that is already being processed" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
