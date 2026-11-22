import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  ORDER_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  canCancelOrder,
  canRequestRefund,
  canRequestReturn,
} from "@/lib/orders";
import { notifyBuyerOrderUpdated } from "@/lib/order-notifications";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, customerId: userId },
    include: {
      customer: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            include: {
              images: true,
              seller: { select: { storeName: true, storeSlug: true } },
            },
          },
        },
      },
    },
  });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOwnedOrder(id, session.user.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOwnedOrder(id, session.user.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

    if (action === "cancel") {
      if (!canCancelOrder(order)) {
        return NextResponse.json(
          { error: "This order can no longer be cancelled." },
          { status: 400 },
        );
      }

      const paid = order.paymentStatus === "PAID";
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason || null,
          ...(paid
            ? {
                refundStatus: "REQUESTED",
                refundReason: reason || "Order cancelled by buyer",
                refundRequestedAt: new Date(),
              }
            : {}),
        },
      });

      await notifyBuyerOrderUpdated(
        updated.id,
        ORDER_STATUS_LABELS[updated.status] ?? updated.status,
        REFUND_STATUS_LABELS[updated.refundStatus] ?? updated.refundStatus,
      );

      return NextResponse.json(updated);
    }

    if (action === "request_return") {
      if (!canRequestReturn(order)) {
        return NextResponse.json(
          { error: "Returns can only be requested for delivered orders." },
          { status: 400 },
        );
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "RETURN_REQUESTED",
          returnRequestedAt: new Date(),
          refundStatus: "REQUESTED",
          refundReason: reason || "Return requested by buyer",
          refundRequestedAt: new Date(),
        },
      });

      await notifyBuyerOrderUpdated(
        updated.id,
        ORDER_STATUS_LABELS[updated.status] ?? updated.status,
        REFUND_STATUS_LABELS[updated.refundStatus] ?? updated.refundStatus,
      );

      return NextResponse.json(updated);
    }

    if (action === "request_refund") {
      if (!canRequestRefund(order)) {
        return NextResponse.json(
          { error: "A refund cannot be requested for this order." },
          { status: 400 },
        );
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          refundStatus: "REQUESTED",
          refundReason: reason || "Refund requested by buyer",
          refundRequestedAt: new Date(),
        },
      });

      await notifyBuyerOrderUpdated(
        updated.id,
        ORDER_STATUS_LABELS[updated.status] ?? updated.status,
        REFUND_STATUS_LABELS[updated.refundStatus] ?? updated.refundStatus,
      );

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
