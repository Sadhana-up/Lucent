"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Sparkles, ArrowLeft, CheckCircle } from "lucide-react";

const C = {
  primary: "#831843",
  active: "#BE185D",
  blush: "#EC4899",
  petal: "#FBCFE8",
  mist: "#FDF2F8",
  ink: "#1C1917",
  smoke: "#44403C",
};

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Failed to reset password. The link may have expired.");
    } else {
      setSuccess(true);
    }
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.mist, color: C.ink }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: C.primary }}
              >
                <Sparkles size={18} style={{ color: C.mist }} />
              </div>
              <span
                className="text-xl font-medium tracking-tight"
                style={{ color: C.primary }}
              >
                Lucent
              </span>
            </Link>
          </div>

          <Card
            style={{
              border: `0.5px solid ${C.petal}`,
              background: "#fff",
            }}
          >
            <CardContent className="p-6 text-center">
              <h1
                className="text-xl font-medium tracking-tight mb-2"
                style={{ color: C.primary }}
              >
                Invalid reset link
              </h1>
              <p className="text-sm mb-6" style={{ color: C.smoke }}>
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Link href="/forgot-password">
                <Button
                  className="w-full text-sm font-medium text-white"
                  style={{ background: C.primary }}
                >
                  Request new link
                </Button>
              </Link>
            </CardContent>
          </Card>

          <p className="text-center text-sm mt-6" style={{ color: C.smoke }}>
            <Link
              href="/sign-in"
              className="font-medium inline-flex items-center gap-1"
              style={{ color: C.primary }}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: C.mist, color: C.ink }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: C.primary }}
              >
                <Sparkles size={18} style={{ color: C.mist }} />
              </div>
              <span
                className="text-xl font-medium tracking-tight"
                style={{ color: C.primary }}
              >
                Lucent
              </span>
            </Link>
          </div>

          <Card
            style={{
              border: `0.5px solid ${C.petal}`,
              background: "#fff",
            }}
          >
            <CardContent className="p-6 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "#DCFCE7" }}
              >
                <CheckCircle size={24} style={{ color: "#16A34A" }} />
              </div>
              <h1
                className="text-xl font-medium tracking-tight mb-2"
                style={{ color: C.primary }}
              >
                Password reset successful
              </h1>
              <p className="text-sm mb-6" style={{ color: C.smoke }}>
                Your password has been updated. You can now sign in with your
                new password.
              </p>
              <Button
                className="w-full text-sm font-medium text-white"
                style={{ background: C.primary }}
                onClick={() => router.push("/sign-in")}
              >
                Sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.mist, color: C.ink }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: C.primary }}
            >
              <Sparkles size={18} style={{ color: C.mist }} />
            </div>
            <span
              className="text-xl font-medium tracking-tight"
              style={{ color: C.primary }}
            >
              Lucent
            </span>
          </Link>
          <h1
            className="text-2xl font-medium tracking-tight"
            style={{ color: C.primary }}
          >
            Set new password
          </h1>
          <p className="text-sm mt-2" style={{ color: C.smoke }}>
            Choose a strong password for your account
          </p>
        </div>

        <Card
          style={{
            border: `0.5px solid ${C.petal}`,
            background: "#fff",
          }}
        >
          <CardContent className="p-6">
            <form
              onSubmit={handleResetPassword}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: C.primary }}
                  htmlFor="password"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    border: `0.5px solid ${C.petal}`,
                    background: C.mist,
                    color: C.ink,
                  }}
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: C.primary }}
                  htmlFor="confirmPassword"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    border: `0.5px solid ${C.petal}`,
                    background: C.mist,
                    color: C.ink,
                  }}
                  placeholder="Repeat your password"
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "#DC2626" }}>
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-sm font-medium text-white mt-2"
                style={{ background: C.primary }}
              >
                {loading ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm mt-6" style={{ color: C.smoke }}>
          <Link
            href="/sign-in"
            className="font-medium inline-flex items-center gap-1"
            style={{ color: C.primary }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: C.mist }}
        >
          <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
