import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const BACKEND_URL = process.env.CHAT_BACKEND_URL ?? "http://localhost:8000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `${BACKEND_URL}/sessions?user_id=${encodeURIComponent(session.user.id)}`;

  let backendRes: Response;
  try {
    backendRes = await fetch(url, {
      method: "GET",
      headers: {
        ...(INTERNAL_API_KEY ? { "X-API-Key": INTERNAL_API_KEY } : {}),
      },
    });
  } catch (err) {
    console.error("[sessions route] Failed to reach backend:", err);
    return new Response(
      JSON.stringify({ error: `Could not reach chat backend: ${String(err)}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!backendRes.ok) {
    return new Response(
      JSON.stringify({ error: `Backend returned ${backendRes.status}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = await backendRes.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
