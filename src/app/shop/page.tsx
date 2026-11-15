import type { Metadata } from "next";
import { ShopClient } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop Skincare Products",
  description:
    "Browse curated skincare products by skin type and concern. Personalized picks for acne, hydration, brightening, and barrier repair.",
  keywords: [
    "skincare products",
    "buy skincare online",
    "skincare Nepal",
    "acne products",
    "moisturizer",
    "serum",
  ],
  alternates: { canonical: "/shop" },
  openGraph: {
    type: "website",
    title: "Shop Skincare Products",
    description:
      "Browse curated skincare products by skin type and concern. Personalized picks for acne, hydration, brightening, and barrier repair.",
    url: "/shop",
  },
};

export default function ShopPage() {
  return <ShopClient />;
}
