import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
