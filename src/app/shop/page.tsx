"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  ShoppingBag,
  Sparkles,
  Leaf,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { StoreNavbar } from "@/components/store-navbar";
import { ProductCard } from "@/components/product-card";
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

const SKIN_TYPES = [
  { label: "All Skin Types", value: "" },
  { label: "Dry Skin", value: "dry" },
  { label: "Oily Skin", value: "oily" },
  { label: "Combination", value: "combination" },
  { label: "Sensitive", value: "sensitive" },
  { label: "Normal", value: "normal" },
];

const SKIN_CONCERNS = [
  { label: "All Concerns", value: "" },
  { label: "Acne & Blemishes", value: "acne" },
  { label: "Barrier Repair", value: "barrier" },
  { label: "Hyperpigmentation", value: "hyperpigmentation" },
  { label: "Anti-Aging & Fine Lines", value: "aging" },
  { label: "Dehydration & Dryness", value: "hydration" },
  { label: "Redness & Rosacea", value: "redness" },
];

const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Under NPR 1,000", min: 0, max: 1000 },
  { label: "NPR 1,000 – 2,500", min: 1000, max: 2500 },
  { label: "NPR 2,500 – 5,000", min: 2500, max: 5000 },
  { label: "Over NPR 5,000", min: 5000, max: Infinity },
];

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSkinType, setSelectedSkinType] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState<"featured" | "price-asc" | "price-desc" | "newest" | "rating">("featured");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadShopData() {
      try {
        const [prodRes, catRes, wishRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
          fetch("/api/wishlist"),
        ]);

        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(Array.isArray(data) ? data : data.products || []);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData)) setCategories(catData);
        }
        if (wishRes.ok) {
          const wishData = await wishRes.json();
          setWishlistedIds(new Set((wishData.items ?? []).map((w: any) => w.productId as string)));
        }
      } catch (err) {
        console.error("Failed to load shop data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, []);

  // Multi-dimensional filtering logic
  const filteredProducts = useMemo(() => {
    const priceRange = PRICE_RANGES[selectedPriceIndex];

    return products.filter((p) => {
      // 1. Search filter
      if (search) {
        const s = search.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(s);
        const matchesDesc = p.description?.toLowerCase().includes(s);
        const matchesConcerns = p.skinConcerns?.toLowerCase().includes(s);
        const matchesSeller = p.seller?.storeName?.toLowerCase().includes(s);
        if (!matchesTitle && !matchesDesc && !matchesConcerns && !matchesSeller) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory && p.category?.slug !== selectedCategory) {
        return false;
      }

      // 3. Skin Type filter
      if (selectedSkinType) {
        const pSkin = (p.skinType || "").toLowerCase();
        if (!pSkin.includes(selectedSkinType) && !pSkin.includes("all")) {
          return false;
        }
      }

      // 4. Skin Concern filter
      if (selectedConcern) {
        const pConcerns = (p.skinConcerns || "").toLowerCase();
        if (!pConcerns.includes(selectedConcern)) {
          return false;
        }
      }

      // 5. Price filter
      const effectivePrice = p.discountPrice ?? p.price ?? 0;
      if (effectivePrice < priceRange.min || effectivePrice > priceRange.max) {
        return false;
      }

      // 6. In-Stock only
      if (inStockOnly && (p.stock ?? 0) <= 0) {
        return false;
      }

      return true;
    });
  }, [
    products,
    search,
    selectedCategory,
    selectedSkinType,
    selectedConcern,
    selectedPriceIndex,
    inStockOnly,
  ]);

  // Sorting
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortOption === "price-asc") {
      list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    } else if (sortOption === "rating") {
      list.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    } else if (sortOption === "newest") {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return list;
  }, [filteredProducts, sortOption]);

  const activeFiltersCount =
    (search ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedSkinType ? 1 : 0) +
    (selectedConcern ? 1 : 0) +
    (selectedPriceIndex !== 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const resetAllFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedSkinType("");
    setSelectedConcern("");
    setSelectedPriceIndex(0);
    setInStockOnly(false);
    setSortOption("featured");
  };

  return (
    <div className="min-h-screen pb-24 font-sans" style={{ background: C.bg, color: C.text }}>
      {/* Unified Luxury Navigation */}
      <StoreNavbar />

      {/* ── Editorial Header ── */}
      <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-[#EAE2D9]/80 bg-gradient-to-b from-[#FAF6F0] via-[#F5EFEB] to-[#FAF6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 bg-white/80 border border-[#EAE2D9] text-[#2D5A3D] shadow-xs">
              <Sparkles size={12} />
              <span>Clean & Verified Botanical Formulations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-[#1A1D21] leading-tight">
              Curated Botanical Skincare
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5F6B] mt-2.5 leading-relaxed">
              Explore lab-verified serums, barrier restoratives, SPF, and active treatments formulated
              by Nepal’s certified artisan apothecaries.
            </p>
          </div>
        </div>
      </section>

      {/* ── Filter & Search Control Panel ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EAE2D9] shadow-sm space-y-4">
          {/* Main Full-Width Search Input */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8C85]" />
            <input
              type="text"
              placeholder="Search formulations by title, botanical ingredients, skin concerns, or artisan apothecary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-[#FAF6F0] rounded-2xl text-sm font-medium outline-none border border-[#EAE2D9] focus:border-[#2D5A3D] focus:bg-white focus:ring-2 focus:ring-[#2D5A3D]/10 transition-all text-[#1A1D21]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8C85] hover:text-[#1A1D21] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Secondary Controls Row: Selects + In-Stock Toggle + Reset */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Skin Type Filter */}
            <select
              value={selectedSkinType}
              onChange={(e) => setSelectedSkinType(e.target.value)}
              className="px-3.5 py-2 bg-[#FAF6F0] border border-[#EAE2D9] rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer hover:bg-white hover:border-[#2D5A3D]/30 transition-colors"
            >
              {SKIN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Skin Concern Filter */}
            <select
              value={selectedConcern}
              onChange={(e) => setSelectedConcern(e.target.value)}
              className="px-3.5 py-2 bg-[#FAF6F0] border border-[#EAE2D9] rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer hover:bg-white hover:border-[#2D5A3D]/30 transition-colors"
            >
              {SKIN_CONCERNS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              value={selectedPriceIndex}
              onChange={(e) => setSelectedPriceIndex(Number(e.target.value))}
              className="px-3.5 py-2 bg-[#FAF6F0] border border-[#EAE2D9] rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer hover:bg-white hover:border-[#2D5A3D]/30 transition-colors"
            >
              {PRICE_RANGES.map((r, idx) => (
                <option key={r.label} value={idx}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Sort selector */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-3.5 py-2 bg-[#FAF6F0] border border-[#EAE2D9] rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer hover:bg-white hover:border-[#2D5A3D]/30 transition-colors"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Customer Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>

            {/* In-Stock Toggle Button */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                inStockOnly
                  ? "bg-[#2D5A3D] text-white border-[#2D5A3D] shadow-xs"
                  : "bg-[#FAF6F0] text-[#5A5F6B] border-[#EAE2D9] hover:bg-white hover:text-[#1A1D21]"
              }`}
            >
              <CheckCircle2 size={13} className={inStockOnly ? "text-white" : "text-[#8C8C85]"} />
              <span>In-Stock Only</span>
            </button>

            {/* Reset All Filters */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 flex items-center gap-1 px-2 py-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset all ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="pt-3 border-t border-[#EAE2D9]/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === ""
                  ? "bg-[#2D5A3D] text-white shadow-xs"
                  : "bg-[#FAF6F0] text-[#5A5F6B] hover:text-[#1A1D21] hover:bg-[#F5EFEB] border border-[#EAE2D9]"
              }`}
            >
              All Formulations
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? "" : cat.slug)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
                onClick={resetAllFilters}
                className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 whitespace-nowrap px-2 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Product Catalog Section ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1D21]">
              Botanical Catalog
            </h2>
            <p className="text-xs text-[#8C8C85] mt-0.5">
              Showing {sortedProducts.length} of {products.length} formulations
              {selectedCategory && ` in ${categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[#2D5A3D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#8C8C85] tracking-wider uppercase">
              Loading Clean Formulations…
            </p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-[#EAE2D9] p-8 max-w-lg mx-auto shadow-sm">
            <ShoppingBag size={44} className="mx-auto mb-3 text-[#8C8C85]/60" />
            <h3 className="text-lg font-serif font-bold text-[#1A1D21]">
              No formulations match your search
            </h3>
            <p className="text-xs text-[#5A5F6B] mt-1.5 leading-relaxed">
              We couldn’t find any active products matching your specific combination of filters.
              Try adjusting the price range, clearing concerns, or browsing all categories.
            </p>
            <Button
              onClick={resetAllFilters}
              size="sm"
              className="mt-5 rounded-xl font-semibold text-xs text-white"
              style={{ background: "#2D5A3D" }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} wishlisted={wishlistedIds.has(product.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
