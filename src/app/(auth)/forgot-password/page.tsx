"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Failed to send reset email. Please try again.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
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
                Check your email
              </h1>
              <p className="text-sm mb-6" style={{ color: C.smoke }}>
                We sent a password reset link to{" "}
                <span className="font-medium" style={{ color: C.ink }}>
                  {email}
                </span>
              </p>
              <p className="text-xs mb-6" style={{ color: C.smoke }}>
                Didn&apos;t receive the email? Check your spam folder or try
                again.
              </p>
              <Button
                variant="outline"
                className="w-full text-sm font-medium"
                style={{
                  borderColor: C.petal,
                  color: C.primary,
                  background: "transparent",
                }}
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Try another email
              </Button>
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
            Forgot your password?
          </h1>
          <p className="text-sm mt-2" style={{ color: C.smoke }}>
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <Card
          style={{
            border: `0.5px solid ${C.petal}`,
            background: "#fff",
          }}
        >
          <CardContent className="p-6">
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: C.primary }}
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    border: `0.5px solid ${C.petal}`,
                    background: C.mist,
                    color: C.ink,
                  }}
                  placeholder="you@example.com"
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
                {loading ? "Sending link..." : "Send reset link"}
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
