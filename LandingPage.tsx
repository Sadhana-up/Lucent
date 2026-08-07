"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  MessageCircle,
  FlaskConical,
  Map,
  User,
  ArrowRight,
  CheckCircle,
  Leaf,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

/* ─── Design tokens (sage green palette) ─── */
const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryDark: "#3a5233",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  accent: "#c4956a",
  accentLight: "#d4b08f",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  bgCard: "#ffffff",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
};

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? 28 : size === "lg" ? 52 : 38;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ width: sz, height: sz, background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)` }}
      >
        <svg width={sz * 0.55} height={sz * 0.55} viewBox="0 0 26 26" fill="none">
          <circle cx="13" cy="13" r="4.5" fill={C.bg} />
          <path
            d="M13 3v3M13 20v3M3 13h3M20 13h3M5.6 5.6l2.1 2.1M18.3 18.3l2.1 2.1M20.4 5.6l-2.1 2.1M7.7 18.3l-2.1 2.1"
            stroke={C.accent}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className={`font-medium tracking-tight ${text}`} style={{ color: C.primary }}>
        Lucent
      </span>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
      style={{ background: C.primaryGhost, border: `0.5px solid ${C.border}`, color: C.primary }}
    >
      {n}
    </div>
  );
}

/* ─── Section data ───────────────────────────────────────────────────────────── */

const STEPS = [
  {
    icon: Camera,
    title: "Upload your skin photo",
    desc: "Take or upload a selfie. We evaluate your skin tone, texture, pore size, hydration, and visible concerns in seconds.",
  },
  {
    icon: MessageCircle,
    title: "Tell us about your routine",
    desc: "Share your lifestyle — sleep, diet, stress, past reactions. We remember your context across every session.",
  },
  {
    icon: User,
    title: "Build your skin profile",
    desc: "Your skin type, environment, hormonal patterns, and personal goals are captured into a living profile.",
  },
  {
    icon: FlaskConical,
    title: "Audit your products",
    desc: "Photograph or type in your current routine. We scan every ingredient and flag conflicts, gaps, and redundancies.",
  },
  {
    icon: Map,
    title: "Get your roadmap",
    desc: "A full AM and PM routine, priority treatment plan, and monthly check-ins — built for your skin, not a generic type.",
  },
];

const CONCERNS = [
  "Acne & breakouts",
  "Hyperpigmentation",
  "Fine lines",
  "Dryness",
  "Oiliness",
  "Redness",
  "Uneven texture",
  "Dark circles",
  "Sensitivity",
  "Sun damage",
];

const TESTIMONIALS = [
  {
    name: "Aisha M.",
    skin: "Combination, acne-prone",
    quote: "Finally understand why my routine wasn't working. Lucent caught a niacinamide conflict I'd had for months.",
    stars: 5,
  },
  {
    name: "Priya S.",
    skin: "Dry, sensitive",
    quote: "The ingredient audit alone was worth it. Three products I was layering were cancelling each other out.",
    stars: 5,
  },
  {
    name: "Lena K.",
    skin: "Oily, hyperpigmentation",
    quote: "It feels like talking to a dermatologist who actually has time for you. My skin has genuinely changed.",
    stars: 5,
  },
];

/* ─── Main component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg, color: C.text }}>

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(250, 248, 245, 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          borderBottom: scrolled ? `0.5px solid ${C.borderLight}` : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-8">
            {["How it works", "Concerns", "Reviews"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors duration-300"
                style={{ color: C.textLight }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textLight)}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              style={{ color: C.primary }}
            >
              Sign in
            </Button>
            <Button
              size="sm"
              className="text-sm font-medium text-white magnetic-btn"
              style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)` }}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(74, 103, 65, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(196, 149, 106, 0.06) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 90%, rgba(74, 103, 65, 0.04) 0%, transparent 50%),
              linear-gradient(170deg, ${C.bg} 0%, ${C.bgWarm} 50%, ${C.bg} 100%)
            `,
          }}
        />

        {/* Floating product shapes */}
        <div className="product-shape product-shape-bottle animate-float-slow" style={{ top: "15%", left: "8%", opacity: 0.08 }} />
        <div className="product-shape product-shape-dropper animate-float" style={{ top: "25%", right: "12%", opacity: 0.1, animationDelay: "1s" }} />
        <div className="product-shape product-shape-serum animate-float-gentle" style={{ top: "60%", left: "5%", opacity: 0.06, animationDelay: "2s" }} />
        <div className="product-shape product-shape-jar animate-float-slow" style={{ top: "70%", right: "8%", opacity: 0.07, animationDelay: "1.5s" }} />
        <div className="product-shape product-shape-tube animate-float" style={{ top: "40%", left: "88%", opacity: 0.05, animationDelay: "3s" }} />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <Badge
            className="mb-6 text-xs font-medium px-4 py-1.5 rounded-full border-0 animate-fade-in"
            style={{ background: C.primaryGhost, color: C.primary, border: `0.5px solid ${C.border}` }}
          >
            <Leaf size={12} className="mr-1.5" />
            Science-backed skincare guidance
          </Badge>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-tight mb-6 max-w-4xl mx-auto animate-fade-in-up"
            style={{ color: C.text }}
          >
            Your skin,
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 50%, ${C.accent} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              finally understood.
            </span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up stagger-2"
            style={{ color: C.textLight }}
          >
            Upload a photo. Have a conversation. Walk away with a skincare routine
            that was built for your skin — not a generic type.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up stagger-3">
            <Button
              size="lg"
              className="text-base font-medium text-white px-8 h-12 magnetic-btn"
              style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)` }}
            >
              Analyze my skin
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base h-12 px-8"
              style={{ borderColor: C.border, color: C.primary, background: "transparent" }}
            >
              See how it works
            </Button>
          </div>

          <p className="mt-5 text-sm animate-fade-in stagger-4" style={{ color: C.textMuted }}>
            Free to start · No credit card required
          </p>

          {/* Hero card mockup — glassmorphism */}
          <div className="mt-16 max-w-sm mx-auto animate-fade-in-up stagger-5">
            <Card
              className="text-left overflow-hidden glass-card hover-lift"
              style={{ border: `0.5px solid ${C.borderLight}`, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)" }}
            >
              <CardContent className="p-0">
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{ borderBottom: `0.5px solid ${C.borderLight}` }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-content-center"
                    style={{ background: C.primaryGhost, border: `0.5px solid ${C.border}` }}
                  >
                    <User size={16} style={{ color: C.primary, margin: "auto" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.primary }}>Your skin profile</p>
                    <p className="text-xs" style={{ color: C.accent }}>3 concerns identified · routine ready</p>
                  </div>
                  <CheckCircle size={18} className="ml-auto" style={{ color: C.primary }} />
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  {["Uneven skin tone noted", "Hydration levels need attention", "Mild sensitivity around cheeks"].map(
                    (item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: i === 0 ? C.primary : i === 1 ? C.accent : C.primaryLight }}
                        />
                        <span className="text-sm" style={{ color: C.textLight }}>{item}</span>
                      </div>
                    )
                  )}
                </div>
                <div className="px-5 pb-4">
                  <button
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white magnetic-btn"
                    style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)` }}
                  >
                    View my routine
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="py-24"
        style={{ background: C.bgCard, borderTop: `0.5px solid ${C.borderLight}`, borderBottom: `0.5px solid ${C.borderLight}` }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-14" style={{ color: C.text }}>
            Five steps to skin clarity.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card
                  key={i}
                  className="relative overflow-hidden group glass-card hover-lift"
                  style={{ border: `0.5px solid ${C.borderLight}`, background: "rgba(255,255,255,0.7)" }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <StepBadge n={i + 1} />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: C.primaryGhost }}
                      >
                        <Icon size={16} style={{ color: C.primary }} />
                      </div>
                    </div>
                    <h3 className="text-base font-medium mb-2" style={{ color: C.text }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.textLight }}>
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            {/* CTA card */}
            <Card
              className="flex flex-col items-start justify-between hover-lift"
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                border: "none",
              }}
            >
              <CardContent className="p-6 flex flex-col h-full">
                <p className="text-base font-medium mb-2" style={{ color: C.bg }}>
                  Ready to start?
                </p>
                <p className="text-sm leading-relaxed mb-8" style={{ color: C.primaryGhost, opacity: 0.9 }}>
                  Your skin analysis takes under 5 minutes.
                </p>
                <button
                  className="mt-auto flex items-center gap-2 text-sm font-medium py-2.5 px-5 rounded-lg magnetic-btn"
                  style={{ background: C.bgCard, color: C.primary }}
                >
                  Begin now <ChevronRight size={14} />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Concerns ── */}
      <section id="concerns" className="py-24 max-w-6xl mx-auto px-6">
        <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
          What we address
        </p>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-10" style={{ color: C.text }}>
          Every skin concern, covered.
        </h2>
        <div className="flex flex-wrap gap-3">
          {CONCERNS.map((c) => (
            <span
              key={c}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm cursor-default"
              style={{ background: C.bgCard, border: `0.5px solid ${C.border}`, color: C.primary }}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Day / Night routine preview */}
        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {[
            {
              icon: Sun,
              label: "Morning routine",
              steps: ["Gentle cleanser", "Vitamin C serum", "Niacinamide moisturiser", "SPF 50 sunscreen"],
            },
            {
              icon: Moon,
              label: "Evening routine",
              steps: ["Oil cleanser → foam cleanser", "Retinol serum (2×/week)", "Peptide eye cream", "Barrier repair cream"],
            },
          ].map(({ icon: Icon, label, steps }) => (
            <Card
              key={label}
              className="glass-card hover-lift"
              style={{ border: `0.5px solid ${C.borderLight}`, background: "rgba(255,255,255,0.7)" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: C.primaryGhost }}
                  >
                    <Icon size={16} style={{ color: C.primary }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: C.text }}>{label}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <StepBadge n={i + 1} />
                      <span className="text-sm" style={{ color: C.textLight }}>{s}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="reviews"
        className="py-24"
        style={{ background: C.bgCard, borderTop: `0.5px solid ${C.borderLight}`, borderBottom: `0.5px solid ${C.borderLight}` }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.accent }}>
            Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-12" style={{ color: C.text }}>
            Skin that speaks for itself.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card
                key={t.name}
                className="glass-card hover-lift"
                style={{ border: `0.5px solid ${C.borderLight}`, background: "rgba(250,248,245,0.6)" }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} fill={C.accent} style={{ color: C.accent }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: C.textLight }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ background: C.primaryGhost, color: C.primary }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{t.name}</p>
                      <p className="text-xs" style={{ color: C.accent }}>{t.skin}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(74, 103, 65, 0.06) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(196, 149, 106, 0.04) 0%, transparent 50%),
              linear-gradient(180deg, ${C.bg} 0%, ${C.bgWarm} 100%)
            `,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-medium tracking-tight mb-5 leading-tight"
            style={{ color: C.text }}
          >
            Your skin deserves
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              a real plan.
            </span>
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: C.textLight }}>
            Five minutes. One photo. A skincare routine that&apos;s made for your skin.
          </p>
          <Button
            size="lg"
            className="text-base font-medium text-white px-10 h-12 magnetic-btn"
            style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)` }}
          >
            Analyze my skin — it&apos;s free
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-6"
        style={{ borderTop: `0.5px solid ${C.borderLight}`, background: C.bgCard }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: C.textMuted }}>
            © {new Date().getFullYear()} Lucent. Your skin, illuminated.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors duration-300"
                style={{ color: C.textLight }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textLight)}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
