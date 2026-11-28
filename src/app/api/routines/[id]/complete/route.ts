import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnedRoutine, getRoutineUser } from "@/lib/routine-server";
import { todayKey } from "@/lib/routine";

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
    const stepId = typeof body?.stepId === "string" ? body.stepId : "";
    const day = typeof body?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.day) ? body.day : todayKey();
    if (!stepId) return NextResponse.json({ error: "stepId is required" }, { status: 400 });

    const step = await prisma.routineStep.findFirst({ where: { id: stepId, routineId: id } });
    if (!step) return NextResponse.json({ error: "Step not found" }, { status: 404 });

    const existing = await prisma.routineCompletion.findUnique({
      where: { stepId_day: { stepId, day } },
    });
    if (existing) {
      await prisma.routineCompletion.delete({ where: { id: existing.id } });
    } else {
      await prisma.routineCompletion.create({ data: { stepId, userId: user.id, day } });
    }

    const [total, done] = await Promise.all([
      prisma.routineStep.count({ where: { routineId: id } }),
      prisma.routineCompletion.count({ where: { day, step: { routineId: id } } }),
    ]);
    return NextResponse.json({ done: !existing, doneToday: done, total });
  } catch (error) {
    console.error("Error toggling routine completion:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
