"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const C = {
  primary: "#2D5A3D",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  bg: "#FAFBFC",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
};

interface OrderSummary {
  orderNumber: string;
  totalAmount: number;
  shippingAddress: string;
}

type State = "loading" | "found" | "missing";

function SuccessContent() {
  const orderNumber = useSearchParams().get("order") || "";
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [state, setState] = useState<State>(orderNumber ? "loading" : "missing");

  useEffect(() => {
    // Payment is confirmed at this point, so the cart can be cleared.
    localStorage.removeItem("lucent_cart");
    if (!orderNumber) return;

    let cancelled = false;
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const found = Array.isArray(data)
          ? (data as OrderSummary[]).find((o) => o.orderNumber === orderNumber)
          : null;
        if (found) {
          setOrder(found);
          setState("found");
        } else {
          setState("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <Card className="glass-card max-w-lg w-full p-8 text-center space-y-6 shadow-lg rounded-2xl relative">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: C.primaryGhost }}>
        <CheckCircle2 size={36} style={{ color: C.primary }} />
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
          Payment Successful!
        </h1>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>
          {state === "loading"
            ? "Confirming your payment..."
            : state === "found" && order
              ? `Thank you for your order #${order.orderNumber}`
              : "Your payment was received."}
        </p>
      </div>

      {state === "found" && order && (
        <CardContent className="p-4 rounded-xl text-left text-sm space-y-2" style={{ background: C.primaryGhost, border: `1px solid ${C.borderLight}` }}>
          <div className="flex justify-between font-semibold pb-2" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }}>
            <span>Total Paid</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: C.textSecondary }}>Shipping to:</span>
            <p style={{ color: C.text }}>{order.shippingAddress}</p>
          </div>
        </CardContent>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link href="/shop/orders" className="w-full">
          <Button variant="outline" className="w-full rounded-xl">View My Orders</Button>
        </Link>
        <Link href="/shop" className="w-full">
          <Button variant="premium" className="w-full font-semibold rounded-xl">
            Back to Shop
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center" style={{ background: C.bg }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] top-0 right-0" />
        <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-0 left-0" />
      </div>
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
