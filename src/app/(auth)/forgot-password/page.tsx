"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Leaf, Mail, ArrowLeft, CheckCircle } from "lucide-react";

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

function ForgotPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
    } catch {
      setError("If an account exists with this email, you'll receive a reset link.");
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-5xl mx-auto flex min-h-[500px] rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: C.bgCard, border: `1px solid ${C.borderLight}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}>
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 80%, rgba(124,107,234,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
          <div className="absolute w-64 h-64 rounded-full opacity-20 animate-float" style={{ background: "rgba(124,107,234,0.3)", top: "10%", left: "10%", filter: "blur(60px)" }} />
          <div className="absolute w-48 h-48 rounded-full opacity-15 animate-float-delayed" style={{ background: "rgba(255,255,255,0.2)", bottom: "15%", right: "10%", filter: "blur(50px)" }} />
          <div className="absolute w-32 h-32 rounded-full opacity-10 animate-float-slow" style={{ background: "rgba(124,107,234,0.2)", top: "50%", left: "50%", filter: "blur(40px)" }} />
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
                We&apos;ve got<br />you covered
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                Check your inbox for the password reset link. Your skincare journey awaits.
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
              Check your email
            </h1>
            <p className="text-sm mb-6" style={{ color: C.textSecondary }}>
              If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link.
            </p>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              style={{ borderColor: C.border, color: C.text }}
              onClick={() => router.push("/sign-in")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to sign in
            </Button>
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
              Don&apos;t worry,<br />we&apos;ll help you in
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
              Enter your registered email and we&apos;ll send you a secure link to reset your password.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20" style={{ background: `rgba(255,255,255,${0.15 + i * 0.05})` }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>24/7 support available</p>
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
              Reset your password
            </h1>
            <p className="text-sm mt-2" style={{ color: C.textSecondary }}>
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: C.text }} htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.text,
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-xl text-sm animate-fade-in" style={{ background: C.primaryGhost, color: C.textSecondary }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-semibold mt-2 rounded-xl h-11 magnetic-btn"
              style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : "Send reset link"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: C.textSecondary }}>
            Remember your password?{" "}
            <Link href="/sign-in" className="font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh" style={{ background: C.bg }}>
      <Suspense
        fallback={
          <div className="w-full max-w-md text-center p-8">
            <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: C.border, borderTopColor: C.primary }} />
          </div>
        }
      >
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
