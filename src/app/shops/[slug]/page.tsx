"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Package, ShoppingBag, Store, MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { formatCurrency } from "@/lib/utils";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
};

export default function WebShopDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setShop(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: C.bg }}>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Apothecary not found</h2>
        <Link href="/shops" className="mt-4">
          <Button variant="outline">Back to Apothecaries</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: C.bg, color: C.text }}>
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/shops" className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-75" style={{ color: C.textSecondary }}>
            <ArrowLeft size={16} /> All Apothecaries
          </Link>

          <Link href="/shop/cart">
            <Button variant="outline" size="sm" className="rounded-xl">
              <ShoppingBag size={14} className="mr-1.5" /> Cart
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner Card */}
        <div className="rounded-3xl border overflow-hidden mb-8" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
          <div className="h-44 relative" style={{ background: "linear-gradient(135deg, #DCE9E0, #C2D8CB)" }}>
            {shop.banner && (
              <img src={shop.banner} alt={shop.storeName} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-10">
            <div className="flex items-end gap-5">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center font-serif text-2xl font-bold text-white shrink-0 overflow-hidden" style={{ background: C.primary }}>
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.storeName} className="w-full h-full object-cover" />
                ) : (
                  shop.storeName?.[0]?.toUpperCase() || "S"
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold" style={{ color: C.text }}>
                    {shop.storeName}
                  </h1>
                  {shop.isVerified && (
                    <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle size={12} /> VERIFIED LAB
                    </span>
                  )}
                </div>
                {shop.bio && (
                  <p className="text-sm mt-1.5 max-w-2xl" style={{ color: C.textSecondary }}>
                    {shop.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs sm:text-right shrink-0">
              <div>
                <span className="font-bold text-lg block" style={{ color: C.primary }}>
                  {shop.totalProducts || shop.products?.length || 0}
                </span>
                <span style={{ color: C.textMuted }}>Formulations</span>
              </div>
              <div>
                <span className="font-bold text-lg block" style={{ color: C.primary }}>
                  {shop.avgRating ? `${shop.avgRating.toFixed(1)} ★` : "Pure"}
                </span>
                <span style={{ color: C.textMuted }}>Community Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulations Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: C.text }}>
            Formulations by {shop.storeName}
          </h2>

          {shop.products && shop.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {shop.products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold" style={{ color: C.text }}>No formulations listed yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
