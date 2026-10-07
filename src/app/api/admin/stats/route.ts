import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      usersByRole,
      newUsersLast7Days,
      unverifiedSellers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      ordersByStatus,
      revenueAgg,
      revenueExcludingCancelled,
      newOrdersLast7Days,
      totalCategories,
      totalReviews,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.sellerProfile.count({ where: { isVerified: false } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, _count: { _all: true } }),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
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
          createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      }),
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const usersByRoleMap: Record<string, number> = {};
    for (const row of usersByRole) {
      usersByRoleMap[row.role] = row._count._all;
    }

    const ordersByStatusMap: Record<string, number> = {};
    for (const row of ordersByStatus) {
      ordersByStatusMap[row.status] = row._count._all;
    }

    return Response.json({
      generatedAt: new Date().toISOString(),
      adminEmail: session.user.email,
      users: {
        total: usersByRole.reduce((sum, row) => sum + row._count._all, 0),
        byRole: usersByRoleMap,
        newLast7Days: newUsersLast7Days,
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
        newLast7Days: newOrdersLast7Days,
        revenue: revenueAgg._sum.totalAmount ?? 0,
        revenueExcludingCancelled: revenueExcludingCancelled._sum.totalAmount ?? 0,
      },
      reviews: { total: totalReviews },
      recentOrders,
      recentUsers,
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
