"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Search, Sparkles, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSkinType, setSelectedSkinType] = useState("");

  useEffect(() => {
    async function loadShopData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (err) {
        console.error("Failed to load shop data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.skinConcerns && p.skinConcerns.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      !selectedCategory || (p.category && p.category.slug === selectedCategory);

    const matchesSkinType =
      !selectedSkinType ||
      (p.skinType && p.skinType.toLowerCase().includes(selectedSkinType.toLowerCase()));

    return matchesSearch && matchesCategory && matchesSkinType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 via-white to-pink-50/30 text-stone-900 pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-900 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-pink-100" />
            </div>
            <span className="text-lg font-bold tracking-tight text-rose-950">
              Lucent Shop
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/shop/cart">
              <Button variant="outline" size="sm" className="border-pink-200 text-rose-950 hover:bg-pink-50">
                <ShoppingBag className="w-4 h-4 mr-1.5 text-rose-900" />
                Cart
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-rose-950 via-rose-900 to-pink-950 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Clean & Verified Formulations
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Curated Skincare Products for Your Unique Glow
            </h1>
            <p className="text-sm sm:text-base text-pink-100/90 mt-3">
              Explore independent skincare brands, serums, cleansers, and SPF formulations tailored to your skin analysis needs.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-pink-200/60 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search products, ingredients, or skin concerns (e.g. Niacinamide, Acne)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900 transition-colors"
            />
          </div>

          {/* Skin Type Selector */}
          <div className="w-full md:w-48">
            <select
              value={selectedSkinType}
              onChange={(e) => setSelectedSkinType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900 cursor-pointer"
            >
              <option value="">All Skin Types</option>
              <option value="Oily">Oily Skin</option>
              <option value="Dry">Dry Skin</option>
              <option value="Combination">Combination Skin</option>
              <option value="Sensitive">Sensitive Skin</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              !selectedCategory
                ? "bg-rose-900 text-white shadow-xs"
                : "bg-white border border-pink-200 text-stone-700 hover:bg-pink-50"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-rose-900 text-white shadow-xs"
                  : "bg-white border border-pink-200 text-stone-700 hover:bg-pink-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-rose-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 mt-3 font-medium">Loading marketplace products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-pink-200/60 text-center p-8">
            <ShoppingBag className="w-12 h-12 text-pink-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-rose-950">No products match your search</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Try adjusting your search filters or browse all skincare categories.
            </p>
            <Button
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setSelectedSkinType("");
              }}
              variant="outline"
              size="sm"
              className="mt-4 border-pink-200 text-rose-900"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
