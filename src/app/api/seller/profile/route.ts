import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateNepaliPhone } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storeName, bio, logo, banner, contactEmail, phone } = body;

    if (!storeName) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }

    if (phone && !validateNepaliPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter a valid Nepali phone number (e.g., +977-98XXXXXXXX)" },
        { status: 400 }
      );
    }

    const baseSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const existingProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    let storeSlug = existingProfile?.storeSlug || baseSlug;

    if (!existingProfile) {
      let count = 1;
      while (await prisma.sellerProfile.findUnique({ where: { storeSlug } })) {
        storeSlug = `${baseSlug}-${count++}`;
      }
    }

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: session.user.id },
      update: {
        storeName,
        bio,
        logo,
        banner,
        contactEmail,
        phone,
      },
      create: {
        userId: session.user.id,
        storeName,
        storeSlug,
        bio,
        logo,
        banner,
        contactEmail,
        phone,
      },
    });

    // Ensure user role is updated to "seller"
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "seller" },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error saving seller profile:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
