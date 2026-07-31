import { NextRequest } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.CHAT_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: { session_id?: string | null; message?: string; images?: { mime_type: string; data: string }[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[route.ts] Received request:", {
    session_id: body.session_id,
    message: body.message?.slice(0, 80),
    imageCount: body.images?.length ?? 0,
  });

  if (!body.message || typeof body.message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[route.ts] Forwarding to backend:", `${BACKEND_URL}/chat/stream`);
  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: body.session_id ?? null,
        message: body.message,
        images: body.images ?? null,
      }),
    });
    console.log("[route.ts] Backend response status:", backendRes.status);
  } catch (err) {
    console.error("[route.ts] Failed to reach backend:", err);
    return new Response(
      JSON.stringify({ error: `Could not reach chat backend: ${String(err)}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!backendRes.ok || !backendRes.body) {
    console.error("[route.ts] Backend returned error:", backendRes.status);
    return new Response(
      JSON.stringify({ error: `Backend returned ${backendRes.status}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log("[route.ts] Streaming backend response to client");

  // Straight passthrough: FastAPI already emits well-formed
  // "data: {...}\n\n" SSE frames, so there's nothing to re-encode here —
  // we just relay the ReadableStream as-is.
  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
