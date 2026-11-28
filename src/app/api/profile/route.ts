import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateNepaliPhone } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        skinType: true,
        skinConcerns: true,
        onboardingCompleted: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const data: Record<string, unknown> = {};

    if (typeof body?.name === "string") {
      const trimmed = body.name.trim().slice(0, 100);
      if (!trimmed) {
        return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      }
      data.name = trimmed;
    }

    if (body?.phone !== undefined) {
      if (typeof body.phone === "string" && body.phone.trim()) {
        const phone = body.phone.trim().slice(0, 30);
        if (!validateNepaliPhone(phone)) {
          return NextResponse.json(
            {
              error:
                "Enter a valid Nepali phone number (e.g., +977-98XXXXXXXX or 98XXXXXXXX).",
            },
            { status: 400 },
          );
        }
        data.phone = phone;
      } else {
        data.phone = null;
      }
    }

    if (typeof body?.skinType === "string") {
      data.skinType = body.skinType.trim().slice(0, 50);
    }

    if (typeof body?.skinConcerns === "string") {
      data.skinConcerns = body.skinConcerns.trim().slice(0, 200);
    } else if (Array.isArray(body?.skinConcerns)) {
      data.skinConcerns = body.skinConcerns.join(", ").slice(0, 200);
    }

    if (typeof body?.onboardingCompleted === "boolean") {
      data.onboardingCompleted = body.onboardingCompleted;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        skinType: true,
        skinConcerns: true,
        onboardingCompleted: true,
        image: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
