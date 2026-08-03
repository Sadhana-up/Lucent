"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Leaf, Mail, ArrowLeft, CheckCircle } from "lucide-react";

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
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-success-pop"
          style={{ background: C.primaryGhost }}
        >
          <CheckCircle size={32} style={{ color: C.primary }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: C.text }}>
          Check your email
        </h1>
        <p className="text-sm mb-6" style={{ color: C.textLight }}>
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
          Reset your password
        </h1>
        <p className="text-sm mt-2" style={{ color: C.textLight }}>
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6">
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
              <div className="px-3 py-2 rounded-xl text-sm animate-fade-in" style={{ background: C.primaryGhost, color: C.textLight }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-medium mt-2 rounded-xl h-11 magnetic-btn"
              style={{ background: "linear-gradient(135deg, #4a6741, #6b8c62)", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : "Send reset link"}
            </Button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: C.textLight }}>
        Remember your password?{" "}
        <Link href="/sign-in" className="font-medium transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh">
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
