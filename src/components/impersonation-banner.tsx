"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { UserCog, X, ArrowLeft } from "lucide-react";

/**
 * Floating banner shown to admins while impersonating another user.
 * Mount this in a layout that is shared across all pages (e.g. root layout or a client wrapper).
 * It reads the session and only renders when `impersonatedBy` is set.
 */
export function ImpersonationBanner() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // The Better Auth admin plugin sets `session.session.impersonatedBy` when impersonating
  const impersonatedBy = (session?.session as { impersonatedBy?: string } | null)?.impersonatedBy;

  if (!impersonatedBy) return null;

  const handleStop = async () => {
    setLoading(true);
    try {
      await authClient.admin.stopImpersonating();
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Failed to stop impersonation:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border border-amber-300 text-sm font-semibold"
      style={{ background: "#FEF3C7", color: "#92400E", maxWidth: "calc(100vw - 48px)" }}
    >
      <UserCog className="w-4 h-4 shrink-0 text-amber-600" />
      <span className="flex-1 min-w-0">
        Impersonating <strong>{session?.user?.name}</strong> ({session?.user?.email})
      </span>
      <button
        onClick={handleStop}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50 shrink-0"
      >
        <ArrowLeft className="w-3 h-3" />
        {loading ? "Stopping…" : "Stop Impersonating"}
      </button>
    </div>
  );
}
