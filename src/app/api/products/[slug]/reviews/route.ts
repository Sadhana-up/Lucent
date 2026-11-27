import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ slug: string }> };

async function hasVerifiedPurchase(userId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerId: userId,
      paymentStatus: "PAID",
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      items: { some: { productId } },
    },
    select: { id: true },
  });
  return Boolean(order);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { productId: product.id },
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const session = await auth.api.getSession({ headers: request.headers });
    let hasPurchased = false;
    let myReview: (typeof reviews)[number] | null = null;

    if (session?.user) {
      [hasPurchased, myReview] = await Promise.all([
        hasVerifiedPurchase(session.user.id, product.id),
        prisma.review.findFirst({
          where: { productId: product.id, userId: session.user.id },
          include: { user: { select: { name: true, image: true } } },
        }),
      ]);
    }

    return NextResponse.json({
      reviews,
      avgRating:
        aggregate._avg.rating !== null
          ? Number(aggregate._avg.rating.toFixed(1))
          : null,
      reviewCount: aggregate._count.rating,
      eligibility: {
        canReview: hasPurchased,
        hasPurchased,
        hasReviewed: Boolean(myReview),
        myReview,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = rateLimit(`review:${session.user.id}:${getClientIp(request)}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many review attempts. Please try again shortly." },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 2000) : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    const purchased = await hasVerifiedPurchase(session.user.id, product.id);
    if (!purchased) {
      return NextResponse.json(
        { error: "Only verified buyers can review this product." },
        { status: 403 }
      );
    }

    // Find the OrderItem to link to the review
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          customerId: session.user.id,
          paymentStatus: "PAID",
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      },
      select: { id: true },
    });

    const existing = await prisma.review.findFirst({
      where: { productId: product.id, userId: session.user.id },
    });

    const review = existing
      ? await prisma.review.update({
          where: { id: existing.id },
          data: { rating, comment: comment || null, isVerified: true },
        })
      : await prisma.review.create({
          data: {
            productId: product.id,
            userId: session.user.id,
            orderItemId: orderItem?.id ?? null,
            rating,
            comment: comment || null,
            isVerified: true,
          },
        });

    return NextResponse.json(review, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
