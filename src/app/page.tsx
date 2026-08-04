"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { UserProfileModal } from "@/components/user-profile-modal";
import { RoutineBuilder } from "@/components/routine-builder";
import { ConcernsMatrix } from "@/components/concerns-matrix";
import { SkinJourneySlider } from "@/components/skin-journey-slider";
import { DailyChecklist } from "@/components/daily-checklist";
import {
  Camera,
  MessageCircle,
  FlaskConical,
  Map,
  ArrowRight,
  CheckCircle,
  Star,
  Sliders,
  Activity,
  Layers,
  Bot,
  Leaf,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

/* ─── Design tokens ─── */
const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryDark: "#1E3D2A",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  primaryGlow: "rgba(45, 90, 61, 0.12)",
  accent: "#7C6BEA",
  accentLight: "#9B8DF0",
  accentGhost: "rgba(124, 107, 234, 0.08)",
  rose: "#E8B4B8",
  roseGhost: "rgba(232, 180, 184, 0.10)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  successBg: "rgba(45, 90, 61, 0.08)",
  successFg: "#1E3D2A",
};

/* ─── Floating Product Shape Component ─── */
function FloatingProduct({
  type,
  style,
  delay = 0,
  duration = 6,
}: {
  type: "bottle" | "dropper" | "jar" | "tube" | "serum";
  style: React.CSSProperties;
  delay?: number;
  duration?: number;
}) {
  const shapeClass = `product-shape product-shape-${type}`;
  return (
    <div
      className={shapeClass}
      style={{
        ...style,
        animation: `float ${duration}s ease-in-out ${delay}s infinite`,
        willChange: "transform",
      }}
    />
  );
}

