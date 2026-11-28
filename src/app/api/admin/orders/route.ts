import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// Admin orders management: GET list with full items, customer, and tracking info
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.trim() || "";
    const refundStatus = searchParams.get("refundStatus") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (refundStatus) where.refundStatus = refundStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
        { contactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true, image: true } },
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { sortOrder: "asc" } },
                  seller: { select: { storeName: true, storeSlug: true } },
                },
              },
            },
          },
          events: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// Admin update order: status, tracking, payment, refunds
export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.orderId) {
      return NextResponse.json({ error: "Missing orderId in request body" }, { status: 400 });
    }

    const { orderId, status, paymentStatus, refundStatus, trackingNumber, carrier, note } = body;

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const now = new Date();

    if (status && status !== existing.status) {
      updateData.status = status;
      if (status === "CONFIRMED") updateData.confirmedAt = now;
      if (status === "SHIPPED") updateData.shippedAt = now;
      if (status === "DELIVERED") updateData.deliveredAt = now;
      if (status === "CANCELLED") {
        updateData.cancelledAt = now;
        updateData.cancelReason = note || "Cancelled by admin";
      }
    }

    if (paymentStatus && paymentStatus !== existing.paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === "PAID" && !existing.paidAt) {
        updateData.paidAt = now;
      }
    }

    if (refundStatus && refundStatus !== existing.refundStatus) {
      updateData.refundStatus = refundStatus;
      if (refundStatus === "REFUNDED") {
        updateData.refundedAt = now;
        updateData.refundReason = note || "Refund approved by admin";
      }
    }

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (carrier !== undefined) updateData.carrier = carrier;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true, image: true } },
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { sortOrder: "asc" } },
                seller: { select: { storeName: true, storeSlug: true } },
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // Record order audit event
    await prisma.orderEvent.create({
      data: {
        orderId,
        actorId: session.user.id,
        actorRole: "admin",
        event: status ? `admin_status_${status.toLowerCase()}` : "admin_update",
        note: note || `Order updated by admin (${session.user.name || session.user.email})`,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating admin order:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
