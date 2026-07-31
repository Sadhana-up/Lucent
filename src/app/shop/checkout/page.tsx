"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    shippingAddress: "",
    contactPhone: "",
    notes: "",
  });

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("lucent_cart") || "[]");
    setCartItems(items);
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.shippingAddress || !form.contactPhone) {
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
          shippingAddress: form.shippingAddress,
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

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/50 via-white to-pink-50/20 text-stone-900 py-12 px-4 flex items-center justify-center">
        <Card className="max-w-lg w-full border-pink-200/60 p-8 text-center bg-white space-y-6 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-rose-950">Order Placed Successfully!</h1>
            <p className="text-xs text-stone-500 mt-1">
              Order #{completedOrder.orderNumber}
            </p>
          </div>

          <div className="bg-pink-50/60 p-4 rounded-xl text-left text-xs space-y-2 border border-pink-100">
            <div className="flex justify-between font-bold text-rose-950 text-sm pb-2 border-b border-pink-200/60">
              <span>Total Paid (MVP Request)</span>
              <span>${completedOrder.totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold text-stone-600">Shipping to:</span>
              <p className="text-stone-800">{completedOrder.shippingAddress}</p>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Link href="/shop" className="w-full">
              <Button className="w-full bg-rose-900 text-white font-semibold">
                Back to Shop
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-pink-50/20 text-stone-900 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/shop/cart" className="flex items-center gap-2 text-stone-700 hover:text-rose-950 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
          <span className="font-bold text-rose-950 text-lg">Checkout</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-pink-200/60 p-6 space-y-4 bg-white">
              <h2 className="text-lg font-bold text-rose-950 border-b border-pink-100 pb-3">
                Shipping Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-rose-950 block mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    placeholder="Street address, apartment, city, state, postal code"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-950 block mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-950 block mb-1">
                    Special Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Leave package at doorstep, call upon arrival, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Checkout Review */}
          <div>
            <Card className="border-pink-200/60 p-6 space-y-4 bg-white sticky top-24">
              <h3 className="font-bold text-rose-950 text-lg border-b border-pink-100 pb-3">
                Items ({cartItems.length})
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs">
                    <span className="truncate pr-2 font-medium text-stone-800">
                      {item.quantity}x {item.title}
                    </span>
                    <span className="font-bold text-rose-950">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-pink-100 flex justify-between text-base font-bold text-rose-950">
                <span>Total Amount</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-medium">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full py-6 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-xl shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...
                  </>
                ) : (
                  "Confirm Order"
                )}
              </Button>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
