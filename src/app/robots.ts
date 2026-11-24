import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/seller",
          "/api/",
          "/chat",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/shop/cart",
          "/shop/checkout",
          "/shop/orders",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl().origin,
  };
}
