import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Cleansers & Washes", slug: "cleansers", description: "Gentle daily cleansers, foaming washes, and oil cleansers." },
  { name: "Serums & Treatments", slug: "serums", description: "Targeted serums for acne, hyperpigmentation, and aging." },
  { name: "Moisturizers & Creams", slug: "moisturizers", description: "Hydrating creams, light gels, and barrier repair lotions." },
  { name: "Sunscreens & SPF", slug: "sunscreens", description: "Broad-spectrum mineral and chemical daily sunscreens." },
  { name: "Toners & Essences", slug: "toners", description: "Balancing toners and hydrating essences." },
  { name: "Exfoliants & Masks", slug: "masks-exfoliants", description: "AHA/BHA chemical exfoliants and clay masks." },
];

export async function GET() {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    if (categories.length === 0) {
      // Auto-seed default skincare categories
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        });
      }
      categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
