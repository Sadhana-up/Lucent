import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseStockQuantity } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const { slug } = await params;

    // For seller editing: allow fetching any status if logged-in seller owns it
    const userRole = (session?.user as { role?: string } | null)?.role;
    const isSeller = userRole === "seller" || userRole === "admin";

    // Build where clause
    const whereBase = {
      OR: [{ slug }, { id: slug }],
      deletedAt: null,
    };
    const where = isSeller ? whereBase : { ...whereBase, status: "ACTIVE" };

    const product = await prisma.product.findFirst({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        seller: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        reviews: {
          include: {
            user: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If seller, verify they own this product
    if (isSeller && userRole !== "admin" && session?.user) {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (sellerProfile && product.sellerId !== sellerProfile.id) {
        // Not owner — only return if ACTIVE
        if (product.status !== "ACTIVE") {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
      }
    }

    const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = product.reviews.length > 0 ? parseFloat((totalRating / product.reviews.length).toFixed(1)) : null;

    return NextResponse.json({
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice !== null ? Number(product.discountPrice) : null,
      avgRating,
      reviewCount: product.reviews.length,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        deletedAt: null,
      },
      include: { seller: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (existing.seller.userId !== session.user.id && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const parsedStock =
      stock === undefined
        ? existing.stock
        : stock === null || stock === ""
          ? 0
          : parseStockQuantity(stock);

    if (parsedStock === null) {
      return NextResponse.json({ error: "Stock quantity must be a whole number of 0 or more" }, { status: 400 });
    }

    let parsedPrice = existing.price;
    if (price !== undefined) {
      parsedPrice = parseFloat(price) as unknown as typeof existing.price;
      if (isNaN(Number(parsedPrice)) || Number(parsedPrice) <= 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
    }

    let parsedDiscount = existing.discountPrice;
    if (discountPrice !== undefined) {
      parsedDiscount = discountPrice ? parseFloat(discountPrice) as unknown as typeof existing.discountPrice : null;
    }

    // Handle images update if provided — only delete if new images are provided
    if (images && Array.isArray(images) && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      await prisma.productImage.createMany({
        data: images.map((url: string, index: number) => ({
          productId: existing.id,
          url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      });
    }

    // Determine new status — automatically sync OUT_OF_STOCK with stock quantity
    let newStatus = status !== undefined ? status : existing.status;
    if (parsedStock === 0) {
      newStatus = "OUT_OF_STOCK";
    } else if (newStatus === "OUT_OF_STOCK" && parsedStock > 0 && status === undefined) {
      newStatus = existing.seller.isVerified || userRole === "admin" ? "ACTIVE" : "DRAFT";
    }

    if (newStatus === "ACTIVE" && !existing.seller.isVerified && userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Unverified sellers cannot publish active products" },
        { status: 403 },
      );
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        description: description !== undefined ? String(description).trim() : existing.description,
        price: parsedPrice,
        discountPrice: parsedDiscount,
        stock: parsedStock,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        skinType: skinType !== undefined ? skinType : existing.skinType,
        skinConcerns: skinConcerns !== undefined ? skinConcerns : existing.skinConcerns,
        ingredients: ingredients !== undefined ? ingredients : existing.ingredients,
        usageInstructions: usageInstructions !== undefined ? usageInstructions : existing.usageInstructions,
        status: newStatus,
        publishedAt: newStatus === "ACTIVE" && existing.status !== "ACTIVE" ? new Date() : existing.publishedAt,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        deletedAt: null,
      },
      include: { seller: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (existing.seller.userId !== session.user.id && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete / archive — preserves order history
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        status: "ARCHIVED",
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Product archived successfully" });
  } catch (error) {
    console.error("Error archiving product:", error);
    return NextResponse.json({ error: "Failed to archive product" }, { status: 500 });
  }
}
