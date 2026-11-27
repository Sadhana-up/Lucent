"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, CreditCard, Truck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { formatCurrency, getPhoneValidationError } from "@/lib/utils";
import { StoreNavbar } from "@/components/store-navbar";

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

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  effectivePrice: number;
  product: { id: string; title: string; price: number };
};

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  isDefault: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"khalti" | "cod">("cod");

  const [form, setForm] = useState({
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    contactPhone: "",
    notes: "",
  });

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/sign-in?callbackUrl=/shop/checkout");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const items = data.items ?? [];
        setCartItems(items);
        setTotal(data.total ?? 0);
        if (items.length === 0) {
          router.push("/shop/cart");
        }
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setCartLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/sign-in?callbackUrl=/shop/checkout");
      } else {
        loadCart();
        // Load saved addresses
        fetch("/api/addresses")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setAddresses(data);
              const def = data.find((a: Address) => a.isDefault) ?? data[0];
              if (def) {
                setSelectedAddressId(def.id);
                setForm({
                  shippingAddress: def.address,
                  shippingCity: def.city,
                  shippingState: def.state ?? "",
                  shippingZip: def.postalCode ?? "",
                  contactPhone: def.phone,
                  notes: "",
                });
              }
            }
          })
          .catch(() => {});
        // Pre-fill phone from profile
        fetch("/api/profile")
          .then((r) => r.json())
          .then((data) => {
            if (data?.phone && !form.contactPhone) {
              setForm((prev) => ({ ...prev, contactPhone: data.phone }));
            }
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, session, loadCart, router]);

  const handleAddressSelect = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setForm({
      shippingAddress: addr.address,
      shippingCity: addr.city,
      shippingState: addr.state ?? "",
      shippingZip: addr.postalCode ?? "",
      contactPhone: addr.phone,
      notes: form.notes,
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const fullAddress = [form.shippingAddress, form.shippingCity, form.shippingState, form.shippingZip]
      .filter(Boolean)
      .join(", ");

    if (!fullAddress || !form.contactPhone) {
      setError("Please provide your shipping address and contact phone.");
      return;
    }

    const phoneError = getPhoneValidationError(form.contactPhone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);

    try {
      // Build order items from server-side cart
      const items = cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: fullAddress,
          contactPhone: form.contactPhone,
          notes: form.notes,
          paymentMethod,
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

      // Clear server cart
      await fetch("/api/cart?clear=true", { method: "DELETE" });

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      router.push("/shop/orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setLoading(false);
    }
  };

  if (isPending || cartLoading) {
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

        <StoreNavbar />

        {/* Breadcrumbs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-1">
          <nav className="flex items-center gap-1.5 text-xs font-medium" aria-label="Breadcrumb">
            <Link href="/shop" className="hover:opacity-70 transition-opacity" style={{ color: C.textSecondary }}>Shop</Link>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
            <Link href="/shop/cart" className="hover:opacity-70 transition-opacity" style={{ color: C.textSecondary }}>Cart</Link>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
            <span style={{ color: C.text }}>Checkout</span>
          </nav>
        </div>

        <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-5">
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

              {/* Saved Addresses */}
              {addresses.length > 0 && (
                <Card className="glass-card rounded-2xl">
                  <CardContent className="p-6 space-y-3">
                    <h2 className="text-lg font-semibold pb-3 flex items-center gap-2" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                      <MapPin className="w-5 h-5" style={{ color: C.primary }} />
                      Saved Addresses
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleAddressSelect(addr)}
                          className="text-left p-3 rounded-xl border transition-all"
                          style={{
                            borderColor: selectedAddressId === addr.id ? C.primary : C.border,
                            background: selectedAddressId === addr.id ? C.primaryGhost : C.bgCard,
                          }}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.primary }}>{addr.label}</p>
                          <p className="text-sm font-medium" style={{ color: C.text }}>{addr.fullName}</p>
                          <p className="text-xs" style={{ color: C.textSecondary }}>
                            {[addr.address, addr.city, addr.state].filter(Boolean).join(", ")}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{addr.phone}</p>
                        </button>
                      ))}
                    </div>
                    <Link href="/shop/account" className="text-xs font-medium hover:opacity-70" style={{ color: C.primary }}>
                      + Add or manage addresses
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Form */}
              <Card className="glass-card rounded-2xl animate-fade-in-up opacity-0 stagger-2">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold pb-3 flex items-center gap-2" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                    <MapPin className="w-5 h-5" style={{ color: C.primary }} />
                    {addresses.length > 0 ? "Or Enter New Address" : "Shipping Information"}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>Delivery Address *</label>
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
                        <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>City *</label>
                        <input
                          type="text"
                          required
                          value={form.shippingCity}
                          onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                          placeholder="Kathmandu"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                          style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>Province</label>
                        <input
                          type="text"
                          value={form.shippingState}
                          onChange={(e) => setForm({ ...form, shippingState: e.target.value })}
                          placeholder="Bagmati"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                          style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>Postal Code</label>
                        <input
                          type="text"
                          value={form.shippingZip}
                          onChange={(e) => setForm({ ...form, shippingZip: e.target.value })}
                          placeholder="44600"
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                          style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={form.contactPhone}
                        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                        placeholder="+977-98XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                        style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>Delivery Instructions (Optional)</label>
                      <input
                        type="text"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Leave at doorstep, call upon arrival..."
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                        style={{ border: `1px solid ${C.border}`, background: C.bgCard, color: C.text }}
                      />
                    </div>

                    <div className="pt-2">
                      <label className="text-sm font-semibold block mb-2" style={{ color: C.textSecondary }}>Payment Method *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cod")}
                          className="p-4 rounded-xl border text-left flex items-start gap-3 transition-all"
                          style={{
                            borderColor: paymentMethod === "cod" ? C.primary : C.border,
                            background: paymentMethod === "cod" ? C.primaryGhost : C.bgCard,
                          }}
                        >
                          <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: paymentMethod === "cod" ? C.primary : C.textMuted }} />
                          <div>
                            <span className="font-semibold text-sm block" style={{ color: C.text }}>Cash on Delivery</span>
                            <span className="text-xs" style={{ color: C.textSecondary }}>Pay when your parcel arrives</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("khalti")}
                          className="p-4 rounded-xl border text-left flex items-start gap-3 transition-all"
                          style={{
                            borderColor: paymentMethod === "khalti" ? C.primary : C.border,
                            background: paymentMethod === "khalti" ? C.primaryGhost : C.bgCard,
                          }}
                        >
                          <CreditCard className="w-5 h-5 shrink-0 mt-0.5" style={{ color: paymentMethod === "khalti" ? C.primary : C.textMuted }} />
                          <div>
                            <span className="font-semibold text-sm block" style={{ color: C.text }}>Khalti ePayment</span>
                            <span className="text-xs" style={{ color: C.textSecondary }}>Instant wallet / e-banking</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="animate-fade-in-right opacity-0 stagger-3">
              <Card className="glass-card rounded-2xl sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg pb-3" style={{ color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                    Order Summary ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
                  </h3>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate pr-2 font-medium" style={{ color: C.textSecondary }}>
                          {item.quantity}× {item.product.title}
                        </span>
                        <span className="font-semibold shrink-0" style={{ color: C.text }}>
                          {formatCurrency(item.effectivePrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${C.borderLight}` }}>
                    <div className="flex justify-between text-sm" style={{ color: C.textSecondary }}>
                      <span>Shipping</span>
                      <span className="font-semibold" style={{ color: C.primary }}>Free</span>
                    </div>
                    <div className="flex justify-between text-base font-bold" style={{ color: C.text }}>
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm rounded-xl p-2.5" style={{ background: "rgba(181,74,74,0.08)", color: "#b54a4a" }}>{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="premium"
                    disabled={loading || cartItems.length === 0}
                    className="w-full py-6 rounded-xl shadow-sm font-semibold transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {paymentMethod === "khalti" ? "Redirecting to Khalti..." : "Placing order..."}
                      </>
                    ) : (
                      `Confirm & ${paymentMethod === "khalti" ? "Pay with Khalti" : "Place Order (COD)"}`
                    )}
                  </Button>

                  <p className="text-xs text-center" style={{ color: C.textMuted }}>
                    By placing your order, you agree to our Terms of Service
                  </p>
                </CardContent>
              </Card>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
