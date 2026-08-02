import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma as db } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// ── Environment ─────────────────────────────────────────────
function getEnv(name: string, required = true): string | undefined {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (required)
    throw new Error(`Missing required environment variable: ${name}`);
  return undefined;
}

const baseURL = getEnv("BETTER_AUTH_URL") as string;
const appURL = getEnv("NEXT_PUBLIC_APP_URL", false) ?? baseURL;
const secret = getEnv("BETTER_AUTH_SECRET") as string;
const appName = getEnv("APP_NAME", false) ?? "SkincareApp";

const googleClientId = getEnv("GOOGLE_CLIENT_ID", false);
const googleClientSecret = getEnv("GOOGLE_CLIENT_SECRET", false);
const hasGoogle = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  appName,
  baseURL,
  secret,

  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // ── Email / Password ───────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // No email verification required

    // Forgot password — sends a reset link via email
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#1e293b">Reset your password</h2>
            <p style="color:#64748b">Click the button below to set a new password for your account.</p>
            <a href="${url}"
               style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                      border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Reset Password
            </a>
            <p style="color:#94a3b8;font-size:12px">
              This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>
          </div>
        `,
      }).catch((error: unknown) => {
        console.error("[Email Delivery Error] reset_password", error);
      });
    },
    revokeSessionsOnPasswordReset: true,
  },

  // ── Social Providers ───────────────────────────────────────
  socialProviders: {
    ...(hasGoogle
      ? {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            prompt: "select_account",
          },
        }
      : {}),
  },

  // ── Session ────────────────────────────────────────────────
  session: {
    storeSessionInDatabase: true,
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24h
    freshAge: 60 * 15, // 15 min for destructive actions
  },

  // ── Rate Limiting ──────────────────────────────────────────
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "database",  // persistent across restarts, no Redis needed
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/verify-email": { window: 10, max: 5 },
      "/email-otp/request-password-reset": { window: 60, max: 3 },
      "/change-password": { window: 60, max: 5 },
      "/delete-user": { window: 60, max: 2 },
    },
  },

  // ── Trusted Origins ────────────────────────────────────────
  trustedOrigins: Array.from(
    new Set([
      ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"]),
      appURL,
      ...(getEnv("TRUSTED_ORIGINS", false)
        ?.split(",")
        .map((o) => o.trim())
        .filter(Boolean) ?? []),
    ]),
  ),

  // ── Account Linking ────────────────────────────────────────
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["credential", "google"],
    },
  },

  // ── User Config ────────────────────────────────────────────
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      initialRole: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      skinType: {
        type: "string", // oily, dry, combination, sensitive, normal
        required: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },

  // ── Advanced ───────────────────────────────────────────────
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: {
      disableIpTracking: false,
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "x-client-ip"],
      ipv6Subnet: 64,  // group IPv6 addresses by /64 subnet
    },
    backgroundTasks: {
      handler: (promise) => {
        void promise.catch((e: unknown) =>
          console.error("[Better Auth] Background task failed:", e),
        );
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user: { id: string; [key: string]: unknown }) => {
            // Map initialRole to role during sign-up
            const initialRole = user.initialRole;
            if (initialRole && typeof initialRole === "string" && initialRole !== "user") {
              await db.user.update({
                where: { id: user.id },
                data: { role: initialRole },
              });
            }
          },
        },
      },
    },
  },

  // ── Plugins ────────────────────────────────────────────────
  plugins: [
    // ── Email OTP (sign-in + password reset via OTP) ─────────
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "sign-in"
            ? "Your sign-in code"
            : type === "forget-password"
              ? "Your password reset code"
              : "Your verification code";

        const heading =
          type === "sign-in"
            ? "Sign in to your account"
            : type === "forget-password"
              ? "Reset your password"
              : "Verify your email";

        await sendEmail({
          to: email,
          subject: `${subject} — ${appName}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#1e293b">${heading}</h2>
              <p style="color:#64748b">Use the code below to ${type === "sign-in" ? "sign in" : type === "forget-password" ? "reset your password" : "verify your email"}. It expires in 5 minutes.</p>
              <div style="font-size:36px;font-weight:700;letter-spacing:8px;
                          color:#6366f1;padding:16px 0;text-align:center">
                ${otp}
              </div>
              <p style="color:#94a3b8;font-size:12px">
                If you didn't request this code, ignore this email.
              </p>
            </div>
          `,
        }).catch((error: unknown) => {
          console.error("[Email Delivery Error] otp", error);
        });
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 5,
      rateLimit: {
        window: 60,
        max: 3,
      },
    }),

    // ── Admin / RBAC ─────────────────────────────────────────
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage:
        "Your account has been suspended. Contact support if you believe this is an error.",
    }),

    // ── Next.js cookies (must be last) ───────────────────────
    nextCookies(),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
