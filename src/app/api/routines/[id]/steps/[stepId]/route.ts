import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnedRoutine, getRoutineUser, serializeRoutine } from "@/lib/routine-server";

type Params = { params: Promise<{ id: string; stepId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, stepId } = await params;
  if (!(await getOwnedRoutine(id, user.id))) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const data: Record<string, unknown> = {};
    if (body?.timeOfDay === "MORNING" || body?.timeOfDay === "EVENING") data.timeOfDay = body.timeOfDay;
    if (typeof body?.notes === "string") data.notes = body.notes.trim().slice(0, 500) || null;
    await prisma.routineStep.updateMany({ where: { id: stepId, routineId: id }, data });
    return NextResponse.json(await serializeRoutine(id));
  } catch (error) {
    console.error("Error updating routine step:", error);
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, stepId } = await params;
  if (!(await getOwnedRoutine(id, user.id))) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  try {
    await prisma.routineStep.deleteMany({ where: { id: stepId, routineId: id } });
    return NextResponse.json(await serializeRoutine(id));
  } catch (error) {
    console.error("Error deleting routine step:", error);
    return NextResponse.json({ error: "Failed to delete step" }, { status: 500 });
  }
}
