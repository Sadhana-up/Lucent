import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    
    // Ensure uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate clean unique filename
      const ext = path.extname(file.name) || ".png";
      const cleanName = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
      const uniqueFilename = `${Date.now()}-${cleanName}${ext}`;

      const filePath = path.join(uploadsDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);

      uploadedUrls.push(`/uploads/${uniqueFilename}`);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: "No valid image files processed" }, { status: 400 });
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
