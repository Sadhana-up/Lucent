"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "10",
    categoryId: "",
    skinType: "",
    skinConcerns: "",
    ingredients: "",
    usageInstructions: "",
    status: "ACTIVE",
    images: [] as string[],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/products/${id}`),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (prodRes.ok) {
          const prod = await prodRes.json();
          setForm({
            title: prod.title || "",
            description: prod.description || "",
            price: prod.price ? String(prod.price) : "",
            discountPrice: prod.discountPrice ? String(prod.discountPrice) : "",
            stock: prod.stock !== undefined ? String(prod.stock) : "0",
            categoryId: prod.categoryId || "",
            skinType: prod.skinType || "",
            skinConcerns: prod.skinConcerns || "",
            ingredients: prod.ingredients || "",
            usageInstructions: prod.usageInstructions || "",
            status: prod.status || "ACTIVE",
            images: prod.images ? prod.images.map((img: any) => img.url) : [],
          });
        }
      } catch (err) {
        console.error("Failed to load product data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      router.push("/seller/products");
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seller/products">
          <Button variant="outline" size="sm" className="border-pink-200 text-stone-700">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-rose-950 tracking-tight">Edit Product</h1>
          <p className="text-xs text-stone-500">
            Update product details, pricing, images, and status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-pink-200/60 p-6 space-y-6">
          <h2 className="text-lg font-bold text-rose-950 border-b border-pink-100 pb-3">
            Product Images
          </h2>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 block mb-2">
              Upload Images (Stored in /uploads) *
            </label>
            <ImageUpload
              value={form.images}
              onChange={(urls) => setForm({ ...form, images: urls })}
              maxFiles={5}
            />
          </div>
        </Card>

        <Card className="border-pink-200/60 p-6 space-y-5">
          <h2 className="text-lg font-bold text-rose-950 border-b border-pink-100 pb-3">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="OUT_OF_STOCK">OUT OF STOCK</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Discount Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Full Description *
              </label>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900 resize-y"
              />
            </div>
          </div>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/seller/products">
            <Button variant="outline" type="button" className="border-pink-200 text-stone-700">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-rose-900 hover:bg-rose-950 text-white font-medium px-6 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              "Update Product"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
