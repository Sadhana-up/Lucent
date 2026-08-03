"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldAlert, Sparkles, Check, Sun, Moon, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  warnFg: "#78350f",
  warnBg: "#FEF3C7",
};

interface ProductItem {
  id: string;
  name: string;
  category: string;
  activeIngredient: string;
  ph: number;
  timeOfDay: "AM" | "PM" | "BOTH";
}

const AVAILABLE_PRODUCTS: ProductItem[] = [
  { id: "cleanser-1", name: "Gentle Amino Acid Cleanser", category: "Cleanser", activeIngredient: "Amino Acids, Glycerin", ph: 5.5, timeOfDay: "BOTH" },
  { id: "cleanser-2", name: "2% Salicylic Cleansing Gel", category: "Cleanser", activeIngredient: "Salicylic Acid (BHA)", ph: 4.0, timeOfDay: "BOTH" },
  { id: "active-1", name: "15% Pure Vitamin C Serum", category: "Active Serum", activeIngredient: "L-Ascorbic Acid", ph: 3.2, timeOfDay: "AM" },
  { id: "active-2", name: "10% Niacinamide + Zinc", category: "Active Serum", activeIngredient: "Niacinamide", ph: 6.0, timeOfDay: "BOTH" },
  { id: "active-3", name: "0.5% Encapsulated Retinol", category: "Active Serum", activeIngredient: "Retinol", ph: 5.5, timeOfDay: "PM" },
  { id: "active-4", name: "7% Glycolic Acid Toning Solution", category: "Exfoliant", activeIngredient: "Glycolic Acid (AHA)", ph: 3.6, timeOfDay: "PM" },
  { id: "moisturizer-1", name: "Multi-Ceramide Barrier Cream", category: "Moisturizer", activeIngredient: "Ceramides, Cholesterol", ph: 5.8, timeOfDay: "BOTH" },
  { id: "moisturizer-2", name: "Hyaluronic Acid Water Gel", category: "Moisturizer", activeIngredient: "Hyaluronic Acid, Squalane", ph: 6.2, timeOfDay: "BOTH" },
  { id: "sunscreen-1", name: "Invisible Fluid Sunscreen SPF 50+", category: "Sunscreen", activeIngredient: "Tinosorb S, Uvinul A Plus", ph: 6.5, timeOfDay: "AM" },
];

