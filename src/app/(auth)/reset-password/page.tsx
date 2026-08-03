"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Leaf, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

const C = {
  primary: "#4a6741",
  primaryLight: "#6b8c62",
  primaryGhost: "rgba(74, 103, 65, 0.08)",
  accent: "#c4956a",
  bg: "#faf8f5",
  bgWarm: "#f5f0eb",
  text: "#2d2a26",
  textLight: "#6b6560",
  textMuted: "#9c9590",
  border: "#e8e4df",
  borderLight: "#f0ece7",
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await authClient.resetPassword({
        newPassword: password,
        token: token || "",
      });
      setSuccess(true);
    } catch {
      setError("Invalid or expired reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-success-pop"
          style={{ background: C.primaryGhost }}
        >
          <CheckCircle size={32} style={{ color: C.primary }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: C.text }}>
          Password reset successful
        </h1>
        <p className="text-sm mb-6" style={{ color: C.textLight }}>
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Button
          className="rounded-xl h-11 magnetic-btn"
          style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
          onClick={() => router.push("/sign-in")}
        >
          Sign in
          <ArrowLeft size={16} className="ml-2 rotate-180" />
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(181, 74, 74, 0.08)" }}
        >
          <Lock size={32} style={{ color: "#b54a4a" }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: C.text }}>
          Invalid reset link
        </h1>
        <p className="text-sm mb-6" style={{ color: C.textLight }}>
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password">
          <Button
            variant="outline"
            className="rounded-xl h-11"
            style={{ borderColor: C.border, color: C.text }}
          >
            Request a new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)" }}
          >
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-xl font-medium tracking-tight" style={{ color: C.text }}>
            Lucent
          </span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
          Set new password
        </h1>
        <p className="text-sm mt-2" style={{ color: C.textLight }}>
          Choose a strong password for your account
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: C.text }} htmlFor="password">
                New password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.text,
                  }}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: C.textMuted }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: C.text }} htmlFor="confirmPassword">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.text,
                  }}
                  placeholder="Confirm your password"
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs mt-1 animate-fade-in" style={{ color: "#b54a4a" }}>
                  Passwords don&apos;t match
                </p>
              )}
            </div>

            {error && (
              <div className="px-3 py-2 rounded-xl text-sm animate-fade-in" style={{ background: "rgba(181, 74, 74, 0.08)", color: "#b54a4a" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full text-sm font-medium mt-2 rounded-xl h-11 magnetic-btn"
              style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : "Reset password"}
            </Button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: C.textLight }}>
        <Link href="/sign-in" className="font-medium transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh">
      <Suspense
        fallback={
          <div className="w-full max-w-md text-center p-8">
            <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: C.border, borderTopColor: C.primary }} />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
