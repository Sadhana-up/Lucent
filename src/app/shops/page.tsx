"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Store,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  X,
  Sparkles,
  ShieldCheck,
  FlaskConical,
  Leaf,
  MapPin,
  ChevronRight,
  Package,
} from "lucide-react";
import { StoreNavbar } from "@/components/store-navbar";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryDark: "#1E3D2A",
  primaryGhost: "rgba(45, 90, 61, 0.07)",
  accent: "#7C6BEA",
  bg: "#FAF6F0",
  bgWarm: "#F5EFEB",
  card: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#8C8C85",
  border: "#EAE2D9",
  borderLight: "#F4EFE7",
};

interface ShopCategory {
  id: string;
  name: string;
  slug: string;
}

interface ShopItem {
  id: string;
  storeName: string;
  storeSlug: string;
  bio?: string | null;
  logo?: string | null;
  banner?: string | null;
  isVerified?: boolean;
  phone?: string | null;
  address?: string | null;
  _count?: {
    products: number;
  };
  products?: {
    id: string;
    title: string;
    price: number;
    discountPrice?: number | null;
    images?: { url: string }[];
    category?: { name: string; slug: string } | null;
  }[];
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

export default function WebShopsPage() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortOption, setSortOption] = useState<"featured" | "name" | "newest" | "products">("featured");

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  // Fetch shops based on active query
  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (verifiedOnly) q.append("verified", "true");
    if (selectedCategory) q.append("category", selectedCategory);
    if (sortOption !== "featured") q.append("sort", sortOption);

    const qs = q.toString();

    fetch(`/api/shops${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setShops(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, verifiedOnly, selectedCategory, sortOption]);

  // Client sort for products count if chosen
  const displayedShops = useMemo(() => {
    if (sortOption === "products") {
      return [...shops].sort(
        (a, b) => (b._count?.products || 0) - (a._count?.products || 0)
      );
    }
    return shops;
  }, [shops, sortOption]);

  const activeFiltersCount =
    (search ? 1 : 0) + (selectedCategory ? 1 : 0) + (verifiedOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setVerifiedOnly(false);
    setSortOption("featured");
  };

  return (
    <div className="min-h-screen pb-24 font-sans" style={{ background: C.bg, color: C.text }}>
      {/* Global Luxury Navigation */}
      <StoreNavbar />

      {/* ── Editorial Botanical Hero ── */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-[#EAE2D9]/80 bg-gradient-to-b from-[#FAF6F0] via-[#F5EFEB] to-[#FAF6F0]">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-24 right-10 w-96 h-96 rounded-full bg-[#2D5A3D]/8 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#7C6BEA]/6 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 bg-white/80 border border-[#EAE2D9] text-[#2D5A3D] shadow-xs">
              <FlaskConical size={13} />
              <span>Certified Artisan Formulators</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-[#1A1D21] leading-[1.15]">
              Botanical Labs & Artisan Apothecaries
            </h1>
            <p className="text-sm sm:text-base mt-4 text-[#5A5F6B] leading-relaxed max-w-2xl">
              Discover verified cosmetic chemists, high-elevation herbalists, and clean botanical
              laboratories in Nepal. Pure small-batch formulations directly from the formulators
              who created them.
            </p>
          </div>

          {/* 4 Pillars of Botanical Integrity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-8 border-t border-[#EAE2D9]">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-[#EAE2D9]/60">
              <div className="w-8 h-8 rounded-xl bg-[#2D5A3D]/10 flex items-center justify-center shrink-0 text-[#2D5A3D]">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1D21]">Verified Integrity</h4>
                <p className="text-[11px] text-[#8C8C85] mt-0.5">Strict quality & safety screening</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-[#EAE2D9]/60">
              <div className="w-8 h-8 rounded-xl bg-[#2D5A3D]/10 flex items-center justify-center shrink-0 text-[#2D5A3D]">
                <Leaf size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1D21]">Native Botanicals</h4>
                <p className="text-[11px] text-[#8C8C85] mt-0.5">Himalayan sea buckthorn & herbs</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-[#EAE2D9]/60">
              <div className="w-8 h-8 rounded-xl bg-[#2D5A3D]/10 flex items-center justify-center shrink-0 text-[#2D5A3D]">
                <FlaskConical size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1D21]">Direct Lab Formulations</h4>
                <p className="text-[11px] text-[#8C8C85] mt-0.5">Zero distributor markups</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-[#EAE2D9]/60">
              <div className="w-8 h-8 rounded-xl bg-[#2D5A3D]/10 flex items-center justify-center shrink-0 text-[#2D5A3D]">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1D21]">Small-Batch Potency</h4>
                <p className="text-[11px] text-[#8C8C85] mt-0.5">Freshly compounded batches</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Discovery, Filter & Search Toolbar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EAE2D9] shadow-md space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8C85]"
              />
              <input
                type="text"
                placeholder="Search by apothecary name, bio, or botanical formulation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-[#FAF6F0] rounded-2xl text-xs sm:text-sm font-medium outline-none border border-[#EAE2D9] focus:border-[#2D5A3D] focus:bg-white focus:ring-2 focus:ring-[#2D5A3D]/10 transition-all text-[#1A1D21] placeholder-[#8C8C85]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8C85] hover:text-[#1A1D21] p-1 rounded-full transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Filter Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Verified Toggle */}
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  verifiedOnly
                    ? "bg-[#2D5A3D] text-white border-[#2D5A3D] shadow-xs"
                    : "bg-[#FAF6F0] text-[#5A5F6B] border-[#EAE2D9] hover:bg-white hover:border-[#2D5A3D]/40"
                }`}
              >
                <CheckCircle2 size={14} className={verifiedOnly ? "text-white" : "text-[#2D5A3D]"} />
                <span>Verified Labs Only</span>
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EAE2D9] rounded-2xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer hover:bg-white transition-colors"
              >
                <option value="featured">Sort: Featured Labs</option>
                <option value="products">Sort: Most Formulations</option>
                <option value="name">Sort: Name (A-Z)</option>
                <option value="newest">Sort: Newly Certified</option>
              </select>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="pt-2 border-t border-[#EAE2D9]/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === ""
                  ? "bg-[#2D5A3D] text-white shadow-xs"
                  : "bg-[#FAF6F0] text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#F5EFEB] border border-[#EAE2D9]"
              }`}
            >
              All Formulators
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? "" : cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#2D5A3D] text-white shadow-xs"
                      : "bg-[#FAF6F0] text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#F5EFEB] border border-[#EAE2D9]"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 whitespace-nowrap px-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Catalog Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1D21]">
              Artisan Formulators
            </h2>
            <p className="text-xs text-[#8C8C85] mt-0.5">
              Showing {displayedShops.length} certified{" "}
              {displayedShops.length === 1 ? "apothecary" : "apothecaries"}
              {selectedCategory && ` with formulations in this category`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-9 h-9 border-3 border-[#2D5A3D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#8C8C85] tracking-wider uppercase">
              Curating Artisan Apothecaries…
            </p>
          </div>
        ) : displayedShops.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-[#EAE2D9] p-8 max-w-xl mx-auto shadow-sm">
            <Store size={44} className="mx-auto mb-3 text-[#8C8C85]/60" />
            <h3 className="text-lg font-serif font-bold text-[#1A1D21]">
              No apothecaries found matching your search
            </h3>
            <p className="text-xs text-[#5A5F6B] mt-1.5 leading-relaxed">
              We couldn’t find any laboratories matching your filter criteria. Try searching for a
              different keyword, removing the category filter, or exploring all formulators.
            </p>
            <Button
              onClick={clearAllFilters}
              size="sm"
              className="mt-5 rounded-xl font-semibold text-xs text-white"
              style={{ background: "#2D5A3D" }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedShops.map((shop) => {
              // Extract unique categories this shop formulates for
              const shopCategories = Array.from(
                new Set(
                  (shop.products || [])
                    .map((p) => p.category?.name)
                    .filter(Boolean) as string[]
                )
              );

              return (
                <div
                  key={shop.id}
                  className="rounded-3xl border border-[#EAE2D9] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-[#2D5A3D]/40 transition-all duration-300 flex flex-col group"
                >
                  {/* Panoramic Laboratory Banner */}
                  <div className="h-36 sm:h-40 relative bg-gradient-to-br from-[#DCE9E0] to-[#C2D8CB] overflow-hidden">
                    {shop.banner ? (
                      <img
                        src={shop.banner}
                        alt={shop.storeName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <Store size={64} className="text-[#2D5A3D]" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Verified Lab Badge */}
                    {shop.isVerified ? (
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/95 text-[#2D5A3D] shadow-sm backdrop-blur-md">
                        <CheckCircle2 size={12} className="text-[#2D5A3D]" />
                        <span>Certified Lab</span>
                      </div>
                    ) : (
                      <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-[10px] font-medium bg-white/80 text-[#8C8C85] backdrop-blur-md">
                        Artisan Lab
                      </div>
                    )}
                  </div>

                  {/* Apothecary Identity & Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Monogram / Logo & Name Header */}
                    <div className="flex items-start gap-4 -mt-12 mb-4 relative z-10">
                      <div
                        className="w-16 h-16 rounded-2xl border-4 border-white shadow-md flex items-center justify-center font-serif text-2xl font-bold text-white shrink-0 overflow-hidden"
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

                      <div className="pt-5 truncate flex-1">
                        <h3 className="font-serif font-bold text-xl text-[#1A1D21] leading-tight truncate">
                          {shop.storeName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-[#2D5A3D] flex items-center gap-1">
                            <Package size={12} />
                            {shop._count?.products || 0} Formulations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio / Formulator Philosophy */}
                    <p className="text-xs text-[#5A5F6B] leading-relaxed line-clamp-3 mb-4">
                      {shop.bio ||
                        "Formulating clean, botanically driven skincare with clinical grade actives and wild-harvested herbs."}
                    </p>

                    {/* Category Tags */}
                    {shopCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {shopCategories.slice(0, 3).map((catName) => (
                          <span
                            key={catName}
                            className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#FAF6F0] text-[#2D5A3D] border border-[#EAE2D9]"
                          >
                            {catName}
                          </span>
                        ))}
                        {shopCategories.length > 3 && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-[#8C8C85]">
                            +{shopCategories.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Featured Formulations Carousel / Thumbnails */}
                    {shop.products && shop.products.length > 0 && (
                      <div className="mt-auto pt-4 border-t border-[#EAE2D9]/80 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C85]">
                          Featured Formulations
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {shop.products.slice(0, 3).map((prod) => (
                            <Link
                              key={prod.id}
                              href={`/shops/${shop.storeSlug}`}
                              className="group/prod flex flex-col items-center text-center p-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F5EFEB] border border-[#EAE2D9]/70 transition-all"
                            >
                              <div className="w-full aspect-square rounded-lg bg-white overflow-hidden mb-1.5">
                                {prod.images?.[0]?.url ? (
                                  <img
                                    src={prod.images[0].url}
                                    alt={prod.title}
                                    className="w-full h-full object-cover transition-transform group-hover/prod:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#8C8C85]">
                                    <Leaf size={14} />
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-[#1A1D21] line-clamp-1 w-full">
                                {prod.title}
                              </span>
                              <span className="text-[10px] font-bold text-[#2D5A3D]">
                                {formatCurrency(prod.discountPrice ?? prod.price)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA Button to Store */}
                    <div className="mt-5 pt-3">
                      <Link href={`/shops/${shop.storeSlug}`} className="block">
                        <Button
                          variant="outline"
                          className="w-full justify-between rounded-xl text-xs font-semibold border-[#EAE2D9] text-[#1A1D21] group-hover:bg-[#2D5A3D] group-hover:text-white group-hover:border-[#2D5A3D] transition-all"
                        >
                          <span>Explore Laboratory Store</span>
                          <ChevronRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
