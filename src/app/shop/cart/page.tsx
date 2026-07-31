"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

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
    const updated = cartItems.filter((item) => item.productId !== productId);
    setCartItems(updated);
    localStorage.setItem("lucent_cart", JSON.stringify(updated));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-pink-50/20 text-stone-900 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2 text-stone-700 hover:text-rose-950 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
          <span className="font-bold text-rose-950 text-lg">Your Skincare Bag</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {cartItems.length === 0 ? (
          <Card className="border-pink-200/60 p-12 text-center text-stone-500 bg-white">
            <ShoppingBag className="w-12 h-12 text-pink-300 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-rose-950">Your cart is empty</h2>
            <p className="text-xs text-stone-500 mt-1">Discover curated skincare products for your routine.</p>
            <Link href="/shop" className="mt-6 inline-block">
              <Button className="bg-rose-900 text-white font-medium">
                Explore Skincare Shop
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.productId} className="border-pink-200/60 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-pink-50 overflow-hidden shrink-0 border border-pink-200/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "/placeholder-product.png"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-rose-950 text-base truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs font-bold text-stone-900 mt-0.5">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-pink-200 rounded-lg bg-white p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="px-2 py-0.5 text-xs text-stone-600 font-bold hover:text-rose-900"
                          >
                            -
                          </button>
                          <span className="px-2 font-semibold text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="px-2 py-0.5 text-xs text-stone-600 font-bold hover:text-rose-900"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-rose-950 text-base">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary Box */}
            <div>
              <Card className="border-pink-200/60 p-6 space-y-4 bg-white sticky top-24">
                <h3 className="font-bold text-rose-950 text-lg border-b border-pink-100 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-2 text-sm text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-stone-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-semibold">Free (MVP)</span>
                  </div>
                  <div className="pt-3 border-t border-pink-100 flex justify-between text-base font-bold text-rose-950">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Link href="/shop/checkout">
                  <Button className="w-full mt-4 py-6 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-xl shadow-md">
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
