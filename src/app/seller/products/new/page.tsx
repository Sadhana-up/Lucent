"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Leaf } from "lucide-react";
import Link from "next/link";

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

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow";

  const inputStyle = {
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    color: C.text,
  };

  const labelClass = "text-xs font-semibold block mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href="/seller/products">
          <Button
            variant="outline"
            size="sm"
            className="magnetic-btn rounded-xl"
            style={{
              border: `1px solid ${C.border}`,
              color: C.textLight,
              background: "rgba(255,255,255,0.5)",
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: C.text }}
          >
            Add New Product
          </h1>
          <p className="text-xs" style={{ color: C.textMuted }}>
            Enlist your skincare product with details, skin concerns, and high
            quality images.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <Card
          className="glass-card rounded-2xl overflow-hidden animate-fade-in-up stagger-1 opacity-0"
          style={{ border: `1px solid ${C.border}` }}
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: C.primaryGhost }}
              >
                <Leaf size={16} style={{ color: C.primary }} />
              </div>
              <h2
                className="text-base font-semibold"
                style={{ color: C.text }}
              >
                Product Images
              </h2>
            </div>
            <div>
              <label
                className={labelClass}
                style={{ color: C.textLight }}
              >
                Upload Images (Stored locally in /uploads) *
              </label>
              <ImageUpload
                value={form.images}
                onChange={(urls) => setForm({ ...form, images: urls })}
                maxFiles={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Basic Information Section */}
        <Card
          className="glass-card rounded-2xl overflow-hidden animate-fade-in-up stagger-2 opacity-0"
          style={{ border: `1px solid ${C.border}` }}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: C.primaryGhost }}
              >
                <Leaf size={16} style={{ color: C.primary }} />
              </div>
              <h2
                className="text-base font-semibold"
                style={{ color: C.text }}
              >
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass} style={{ color: C.textLight }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Lucent Vitamin C Niacinamide Glow Serum"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className={inputClass}
                  style={inputStyle}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="ACTIVE">ACTIVE (Visible in shop)</option>
                  <option value="DRAFT">DRAFT (Hidden)</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                </select>
              </div>

              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="29.99"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Discount Price ($) (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={(e) =>
                    setForm({ ...form, discountPrice: e.target.value })
                  }
                  placeholder="24.99"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} style={{ color: C.textLight }}>
                  Full Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe what this product does, key benefits, and why customers will love it..."
                  className={`${inputClass} resize-y`}
                  style={inputStyle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skincare Specifics Section */}
        <Card
          className="glass-card rounded-2xl overflow-hidden animate-fade-in-up stagger-3 opacity-0"
          style={{ border: `1px solid ${C.border}` }}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: C.primaryGhost }}
              >
                <Leaf size={16} style={{ color: C.primary }} />
              </div>
              <h2
                className="text-base font-semibold"
                style={{ color: C.text }}
              >
                Skincare Specifics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Target Skin Types
                </label>
                <input
                  type="text"
                  value={form.skinType}
                  onChange={(e) =>
                    setForm({ ...form, skinType: e.target.value })
                  }
                  placeholder="e.g. Oily, Combination, Sensitive"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: C.textLight }}>
                  Target Skin Concerns (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.skinConcerns}
                  onChange={(e) =>
                    setForm({ ...form, skinConcerns: e.target.value })
                  }
                  placeholder="e.g. Acne, Dark Spots, Redness, Fine Lines"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} style={{ color: C.textLight }}>
                  Key Ingredients
                </label>
                <input
                  type="text"
                  value={form.ingredients}
                  onChange={(e) =>
                    setForm({ ...form, ingredients: e.target.value })
                  }
                  placeholder="e.g. 10% Niacinamide, 2% Salicylic Acid, Hyaluronic Acid, Centella Asiatica"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} style={{ color: C.textLight }}>
                  How to Use / Directions
                </label>
                <textarea
                  rows={2}
                  value={form.usageInstructions}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usageInstructions: e.target.value,
                    })
                  }
                  placeholder="Apply 3-4 drops morning and night after cleansing. Follow with moisturizer and SPF."
                  className={`${inputClass} resize-y`}
                  style={inputStyle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div
            className="p-4 rounded-xl text-sm font-medium animate-fade-in"
            style={{
              background: "rgba(181, 74, 74, 0.06)",
              border: "1px solid rgba(181, 74, 74, 0.2)",
              color: "#8b3a3a",
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 animate-fade-in-up stagger-4 opacity-0">
          <Link href="/seller/products">
            <Button
              variant="outline"
              type="button"
              className="magnetic-btn rounded-xl"
              style={{
                border: `1px solid ${C.border}`,
                color: C.textLight,
                background: "rgba(255,255,255,0.5)",
              }}
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="text-white font-medium px-6 rounded-xl magnetic-btn"
            style={{
              background: "linear-gradient(135deg, #4a6741, #6b8c62)",
            }}
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
