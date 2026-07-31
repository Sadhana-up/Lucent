"use client";

import Link from "next/link";
import { StarRating } from "./star-rating";
import { Store, Sparkles, CheckCircle2 } from "lucide-react";

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
      className="group flex flex-col bg-white rounded-2xl border border-pink-200/60 overflow-hidden hover:shadow-xl hover:shadow-pink-950/5 hover:border-pink-300 transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Product Image Box */}
      <div className="relative aspect-[4/3] w-full bg-pink-50/50 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {product.discountPrice && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-rose-900 text-white text-[11px] font-medium shadow-sm">
            SALE
          </span>
        )}

        {product.skinType && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md border border-pink-200/60 text-stone-700 text-[10px] font-medium shadow-xs">
            {product.skinType}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller Store Name */}
          {product.seller && (
            <div className="flex items-center gap-1.5 mb-1 text-xs text-stone-500 font-medium">
              <Store size={12} className="text-rose-800" />
              <span className="truncate">{product.seller.storeName}</span>
              {product.seller.isVerified && (
                <CheckCircle2 size={12} className="text-emerald-600 fill-emerald-100" />
              )}
            </div>
          )}

          {/* Product Title */}
          <h3 className="font-semibold text-rose-950 text-base line-clamp-1 group-hover:text-rose-700 transition-colors">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRating rating={product.avgRating || 5} size={13} />
            <span className="text-xs font-semibold text-stone-700">
              {product.avgRating ? product.avgRating : "5.0"}
            </span>
            <span className="text-[11px] text-stone-400">
              ({product.reviewCount || 0})
            </span>
          </div>

          {/* Concerns Tags */}
          {concernsList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {concernsList.map((concern) => (
                <span
                  key={concern}
                  className="px-2 py-0.5 rounded-md bg-pink-50 border border-pink-200/50 text-rose-900 text-[10px] font-medium"
                >
                  {concern}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-rose-950">
                ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
              </span>
              {product.discountPrice && (
                <span className="text-xs text-stone-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-pink-50 text-rose-900 text-xs font-semibold group-hover:bg-rose-900 group-hover:text-white transition-colors">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
