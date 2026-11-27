import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { lastNDays, todayKey } from "@/lib/routine";

export async function getRoutineUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function getOwnedRoutine(id: string, userId: string) {
  return prisma.routine.findFirst({ where: { id, userId } });
}

export async function serializeRoutine(routineId: string) {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              ingredients: true,
              skinType: true,
              skinConcerns: true,
              price: true,
              discountPrice: true,
              stock: true,
              status: true,
              deletedAt: true,
              images: { where: { isPrimary: true }, take: 1, orderBy: { sortOrder: "asc" } },
              category: { select: { name: true, slug: true } },
              seller: { select: { storeName: true, storeSlug: true, isVerified: true } },
            },
          },
        },
      },
    },
  });
  if (!routine) return null;

  const days = lastNDays(30);
  const completions = await prisma.routineCompletion.findMany({
    where: { stepId: { in: routine.steps.map((s) => s.id) }, day: { in: days } },
    select: { stepId: true, day: true },
  });
  const done = new Set(completions.map((c) => `${c.stepId}:${c.day}`));

  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    skinType: routine.skinType,
    concerns: routine.concerns,
    isArchived: routine.isArchived,
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
    steps: routine.steps.map((step) => ({
      id: step.id,
      productId: step.productId,
      timeOfDay: step.timeOfDay,
      stepOrder: step.stepOrder,
      notes: step.notes,
      titleSnapshot: step.titleSnapshot,
      imageSnapshot: step.imageSnapshot,
      priceSnapshot: Number(step.priceSnapshot),
      completedToday: done.has(`${step.id}:${todayKey()}`),
      product: step.product
        ? {
            ...step.product,
            price: Number(step.product.price),
            discountPrice: step.product.discountPrice !== null ? Number(step.product.discountPrice) : null,
            image: step.product.images[0]?.url ?? null,
          }
        : null,
    })),
    completions,
  };
}

export type CatalogueProduct = Awaited<ReturnType<typeof catalogueProducts>>[number];

export async function catalogueProducts(search = "") {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      seller: { isVerified: true },
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { skinConcerns: { contains: search, mode: "insensitive" as const } },
              { ingredients: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1, orderBy: { sortOrder: "asc" } },
      category: { select: { name: true, slug: true } },
      seller: { select: { storeName: true, storeSlug: true, isVerified: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
}

/** Pick a sensible starter routine from real catalogue products. */
export function templateSteps(
  products: CatalogueProduct[],
  profile: { skinType?: string | null; skinConcerns?: string | null },
): { productId: string; timeOfDay: string }[] {
  const skin = (profile.skinType ?? "").toLowerCase();
  const concerns = (profile.skinConcerns ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const score = (p: CatalogueProduct) => {
    const pSkin = (p.skinType ?? "").toLowerCase();
    const pConcerns = (p.skinConcerns ?? "").toLowerCase();
    return (skin && pSkin.includes(skin) ? 3 : 0) + concerns.reduce((n, c) => n + (pConcerns.includes(c) ? 1 : 0), 0);
  };

  const pick = (keywords: string[], used: Set<string>) =>
    [...products]
      .filter((p) => !used.has(p.id) && keywords.some((k) => `${p.title} ${p.category?.name ?? ""}`.toLowerCase().includes(k)))
      .sort((a, b) => score(b) - score(a))[0];

  const chosen: { productId: string; timeOfDay: string }[] = [];
  const used = new Set<string>();
  const plan: Array<[string[], string]> = [
    [["cleanser", "face wash"], "MORNING"],
    [["serum", "essence", "treatment"], "MORNING"],
    [["sunscreen", "spf"], "MORNING"],
    [["moisturizer", "moisturiser", "cream", "gel-lotion"], "EVENING"],
  ];
  for (const [keywords, timeOfDay] of plan) {
    const product = pick(keywords, used);
    if (product) {
      chosen.push({ productId: product.id, timeOfDay });
      used.add(product.id);
    }
  }
  if (chosen.length === 0) {
    for (const p of [...products].sort((a, b) => score(b) - score(a)).slice(0, 3)) {
      chosen.push({ productId: p.id, timeOfDay: "MORNING" });
    }
  }
  return chosen;
}

export async function addSteps(
  routineId: string,
  steps: { productId: string; timeOfDay: string; notes?: string | null }[],
) {
  const existing = await prisma.routineStep.findMany({ where: { routineId } });
  const seen = new Set(existing.map((s) => `${s.productId}:${s.timeOfDay}`));
  let order = existing.reduce((max, s) => Math.max(max, s.stepOrder), 0) + 1;
  for (const step of steps) {
    const timeOfDay = step.timeOfDay === "EVENING" ? "EVENING" : "MORNING";
    const key = `${step.productId}:${timeOfDay}`;
    if (seen.has(key)) continue;
    const product = await prisma.product.findUnique({
      where: { id: step.productId },
      include: { images: { where: { isPrimary: true }, take: 1, orderBy: { sortOrder: "asc" } } },
    });
    if (!product || product.deletedAt || product.status !== "ACTIVE") continue;
    seen.add(key);
    await prisma.routineStep.create({
      data: {
        routineId,
        productId: step.productId,
        timeOfDay,
        stepOrder: order++,
        notes: step.notes ?? null,
        titleSnapshot: product.title,
        imageSnapshot: product.images[0]?.url ?? null,
        priceSnapshot: product.price,
      },
    });
  }
  return serializeRoutine(routineId);
}
