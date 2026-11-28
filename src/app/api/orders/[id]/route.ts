import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  canCancelOrder,
  canRequestReturn,
  canRequestRefund,
} from "@/lib/orders";
import { releaseOrderStock } from "@/lib/inventory";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
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
                images: { orderBy: { sortOrder: "asc" } },
                seller: {
                  select: { storeName: true, storeSlug: true, logo: true },
                },
              },
            },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    const isOwner = order.customerId === session.user.id;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      // Check if this user is a seller of one of the items
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      const isSeller =
        sellerProfile &&
        order.items.some((i) => i.product.sellerId === sellerProfile.id);
      if (!isSeller) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    const isOwner = existing.customerId === session.user.id;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Owner-only action-based handler
    const action: string = body.action ?? "";
    const reason: string = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
    const now = new Date();
    const updateData: Record<string, unknown> = {};
    let eventNote = "";

    if (action === "cancel" || action === "CANCEL") {
      if (!isAdmin && !canCancelOrder(existing)) {
        return NextResponse.json(
          { error: "This order cannot be cancelled at this stage." },
          { status: 400 }
        );
      }
      updateData.status = "CANCELLED";
      updateData.cancelledAt = now;
      updateData.cancelReason = reason || "Cancelled by customer";
      if (existing.paymentStatus === "PAID") {
        updateData.refundStatus = "REQUESTED";
        updateData.refundReason = reason || "Cancelled order refund";
        updateData.refundRequestedAt = now;
      }
      eventNote = `Order cancelled by ${isAdmin ? "admin" : "customer"}`;
    } else if (action === "request_return") {
      if (!canRequestReturn(existing)) {
        return NextResponse.json(
          { error: "Return can only be requested for delivered orders." },
          { status: 400 }
        );
      }
      updateData.status = "RETURN_REQUESTED";
      updateData.returnRequestedAt = now;
      updateData.returnReason = reason;
      if (existing.paymentStatus === "PAID") {
        updateData.refundStatus = "REQUESTED";
        updateData.refundRequestedAt = now;
        updateData.refundReason = reason || "Return requested";
      }
      eventNote = "Return requested by customer";
    } else if (action === "request_refund") {
      const orderForRefund = {
        status: existing.status,
        paymentStatus: String(existing.paymentStatus),
        refundStatus: existing.refundStatus,
      };
      if (!canRequestRefund(orderForRefund)) {
        return NextResponse.json(
          { error: "Refund cannot be requested at this stage." },
          { status: 400 }
        );
      }
      updateData.refundStatus = "REQUESTED";
      updateData.refundReason = reason;
      updateData.refundRequestedAt = now;
      eventNote = "Refund requested by customer";
    } else if (isAdmin && body.status) {
      // Admin can directly set status
      updateData.status = body.status;
      eventNote = `Status set to ${body.status} by admin`;
    } else {
      return NextResponse.json(
        { error: "Invalid or unsupported action." },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    if (action === "cancel" || action === "CANCEL") {
      await releaseOrderStock(id);
    }

    // Record order event
    await prisma.orderEvent.create({
      data: {
        orderId: id,
        actorId: session.user.id,
        actorRole: isAdmin ? "admin" : "customer",
        event: action || "status_update",
        note: eventNote,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
