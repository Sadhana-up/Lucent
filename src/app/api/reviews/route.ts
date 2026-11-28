import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/reviews?productId=xxx — ungated read (uses gated route for writes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST is handled by the gated /api/products/[slug]/reviews route.
// This stub redirects to the correct endpoint or returns guidance.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Use POST /api/products/[slug]/reviews to submit a review. Verified purchase required.",
      hint: "Endpoint: POST /api/products/{productSlug}/reviews",
    },
    { status: 410 }
  );
}
