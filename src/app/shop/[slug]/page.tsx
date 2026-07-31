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
} from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6">
        <h2 className="text-xl font-bold text-rose-950">Product not found</h2>
        <Link href="/shop" className="mt-4">
          <Button variant="outline" className="border-pink-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const concernsList = product.skinConcerns
    ? product.skinConcerns.split(",").map((s: string) => s.trim())
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-pink-50/20 text-stone-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/shop" className="flex items-center gap-2 text-stone-700 hover:text-rose-950 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>

          <Link href="/shop/cart">
            <Button variant="outline" size="sm" className="border-pink-200 text-rose-950">
              <ShoppingBag className="w-4 h-4 mr-1.5 text-rose-900" /> Cart
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden bg-pink-50/60 border border-pink-200/60 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage || "/placeholder-product.png"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Row */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img: any) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === img.url
                        ? "border-rose-900 shadow-sm scale-105"
                        : "border-pink-200/60 hover:border-pink-400 opacity-70 hover:opacity-100"
                    }`}
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

          {/* Right Column: Product Overview */}
          <div className="space-y-6">
            <div>
              {/* Seller Brand Header */}
              {product.seller && (
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-rose-900">
                  <Store size={16} />
                  <span>{product.seller.storeName}</span>
                  {product.seller.isVerified && (
                    <CheckCircle2 size={16} className="text-emerald-600 fill-emerald-100" />
                  )}
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-rose-950 tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* Rating Summary */}
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={product.avgRating || 5} size={18} />
                <span className="font-bold text-stone-800 text-sm">
                  {product.avgRating ? product.avgRating : "5.0"}
                </span>
                <span className="text-xs text-stone-500">
                  ({product.reviewCount || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200/60 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-rose-950">
                ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
              </span>
              {product.discountPrice && (
                <span className="text-base text-stone-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
              {product.discountPrice && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-900 text-white text-xs font-bold">
                  Save ${(product.price - product.discountPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {/* Target Concerns Chips */}
            {concernsList.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Target Skin Concerns
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {concernsList.map((concern: string) => (
                    <span
                      key={concern}
                      className="px-3 py-1 rounded-lg bg-white border border-pink-200 text-rose-950 text-xs font-semibold shadow-2xs"
                    >
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Actions */}
            <div className="pt-4 border-t border-pink-200/60 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-pink-200 rounded-xl bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-stone-600 font-bold hover:text-rose-900"
                  >
                    -
                  </button>
                  <span className="px-3 font-semibold text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-stone-600 font-bold hover:text-rose-900"
                  >
                    +
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className={`flex-1 py-6 rounded-xl font-bold text-base shadow-md transition-all ${
                    added
                      ? "bg-emerald-700 text-white"
                      : "bg-rose-900 hover:bg-rose-950 text-white"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5 mr-2" /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart
                    </>
                  )}
                </Button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dermatologist Approved Ingredients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-rose-800" />
                  <span>Fast Verified Shipping</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients & How to Use Tabs/Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {product.ingredients && (
            <Card className="border-pink-200/60 p-6 space-y-2 bg-white">
              <h3 className="font-bold text-rose-950 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-800" /> Key Ingredients
              </h3>
              <p className="text-stone-700 text-sm leading-relaxed">
                {product.ingredients}
              </p>
            </Card>
          )}

          {product.usageInstructions && (
            <Card className="border-pink-200/60 p-6 space-y-2 bg-white">
              <h3 className="font-bold text-rose-950 text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-800" /> How to Use
              </h3>
              <p className="text-stone-700 text-sm leading-relaxed">
                {product.usageInstructions}
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
