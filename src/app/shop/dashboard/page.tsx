"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Leaf,
  ShoppingBag,
  Package,
  Sparkles,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  ExternalLink,
  Sliders,
  User,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { StoreNavbar } from "@/components/store-navbar";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
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

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  PENDING: { icon: Clock, color: "#F59E0B", label: "Pending" },
  PROCESSING: { icon: Clock, color: "#3B82F6", label: "Processing" },
  CONFIRMED: { icon: CheckCircle, color: "#3B82F6", label: "Confirmed" },
  SHIPPED: { icon: Truck, color: "#8B5CF6", label: "Shipped" },
  DELIVERED: { icon: CheckCircle, color: C.primary, label: "Delivered" },
  CANCELLED: { icon: Clock, color: "#EF4444", label: "Cancelled" },
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in?callbackUrl=/shop/dashboard");
      return;
    }

    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "seller") {
        router.push("/seller/dashboard");
        return;
      } else if (role === "admin") {
        router.push("/admin");
        return;
      }

      async function loadDashboardData() {
        try {
          const [profRes, ordRes, cartRes, prodRes] = await Promise.all([
            fetch("/api/profile"),
            fetch("/api/orders"),
            fetch("/api/cart"),
            fetch("/api/products"),
          ]);

          let profileForScoring: any = null;
          if (profRes.ok) {
            const profData = await profRes.json();
            profileForScoring = profData;
            setProfile(profData);
          }

          if (ordRes.ok) {
            const ordData = await ordRes.json();
            setOrders(Array.isArray(ordData) ? ordData : ordData?.orders || []);
          }

          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const count = cartData.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0;
            setCartCount(count);
          }

          if (prodRes.ok) {
            const prodData = await prodRes.json();
            const list = Array.isArray(prodData) ? prodData : prodData?.products || [];
            const skin = String(profileForScoring?.skinType ?? "").toLowerCase();
            const concerns = String(profileForScoring?.skinConcerns ?? "")
              .split(",")
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean);
            const score = (p: any) => {
              const pSkin = String(p.skinType ?? "").toLowerCase();
              const pConcerns = String(p.skinConcerns ?? "").toLowerCase();
              return (skin && pSkin.includes(skin) ? 2 : 0) +
                concerns.reduce((sum, c) => sum + (pConcerns.includes(c) ? 1 : 0), 0);
            };
            setRecommendedProducts([...list].sort((a, b) => score(b) - score(a)).slice(0, 4));
          }
        } catch (err) {
          console.error("Failed to load dashboard:", err);
        } finally {
          setLoading(false);
        }
      }

      loadDashboardData();
    }
  }, [session, isPending, router]);

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.primary }} />
      </div>
    );
  }

  const user = session?.user;
  const concernsList = profile?.skinConcerns
    ? profile.skinConcerns.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg, color: C.text }}>
      {/* Top Navbar */}
      <StoreNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Welcome Hero / Skin Profile Banner */}
        <div
          className="p-8 sm:p-10 rounded-3xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 inline-block" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                Buyer Dashboard
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Welcome back, {user?.name?.split(" ")[0] || "there"}
              </h1>
              <p className="text-sm mt-2 max-w-xl text-white/80">
                Your personalized skincare hub. Track orders, explore science-backed routines, and discover formulas matched to your skin profile.
              </p>

              {/* Skin Profile Tagline */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {profile?.skinType ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                    Skin Type: <strong className="capitalize">{profile.skinType}</strong>
                  </span>
                ) : (
                  <Link href="/onboarding">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white text-emerald-900 hover:bg-white/90 cursor-pointer">
                      + Set your Skin Type
                    </span>
                  </Link>
                )}

                {concernsList.map((concern: string) => (
                  <span key={concern} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                    {concern}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/chat">
                <Button className="rounded-xl px-5 py-5 font-semibold bg-white text-emerald-900 hover:bg-white/90 shadow-md">
                  <Sparkles className="w-4 h-4 mr-2 text-emerald-700" /> Consult AI Skin Expert
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" className="rounded-xl px-5 py-5 font-semibold bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white">
                  Browse Shop <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/shop/orders" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primaryGhost }}>
                  <Package size={16} style={{ color: C.primary }} />
                </div>
              </div>
              <p className="text-2xl font-bold">{orders.length}</p>
              <span className="text-[11px] text-emerald-700 font-medium">View order history →</span>
            </Card>
          </Link>

          <Link href="/shop/cart" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cart</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primaryGhost }}>
                  <ShoppingBag size={16} style={{ color: C.primary }} />
                </div>
              </div>
              <p className="text-2xl font-bold">{cartCount}</p>
              <span className="text-[11px] text-emerald-700 font-medium">Checkout bag →</span>
            </Card>
          </Link>

          <Link href="/chat" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skin Consult</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primaryGhost }}>
                  <Sparkles size={16} style={{ color: C.primary }} />
                </div>
              </div>
              <p className="text-2xl font-bold">AI Active</p>
              <span className="text-[11px] text-emerald-700 font-medium">Start selfie scan →</span>
            </Card>
          </Link>

          <Link href="/shop/account" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Addresses</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primaryGhost }}>
                  <MapPin size={16} style={{ color: C.primary }} />
                </div>
              </div>
              <p className="text-2xl font-bold">Saved</p>
              <span className="text-[11px] text-emerald-700 font-medium">Manage delivery →</span>
            </Card>
          </Link>
        </div>

        {/* Recent Orders Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recent Orders</h2>
            <Link href="/shop/orders" className="text-xs font-semibold text-emerald-800 hover:underline">
              View all orders ({orders.length}) →
            </Link>
          </div>

          {orders.length === 0 ? (
            <Card className="glass-card rounded-2xl p-8 text-center">
              <Package size={40} className="mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold text-base">No orders yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Explore curated cleansers, serums, and moisturisers tailored for your skin type.
              </p>
              <Link href="/shop" className="inline-block mt-4">
                <Button size="sm" variant="premium" className="rounded-xl">
                  Start Shopping
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.slice(0, 2).map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = status.icon;
                return (
                  <Card key={order.id} className="glass-card rounded-2xl p-5 hover-lift">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-borderLight">
                      <div>
                        <p className="text-xs font-mono text-muted-foreground">#{order.orderNumber || order.id.slice(0, 8)}</p>
                        <p className="text-xs font-medium text-secondary">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${status.color}15`, color: status.color }}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items?.slice(0, 2).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="truncate max-w-[200px] font-medium text-foreground">
                            {item.quantity}× {item.product?.title || "Product"}
                          </span>
                          <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <p className="text-[11px] text-muted-foreground">+{order.items.length - 2} more items</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-borderLight text-xs">
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-bold text-sm text-emerald-800">{formatCurrency(order.totalAmount ?? 0)}</span>
                      </div>
                      <Link href={`/shop/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                          Details <ExternalLink size={12} className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Formulations */}
        {recommendedProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Curated Clean Formulations</h2>
                <p className="text-xs text-muted-foreground">Chosen for clean ingredient standards and barrier support</p>
              </div>
              <Link href="/shop" className="text-xs font-semibold text-emerald-800 hover:underline">
                Explore Full Shop →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Skincare Tools & Navigation Help */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Link href="/chat" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-6 text-center h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.primaryGhost }}>
                  <Sparkles size={24} style={{ color: C.primary }} />
                </div>
                <h3 className="font-bold text-base mb-1">AI Face Scan & Consult</h3>
                <p className="text-xs text-muted-foreground">Take a selfie to analyze redness, texture, hydration, and get exact ingredient pairings.</p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 mt-4 block">Launch Consult →</span>
            </Card>
          </Link>

          <Link href="/shop/routine" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-6 text-center h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.accentGhost }}>
                  <Sliders size={24} style={{ color: C.accent }} />
                </div>
                <h3 className="font-bold text-base mb-1">Daily Routine Builder</h3>
                <p className="text-xs text-muted-foreground">Organize your AM and PM routine steps. Ensure active ingredients don't cancel each other out.</p>
              </div>
              <span className="text-xs font-semibold text-purple-800 mt-4 block">Open Builder →</span>
            </Card>
          </Link>

          <Link href="/shops" className="block">
            <Card className="glass-card hover-lift rounded-2xl p-6 text-center h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: C.primaryGhost }}>
                  <Layers size={24} style={{ color: C.primary }} />
                </div>
                <h3 className="font-bold text-base mb-1">Apothecaries & Brands</h3>
                <p className="text-xs text-muted-foreground">Discover verified Nepali skincare sellers, herbal formulators, and specialty boutiques.</p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 mt-4 block">Browse Brands →</span>
            </Card>
          </Link>
        </section>
      </main>
    </div>
  );
}
