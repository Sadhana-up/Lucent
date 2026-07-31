import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
  user: {
    additionalFields: {
      // initialRole is accepted as user input (customer | seller) at sign-up time only.
      // The databaseHook below reads it and writes the real "role" field managed by admin plugin.
      initialRole: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const allowedRoles = ["user", "seller"];
          // Read initialRole passed during sign-up, fall back to "user"
          const requested = (user as Record<string, unknown>)["initialRole"] as string | undefined;
          const role = requested && allowedRoles.includes(requested) ? requested : "user";

          return {
            data: {
              ...user,
              role,
              // Clear initialRole so it doesn't pollute the DB column
              initialRole: undefined,
            },
          };
        },
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  rateLimit: {
    enabled: true,
    window: 60, // 60-second window
    max: 20,    // max 20 auth requests per window
  },
});
