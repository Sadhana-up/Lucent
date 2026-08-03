"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, ShoppingBag, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  accent: "#c4956a",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("lucent_cart") || "[]");
    setCartItems(items);
    setLoaded(true);
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    setCartItems(updated);
    localStorage.setItem("lucent_cart", JSON.stringify(updated));
  };

  const removeItem = (productId: string) => {
    setRemoving(productId);
    setTimeout(() => {
      const updated = cartItems.filter((item) => item.productId !== productId);
      setCartItems(updated);
      localStorage.setItem("lucent_cart", JSON.stringify(updated));
      setRemoving(null);
    }, 300);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
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

        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 248, 245, 0.92)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/shop" className="flex items-center gap-2 text-sm font-medium transition-colors duration-200 hover:opacity-70" style={{ color: C.textLight }}>
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
            <span className="font-medium text-lg" style={{ color: C.text }}>Your Skincare Bag</span>
          </div>
        </header>

        <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
          {cartItems.length === 0 ? (
            <div className="animate-scale-in">
              <Card className="glass-card rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float-gentle" style={{ background: C.primaryGhost }}>
                    <ShoppingBag className="w-10 h-10" style={{ color: C.primary }} />
                  </div>
                  <h2 className="text-xl font-medium" style={{ color: C.text }}>Your cart is empty</h2>
                  <p className="text-sm mt-1" style={{ color: C.textMuted }}>Discover curated skincare products for your routine.</p>
                  <Link href="/shop" className="mt-6 inline-block">
                    <Button className="magnetic-btn gradient-primary text-white px-6 py-2.5 rounded-xl font-medium">
                      Explore Skincare Shop
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, i) => (
                  <div
                    key={item.productId}
                    className="animate-fade-in-left opacity-0 transition-all duration-300"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      transform: removing === item.productId ? "translateX(-100%)" : "translateX(0)",
                      opacity: removing === item.productId ? 0 : undefined,
                    }}
                  >
                    <Card className="glass-card hover-lift rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ background: C.bgWarm, border: `1px solid ${C.border}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image || "/placeholder-product.png"}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base truncate" style={{ color: C.text }}>
                              {item.title}
                            </h3>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: C.primary }}>
                              ${item.price.toFixed(2)}
                            </p>

                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center rounded-lg glass-card" style={{ border: `1px solid ${C.border}` }}>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, -1)}
                                  className="px-2 py-0.5 text-xs font-bold transition-colors duration-200 hover:opacity-70"
                                  style={{ color: C.textMuted }}
                                >
                                  -
                                </button>
                                <span className="px-2 font-semibold text-xs transition-all duration-200" style={{ color: C.text }}>{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, 1)}
                                  className="px-2 py-0.5 text-xs font-bold transition-colors duration-200 hover:opacity-70"
                                  style={{ color: C.textMuted }}
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                                className="p-1 transition-all duration-200 hover:scale-110"
                                style={{ color: C.textMuted }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-semibold text-base" style={{ color: C.text }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Order Summary Box */}
              <div className="animate-fade-in-right opacity-0 stagger-2">
                <Card className="glass-card rounded-2xl sticky top-24">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-medium text-lg pb-3" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                      Order Summary
                    </h3>

                    <div className="space-y-2 text-sm" style={{ color: C.textLight }}>
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold" style={{ color: C.text }}>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="font-semibold" style={{ color: C.primary }}>Free</span>
                      </div>
                      <div className="pt-3 flex justify-between text-base font-semibold" style={{ color: C.text, borderTop: `1px solid ${C.borderLight}` }}>
                        <span>Total</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <Link href="/shop/checkout">
                      <Button className="magnetic-btn gradient-primary w-full mt-4 py-6 rounded-xl shadow-sm font-medium text-white transition-all duration-300">
                        Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
