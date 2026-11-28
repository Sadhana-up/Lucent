import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Server-side cart endpoints

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
                seller: { select: { storeName: true, storeSlug: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }

    // Revalidate prices and stock
    const items = cart.items.map((item) => ({
      ...item,
      effectivePrice:
        item.product.discountPrice !== null && Number(item.product.discountPrice) > 0
          ? Number(item.product.discountPrice)
          : Number(item.product.price),
      inStock: item.product.stock >= item.quantity,
      product: {
        ...item.product,
        price: Number(item.product.price),
        discountPrice: item.product.discountPrice !== null ? Number(item.product.discountPrice) : null,
      },
    }));

    const total = items.reduce((sum, i) => sum + i.effectivePrice * i.quantity, 0);

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { productId, quantity = 1 } = body ?? {};

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return NextResponse.json({ error: "Quantity must be between 1 and 20" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true, stock: true },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product not available" }, { status: 400 });
    }

    // Upsert cart
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    // Check if item already in cart
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > 20) {
        return NextResponse.json({ error: "Maximum 20 of any item" }, { status: 400 });
      }
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: qty },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { itemId, quantity } = body ?? {};

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const qty = Number(quantity);
    if (qty < 1) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: Math.min(20, qty) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const clearAll = searchParams.get("clear") === "true";

    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) return NextResponse.json({ success: true });

    if (clearAll) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } else if (itemId) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    } else {
      return NextResponse.json({ error: "itemId or clear=true required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
