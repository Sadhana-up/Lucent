import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!sellerProfile) {
      return NextResponse.json({ products: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = { sellerId: sellerProfile.id, deletedAt: null };
    if (status === "OUT_OF_STOCK") {
      where.OR = [{ status: "OUT_OF_STOCK" }, { stock: { lte: 0 } }];
    } else if (status === "ACTIVE") {
      where.status = "ACTIVE";
      where.stock = { gt: 0 };
    } else if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { orderItems: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
