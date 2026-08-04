"use client";

import Link from "next/link";
import { StarRating } from "./star-rating";
import { Store, CheckCircle2 } from "lucide-react";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  accent: "#7C6BEA",
  accentGhost: "rgba(124, 107, 234, 0.08)",
  bg: "#FAFBFC",
  bgWarm: "#F5F3F0",
  bgCard: "#FFFFFF",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  successFg: "#1E3D2A",
};

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    skinType?: string | null;
    skinConcerns?: string | null;
    status: string;
    images: { url: string; isPrimary?: boolean }[];
    category?: { name: string } | null;
    seller?: {
      storeName: string;
      storeSlug: string;
      logo?: string | null;
      isVerified?: boolean;
    } | null;
    avgRating?: number | null;
    reviewCount?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url ||
    product.images[0]?.url ||
    "/placeholder-product.png";

  const concernsList = product.skinConcerns
    ? product.skinConcerns.split(",").map((s) => s.trim()).slice(0, 2)
    : [];

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover-lift glass-card"
    >
      {/* Product Image Box */}
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: C.bgWarm }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {product.discountPrice && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[11px] font-medium shadow-sm"
            style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
          >
            SALE
          </span>
        )}

        {product.skinType && (
          <span
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-medium"
            style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${C.border}`, color: C.textSecondary }}
          >
            {product.skinType}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.seller && (
            <div className="flex items-center gap-1.5 mb-1 text-xs font-medium" style={{ color: C.textMuted }}>
              <Store size={12} style={{ color: C.primary }} />
              <span className="truncate">{product.seller.storeName}</span>
              {product.seller.isVerified && (
                <CheckCircle2 size={12} style={{ color: C.successFg }} />
              )}
            </div>
          )}

          <h3 className="font-semibold text-base line-clamp-1 transition-colors duration-200" style={{ color: C.text }}>
            {product.title}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRating rating={product.avgRating || 5} size={13} />
            <span className="text-xs font-medium" style={{ color: C.textSecondary }}>
              {product.avgRating ? product.avgRating : "5.0"}
            </span>
            <span className="text-[11px]" style={{ color: C.textMuted }}>
              ({product.reviewCount || 0})
            </span>
          </div>

          {concernsList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {concernsList.map((concern) => (
                <span
                  key={concern}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{ background: C.primaryGhost, border: `1px solid rgba(45, 90, 61, 0.06)`, color: C.primary }}
                >
                  {concern}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.borderLight}` }}>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold" style={{ color: C.text }}>
                ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
              </span>
              {product.discountPrice && (
                <span className="text-xs line-through" style={{ color: C.textMuted }}>
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <span
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 group-hover:shadow-sm"
            style={{ background: C.primaryGhost, color: C.primary }}
          >
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
