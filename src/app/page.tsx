"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
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
  Bot,
  Leaf,
  Sparkles,
  Shield,
  Zap,
  ShoppingBag,
  Package,
} from "lucide-react";

/* ─── Color Palette ─── */
const C = {
  primary: "#435B49",          // Soothing Sage Green
  primaryLight: "#5B7562",
  primaryDark: "#2B3B2F",
  primaryGhost: "rgba(67, 91, 73, 0.05)",
  primaryGlow: "rgba(67, 91, 73, 0.12)",
  primarySubtle: "rgba(67, 91, 73, 0.03)",

  accent: "#9A94C5",           // Soothing Soft Lavender
  accentLight: "#B2ACDC",
  accentGhost: "rgba(154, 148, 197, 0.06)",
  accentGlow: "rgba(154, 148, 197, 0.12)",

  rose: "#5A7F75",             // Muted Teal
  roseGhost: "rgba(90, 127, 117, 0.08)",

  bg: "#FAF6F0",               // Warm Silk off-white
  bgWarm: "#F5EFEB",           // Soft Cashmere cream
  bgCard: "#FFFFFF",
  
  text: "#2A2A28",             // Softer Charcoal
  textSecondary: "#5C5C58",
  textMuted: "#9C9C96",
  
  border: "#EAE2D9",           // Elegant soft border
  borderLight: "#F4EFE7",
  
  successBg: "rgba(67, 91, 73, 0.06)",
  successFg: "#2B3B2F",
};

/* ─── Motion Variants ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/* ─── Data ─── */
const STEPS = [
  { icon: Camera, title: "Capture", desc: "Take a quick selfie or upload a photo of your skin concerns for initial assessment." },
  { icon: MessageCircle, title: "Consult", desc: "Have a guided conversation with our AI about your skin history, lifestyle, and goals." },
  { icon: FlaskConical, title: "Analyze", desc: "Receive a detailed report mapping your skin condition against ingredient science." },
  { icon: Map, title: "Navigate", desc: "Follow your personalized roadmap with product recommendations and routine timelines." },
];

const FEATURES = [
  { icon: Bot, title: "AI Skin Advisor", description: "Conversational intelligence trained on dermatological research and ingredient databases.", color: "primary" },
  { icon: Camera, title: "Visual Analysis", description: "Computer vision algorithms detect texture, redness, and hydration indicators from photos.", color: "accent" },
  { icon: FlaskConical, title: "Ingredient Science", description: "Cross-reference your skin profile against thousands of active compounds and formulations.", color: "rose" },
  { icon: Shield, title: "Barrier Protection", description: "Monitor your skin barrier health and receive alerts when adjustments are needed.", color: "primary" },
  { icon: Zap, title: "Rapid Results", description: "See measurable improvements within weeks with our evidence-based routine protocols.", color: "accent" },
  { icon: Layers, title: "Layered Routines", description: "Step-by-step application guides optimized for morning and evening regimens.", color: "rose" },
];

