import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;
    const verified = searchParams.get("verified");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (verified === "true") where.isVerified = true;
    if (verified === "false") where.isVerified = false;
    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.sellerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
          _count: { select: { products: true } },
        },
        orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.sellerProfile.count({ where }),
    ]);

    return NextResponse.json({ sellers, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Error fetching admin sellers:", err);
    return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const body = await request.json();
    const { sellerId, isVerified, action } = body;

    if (!sellerId) {
      return NextResponse.json({ error: "sellerId is required" }, { status: 400 });
    }

    if (typeof isVerified === "boolean" || action === "verify" || action === "unverify") {
      const newVerified = action === "verify" ? true : action === "unverify" ? false : Boolean(isVerified);

      const updated = await prisma.sellerProfile.update({
        where: { id: sellerId },
        data: {
          isVerified: newVerified,
          verifiedAt: newVerified ? new Date() : null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: newVerified ? "verify_seller" : "unverify_seller",
          target: `seller:${sellerId}`,
          metadata: { storeName: updated.storeName },
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Error updating seller verification:", err);
    return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 });
  }
}
