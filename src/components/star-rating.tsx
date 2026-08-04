"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
};

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, idx) => {
        const starValue = idx + 1;
        const filled = starValue <= Math.round(rating);
        const hovered = hoveredIdx !== null && starValue <= hoveredIdx;

        return (
          <button
            key={idx}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            onMouseEnter={() => interactive && setHoveredIdx(idx)}
            onMouseLeave={() => interactive && setHoveredIdx(null)}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-all duration-200 focus:outline-none`}
            style={{
              transform: hovered ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease",
            }}
          >
            <Star
              size={size}
              className={`transition-colors duration-200 ${
                filled || hovered ? "" : ""
              }`}
              style={{
                fill: filled || hovered ? (hovered ? C.primaryLight : C.primary) : "none",
                color: filled || hovered ? (hovered ? C.primaryLight : C.primary) : C.border,
                filter: hovered ? `drop-shadow(0 0 4px rgba(45, 90, 61, 0.3))` : "none",
                transition: "fill 0.2s ease, color 0.2s ease, filter 0.2s ease",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