/* ─── Particle Field ─── */
function ParticleField() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5.2 + 2) % 100}%`,
    size: 3 + (i % 5) * 2,
    delay: i * 0.6,
    duration: 14 + (i % 4) * 4,
    variant: i % 4 === 0 ? "accent" : i % 5 === 0 ? "rose" : "default",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.variant === "accent" ? "particle-accent" : p.variant === "rose" ? "particle-rose" : ""}`}
          style={{
            left: p.left,
            bottom: "-20px",
            width: p.size,
            height: p.size,
            animation: `bubbleRise ${p.duration}s ease-in ${p.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Ambient Light Spots ─── */
function AmbientSpots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="ambient-spot ambient-spot-primary animate-orb-float"
        style={{ width: 600, height: 600, top: "-15%", left: "-8%", animationDelay: "0s" }}
      />
      <div
        className="ambient-spot ambient-spot-accent animate-orb-float"
        style={{ width: 500, height: 500, top: "15%", right: "-10%", animationDelay: "-4s" }}
      />
      <div
        className="ambient-spot ambient-spot-rose animate-orb-float"
        style={{ width: 400, height: 400, bottom: "0%", left: "25%", animationDelay: "-8s" }}
      />
    </div>
  );
}

/* ─── Animated Orb ─── */
function AnimatedOrb() {
  return (
    <div className="relative w-64 h-64 mx-auto" aria-hidden="true">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full animate-breathe"
        style={{
          background: "radial-gradient(circle, rgba(45, 90, 61, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Main orb */}
      <div
        className="absolute inset-6 rounded-full animate-float-gentle"
        style={{
          background: "linear-gradient(135deg, rgba(45, 90, 61, 0.06) 0%, rgba(124, 107, 234, 0.06) 50%, rgba(232, 180, 184, 0.04) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(45, 90, 61, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        }}
      />
      {/* Inner glow */}
      <div
        className="absolute inset-12 rounded-full animate-glow-pulse"
        style={{
          background: "linear-gradient(135deg, rgba(45, 90, 61, 0.1) 0%, rgba(124, 107, 234, 0.08) 100%)",
        }}
      />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #2D5A3D, #3D7A52)",
            boxShadow: "0 4px 20px rgba(45, 90, 61, 0.25)",
          }}
        >
          <Sparkles size={28} className="text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? 32 : size === "lg" ? 56 : 40;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0 transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(45,90,61,0.2)]"
        style={{ width: sz, height: sz, background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
      >
        <Leaf size={sz * 0.5} className="text-white" />
      </div>
      <span className={`font-semibold tracking-tight ${text}`} style={{ color: C.text }}>
        Lucent
      </span>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-300"
      style={{ background: C.primaryGhost, border: `1px solid rgba(45, 90, 61, 0.1)`, color: C.primary }}
    >
      {n}
    </div>
  );
}

/* ─── Section Data ─── */

const STEPS = [
  {
    icon: Camera,
    title: "Upload your photo",
    desc: "Take or select a photo. We analyze your skin's unique characteristics to understand what it truly needs.",
  },
  {
    icon: MessageCircle,
    title: "Chat with your advisor",
    desc: "Share your lifestyle, concerns, and goals. Your advisor remembers everything across every conversation.",
  },
  {
    icon: FlaskConical,
    title: "Audit your products",
    desc: "We'll review your current routine and flag any ingredient conflicts or gaps in your regimen.",
  },
  {
    icon: Map,
    title: "Get your roadmap",
    desc: "Receive a personalized AM/PM routine with weekly schedules and progress tracking.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aisha M.",
    skin: "Combination, acne-prone",
    quote: "Finally understand why my routine wasn't working. The ingredient audit caught conflicts I'd had for months.",
    stars: 5,
  },
  {
    name: "Priya S.",
    skin: "Dry, sensitive",
    quote: "Three products I was layering were actually compromising my skin barrier. Now my skin feels calm again.",
    stars: 5,
  },
  {
    name: "Lena K.",
    skin: "Oily, hyperpigmentation",
    quote: "It feels like having a dermatologist who actually has time for you. My skin has genuinely transformed.",
    stars: 5,
  },
];

const STATS = [
  { value: "50K+", label: "Skin analyses completed" },
  { value: "94%", label: "See improvement in 4 weeks" },
  { value: "120+", label: "Ingredients tracked" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Skin Analysis",
    description: "Advanced computer vision analyzes your skin's texture, tone, and conditions with clinical precision.",
    color: "primary",
  },
  {
    icon: MessageCircle,
    title: "Smart Chat Advisor",
    description: "Conversational AI that remembers your history, understands your concerns, and evolves with your skin.",
    color: "accent",
  },
  {
    icon: FlaskConical,
    title: "Ingredient Intelligence",
    description: "Cross-reference 120+ active ingredients for conflicts, synergies, and personalized recommendations.",
    color: "rose",
  },
  {
    icon: Shield,
    title: "Barrier Protection",
    description: "Real-time monitoring of your skin barrier health with proactive alerts and recovery protocols.",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Routine Optimization",
    description: "AI-optimized AM/PM routines that adapt to seasons, climate, and your skin's changing needs.",
    color: "accent",
  },
  {
    icon: Activity,
    title: "Progress Tracking",
    description: "Visual journey maps with quantitative metrics showing your skin's transformation over time.",
    color: "rose",
  },
];

/* ─── Main Component ─── */

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<"analyzer" | "builder" | "matrix" | "journey" | "checklist" | "chat">("analyzer");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "seller" || role === "admin") {
        router.push("/seller");
      }
    }
  }, [session, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: C.bg, color: C.text }}>

      {/* ── Sticky Navbar ── */}
      <header
        className="sticky top-0 z-40 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(250, 251, 252, 0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(24px) saturate(1.8)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.8)" : "none",
          borderBottom: scrolled ? `1px solid rgba(229, 231, 235, 0.5)` : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 3px rgba(0, 0, 0, 0.02)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Interactive tools", href: "#interactive-suite" },
              { label: "Reviews", href: "#reviews" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium transition-all duration-300 relative group"
                style={{ color: C.textSecondary }}
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full"
                  style={{ background: C.primary }}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_rgba(45,90,61,0.15)]"
                  style={{
                    background: session.user.image ? "transparent" : C.primaryGhost,
                    color: C.primary,
                    border: session.user.image ? "none" : `1px solid ${C.border}`,
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
                  className="text-sm font-medium transition-all duration-300"
                  style={{ color: C.textSecondary }}
                  onClick={() => router.push("/sign-in")}
                >
                  Sign in
                </Button>
                <Button
                  variant="premium"
                  size="sm"
                  className="text-sm font-medium"
                  onClick={() => router.push("/sign-up")}
                >
                  Get started
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-24 overflow-hidden"
      >
        <AmbientSpots />
        <ParticleField />

        {/* Floating Products */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <FloatingProduct
            type="bottle"
            style={{
              top: "15%",
              left: "8%",
              transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -5}px)`,
              opacity: 0.07,
            }}
            delay={0}
            duration={7}
          />
          <FloatingProduct
            type="dropper"
            style={{
              top: "25%",
              right: "12%",
              transform: `translate(${mousePos.x * 6}px, ${mousePos.y * -4}px)`,
              opacity: 0.06,
            }}
            delay={1.5}
            duration={8}
          />
          <FloatingProduct
            type="jar"
            style={{
              bottom: "20%",
              left: "15%",
              transform: `translate(${mousePos.x * -5}px, ${mousePos.y * 6}px)`,
              opacity: 0.05,
            }}
            delay={0.8}
            duration={6}
          />
          <FloatingProduct
            type="serum"
            style={{
              top: "10%",
              left: "45%",
              transform: `translate(${mousePos.x * -4}px, ${mousePos.y * 5}px)`,
              opacity: 0.06,
            }}
            delay={1}
            duration={7.5}
          />
        </div>

        <div className="text-center max-w-3xl mx-auto relative z-10">
          <div className="animate-fade-in-up opacity-0 stagger-1">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase mb-8"
              style={{
                background: C.primaryGhost,
                color: C.primary,
                border: `1px solid rgba(45, 90, 61, 0.1)`,
              }}
            >
              <Sparkles size={12} />
              AI-Powered Skincare
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up opacity-0 stagger-2"
            style={{ color: C.text }}
          >
            Your skin, finally{" "}
            <span className="gradient-text">understood.</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up opacity-0 stagger-3"
            style={{ color: C.textSecondary }}
          >
            Upload a photo. Have a conversation. Walk away with a skincare routine
            that was built for your skin — not a generic type.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 stagger-4">
            <Button
              variant="premium"
              size="xl"
              className="text-base font-semibold px-10"
              onClick={() => router.push("/chat")}
            >
              Get started
              <ArrowRight size={18} className="ml-1" />
            </Button>
            <Button
              variant="glass"
              size="xl"
              className="text-base font-medium px-8"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm animate-fade-in-up opacity-0 stagger-5" style={{ color: C.textMuted }}>
            <span className="flex items-center gap-2">
              <CheckCircle size={16} style={{ color: C.primary }} /> Free to start
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle size={16} style={{ color: C.primary }} /> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle size={16} style={{ color: C.primary }} /> Instant analysis
            </span>
          </div>
        </div>

        {/* Hero Orb */}
        <div className="mt-16 relative z-10 animate-fade-in-up opacity-0 stagger-6">
          <AnimatedOrb />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-16" style={{ background: "rgba(45, 90, 61, 0.02)", borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.12}s` }}>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight gradient-text">{stat.value}</p>
                <p className="text-sm mt-1.5 font-medium" style={{ color: C.textMuted }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-28 gradient-mesh relative">
        <AmbientSpots />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4"
              style={{ background: C.accentGhost, color: C.accent, border: `1px solid rgba(124, 107, 234, 0.1)` }}
            >
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: C.text }}>
              Four steps to skin clarity.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="glass-card rounded-2xl overflow-hidden group animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <StepBadge n={i + 1} />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                        style={{ background: C.primaryGhost }}
                      >
                        <Icon size={18} style={{ color: C.primary }} />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: C.text }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-28 relative" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4"
              style={{ background: C.primaryGhost, color: C.primary, border: `1px solid rgba(45, 90, 61, 0.1)` }}
            >
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: C.text }}>
              Built for your skin.
            </h2>
            <p className="text-base" style={{ color: C.textSecondary }}>
              Every feature designed to understand, protect, and enhance your skin&apos;s natural beauty.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const colorMap = {
                primary: { bg: C.primaryGhost, color: C.primary, glow: "rgba(45, 90, 61, 0.08)" },
                accent: { bg: C.accentGhost, color: C.accent, glow: "rgba(124, 107, 234, 0.08)" },
                rose: { bg: C.roseGhost, color: "#B87A7E", glow: "rgba(232, 180, 184, 0.1)" },
              };
              const c = colorMap[feature.color as keyof typeof colorMap];
              return (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-6 group animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ background: c.bg, boxShadow: `0 0 0 0 ${c.glow}` }}
                  >
                    <Icon size={20} style={{ color: c.color }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: C.text }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive Suite Section ── */}
      <section id="interactive-suite" className="py-28 gradient-mesh" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4"
              style={{ background: C.accentGhost, color: C.accent, border: `1px solid rgba(124, 107, 234, 0.1)` }}
            >
              Interactive Tools
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: C.text }}>
              Explore in real-time.
            </h2>
            <p className="text-base" style={{ color: C.textSecondary }}>
              Try our interactive tools to audit ingredients, customize your routine, and track your progress.
            </p>
          </div>

          {/* Interactive Tools Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: "analyzer", label: "Skin Analysis", icon: Camera },
              { id: "builder", label: "Routine Builder", icon: Sliders },
              { id: "matrix", label: "Ingredients", icon: Layers },
              { id: "journey", label: "4-Week Journey", icon: Activity },
              { id: "checklist", label: "Daily Checklist", icon: CheckCircle },
              { id: "chat", label: "AI Chat", icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeInteractiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveInteractiveTab(tab.id as typeof activeInteractiveTab);
                    if (tab.id === "chat") {
                      router.push("/chat");
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isActive ? "shadow-md" : "hover:shadow-sm"
                  }`}
                  style={{
                    background: isActive ? "linear-gradient(135deg, #2D5A3D, #3D7A52)" : C.bgCard,
                    color: isActive ? "#fff" : C.textSecondary,
                    border: `1px solid ${isActive ? "transparent" : C.border}`,
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tool */}
          <div className="transition-all duration-500">
            {activeInteractiveTab === "builder" && <RoutineBuilder />}
            {activeInteractiveTab === "matrix" && <ConcernsMatrix />}
            {activeInteractiveTab === "journey" && <SkinJourneySlider />}
            {activeInteractiveTab === "checklist" && <DailyChecklist />}
            {activeInteractiveTab === "chat" && (
              <div className="glass-card p-10 rounded-3xl text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: C.primaryGhost, boxShadow: `0 0 0 4px ${C.primarySubtle}` }}>
                  <Bot size={26} style={{ color: C.primary }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>
                  AI Skincare Advisor
                </h3>
                <p className="text-sm max-w-md mx-auto mb-6" style={{ color: C.textSecondary }}>
                  Have a conversation with our AI skincare expert. Ask about ingredients, routines, or get personalized recommendations.
                </p>
                <Button
                  variant="premium"
                  size="lg"
                  className="text-sm font-semibold px-8"
                  onClick={() => router.push("/chat")}
                >
                  Start Chat <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </div>
            )}
            {activeInteractiveTab === "analyzer" && (
              <div className="glass-card p-10 rounded-3xl text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: C.primaryGhost, boxShadow: `0 0 0 4px ${C.primarySubtle}` }}>
                  <Camera size={26} style={{ color: C.primary }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>
                  Skin Analysis Tool
                </h3>
                <p className="text-sm max-w-md mx-auto mb-6" style={{ color: C.textSecondary }}>
                  Sign up to upload a photo and get instant insights into your skin&apos;s health, hydration levels, and recommended routine.
                </p>
                <Button
                  variant="premium"
                  size="lg"
                  className="text-sm font-semibold px-8"
                  onClick={() => router.push("/sign-up")}
                >
                  Sign up to get started <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="reviews"
        className="py-28 relative"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4"
              style={{ background: C.roseGhost, color: "#B87A7E", border: `1px solid rgba(232, 180, 184, 0.2)` }}
            >
              Real Transformations
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: C.text }}>
              Skin that speaks for itself.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="glass-card rounded-2xl animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={14} fill="#D97706" style={{ color: "#D97706" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: C.textSecondary }}>
                    &quot;{t.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{ background: C.primaryGhost, color: C.primary }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{t.name}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{t.skin}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <AmbientSpots />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-tight animate-fade-in-up"
            style={{ color: C.text }}
          >
            Your skin deserves{" "}
            <span className="gradient-text">a real plan.</span>
          </h2>
          <p className="text-lg mb-8 max-w-lg mx-auto animate-fade-in-up stagger-2" style={{ color: C.textSecondary }}>
            Three minutes. One photo. A skincare routine that&apos;s actually yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
            <Button
              variant="premium"
              size="xl"
              className="text-base font-semibold px-10"
              onClick={() => router.push("/chat")}
            >
              Get started — it&apos;s free
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-14 px-6"
        style={{ borderTop: `1px solid ${C.border}`, background: "rgba(255, 255, 255, 0.5)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <Logo size="sm" />
              <p className="text-sm mt-3 leading-relaxed" style={{ color: C.textMuted }}>
                Your skin, illuminated. AI-powered skincare analysis and personalized routines.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Product</h4>
              <ul className="space-y-2.5">
                {["Skin Analysis", "AI Chat", "Routine Builder", "Shop"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:opacity-70" style={{ color: C.textSecondary }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Press"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:opacity-70" style={{ color: C.textSecondary }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Support</h4>
              <ul className="space-y-2.5">
                {["Help Center", "Privacy", "Terms", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:opacity-70" style={{ color: C.textSecondary }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.borderLight}` }}>
            <p className="text-sm" style={{ color: C.textMuted }}>
              © {new Date().getFullYear()} Lucent. Your skin, illuminated.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm transition-colors duration-200 hover:opacity-70"
                  style={{ color: C.textSecondary }}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
