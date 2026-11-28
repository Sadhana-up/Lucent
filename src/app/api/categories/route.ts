import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";

const DEFAULT_CATEGORIES = [
  { name: "Cleansers & Washes", slug: "cleansers", description: "Gentle daily cleansers, foaming washes, and oil cleansers.", sortOrder: 1 },
  { name: "Serums & Treatments", slug: "serums", description: "Targeted serums for acne, hyperpigmentation, and aging.", sortOrder: 2 },
  { name: "Moisturizers & Creams", slug: "moisturizers", description: "Hydrating creams, light gels, and barrier repair lotions.", sortOrder: 3 },
  { name: "Sunscreens & SPF", slug: "sunscreens", description: "Broad-spectrum mineral and chemical daily sunscreens.", sortOrder: 4 },
  { name: "Toners & Essences", slug: "toners", description: "Balancing toners and hydrating essences.", sortOrder: 5 },
  { name: "Exfoliants & Masks", slug: "masks-exfoliants", description: "AHA/BHA chemical exfoliants and clay masks.", sortOrder: 6 },
];

export async function GET() {
  try {
    let categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } } },
    });

    // Seed defaults if empty (idempotent — only runs once)
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        });
      }
      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } } },
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Admin-only
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, image, sortOrder } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    // Check for duplicate
    const existing = await prisma.category.findFirst({ where: { OR: [{ slug }, { name }] } });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        image: image || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const body = await request.json();
    const { id, name, description, image, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category id is required" }, { status: 400 });
    }

    // Soft delete — just disable
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
