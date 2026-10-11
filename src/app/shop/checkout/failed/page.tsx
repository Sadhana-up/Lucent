"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
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
    <div className="min-h-screen py-12 px-4 flex items-center justify-center" style={{ background: C.bg }}>
      <Suspense fallback={null}>
        <FailedContent />
      </Suspense>
    </div>
  );
}
