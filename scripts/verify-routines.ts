import assert from "node:assert";
import { prisma } from "../src/lib/prisma";
import { addSteps, serializeRoutine } from "../src/lib/routine-server";
import { analyseRoutine, streakFromDays, todayKey } from "../src/lib/routine";

async function run() {
  const t = Date.now();
  const user = await prisma.user.create({
    data: { name: "Routine Test", email: `routine-check-${t}@example.com`, role: "customer", skinType: "oily" },
  });
  const seller = await prisma.sellerProfile.create({
    data: { userId: user.id, storeName: "Routine Test Store", storeSlug: `routine-store-${t}` },
  });
  const category = await prisma.category.findFirst();
  const createProduct = (suffix: string, ingredients: string) =>
    prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: category?.id ?? null,
        title: `Routine Test ${suffix} ${t}`,
        slug: `routine-${suffix}-${t}`,
        description: "Routine verification product",
        price: 1000,
        stock: 10,
        status: "ACTIVE",
        skinType: "oily",
        skinConcerns: "acne",
        ingredients,
      },
    });
  const retinol = await createProduct("retinol", "Retinol, Glycolic Acid");
  const sunscreen = await createProduct("spf", "Zinc Oxide, SPF 50");

  try {
    const routine = await prisma.routine.create({
      data: { userId: user.id, name: `Test Routine ${t}`, skinType: "oily", concerns: "acne" },
    });

    await addSteps(routine.id, [
      { productId: retinol.id, timeOfDay: "MORNING" },
      { productId: sunscreen.id, timeOfDay: "MORNING" },
      { productId: retinol.id, timeOfDay: "MORNING" }, // duplicate must be ignored
    ]);

    const serialized = await serializeRoutine(routine.id);
    assert.ok(serialized, "Routine must be serializable");
    assert.strictEqual(serialized.steps.length, 2, "Duplicate step must not be added twice");
    assert.strictEqual(serialized.steps[0].titleSnapshot, retinol.title, "Step must snapshot its product title");
    assert.strictEqual(Number(serialized.steps[0].priceSnapshot), 1000);

    const analysis = analyseRoutine(
      serialized.steps.map((s) => ({
        id: s.id,
        timeOfDay: s.timeOfDay,
        titleSnapshot: s.titleSnapshot,
        product: { ingredients: s.product?.ingredients ?? null },
      })),
      "oily",
    );
    assert.ok(
      analysis.issues.some((i) => i.message.includes("Retinoids degrade in sunlight")),
      "Retinol in a morning routine must be flagged",
    );

    const stepId = serialized.steps[0].id;
    const day = todayKey();
    await prisma.routineCompletion.create({ data: { stepId, userId: user.id, day } });
    let duplicateRejected = false;
    try {
      await prisma.routineCompletion.create({ data: { stepId, userId: user.id, day } });
    } catch {
      duplicateRejected = true;
    }
    assert.strictEqual(duplicateRejected, true, "One check-off per step per day must be enforced");
    assert.strictEqual(streakFromDays([day]), 1, "Today's completion must count as a one-day streak");

    console.log("🎉 Routine persistence, snapshot, conflict audit and daily progress checks passed!");
  } finally {
    await prisma.routineCompletion.deleteMany({ where: { userId: user.id } });
    await prisma.routineStep.deleteMany({ where: { routineId: (await prisma.routine.findFirst({ where: { userId: user.id } }))?.id ?? "" } });
    await prisma.routine.deleteMany({ where: { userId: user.id } });
    await prisma.product.deleteMany({ where: { id: { in: [retinol.id, sunscreen.id] } } });
    await prisma.sellerProfile.delete({ where: { id: seller.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

run()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
