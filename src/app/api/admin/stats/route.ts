import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") ?? "7")));
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [
      usersByRole,
      newUsers,
      unverifiedSellers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      ordersByStatus,
      revenueAgg,
      revenueExcludingCancelled,
      newOrders,
      totalCategories,
      totalReviews,
      recentOrders,
      recentUsers,
      pendingRefunds,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count({ where: { createdAt: { gte: sinceDate } } }),
      prisma.sellerProfile.count({ where: { isVerified: false } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.product.count({ where: { stock: { lte: 5 }, deletedAt: null } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] }, paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: sinceDate } } }),
      prisma.category.count(),
      prisma.review.count(),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          paymentStatus: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      }),
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.order.count({ where: { refundStatus: "REQUESTED" } }),
    ]);

    const usersByRoleMap: Record<string, number> = {};
    for (const row of usersByRole) {
      usersByRoleMap[row.role] = row._count._all;
    }

    const ordersByStatusMap: Record<string, number> = {};
    for (const row of ordersByStatus) {
      ordersByStatusMap[row.status] = row._count._all;
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      adminEmail: session.user.email,
      periodDays: days,
      users: {
        total: usersByRole.reduce((sum, row) => sum + row._count._all, 0),
        byRole: usersByRoleMap,
        newInPeriod: newUsers,
        unverifiedSellers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        categories: totalCategories,
      },
      orders: {
        total: revenueAgg._count._all,
        byStatus: ordersByStatusMap,
        newInPeriod: newOrders,
        // Only count PAID orders as revenue
        revenue: Number(revenueAgg._sum.totalAmount ?? 0),
        revenueExcludingCancelled: Number(revenueExcludingCancelled._sum.totalAmount ?? 0),
        pendingRefunds,
      },
      reviews: { total: totalReviews },
      recentOrders: recentOrders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
      recentUsers,
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
