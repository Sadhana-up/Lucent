"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShoppingBag,
  Store,
  CheckCircle2,
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Check,
  Leaf,
} from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          if (data.images && data.images.length > 0) {
            const primary = data.images.find((img: any) => img.isPrimary);
            setSelectedImage(primary ? primary.url : data.images[0].url);
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem("lucent_cart") || "[]");
    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        title: product.title,
        price: product.discountPrice || product.price,
        image: selectedImage || (product.images[0] ? product.images[0].url : ""),
        quantity,
      });
    }

    localStorage.setItem("lucent_cart", JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: C.bg }}>
        <div className="glass-card rounded-2xl p-8 text-center animate-scale-in">
          <h2 className="text-xl font-bold" style={{ color: C.text }}>Product not found</h2>
          <Link href="/shop" className="mt-4 inline-block">
            <Button variant="premium" className="px-6 py-2.5 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const concernsList = product.skinConcerns
    ? product.skinConcerns.split(",").map((s: string) => s.trim())
    : [];

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-spot ambient-spot-primary w-[600px] h-[600px] -top-40 -right-40" />
          <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-20 -left-40" />
        </div>

        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.92)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/shop" className="flex items-center gap-2 text-sm font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: C.textSecondary }}>
              <ArrowLeft className="w-4 h-4" /> Back to Shop
            </Link>

            <Link href="/shop/cart">
              <Button variant="glass" size="sm" className="rounded-xl">
                <ShoppingBag className="w-4 h-4 mr-1.5" style={{ color: C.primary }} /> Cart
              </Button>
            </Link>
          </div>
        </header>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4 animate-fade-in-left opacity-0 stagger-1">
              <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden glass-card shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage || "/placeholder-product.png"}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img: any) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImage(img.url)}
                      className="w-20 h-20 rounded-xl overflow-hidden shrink-0 cursor-pointer transition-all duration-300 hover-lift"
                      style={{
                        border: selectedImage === img.url
                          ? `2px solid ${C.primary}`
                          : `1px solid ${C.border}`,
                        boxShadow: selectedImage === img.url
                          ? `0 0 0 3px ${C.primaryGhost}`
                          : "none",
                        opacity: selectedImage === img.url ? 1 : 0.7,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6 animate-fade-in-right opacity-0 stagger-2">
              <div>
                {product.seller && (
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold" style={{ color: C.primary }}>
                    <Store size={16} />
                    <span>{product.seller.storeName}</span>
                    {product.seller.isVerified && (
                      <CheckCircle2 size={16} className="text-emerald-600 fill-emerald-100" />
                    )}
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug" style={{ color: C.text }}>
                  {product.title}
                </h1>

                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={product.avgRating || 5} size={18} />
                  <span className="font-bold text-sm" style={{ color: C.text }}>
                    {product.avgRating ? product.avgRating : "5.0"}
                  </span>
                  <span className="text-xs" style={{ color: C.textMuted }}>
                    ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: C.primaryGhost, border: `1px solid ${C.borderLight}` }}>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold" style={{ color: C.text }}>
                    ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                  </span>
                  {product.discountPrice && (
                    <span className="text-base line-through" style={{ color: C.textMuted }}>
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                  {product.discountPrice && (
                    <span className="px-2.5 py-0.5 rounded-full text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
                      Save ${(product.price - product.discountPrice).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: C.textSecondary }}>
                {product.description}
              </p>

              {concernsList.length > 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: C.textMuted }}>
                    Target Skin Concerns
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {concernsList.map((concern: string) => (
                      <span
                        key={concern}
                        className="px-3 py-1 rounded-lg text-xs font-semibold glass-card hover-lift"
                        style={{ color: C.text }}
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl glass-card p-1" style={{ border: `1px solid ${C.border}` }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 font-bold transition-colors duration-200"
                      style={{ color: C.textMuted }}
                    >
                      -
                    </button>
                    <span className="px-3 font-semibold text-sm" style={{ color: C.text }}>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1.5 font-bold transition-colors duration-200"
                      style={{ color: C.textMuted }}
                    >
                      +
                    </button>
                  </div>

                  <Button
                    variant={added ? "default" : "premium"}
                    onClick={handleAddToCart}
                    className="flex-1 py-6 rounded-xl font-bold text-base shadow-md transition-all duration-300"
                  >
                    {added ? (
                      <>
                        <Check className="w-5 h-5 mr-2 animate-success-pop" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2" style={{ color: C.textSecondary }}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" style={{ color: C.primary }} />
                    <span>Dermatologist Approved Ingredients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" style={{ color: C.accent }} />
                    <span>Fast Verified Shipping</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.ingredients && (
              <div className="animate-fade-in-up opacity-0 stagger-3">
                <Card className="glass-card hover-lift p-6 space-y-2 rounded-2xl">
                  <h3 className="font-bold text-base flex items-center gap-2" style={{ color: C.text }}>
                    <Sparkles className="w-4 h-4" style={{ color: C.primary }} /> Key Ingredients
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                    {product.ingredients}
                  </p>
                </Card>
              </div>
            )}

            {product.usageInstructions && (
              <div className="animate-fade-in-up opacity-0 stagger-4">
                <Card className="glass-card hover-lift p-6 space-y-2 rounded-2xl">
                  <h3 className="font-bold text-base flex items-center gap-2" style={{ color: C.text }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: C.primary }} /> How to Use
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                    {product.usageInstructions}
                  </p>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
