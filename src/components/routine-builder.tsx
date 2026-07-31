"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldAlert, Sparkles, Check, Sun, Moon, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  successBg: "#BBF7D0",
  warnFg: "#78350F",
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

  // Analyze routine conflicts and synergies
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
    <div className="w-full rounded-3xl p-6 sm:p-8 border shadow-sm" style={{ background: "#fff", borderColor: C.petal }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="border-0 text-xs px-3 py-1 rounded-full font-medium" style={{ background: C.petal, color: C.primary }}>
              <Sparkles size={12} className="mr-1 inline" /> Interactive Tool
            </Badge>
          </div>
          <h3 className="text-2xl font-medium tracking-tight" style={{ color: C.primary }}>
            Interactive Routine Builder & Ingredient Audit
          </h3>
          <p className="text-sm" style={{ color: C.smoke }}>
            Click products to add or remove from your daily routine. Lucent continuously audits ingredient interactions in real-time.
          </p>
        </div>

        {/* AM / PM Toggle */}
        <div className="flex items-center p-1 rounded-2xl border self-start md:self-auto" style={{ background: C.mist, borderColor: C.petal }}>
          <button
            onClick={() => setActiveTab("AM")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "AM" ? "shadow-sm text-white" : ""
            }`}
            style={{
              background: activeTab === "AM" ? C.primary : "transparent",
              color: activeTab === "AM" ? "#fff" : C.smoke,
            }}
          >
            <Sun size={14} className={activeTab === "AM" ? "text-amber-300" : ""} /> AM Routine
          </button>
          <button
            onClick={() => setActiveTab("PM")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "PM" ? "shadow-sm text-white" : ""
            }`}
            style={{
              background: activeTab === "PM" ? C.primary : "transparent",
              color: activeTab === "PM" ? "#fff" : C.smoke,
            }}
          >
            <Moon size={14} className={activeTab === "PM" ? "text-purple-300" : ""} /> PM Routine
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Product Selection Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: C.primary }}>
            Available Products & Actives
          </h4>

          <div className="grid sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {AVAILABLE_PRODUCTS.map((prod) => {
              const isSelected = selectedProductIds.includes(prod.id);
              return (
                <div
                  key={prod.id}
                  onClick={() => toggleProduct(prod.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected ? "ring-2 shadow-sm" : "hover:border-pink-300"
                  }`}
                  style={{
                    borderColor: isSelected ? C.active : C.petal,
                    background: isSelected ? C.mist : "#fff",
                    boxShadow: isSelected ? `0 0 0 2px ${C.blush}` : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: C.petal, color: C.primary }}>
                        {prod.category}
                      </span>
                      <h5 className="font-medium text-xs mt-1.5" style={{ color: C.ink }}>
                        {prod.name}
                      </h5>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                        isSelected ? "text-white" : "border"
                      }`}
                      style={{
                        background: isSelected ? C.primary : "#fff",
                        borderColor: C.petal,
                      }}
                    >
                      {isSelected ? <Check size={12} /> : <Plus size={12} style={{ color: C.smoke }} />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t" style={{ borderColor: "rgba(251,207,232,0.4)", color: C.smoke }}>
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
          <Card className="border overflow-hidden" style={{ borderColor: C.petal, background: C.mist }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: C.primary }}>
                  Routine Balance Index
                </span>
                <span className="text-2xl font-bold" style={{ color: synergyScore > 75 ? C.successFg : C.active }}>
                  {synergyScore}<span className="text-xs font-normal">/100</span>
                </span>
              </div>

              <div className="w-full bg-pink-200/70 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${synergyScore}%`,
                    background: synergyScore > 75 ? "#059669" : synergyScore > 50 ? "#D97706" : C.active,
                  }}
                />
              </div>

              <div className="text-xs" style={{ color: C.smoke }}>
                {conflicts.length === 0 ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check size={14} /> Outstanding synergy! No ingredient conflicts detected.
                  </span>
                ) : (
                  <span className="text-amber-800 font-medium flex items-center gap-1">
                    <ShieldAlert size={14} /> {conflicts.length} safety alert{conflicts.length > 1 ? "s" : ""} require attention.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Conflict Flags */}
          {conflicts.length > 0 && (
            <div className="p-4 rounded-2xl border space-y-2" style={{ background: C.warnBg, borderColor: "#FDE68A" }}>
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
          <div className="p-4 rounded-2xl border flex-1" style={{ background: "#fff", borderColor: C.petal }}>
            <h5 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: C.primary }}>
              Active {activeTab} Routine Steps ({selectedProducts.length})
            </h5>

            {selectedProducts.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: C.smoke }}>
                No products selected yet. Click products on the left catalog to build your routine.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {selectedProducts.map((prod, index) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                    style={{ background: C.mist, borderColor: C.petal }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-medium text-[10px] shrink-0" style={{ background: C.petal, color: C.primary }}>
                        {index + 1}
                      </span>
                      <span className="font-medium truncate" style={{ color: C.ink }}>
                        {prod.name}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleProduct(prod.id)}
                      className="text-pink-600 hover:text-pink-800 p-1 transition-colors"
                      title="Remove product"
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
