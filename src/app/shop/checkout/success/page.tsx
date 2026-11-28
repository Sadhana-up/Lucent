"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Leaf } from "lucide-react";
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
  paymentProvider?: string;
  paymentStatus?: string;
}

type State = "loading" | "found" | "missing";

function SuccessContent() {
  const orderNumber = useSearchParams().get("order") || "";
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [state, setState] = useState<State>(orderNumber ? "loading" : "missing");

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.orders || [];
        const found = list.find((o: any) => o.orderNumber === orderNumber);
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

  useEffect(() => {
    if (state === "found") {
      localStorage.removeItem("lucent_cart");
    }
  }, [state]);

  return (
    <Card className="glass-card max-w-lg w-full p-8 text-center space-y-6 shadow-lg rounded-2xl relative">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: C.primaryGhost }}>
        <CheckCircle2 size={36} style={{ color: C.primary }} />
      </div>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
          {state === "found"
            ? order?.paymentProvider === "cod"
              ? "Order Placed Successfully!"
              : "Payment Successful!"
            : state === "loading"
              ? "Confirming your order..."
              : "Order Unconfirmed"}
        </h1>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>
          {state === "loading"
            ? "Confirming your order details..."
            : state === "found" && order
              ? order.paymentProvider === "cod"
                ? `Thank you! Your Cash on Delivery order #${order.orderNumber} has been placed.`
                : `Thank you for your order #${order.orderNumber}`
              : "We couldn't confirm your order. If you were charged, please contact support."}
        </p>
      </div>

      {state === "found" && order && (
        <CardContent className="p-4 rounded-xl text-left text-sm space-y-2" style={{ background: C.primaryGhost, border: `1px solid ${C.borderLight}` }}>
          <div className="flex justify-between font-semibold pb-2" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }}>
            <span>{order.paymentProvider === "cod" ? "Total Due on Delivery" : "Total Paid"}</span>
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
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Minimal branded header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ borderColor: "rgba(234,226,217,0.6)", background: "rgba(250,246,240,0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-sm" style={{ color: C.text }}>Lucent</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(45,90,61,0.08)", color: "#2D5A3D" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Secure Checkout
          </div>
        </div>
      </header>

      {/* Ambient */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] top-0 right-0" />
          <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-0 left-0" />
        </div>

        <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <Suspense fallback={null}>
            <SuccessContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
