"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight, Check, Sparkles, Shield, Heart } from "lucide-react";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  primaryGlow: "rgba(45, 90, 61, 0.12)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
};

const SKIN_TYPES = [
  { id: "oily", label: "Oily", desc: "Excess shine throughout the day, enlarged pores" },
  { id: "dry", label: "Dry", desc: "Feels tight, flaky patches, needs deep hydration" },
  { id: "combination", label: "Combination", desc: "Oily T-zone (forehead, nose, chin) & dry cheeks" },
  { id: "sensitive", label: "Sensitive", desc: "Easily irritated, prone to redness or stinging" },
  { id: "normal", label: "Normal", desc: "Well-balanced, rarely breaks out or feels tight" },
  { id: "unknown", label: "I'm not sure yet", desc: "We'll help you figure it out during your journey" },
];

const SKIN_CONCERNS = [
  "Acne & Breakouts",
  "Hyperpigmentation & Dark Spots",
  "Dryness & Dehydration",
  "Fine Lines & Wrinkles",
  "Redness & Sensitivity",
  "Enlarged Pores",
  "Uneven Texture",
  "Dullness & Lack of Glow",
];

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleFinish = async (skip: boolean = false) => {
    setSaving(true);
    try {
      if (!skip) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skinType: selectedType === "unknown" ? "" : selectedType,
            skinConcerns: selectedConcerns.join(", "),
            onboardingCompleted: true,
          }),
        });
      } else {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboardingCompleted: true }),
        });
      }
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setSaving(false);
      router.push("/shop/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-10" style={{ background: C.bg }}>
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg" style={{ color: C.text }}>Lucent</span>
        </div>

        <button
          onClick={() => handleFinish(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: C.textSecondary }}
        >
          Skip for now
        </button>
      </div>

      {/* Main Form Content */}
      <div className="max-w-2xl mx-auto w-full py-12">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: C.primaryGhost, color: C.primary }}>
                Step 1 of 2
              </span>
              <h1 className="text-3xl font-bold tracking-tight mt-2" style={{ color: C.text }}>
                What best describes your skin?
              </h1>
              <p className="text-sm max-w-md mx-auto" style={{ color: C.textSecondary }}>
                This helps our ingredient engine recommend cleansers, serums, and moisturisers tailored for you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {SKIN_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className="p-4 rounded-2xl text-left border transition-all duration-300 hover-lift relative"
                    style={{
                      borderColor: isSelected ? C.primary : C.border,
                      background: isSelected ? C.primaryGhost : C.bgCard,
                      boxShadow: isSelected ? `0 0 0 2px ${C.primary}` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-base" style={{ color: C.text }}>
                        {type.label}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: C.primary }}>
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>
                      {type.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-6">
              <Button
                disabled={!selectedType}
                onClick={() => setStep(2)}
                className="font-semibold rounded-xl px-6 py-5 shadow-sm"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: C.primaryGhost, color: C.primary }}>
                Step 2 of 2
              </span>
              <h1 className="text-3xl font-bold tracking-tight mt-2" style={{ color: C.text }}>
                What are your main skin concerns?
              </h1>
              <p className="text-sm max-w-md mx-auto" style={{ color: C.textSecondary }}>
                Select all that apply. We'll prioritize products and formulations targeting these concerns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {SKIN_CONCERNS.map((concern) => {
                const isSelected = selectedConcerns.includes(concern);
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className="p-3.5 rounded-xl text-left border flex items-center justify-between transition-all duration-200"
                    style={{
                      borderColor: isSelected ? C.primary : C.border,
                      background: isSelected ? C.primaryGhost : C.bgCard,
                      boxShadow: isSelected ? `0 0 0 2px ${C.primary}` : "none",
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: C.text }}>
                      {concern}
                    </span>
                    <div
                      className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                      style={{
                        borderColor: isSelected ? C.primary : C.border,
                        background: isSelected ? C.primary : "transparent",
                      }}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold px-3 py-2 rounded-lg hover:underline"
                style={{ color: C.textSecondary }}
              >
                ← Back
              </button>

              <Button
                disabled={saving}
                onClick={() => handleFinish(false)}
                className="font-semibold rounded-xl px-8 py-5 shadow-sm"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}
              >
                {saving ? "Personalizing your dashboard..." : "Complete Setup →"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Trust Badge */}
      <div className="max-w-2xl mx-auto w-full text-center">
        <p className="text-xs flex items-center justify-center gap-4" style={{ color: C.textMuted }}>
          <span className="flex items-center gap-1.5"><Shield size={13} /> Science-backed formulations</span>
          <span className="flex items-center gap-1.5"><Heart size={13} /> Clean beauty guaranteed</span>
          <span className="flex items-center gap-1.5"><Sparkles size={13} /> Free AI skin analysis</span>
        </p>
      </div>
    </div>
  );
}
