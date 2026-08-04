"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, Leaf } from "lucide-react";
import Link from "next/link";

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
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{
            borderColor: C.border,
            borderTopColor: C.primary,
          }}
        />
      </div>
    );
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow";

  const inputStyle = {
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(8px)",
    color: C.text,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seller/products">
          <Button
            variant="outline"
            size="sm"
            className="magnetic-btn rounded-xl"
            style={{
              border: `1px solid ${C.border}`,
              color: C.textSecondary,
              background: "rgba(255,255,255,0.5)",
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
            Edit Product
          </h1>
          <p className="text-xs" style={{ color: C.textMuted }}>
            Update product details, pricing, images, and status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card
          className="p-6 space-y-6 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: `1px solid ${C.borderLight}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
          }}
        >
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: C.primaryGhost }}
            >
              <Leaf size={16} style={{ color: C.primary }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: C.text }}>
              Product Images
            </h2>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: C.textSecondary }}>
              Upload Images (Stored in /uploads) *
            </label>
            <ImageUpload
              value={form.images}
              onChange={(urls) => setForm({ ...form, images: urls })}
              maxFiles={5}
            />
          </div>
        </Card>

        <Card
          className="p-6 space-y-5 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: `1px solid ${C.borderLight}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
          }}
        >
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: C.primaryGhost }}
            >
              <Leaf size={16} style={{ color: C.primary }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: C.text }}>
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Product Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
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
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
                style={inputStyle}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="OUT_OF_STOCK">OUT OF STOCK</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Discount Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                Full Description *
              </label>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputClass} resize-y`}
                style={inputStyle}
              />
            </div>
          </div>
        </Card>

        {error && (
          <div
            className="p-4 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(181, 74, 74, 0.06)",
              border: "1px solid rgba(181, 74, 74, 0.2)",
              color: "#8b3a3a",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/seller/products">
            <Button
              variant="outline"
              type="button"
              className="magnetic-btn rounded-xl"
              style={{
                border: `1px solid ${C.border}`,
                color: C.textSecondary,
                background: "rgba(255,255,255,0.5)",
              }}
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="text-white font-semibold px-6 rounded-xl magnetic-btn"
            style={{
              background: "linear-gradient(135deg, #2D5A3D, #3D7A52)",
            }}
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
