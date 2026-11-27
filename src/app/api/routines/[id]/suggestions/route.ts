import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { catalogueProducts, getOwnedRoutine, getRoutineUser } from "@/lib/routine-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await getOwnedRoutine(id, user.id))) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  try {
    const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
    const [used, products, profile] = await Promise.all([
      prisma.routineStep.findMany({ where: { routineId: id }, select: { productId: true } }),
      catalogueProducts(search),
      prisma.user.findUnique({ where: { id: user.id }, select: { skinType: true, skinConcerns: true } }),
    ]);

    const usedIds = new Set(used.map((s) => s.productId));
    const skin = (profile?.skinType ?? "").toLowerCase();
    const concerns = (profile?.skinConcerns ?? "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const score = (p: (typeof products)[number]) => {
      const pSkin = (p.skinType ?? "").toLowerCase();
      const pConcerns = (p.skinConcerns ?? "").toLowerCase();
      return (skin && pSkin.includes(skin) ? 3 : 0) + concerns.reduce((n, c) => n + (pConcerns.includes(c) ? 1 : 0), 0);
    };

    const suggestions = products
      .filter((p) => !usedIds.has(p.id))
      .sort((a, b) => score(b) - score(a))
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: Number(p.price),
        discountPrice: p.discountPrice !== null ? Number(p.discountPrice) : null,
        image: p.images[0]?.url ?? null,
        category: p.category?.name ?? null,
        ingredients: p.ingredients,
        skinType: p.skinType,
        skinConcerns: p.skinConcerns,
        matchScore: score(p),
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error loading routine suggestions:", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
