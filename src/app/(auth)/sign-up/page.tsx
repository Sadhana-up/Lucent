"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { Sparkles } from "lucide-react";

const C = {
  primary: "#831843",
  active: "#BE185D",
  blush: "#EC4899",
  petal: "#FBCFE8",
  mist: "#FDF2F8",
  ink: "#1C1917",
  smoke: "#44403C",
};

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Something went wrong");
    } else {
      router.push("/");
    }
  };

  const handleGoogleSignUp = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

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
            Create your account
          </h1>
          <p className="text-sm mt-2" style={{ color: C.smoke }}>
            Start your skincare journey today
          </p>
        </div>

        <Card
          style={{
            border: `0.5px solid ${C.petal}`,
            background: "#fff",
          }}
        >
          <CardContent className="p-6">
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: C.primary }}
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    border: `0.5px solid ${C.petal}`,
                    background: C.mist,
                    color: C.ink,
                  }}
                  placeholder="Your name"
                />
              </div>

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

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: C.primary }}
                  htmlFor="password"
                >
                  Password
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
                {loading ? "Creating account..." : "Sign up"}
              </Button>
            </form>

            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                style={{ borderTop: `0.5px solid ${C.petal}` }}
              />
              <div className="relative flex justify-center text-xs">
                <span
                  className="px-2"
                  style={{ background: "#fff", color: C.smoke }}
                >
                  or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full text-sm font-medium"
              style={{
                borderColor: C.petal,
                color: C.primary,
                background: "transparent",
              }}
              onClick={handleGoogleSignUp}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm mt-6" style={{ color: C.smoke }}>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium"
            style={{ color: C.primary }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
