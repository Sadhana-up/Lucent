"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, CheckCircle2, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getPhoneValidationError } from "@/lib/utils";

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

    if (form.phone) {
      const phoneError = getPhoneValidationError(form.phone);
      if (phoneError) {
        setError(phoneError);
        return;
      }
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

        <header className="sticky top-0 z-40 backdrop-blur-md" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.92)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <span className="font-semibold text-lg" style={{ color: C.text }}>Store Settings</span>
          </div>
        </header>

        <main className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          <div className="animate-fade-in-up opacity-0 stagger-1">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>Store Settings & Profile</h1>
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                Customize how your skincare brand appears to buyers in the Lucent marketplace.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="animate-fade-in-up opacity-0 stagger-2">
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
                <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2" style={{ color: C.text, borderColor: C.borderLight }}>
                  <Store className="w-5 h-5" style={{ color: C.primary }} /> Store Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      placeholder="e.g. Pure Botanicals Skincare"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                      style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)", color: C.text }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                      Store Bio / Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Tell customers about your skincare formulation philosophy, ingredients quality, or story..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow resize-y"
                      style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)", color: C.text }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                        Customer Support Email
                      </label>
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        placeholder="support@yourbrand.com"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                        style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)", color: C.text }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+977-98XXXXXXXX"
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                        style={{ border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)", color: C.text }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="animate-fade-in-up opacity-0 stagger-3">
              <Card
                className="p-6 space-y-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(16px) saturate(180%)",
                  WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  border: `1px solid ${C.borderLight}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.02)",
                }}
              >
                <h2 className="text-lg font-semibold border-b pb-3" style={{ color: C.text, borderColor: C.borderLight }}>
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
                <div
                  className="p-4 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(181, 74, 74, 0.06)", border: `1px solid rgba(181, 74, 74, 0.2)`, color: "#8b3a3a" }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-success-pop"
                  style={{ background: "rgba(45, 90, 61, 0.06)", border: `1px solid rgba(45, 90, 61, 0.15)`, color: C.primary }}
                >
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}
            </div>

            <div className="flex justify-end animate-fade-in-up opacity-0 stagger-5">
              <Button
                type="submit"
                disabled={saving}
                className="magnetic-btn text-white font-semibold px-8 py-2.5 rounded-xl shadow-sm transition-all duration-300"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
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
