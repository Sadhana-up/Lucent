import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const verifiedOnly = searchParams.get("verified") === "true";
    const category = searchParams.get("category")?.trim() || "";
    const sort = searchParams.get("sort") || "featured";

    const where: any = {};
    if (verifiedOnly) {
      where.isVerified = true;
    }
    if (category) {
      where.products = {
        some: {
          status: "ACTIVE",
          category: {
            slug: category,
          },
        },
      };
    }
    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        {
          products: {
            some: {
              status: "ACTIVE",
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const orderBy: any = [];
    if (sort === "newest") {
      orderBy.push({ createdAt: "desc" });
    } else if (sort === "name") {
      orderBy.push({ storeName: "asc" });
    } else {
      // featured / recommended default
      orderBy.push({ isVerified: "desc" }, { createdAt: "desc" });
    }

    const shops = await prisma.sellerProfile.findMany({
      where,
      include: {
        _count: {
          select: { products: { where: { status: "ACTIVE" } } },
        },
        products: {
          where: { status: "ACTIVE" },
          take: 4,
          include: {
            images: { take: 1, orderBy: { sortOrder: "asc" } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy,
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}
