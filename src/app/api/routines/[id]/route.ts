import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnedRoutine, getRoutineUser, serializeRoutine } from "@/lib/routine-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const routine = await getOwnedRoutine(id, user.id);
  if (!routine) return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  return NextResponse.json(await serializeRoutine(id));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const routine = await getOwnedRoutine(id, user.id);
  if (!routine) return NextResponse.json({ error: "Routine not found" }, { status: 404 });

  try {
    const body = await request.json().catch(() => null);
    const data: Record<string, unknown> = {};
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 100);
    if (typeof body?.description === "string") data.description = body.description.trim().slice(0, 1000) || null;
    if (typeof body?.isArchived === "boolean") data.isArchived = body.isArchived;

    await prisma.routine.update({ where: { id }, data });
    return NextResponse.json(await serializeRoutine(id));
  } catch (error) {
    console.error("Error updating routine:", error);
    return NextResponse.json({ error: "Failed to update routine" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getRoutineUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const routine = await getOwnedRoutine(id, user.id);
  if (!routine) return NextResponse.json({ error: "Routine not found" }, { status: 404 });

  try {
    await prisma.routine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json({ error: "Failed to delete routine" }, { status: 500 });
  }
}