export function RoutineBuilder() {
  const [activeTab, setActiveTab] = useState<"AM" | "PM">("AM");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    "cleanser-1",
    "active-1",
    "active-2",
    "moisturizer-2",
    "sunscreen-1"
  ]);

  const selectedProducts = AVAILABLE_PRODUCTS.filter(p => selectedProductIds.includes(p.id));

  const hasRetinol = selectedProducts.some(p => p.activeIngredient.includes("Retinol"));
  const hasAHA = selectedProducts.some(p => p.activeIngredient.includes("AHA") || p.activeIngredient.includes("Glycolic"));
  const hasBHA = selectedProducts.some(p => p.activeIngredient.includes("BHA") || p.activeIngredient.includes("Salicylic"));
  const hasVitC = selectedProducts.some(p => p.activeIngredient.includes("L-Ascorbic Acid"));
  const hasSunscreen = selectedProducts.some(p => p.category === "Sunscreen");

  const conflicts: string[] = [];
  if (activeTab === "AM" && hasRetinol) {
    conflicts.push("Retinol degrades in sunlight and increases UV sensitivity. Move Retinol to your PM routine.");
  }
  if (hasRetinol && (hasAHA || hasBHA)) {
    conflicts.push("Combining Retinol with direct acids (AHA/BHA) increases risk of micro-tears and barrier collapse.");
  }
  if (hasVitC && (hasAHA || hasBHA)) {
    conflicts.push("Layering Vitamin C with strong exfoliating acids (AHA/BHA) may cause stinging and pH imbalance.");
  }
  if (activeTab === "AM" && !hasSunscreen) {
    conflicts.push("Missing Sunscreen in Morning Routine! UV protection is essential when using active skincare.");
  }

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const calculateSynergyScore = () => {
    let score = 85;
    score -= conflicts.length * 15;
    if (selectedProducts.length === 0) return 0;
    return Math.max(10, Math.min(100, score));
  };

  const synergyScore = calculateSynergyScore();

  return (
    <div className="w-full glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="animate-fade-in-up stagger-1" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="border-0 text-xs px-3 py-1 rounded-full font-medium" style={{ background: C.primaryGhost, color: C.primary }}>
              <Sparkles size={12} className="mr-1 inline" /> Interactive Tool
            </Badge>
          </div>
          <h3 className="text-2xl font-medium tracking-tight" style={{ color: C.primary }}>
            Interactive Routine Builder & Ingredient Audit
          </h3>
          <p className="text-sm" style={{ color: C.textLight }}>
            Click products to add or remove from your daily routine. Lucent continuously audits ingredient interactions in real-time.
          </p>
        </div>

        {/* AM / PM Toggle */}
        <div className="flex items-center p-1 rounded-2xl border self-start md:self-auto animate-fade-in-up stagger-2" style={{ background: C.primaryGhost, borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
          <button
            onClick={() => setActiveTab("AM")}
            className="magnetic-btn flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: activeTab === "AM" ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : "transparent",
              color: activeTab === "AM" ? "#fff" : C.textLight,
            }}
          >
            <Sun size={14} className={activeTab === "AM" ? "text-amber-300" : ""} /> AM Routine
          </button>
          <button
            onClick={() => setActiveTab("PM")}
            className="magnetic-btn flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: activeTab === "PM" ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : "transparent",
              color: activeTab === "PM" ? "#fff" : C.textLight,
            }}
          >
            <Moon size={14} className={activeTab === "PM" ? "text-purple-300" : ""} /> PM Routine
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Product Selection Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-sm font-medium uppercase tracking-wider mb-2 animate-fade-in-up stagger-3" style={{ color: C.primary, opacity: 0, animationFillMode: "forwards" }}>
            Available Products & Actives
          </h4>

          <div className="grid sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {AVAILABLE_PRODUCTS.map((prod, idx) => {
              const isSelected = selectedProductIds.includes(prod.id);
              return (
                <div
                  key={prod.id}
                  onClick={() => toggleProduct(prod.id)}
                  className={`glass-card hover-lift p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between animate-fade-in-up ${
                    isSelected ? "ring-2" : ""
                  }`}
                  style={{
                    borderColor: isSelected ? C.primary : C.border,
                    background: isSelected ? C.primaryGhost : undefined,
                    boxShadow: isSelected ? `0 0 0 2px ${C.primaryGlow}` : undefined,
                    opacity: 0,
                    animationFillMode: "forwards",
                    animationDelay: `${0.35 + idx * 0.04}s`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: C.primaryGhost, color: C.primary }}>
                        {prod.category}
                      </span>
                      <h5 className="font-medium text-xs mt-1.5" style={{ color: C.text }}>
                        {prod.name}
                      </h5>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300 ${
                        isSelected ? "text-white scale-110" : "border"
                      }`}
                      style={{
                        background: isSelected ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : "#fff",
                        borderColor: C.border,
                      }}
                    >
                      {isSelected ? <Check size={12} /> : <Plus size={12} style={{ color: C.textMuted }} />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t" style={{ borderColor: C.borderLight, color: C.textLight }}>
                    <span className="truncate max-w-[140px]">Active: {prod.activeIngredient}</span>
                    <span className="font-mono text-[10px]">pH {prod.ph}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Routine Audit Dashboard (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Synergy Score & Status */}
          <Card className="glass-card border overflow-hidden animate-fade-in-up stagger-4" style={{ borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: C.primary }}>
                  Routine Balance Index
                </span>
                <span className="text-2xl font-bold" style={{ color: synergyScore > 75 ? C.successFg : C.primary }}>
                  {synergyScore}<span className="text-xs font-normal">/100</span>
                </span>
              </div>

              <div className="w-full rounded-full h-2 overflow-hidden mb-3" style={{ background: C.primaryGhost }}>
                <div
                  className="h-full transition-all duration-700 ease-out rounded-full"
                  style={{
                    width: `${synergyScore}%`,
                    background: synergyScore > 75
                      ? `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`
                      : synergyScore > 50
                        ? "#D97706"
                        : "#DC2626",
                  }}
                />
              </div>

              <div className="text-xs" style={{ color: C.textLight }}>
                {conflicts.length === 0 ? (
                  <span className="font-medium flex items-center gap-1" style={{ color: C.successFg }}>
                    <Check size={14} /> Outstanding synergy! No ingredient conflicts detected.
                  </span>
                ) : (
                  <span className="font-medium flex items-center gap-1" style={{ color: C.warnFg }}>
                    <ShieldAlert size={14} /> {conflicts.length} safety alert{conflicts.length > 1 ? "s" : ""} require attention.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Conflict Flags */}
          {conflicts.length > 0 && (
            <div className="p-4 rounded-2xl border space-y-2 animate-fade-in-up" style={{ background: C.warnBg, borderColor: "#FDE68A" }}>
              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: C.warnFg }}>
                <ShieldAlert size={14} /> Dermatological Warnings:
              </span>
              <ul className="space-y-1.5">
                {conflicts.map((conf, idx) => (
                  <li key={idx} className="text-xs leading-tight" style={{ color: C.warnFg }}>
                    • {conf}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Active Steps List */}
          <div className="glass-card p-4 rounded-2xl border flex-1 animate-fade-in-up stagger-5" style={{ borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
            <h5 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: C.primary }}>
              Active {activeTab} Routine Steps ({selectedProducts.length})
            </h5>

            {selectedProducts.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: C.textMuted }}>
                No products selected yet. Click products on the left catalog to build your routine.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {selectedProducts.map((prod, index) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border text-xs animate-fade-in-up"
                    style={{
                      background: C.primaryGhost,
                      borderColor: C.border,
                      opacity: 0,
                      animationFillMode: "forwards",
                      animationDelay: `${0.4 + index * 0.05}s`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center font-medium text-[10px] shrink-0"
                        style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff" }}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium truncate" style={{ color: C.text }}>
                        {prod.name}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleProduct(prod.id)}
                      className="magnetic-btn p-1 transition-colors rounded-md"
                      style={{ color: C.textMuted }}
                      title="Remove product"
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
