"use client";

import { Star } from "lucide-react";

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
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, idx) => {
        const starValue = idx + 1;
        const filled = starValue <= Math.round(rating);

        return (
          <button
            key={idx}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform focus:outline-none`}
          >
            <Star
              size={size}
              className={filled ? "fill-amber-400 text-amber-400" : "text-stone-300"}
            />
          </button>
        );
      })}
    </div>
  );
}
