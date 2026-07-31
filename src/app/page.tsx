"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { UserProfileModal } from "@/components/user-profile-modal";
import { SkinAnalysisModal } from "@/components/skin-analysis-modal";
import { RoutineBuilder } from "@/components/routine-builder";
import { ConcernsMatrix } from "@/components/concerns-matrix";
import { SkinJourneySlider } from "@/components/skin-journey-slider";
import { DailyChecklist } from "@/components/daily-checklist";
import {
  Camera,
  MessageCircle,
  FlaskConical,
  Map,
  User,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Star,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Sliders,
  Calendar,
  Activity,
  Layers
} from "lucide-react";

/* ─── Design tokens ─── */
const C = {
  primary:   "#831843",
  active:    "#BE185D",
  blush:     "#EC4899",
  petal:     "#FBCFE8",
  mist:      "#FDF2F8",
  ink:       "#1C1917",
  smoke:     "#44403C",
  accent:    "#4C1D95",
  successBg: "#BBF7D0",
  successFg: "#14532D",
};

/* ─── Sub-components ─── */

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? 28 : size === "lg" ? 52 : 38;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ width: sz, height: sz, background: C.primary }}
      >
        <svg width={sz * 0.55} height={sz * 0.55} viewBox="0 0 26 26" fill="none">
          <circle cx="13" cy="13" r="4.5" fill={C.mist} />
          <path
            d="M13 3v3M13 20v3M3 13h3M20 13h3M5.6 5.6l2.1 2.1M18.3 18.3l2.1 2.1M20.4 5.6l-2.1 2.1M7.7 18.3l-2.1 2.1"
            stroke={C.petal}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className={`font-semibold tracking-tight ${text}`} style={{ color: C.primary }}>
        Lucent
      </span>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-xs"
      style={{ background: C.mist, border: `0.5px solid ${C.petal}`, color: C.primary }}
    >
      {n}
    </div>
  );
}

/* ─── Section Data ─── */

const STEPS = [
  {
    icon: Camera,
    title: "1. Upload your photo",
    desc: "Take or select a photo. Lucent AI analyzes skin barrier health, pore density, hydration levels, and pigmentation markers in seconds.",
  },
  {
    icon: MessageCircle,
    title: "2. Personal AI Consultation",
    desc: "Discuss your diet, climate, stress, and product history. The advisor retains full context across every single check-in.",
  },
  {
    icon: FlaskConical,
    title: "3. Real-Time Ingredient Audit",
    desc: "Scan your current shelf. Lucent flags chemical conflicts (like Retinol + AHA), redundant formulas, and ingredient gaps.",
  },
  {
    icon: Map,
    title: "4. Dynamic Skincare Roadmap",
    desc: "Receive your tailored AM/PM routine, weekly active frequency schedule, and progress tracking dashboard.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aisha M.",
    skin: "Combination, acne-prone",
    quote: "Finally understand why my routine wasn't working. Lucent caught a niacinamide + vitamin C conflict I'd had for months.",
    stars: 5,
  },
  {
    name: "Priya S.",
    skin: "Dry, sensitive",
    quote: "The live ingredient audit tool alone was worth it. Three products I was layering were actually compromising my skin barrier.",
    stars: 5,
  },
  {
    name: "Lena K.",
    skin: "Oily, hyperpigmentation",
    quote: "It feels like talking to a top dermatologist who has unlimited time for you. The 4-week timeline simulator was spot-on.",
    stars: 5,
  },
];

