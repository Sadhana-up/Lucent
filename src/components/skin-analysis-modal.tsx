"use client";

import { useState, useEffect } from "react";
import { X, Upload, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ArrowRight, Camera, Droplets, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  successFg: "#3a5233",
  successBg: "#e8f0e6",
};

export interface SampleProfile {
  id: string;
  name: string;
  image: string;
  skinType: string;
  concerns: string[];
  hydration: number;
  barrierScore: number;
  pigmentationScore: number;
  sensitivityScore: number;
  summary: string;
  amRoutine: string[];
  pmRoutine: string[];
  warnings: string[];
}

const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: "acne",
    name: "Combination & Breakout-Prone",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    skinType: "Combination / Oily T-Zone",
    concerns: ["Congested pores", "Active breakouts", "Post-acne red marks"],
    hydration: 62,
    barrierScore: 74,
    pigmentationScore: 68,
    sensitivityScore: 55,
    summary: "Mild T-zone sebum excess with localized follicular inflammation. Requires gentle BHA exfoliation coupled with lipid barrier support.",
    amRoutine: ["Sulfate-Free Gel Cleanser", "2% Salicylic Acid Liquid Exfoliant", "Lightweight Hyaluronic Gel-Cream", "Mineral SPF 50"],
    pmRoutine: ["Cleansing Balm", "Gentle Hydrating Cleanser", "0.3% Retinol (3x/week)", "Ceramide Barrier Repair Cream"],
    warnings: ["Avoid heavy occlusive oils like coconut oil", "Do not layer AHA/BHA at the same time as Retinol"]
  },
  {
    id: "pigmentation",
    name: "Sun Exposure & Hyperpigmentation",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    skinType: "Normal to Dry",
    concerns: ["Dark spots & sunspots", "Uneven skin tone", "Dull texture"],
    hydration: 70,
    barrierScore: 82,
    pigmentationScore: 48,
    sensitivityScore: 35,
    summary: "Localized melanocyte hyperactivity from UV damage. High potential for correction using tyrosinase inhibitors (Vitamin C, Tranexamic Acid).",
    amRoutine: ["Gentle Hydrating Cleanser", "15% Vitamin C + Ferulic Acid", "Niacinamide Moisturizer", "Broad Spectrum SPF 50+"],
    pmRoutine: ["Oil Cleanser", "Foam Cleanser", "3% Tranexamic Acid Serum", "Night Repair Peptide Cream"],
    warnings: ["Strict daily SPF reapplication every 2 hours is required for progress"]
  },
  {
    id: "sensitive",
    name: "Dry & Reactive Skin Barrier",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
    skinType: "Dry / Sensitive",
    concerns: ["Flakiness & tight sensation", "Facial redness", "Reactivity to fragrances"],
    hydration: 42,
    barrierScore: 50,
    pigmentationScore: 88,
    sensitivityScore: 82,
    summary: "Impaired stratum corneum barrier function resulting in transepidermal water loss. Prioritize barrier repair and zero fragrance.",
    amRoutine: ["Water Rinse or Cream Cleanser", "Centella Asiatica Soothing Serum", "Rich Ceramide Cream", "Zinc Oxide Sensitive SPF 50"],
    pmRoutine: ["Milk Cleanser", "Squalane & Panthenol Oil", "Multi-Lipid Recovery Balm"],
    warnings: ["Pause all chemical exfoliants (AHA/BHA) until redness subsides"]
  }
];

