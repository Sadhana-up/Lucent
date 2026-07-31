"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, CheckCircle2, Loader2 } from "lucide-react";

export default function SellerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    storeName: "",
    bio: "",
    logo: "",
    banner: "",
    contactEmail: "",
    phone: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/seller/profile");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setForm({
              storeName: data.storeName || "",
              bio: data.bio || "",
              logo: data.logo || "",
              banner: data.banner || "",
              contactEmail: data.contactEmail || "",
              phone: data.phone || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.storeName) {
      setError("Store name is required.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setSuccess("Store profile saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-pink-200/60 pb-6">
        <h1 className="text-2xl font-bold text-rose-950 tracking-tight">Store Settings & Profile</h1>
        <p className="text-sm text-stone-500 mt-1">
          Customize how your skincare brand appears to buyers in the Lucent marketplace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-pink-200/60 p-6 space-y-5">
          <h2 className="text-lg font-bold text-rose-950 border-b border-pink-100 pb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-rose-900" /> Store Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="e.g. Pure Botanicals Skincare"
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-rose-950 block mb-1">
                Store Bio / Description
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell customers about your skincare formulation philosophy, ingredients quality, or story..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-rose-950 block mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="support@yourbrand.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-rose-950 block mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-stone-50/50 text-sm outline-none focus:border-rose-900"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-pink-200/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-rose-950 border-b border-pink-100 pb-3">
            Store Logo
          </h2>
          <div>
            <ImageUpload
              value={form.logo ? [form.logo] : []}
              onChange={(urls) => setForm({ ...form, logo: urls[0] || "" })}
              maxFiles={1}
            />
          </div>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-rose-900 hover:bg-rose-950 text-white font-medium px-8 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Store Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
