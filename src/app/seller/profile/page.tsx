"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, CheckCircle2, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

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

export default function SellerProfilePage() {
  const { data: session } = authClient.useSession();
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="ambient-spot ambient-spot-primary w-[500px] h-[500px] -top-40 -right-40" />
          <div className="ambient-spot ambient-spot-accent w-[400px] h-[400px] bottom-20 -left-40" />
        </div>

        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 248, 245, 0.92)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <span className="font-medium text-lg" style={{ color: C.text }}>Store Settings</span>
          </div>
        </header>

        <main className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          <div className="animate-fade-in-up opacity-0 stagger-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.text }}>Store Settings & Profile</h1>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                Customize how your skincare brand appears to buyers in the Lucent marketplace.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="animate-fade-in-up opacity-0 stagger-2">
              <Card className="glass-card hover-lift p-6 space-y-5 rounded-2xl">
                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2" style={{ color: C.text, borderColor: C.borderLight }}>
                  <Store className="w-5 h-5" style={{ color: C.primary }} /> Store Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textLight }}>
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      placeholder="e.g. Pure Botanicals Skincare"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                      style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textLight }}>
                      Store Bio / Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Tell customers about your skincare formulation philosophy, ingredients quality, or story..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow resize-y"
                      style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: C.textLight }}>
                        Customer Support Email
                      </label>
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        placeholder="support@yourbrand.com"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                        style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: C.textLight }}>
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                        style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="animate-fade-in-up opacity-0 stagger-3">
              <Card className="glass-card hover-lift p-6 space-y-4 rounded-2xl">
                <h2 className="text-lg font-bold border-b pb-3" style={{ color: C.text, borderColor: C.borderLight }}>
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
            </div>

            <div className="animate-fade-in-up opacity-0 stagger-4">
              {error && (
                <div className="p-4 rounded-xl text-sm font-medium" style={{ background: "#fde8e8", border: `1px solid #f5c6c6`, color: "#b54a4a" }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl text-sm font-medium flex items-center gap-2 animate-success-pop" style={{ background: "#e8f0e6", border: `1px solid #c5dcc0`, color: "#3a5233" }}>
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}
            </div>

            <div className="flex justify-end animate-fade-in-up opacity-0 stagger-5">
              <Button
                type="submit"
                disabled={saving}
                className="magnetic-btn gradient-primary text-white font-medium px-8 py-2.5 rounded-xl shadow-sm transition-all duration-300"
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
        </main>
      </div>
    </div>
  );
}
