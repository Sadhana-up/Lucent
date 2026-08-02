FROM node:20-alpine AS base

# ---- deps ----
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install deps + generate Prisma client for Prisma 6
RUN npm ci
RUN npx prisma generate

# ---- builder ----
FROM base AS builder
WORKDIR /app

# Build-time env vars required by Next.js
ARG BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET
ARG DATABASE_URL
ARG CHAT_BACKEND_URL
ARG INTERNAL_API_KEY
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG RESEND_API_KEY
ARG EMAIL_FROM
ARG DEV_EMAIL_OVERRIDE

ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV CHAT_BACKEND_URL=$CHAT_BACKEND_URL
ENV INTERNAL_API_KEY=$INTERNAL_API_KEY
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV EMAIL_FROM=$EMAIL_FROM
ENV DEV_EMAIL_OVERRIDE=$DEV_EMAIL_OVERRIDE

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate again (schema may have changed)
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy standalone output (Next.js 16)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy full node_modules for Prisma CLI (needed for runtime migrations)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema + config for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

# Copy entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
