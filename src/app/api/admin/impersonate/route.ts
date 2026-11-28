import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/impersonate
 * Body: { userId: string }
 * Starts an impersonation session for the given user.
 * Uses Better Auth's built-in admin.impersonateUser API.
 */
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin(request.headers);
  if (error) return error;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Cannot impersonate yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 });
    }

    // Cannot impersonate another admin
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, banned: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "admin") {
      return NextResponse.json({ error: "Cannot impersonate another admin" }, { status: 403 });
    }

    // Use Better Auth admin plugin to create impersonation session
    const impersonateResult = await auth.api.impersonateUser({
      body: { userId },
      headers: request.headers,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "impersonate_start",
        target: `user:${userId}`,
        metadata: {
          targetName: target.name,
          targetEmail: target.email,
          targetRole: target.role,
        },
      },
    });

    return NextResponse.json(impersonateResult);
  } catch (err) {
    console.error("Error starting impersonation:", err);
    return NextResponse.json({ error: "Failed to start impersonation" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/impersonate
 * Stops the current impersonation session and returns to admin.
 */
export async function DELETE(request: NextRequest) {
  try {
    const result = await auth.api.stopImpersonating({
      headers: request.headers,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error stopping impersonation:", err);
    return NextResponse.json({ error: "Failed to stop impersonation" }, { status: 500 });
  }
}
