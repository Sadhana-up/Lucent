"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Search, Store, ShoppingBag, Leaf, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function WebShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (verifiedOnly) q.append("verified", "true");
    const qs = q.toString();

    fetch(`/api/shops${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setShops(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, verifiedOnly]);

  return (
    <div className="min-h-screen pb-16" style={{ background: C.bg, color: C.text }}>
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-75" style={{ color: C.textSecondary }}>
              <ArrowLeft size={16} /> Shop
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primary }}>
                <Store size={15} className="text-white" />
              </div>
              <span className="text-lg font-serif font-semibold" style={{ color: C.text }}>
                Artisan Apothecaries & Labs
              </span>
            </div>
          </div>

          <Link href="/shop/cart">
            <Button variant="outline" size="sm" className="rounded-xl">
              <ShoppingBag size={14} className="mr-1.5" /> Cart
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: C.text }}>
              Nepal’s Certified Botanical Labs
            </h1>
            <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
              Direct formulations from verified herbalists, chemists, and organic formulators.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search apothecaries…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border text-xs outline-none w-56"
                style={{ background: "#FFFFFF", borderColor: C.border, color: C.text }}
              />
            </div>

            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={{
                background: verifiedOnly ? C.primary : "#FFFFFF",
                borderColor: verifiedOnly ? C.primary : C.border,
                color: verifiedOnly ? "#FFFFFF" : C.text,
              }}
            >
              <CheckCircle size={13} />
              Verified Only
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: C.textMuted }}>Discovering certified apothecaries…</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border" style={{ background: "#FFFFFF", borderColor: C.borderLight }}>
            <Store size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-semibold" style={{ color: C.text }}>No apothecaries found</h3>
            <p className="text-xs mt-1" style={{ color: C.textSecondary }}>
              Try searching with a different keyword or removing filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col"
                style={{ background: "#FFFFFF", borderColor: C.borderLight }}
              >
                {/* Banner */}
                <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #E2ECE5, #CBDDD2)" }}>
                  {shop.banner && (
                    <img src={shop.banner} alt={shop.storeName} className="w-full h-full object-cover" />
                  )}
                  {shop.isVerified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/90" style={{ color: C.primary }}>
                      <CheckCircle size={11} /> VERIFIED
                    </div>
                  )}
                </div>

                {/* Profile content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 -mt-9 mb-3">
                    <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center font-serif text-xl font-bold text-white shrink-0 overflow-hidden" style={{ background: C.primary }}>
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.storeName} className="w-full h-full object-cover" />
                      ) : (
                        shop.storeName?.[0]?.toUpperCase() || "S"
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg leading-snug" style={{ color: C.text }}>
                        {shop.storeName}
                      </h3>
                      <span className="text-xs" style={{ color: C.textMuted }}>
                        {shop._count?.products || 0} formulations listed
                      </span>
                    </div>
                  </div>

                  {shop.bio && (
                    <p className="text-xs leading-relaxed line-clamp-2 mb-4" style={{ color: C.textSecondary }}>
                      {shop.bio}
                    </p>
                  )}

                  {/* Sample products thumbnails */}
                  {shop.products && shop.products.length > 0 && (
                    <div className="mt-auto pt-4 border-t flex items-center gap-2" style={{ borderColor: C.borderLight }}>
                      {shop.products.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                          {p.images?.[0]?.url && (
                            <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      <div className="flex-1 text-right">
                        <Link href={`/shops/${shop.storeSlug}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold" style={{ color: C.primary }}>
                            Explore Store <ExternalLink size={12} className="ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