/* ─── Main Component ─── */

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<"analyzer" | "builder" | "matrix" | "journey" | "checklist">("analyzer");
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased selection:bg-pink-200 selection:text-pink-950" style={{ background: C.mist, color: C.ink }}>

      {/* ── Sticky Glassmorphic Navbar ── */}
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(253,242,248,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.petal}` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Interactive Tools", href: "#interactive-suite" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Clinical Matrix", href: "#concerns-explorer" },
              { label: "Reviews", href: "#reviews" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium transition-colors"
                style={{ color: C.smoke }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.smoke)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="text-xs font-semibold text-white px-4 h-9 shadow-sm transition-transform hover:scale-105"
              style={{ background: C.primary }}
              onClick={() => setAnalysisModalOpen(true)}
            >
              <Sparkles size={13} className="mr-1.5" /> Launch AI Scan
            </Button>

            {session ? (
              <div className="flex items-center gap-2">
                <Badge
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full border-0 hidden sm:inline-flex"
                  style={{
                    background: (session.user as { role?: string }).role === "seller" ? C.primary : C.petal,
                    color: (session.user as { role?: string }).role === "seller" ? "#fff" : C.primary,
                  }}
                >
                  {(session.user as { role?: string }).role === "seller" ? "Seller" : "Customer"}
                </Badge>
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105"
                  style={{
                    background: session.user.image ? "transparent" : C.petal,
                    color: C.primary,
                    border: session.user.image ? "none" : `1px solid ${C.petal}`,
                  }}
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    session.user.name?.charAt(0).toUpperCase()
                  )}
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-medium"
                  style={{ color: C.primary }}
                  onClick={() => router.push("/sign-in")}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  className="text-xs font-semibold text-white"
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

      {/* ── Hero Section ── */}
      <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content (7 cols) */}
          <div className="lg:col-span-7 text-left">
            <Badge
              className="mb-6 text-xs font-medium px-4 py-1.5 rounded-full border-0 inline-flex items-center shadow-xs"
              style={{ background: C.petal, color: C.primary }}
            >
              <Sparkles size={13} className="mr-2 text-pink-600 animate-spin-slow" />
              AI Skincare Telemetry & Interactive Companion
            </Badge>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.12] mb-6"
              style={{ color: C.primary }}
            >
              Your skin, <br />
              <span className="bg-gradient-to-r from-pink-700 via-pink-600 to-purple-800 bg-clip-text text-transparent">
                scientifically understood.
              </span>
            </h1>

            <p
              className="text-base sm:text-lg max-w-xl mb-8 leading-relaxed"
              style={{ color: C.smoke }}
            >
              Upload a photo or choose a preset. Analyze ingredient compatibility, detect routine conflicts, and receive a precision AM/PM skincare roadmap built for your unique skin barrier.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="text-sm font-semibold text-white px-8 h-12 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: C.primary }}
                onClick={() => setAnalysisModalOpen(true)}
              >
                Start Interactive Skin Diagnostic
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <a href="#interactive-suite">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm font-medium h-12 px-8 rounded-xl"
                  style={{ borderColor: C.petal, color: C.primary, background: "#fff" }}
                >
                  Explore Interactive Suite
                </Button>
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs font-medium" style={{ color: C.smoke }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" /> Instant Telemetry
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" /> Ingredient Conflict Detector
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" /> Free to Start
              </span>
            </div>
          </div>

          {/* Hero Right: Interactive Live Preview Card (5 cols) */}
          <div className="lg:col-span-5">
            <div
              onClick={() => setAnalysisModalOpen(true)}
              className="group relative cursor-pointer rounded-3xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border"
              style={{ background: "#fff", borderColor: C.petal }}
            >
              {/* Badge Overlay */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-100">
                    <Zap size={16} style={{ color: C.primary }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: C.primary }}>
                      AI Vision Engine
                    </span>
                    <span className="text-[11px]" style={{ color: C.smoke }}>
                      Click card to simulate scan
                    </span>
                  </div>
                </div>
                <Badge className="border-0 text-[10px] px-2.5 py-0.5 rounded-full" style={{ background: C.successBg, color: C.successFg }}>
                  Ready to Scan
                </Badge>
              </div>

              {/* Sample Facial Scan Viewport */}
              <div className="relative h-56 rounded-2xl overflow-hidden mb-4 border" style={{ borderColor: C.petal }}>
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600"
                  alt="Interactive skin diagnostic preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white text-xs space-y-1">
                    <p className="font-semibold text-sm">Sample Telemetry Data:</p>
                    <div className="flex items-center gap-3 text-[11px] opacity-90">
                      <span>Hydration: 62%</span>
                      <span>•</span>
                      <span>Barrier: 74%</span>
                      <span>•</span>
                      <span>Score: 88/100</span>
                    </div>
                  </div>
                </div>

                {/* Laser animation line */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_15px_#ec4899] animate-scan" />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: C.primary }}>
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-pink-600" /> Click to launch interactive diagnostic tool
                </span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Suite Section (Tabs & Live Widgets) ── */}
      <section id="interactive-suite" className="py-20" style={{ background: "#fff", borderTop: `1px solid ${C.petal}`, borderBottom: `1px solid ${C.petal}` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: C.active }}>
              Interactive Skincare Suite
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: C.primary }}>
              Experience Lucent in real-time.
            </h2>
            <p className="text-sm" style={{ color: C.smoke }}>
              Switch between our interactive tools below to audit ingredients, customize your routine, explore active ingredients, and track progress.
            </p>
          </div>

          {/* Interactive Tools Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: "analyzer", label: "Skin AI Diagnostic", icon: Camera },
              { id: "builder", label: "Routine & Conflict Audit", icon: Sliders },
              { id: "matrix", label: "Clinical Ingredients Matrix", icon: Layers },
              { id: "journey", label: "4-Week Transformation", icon: Activity },
              { id: "checklist", label: "Daily Companion Checklist", icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeInteractiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveInteractiveTab(tab.id as typeof activeInteractiveTab);
                    if (tab.id === "analyzer") {
                      setAnalysisModalOpen(true);
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive ? "shadow-md scale-105" : "hover:bg-pink-100/70"
                  }`}
                  style={{
                    background: isActive ? C.primary : C.mist,
                    color: isActive ? "#fff" : C.primary,
                    border: `1px solid ${isActive ? C.primary : C.petal}`,
                  }}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Display Active Tool Component */}
          <div className="transition-all duration-300">
            {activeInteractiveTab === "builder" && <RoutineBuilder />}
            {activeInteractiveTab === "matrix" && <ConcernsMatrix />}
            {activeInteractiveTab === "journey" && <SkinJourneySlider />}
            {activeInteractiveTab === "checklist" && <DailyChecklist />}
            {activeInteractiveTab === "analyzer" && (
              <div className="p-8 rounded-3xl text-center border max-w-3xl mx-auto" style={{ background: C.mist, borderColor: C.petal }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.primary }}>
                  <Sparkles size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-2" style={{ color: C.primary }}>
                  Interactive AI Telemetry Modal
                </h3>
                <p className="text-sm max-w-md mx-auto mb-6" style={{ color: C.smoke }}>
                  Test our simulated facial scanner, metric gauges, and instant routine diagnostic report.
                </p>
                <Button
                  size="lg"
                  className="text-sm font-semibold text-white px-8 rounded-xl"
                  style={{ background: C.primary }}
                  onClick={() => setAnalysisModalOpen(true)}
                >
                  Open AI Scanner Modal <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How It Works Steps ── */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: C.active }}>
            Methodology
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: C.primary }}>
            Four steps to skin clarity.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card
                key={i}
                className="relative overflow-hidden group hover:border-pink-300 transition-all duration-300 hover:-translate-y-1 shadow-xs"
                style={{ border: `1px solid ${C.petal}`, background: "#fff" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <StepBadge n={i + 1} />
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: C.petal }}
                    >
                      <Icon size={18} style={{ color: C.primary }} />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: C.primary }}>
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: C.smoke }}>
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Clinical Concerns Explorer Section Anchor ── */}
      <section id="concerns-explorer" className="py-16 max-w-7xl mx-auto px-6">
        <ConcernsMatrix />
      </section>

      {/* ── Testimonials & Social Proof ── */}
      <section
        id="reviews"
        className="py-24"
        style={{ background: "#fff", borderTop: `1px solid ${C.petal}`, borderBottom: `1px solid ${C.petal}` }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: C.active }}>
              Real User Transformations
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: C.primary }}>
              Skin that speaks for itself.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card
                key={t.name}
                className="hover:-translate-y-1 transition-transform"
                style={{ border: `1px solid ${C.petal}`, background: C.mist }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} fill={C.active} style={{ color: C.active }} />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: C.smoke }}>
                    &quot;{t.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: C.petal, color: C.primary }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.primary }}>{t.name}</p>
                      <p className="text-xs" style={{ color: C.active }}>{t.skin}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Call To Action ── */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <h2
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5 leading-tight"
          style={{ color: C.primary }}
        >
          Ready for skin clarity?
        </h2>
        <p className="text-base sm:text-lg mb-8 max-w-lg mx-auto" style={{ color: C.smoke }}>
          Take 3 minutes to complete your AI skin diagnostic and audit your current skincare products.
        </p>
        <Button
          size="lg"
          className="text-sm font-semibold text-white px-10 h-12 rounded-xl shadow-md transition-transform hover:scale-105"
          style={{ background: C.primary }}
          onClick={() => setAnalysisModalOpen(true)}
        >
          Launch Free AI Skin Analysis
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-6"
        style={{ borderTop: `1px solid ${C.petal}`, background: "#fff" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: C.blush }}>
            © {new Date().getFullYear()} Lucent Skincare Telemetry Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Clinical Studies", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors"
                style={{ color: C.smoke }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.smoke)}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Floating Action Quick-Launch Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="shadow-2xl text-xs font-semibold text-white px-5 h-12 rounded-full flex items-center gap-2 border border-pink-300 animate-pulse-glow"
          style={{ background: C.primary }}
          onClick={() => setAnalysisModalOpen(true)}
        >
          <Sparkles size={16} className="text-pink-300" />
          <span>Analyze My Skin</span>
        </Button>
      </div>

      {/* Interactive Modals */}
      <SkinAnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
      />

      {session && (
        <UserProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={session.user}
        />
      )}
    </div>
  );
}
