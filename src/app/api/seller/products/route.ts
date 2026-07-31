import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: { sellerId: sellerProfile.id },
      include: {
        images: true,
        category: true,
        _count: {
          select: { orderItems: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
