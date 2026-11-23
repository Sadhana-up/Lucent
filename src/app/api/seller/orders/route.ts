import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  ORDER_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  canSellerMarkRefunded,
  canSellerReviewRefund,
  canSellerSetStatus,
  isTerminalOrderStatus,
  type SellerOrder,
} from "@/lib/orders";
import { notifyBuyerOrderUpdated } from "@/lib/order-notifications";

async function authorizeSeller(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { status: 401, error: "Unauthorized" } as const;
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "seller" && role !== "admin") {
    return { status: 403, error: "Seller access required" } as const;
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!sellerProfile) {
    return { status: 403, error: "Complete your store profile first" } as const;
  }

  return { sellerProfile } as const;
}

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authorizeSeller(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: { product: { sellerId: authResult.sellerProfile.id } },
        },
      },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          where: { product: { sellerId: authResult.sellerProfile.id } },
          include: {
            product: {
              include: { images: { select: { url: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result: SellerOrder[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      totalAmount: order.totalAmount,
      sellerSubtotal: order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      shippingAddress: order.shippingAddress,
      contactPhone: order.contactPhone,
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      cancelReason: order.cancelReason,
      refundStatus: order.refundStatus,
      refundReason: order.refundReason,
      refundRequestedAt: order.refundRequestedAt?.toISOString() ?? null,
      refundedAt: order.refundedAt?.toISOString() ?? null,
      returnRequestedAt: order.returnRequestedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customer: order.customer,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          images: item.product.images,
        },
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authorizeSeller(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const body = await request.json().catch(() => null);
    const orderId = cleanString(body?.orderId, 200);
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        items: { some: { product: { sellerId: authResult.sellerProfile.id } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const action = cleanString(body?.action, 40) ?? "set_status";
    const reason = cleanString(body?.reason, 1000);
    const trackingNumber = cleanString(body?.trackingNumber, 200);
    const carrier = cleanString(body?.carrier, 100);
    const data: Prisma.OrderUpdateInput = {};

    if (action === "set_status") {
      const status = cleanString(body?.status, 40) ?? "";
      if (!canSellerSetStatus(order.status, status)) {
        return NextResponse.json(
          { error: "That status change is not allowed for this order." },
          { status: 400 },
        );
      }

      data.status = status;
      if (status === "CANCELLED") {
        data.cancelledAt = new Date();
        data.cancelReason = reason ?? "Cancelled by seller";
        if (order.paymentStatus === "PAID") {
          data.refundStatus = "REQUESTED";
          data.refundReason = reason ?? "Order cancelled by seller";
          data.refundRequestedAt = new Date();
        }
      }
      if (trackingNumber) data.trackingNumber = trackingNumber;
      if (carrier) data.carrier = carrier;
    } else if (action === "update_tracking") {
      if (!trackingNumber) {
        return NextResponse.json(
          { error: "Tracking number is required" },
          { status: 400 },
        );
      }
      if (isTerminalOrderStatus(order.status)) {
        return NextResponse.json(
          { error: "Tracking cannot be updated for a closed order." },
          { status: 400 },
        );
      }
      data.trackingNumber = trackingNumber;
      if (carrier) data.carrier = carrier;
    } else if (action === "approve_return") {
      if (order.status !== "RETURN_REQUESTED") {
        return NextResponse.json(
          { error: "There is no return to approve." },
          { status: 400 },
        );
      }
      data.status = "RETURNED";
      if (canSellerReviewRefund(order.refundStatus)) {
        data.refundStatus = "APPROVED";
      }
    } else if (action === "reject_return") {
      if (order.status !== "RETURN_REQUESTED") {
        return NextResponse.json(
          { error: "There is no return to reject." },
          { status: 400 },
        );
      }
      data.status = "DELIVERED";
      data.refundStatus = "REJECTED";
      if (reason) data.refundReason = reason;
    } else if (action === "approve_refund") {
      if (!canSellerReviewRefund(order.refundStatus)) {
        return NextResponse.json(
          { error: "There is no refund request to review." },
          { status: 400 },
        );
      }
      data.refundStatus = "APPROVED";
      if (reason) data.refundReason = reason;
    } else if (action === "reject_refund") {
      if (!canSellerReviewRefund(order.refundStatus)) {
        return NextResponse.json(
          { error: "There is no refund request to review." },
          { status: 400 },
        );
      }
      data.refundStatus = "REJECTED";
      if (reason) data.refundReason = reason;
      if (order.status === "RETURN_REQUESTED") data.status = "DELIVERED";
    } else if (action === "mark_refunded") {
      if (!canSellerMarkRefunded(order.refundStatus)) {
        return NextResponse.json(
          { error: "Approve the refund before marking it as refunded." },
          { status: 400 },
        );
      }
      data.refundStatus = "REFUNDED";
      data.refundedAt = new Date();
      data.status = "REFUNDED";
    } else {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data,
    });

    await notifyBuyerOrderUpdated(
      updated.id,
      ORDER_STATUS_LABELS[updated.status] ?? updated.status,
      REFUND_STATUS_LABELS[updated.refundStatus] ?? updated.refundStatus,
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating seller order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
