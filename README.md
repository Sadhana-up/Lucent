This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local, production-like setup (HTTPS behind nginx)

Postgres and nginx run in Docker. **Next.js and FastAPI run on the host** as
production builds, behind nginx over HTTPS — same shape as production.

One-time setup:

```bash
npm ci                 # Node deps
npx prisma generate    # Prisma client
npm run build          # production Next.js build (.next)

cd server && uv sync && cd ..   # FastAPI deps -> server/.venv (Python 3.13)

docker compose -f docker-compose.local.yml up -d   # Postgres + nginx only
npx prisma migrate deploy                          # apply migrations to the Docker DB
npm run db:seed                                    # sample data (needs PEXELS_API_KEY)
```

> **Restart Next.js after seeding.** The production server snapshots `public/` at
> startup, so images downloaded by `db:seed` after it started return 404 until
> `npm run start` is restarted. Seed first, then start the server.

Start the two host servers, in two terminals:

```bash
npm run start                                             # Next.js build, port 3000
cd server && uv run uvicorn main:app --host 0.0.0.0 --port 8000   # FastAPI, port 8000
```

Open **https://localhost** and accept the self-signed certificate warning.

- nginx (container) terminates TLS and proxies to `lucent-host:3000` (an IPv4 host-gateway
  alias; using `host.docker.internal` directly makes Docker Desktop hand nginx an
  unreachable IPv6 address first).
- Next.js proxies `/api/chat` to `http://localhost:8000` (FastAPI) via `CHAT_BACKEND_URL`.
- Files for this mode: `docker-compose.local.yml`, `nginx/nginx.local.conf`, and
  certs in `nginx/certs/` (generated locally, gitignored).
- **HTTPS certs are made with [mkcert](https://github.com/FiloSottile/mkcert), not raw
  OpenSSL.** A plain self-signed cert is not in the OS/browser trust store, so Chrome
  shows "Not secure". `mkcert` creates a local CA, installs it in the Windows trust
  store (`mkcert -install`, already done here), and signs certs with it — so the browser
  trusts `https://localhost` with no warning. To regenerate:
  ```bash
  mkcert -cert-file nginx/certs/lucent.crt -key-file nginx/certs/lucent.key \
    localhost 127.0.0.1 ::1 lucentnepal.com www.lucentnepal.com
  docker compose -f docker-compose.local.yml up -d --force-recreate nginx
  ```
  (On Windows, `curl` may need `--ssl-no-revoke` because mkcert certs have no CRL;
  browsers do not.)

### Browser still says "Not secure"?

The CA is installed in `CurrentUser\Root` and a **fresh Chrome / PowerShell trusts the
cert** — so if your everyday profile still complains, Chrome is remembering the old
certificate (or a click-through/HSTS exception) for `localhost`. Clearing cookies does
**not** clear that.

1. Confirm the setup: open **Incognito** → `https://127.0.0.1`. A lock icon means the
   cert and CA are fine and only your normal profile is stale.
2. Fix the normal profile:
   - `chrome://net-internals/#hsts` → "Delete domain security policies" → `localhost` → Delete.
   - `chrome://settings/content/all` → search `localhost` → delete its data.
   - Quit Chrome **completely** (verify no `chrome.exe` remains in Task Manager), then reopen.
3. Quick workaround if you don't want to touch the profile: use `https://127.0.0.1`
   (the mkcert cert includes that IP SAN), or a fresh Chrome profile.

- No Redis container: nothing in the app connects to Redis (rate limiting is in-memory).
- To use the real Let's Encrypt setup instead, use the original `docker-compose.yml`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.



                Selfie
                   │
                   ▼
        Face Detection (MediaPipe)
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
 Acne Model   Dark Spot     Wrinkle
                Model         Model
      │            │            │
      └────────────┼────────────┘
                   ▼
        Vision Results (JSON)
                   │
                   ▼
      User Questionnaire
                   │
                   ▼
        Combined Skin Profile
                   │
                   ▼
          LLM Recommendation
                   │
                   ▼
 Morning Routine • Night Routine
 Ingredient Advice • Progress Tips


