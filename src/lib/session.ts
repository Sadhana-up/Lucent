import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export function getUserRole(user: AuthSession["user"] | null | undefined): string | undefined {
  return (user as { role?: string } | null | undefined)?.role;
}

export async function getSession(): Promise<AuthSession | null> {
  const reqHeaders = await headers();
  return auth.api.getSession({ headers: reqHeaders });
}

export async function getSessionFromHeaders(requestHeaders: Headers): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: requestHeaders });
}

export async function getAdminSession(): Promise<AuthSession | null> {
  const session = await getSession();
  if (!session?.user || getUserRole(session.user) !== "admin") return null;
  return session;
}

export async function requireAdmin(
  requestHeaders: Headers,
): Promise<{ session: AuthSession; error: null } | { session: null; error: Response }> {
  const session = await getSessionFromHeaders(requestHeaders);

  if (!session?.user) {
    return {
      session: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (getUserRole(session.user) !== "admin") {
    return {
      session: null,
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}
