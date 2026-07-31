"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "10",
    categoryId: "",
    skinType: "All Skin Types",
    skinConcerns: "Acne, Dryness, Dullness",
    ingredients: "",
    usageInstructions: "",
    status: "ACTIVE",
    images: [] as string[],
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) {
            setForm((f) => ({ ...f, categoryId: data[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.description || !form.price) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.images.length === 0) {
      setError("Please upload at least one product image.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/seller/products");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seller/products">
          <Button variant="outline" size="sm" className="border-pink-200 text-stone-700">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-rose-950 tracking-tight">Add New Product</h1>
          <p className="text-xs text-stone-500">
            Enlist your skincare product with details, skin concerns, and high quality images.
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
              Upload Images (Stored locally in /uploads) *
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
                placeholder="e.g. Lucent Vitamin C Niacinamide Glow Serum"
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
                <option value="ACTIVE">ACTIVE (Visible in shop)</option>
                <option value="DRAFT">DRAFT (Hidden)</option>
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
                placeholder="29.99"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Discount Price ($) (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                placeholder="24.99"
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
                placeholder="Describe what this product does, key benefits, and why customers will love it..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900 resize-y"
              />
            </div>
          </div>
        </Card>

        <Card className="border-pink-200/60 p-6 space-y-5">
          <h2 className="text-lg font-bold text-rose-950 border-b border-pink-100 pb-3">
            Skincare Specifics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Target Skin Types
              </label>
              <input
                type="text"
                value={form.skinType}
                onChange={(e) => setForm({ ...form, skinType: e.target.value })}
                placeholder="e.g. Oily, Combination, Sensitive"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Target Skin Concerns (Comma separated)
              </label>
              <input
                type="text"
                value={form.skinConcerns}
                onChange={(e) => setForm({ ...form, skinConcerns: e.target.value })}
                placeholder="e.g. Acne, Dark Spots, Redness, Fine Lines"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Key Ingredients
              </label>
              <input
                type="text"
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                placeholder="e.g. 10% Niacinamide, 2% Salicylic Acid, Hyaluronic Acid, Centella Asiatica"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                How to Use / Directions
              </label>
              <textarea
                rows={2}
                value={form.usageInstructions}
                onChange={(e) => setForm({ ...form, usageInstructions: e.target.value })}
                placeholder="Apply 3-4 drops morning and night after cleansing. Follow with moisturizer and SPF."
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
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
            disabled={loading}
            className="bg-rose-900 hover:bg-rose-950 text-white font-medium px-6 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Product"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
