"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
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
  warnFg: "#78350F",
  warnBg: "#FEF3C7",
};

interface ConcernDetail {
  title: string;
  description: string;
  heroActives: { name: string; description: string; scienceRating: string }[];
  amTip: string;
  pmTip: string;
  avoid: string[];
}

const CONCERNS_DATA: Record<string, ConcernDetail> = {
  "Acne & breakouts": {
    title: "Acne & Active Breakouts",
    description: "Target follicle clogging, excess sebum secretion, and Cutibacterium acnes colonization while maintaining skin barrier integrity.",
    heroActives: [
      { name: "Salicylic Acid (BHA 2%)", description: "Lipophilic acid that penetrates inside pores to dissolve sebum plugs.", scienceRating: "Level A Clinical Evidence" },
      { name: "Azelaic Acid (10-15%)", description: "Anti-inflammatory & antimicrobial agent that targets inflammatory redness and post-acne marks.", scienceRating: "Gold Standard" },
      { name: "Adapalene / Retinoid", description: "Normalizes keratinization to prevent microcomedone formation.", scienceRating: "Dermatologist #1 Choice" },
    ],
    amTip: "Gentle non-stripping cleanser + Salicylic Acid + Light Oil-Free Moisturizer + SPF 50",
    pmTip: "Double cleanse + Azelaic Acid or Retinoid + Ceramide Barrier Cream",
    avoid: ["Comedogenic oils (Coconut oil, Isopropyl myristate)", "Harsh physical facial scrubs"],
  },
  "Hyperpigmentation": {
    title: "Sunspots & Hyperpigmentation",
    description: "Inhibit tyrosinase enzyme activity and accelerate epidermal cell turnover to fade dark spots, melasma, and post-inflammatory marks.",
    heroActives: [
      { name: "L-Ascorbic Acid (Vitamin C)", description: "Potent antioxidant that suppresses melanin synthesis and neutralizes UV free radicals.", scienceRating: "Level A Clinical Evidence" },
      { name: "Tranexamic Acid (3-5%)", description: "Blocks plasmin-induced melanocyte stimulation for stubborn dark patches.", scienceRating: "Breakthrough Active" },
      { name: "Niacinamide (4-5%)", description: "Inhibits melanosome transfer from melanocytes to keratinocytes.", scienceRating: "Multi-benefit Standard" },
    ],
    amTip: "Vitamin C Serum + Niacinamide Moisturizer + High UVA/UVB Broad Spectrum Sunscreen",
    pmTip: "Tranexamic Acid + Retinol / AHA + Soothing Moisture Seal",
    avoid: ["Unprotected sun exposure", "Picking at blemishes or skin peeling"],
  },
  "Fine lines": {
    title: "Fine Lines & Collagen Loss",
    description: "Stimulate dermal collagen production, improve elastic fiber density, and deeply hydrate to plump fine lines and expression creases.",
    heroActives: [
      { name: "Encapsulated Retinol / Tretinoin", description: "Triggers cell turnover and boosts type I & III collagen synthesis.", scienceRating: "Gold Standard" },
      { name: "Copper Tripeptide-1", description: "Signals dermal tissue repair and increases glycosaminoglycan synthesis.", scienceRating: "Advanced Peptide" },
      { name: "Multi-Molecular Hyaluronic Acid", description: "Plumps superficial surface lines with multi-depth hydration.", scienceRating: "Hydration Standard" },
    ],
    amTip: "Hydrating Essence + Vitamin C + Peptide Complex + Moisturizer + Sunscreen",
    pmTip: "Gentle Cleanser + Retinoid + Rich Lipid Barrier Balm",
    avoid: ["Over-exfoliating with strong acids", "Tanning beds"],
  },
  "Dryness": {
    title: "Dryness & Transepidermal Water Loss",
    description: "Replenish essential stratum corneum lipids (ceramides, fatty acids, cholesterol) to seal moisture and prevent tightness.",
    heroActives: [
      { name: "Ceramides NP, AP, EOP", description: "Rebuilds the intercellular lipid matrix to prevent moisture leakage.", scienceRating: "Essential Lipid" },
      { name: "Squalane", description: "Skin-identical emollient that restores elasticity without clogging pores.", scienceRating: "Biocompatible Oil" },
      { name: "Panthenol (Vitamin B5)", description: "Attracts water and calms irritated epidermal layers.", scienceRating: "Soothing Standard" },
    ],
    amTip: "Hydrating Milk Cleanser + Panthenol Serum + Ceramide Cream + Mineral SPF",
    pmTip: "Oil Cleanser + Cream Cleanser + Squalane Oil + Occlusive Barrier Balm",
    avoid: ["Alcohol-denat toners", "Foaming cleansers with SLS"],
  },
  "Redness": {
    title: "Facial Redness & Rosacea Tendency",
    description: "Soothe hyper-reactive cutaneous vasculature and strengthen delicate capillary walls using calm, anti-inflammatory bio-actives.",
    heroActives: [
      { name: "Centella Asiatica (Madecassoside)", description: "Decreases cutaneous redness and speeds skin barrier recovery.", scienceRating: "Clinical Soother" },
      { name: "Colloidal Oatmeal", description: "Protects damaged skin and calms itchiness and flare-ups.", scienceRating: "FDA Approved Skin Protectant" },
      { name: "Ectoin", description: "Extremophilic molecule that shields cellular membranes from stress.", scienceRating: "Next-Gen Bioactive" },
    ],
    amTip: "Water Rinse + Centella Serum + Soothing Barrier Moisturizer + Mineral Zinc SPF 50",
    pmTip: "Gentle Cleansing Milk + Ectoin / Panthenol Serum + Calming Overnight Mask",
    avoid: ["Synthetic fragrances", "Essential oils (Eucalyptus, Peppermint, Citrus)"],
  },
  "Uneven texture": {
    title: "Uneven Texture & Dullness",
    description: "Dissolve intercellular desmosome glue between dead skin cells to reveal smoother, light-reflecting skin.",
    heroActives: [
      { name: "Glycolic Acid (AHA)", description: "Smallest AHA molecule that effectively exfoliates dull surface skin.", scienceRating: "High Efficacy" },
      { name: "Lactic Acid", description: "Gentler AHA that exfoliates while simultaneously boosting skin hydration.", scienceRating: "Hydrating Exfoliant" },
      { name: "PHAs (Gluconolactone)", description: "Ultra-gentle large-molecule acid suitable for sensitive skin texture renewal.", scienceRating: "Gentle Exfoliant" },
    ],
    amTip: "Gentle Cleanser + Niacinamide + Sunscreen",
    pmTip: "AHA/PHA Exfoliating Solution (2-3x weekly) + Barrier Repair Cream",
    avoid: ["Physical scrub pads or walnuts", "Combining multiple strong exfoliants"],
  },
  "Dark circles": {
    title: "Periorbital Dark Circles & Puffiness",
    description: "Improve microcirculation under thin eye skin and address vascular pooling, pigmentation, or structural shadowing.",
    heroActives: [
      { name: "Caffeine 5% + EGCG", description: "Constricts superficial capillaries to reduce puffiness and fluid buildup.", scienceRating: "Microcirculation Active" },
      { name: "Vitamin K Oxide", description: "Helps clear extravasated blood pigments under delicate periorbital tissue.", scienceRating: "Targeted Eye Active" },
      { name: "Matrixyl 3000 Peptides", description: "Thickens thin under-eye dermis to reduce visibility of underlying veins.", scienceRating: "Peptide Standard" },
    ],
    amTip: "Caffeine Eye Serum + Gentle Moisturizer + Sunscreen",
    pmTip: "Peptide Eye Cream + Gentle Retinoid Eye Balm (if tolerated)",
    avoid: ["Rubbing eyes aggressively", "High sodium diet before bedtime"],
  },
  "Sensitivity": {
    title: "Sensitive & Reactive Skin",
    description: "Minimize potential allergens and fortify the acid mantle to build skin resilience against environmental triggers.",
    heroActives: [
      { name: "Allantoin", description: "Promotes skin healing and counteracts irritation.", scienceRating: "Hypoallergenic Soother" },
      { name: "Beta-Glucan", description: "20% more hydrating than Hyaluronic Acid with deep soothing properties.", scienceRating: "Barrier Fortifier" },
      { name: "Bifida Ferment Lysate", description: "Supports microflora microbiome balance for compromised skin.", scienceRating: "Probiotic Active" },
    ],
    amTip: "Gentle Rinse + Beta-Glucan Serum + Minimalist Cream + Mineral Sunscreen",
    pmTip: "Cream Cleanser + Bifida Ferment + Ceramide Ointment",
    avoid: ["Essential oils", "High-percentage pure Vitamin C", "Artificial colorants"],
  }
};

