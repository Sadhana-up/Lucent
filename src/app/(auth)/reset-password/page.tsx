"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Leaf, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

const C = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  primaryDark: "#1E3D2A",
  primaryGhost: "rgba(45, 90, 61, 0.06)",
  primaryGlow: "rgba(45, 90, 61, 0.12)",
  primarySubtle: "rgba(45, 90, 61, 0.04)",
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
      <div className="w-full max-w-5xl mx-auto flex min-h-[500px] rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: C.bgCard, border: `1px solid ${C.borderLight}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}>
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 80%, rgba(124,107,234,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
          <div className="absolute w-64 h-64 rounded-full opacity-20 animate-float" style={{ background: "rgba(124,107,234,0.3)", top: "10%", left: "10%", filter: "blur(60px)" }} />
          <div className="absolute w-48 h-48 rounded-full opacity-15 animate-float-delayed" style={{ background: "rgba(255,255,255,0.2)", bottom: "15%", right: "10%", filter: "blur(50px)" }} />
          <div className="absolute w-16 h-16 rounded-2xl animate-float-rotate" style={{ background: "rgba(255,255,255,0.1)", top: "20%", right: "20%", border: "1px solid rgba(255,255,255,0.15)" }} />
          <div className="absolute w-12 h-12 rounded-xl animate-float-rotate-delayed" style={{ background: "rgba(124,107,234,0.15)", bottom: "25%", left: "15%", border: "1px solid rgba(255,255,255,0.1)" }} />

          <div className="relative z-10 flex flex-col justify-between p-10 text-white">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <Leaf size={18} className="text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">Lucent</span>
            </Link>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
                You&apos;re all set!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                Your password has been updated. Sign in to continue your skincare journey.
              </p>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-8" style={{ background: C.bgCard }}>
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-success-pop" style={{ background: C.primaryGhost }}>
              <CheckCircle size={32} style={{ color: C.primary }} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: C.text }}>
              Password reset successful
            </h1>
            <p className="text-sm mb-6" style={{ color: C.textSecondary }}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Button
              className="rounded-xl h-11 magnetic-btn"
              style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}
              onClick={() => router.push("/sign-in")}
            >
              Sign in
              <ArrowLeft size={16} className="ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-5xl mx-auto flex min-h-[500px] rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: C.bgCard, border: `1px solid ${C.borderLight}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}>
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 80%, rgba(124,107,234,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
          <div className="absolute w-64 h-64 rounded-full opacity-20 animate-float" style={{ background: "rgba(124,107,234,0.3)", top: "10%", left: "10%", filter: "blur(60px)" }} />
          <div className="absolute w-48 h-48 rounded-full opacity-15 animate-float-delayed" style={{ background: "rgba(255,255,255,0.2)", bottom: "15%", right: "10%", filter: "blur(50px)" }} />
          <div className="absolute w-16 h-16 rounded-2xl animate-float-rotate" style={{ background: "rgba(255,255,255,0.1)", top: "20%", right: "20%", border: "1px solid rgba(255,255,255,0.15)" }} />
          <div className="absolute w-12 h-12 rounded-xl animate-float-rotate-delayed" style={{ background: "rgba(124,107,234,0.15)", bottom: "25%", left: "15%", border: "1px solid rgba(255,255,255,0.1)" }} />

          <div className="relative z-10 flex flex-col justify-between p-10 text-white">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <Leaf size={18} className="text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-white">Lucent</span>
            </Link>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
                Something<br />went wrong
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                This password reset link is invalid or has expired. Request a new one to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-8" style={{ background: C.bgCard }}>
          <div className="w-full max-w-md text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(181, 74, 74, 0.08)" }}
            >
              <Lock size={32} style={{ color: "#b54a4a" }} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: C.text }}>
              Invalid reset link
            </h1>
            <p className="text-sm mb-6" style={{ color: C.textSecondary }}>
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex min-h-[580px] rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: C.bgCard, border: `1px solid ${C.borderLight}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 80%, rgba(124,107,234,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-float" style={{ background: "rgba(124,107,234,0.3)", top: "10%", left: "10%", filter: "blur(60px)" }} />
        <div className="absolute w-48 h-48 rounded-full opacity-15 animate-float-delayed" style={{ background: "rgba(255,255,255,0.2)", bottom: "15%", right: "10%", filter: "blur(50px)" }} />
        <div className="absolute w-32 h-32 rounded-full opacity-10 animate-float-slow" style={{ background: "rgba(124,107,234,0.2)", top: "50%", left: "50%", filter: "blur(40px)" }} />
        <div className="absolute w-16 h-16 rounded-2xl animate-float-rotate" style={{ background: "rgba(255,255,255,0.1)", top: "20%", right: "20%", border: "1px solid rgba(255,255,255,0.15)" }} />
        <div className="absolute w-12 h-12 rounded-xl animate-float-rotate-delayed" style={{ background: "rgba(124,107,234,0.15)", bottom: "25%", left: "15%", border: "1px solid rgba(255,255,255,0.1)" }} />
        <div className="absolute w-10 h-10 rounded-full animate-float-rotate-slow" style={{ background: "rgba(255,255,255,0.08)", top: "60%", right: "30%", border: "1px solid rgba(255,255,255,0.1)" }} />

        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Lucent</span>
          </Link>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
              Almost there,<br />create your new<br />password
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
              Make sure it&apos;s strong and unique. A mix of letters, numbers, and symbols works best.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20" style={{ background: `rgba(255,255,255,${0.15 + i * 0.05})` }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Your data is encrypted & secure</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8" style={{ background: C.bgCard }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(45,90,61,0.2)]"
                style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}
              >
                <Leaf size={18} className="text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight" style={{ color: C.text }}>
                Lucent
              </span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
              Set new password
            </h1>
            <p className="text-sm mt-2" style={{ color: C.textSecondary }}>
              Choose a strong password for your account
            </p>
          </div>

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
              className="w-full text-sm font-semibold mt-2 rounded-xl h-11 magnetic-btn"
              style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : "Reset password"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: C.textSecondary }}>
            <Link href="/sign-in" className="font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh" style={{ background: C.bg }}>
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
