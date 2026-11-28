import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addSteps, getOwnedRoutine, getRoutineUser, serializeRoutine } from "@/lib/routine-server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await getOwnedRoutine(id, user.id))) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
    const steps = Array.isArray(body?.steps)
      ? body.steps.map((s: any) => ({ productId: String(s?.productId ?? ""), timeOfDay: String(s?.timeOfDay ?? "MORNING"), notes: s?.notes }))
      : [{ productId, timeOfDay: String(body?.timeOfDay ?? "MORNING"), notes: body?.notes }];
    return NextResponse.json(await addSteps(id, steps));
  } catch (error) {
    console.error("Error adding routine step:", error);
    return NextResponse.json({ error: "Failed to add step" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await getOwnedRoutine(id, user.id))) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!Array.isArray(body?.updates)) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }
    await prisma.$transaction(
      body.updates
        .filter((u: any) => typeof u?.id === "string")
        .map((u: any) =>
          prisma.routineStep.updateMany({
            where: { id: u.id, routineId: id },
            data: {
              ...(Number.isInteger(u.stepOrder) ? { stepOrder: u.stepOrder } : {}),
              ...(u.timeOfDay === "MORNING" || u.timeOfDay === "EVENING" ? { timeOfDay: u.timeOfDay } : {}),
              ...(typeof u.notes === "string" ? { notes: u.notes.slice(0, 500) || null } : {}),
            },
          }),
        ),
    );
    return NextResponse.json(await serializeRoutine(id));
  } catch (error) {
    console.error("Error reordering routine steps:", error);
    return NextResponse.json({ error: "Failed to update steps" }, { status: 500 });
  }
}
