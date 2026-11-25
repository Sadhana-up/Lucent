import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const shop = await prisma.sellerProfile.findUnique({
      where: { storeSlug: slug },
      include: {
        user: {
          select: { name: true, image: true, email: true },
        },
        products: {
          where: { status: "ACTIVE" },
          include: {
            images: true,
            category: true,
            reviews: {
              select: { rating: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Calculate store rating from its products' reviews
    let totalReviews = 0;
    let sumRatings = 0;
    const formattedProducts = shop.products.map((p) => {
      const pTotal = p.reviews.reduce((acc, r) => acc + r.rating, 0);
      const pAvg = p.reviews.length > 0 ? parseFloat((pTotal / p.reviews.length).toFixed(1)) : null;
      if (p.reviews.length > 0) {
        totalReviews += p.reviews.length;
        sumRatings += pTotal;
      }
      return {
        ...p,
        avgRating: pAvg,
        reviewCount: p.reviews.length,
      };
    });

    const storeAvgRating = totalReviews > 0 ? parseFloat((sumRatings / totalReviews).toFixed(1)) : null;

    return NextResponse.json({
      ...shop,
      products: formattedProducts,
      totalProducts: shop.products.length,
      avgRating: storeAvgRating,
      totalReviews,
    });
  } catch (error) {
    console.error("Error fetching shop detail:", error);
    return NextResponse.json({ error: "Failed to fetch shop details" }, { status: 500 });
  }
}
