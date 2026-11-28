import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const banned = searchParams.get("banned");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (banned === "true") where.banned = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          createdAt: true,
          onboardingCompleted: true,
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
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
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
    const { userId, action, role, banned, banReason, banExpires } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === session.user.id && (role !== undefined || banned === true)) {
      return NextResponse.json({ error: "Cannot modify your own role or ban status" }, { status: 400 });
    }

    if (action === "ban" || banned === true) {
      // Use Better Auth admin plugin to ban user (revokes sessions)
      const banResult = await auth.api.banUser({
        body: {
          userId,
          banReason: banReason || "Suspended by Administrator",
          banExpiresIn: banExpires ? Math.floor((new Date(banExpires).getTime() - Date.now()) / 1000) : undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ban_user",
          target: `user:${userId}`,
          metadata: { banReason, banExpires },
        },
      });

      return NextResponse.json({ success: true });
    } else if (action === "unban" || banned === false) {
      await auth.api.unbanUser({ body: { userId } });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "unban_user",
          target: `user:${userId}`,
        },
      });

      return NextResponse.json({ success: true });
    } else if (role !== undefined) {
      // Role whitelist
      const allowedRoles = ["customer", "seller", "admin"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Last admin protection
      if (role !== "admin") {
        const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (target?.role === "admin") {
          const adminCount = await prisma.user.count({ where: { role: "admin" } });
          if (adminCount <= 1) {
            return NextResponse.json({ error: "Cannot demote the last admin" }, { status: 400 });
          }
        }
      }

      await auth.api.setRole({ body: { userId, role }, headers: request.headers });

      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "set_role",
          target: `user:${userId}`,
          metadata: { newRole: role },
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, banned: true, banReason: true, createdAt: true },
      });

      return NextResponse.json(user);
    }

    return NextResponse.json({ error: "No valid action provided" }, { status: 400 });
  } catch (err) {
    console.error("Error updating user for admin:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
