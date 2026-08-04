"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Leaf } from "lucide-react";

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

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Invalid email or password");
    } else {
      const sessionRes = await authClient.getSession();
      const userRole = (sessionRes.data?.user as { role?: string })?.role;

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (userRole === "seller" || userRole === "admin") {
        router.push("/seller");
      } else {
        router.push("/");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl || "/",
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex min-h-[600px] rounded-2xl overflow-hidden animate-fade-in-up" style={{ background: C.bgCard, border: `1px solid ${C.borderLight}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D5A3D, #3D7A52)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 80%, rgba(124,107,234,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-float" style={{ background: "rgba(124,107,234,0.3)", top: "10%", left: "10%", filter: "blur(60px)" }} />
        <div className="absolute w-48 h-48 rounded-full opacity-15 animate-float-delayed" style={{ background: "rgba(255,255,255,0.2)", bottom: "15%", right: "10%", filter: "blur(50px)" }} />
        <div className="absolute w-32 h-32 rounded-full opacity-10 animate-float-slow" style={{ background: "rgba(124,107,234,0.2)", top: "50%", left: "50%", filter: "blur(40px)" }} />

        {/* Floating product shapes */}
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
              Your journey to<br />radiant skin starts here
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
              Discover personalized skincare routines crafted with natural ingredients for your unique glow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20" style={{ background: `rgba(255,255,255,${0.15 + i * 0.05})` }} />
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Trusted by 10,000+ users</p>
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
              Welcome back
            </h1>
            <p className="text-sm mt-2" style={{ color: C.textSecondary }}>
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: C.text }} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  color: C.text,
                }}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: C.text }} htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-300 input-focus-glow"
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  color: C.text,
                }}
                placeholder="Your password"
              />
            </div>

            {error && (
              <div className="px-3 py-2 rounded-xl text-sm animate-fade-in" style={{ background: C.primaryGhost, color: "#b54a4a" }}>
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
                  Signing in...
                </span>
              ) : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" style={{ borderTop: `1px solid ${C.borderLight}` }} />
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ background: C.bgCard, color: C.textMuted }}>
                or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full text-sm font-semibold rounded-xl h-11 transition-all duration-300 hover:bg-[rgba(245,243,240,0.5)]"
            style={{ borderColor: C.border, color: C.text, background: "transparent" }}
            onClick={handleGoogleSignIn}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>

          <p className="text-center text-sm mt-6" style={{ color: C.textSecondary }}>
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: C.primary }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh" style={{ background: C.bg }}>
      <Suspense
        fallback={
          <div className="w-full max-w-md text-center p-8">
            <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: C.border, borderTopColor: C.primary }} />
          </div>
        }
      >
        <SignInFormContent />
      </Suspense>
    </div>
  );
}
