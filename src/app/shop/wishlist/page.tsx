"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoreNavbar } from "@/components/store-navbar";
import { ProductCard } from "@/components/product-card";

type WishlistItem = {
  id: string;
  productId: string;
  product: Parameters<typeof ProductCard>[0]["product"];
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    fetch("/api/wishlist")
      .then(async (res) => {
        if (res.status === 401) {
          setNeedsSignIn(true);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items ?? []);
      })
      .catch((err) => console.error("Failed to load wishlist:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#FAF6F0" }}>
      <StoreNavbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: "#1A1D21" }}>My Wishlist</h1>
        <p className="text-sm mb-10" style={{ color: "#5A5F6B" }}>Products you saved for later.</p>

        {needsSignIn ? (
          <div className="rounded-2xl p-10 text-center bg-white">
            <p className="mb-4 text-sm">Sign in to view and manage your wishlist.</p>
            <Link href="/sign-in?callbackUrl=/shop/wishlist" className="inline-flex px-6 py-3 rounded-xl text-white text-sm font-medium" style={{ background: "#2D5A3D" }}>Sign in</Link>
          </div>
        ) : loading ? (
          <p className="text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl p-10 text-center bg-white">
            <p className="mb-4 text-sm">Your wishlist is empty.</p>
            <Link href="/shop" className="inline-flex px-6 py-3 rounded-xl text-white text-sm font-medium" style={{ background: "#2D5A3D" }}>Browse products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.product} wishlisted />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
