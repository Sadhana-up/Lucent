export const TIME_OF_DAY = ["MORNING", "EVENING"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

export type RoutineIssue = {
  level: "warning" | "info";
  message: string;
  stepIds: string[];
};

type AnalysableStep = {
  id: string;
  timeOfDay: string;
  titleSnapshot: string;
  product?: { ingredients?: string | null; skinType?: string | null } | null;
};

const has = (text: string, terms: string[]) => terms.some((t) => text.includes(t));

/** UTC day key keeps daily check-offs stable across timezones. */
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function lastNDays(n: number, date = new Date()): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(todayKey(new Date(date.getTime() - i * 86_400_000)));
  }
  return result;
}

/** Consecutive checked days ending today (or yesterday if today is still open). */
export function streakFromDays(days: string[], date = new Date()): number {
  const set = new Set(days);
  let cursor = new Date(date);
  if (!set.has(todayKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  let streak = 0;
  while (set.has(todayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

/** Ingredient-level audit of a routine. Shared by the API and the builder UI. */
export function analyseRoutine(
  steps: AnalysableStep[],
  profileSkinType?: string | null,
): { issues: RoutineIssue[]; score: number } {
  if (steps.length === 0) return { issues: [], score: 0 };

  const issues: RoutineIssue[] = [];
  const acids = ["aha", "bha", "glycolic", "lactic", "salicylic"];
  const retinol = ["retinol", "retinal", "tretinoin"];
  const vitaminC = ["ascorbic acid", "vitamin c"];

  const ingredientText = (step: AnalysableStep) =>
    `${step.titleSnapshot} ${step.product?.ingredients ?? ""}`.toLowerCase();
  const idsMatching = (terms: string[]) =>
    steps.filter((s) => has(ingredientText(s), terms)).map((s) => s.id);

  const retinolIds = idsMatching(retinol);
  const acidIds = idsMatching(acids);
  const vitaminCIds = idsMatching(vitaminC);

  if (retinolIds.length && acidIds.length) {
    issues.push({
      level: "warning",
      message:
        "Retinoids plus exfoliating acids (AHA/BHA) can irritate the barrier. Use them on alternate nights.",
      stepIds: [...retinolIds, ...acidIds],
    });
  }
  if (vitaminCIds.length && acidIds.length) {
    issues.push({
      level: "warning",
      message: "Vitamin C with strong acids may sting and destabilise both actives. Separate their use.",
      stepIds: [...vitaminCIds, ...acidIds],
    });
  }
  const morningRetinoids = retinolIds.filter((id) =>
    steps.some((s) => s.id === id && s.timeOfDay === "MORNING"),
  );
  if (morningRetinoids.length) {
    issues.push({
      level: "warning",
      message: "Retinoids degrade in sunlight. Move these steps to your evening routine.",
      stepIds: morningRetinoids,
    });
  }
  const morningSunscreen = steps.some(
    (s) => s.timeOfDay === "MORNING" && has(ingredientText(s), ["spf", "sunscreen", "zinc oxide"]),
  );
  if (!morningSunscreen) {
    issues.push({
      level: "warning",
      message: "No sunscreen in the morning routine. UV protection is essential when using actives.",
      stepIds: [],
    });
  }

  const skin = profileSkinType?.trim().toLowerCase();
  if (skin && skin !== "all") {
    const mismatch = steps
      .filter((s) => {
        const value = (s.product?.skinType ?? "").toLowerCase();
        return value && !value.includes(skin) && !value.includes("all");
      })
      .map((s) => s.id);
    if (mismatch.length) {
      issues.push({
        level: "info",
        message: `These products are not labelled for ${skin} skin. Check them against your skin profile.`,
        stepIds: mismatch,
      });
    }
  }

  const score = Math.max(
    20,
    100 - issues.filter((i) => i.level === "warning").length * 15 - issues.filter((i) => i.level === "info").length * 5,
  );
  return { issues, score };
}
