"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  Store,
  MapPin,
  Mail,
  Phone,
  Search,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { StoreNavbar } from "@/components/store-navbar";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { formatCurrency } from "@/lib/utils";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.07)",
  bg: "#FAF6F0",
  bgWarm: "#F5EFEB",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#8C8C85",
  border: "#EAE2D9",
  borderLight: "#F4EFE7",
};

export default function WebShopDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // In-shop search & category filtering
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch(`/api/shops/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setShop(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const categories = useMemo(() => {
    if (!shop?.products) return [];
    const catMap = new Map<string, string>();
    shop.products.forEach((p: any) => {
      if (p.category?.name && p.category?.slug) {
        catMap.set(p.category.slug, p.category.name);
      }
    });
    return Array.from(catMap.entries()).map(([catSlug, name]) => ({
      slug: catSlug,
      name,
    }));
  }, [shop]);

  const filteredProducts = useMemo(() => {
    if (!shop?.products) return [];
    return shop.products.filter((p: any) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        !selectedCategory || p.category?.slug === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [shop, search, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
        <StoreNavbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-3 border-[#2D5A3D] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-[#8C8C85] tracking-wider uppercase">
            Loading Laboratory Profile…
          </p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
        <StoreNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Store size={48} className="text-[#8C8C85] mb-4" />
          <h2 className="text-2xl font-serif font-bold text-[#1A1D21]">Apothecary Lab Not Found</h2>
          <p className="text-sm text-[#5A5F6B] mt-1 max-w-md">
            The apothecary you are looking for may have been relocated or is currently updating its formulations.
          </p>
          <Link href="/shops" className="mt-6">
            <Button className="rounded-xl text-white font-semibold text-xs" style={{ background: C.primary }}>
              <ArrowLeft size={14} className="mr-1.5" /> Back to All Apothecaries
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 font-sans" style={{ background: C.bg, color: C.text }}>
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#8C8C85] mb-6">
          <Link href="/" className="hover:text-[#2D5A3D] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shops" className="hover:text-[#2D5A3D] transition-colors">Apothecaries</Link>
          <span>/</span>
          <span className="text-[#1A1D21] font-semibold">{shop.storeName}</span>
        </div>

        {/* Laboratory Profile Banner & Header Card */}
        <div className="rounded-3xl border border-[#EAE2D9] bg-white overflow-hidden shadow-sm mb-10">
          <div className="h-48 sm:h-64 relative bg-gradient-to-br from-[#DCE9E0] via-[#CBDDD2] to-[#B8D0C0] overflow-hidden">
            {shop.banner ? (
              <img
                src={shop.banner}
                alt={shop.storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-25">
                <Store size={80} className="text-[#2D5A3D]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="px-6 sm:px-10 pb-8 pt-0 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 relative z-10">
            <div className="flex items-end gap-5">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-xl flex items-center justify-center font-serif text-3xl font-bold text-white shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
              >
                {shop.logo ? (
                  <img
                    src={shop.logo}
                    alt={shop.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  shop.storeName?.[0]?.toUpperCase() || "L"
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1A1D21]">
                    {shop.storeName}
                  </h1>
                  {shop.isVerified ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                      <ShieldCheck size={13} className="text-emerald-700" />
                      Certified Artisan Lab
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      Artisan Member
                    </span>
                  )}
                </div>

                {shop.bio && (
                  <p className="text-xs sm:text-sm mt-2 max-w-2xl text-[#5A5F6B] leading-relaxed">
                    {shop.bio}
                  </p>
                )}

                {/* Contact & Location details if present */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#8C8C85]">
                  {shop.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#2D5A3D]" /> {shop.address}
                    </span>
                  )}
                  {shop.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-[#2D5A3D]" /> {shop.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-[#EAE2D9]">
              <div>
                <span className="text-2xl font-bold font-serif text-[#2D5A3D] block">
                  {shop.totalProducts || shop.products?.length || 0}
                </span>
                <span className="text-xs text-[#8C8C85]">Formulations</span>
              </div>
              <div>
                <span className="text-2xl font-bold font-serif text-[#2D5A3D] block">
                  {shop.avgRating ? `${shop.avgRating.toFixed(1)} ★` : "5.0 ★"}
                </span>
                <span className="text-xs text-[#8C8C85]">Client Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Toolbar within Shop ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-[#EAE2D9] shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C85]" />
            <input
              type="text"
              placeholder={`Search formulations by ${shop.storeName}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-[#FAF6F0] rounded-xl text-xs sm:text-sm font-medium outline-none border border-[#EAE2D9] focus:border-[#2D5A3D] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8C85] hover:text-[#1A1D21]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === ""
                    ? "bg-[#2D5A3D] text-white"
                    : "bg-[#FAF6F0] text-[#5A5F6B] hover:text-[#1A1D21] border border-[#EAE2D9]"
                }`}
              >
                All Formulations
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCategory(selectedCategory === c.slug ? "" : c.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === c.slug
                      ? "bg-[#2D5A3D] text-white"
                      : "bg-[#FAF6F0] text-[#5A5F6B] hover:text-[#1A1D21] border border-[#EAE2D9]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Formulations Catalog Grid ── */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-3xl bg-white border border-[#EAE2D9] p-8 max-w-md mx-auto">
            <Package size={40} className="mx-auto mb-3 text-[#8C8C85]/60" />
            <h3 className="text-base font-semibold text-[#1A1D21]">No formulations found</h3>
            <p className="text-xs text-[#5A5F6B] mt-1">
              No products match your search or selected category filter.
            </p>
            <Button
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
              }}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs"
            >
              Reset Filter
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
