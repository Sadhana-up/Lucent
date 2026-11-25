import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
        sellerProfile: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            isVerified: true,
          },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("Error fetching users for admin:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const body = await request.json();
    const { userId, role, banned, banReason } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (banned !== undefined) updateData.banned = Boolean(banned);
    if (banReason !== undefined) updateData.banReason = banReason;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banReason: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("Error updating user for admin:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
