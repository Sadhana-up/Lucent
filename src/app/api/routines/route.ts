import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addSteps,
  catalogueProducts,
  getRoutineUser,
  serializeRoutine,
  templateSteps,
} from "@/lib/routine-server";

export async function GET(request: NextRequest) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const routines = await prisma.routine.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const items = await Promise.all(routines.map((r) => serializeRoutine(r.id)));
    return NextResponse.json({ routines: items.filter(Boolean) });
  } catch (error) {
    console.error("Error listing routines:", error);
    return NextResponse.json({ error: "Failed to load routines" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
    if (!name) return NextResponse.json({ error: "Routine name is required" }, { status: 400 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { skinType: true, skinConcerns: true },
    });

    const routine = await prisma.routine.create({
      data: {
        userId: user.id,
        name,
        description: typeof body.description === "string" ? body.description.trim().slice(0, 1000) || null : null,
        skinType: dbUser?.skinType ?? null,
        concerns: dbUser?.skinConcerns ?? null,
      },
    });

    let steps: { productId: string; timeOfDay: string }[] = [];
    if (body?.template === true) {
      const products = await catalogueProducts();
      steps = templateSteps(products, dbUser ?? {});
    } else if (Array.isArray(body?.steps)) {
      steps = body.steps
        .filter((s: any) => typeof s?.productId === "string")
        .map((s: any) => ({ productId: s.productId as string, timeOfDay: String(s.timeOfDay ?? "MORNING") }));
    }
    if (steps.length) await addSteps(routine.id, steps);

    return NextResponse.json(await serializeRoutine(routine.id), { status: 201 });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json({ error: "Failed to create routine" }, { status: 500 });
  }
}
