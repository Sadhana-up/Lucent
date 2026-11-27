import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseStockQuantity } from "@/lib/utils";
import { lazySweepExpiredReservations } from "@/lib/inventory";

export async function GET(request: NextRequest) {
  try {
    // Reservation expiry has no scheduler; throttle a sweep on public catalog traffic.
    void lazySweepExpiredReservations();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categorySlug = searchParams.get("category") || "";
    const skinType = searchParams.get("skinType") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "24")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      deletedAt: null,
      seller: { isVerified: true },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skinConcerns: { contains: search, mode: "insensitive" } },
        { ingredients: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (skinType) {
      where.skinType = { contains: skinType, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.price = priceFilter;
    }

    const orderBy: Record<string, string>[] = (() => {
      switch (sort) {
        case "price_asc": return [{ price: "asc" }];
        case "price_desc": return [{ price: "desc" }];
        case "oldest": return [{ createdAt: "asc" }];
        default: return [{ createdAt: "desc" }];
      }
    })();

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          category: { select: { id: true, name: true, slug: true } },
          seller: {
            select: {
              storeName: true,
              storeSlug: true,
              logo: true,
              isVerified: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => {
      const totalRating = p.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = p.reviews.length > 0 ? parseFloat((totalRating / p.reviews.length).toFixed(1)) : null;
      return {
        ...p,
        price: Number(p.price),
        discountPrice: p.discountPrice !== null ? Number(p.discountPrice) : null,
        avgRating,
        reviewCount: p.reviews.length,
      };
    });

    return NextResponse.json({ products: formatted, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!sellerProfile && userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: You must register as a seller before adding products." },
        { status: 403 }
      );
    }

    if (sellerProfile && !sellerProfile.isVerified && userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Your seller account is pending admin verification." },
        { status: 403 }
      );
    }

    let targetSellerId = sellerProfile?.id;
    if (!targetSellerId && userRole === "admin") {
      const firstVerified = await prisma.sellerProfile.findFirst({ where: { isVerified: true } });
      if (!firstVerified) {
        return NextResponse.json({ error: "No verified seller profile available" }, { status: 400 });
      }
      targetSellerId = firstVerified.id;
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
      images,
      status,
    } = body;

    if (!title?.trim() || !description?.trim() || price === undefined) {
      return NextResponse.json({ error: "Title, description, and price are required" }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }

    let parsedDiscount: number | null = null;
    if (discountPrice !== undefined && discountPrice !== null && discountPrice !== "") {
      parsedDiscount = parseFloat(discountPrice);
      if (isNaN(parsedDiscount) || parsedDiscount <= 0) parsedDiscount = null;
      if (parsedDiscount !== null && parsedDiscount >= parsedPrice) {
        return NextResponse.json({ error: "Discount price must be less than price" }, { status: 400 });
      }
    }

    const parsedStock = stock === undefined || stock === null || stock === "" ? 0 : parseStockQuantity(stock);
    if (parsedStock === null) {
      return NextResponse.json({ error: "Stock quantity must be a whole number of 0 or more" }, { status: 400 });
    }

    // Validate status — gate unverified sellers to DRAFT only
    const allowedStatuses = ["ACTIVE", "DRAFT", "OUT_OF_STOCK"];
    const resolvedStatus = allowedStatuses.includes(status) ? status : "ACTIVE";
    if (resolvedStatus === "ACTIVE" && userRole !== "admin" && !sellerProfile?.isVerified) {
      return NextResponse.json({ error: "Only verified sellers can publish active products" }, { status: 403 });
    }

    // Generate unique slug
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug;
    let count = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const product = await prisma.product.create({
      data: {
        sellerId: targetSellerId!,
        categoryId: categoryId || null,
        title: title.trim(),
        slug,
        description: description.trim(),
        price: parsedPrice,
        discountPrice: parsedDiscount,
        stock: parsedStock,
        skinType: skinType || null,
        skinConcerns: skinConcerns || null,
        ingredients: ingredients || null,
        usageInstructions: usageInstructions || null,
        status: resolvedStatus,
        publishedAt: resolvedStatus === "ACTIVE" ? new Date() : null,
        images: {
          create: (images || []).map((url: string, index: number) => ({
            url,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
