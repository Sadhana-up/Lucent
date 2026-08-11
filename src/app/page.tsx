"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { UserProfileModal } from "@/components/user-profile-modal";
import { RoutineBuilder } from "@/components/routine-builder";
import { ConcernsMatrix } from "@/components/concerns-matrix";
import {
  Camera,
  MessageCircle,
  FlaskConical,
  Map,
  ArrowRight,
  CheckCircle,
  Sliders,
  Layers,
  Leaf,
  Shield,
  Zap,
  ShoppingBag,
  Package,
} from "lucide-react";

/* ─── Palette ─── */
const C = {
  primary: "#435B49",
  primaryLight: "#5B7562",
  primaryDark: "#2B3B2F",
  primaryGhost: "rgba(67, 91, 73, 0.05)",
  accent: "#9A94C5",
  accentGhost: "rgba(154, 148, 197, 0.06)",
  rose: "#5A7F75",
  roseGhost: "rgba(90, 127, 117, 0.08)",
  bg: "#FAF6F0",
  bgWarm: "#F5EFEB",
  text: "#2A2A28",
  textSecondary: "#5C5C58",
  textMuted: "#9C9C96",
  border: "#EAE2D9",
  borderLight: "#F4EFE7",
};

/* ─── Data ─── */
const STEPS = [
  { num: "01", icon: Camera, title: "Capture", desc: "A quick selfie or photo of your skin. We take it from there." },
  { num: "02", icon: MessageCircle, title: "Consult", desc: "Tell us about your routine, lifestyle, and what hasn't worked before." },
  { num: "03", icon: FlaskConical, title: "Analyze", desc: "A detailed breakdown of what your skin actually needs — not what's trending." },
  { num: "04", icon: Map, title: "Navigate", desc: "Your personalized routine, product picks, and a plan you can stick with." },
];

const FEATURES = [
  { icon: Leaf, title: "Skin Profile", desc: "Your skin type, environment, and history in one place. Updated as you go." },
  { icon: FlaskConical, title: "Ingredient Check", desc: "We cross-reference every product against what your skin can actually handle." },
  { icon: Shield, title: "Barrier Watch", desc: "We flag when your routine is wearing down your skin barrier — before you notice." },
  { icon: Zap, title: "Fast Answers", desc: "No waiting rooms. Upload, chat, get your routine. Usually under five minutes." },
  { icon: Sliders, title: "Routine Builder", desc: "Morning and evening steps laid out clearly. Swap products, adjust order." },
  { icon: Layers, title: "Product Layering", desc: "See which products play well together and which ones cancel each other out." },
];

