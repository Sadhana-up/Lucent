"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Search, Leaf, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  accent: "#c4956a",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
};

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
    <div className="min-h-screen pb-16" style={{ background: C.bg, color: C.text }}>
      {/* Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 248, 245, 0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-medium tracking-tight" style={{ color: C.text }}>
              Lucent Shop
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/shop/cart">
              <Button variant="outline" size="sm" className="rounded-xl transition-all duration-300 hover:bg-[rgba(74,103,65,0.04)]" style={{ borderColor: C.border, color: C.text }}>
                <ShoppingBag className="w-4 h-4 mr-1.5" />
                Cart
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="p-8 sm:p-12 rounded-3xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)" }}>
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-10 left-20 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider mb-3 inline-block" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
              Clean & Verified Formulations
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
              Curated Skincare for Your Unique Glow
            </h1>
            <p className="text-sm sm:text-base mt-3" style={{ color: "rgba(255,255,255,0.8)" }}>
              Explore independent skincare brands, serums, cleansers, and SPF formulations tailored to your skin analysis needs.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl glass-card animate-fade-in">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4" style={{ color: C.textMuted }} />
            <input
              type="text"
              placeholder="Search products, ingredients, or skin concerns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
              style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 transition-colors duration-200 hover:opacity-70"
                style={{ color: C.textMuted }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedSkinType}
              onChange={(e) => setSelectedSkinType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none cursor-pointer transition-all duration-300 input-focus-glow"
              style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("")}
            className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 cursor-pointer"
            style={{
              background: !selectedCategory ? "linear-gradient(135deg, #4a6741, #6b8c62)" : "#fff",
              color: !selectedCategory ? "#fff" : C.textLight,
              border: `1px solid ${!selectedCategory ? "transparent" : C.border}`,
            }}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 cursor-pointer"
              style={{
                background: selectedCategory === cat.slug ? "linear-gradient(135deg, #4a6741, #6b8c62)" : "#fff",
                color: selectedCategory === cat.slug ? "#fff" : C.textLight,
                border: `1px solid ${selectedCategory === cat.slug ? "transparent" : C.border}`,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: C.border, borderTopColor: C.primary }} />
            <p className="text-sm mt-3 font-medium" style={{ color: C.textMuted }}>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 rounded-3xl text-center p-8 glass-card">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: C.textMuted }} />
            <h3 className="text-lg font-medium" style={{ color: C.text }}>No products match your search</h3>
            <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: C.textMuted }}>
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
              className="mt-4 rounded-xl"
              style={{ borderColor: C.border, color: C.text }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
