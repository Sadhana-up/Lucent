"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, Package, Edit, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.slug !== slug));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-200/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-rose-950 tracking-tight">Your Products</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your skincare product catalog, update inventory, and control pricing.
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button className="bg-rose-900 hover:bg-rose-950 text-white font-medium shadow-sm">
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Product
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm outline-none focus:border-rose-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "ACTIVE", "DRAFT", "OUT_OF_STOCK"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-rose-900 text-white shadow-xs"
                  : "bg-white border border-pink-200 text-stone-600 hover:bg-pink-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-pink-200/60 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              <Package className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <p className="font-semibold text-rose-950">No products found</p>
              <p className="text-xs mt-1">Get started by creating your first product listing.</p>
              <div className="mt-4">
                <Link href="/seller/products/new">
                  <Button size="sm" className="bg-rose-900 text-white">
                    <PlusCircle className="w-4 h-4 mr-1" /> Create Product
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-pink-50/60 text-xs text-stone-600 uppercase border-b border-pink-200/60">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-pink-50/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-pink-100 overflow-hidden shrink-0 border border-pink-200/60">
                            {product.images[0]?.url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-rose-950 text-sm">
                              {product.title}
                            </h4>
                            <span className="text-xs text-stone-500 block truncate max-w-xs">
                              {product.skinType || "All skin types"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-stone-700">
                        {product.category?.name || "Uncategorized"}
                      </td>
                      <td className="p-4 font-bold text-rose-950">
                        ${product.price.toFixed(2)}
                        {product.discountPrice && (
                          <span className="text-xs text-stone-400 font-normal line-through ml-1.5">
                            ${product.discountPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-semibold text-stone-800">
                        {product.stock} units
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : product.status === "DRAFT"
                              ? "bg-stone-100 text-stone-700"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/shop/${product.slug}`} target="_blank">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-900 hover:bg-pink-100/60"
                              title="View in Shop"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </Link>
                          <Link href={`/seller/products/${product.slug}/edit`}>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-900 hover:bg-pink-100/60"
                              title="Edit Product"
                            >
                              <Edit size={16} />
                            </button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.slug)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-100/60"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
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
