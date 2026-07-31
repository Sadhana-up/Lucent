import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        category: true,
        seller: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = product.reviews.length > 0 ? (totalRating / product.reviews.length).toFixed(1) : null;

    return NextResponse.json({
      ...product,
      avgRating: avgRating ? parseFloat(avgRating) : null,
      reviewCount: product.reviews.length,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const existing = await prisma.product.findUnique({
      where: { slug },
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

    // Handle images update if provided
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({
        where: { productId: existing.id },
      });
      await prisma.productImage.createMany({
        data: images.map((url: string, index: number) => ({
          productId: existing.id,
          url,
          isPrimary: index === 0,
        })),
      });
    }

    const updated = await prisma.product.update({
      where: { slug },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        discountPrice: discountPrice !== undefined ? (discountPrice ? parseFloat(discountPrice) : null) : existing.discountPrice,
        stock: stock !== undefined ? parseInt(stock, 10) : existing.stock,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        skinType: skinType !== undefined ? skinType : existing.skinType,
        skinConcerns: skinConcerns !== undefined ? skinConcerns : existing.skinConcerns,
        ingredients: ingredients !== undefined ? ingredients : existing.ingredients,
        usageInstructions: usageInstructions !== undefined ? usageInstructions : existing.usageInstructions,
        status: status !== undefined ? status : existing.status,
      },
      include: {
        images: true,
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const existing = await prisma.product.findUnique({
      where: { slug },
      include: { seller: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (existing.seller.userId !== session.user.id && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.product.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