/* ─── Floating Blob Component ─── */
function FloatingBlob({
  className,
  color,
  delay = 0,
  duration = 8,
  size = "w-72 h-72",
}: {
  className?: string;
  color: string;
  delay?: number;
  duration?: number;
  size?: string;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[80px] opacity-25 pointer-events-none ${size} ${className}`}
      style={{ background: color }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -40, 20, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/* ─── Main Component ─── */
export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<"analyzer" | "builder" | "matrix" | "chat">("analyzer");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveredHero, setIsHoveredHero] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: session } = authClient.useSession();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      if (role === "seller" || role === "admin") {
        router.push("/seller");
      }
    }
  }, [session, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased relative overflow-hidden" style={{ background: C.bg, color: C.text }}>
      
      {/* ── Scroll Progress indicator ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] origin-[0%] z-50"
        style={{ scaleX, background: `linear-gradient(90deg, ${C.primary} 0%, ${C.accent} 100%)` }}
      />

      {/* ── Ambient Background Lighting ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <FloatingBlob color={C.primaryLight} size="w-[500px] h-[500px]" className="-top-32 -left-32" duration={12} />
        <FloatingBlob color={C.accent} size="w-[450px] h-[450px]" className="top-1/3 -right-32" delay={2} duration={14} />
        <FloatingBlob color={C.rose} size="w-[400px] h-[400px]" className="bottom-10 left-1/4" delay={4} duration={10} />
      </div>

      {/* ── Sticky Navbar ── */}
      <header
        className="sticky top-0 z-40 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(250, 246, 240, 0.82)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.2)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.2)" : "none",
          borderBottom: scrolled ? `1px solid ${C.border}50` : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 20px rgba(67, 91, 73, 0.02)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 hover:rotate-12"
              style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, boxShadow: `0 4px 12px ${C.primaryGlow}` }}
            >
              <Leaf size={18} className="text-white" />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight" style={{ color: C.primary }}>
              Lucent
            </span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Interactive tools", href: "#interactive-suite" },
              { label: "Shop", href: "/shop" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium transition-colors duration-300 relative group"
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

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            {session ? (
              <div className="flex items-center gap-2">
                {(session.user as { role?: string }).role !== "seller" && (session.user as { role?: string }).role !== "admin" && (
                  <>
                    <button
                      onClick={() => router.push("/shop/cart")}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
                      style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
                      title="Cart"
                    >
                      <ShoppingBag size={16} />
                    </button>
                    <button
                      onClick={() => router.push("/shop/orders")}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
                      style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
                      title="Orders"
                    >
                      <Package size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_rgba(67,91,73,0.15)]"
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.style.background = C.primaryGhost;
                          parent.style.border = `1px solid ${C.border}`;
                          parent.textContent = session.user.name?.charAt(0).toUpperCase() || "?";
                        }
                      }}
                    />
                  ) : (
                    session.user.name?.charAt(0).toUpperCase()
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium hover:bg-black/5"
                  style={{ color: C.textSecondary }}
                  onClick={() => router.push("/sign-in")}
                >
                  Sign in
                </Button>
                <Button
                  variant="premium"
                  size="sm"
                  className="text-sm font-semibold shadow-sm hover:shadow-md"
                  onClick={() => router.push("/sign-up")}
                >
                  Get started
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveredHero(true)}
        onMouseLeave={() => setIsHoveredHero(false)}
        className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-28 pb-20 overflow-hidden z-10 flex flex-col items-center"
      >
        {/* Mouse interactive lighting effect */}
        {isHoveredHero && (
          <div
            className="absolute pointer-events-none rounded-full blur-[100px] w-[350px] h-[350px] transition-opacity duration-500 opacity-30 z-0"
            style={{
              left: mousePos.x - 175,
              top: mousePos.y - 175,
              background: `radial-gradient(circle, ${C.accentLight} 0%, transparent 80%)`,
            }}
          />
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto relative z-10"
        >
          <motion.div variants={fadeInUp} custom={0}>
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6"
              style={{
                background: C.primaryGhost,
                color: C.primary,
                border: `1px solid ${C.border}`,
              }}
            >
              <Sparkles size={12} className="animate-pulse" />
              AI Skincare Laboratory
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 font-serif"
            style={{ color: C.text }}
          >
            Your skin, finally <br />
            <span className="italic font-normal opacity-90" style={{ color: C.primary }}>understood.</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            custom={2}
            className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: C.textSecondary }}
          >
            Upload a photo. Converse with our intelligence. Obtain a custom skin roadmap 
            grounded in ingredients science, curated for you.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            custom={3}
            className="flex flex-col sm:flex-row gap-3.5 justify-center"
          >
            <Button
              variant="premium"
              size="lg"
              className="text-sm font-semibold px-8 h-12 shadow-md hover:shadow-lg"
              onClick={() => router.push("/chat")}
            >
              Analyze my skin
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
            <Button
              variant="glass"
              size="lg"
              className="text-sm font-medium px-7 h-12"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </Button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            custom={4}
            className="mt-10 flex items-center justify-center gap-6 text-xs"
            style={{ color: C.textMuted }}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} style={{ color: C.primary }} /> Free skin audit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} style={{ color: C.primary }} /> Instant report
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} style={{ color: C.primary }} /> Science-backed actives
            </span>
          </motion.div>
        </motion.div>

        {/* Hero Decorative Center Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 relative z-10 w-64 h-64 flex items-center justify-center"
        >
          {/* Breathing outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl opacity-40"
            style={{
              background: `radial-gradient(circle, ${C.primaryLight} 0%, ${C.accentLight} 50%, transparent 100%)`,
            }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Frosted Glass Core Orb */}
          <div
            className="absolute inset-4 rounded-full border border-white/50 bg-white/30 backdrop-blur-2xl shadow-xl flex items-center justify-center"
            style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 40px rgba(67, 91, 73, 0.08)` }}
          >
            {/* Center leaf icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                boxShadow: `0 8px 24px ${C.primaryGlow}`,
              }}
            >
              <Sparkles size={24} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="py-24 relative overflow-hidden"
        style={{ borderTop: `1px solid ${C.borderLight}`, background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bgWarm} 100%)` }}
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3"
              style={{ background: C.accentGhost, color: C.accent, border: `1px solid ${C.border}` }}
            >
              Clinical Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: C.text }}>
              Four steps to skin clarity
            </h2>
            <p className="text-sm mt-3" style={{ color: C.textSecondary }}>
              An analytical journey combining visual skin analysis with ingredients science.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="glass-card rounded-2xl border p-6 flex flex-col justify-between group transition-all duration-500 hover:shadow-lg"
                  style={{ background: "rgba(255, 255, 255, 0.45)", borderColor: C.borderLight }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-serif text-sm font-semibold tracking-wider opacity-60" style={{ color: C.primary }}>
                        0{i + 1}
                      </span>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                        style={{ background: C.primaryGhost }}
                      >
                        <Icon size={18} style={{ color: C.primary }} />
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 relative bg-white overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute right-0 top-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: C.accent }} />
        <div className="absolute left-0 bottom-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: C.primary }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3"
              style={{ background: C.primaryGhost, color: C.primary, border: `1px solid ${C.border}` }}
            >
              Technology
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3" style={{ color: C.text }}>
              Built for your skin
            </h2>
            <p className="text-sm" style={{ color: C.textSecondary }}>
              An intelligent stack designed to protect, optimize, and analyze your cutaneous barrier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const colorTheme = feature.color === "primary" ? C.primary : feature.color === "accent" ? C.accent : C.rose;
              const colorBg = feature.color === "primary" ? C.primaryGhost : feature.color === "accent" ? C.accentGhost : C.roseGhost;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-6 rounded-2xl border flex flex-col justify-between group transition-all duration-300 hover:shadow-md"
                  style={{ background: C.bgWarm + "30", borderColor: C.borderLight }}
                >
                  <div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-105"
                      style={{ background: colorBg }}
                    >
                      <Icon size={20} style={{ color: colorTheme }} />
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive Suite Section ── */}
      <section id="interactive-suite" className="py-24 relative overflow-hidden" style={{ borderTop: `1px solid ${C.borderLight}`, background: C.bgWarm + "40" }}>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3"
              style={{ background: C.accentGhost, color: C.accent, border: `1px solid ${C.border}` }}
            >
              Interactive Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: C.text }}>
              Explore real-time companion tools
            </h2>
            <p className="text-sm mt-3" style={{ color: C.textSecondary }}>
              Interact directly with the systems powering the Lucent personalized skin routine ecosystem.
            </p>
          </div>

          {/* Interactive Tools Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: "analyzer", label: "Skin Analysis", icon: Camera },
              { id: "builder", label: "Routine Builder", icon: Sliders },
              { id: "matrix", label: "Ingredients Explorer", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeInteractiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveInteractiveTab(tab.id as typeof activeInteractiveTab);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer relative"
                  style={{
                    color: isActive ? "#fff" : C.textSecondary,
                    border: `1px solid ${isActive ? "transparent" : C.border}`,
                  }}
                >
                  {/* Sliding active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-xl z-0"
                      style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={14} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Tool Renderer with AnimatePresence */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInteractiveTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                {activeInteractiveTab === "builder" && <RoutineBuilder />}
                {activeInteractiveTab === "matrix" && <ConcernsMatrix />}
                {activeInteractiveTab === "analyzer" && (
                  <div className="glass-card p-10 sm:p-14 rounded-3xl text-center max-w-2xl mx-auto border" style={{ background: "rgba(255,255,255,0.7)", borderColor: C.borderLight }}>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white"
                      style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, boxShadow: `0 4px 12px ${C.primaryGlow}` }}
                    >
                      <Camera size={24} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-3" style={{ color: C.text }}>
                      Interactive Skin Analysis Tool
                    </h3>
                    <p className="text-xs max-w-md mx-auto mb-8 leading-relaxed" style={{ color: C.textSecondary }}>
                      Provide a selfie during consultation to let our algorithms assess parameters like redness, texture variation, and hydration indicators.
                    </p>
                    <Button
                      variant="premium"
                      size="lg"
                      className="text-sm font-semibold px-8 shadow-sm hover:shadow-md"
                      onClick={() => router.push("/sign-up")}
                    >
                      Sign up to analyze skin
                      <ArrowRight size={16} className="ml-1.5" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: `1px solid ${C.borderLight}` }}>
        <div className="absolute inset-0 bg-white pointer-events-none z-0" />
        {/* Soft lavender spotlight */}
        <div className="absolute right-1/4 bottom-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-15 pointer-events-none" style={{ background: C.accent }} />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-5 leading-tight"
              style={{ color: C.text }}
            >
              Your skin deserves <br />
              <span className="italic font-normal opacity-95" style={{ color: C.primary }}>a real plan.</span>
            </h2>
            <p className="text-sm mb-8 max-w-md mx-auto leading-relaxed" style={{ color: C.textSecondary }}>
              Takes three minutes. Instant formulation report. A scientific routine designed to be actually yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              <Button
                variant="premium"
                size="lg"
                className="text-sm font-semibold px-9 h-12 shadow-md hover:shadow-lg"
                onClick={() => router.push("/chat")}
              >
                Analyze my skin — it&apos;s free
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-14 px-6 relative z-10"
        style={{ borderTop: `1px solid ${C.borderLight}`, background: C.bgWarm }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1 flex flex-col items-start">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: C.primary }}
                >
                  <Leaf size={14} className="text-white" />
                </div>
                <span className="font-serif text-lg font-bold" style={{ color: C.text }}>
                  Lucent
                </span>
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: C.textMuted }}>
                Skin, illuminated. AI-powered diagnostics and personalized routines grounded in science.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.text }}>Product</h4>
              <ul className="space-y-2">
                {["Skin Analysis", "AI Advisor Chat", "Routine Builder", "Active Ingredients Matrix"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200 hover:text-black/60" style={{ color: C.textSecondary }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.text }}>Company</h4>
              <ul className="space-y-2">
                {["About Science", "Blog & Research", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200 hover:text-black/60" style={{ color: C.textSecondary }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.text }}>Legal</h4>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Clinical Disclaimer"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs transition-colors duration-200 hover:text-black/60" style={{ color: C.textSecondary }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.border}50` }}>
            <p className="text-xs" style={{ color: C.textMuted }}>
              © {new Date().getFullYear()} Lucent. All rights reserved.
            </p>
            <div className="flex gap-5">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs transition-colors duration-200 hover:text-black/60"
                  style={{ color: C.textSecondary }}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
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
