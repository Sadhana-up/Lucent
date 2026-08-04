"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2, Leaf, Package, MapPin, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryDark: "#1E3D2A",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  primaryGlow: "rgba(45, 90, 61, 0.12)",
  accent: "#7C6BEA",
  accentGhost: "rgba(124, 107, 234, 0.08)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  successFg: "#1E3D2A",
};

const STEPS = [
  { id: 1, label: "Shipping", icon: MapPin },
  { id: 2, label: "Review", icon: Package },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    contactPhone: "",
    notes: "",
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in?callbackUrl=/shop/checkout");
      return;
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("lucent_cart") || "[]");
    setCartItems(items);
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const fullAddress = [
      form.shippingAddress,
      form.shippingCity,
      form.shippingState,
      form.shippingZip,
    ].filter(Boolean).join(", ");

    if (!fullAddress || !form.contactPhone) {
      setError("Please provide your shipping address and contact phone.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          shippingAddress: fullAddress,
          contactPhone: form.contactPhone,
          notes: form.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in?callbackUrl=/shop/checkout");
          return;
        }
        throw new Error(data.error || "Failed to place order");
      }

      localStorage.removeItem("lucent_cart");
      setCompletedOrder(data);
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center" style={{ background: C.bg }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] top-0 right-0" />
          <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-0 left-0" />
        </div>
        <Card className="glass-card max-w-lg w-full p-8 text-center space-y-6 shadow-lg rounded-2xl animate-scale-in relative">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-success-pop" style={{ background: C.primaryGhost }}>
            <CheckCircle2 size={36} style={{ color: C.primary }} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold" style={{ color: C.text }}>Order Placed Successfully!</h1>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>
              Order #{completedOrder.orderNumber}
            </p>
          </div>

          <div className="p-4 rounded-xl text-left text-sm space-y-2" style={{ background: C.primaryGhost, border: `1px solid ${C.borderLight}` }}>
            <div className="flex justify-between font-semibold pb-2" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }}>
              <span>Total Paid</span>
              <span>${completedOrder.totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: C.textSecondary }}>Shipping to:</span>
              <p style={{ color: C.text }}>{completedOrder.shippingAddress}</p>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/shop" className="w-full block">
              <Button variant="premium" className="w-full font-semibold py-2.5 rounded-xl transition-all duration-300">
                Back to Shop
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] -top-40 -right-40" />
          <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-20 -left-40" />
        </div>

        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.92)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/shop/cart" className="flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: C.textSecondary }}>
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Link>
            <span className="font-semibold text-lg" style={{ color: C.text }}>Checkout</span>
          </div>
        </header>

        <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8">
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-down opacity-0 stagger-1">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300"
                  style={{
                    background: currentStep >= step.id ? "linear-gradient(135deg, #2D5A3D, #3D7A52)" : C.bgCard,
                    color: currentStep >= step.id ? "#fff" : C.textMuted,
                    border: `1px solid ${currentStep >= step.id ? "transparent" : C.border}`,
                  }}
                >
                  <step.icon size={16} />
                  {step.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-8 h-0.5 rounded-full transition-all duration-500"
                    style={{
                      background: currentStep > step.id ? C.primary : C.border,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-fade-in-up opacity-0 stagger-2">
                <Card className="glass-card rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold pb-3 flex items-center gap-2" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                      <MapPin className="w-5 h-5" style={{ color: C.primary }} />
                      Shipping Information
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                          Delivery Address *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={form.shippingAddress}
                          onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                          placeholder="Street address, apartment"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                          style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.shippingCity}
                            onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                            placeholder="City"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                            style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                            State *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.shippingState}
                            onChange={(e) => setForm({ ...form, shippingState: e.target.value })}
                            placeholder="State"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                            style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                            ZIP *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.shippingZip}
                            onChange={(e) => setForm({ ...form, shippingZip: e.target.value })}
                            placeholder="ZIP"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                            style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                          Contact Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.contactPhone}
                          onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                          style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                          Special Delivery Instructions (Optional)
                        </label>
                        <input
                          type="text"
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                          placeholder="Leave package at doorstep, call upon arrival, etc."
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                          style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="animate-fade-in-right opacity-0 stagger-3">
              <Card className="glass-card rounded-2xl sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg pb-3" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                    Items ({cartItems.length})
                  </h3>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="truncate pr-2 font-medium" style={{ color: C.textSecondary }}>
                          {item.quantity}x {item.title}
                        </span>
                        <span className="font-semibold" style={{ color: C.text }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex justify-between text-base font-semibold" style={{ color: C.text, borderTop: `1px solid ${C.borderLight}` }}>
                    <span>Total Amount</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {error && (
                    <p className="text-sm" style={{ color: "#b54a4a" }}>{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="premium"
                    disabled={loading || cartItems.length === 0}
                    className="w-full py-6 rounded-xl shadow-sm font-semibold transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...
                      </>
                    ) : (
                      "Confirm Order"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
