"use client";

import { useState } from "react";
import { Check, Flame, Sun, Moon, Sparkles, Trophy } from "lucide-react";
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
    <div className="w-full rounded-3xl p-6 sm:p-8 border" style={{ background: "#fff", borderColor: C.petal }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="border-0 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: C.petal, color: C.primary }}>
              <Flame size={12} className="mr-1 inline text-orange-500" /> Live Skincare Companion
            </Badge>
          </div>
          <h3 className="text-xl sm:text-2xl font-medium tracking-tight" style={{ color: C.primary }}>
            Today&apos;s Skincare Checklist
          </h3>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold" style={{ background: C.mist, borderColor: C.petal, color: C.primary }}>
            <Flame size={14} className="text-orange-500 fill-orange-500" /> 7-Day Streak
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">
            <Trophy size={14} /> {progressPercent}% Done
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-pink-100 rounded-full h-2.5 overflow-hidden mb-6">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%`, background: C.active }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* AM */}
        <div className="p-4 rounded-2xl border" style={{ background: C.mist, borderColor: C.petal }}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.petal }}>
            <Sun size={16} className="text-amber-500" />
            <span className="font-medium text-xs uppercase tracking-wider" style={{ color: C.primary }}>
              Morning Steps
            </span>
          </div>
          <div className="space-y-2">
            {items.filter(i => i.time === "AM").map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  item.completed ? "bg-pink-100/60 line-through opacity-80" : "bg-white hover:border-pink-300"
                }`}
                style={{ borderColor: C.petal }}
              >
                <span className="text-xs font-medium" style={{ color: C.ink }}>
                  {item.label}
                </span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-colors ${
                    item.completed ? "bg-emerald-600 text-white" : "border bg-white"
                  }`}
                  style={{ borderColor: C.petal }}
                >
                  {item.completed && <Check size={12} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PM */}
        <div className="p-4 rounded-2xl border" style={{ background: C.mist, borderColor: C.petal }}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: C.petal }}>
            <Moon size={16} className="text-purple-600" />
            <span className="font-medium text-xs uppercase tracking-wider" style={{ color: C.primary }}>
              Evening Steps
            </span>
          </div>
          <div className="space-y-2">
            {items.filter(i => i.time === "PM").map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  item.completed ? "bg-pink-100/60 line-through opacity-80" : "bg-white hover:border-pink-300"
                }`}
                style={{ borderColor: C.petal }}
              >
                <span className="text-xs font-medium" style={{ color: C.ink }}>
                  {item.label}
                </span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-colors ${
                    item.completed ? "bg-emerald-600 text-white" : "border bg-white"
                  }`}
                  style={{ borderColor: C.petal }}
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
