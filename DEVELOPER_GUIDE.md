# ACCESS Developer Guide

**Repository:** [jdwhite0/access-app](https://github.com/jdwhite0/access-app)  
**Vercel project:** `app` (team: `jd-white-s-projects`)  
**Production URL:** https://app-iota-inky-62.vercel.app

This guide is for **human navigation and local development**. It does not change application architecture.

---

## What ACCESS is

ACCESS is the **identity and gateway layer** of JD AI Systems — a Next.js 16 app that provides:

- **ACCESS Handle** — permanent ownership anchor (e.g. `jdwhite.access`)
- **Clerk authentication** — sign-in and session
- **Supabase** — canonical identity and Founder Blueprint persistence
- **Founder OS** — blueprint export/materialization (filesystem packages)
- **JYSON bridge** — read-only companion context and command dispatch (via sibling monorepo runtimes when present)

ACCESS is **not** the cinematic JD System portal (`jd-system` / `landing_page`). That is a separate repo and Vercel project.

---

## Repository layout (quick)

See **[REPOSITORY_MAP.md](./REPOSITORY_MAP.md)** for the full tree and reorganization plan.

| Area | Location |
|------|----------|
| Next.js routes | `app/` |
| UI components | `components/` |
| Server logic | `lib/` |
| Auth middleware | `proxy.ts` (root) |
| Env (active) | **`.env.local`** (repo root — required by Next.js) |
| Env templates | `.env.local.example`, `environments/` (planned) |
| Vercel link | `.vercel/project.json` (gitignored) |
| SQL reference | `supabase/` |
| Test fixtures | `fixtures/` |
| JSON schema | `schemas/` |
| Scripts | `scripts/` |
| Product docs | `docs/` |
| Legacy doctrine (archived) | `docs/legacy-doctrine/` (was `access app/`) |

---

## Environment variables

### Where they live

| File | Purpose |
|------|---------|
| **`.env.local`** | **Active local secrets** — Next.js loads this automatically. Must stay at **repo root**. |
| `.env.local.example` | Template (no secrets). Copy to `.env.local` and fill. |
| `.env.preview.local` | Vercel CLI preview pull (backup; not used by default) |
| `.env.local.vercel-pull-empty` | Failed/empty CLI pull backup — do not use as source of truth |

### Required for local auth

| Variable | Scope |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client + server |
| `CLERK_SECRET_KEY` | Server only |

### Recommended for persistence

| Variable | Scope |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL (or use `SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (never expose to client) |

### Optional

| Variable | Purpose |
|----------|---------|
| `ACCESS_INTERNAL_KEY` | Protects `/api/internal/handle-context` in production |
| `FOUNDER_OS_OUTPUT_ROOT` | Override path to Founder OS packages (default: `../founder-os`) |
| `NEXT_PUBLIC_JYSON_URL` | “Start with JYSON” link (default: `https://jyson.vercel.app`) |

### Vercel

Variables are set in **Vercel → Project `app` → Environment Variables** (Preview + Production).

**Note:** `vercel env pull` on this machine has produced **empty quoted values** (`""`). Prefer pasting from the Vercel dashboard into `.env.local`, or use:

```bash
vercel env run -e production -- npm run dev
```

(Only works if the CLI injects non-empty secrets on your account.)

---

## Clerk configuration

| Item | Location |
|------|----------|
| Middleware | `proxy.ts` — `clerkMiddleware()` |
| Provider | `app/layout.tsx` — `<ClerkProvider>` |
| Server auth | `auth()` from `@clerk/nextjs/server` in pages/actions |
| Client auth | `useAuth()` in `app/page.tsx`, components |
| Local Clerk cache | `.clerk/` (gitignored) |
| Env keys | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

**Clerk Dashboard:** Configure redirect URLs for `http://localhost:3000` and production domain.

---

## Supabase configuration

| Item | Location |
|------|----------|
| Admin client | `lib/supabase.ts` — `createSupabaseAdmin()`, `isSupabaseConfigured()` |
| Schema reference | `supabase/` — apply order in `supabase/APPLY_ORDER.md` |
| Env keys | `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Usage | `lib/actions/identity.ts`, `lib/actions/founder-blueprint.ts`, diagnostics |

No `SUPABASE_ANON_KEY` in this codebase — service role only on server.

---

## Vercel configuration

| Item | Location |
|------|----------|
| Project link | `.vercel/project.json` (created by `vercel link`) |
| Project name | `app` |
| Project ID | `prj_qI1jWN6cV0SeEYbbmbh2YxqeQtI3` |
| Deploy trigger | Push to **`main`** on `jdwhite0/access-app` (Git integration) |
| Build | `npm run build` (default Next.js) |

Link locally:

```bash
cd access-app
vercel link --yes --project app --scope jd-white-s-projects
```

---

## JYSON

| Item | Location |
|------|----------|
| In-app UI | `components/jyson/`, `app/companion/page.tsx` |
| Bridge / context | `lib/jyson-bridge/` |
| External app repo | `jdwhite0/jyson-system` → https://jyson.vercel.app |
| Env (ACCESS) | `NEXT_PUBLIC_JYSON_URL` (optional) |
| Env (JYSON app) | `VITE_ACCESS_BASE_URL`, `VITE_ACCESS_INTERNAL_KEY` in **jyson** repo |

**Monorepo note:** When `access-app` lives inside `JD_Ai_System`, dispatch scripts load `../jyson-runtime/` and `../access-agent-runtime/` via filesystem paths (`lib/jyson-bridge/jyson-runtime-loader.ts`). Standalone clone on Vercel may not include those folders unless added to the deploy.

---

## Founder OS packages

| Item | Location |
|------|----------|
| Default output root | `../founder-os/<founder-os-id>/` relative to `access-app` cwd |
| Override | `FOUNDER_OS_OUTPUT_ROOT` env |
| Package loader | `lib/access-handle/package-loader.ts` |
| Materialization | `lib/founder-os/generate-package.ts` |
| Example packages | `../founder-os/jdwhite-founder-os/`, `e2e-testfounder-founder-os/` (monorepo sibling) |
| Fixtures | `fixtures/founder-blueprint.fixture.json`, `*.export.yaml` |

---

## Generated artifacts (do not commit)

| Path | Purpose |
|------|---------|
| `node_modules/` | npm dependencies (~494 MB) |
| `.next/` | Next.js build + dev output (~444 MB) |
| `next-env.d.ts` | Generated types (gitignored) |
| `.clerk/.tmp/` | Clerk keyless dev cache |

Regenerate with `npm run dev` or `npm run build`.

---

## How to run locally

### Prerequisites

- Node.js 20+ (project tested on v24 via nvm)
- npm
- Filled **`.env.local`** at repo root (four keys minimum for auth + DB)

### Commands

```bash
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
npm run preflight
npm install
npm run build    # optional sanity check
npm run dev      # http://localhost:3000
```

### Verify environment (no secrets printed)

```bash
npx tsx scripts/verify-local-env-once.ts
```

### Routes to test

| Route | Expectation |
|-------|-------------|
| `/` | Landing or Command Center after sign-in |
| `/founder` | Founder Blueprint wizard (requires sign-in) |
| `/companion` | JYSON Companion (requires sign-in) |
| `/companion?preview=fixture` | Dev-only fixture (`NODE_ENV=development`) |
| `/api/internal/handle-context?handle=jdwhite.access` | JSON context (dev: open if no `ACCESS_INTERNAL_KEY`) |

### npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server locally |
| `npm run lint` | ESLint |
| `npm run blueprint:test` | Blueprint validation script |
| `npm run e2e:founder` | Founder pipeline E2E (backend) |
| `npm run export-handle-context` | Export handle context fixture |
| `npm run jyson:verify-p10` | JYSON command P10 verification |

---

## How to deploy

ACCESS deploys from the **`access-app` git repository**, not the `jd-system` monorepo root.

```bash
cd access-app
git add -A
git commit -m "Your message"
git push origin main
```

Vercel project **`app`** builds on push to **`main`**. Watch the deploy in the Vercel dashboard.

**Do not** push only monorepo `jd-system` changes expecting ACCESS to update.

---

## Common troubleshooting

### Local server hangs or times out on every route

- **Cause:** Empty Clerk keys in `.env.local` (keys present, values blank).
- **Fix:** Paste real values from Vercel dashboard → Production env.

### `vercel env pull` creates empty values

- **Cause:** CLI does not export decrypted secrets on some accounts.
- **Fix:** Manual paste from dashboard; or `vercel env run -e production -- npm run dev`.

### Supabase “not configured” in UI

- **Cause:** Missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`.
- **Fix:** Add both to `.env.local`; restart dev server.

### Founder / Companion redirect to home

- **Cause:** Not signed in (`auth()` returns no `userId`).
- **Fix:** Sign in via Clerk on `/`; use `?preview=fixture` on companion in dev only.

### JYSON dispatch scripts fail

- **Cause:** `access-app` cloned alone without `../jyson-runtime` and `../access-agent-runtime`.
- **Fix:** Clone full `JD_Ai_System` monorepo layout or adjust paths (architectural change — needs approval).

### Founder OS package not found

- **Cause:** `../founder-os/<id>/` missing or wrong `FOUNDER_OS_OUTPUT_ROOT`.
- **Fix:** Run materialization from monorepo or set `FOUNDER_OS_OUTPUT_ROOT` to absolute path.

### Build passes locally but env missing on Vercel

- **Cause:** Variables only in Preview/Production, not Development.
- **Fix:** Duplicate keys in Vercel for all needed environments.

---

## Related documentation

| Doc | Path |
|-----|------|
| Repository map & reorg plan | [REPOSITORY_MAP.md](./REPOSITORY_MAP.md) |
| Future companion UI | [docs/FUTURE_JYSON_COMPANION_UI.md](./docs/FUTURE_JYSON_COMPANION_UI.md) |
| Legacy doctrine (archived) | `docs/legacy-doctrine/docs/doctrine/` |
| Canonical paths | [ACCESS_STRUCTURE.md](./ACCESS_STRUCTURE.md) |
| Agent rules | [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md) |

---

## Monorepo context

When developed inside `JD_Ai_System`:

```
JD_Ai_System/                    ← ecosystem + Intelligence Vault root
├── access-app/                  ← ACCESS OS app (Next.js, Supabase, connector)
│   ├── app/                     ← Next.js routes (not docs/legacy-doctrine/app)
│   ├── docs/legacy-doctrine/    ← archived doctrine (no spaces in path)
│   └── packages/access-connector/
├── founder-os/
├── access-agent-runtime/
├── jyson-runtime/
├── jyson/
└── archive/                     ← quarantined snapshots (not for dev)
```

Treat **`access-app/`** as the deployable unit for ACCESS on Vercel. There is no root-level `access app` folder.
