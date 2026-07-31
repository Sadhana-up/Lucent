import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categorySlug = searchParams.get("category") || "";
    const skinType = searchParams.get("skinType") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const where: any = {
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skinConcerns: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (skinType) {
      where.skinType = { contains: skinType, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
        category: true,
        seller: {
          select: {
            storeName: true,
            storeSlug: true,
            logo: true,
            isVerified: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform products with average rating
    const formatted = products.map((p) => {
      const totalRating = p.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = p.reviews.length > 0 ? (totalRating / p.reviews.length).toFixed(1) : null;

      return {
        ...p,
        avgRating: avgRating ? parseFloat(avgRating) : null,
        reviewCount: p.reviews.length,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "seller" && userRole !== "admin") {
      return NextResponse.json({ error: "Only sellers can create products" }, { status: 403 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "Seller profile not found. Please set up your store first." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      discountPrice,
      stock,
      categoryId,
      skinType,
      skinConcerns,
      ingredients,
      usageInstructions,
      images, // array of image URLs
      status,
    } = body;

    if (!title || !description || price === undefined) {
      return NextResponse.json({ error: "Title, description, and price are required" }, { status: 400 });
    }

    // Generate unique slug
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    let slug = baseSlug;
    let count = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const product = await prisma.product.create({
      data: {
        sellerId: sellerProfile.id,
        categoryId: categoryId || null,
        title,
        slug,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock || "0", 10),
        skinType,
        skinConcerns,
        ingredients,
        usageInstructions,
        status: status || "ACTIVE",
        images: {
          create: (images || []).map((url: string, index: number) => ({
            url,
            isPrimary: index === 0,
          })),
        },
      },
      include: {
        images: true,
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
