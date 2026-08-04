"use client";

import { useState } from "react";
import { Check, Flame, Sun, Moon, Sparkles, Trophy } from "lucide-react";
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

interface ChecklistItem {
  id: string;
  label: string;
  time: "AM" | "PM";
  completed: boolean;
}

export function DailyChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: "1", label: "Gentle Cleanser", time: "AM", completed: true },
    { id: "2", label: "Vitamin C Serum", time: "AM", completed: true },
    { id: "3", label: "Hydrating Moisturizer", time: "AM", completed: true },
    { id: "4", label: "Broad Spectrum Sunscreen SPF 50", time: "AM", completed: true },
    { id: "5", label: "Oil Cleanser (Double Cleanse)", time: "PM", completed: false },
    { id: "6", label: "Encapsulated Retinol (2x/week)", time: "PM", completed: false },
    { id: "7", label: "Ceramide Barrier Night Cream", time: "PM", completed: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="w-full glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="animate-fade-in-up stagger-1" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="border-0 text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: C.primaryGhost, color: C.primary }}>
              <Flame size={12} className="mr-1 inline" style={{ color: C.accent }} /> Live Skincare Companion
            </Badge>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: C.primary }}>
            Today&apos;s Skincare Checklist
          </h3>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto animate-fade-in-up stagger-2" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold animate-glow-pulse"
            style={{ background: C.primaryGhost, borderColor: C.border, color: C.primary }}
          >
            <Flame size={14} style={{ color: C.accent }} /> 7-Day Streak
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: C.successBg, border: `1px solid ${C.successFg}20`, color: C.successFg }}
          >
            <Trophy size={14} /> {progressPercent}% Done
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full rounded-full h-2.5 overflow-hidden mb-6" style={{ background: C.primaryGhost }}>
        <div
          className="h-full transition-all duration-700 ease-out rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
          }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* AM */}
        <div className="glass-card p-4 rounded-2xl border animate-fade-in-up stagger-3" style={{ borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.border }}>
            <Sun size={16} className="text-amber-500" />
            <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: C.primary }}>
              Morning Steps
            </span>
          </div>
          <div className="space-y-2">
            {items.filter(i => i.time === "AM").map((item, idx) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover-lift"
                style={{
                  borderColor: C.border,
                  background: item.completed ? C.primaryGhost : "#fff",
                  opacity: item.completed ? 0.7 : 1,
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: C.text,
                    textDecoration: item.completed ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs transition-all duration-300"
                  style={{
                    background: item.completed ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : "#fff",
                    border: item.completed ? "none" : `1px solid ${C.border}`,
                    color: item.completed ? "#fff" : "transparent",
                    transform: item.completed ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {item.completed && <Check size={12} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PM */}
        <div className="glass-card p-4 rounded-2xl border animate-fade-in-up stagger-4" style={{ borderColor: C.border, opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.border }}>
            <Moon size={16} className="text-purple-600" />
            <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: C.primary }}>
              Evening Steps
            </span>
          </div>
          <div className="space-y-2">
            {items.filter(i => i.time === "PM").map((item, idx) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover-lift"
                style={{
                  borderColor: C.border,
                  background: item.completed ? C.primaryGhost : "#fff",
                  opacity: item.completed ? 0.7 : 1,
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: C.text,
                    textDecoration: item.completed ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs transition-all duration-300"
                  style={{
                    background: item.completed ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : "#fff",
                    border: item.completed ? "none" : `1px solid ${C.border}`,
                    color: item.completed ? "#fff" : "transparent",
                    transform: item.completed ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {item.completed && <Check size={12} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
