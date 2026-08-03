"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronRight,
  Star,
  Sliders,
  Activity,
  Layers,
  Bot,
  Leaf,
} from "lucide-react";

/* ─── Design tokens ─── */
const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryDark: "#3a5233",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  primaryGlow: "rgba(74, 103, 65, 0.15)",
  accent: "#c4956a",
  accentLight: "#d4b08f",
  accentGhost: "rgba(196, 149, 106, 0.10)",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  bgCard: "#ffffff",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
  successBg: "#e8f0e6",
  successFg: "#3a5233",
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
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 5.7 + 3) % 100}%`,
    size: 4 + (i % 5) * 3,
    delay: i * 0.7,
    duration: 12 + (i % 4) * 4,
    isAccent: i % 3 === 0,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.isAccent ? "particle-accent" : ""}`}
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
        className="ambient-spot ambient-spot-primary"
        style={{ width: 500, height: 500, top: "-10%", left: "-5%" }}
      />
      <div
        className="ambient-spot ambient-spot-accent"
        style={{ width: 400, height: 400, top: "20%", right: "-8%" }}
      />
      <div
        className="ambient-spot ambient-spot-primary"
        style={{ width: 350, height: 350, bottom: "5%", left: "30%" }}
      />
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
        className="rounded-xl flex items-center justify-center flex-shrink-0 transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(74,103,65,0.2)]"
        style={{ width: sz, height: sz, background: "linear-gradient(135deg, #4a6741, #6b8c62)" }}
      >
        <Leaf size={sz * 0.5} className="text-white" />
      </div>
      <span className={`font-medium tracking-tight ${text}`} style={{ color: C.text }}>
        Lucent
      </span>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-all duration-300"
      style={{ background: C.primaryGhost, border: `1px solid ${C.border}`, color: C.primary }}
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
          background: scrolled ? "rgba(250, 248, 245, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          borderBottom: scrolled ? `1px solid rgba(232, 228, 223, 0.5)` : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 3px rgba(45, 42, 38, 0.04)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Interactive tools", href: "#interactive-suite" },
              { label: "Reviews", href: "#reviews" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium transition-all duration-300 relative group"
                style={{ color: C.textLight }}
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_rgba(74,103,65,0.15)]"
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
                  style={{ color: C.textLight }}
                  onClick={() => router.push("/sign-in")}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  className="text-sm font-medium magnetic-btn"
                  style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
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
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 overflow-hidden"
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
              opacity: 0.1,
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
              opacity: 0.09,
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
              opacity: 0.08,
            }}
            delay={0.8}
            duration={6}
          />
          <FloatingProduct
            type="tube"
            style={{
              top: "60%",
              right: "8%",
              transform: `translate(${mousePos.x * 7}px, ${mousePos.y * -3}px)`,
              opacity: 0.07,
            }}
            delay={2}
            duration={9}
          />
          <FloatingProduct
            type="serum"
            style={{
              top: "10%",
              left: "45%",
              transform: `translate(${mousePos.x * -4}px, ${mousePos.y * 5}px)`,
              opacity: 0.08,
            }}
            delay={1}
            duration={7.5}
          />
          <FloatingProduct
            type="bottle"
            style={{
              bottom: "30%",
              right: "25%",
              transform: `translate(${mousePos.x * 5}px, ${mousePos.y * -6}px)`,
              opacity: 0.06,
            }}
            delay={3}
            duration={10}
          />
        </div>

        <div className="text-center max-w-3xl mx-auto relative z-10">
          <div className="animate-fade-in-up opacity-0 stagger-1">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase mb-6"
              style={{
                background: C.primaryGhost,
                color: C.primary,
                border: `1px solid rgba(74, 103, 65, 0.12)`,
              }}
            >
              AI-Powered Skincare
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-6 animate-fade-in-up opacity-0 stagger-2"
            style={{ color: C.text }}
          >
            Your skin, finally{" "}
            <span className="gradient-text">understood.</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up opacity-0 stagger-3"
            style={{ color: C.textLight }}
          >
            Upload a photo. Have a conversation. Walk away with a skincare routine
            that was built for your skin — not a generic type.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 stagger-4">
            <Button
              size="lg"
              className="text-base font-medium px-8 h-12 rounded-xl magnetic-btn transition-all"
              style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
              onClick={() => router.push("/chat")}
            >
              Get started
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm animate-fade-in-up opacity-0 stagger-5" style={{ color: C.textMuted }}>
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

        {/* Hero Card - Glassmorphism */}
        <div className="mt-16 max-w-sm mx-auto relative z-10 animate-fade-in-up opacity-0 stagger-6">
          <div
            className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
            style={{ boxShadow: "0 8px 32px rgba(45, 42, 38, 0.06)" }}
          >
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${C.borderLight}` }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: C.primaryGhost, border: `1px solid rgba(74, 103, 65, 0.1)` }}
              >
                <Camera size={16} style={{ color: C.primary }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: C.text }}>Skin analysis complete</p>
                <p className="text-xs" style={{ color: C.textLight }}>3 concerns · 6-step routine ready</p>
              </div>
              <div className="ml-auto animate-success-pop">
                <CheckCircle size={18} style={{ color: C.successFg }} />
              </div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {["Hyperpigmentation detected", "Dehydration markers found", "Barrier sensitivity — mild"].map(
                (item, i) => (
                  <div key={i} className="flex items-center gap-2.5 animate-fade-in-left opacity-0" style={{ animationDelay: `${0.8 + i * 0.15}s` }}>
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: i === 0 ? C.primary : i === 1 ? C.accent : C.textMuted }}
                    />
                    <span className="text-sm" style={{ color: C.textLight }}>{item}</span>
                  </div>
                )
              )}
            </div>
            <div className="px-5 pb-5">
              <button
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:opacity-90 magnetic-btn"
                style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)" }}
              >
                View my routine
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-12" style={{ background: "rgba(74, 103, 65, 0.03)", borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.15}s` }}>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text">{stat.value}</p>
                <p className="text-sm mt-1" style={{ color: C.textMuted }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 gradient-mesh">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-sm font-medium tracking-wide uppercase mb-3" style={{ color: C.accent }}>
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: C.text }}>
              Four steps to skin clarity.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="glass-card rounded-2xl overflow-hidden group transition-all duration-500 hover-lift animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <StepBadge n={i + 1} />
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ background: C.primaryGhost }}
                      >
                        <Icon size={18} style={{ color: C.primary }} />
                      </div>
                    </div>
                    <h3 className="text-base font-medium mb-2" style={{ color: C.text }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.textLight }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive Suite Section ── */}
      <section id="interactive-suite" className="py-24" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-sm font-medium tracking-wide uppercase mb-3" style={{ color: C.accent }}>
              Interactive Tools
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: C.text }}>
              Explore in real-time.
            </h2>
            <p className="text-base" style={{ color: C.textLight }}>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isActive ? "shadow-sm" : "hover:opacity-80"
                  }`}
                  style={{
                    background: isActive ? "linear-gradient(135deg, #4a6741, #6b8c62)" : C.bgCard,
                    color: isActive ? "#fff" : C.textLight,
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
              <div className="glass-card p-8 rounded-3xl text-center max-w-2xl mx-auto hover-lift">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.primaryGhost }}>
                  <Bot size={24} style={{ color: C.primary }} />
                </div>
                <h3 className="text-xl font-medium mb-2" style={{ color: C.text }}>
                  AI Skincare Advisor
                </h3>
                <p className="text-sm max-w-md mx-auto mb-6" style={{ color: C.textLight }}>
                  Have a conversation with our AI skincare expert. Ask about ingredients, routines, or get personalized recommendations.
                </p>
                <Button
                  size="lg"
                  className="text-sm font-medium px-8 rounded-xl magnetic-btn"
                  style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
                  onClick={() => router.push("/chat")}
                >
                  Start Chat <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            )}
            {activeInteractiveTab === "analyzer" && (
              <div className="glass-card p-8 rounded-3xl text-center max-w-2xl mx-auto hover-lift">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: C.primaryGhost }}>
                  <Camera size={24} style={{ color: C.primary }} />
                </div>
                <h3 className="text-xl font-medium mb-2" style={{ color: C.text }}>
                  Skin Analysis Tool
                </h3>
                <p className="text-sm max-w-md mx-auto mb-6" style={{ color: C.textLight }}>
                  Sign up to upload a photo and get instant insights into your skin&apos;s health, hydration levels, and recommended routine.
                </p>
                <Button
                  size="lg"
                  className="text-sm font-medium px-8 rounded-xl magnetic-btn"
                  style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
                  onClick={() => router.push("/sign-up")}
                >
                  Sign up to get started <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="reviews"
        className="py-24 gradient-mesh"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-sm font-medium tracking-wide uppercase mb-3" style={{ color: C.accent }}>
              Real Transformations
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: C.text }}>
              Skin that speaks for itself.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="glass-card rounded-2xl transition-all duration-500 hover-lift animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={14} fill={C.accent} style={{ color: C.accent }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: C.textLight }}>
                    &quot;{t.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ background: C.primaryGhost, color: C.primary }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{t.name}</p>
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
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <AmbientSpots />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-5 leading-tight animate-fade-in-up"
            style={{ color: C.text }}
          >
            Your skin deserves{" "}
            <span className="gradient-text">a real plan.</span>
          </h2>
          <p className="text-lg mb-8 max-w-lg mx-auto animate-fade-in-up stagger-2" style={{ color: C.textLight }}>
            Three minutes. One photo. A skincare routine that&apos;s actually yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
            <Button
              size="lg"
              className="text-base font-medium px-10 h-12 rounded-xl magnetic-btn transition-all"
              style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
              onClick={() => router.push("/chat")}
            >
              Get started — it&apos;s free
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-12 px-6"
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
              <h4 className="text-sm font-medium mb-3" style={{ color: C.text }}>Product</h4>
              <ul className="space-y-2">
                {["Skin Analysis", "AI Chat", "Routine Builder", "Shop"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:opacity-70" style={{ color: C.textLight }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: C.text }}>Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Press"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:opacity-70" style={{ color: C.textLight }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: C.text }}>Support</h4>
              <ul className="space-y-2">
                {["Help Center", "Privacy", "Terms", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:opacity-70" style={{ color: C.textLight }}>
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
                  style={{ color: C.textLight }}
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