interface SkinAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkinAnalysisModal({ isOpen, onClose }: SkinAnalysisModalProps) {
  const [step, setStep] = useState<"select" | "scanning" | "results">("select");
  const [selectedProfile, setSelectedProfile] = useState<SampleProfile>(SAMPLE_PROFILES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Initializing facial mapping...");

  useEffect(() => {
    if (step === "scanning") {
      setScanProgress(0);
      const statuses = [
        "Detecting facial landmarks...",
        "Measuring epidermal hydration levels...",
        "Scanning pore congestion and sebum index...",
        "Evaluating vascular redness and melanin density...",
        "Synthesizing customized dermatological score..."
      ];

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setScanProgress((prev) => Math.min(prev + 20, 100));
        if (currentStep < statuses.length) {
          setScanStatus(statuses[currentStep]);
        } else {
          clearInterval(interval);
          setTimeout(() => setStep("results"), 400);
        }
      }, 600);

      return () => clearInterval(interval);
    }
  }, [step]);

  if (!isOpen) return null;

  const handleStartScan = (profile: SampleProfile) => {
    setSelectedProfile(profile);
    setCustomImage(null);
    setStep("scanning");
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
      setSelectedProfile({
        ...SAMPLE_PROFILES[0],
        name: "Custom Upload Analysis",
        image: url,
      });
      setStep("scanning");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(45, 42, 38, 0.55)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl transition-all"
        style={{ background: C.bgCard, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: C.primaryGhost, borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-medium text-base" style={{ color: C.primary }}>
              Lucent AI Skin Diagnostic Engine
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(74,103,65,0.08)]"
            style={{ color: C.textLight }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Switch */}
        <div className="p-6 md:p-8">
          {step === "select" && (
            <div>
              <div className="text-center max-w-xl mx-auto mb-8">
                <Badge className="mb-3 border-0 text-xs px-3 py-1 rounded-full" style={{ background: C.primaryGhost, color: C.primary }}>
                  Instant Facial Telemetry
                </Badge>
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-2" style={{ color: C.primary }}>
                  Select or upload a photo to analyze
                </h3>
                <p className="text-sm" style={{ color: C.textLight }}>
                  Choose a realistic sample skin profile or upload your own selfie to experience Lucent&apos;s AI diagnosis.
                </p>
              </div>

              {/* Sample Profiles Selection Grid */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {SAMPLE_PROFILES.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleStartScan(profile)}
                    className="group cursor-pointer rounded-2xl p-3 border transition-all hover:scale-[1.02] hover:shadow-md flex flex-col items-center text-center"
                    style={{ borderColor: C.border, background: C.bgCard }}
                  >
                    <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3">
                      <img
                        src={profile.image}
                        alt={profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-xs text-white font-medium">{profile.skinType}</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm mb-1" style={{ color: C.text }}>
                      {profile.name}
                    </h4>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: C.textMuted }}>
                      {profile.concerns.join(" · ")}
                    </p>
                    <Button
                      size="sm"
                      className="w-full text-xs font-medium text-white mt-auto"
                      style={{ background: C.primary }}
                    >
                      Scan profile <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Upload Custom Selfie Option */}
              <div
                className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors hover:border-[#6b8c62] hover:bg-[rgba(74,103,65,0.04)] flex flex-col items-center justify-center"
                style={{ borderColor: C.border, background: C.bgWarm }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                    <Upload size={20} style={{ color: C.primary }} />
                  </div>
                  <span className="font-medium text-sm mb-1" style={{ color: C.primary }}>
                    Upload your own photo / selfie
                  </span>
                  <span className="text-xs" style={{ color: C.textMuted }}>
                    PNG, JPG or WEBP up to 10MB. Processed privately in browser.
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === "scanning" && (
            <div className="py-12 text-center flex flex-col items-center">
              {/* Scan Viewfinder Container */}
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden mb-6 shadow-xl border-4" style={{ borderColor: C.primaryLight }}>
                <img
                  src={customImage || selectedProfile.image}
                  alt="Scanning photo"
                  className="w-full h-full object-cover filter contrast-105"
                />
                {/* Laser scan line */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#6b8c62] to-transparent shadow-[0_0_15px_rgba(74,103,65,0.6)] animate-scan" />

                {/* Facial Grid Landmarks overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-[rgba(74,103,65,0.3)] m-6 rounded-full pointer-events-none animate-pulse" />
                <div className="absolute top-1/3 left-1/3 w-3 h-3 border-l-2 border-t-2" style={{ borderColor: C.primary }} />
                <div className="absolute top-1/3 right-1/3 w-3 h-3 border-r-2 border-t-2" style={{ borderColor: C.primary }} />
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-4 h-4 border-b-2" style={{ borderColor: C.primary }} />
              </div>

              {/* Progress Text & Telemetry */}
              <h4 className="text-lg font-medium mb-2" style={{ color: C.primary }}>
                {scanStatus}
              </h4>

              <div className="w-full max-w-xs rounded-full h-2 overflow-hidden mb-4" style={{ background: C.border }}>
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})` }}
                />
              </div>

              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: C.textMuted }}>
                Lucent Vision Engine v2.4 · {scanProgress}% complete
              </span>
            </div>
          )}

          {step === "results" && (
            <div>
              {/* Results Top Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b" style={{ borderColor: C.borderLight }}>
                <div className="flex items-center gap-3">
                  <img
                    src={customImage || selectedProfile.image}
                    alt={selectedProfile.name}
                    className="w-14 h-14 rounded-2xl object-cover border"
                    style={{ borderColor: C.border }}
                  />
                  <div>
                    <Badge className="border-0 text-xs px-2.5 py-0.5 rounded-full mb-1" style={{ background: C.primaryGhost, color: C.primary }}>
                      Diagnostic Report
                    </Badge>
                    <h3 className="text-xl font-medium" style={{ color: C.text }}>
                      {selectedProfile.name}
                    </h3>
                    <p className="text-xs" style={{ color: C.textLight }}>
                      Skin Type: <span className="font-medium" style={{ color: C.primary }}>{selectedProfile.skinType}</span>
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: C.border, color: C.primary }}
                  onClick={() => setStep("select")}
                >
                  <RefreshCw size={12} className="mr-1.5" /> Re-scan another photo
                </Button>
              </div>

              {/* Skin Score Breakdown Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Hydration", val: selectedProfile.hydration, icon: Droplets, color: "#5b8a72" },
                  { label: "Barrier Integrity", val: selectedProfile.barrierScore, icon: ShieldCheck, color: C.primary },
                  { label: "Pigmentation Clarity", val: selectedProfile.pigmentationScore, icon: Sun, color: C.accent },
                  { label: "Calmness Index", val: 100 - selectedProfile.sensitivityScore, icon: Sparkles, color: "#7a9a6f" },
                ].map((metric) => (
                  <div key={metric.label} className="p-3.5 rounded-2xl text-center border" style={{ background: C.bg, borderColor: C.borderLight }}>
                    <div className="flex items-center justify-center gap-1 text-xs mb-1 font-medium" style={{ color: C.textLight }}>
                      <metric.icon size={13} style={{ color: metric.color }} />
                      {metric.label}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: C.text }}>
                      {metric.val}<span className="text-xs font-normal">%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ background: C.borderLight }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${metric.val}%`, background: `linear-gradient(90deg, ${metric.color}, ${metric.color}cc)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Clinical Summary */}
              <div className="p-4 rounded-2xl mb-6 border text-xs sm:text-sm leading-relaxed" style={{ background: C.bg, borderColor: C.borderLight }}>
                <p className="font-medium mb-1" style={{ color: C.primary }}>
                  Dermatological AI Analysis
                </p>
                <p style={{ color: C.textLight }}>{selectedProfile.summary}</p>
              </div>

              {/* Recommended Routine AM / PM */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* AM */}
                <div className="p-4 rounded-2xl border" style={{ background: C.bgCard, borderColor: C.border }}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.borderLight }}>
                    <Sun size={16} style={{ color: C.accent }} />
                    <span className="font-medium text-sm" style={{ color: C.text }}>
                      Morning Routine (AM)
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {selectedProfile.amRoutine.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: C.textLight }}>
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: C.primary }} />
                        <span>Step {idx + 1}: {item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* PM */}
                <div className="p-4 rounded-2xl border" style={{ background: C.bgCard, borderColor: C.border }}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.borderLight }}>
                    <Moon size={16} style={{ color: C.primaryDark }} />
                    <span className="font-medium text-sm" style={{ color: C.text }}>
                      Evening Routine (PM)
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {selectedProfile.pmRoutine.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: C.textLight }}>
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: C.primary }} />
                        <span>Step {idx + 1}: {item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Safety Warnings & Flags */}
              {selectedProfile.warnings.length > 0 && (
                <div className="p-4 rounded-2xl border mb-6" style={{ background: "#fdf6e3", borderColor: "#e8d5a3" }}>
                  <div className="flex items-center gap-2 font-medium text-xs mb-2" style={{ color: "#8b6914" }}>
                    <AlertTriangle size={14} />
                    Ingredient Interaction Cautions
                  </div>
                  <ul className="space-y-1">
                    {selectedProfile.warnings.map((warn, i) => (
                      <li key={i} className="text-xs" style={{ color: "#8b6914" }}>
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom Action */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={onClose} style={{ borderColor: C.border, color: C.textLight }}>
                  Close
                </Button>
                <Button size="sm" className="text-white font-medium" style={{ background: C.primary }} onClick={onClose}>
                  Save to My Routine
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
