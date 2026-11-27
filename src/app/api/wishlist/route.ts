import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              seller: { select: { storeName: true, storeSlug: true, isVerified: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.wishlist.count({ where: { userId: session.user.id } }),
    ]);

    const formatted = items.map((w) => {
      const ratings = w.product.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      return {
        ...w,
        product: {
          ...w.product,
          price: Number(w.product.price),
          discountPrice: w.product.discountPrice !== null ? Number(w.product.discountPrice) : null,
          avgRating: avgRating !== null ? parseFloat(avgRating.toFixed(1)) : null,
          reviewCount: ratings.length,
        },
      };
    });

    return NextResponse.json({ items: formatted, total, page, limit });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { productId } = body ?? {};

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });

    if (existing) {
      // Toggle off
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ wishlisted: false });
    }

    await prisma.wishlist.create({
      data: { userId: session.user.id, productId },
    });

    return NextResponse.json({ wishlisted: true });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
