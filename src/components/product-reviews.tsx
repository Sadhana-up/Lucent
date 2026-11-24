"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, MessageSquare, Star } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  bgWarm: "#F5F3F0",
  text: "#1A1D21",
  textSecondary: "#5A5F6B",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
};

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface ReviewResponse {
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
  eligibility: {
    canReview: boolean;
    hasPurchased: boolean;
    hasReviewed: boolean;
    myReview: Review | null;
  };
}

export function ProductReviews({ productSlug }: { productSlug: string }) {
  const { data: session } = authClient.useSession();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load reviews");
      setData(json);
      if (json.eligibility?.myReview) {
        setRating(json.eligibility.myReview.rating);
        setComment(json.eligibility.myReview.comment ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (rating < 1) {
      setError("Please choose a rating from 1 to 5 stars.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit review");

      setSuccess(
        data?.eligibility.hasReviewed
          ? "Your review has been updated."
          : "Thanks for reviewing this product!",
      );
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const reviews = data?.reviews ?? [];
  const avgRating = data?.avgRating;
  const reviewCount = data?.reviewCount ?? 0;
  const eligibility = data?.eligibility;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.text }}>
            Customer Reviews
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {reviewCount > 0 ? (
              <>
                <StarRating rating={avgRating ?? 0} size={16} />
                <span className="text-sm font-semibold" style={{ color: C.text }}>
                  {avgRating?.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-sm" style={{ color: C.textMuted }}>
                No reviews yet
              </span>
            )}
            <span className="text-xs" style={{ color: C.textMuted }}>
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.primary }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: C.bgWarm, border: `1px solid ${C.borderLight}` }}
              >
                <MessageSquare
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: C.textMuted }}
                />
                <p className="text-sm font-medium" style={{ color: C.text }}>
                  Be the first to review this product
                </p>
                <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                  Reviews are only available to verified buyers.
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl p-5"
                  style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {review.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.user.image}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                          style={{ background: C.primaryGhost, color: C.primary }}
                        >
                          {review.user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold" style={{ color: C.text }}>
                            {review.user.name || "Verified buyer"}
                          </span>
                          {review.isVerified && (
                            <BadgeCheck
                              size={14}
                              style={{ color: C.primary }}
                              aria-label="Verified purchase"
                            />
                          )}
                        </div>
                        <span className="text-xs" style={{ color: C.textMuted }}>
                          {new Date(review.createdAt).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p
                      className="text-sm mt-3 leading-relaxed"
                      style={{ color: C.textSecondary }}
                    >
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div
            className="rounded-2xl p-5 h-fit"
            style={{ background: "#fff", border: `1px solid ${C.borderLight}` }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: C.text }}>
              <Star size={15} style={{ color: C.primary }} />
              {eligibility?.hasReviewed ? "Update your review" : "Write a review"}
            </h3>

            {!session?.user ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs" style={{ color: C.textSecondary }}>
                  Sign in to review products you have purchased.
                </p>
                <Link href={`/sign-in?callbackUrl=/shop/${productSlug}`}>
                  <Button variant="premium" size="sm" className="w-full rounded-xl">
                    Sign in to review
                  </Button>
                </Link>
              </div>
            ) : !eligibility?.canReview ? (
              <p className="text-xs mt-3" style={{ color: C.textSecondary }}>
                Only verified buyers can review this product. Once your order is paid,
                you can share your experience here.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                <div>
                  <span className="text-xs font-semibold block mb-1" style={{ color: C.textSecondary }}>
                    Your rating
                  </span>
                  <StarRating rating={rating} size={24} interactive onChange={setRating} />
                </div>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? (optional)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}
                />
                {error && (
                  <p className="text-xs" style={{ color: "#b54a4a" }}>
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-xs" style={{ color: C.primary }}>
                    {success}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="premium"
                  size="sm"
                  disabled={submitting}
                  className="w-full rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : eligibility.hasReviewed ? (
                    "Update review"
                  ) : (
                    "Submit review"
                  )}
                </Button>
                <p className="text-[11px]" style={{ color: C.textMuted }}>
                  Your review will show a verified purchase badge.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