/* ─── Main Component ─── */
export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"analyzer" | "builder" | "matrix">("analyzer");
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "seller" || role === "admin") router.push("/seller");
    }
  }, [session, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: C.bg, color: C.text }}>

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(250, 246, 240, 0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.borderLight}` : "1px solid transparent",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: C.primary }}
            >
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-serif text-xl font-semibold" style={{ color: C.primary }}>
              Lucent
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["How it works", "What we check", "Tools", "Shop"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors duration-200"
                style={{ color: C.textSecondary }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                {(session.user as { role?: string }).role !== "seller" && (session.user as { role?: string }).role !== "admin" && (
                  <>
                    <button
                      onClick={() => router.push("/shop/cart")}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
                    >
                      <ShoppingBag size={14} />
                    </button>
                    <button
                      onClick={() => router.push("/shop/orders")}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
                    >
                      <Package size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
                >
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    session.user.name?.charAt(0).toUpperCase()
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm"
                  style={{ color: C.textSecondary }}
                  onClick={() => router.push("/sign-in")}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  className="text-sm font-medium text-white"
                  style={{ background: C.primary }}
                  onClick={() => router.push("/sign-up")}
                >
                  Get started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium tracking-widest uppercase mb-5"
            style={{ color: C.primary }}
          >
            Skincare, simplified
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-[1.1] mb-6"
            style={{ color: C.text }}
          >
            Your skin has a story.
            <br />
            <span style={{ color: C.primary }}>We help you read it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base md:text-lg leading-relaxed mb-10 max-w-lg"
            style={{ color: C.textSecondary }}
          >
            Upload a photo, tell us about your routine, and get a skincare plan that
            actually makes sense for your skin — not someone else's.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              size="lg"
              className="text-sm font-medium text-white px-8 h-12"
              style={{ background: C.primary }}
              onClick={() => router.push("/chat")}
            >
              Start my skin consultation
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-sm h-12 px-8"
              style={{ borderColor: C.border, color: C.textSecondary }}
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-5 mt-8 text-xs"
            style={{ color: C.textMuted }}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} style={{ color: C.primary }} /> Free to start
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} style={{ color: C.primary }} /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} style={{ color: C.primary }} /> Takes 5 minutes
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="py-20"
        style={{ background: C.bgWarm, borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-14" style={{ color: C.text }}>
            Four steps. That's it.
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex gap-5"
                >
                  <div className="flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
                    >
                      <Icon size={16} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs mb-1 font-medium" style={{ color: C.textMuted }}>{step.num}</p>
                    <h3 className="text-base font-bold mb-1.5" style={{ color: C.text }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What We Check ── */}
      <section id="what-we-check" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
            What we check
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-14" style={{ color: C.text }}>
            The details that matter.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <div className="mb-3">
                    <Icon size={18} style={{ color: C.primary }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: C.text }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive Tools ── */}
      <section
        id="tools"
        className="py-20"
        style={{ background: C.bgWarm, borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
            Try it yourself
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-10" style={{ color: C.text }}>
            Explore the tools.
          </h2>

          <div className="flex gap-2 mb-8">
            {[
              { id: "analyzer", label: "Skin Analysis", icon: Camera },
              { id: "builder", label: "Routine Builder", icon: Sliders },
              { id: "matrix", label: "Ingredients", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: isActive ? C.primary : "transparent",
                    color: isActive ? "#fff" : C.textSecondary,
                    border: `1px solid ${isActive ? C.primary : C.border}`,
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[360px]">
            {activeTab === "builder" && <RoutineBuilder />}
            {activeTab === "matrix" && <ConcernsMatrix />}
            {activeTab === "analyzer" && (
              <div
                className="p-10 sm:p-14 rounded-2xl text-center max-w-2xl mx-auto"
                style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${C.borderLight}` }}
              >
                <Camera size={28} style={{ color: C.primary }} className="mx-auto mb-5" />
                <h3 className="text-xl font-serif font-bold mb-3" style={{ color: C.text }}>
                  Skin Analysis
                </h3>
                <p className="text-sm max-w-md mx-auto mb-8 leading-relaxed" style={{ color: C.textSecondary }}>
                  Upload a selfie during your consultation. We'll look at texture, tone, hydration,
                  and visible concerns — then map it all back to ingredients that actually help.
                </p>
                <Button
                  size="lg"
                  className="text-sm font-medium text-white px-8"
                  style={{ background: C.primary }}
                  onClick={() => router.push("/sign-up")}
                >
                  Get started free
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2
            className="text-3xl sm:text-4xl font-serif font-bold mb-5 leading-tight"
            style={{ color: C.text }}
          >
            Your skin deserves<br />
            <span style={{ color: C.primary }}>something that works.</span>
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto leading-relaxed" style={{ color: C.textSecondary }}>
            Five minutes. One photo. A routine built for your skin, not copied from a blog.
          </p>
          <Button
            size="lg"
            className="text-sm font-medium text-white px-10 h-12"
            style={{ background: C.primary }}
            onClick={() => router.push("/chat")}
          >
            Start my consultation
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Lucent Shop ── */}
      <section
        id="shop"
        className="py-20"
        style={{ background: C.bgWarm, borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
                Lucent Shop
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-5" style={{ color: C.text }}>
                Products your skin<br />
                <span style={{ color: C.primary }}>will actually love.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: C.textSecondary }}>
                Curated skincare products chosen by our AI based on your unique skin profile.
                Every recommendation is backed by ingredient science — not marketing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="text-sm font-medium text-white px-8 h-12"
                  style={{ background: C.primary }}
                  onClick={() => router.push("/shop")}
                >
                  Browse the shop
                  <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-sm h-12 px-8"
                  style={{ borderColor: C.border, color: C.textSecondary }}
                  onClick={() => router.push("/chat")}
                >
                  Get personalized picks
                </Button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              {[
                { icon: Leaf, title: "AI-Matched", desc: "Products selected for your skin type and concerns." },
                { icon: FlaskConical, title: "Ingredient-First", desc: "Every product scored by what's inside, not the label." },
                { icon: Shield, title: "Barrier Safe", desc: "We never recommend anything that compromises your skin." },
                { icon: Zap, title: "Fast Delivery", desc: "Get your routine delivered to your door, hassle-free." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="p-5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${C.borderLight}` }}
                  >
                    <Icon size={18} style={{ color: C.primary }} className="mb-2" />
                    <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>{item.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-6"
        style={{ borderTop: `1px solid ${C.borderLight}`, background: C.bgWarm }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: C.primary }}>
                  <Leaf size={12} className="text-white" />
                </div>
                <span className="font-serif text-base font-bold" style={{ color: C.text }}>Lucent</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                Skincare guidance grounded in ingredient science. Built in Nepal.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.text }}>Product</h4>
              <ul className="space-y-2">
                {["Skin Analysis", "Skincare Chat", "Routine Builder", "Ingredient Checker"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200" style={{ color: C.textSecondary }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.text }}>Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200" style={{ color: C.textSecondary }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.text }}>Legal</h4>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Disclaimer"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200" style={{ color: C.textSecondary }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.borderLight}` }}>
            <p className="text-xs" style={{ color: C.textMuted }}>
              &copy; {new Date().getFullYear()} Lucent. All rights reserved.
            </p>
            <div className="flex gap-5">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <a key={item} href="#" className="text-xs transition-colors duration-200" style={{ color: C.textSecondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.textSecondary)}
                >{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {session && (
        <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={session.user} />
      )}
    </div>
  );
}
