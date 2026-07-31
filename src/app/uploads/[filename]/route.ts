import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security check: prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, sanitizedFilename);

    // Verify file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    
    // Determine mime type
    let contentType = "image/jpeg";
    if (sanitizedFilename.endsWith(".png")) contentType = "image/png";
    if (sanitizedFilename.endsWith(".webp")) contentType = "image/webp";
    if (sanitizedFilename.endsWith(".svg")) contentType = "image/svg+xml";
    if (sanitizedFilename.endsWith(".gif")) contentType = "image/gif";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
