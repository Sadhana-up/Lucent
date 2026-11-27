"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const C = {
  bg: "#FAFBFC",
  text: "#1A1D21",
  textMuted: "#9CA3AF",
  danger: "#b54a4a",
  dangerGhost: "rgba(181, 74, 74, 0.08)",
};

const REASON_MESSAGES: Record<string, string> = {
  missing_reference: "We didn't receive a payment reference from Khalti.",
  order_not_found: "We couldn't find the matching order.",
  reference_mismatch: "The payment reference did not match this order.",
  verification_error: "We couldn't verify the payment with Khalti.",
};

function FailedContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order") || "";
  const reason = params.get("reason") || "";

  const message =
    REASON_MESSAGES[reason] ||
    (reason
      ? `Your payment was not completed (status: ${reason}). No amount has been charged.`
      : "Your payment was not completed. No amount has been charged.");

  return (
    <Card className="glass-card max-w-lg w-full p-8 text-center space-y-6 shadow-lg rounded-2xl">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: C.dangerGhost }}>
        <XCircle size={36} style={{ color: C.danger }} />
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: C.text }}>Payment Failed</h1>
        <p className="text-sm mt-2" style={{ color: C.textMuted }}>{message}</p>
        {orderNumber && (
          <p className="text-xs mt-2" style={{ color: C.textMuted }}>Order #{orderNumber}</p>
        )}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link href="/shop/cart" className="w-full">
          <Button variant="premium" className="w-full font-semibold rounded-xl">
            Try Again
          </Button>
        </Link>
        <Link href="/shop" className="w-full">
          <Button variant="outline" className="w-full rounded-xl">Back to Shop</Button>
        </Link>
      </div>
    </Card>
  );
}

export default function CheckoutFailedPage() {
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Minimal branded header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ borderColor: "rgba(234,226,217,0.6)", background: "rgba(250,246,240,0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-sm" style={{ color: C.text }}>Lucent</span>
          </Link>
        </div>
      </header>

      <div className="relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] top-0 right-0" style={{ opacity: 0.4 }} />
          <div className="ambient-spot w-[400px] h-[400px] bottom-0 left-0" style={{ background: "radial-gradient(ellipse at center, rgba(181,74,74,0.08) 0%, transparent 70%)" }} />
        </div>
        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <Suspense fallback={null}>
            <FailedContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
