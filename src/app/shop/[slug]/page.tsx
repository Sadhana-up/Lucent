import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { ProductDetailClient } from "./product-detail-client";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string) {
  const [product, ratingAggregate] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
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
        _count: { select: { reviews: true } },
      },
    }),
    prisma.review.aggregate({
      where: { product: { slug } },
      _avg: { rating: true },
    }),
  ]);

  if (!product || product.status !== "ACTIVE") return null;

  const reviewCount = product._count.reviews;
  const avgRating =
    ratingAggregate._avg.rating !== null
      ? Number(ratingAggregate._avg.rating.toFixed(1))
      : null;

  return { ...product, avgRating, reviewCount };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const description = product.description.replace(/\s+/g, " ").trim().slice(0, 155);
  const image = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const images = image ? [{ url: image.url, alt: product.title }] : undefined;
  const keywords = [
    product.title,
    product.category?.name,
    product.skinType,
    product.skinConcerns,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return {
    title: product.title,
    description,
    keywords,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url: `/shop/${product.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: images?.map((img) => img.url),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const price = product.discountPrice ?? product.price;
  const productUrl = absoluteUrl(`/shop/${product.slug}`);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.id,
    url: productUrl,
    brand: { "@type": "Brand", name: product.seller.storeName },
    category: product.category?.name,
    ...(product.images.length > 0
      ? { image: product.images.map((img) => absoluteUrl(img.url)) }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "NPR",
      price: price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: product.seller.storeName },
    },
    ...(product.avgRating !== null && product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.avgRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/shop") },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
