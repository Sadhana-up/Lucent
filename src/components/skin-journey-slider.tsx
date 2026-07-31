"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const C = {
  primary: "#831843",
  active: "#BE185D",
  blush: "#EC4899",
  petal: "#FBCFE8",
  mist: "#FDF2F8",
  ink: "#1C1917",
  smoke: "#44403C",
  accent: "#4C1D95",
  successFg: "#14532D",
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
    <div className="w-full rounded-3xl p-6 sm:p-8 border" style={{ background: "#fff", borderColor: C.petal }}>
      <div className="text-center max-w-xl mx-auto mb-8">
        <Badge className="mb-2 border-0 text-xs px-3 py-1 rounded-full font-medium" style={{ background: C.petal, color: C.primary }}>
          Clinical Progress Simulator
        </Badge>
        <h3 className="text-2xl sm:text-3xl font-medium tracking-tight mb-2" style={{ color: C.primary }}>
          Interactive 4-Week Skin Transformation
        </h3>
        <p className="text-sm" style={{ color: C.smoke }}>
          Select a week milestone to simulate the clinical skin regeneration timeline guided by Lucent routine protocols.
        </p>
      </div>

      {/* Week Milestone Selector Tabs */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-8">
        {MILESTONES.map((m) => {
          const isActive = selectedWeek === m.week;
          return (
            <button
              key={m.week}
              onClick={() => setSelectedWeek(m.week)}
              className={`px-4 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive ? "shadow-md scale-105" : "hover:bg-pink-100"
              }`}
              style={{
                background: isActive ? C.primary : C.mist,
                color: isActive ? "#fff" : C.primary,
                border: `1px solid ${isActive ? C.primary : C.petal}`,
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
        <div className="lg:col-span-6">
          <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: C.petal }}>
            {/* After Image (Full width background) */}
            <img
              src={milestone.afterImg}
              alt="After transformation"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Before Image (Clipped overlay) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2"
              style={{ width: `${sliderPos}%`, borderColor: "#fff" }}
            >
              <img
                src={milestone.beforeImg}
                alt="Before transformation"
                className="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-110 saturate-90"
              />
              <span className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm">
                Day 0 Baseline
              </span>
            </div>

            <span className="absolute top-3 right-3 bg-pink-900/80 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm">
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
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-10 flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-white text-pink-900 shadow-md flex items-center justify-center text-[10px] font-bold">
                ↔
              </div>
            </div>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: C.smoke }}>
            👈 Drag slider back and forth to compare baseline vs {milestone.label} 👉
          </p>
        </div>

        {/* Right: Quantitative Metrics & Changes (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <Badge className="border-0 text-xs px-2.5 py-0.5 rounded-full mb-1" style={{ background: C.petal, color: C.primary }}>
              Milestone Phase {milestone.week}
            </Badge>
            <h4 className="text-xl font-medium" style={{ color: C.primary }}>
              {milestone.title}
            </h4>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl border text-center" style={{ background: C.mist, borderColor: C.petal }}>
              <span className="text-[10px] uppercase font-semibold text-pink-700 block mb-0.5">Hydration</span>
              <span className="text-xl font-bold text-blue-600">{milestone.hydrationGain}</span>
            </div>
            <div className="p-3 rounded-2xl border text-center" style={{ background: C.mist, borderColor: C.petal }}>
              <span className="text-[10px] uppercase font-semibold text-pink-700 block mb-0.5">Redness</span>
              <span className="text-xl font-bold text-emerald-600">{milestone.rednessDrop}</span>
            </div>
            <div className="p-3 rounded-2xl border text-center" style={{ background: C.mist, borderColor: C.petal }}>
              <span className="text-[10px] uppercase font-semibold text-pink-700 block mb-0.5">Texture</span>
              <span className="text-xl font-bold text-purple-600">{milestone.textureImprovement}</span>
            </div>
          </div>

          {/* Observed Clinical Changes */}
          <div className="p-4 rounded-2xl border" style={{ background: "#fff", borderColor: C.petal }}>
            <h5 className="text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: C.primary }}>
              Key Observed Improvements:
            </h5>
            <ul className="space-y-2">
              {milestone.keyChanges.map((change, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: C.smoke }}>
                  <CheckCircle2 size={14} className="text-pink-600 shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dermatologist Insight */}
          <div className="p-3.5 rounded-2xl border text-xs leading-relaxed" style={{ background: "#FFFBFB", borderColor: C.petal }}>
            <span className="font-semibold block mb-0.5" style={{ color: C.primary }}>
              👨‍⚕️ Clinical Note:
            </span>
            <span style={{ color: C.smoke }}>{milestone.dermatologistNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
