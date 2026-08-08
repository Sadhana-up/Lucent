"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, Package, Edit, Trash2, ExternalLink } from "lucide-react";
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
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/seller/products");
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch seller products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeleting(slug);
    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.slug !== slug));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    } finally {
      setDeleting(null);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 animate-fade-in"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: C.text }}
          >
            Your Products
          </h1>
          <p className="text-sm mt-1" style={{ color: C.textSecondary }}>
            Manage your skincare product catalog, update inventory, and control
            pricing.
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button
            className="font-semibold magnetic-btn text-white rounded-xl"
            style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Product
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up stagger-1 opacity-0">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3.5 top-3 w-4 h-4"
            style={{ color: C.textMuted }}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
            style={{
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(8px)",
              color: C.text,
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "ACTIVE", "DRAFT", "OUT_OF_STOCK"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer magnetic-btn"
              style={{
                background:
                  statusFilter === st
                    ? "linear-gradient(135deg, #2D5A3D, #3D7A52)"
                    : "rgba(255,255,255,0.72)",
                color: statusFilter === st ? "#fff" : C.textSecondary,
                border: `1px solid ${
                  statusFilter === st ? C.primary : C.border
                }`,
                backdropFilter: "blur(8px)",
              }}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card
        className="rounded-2xl overflow-hidden animate-fade-in-up stagger-2 opacity-0"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: `1px solid ${C.borderLight}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
        }}
      >
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div
                className="w-8 h-8 border-4 rounded-full animate-spin mx-auto"
                style={{
                  borderColor: C.border,
                  borderTopColor: C.primary,
                }}
              />
              <p className="text-sm mt-3" style={{ color: C.textMuted }}>
                Loading products...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: C.primaryGhost }}
              >
                <Package size={32} style={{ color: C.primary }} />
              </div>
              <p
                className="font-semibold text-base"
                style={{ color: C.text }}
              >
                No products found
              </p>
              <p className="text-xs mt-1 mb-5" style={{ color: C.textMuted }}>
                Get started by creating your first product listing.
              </p>
              <Link href="/seller/products/new">
                <Button
                  size="sm"
                  className="magnetic-btn text-white rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #2D5A3D, #3D7A52)",
                  }}
                >
                  <PlusCircle className="w-4 h-4 mr-1" /> Create Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr
                    style={{
                      background: C.bgWarm,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <th
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      Product
                    </th>
                    <th
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      Category
                    </th>
                    <th
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      Price
                    </th>
                    <th
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      Stock
                    </th>
                    <th
                      className="p-4 font-semibold text-xs uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      Status
                    </th>
                    <th
                      className="p-4 text-right font-semibold text-xs uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, i) => (
                    <tr
                      key={product.id}
                      className="transition-colors duration-200"
                      style={{
                        borderBottom: `1px solid ${C.borderLight}`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          C.primaryGhost;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                            style={{
                              background: C.bgWarm,
                              border: `1px solid ${C.border}`,
                            }}
                          >
                            {product.images[0]?.url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ color: C.textMuted }}
                              >
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4
                              className="font-semibold text-sm"
                              style={{ color: C.text }}
                            >
                              {product.title}
                            </h4>
                            <span
                              className="text-xs block truncate max-w-xs"
                              style={{ color: C.textMuted }}
                            >
                              {product.skinType || "All skin types"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        className="p-4 text-xs font-semibold"
                        style={{ color: C.textSecondary }}
                      >
                        {product.category?.name || "Uncategorized"}
                      </td>
                      <td className="p-4 font-semibold" style={{ color: C.text }}>
                        {formatCurrency(product.price)}
                        {product.discountPrice && (
                          <span
                            className="text-xs font-normal line-through ml-1.5"
                            style={{ color: C.textMuted }}
                          >
                            {formatCurrency(product.discountPrice)}
                          </span>
                        )}
                      </td>
                      <td
                        className="p-4 text-xs font-semibold"
                        style={{ color: C.textSecondary }}
                      >
                        {product.stock} units
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background:
                              product.status === "ACTIVE"
                                ? "rgba(45, 90, 61, 0.08)"
                                : product.status === "DRAFT"
                                ? C.bgWarm
                                : C.accentGhost,
                            color:
                              product.status === "ACTIVE"
                                ? C.primary
                                : product.status === "DRAFT"
                                ? C.textSecondary
                                : C.accent,
                          }}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/shop/${product.slug}`} target="_blank">
                            <button
                              type="button"
                              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/60"
                              style={{ color: C.textMuted }}
                              title="View in Shop"
                            >
                              <ExternalLink size={15} />
                            </button>
                          </Link>
                          <Link
                            href={`/seller/products/${product.slug}/edit`}
                          >
                            <button
                              type="button"
                              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/60"
                              style={{ color: C.textMuted }}
                              title="Edit Product"
                            >
                              <Edit size={15} />
                            </button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.slug)}
                            disabled={deleting === product.slug}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 disabled:opacity-50"
                            style={{ color: "#b54a4a" }}
                            title="Delete Product"
                          >
                            {deleting === product.slug ? (
                              <div
                                className="w-4 h-4 border-2 rounded-full animate-spin"
                                style={{
                                  borderColor: "#b54a4a",
                                  borderTopColor: "transparent",
                                }}
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
