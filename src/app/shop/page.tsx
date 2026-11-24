import type { Metadata } from "next";
import { ShopClient } from "./shop-client";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

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

async function getInitialShopData() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        images: true,
        category: true,
        seller: {
          select: {
            storeName: true,
            storeSlug: true,
            logo: true,
            isVerified: true,
          },
        },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    products: products.map((p) => {
      const totalRating = p.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = p.reviews.length > 0 ? Number((totalRating / p.reviews.length).toFixed(1)) : null;
      return { ...p, avgRating, reviewCount: p.reviews.length, reviews: undefined };
    }),
    categories,
  };
}

export default async function ShopPage() {
  let initialProducts: Awaited<ReturnType<typeof getInitialShopData>>["products"] = [];
  let initialCategories: Awaited<ReturnType<typeof getInitialShopData>>["categories"] = [];
  try {
    const data = await getInitialShopData();
    initialProducts = data.products;
    initialCategories = data.categories;
  } catch {
    // render with empty initial data; client can still fetch
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/shop") },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shop Skincare Products",
    url: absoluteUrl("/shop"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: initialProducts.slice(0, 24).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/shop/${product.slug}`),
        name: product.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ShopClient initialProducts={initialProducts} initialCategories={initialCategories} />
    </>
  );
}
