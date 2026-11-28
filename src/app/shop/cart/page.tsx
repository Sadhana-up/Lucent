"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, ShoppingBag, ArrowRight, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { StoreNavbar } from "@/components/store-navbar";

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  effectivePrice: number;
  inStock: boolean;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice: number | null;
    stock: number;
    images: { url: string }[];
    seller: { storeName: string; storeSlug: string } | null;
  };
};

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
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
};

export default function CartPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/sign-in?callbackUrl=/shop/cart");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items ?? []);
        setTotal(data.total ?? 0);
        try {
          window.dispatchEvent(new Event("cart-updated"));
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoaded(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/sign-in?callbackUrl=/shop/cart");
      } else {
        loadCart();
      }
    }
  }, [isPending, session, loadCart, router]);

  const updateQuantity = async (itemId: string, newQty: number) => {
    setUpdating(itemId);
    try {
      if (newQty < 1) {
        await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
        setCartItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity: newQty }),
        });
        setCartItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
        );
      }
      // Recompute total
      await loadCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
      await loadCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setUpdating(null);
    }
  };

  if (isPending || (!loaded && session?.user)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
      </div>
    );
  }

  if (!loaded) return null;

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] -top-40 -right-40" />
        <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-20 -left-40" />
      </div>

      <StoreNavbar />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6 font-sans">
        <div className="flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2 text-xs font-semibold text-[#5A5F6B] hover:text-[#2D5A3D] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
          <h1 className="text-xl font-serif font-bold text-[#1A1D21]">Your Skincare Bag</h1>
        </div>
        {cartItems.length === 0 ? (
          <div className="animate-scale-in">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float-gentle" style={{ background: C.primaryGhost }}>
                  <ShoppingBag className="w-10 h-10" style={{ color: C.primary }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: C.text }}>Your cart is empty</h2>
                <p className="text-sm mt-1" style={{ color: C.textMuted }}>Discover curated skincare products for your routine.</p>
                <Link href="/shop" className="mt-6 inline-block">
                  <Button variant="premium" className="px-6 py-2.5 rounded-xl font-semibold">
                    Explore Skincare Shop
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, i) => (
                <div
                  key={item.id}
                  className="animate-fade-in-left opacity-0 transition-all duration-300"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <Card className="glass-card hover-lift rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/shop/${item.product.slug}`} className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ background: C.bgWarm, border: `1px solid ${C.border}` }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.images?.[0]?.url || "/placeholder-product.png"}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`/shop/${item.product.slug}`}>
                            <h3 className="font-semibold text-base truncate hover:opacity-80" style={{ color: C.text }}>
                              {item.product.title}
                            </h3>
                          </Link>
                          {item.product.seller && (
                            <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                              by {item.product.seller.storeName}
                            </p>
                          )}
                          <p className="text-sm font-semibold mt-0.5" style={{ color: C.primary }}>
                            {formatCurrency(item.effectivePrice)}
                            {item.product.discountPrice && item.product.discountPrice < item.product.price && (
                              <span className="text-xs font-normal line-through ml-2" style={{ color: C.textMuted }}>
                                {formatCurrency(item.product.price)}
                              </span>
                            )}
                          </p>
                          {!item.inStock && (
                            <p className="text-xs text-red-500 mt-0.5">⚠ Low stock — only {item.product.stock} left</p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center rounded-lg glass-card" style={{ border: `1px solid ${C.border}` }}>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={updating === item.id}
                                className="px-2.5 py-1 text-sm font-bold transition-colors duration-200 hover:opacity-70 disabled:opacity-40"
                                style={{ color: C.textMuted }}
                              >
                                −
                              </button>
                              <span className="px-2.5 font-semibold text-sm" style={{ color: C.text }}>
                                {updating === item.id ? <Loader2 size={12} className="animate-spin" /> : item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={updating === item.id || item.quantity >= Math.min(20, item.product.stock)}
                                className="px-2.5 py-1 text-sm font-bold transition-colors duration-200 hover:opacity-70 disabled:opacity-40"
                                style={{ color: C.textMuted }}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={updating === item.id}
                              className="p-1 transition-all duration-200 hover:scale-110 disabled:opacity-40"
                              style={{ color: C.textMuted }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-semibold text-base" style={{ color: C.text }}>
                            {formatCurrency(item.effectivePrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="animate-fade-in-right opacity-0 stagger-2">
              <Card className="glass-card rounded-2xl sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg pb-3" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-sm" style={{ color: C.textSecondary }}>
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                      <span className="font-semibold" style={{ color: C.text }}>{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-semibold" style={{ color: C.primary }}>Free</span>
                    </div>
                    <div className="pt-3 flex justify-between text-base font-semibold" style={{ color: C.text, borderTop: `1px solid ${C.borderLight}` }}>
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Link href="/shop/checkout">
                    <Button variant="premium" className="w-full mt-4 py-6 rounded-xl shadow-sm font-semibold transition-all duration-300">
                      Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <Link href="/shop" className="block text-center text-xs font-medium hover:opacity-70 mt-2" style={{ color: C.textSecondary }}>
                    Continue Shopping
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
