import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const sellers = await prisma.sellerProfile.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(sellers);
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
    const { sellerId, isVerified } = body;

    if (!sellerId || typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "sellerId and isVerified boolean are required" }, { status: 400 });
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { isVerified },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating seller verification:", err);
    return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 });
  }
}
