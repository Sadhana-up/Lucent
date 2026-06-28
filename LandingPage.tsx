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
  Sparkles,
  Star,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

/* ─── Design tokens (mirror your CSS vars here for Tailwind arbitrary values) ─── */
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

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? 28 : size === "lg" ? 52 : 38;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
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
      style={{ background: C.mist, border: `0.5px solid ${C.petal}`, color: C.primary }}
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
    desc: "Take or upload a selfie. Lucent reads skin tone, texture, pore size, hydration, and visible concerns in seconds.",
  },
  {
    icon: MessageCircle,
    title: "Chat with your advisor",
    desc: "Describe your lifestyle — sleep, diet, stress, past reactions. The AI listens and remembers across every session.",
  },
  {
    icon: User,
    title: "Build your skin profile",
    desc: "Lucent captures your skin type, environment, hormonal patterns, and personal goals into a living profile.",
  },
  {
    icon: FlaskConical,
    title: "Audit your products",
    desc: "Photograph or type in your current routine. Lucent scans every ingredient and flags conflicts, gaps, and redundancies.",
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
    <div className="min-h-screen font-sans" style={{ background: C.mist, color: C.ink }}>

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 transition-all duration-200"
        style={{
          background: scrolled ? "rgba(253,242,248,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `0.5px solid ${C.petal}` : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-8">
            {["How it works", "Concerns", "Reviews"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors"
                style={{ color: C.smoke }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.smoke)}
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
              className="text-sm font-medium text-white"
              style={{ background: C.primary }}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <Badge
          className="mb-6 text-xs font-medium px-4 py-1.5 rounded-full border-0"
          style={{ background: C.petal, color: C.primary }}
        >
          <Sparkles size={12} className="mr-1.5" />
          AI-powered skincare advisor
        </Badge>

        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-tight mb-6 max-w-4xl mx-auto"
          style={{ color: C.primary }}
        >
          Your skin,
          <br />
          <span style={{ color: C.active }}>finally understood.</span>
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: C.smoke }}
        >
          Upload a photo. Have a conversation. Walk away with a skincare routine
          that was built for your skin — not a generic type.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="text-base font-medium text-white px-8 h-12"
            style={{ background: C.primary }}
          >
            Analyze my skin
            <ArrowRight size={16} className="ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base h-12 px-8"
            style={{ borderColor: C.petal, color: C.primary, background: "transparent" }}
          >
            See how it works
          </Button>
        </div>

        <p className="mt-5 text-sm" style={{ color: C.blush }}>
          Free to start · No credit card required
        </p>

        {/* Hero card mockup */}
        <div className="mt-16 max-w-sm mx-auto">
          <Card
            className="text-left overflow-hidden"
            style={{ border: `0.5px solid ${C.petal}`, background: "#fff" }}
          >
            <CardContent className="p-0">
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ borderBottom: `0.5px solid ${C.petal}` }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-content-center"
                  style={{ background: C.mist, border: `0.5px solid ${C.petal}` }}
                >
                  <User size={16} style={{ color: C.primary, margin: "auto" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: C.primary }}>Skin analysis complete</p>
                  <p className="text-xs" style={{ color: C.active }}>3 concerns · 6-step routine ready</p>
                </div>
                <CheckCircle size={18} className="ml-auto" style={{ color: C.successFg }} />
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                {["Hyperpigmentation detected", "Dehydration markers found", "Barrier sensitivity — mild"].map(
                  (item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: i === 0 ? C.primary : i === 1 ? C.blush : C.petal }}
                      />
                      <span className="text-sm" style={{ color: C.smoke }}>{item}</span>
                    </div>
                  )
                )}
              </div>
              <div className="px-5 pb-4">
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: C.primary }}
                >
                  View my routine
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="py-24"
        style={{ background: "#fff", borderTop: `0.5px solid ${C.petal}`, borderBottom: `0.5px solid ${C.petal}` }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.active }}>
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-14" style={{ color: C.primary }}>
            Five steps to skin clarity.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card
                  key={i}
                  className="relative overflow-hidden group hover:border-pink-300 transition-colors"
                  style={{ border: `0.5px solid ${C.petal}`, background: C.mist }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <StepBadge n={i + 1} />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: C.petal }}
                      >
                        <Icon size={16} style={{ color: C.primary }} />
                      </div>
                    </div>
                    <h3 className="text-base font-medium mb-2" style={{ color: C.primary }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.smoke }}>
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            {/* CTA card */}
            <Card
              className="flex flex-col items-start justify-between"
              style={{ background: C.primary, border: "none" }}
            >
              <CardContent className="p-6 flex flex-col h-full">
                <p className="text-base font-medium mb-2" style={{ color: C.petal }}>
                  Ready to start?
                </p>
                <p className="text-sm leading-relaxed mb-8" style={{ color: C.blush }}>
                  Your skin analysis takes under 5 minutes.
                </p>
                <button
                  className="mt-auto flex items-center gap-2 text-sm font-medium py-2.5 px-5 rounded-lg"
                  style={{ background: C.mist, color: C.primary }}
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
        <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.active }}>
          What we address
        </p>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-10" style={{ color: C.primary }}>
          Every skin concern, covered.
        </h2>
        <div className="flex flex-wrap gap-3">
          {CONCERNS.map((c) => (
            <span
              key={c}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "#fff", border: `0.5px solid ${C.petal}`, color: C.primary }}
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
              style={{ border: `0.5px solid ${C.petal}`, background: "#fff" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: C.petal }}
                  >
                    <Icon size={16} style={{ color: C.primary }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: C.primary }}>{label}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <StepBadge n={i + 1} />
                      <span className="text-sm" style={{ color: C.smoke }}>{s}</span>
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
        style={{ background: "#fff", borderTop: `0.5px solid ${C.petal}`, borderBottom: `0.5px solid ${C.petal}` }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: C.active }}>
            Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-12" style={{ color: C.primary }}>
            Skin that speaks for itself.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card
                key={t.name}
                style={{ border: `0.5px solid ${C.petal}`, background: C.mist }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} fill={C.active} style={{ color: C.active }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: C.smoke }}>
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ background: C.petal, color: C.primary }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.primary }}>{t.name}</p>
                      <p className="text-xs" style={{ color: C.active }}>{t.skin}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 max-w-6xl mx-auto px-6 text-center">
        <h2
          className="text-4xl md:text-5xl font-medium tracking-tight mb-5 leading-tight"
          style={{ color: C.primary }}
        >
          Your skin deserves
          <br />a real plan.
        </h2>
        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: C.smoke }}>
          Five minutes. One photo. A skincare routine that's actually yours.
        </p>
        <Button
          size="lg"
          className="text-base font-medium text-white px-10 h-12"
          style={{ background: C.primary }}
        >
          Analyze my skin — it's free
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-10 px-6"
        style={{ borderTop: `0.5px solid ${C.petal}`, background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: C.blush }}>
            © {new Date().getFullYear()} Lucent. Your skin, illuminated.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((item) => (
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
    </div>
  );
}
