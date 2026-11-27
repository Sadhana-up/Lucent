"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
  ChevronRight,
} from "lucide-react";
import { StoreNavbar } from "@/components/store-navbar";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState("");

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    setReviewMsg("");

    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReviewMsg("Thank you! Your verified review has been published.");
        setComment("");
        // Reload product details to update reviews & average rating
        const refreshed = await fetch(`/api/products/${slug}`).then((r) => r.json());
        setProduct(refreshed);
      } else {
        const d = await res.json();
        setReviewMsg(d.error || "Please sign in to submit a review.");
      }
    } catch (err) {
      setReviewMsg("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

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

  const handleAddToCart = async () => {
    if (!product) return;
    setCartError("");

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (res.status === 401) {
        router.push(`/sign-in?callbackUrl=/shop/${product.slug}`);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCartError(data?.error || "Failed to add to cart");
        return;
      }

      setAdded(true);
      try {
        window.dispatchEvent(new Event("cart-updated"));
      } catch {}
      setTimeout(() => setAdded(false), 2500);
    } catch {
      setCartError("Failed to add to cart. Please try again.");
    }
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

        <StoreNavbar />

        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-1">
          <nav className="flex items-center gap-1.5 text-xs font-medium" aria-label="Breadcrumb">
            <Link href="/shop" className="hover:opacity-70 transition-opacity" style={{ color: C.textSecondary }}>Shop</Link>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
            {product?.seller && (
              <>
                <Link
                  href={`/shops/${product.seller.storeSlug || ""}`}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: C.textSecondary }}
                >
                  {product.seller.storeName}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
              </>
            )}
            <span className="truncate max-w-[180px]" style={{ color: C.text }}>{product?.title ?? "Product"}</span>
          </nav>
        </div>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4 animate-fade-in-left opacity-0 stagger-1">
              <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden glass-card shadow-md" style={{ background: C.bgWarm }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage || ""}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = "1";
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".img-fallback")) {
                        const div = document.createElement("div");
                        div.className = "img-fallback";
                        div.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:300px;";
                        div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                        parent.appendChild(div);
                      }
                    }
                  }}
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
                  <Link
                    href={`/shops/${product.seller.storeSlug || ""}`}
                    className="inline-flex items-center gap-2 mb-2 text-sm font-semibold hover:underline transition-colors"
                    style={{ color: C.primary }}
                    title={`Visit ${product.seller.storeName}`}
                  >
                    <Store size={16} />
                    <span>{product.seller.storeName}</span>
                    {product.seller.isVerified && (
                      <CheckCircle2 size={16} className="text-emerald-600 fill-emerald-100" />
                    )}
                  </Link>
                )}

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug" style={{ color: C.text }}>
                  {product.title}
                </h1>

                {product.reviewCount && product.reviewCount > 0 ? (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={product.avgRating || 0} size={18} />
                    <span className="font-bold text-sm" style={{ color: C.text }}>
                      {product.avgRating}
                    </span>
                    <span className="text-xs" style={{ color: C.textMuted }}>
                      ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={0} size={18} />
                    <span className="text-xs font-medium" style={{ color: C.textMuted }}>
                      No reviews yet (verified buyers only)
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl" style={{ background: C.primaryGhost, border: `1px solid ${C.borderLight}` }}>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold" style={{ color: C.text }}>
                    {formatCurrency(product.discountPrice ?? product.price)}
                  </span>
                  {product.discountPrice && (
                    <span className="text-base line-through" style={{ color: C.textMuted }}>
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  {product.discountPrice && (
                    <span className="px-2.5 py-0.5 rounded-full text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
                      Save {formatCurrency(product.price - product.discountPrice)}
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
                {cartError && (
                  <p className="text-sm mt-2" style={{ color: "#b42318" }}>{cartError}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs pt-2" style={{ color: C.textSecondary }}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" style={{ color: C.primary }} />
                    <span>Sold by a verified seller</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" style={{ color: C.accent }} />
                    <span>Secure checkout</span>
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

          {/* Customer Reviews Section */}
          <div className="pt-8 space-y-6" style={{ borderTop: `1px solid ${C.borderLight}` }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider block" style={{ color: C.primary }}>
                  COMMUNITY FEEDBACK
                </span>
                <h3 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
                  Formulation Verifications & Reviews
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={product.avgRating || 0} size={18} />
                <span className="font-bold text-sm" style={{ color: C.text }}>
                  {product.avgRating ? product.avgRating.toFixed(1) : "New"}
                </span>
                <span className="text-xs" style={{ color: C.textMuted }}>
                  ({product.reviewCount || product.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submission Form */}
              <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                <h4 className="font-semibold text-base mb-1" style={{ color: C.text }}>
                  Share Your Experience
                </h4>
                <p className="text-xs mb-4" style={{ color: C.textSecondary }}>
                  Help others learn how this formulation performed on your skin barrier.
                </p>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: C.textMuted }}>
                      Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={22}
                            fill={star <= rating ? "#F59E0B" : "none"}
                            color={star <= rating ? "#F59E0B" : "#D1D5DB"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: C.textMuted }}>
                      Comment (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Absorption rate, scent, calming effects..."
                      className="w-full p-3 rounded-xl border text-xs outline-none"
                      style={{ background: C.bgWarm, borderColor: C.border, color: C.text }}
                    />
                  </div>

                  {reviewMsg && (
                    <p className="text-xs font-medium" style={{ color: reviewMsg.includes("Thank") ? C.primary : "#EF4444" }}>
                      {reviewMsg}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full rounded-xl text-xs font-semibold py-2.5"
                    style={{ background: C.primary }}
                  >
                    {submittingReview ? "Submitting…" : "Publish Review"}
                  </Button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-3">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev: any) => (
                    <div key={rev.id} className="p-4 rounded-xl border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: C.primary }}>
                            {rev.user?.name?.[0]?.toUpperCase() || "C"}
                          </div>
                          <span className="font-semibold text-xs" style={{ color: C.text }}>
                            {rev.user?.name || "Customer"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarRating rating={rev.rating} size={13} />
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs leading-relaxed mt-1" style={{ color: C.textSecondary }}>
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl border text-center" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
                    <p className="text-xs italic" style={{ color: C.textMuted }}>
                      No community verifications yet. Be the first to verify this botanical formulation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