const CONCERN_KEYS = [
  "Acne & breakouts",
  "Hyperpigmentation",
  "Fine lines",
  "Dryness",
  "Redness",
  "Uneven texture",
  "Dark circles",
  "Sensitivity",
];

export function ConcernsMatrix() {
  const [selectedConcern, setSelectedConcern] = useState<string>("Acne & breakouts");
  const detail = CONCERNS_DATA[selectedConcern] || CONCERNS_DATA["Acne & breakouts"];

  return (
    <div className="w-full rounded-3xl p-6 sm:p-8 border" style={{ background: "#fff", borderColor: C.petal }}>
      <div className="text-center max-w-xl mx-auto mb-8">
        <Badge className="mb-2 border-0 text-xs px-3 py-1 rounded-full font-medium" style={{ background: C.petal, color: C.primary }}>
          Clinical Ingredient Explorer
        </Badge>
        <h3 className="text-2xl sm:text-3xl font-medium tracking-tight mb-2" style={{ color: C.primary }}>
          Select a skin concern to reveal the science
        </h3>
        <p className="text-sm" style={{ color: C.smoke }}>
          Click any concern chip below to see dermatologically proven active ingredients, routine advice, and ingredients to avoid.
        </p>
      </div>

      {/* Interactive Concern Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {CONCERN_KEYS.map((concern) => {
          const isActive = selectedConcern === concern;
          return (
            <button
              key={concern}
              onClick={() => setSelectedConcern(concern)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive ? "shadow-md scale-105" : "hover:bg-pink-100"
              }`}
              style={{
                background: isActive ? C.primary : C.mist,
                color: isActive ? "#fff" : C.primary,
                border: `1px solid ${isActive ? C.primary : C.petal}`,
              }}
            >
              {concern}
            </button>
          );
        })}
      </div>

      {/* Selected Concern Deep-Dive Panel */}
      <div className="grid lg:grid-cols-12 gap-6 p-6 rounded-2xl border" style={{ background: C.mist, borderColor: C.petal }}>
        {/* Left Column: Hero Actives (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700">Targeted Protocol</span>
            <h4 className="text-xl font-medium mt-0.5" style={{ color: C.primary }}>
              {detail.title}
            </h4>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: C.smoke }}>
              {detail.description}
            </p>
          </div>

          <h5 className="text-xs font-medium uppercase tracking-wider pt-2" style={{ color: C.primary }}>
            🔬 Science-Backed Key Actives:
          </h5>

          <div className="space-y-3">
            {detail.heroActives.map((active, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border" style={{ background: "#fff", borderColor: C.petal }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-xs text-pink-950 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-pink-600" />
                    {active.name}
                  </span>
                  <Badge className="border-0 text-[10px] px-2 py-0.5 rounded-md" style={{ background: C.petal, color: C.primary }}>
                    {active.scienceRating}
                  </Badge>
                </div>
                <p className="text-xs" style={{ color: C.smoke }}>
                  {active.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Routine Strategy & Avoid List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="border" style={{ borderColor: C.petal, background: "#fff" }}>
            <CardContent className="p-4 space-y-3 text-xs">
              <span className="font-medium uppercase tracking-wider text-[11px] block" style={{ color: C.primary }}>
                ☀️ AM Routine Strategy
              </span>
              <p style={{ color: C.smoke }}>{detail.amTip}</p>

              <div className="border-t pt-3" style={{ borderColor: C.petal }}>
                <span className="font-medium uppercase tracking-wider text-[11px] block" style={{ color: C.primary }}>
                  🌙 PM Routine Strategy
                </span>
                <p style={{ color: C.smoke }}>{detail.pmTip}</p>
              </div>
            </CardContent>
          </Card>

          {/* Avoid List */}
          <div className="p-4 rounded-2xl border text-xs" style={{ background: C.warnBg, borderColor: "#FDE68A" }}>
            <span className="font-medium flex items-center gap-1.5 mb-2" style={{ color: C.warnFg }}>
              <AlertTriangle size={14} /> Ingredients & Practices to Avoid:
            </span>
            <ul className="space-y-1">
              {detail.avoid.map((item, i) => (
                <li key={i} style={{ color: C.warnFg }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
