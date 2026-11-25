import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const verifiedOnly = searchParams.get("verified") === "true";

    const where: any = {};
    if (verifiedOnly) {
      where.isVerified = true;
    }
    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }

    const shops = await prisma.sellerProfile.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          where: { status: "ACTIVE" },
          take: 3,
          include: {
            images: { take: 1 },
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}
