"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { getProvinceOptions } from "@/lib/utils";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  danger: "#b54a4a",
};

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
};

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ ...emptyAddress });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in?callbackUrl=/shop/account");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session?.user) return;
    setProfile({
      name: session.user.name ?? "",
      phone: (session.user as { phone?: string | null }).phone ?? "",
    });
  }, [session]);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json)) setAddresses(json);
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) loadAddresses();
  }, [session, loadAddresses]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update profile");
      setProfileMessage("Profile updated.");
      router.refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const startNew = () => {
    setEditingId("new");
    setAddressError("");
    setForm({
      ...emptyAddress,
      fullName: session?.user?.name ?? "",
      phone: (session?.user as { phone?: string | null })?.phone ?? "",
    });
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setAddressError("");
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postalCode ?? "",
      isDefault: address.isDefault,
    });
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    setAddressError("");

    try {
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/addresses" : `/api/addresses/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save address");
      setEditingId(null);
      await loadAddresses();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setAddressSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm("Delete this saved address?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) await loadAddresses();
  };

  const makeDefault = async (id: string) => {
    const res = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) await loadAddresses();
  };

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(250, 251, 252, 0.9)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm font-semibold hover:opacity-70"
            style={{ color: C.textSecondary }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <div className="flex items-center gap-2">
            <User size={18} style={{ color: C.primary }} />
            <span className="font-semibold">My Account</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link href="/shop/orders">
            <Button variant="outline" className="rounded-xl">
              <Package className="w-4 h-4 mr-2" /> My Orders
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="rounded-xl">
              <Star className="w-4 h-4 mr-2" /> Continue Shopping
            </Button>
          </Link>
        </div>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <User size={18} style={{ color: C.primary }} />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                  Full name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-focus-glow"
                  style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                    Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={session.user.email}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: `1px solid ${C.border}`, background: C.bgWarm, color: C.textMuted }}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: C.textSecondary }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+977-98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none input-focus-glow"
                    style={{ border: `1px solid ${C.border}`, background: "#fff", color: C.text }}
                  />
                </div>
              </div>

              {profileError && (
                <p className="text-sm" style={{ color: C.danger }}>{profileError}</p>
              )}
              {profileMessage && (
                <p className="text-sm" style={{ color: C.primary }}>{profileMessage}</p>
              )}

              <Button type="submit" variant="premium" disabled={profileSaving} className="rounded-xl">
                {profileSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <div className="flex items-center gap-2">
                <MapPin size={18} style={{ color: C.primary }} />
                <h2 className="text-lg font-semibold">Saved Addresses</h2>
              </div>
              {editingId === null && (
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={startNew}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add address
                </Button>
              )}
            </div>

            {addressesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.primary }} />
              </div>
            ) : addresses.length === 0 && editingId === null ? (
              <p className="text-sm" style={{ color: C.textSecondary }}>
                No saved addresses yet. Add one to make checkout faster.
              </p>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                    style={{ background: C.primaryGhost, border: `1px solid ${C.borderLight}` }}
                  >
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: C.text }}>{address.label}</span>
                        {address.isDefault && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                            style={{ background: C.primary, color: "#fff" }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium" style={{ color: C.text }}>{address.fullName}</p>
                      <p style={{ color: C.textSecondary }}>
                        {[address.address, address.city, address.state, address.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p style={{ color: C.textSecondary }}>{address.phone}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!address.isDefault && (
                        <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => makeDefault(address.id)}>
                          Set default
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => startEdit(address)} aria-label="Edit address">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => deleteAddress(address.id)} aria-label="Delete address">
                        <Trash2 className="w-4 h-4" style={{ color: C.danger }} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingId !== null && (
              <form
                onSubmit={saveAddress}
                className="rounded-xl p-4 space-y-3"
                style={{ background: "#fff", border: `1px solid ${C.border}` }}
              >
                <h3 className="text-sm font-bold">
                  {editingId === "new" ? "New address" : "Edit address"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>Label</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="Home, Office..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>Full name *</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>Phone *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+977-98XXXXXXXX"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>Province</label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                      style={{
                        border: `1px solid ${C.border}`,
                        color: C.text,
                        background: "rgba(255,255,255,0.72)",
                      }}
                    >
                      <option value="">Select province</option>
                      {getProvinceOptions(form.state).map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>Postal code</label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: `1px solid ${C.border}`, color: C.text }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>Street address *</label>
                  <textarea
                    required
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${C.border}`, color: C.text }}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm" style={{ color: C.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Use as my default address
                </label>

                {addressError && (
                  <p className="text-sm" style={{ color: C.danger }}>{addressError}</p>
                )}

                <div className="flex gap-2">
                  <Button type="submit" variant="premium" size="sm" disabled={addressSaving} className="rounded-lg">
                    {addressSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                    Save address
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
