"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  successFg: "#1E3D2A",
  successBg: "#e8f0e6",
  warnFg: "#78350f",
  warnBg: "#FEF3C7",
};

interface WeekMilestone {
  week: number;
  label: string;
  title: string;
  beforeImg: string;
  afterImg: string;
  hydrationGain: string;
  rednessDrop: string;
  textureImprovement: string;
  keyChanges: string[];
  dermatologistNote: string;
}

const MILESTONES: WeekMilestone[] = [
  {
    week: 1,
    label: "Week 1",
    title: "Microbiome Reset & Initial Adaptation",
    beforeImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500",
    afterImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500",
    hydrationGain: "+18%",
    rednessDrop: "-12%",
    textureImprovement: "+8%",
    keyChanges: ["Reduction in tight dry feeling after cleansing", "Initial micro-purging of congested pores", "Skin mantle pH stabilizes around 5.5"],
    dermatologistNote: "Do not stop treatment during mild week 1 cell turnover purging. Focus on gentle hydration."
  },
  {
    week: 2,
    label: "Week 2",
    title: "Stratum Corneum Barrier Reinforcement",
    beforeImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500",
    afterImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=500",
    hydrationGain: "+34%",
    rednessDrop: "-28%",
    textureImprovement: "+22%",
    keyChanges: ["Visible smoothing of cheek texture", "Acne lesions heal 40% faster", "Reduced flakiness under makeup"],
    dermatologistNote: "Lipid barrier ceramides are actively locking in intercellular moisture now."
  },
  {
    week: 4,
    label: "Week 4",
    title: "Epidermal Renewal & Pigment Fading",
    beforeImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500",
    afterImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500",
    hydrationGain: "+58%",
    rednessDrop: "-46%",
    textureImprovement: "+45%",
    keyChanges: ["Hyperpigmentation spots fade by 3-4 shades", "Pore appearance tightened", "Radiant natural luminosity achieved"],
    dermatologistNote: "Full 28-day skin cycle complete. Skin surface has completely regenerated."
  },
  {
    week: 8,
    label: "Week 8",
    title: "Sustained Collagen Matrix & Clarity",
    beforeImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=500",
    afterImg: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=500",
    hydrationGain: "+76%",
    rednessDrop: "-68%",
    textureImprovement: "+72%",
    keyChanges: ["Long-term breakout prevention", "Dermal firmness and elasticity boosted", "Zero active inflammation"],
    dermatologistNote: "Maintenance routine active. Skin barrier is resilient and thriving."
  }
];

export function SkinJourneySlider() {
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [sliderPos, setSliderPos] = useState<number>(50);

  const milestone = MILESTONES.find(m => m.week === selectedWeek) || MILESTONES[2];

  return (
    <div className="w-full glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up">
      <div className="text-center max-w-xl mx-auto mb-8">
        <Badge className="mb-2 border-0 text-xs px-3 py-1 rounded-full font-semibold" style={{ background: C.primaryGhost, color: C.primary }}>
          Clinical Progress Simulator
        </Badge>
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2" style={{ color: C.primary }}>
          Interactive 4-Week Skin Transformation
        </h3>
        <p className="text-sm" style={{ color: C.textSecondary }}>
          Select a week milestone to simulate the clinical skin regeneration timeline guided by Lucent routine protocols.
        </p>
      </div>

      {/* Week Milestone Selector Tabs */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-8">
        {MILESTONES.map((m, idx) => {
          const isActive = selectedWeek === m.week;
          return (
            <button
              key={m.week}
              onClick={() => setSelectedWeek(m.week)}
              className="magnetic-btn px-4 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer animate-fade-in-up"
              style={{
                background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : C.primaryGhost,
                color: isActive ? "#fff" : C.primary,
                border: `1px solid ${isActive ? C.primary : C.border}`,
                opacity: 0,
                animationFillMode: "forwards",
                animationDelay: `${0.1 + idx * 0.06}s`,
                boxShadow: isActive ? `0 4px 16px ${C.primaryGlow}` : "none",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Visualizer & Metrics */}
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Split Image Comparison (6 cols) */}
        <div className="lg:col-span-6 animate-fade-in-up stagger-3" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: C.border }}>
            {/* After Image (Full width background) */}
            <img
              src={milestone.afterImg}
              alt="After transformation"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Before Image (Clipped overlay) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 transition-all duration-100"
              style={{ width: `${sliderPos}%`, borderColor: "#fff" }}
            >
              <img
                src={milestone.beforeImg}
                alt="Before transformation"
                className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-110 saturate-90"
                style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
              />
              <span className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm">
                Day 0 Baseline
              </span>
            </div>

            <span className="absolute top-3 right-3 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm" style={{ background: `rgba(45, 90, 61, 0.85)` }}>
              {milestone.label} Result
            </span>

            {/* Interactive Drag Handle */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />

            {/* Divider Line visual handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-10 flex items-center justify-center transition-all duration-100"
              style={{ left: `${sliderPos}%` }}
            >
              <div
                className="w-7 h-7 rounded-full shadow-md flex items-center justify-center text-[10px] font-bold"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff" }}
              >
                ↔
              </div>
            </div>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: C.textMuted }}>
            Drag slider back and forth to compare baseline vs {milestone.label}
          </p>
        </div>

        {/* Right: Quantitative Metrics & Changes (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="animate-fade-in-up stagger-4" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <Badge className="border-0 text-xs px-2.5 py-0.5 rounded-full mb-1" style={{ background: C.primaryGhost, color: C.primary }}>
              Milestone Phase {milestone.week}
            </Badge>
            <h4 className="text-xl font-semibold" style={{ color: C.primary }}>
              {milestone.title}
            </h4>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Hydration", value: milestone.hydrationGain, color: C.primary },
              { label: "Redness", value: milestone.rednessDrop, color: C.primaryDark },
              { label: "Texture", value: milestone.textureImprovement, color: C.accent },
            ].map((metric, idx) => (
              <div
                key={metric.label}
                className="glass-card p-3 rounded-2xl border text-center hover-lift animate-fade-in-up"
                style={{
                  borderColor: C.border,
                  opacity: 0,
                  animationFillMode: "forwards",
                  animationDelay: `${0.45 + idx * 0.06}s`,
                }}
              >
                <span className="text-[10px] uppercase font-semibold block mb-0.5" style={{ color: C.textMuted }}>{metric.label}</span>
                <span className="text-xl font-bold" style={{ color: metric.color }}>{metric.value}</span>
              </div>
            ))}
          </div>

          {/* Observed Clinical Changes */}
          <div className="glass-card p-4 rounded-2xl border animate-fade-in-up stagger-6" style={{ borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
            <h5 className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: C.primary }}>
              Key Observed Improvements:
            </h5>
            <ul className="space-y-2">
              {milestone.keyChanges.map((change, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: C.textSecondary }}>
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: C.primary }} />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dermatologist Insight */}
          <div className="p-3.5 rounded-2xl border text-xs leading-relaxed animate-fade-in-up stagger-7" style={{ background: C.primaryGhost, borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
            <span className="font-semibold block mb-0.5" style={{ color: C.primary }}>
              Clinical Note:
            </span>
            <span style={{ color: C.textSecondary }}>{milestone.dermatologistNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
