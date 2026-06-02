# ACCESS Repository Map

**Repo root:** `/Users/jdproductions/Documents/JD_Ai_System/access-app`  
**Git remote:** `https://github.com/jdwhite0/access-app.git`  
**Status:** Structural stabilization applied (2026-06-02). See [ACCESS_STRUCTURE.md](./ACCESS_STRUCTURE.md).

---

## Current structure (visual tree)

```
access-app/                          # Git root — Vercel project "app"
├── app/                             # RUNTIME — Next.js App Router
│   ├── page.tsx                     # Home / Command Center
│   ├── layout.tsx                   # ClerkProvider root
│   ├── globals.css
│   ├── founder/page.tsx
│   ├── companion/page.tsx
│   ├── sso-callback/page.tsx
│   ├── projects/[id]/page.tsx
│   └── api/internal/handle-context/route.ts
├── components/                      # RUNTIME — React UI
│   ├── access/                      # Landing, registry, nav
│   ├── founder/                     # FounderBlueprintWizard
│   ├── jyson/                       # Companion panels
│   ├── CommandCenter.tsx
│   ├── CommandOutput.tsx
│   └── TerminalLanding.tsx
├── lib/                             # RUNTIME — server + shared logic
│   ├── actions/                     # Server actions (Clerk-gated)
│   ├── access-handle/               # Handle context, package loader
│   ├── blueprint/                   # Founder blueprint merge/validate
│   ├── founder-os/                  # Package generation
│   ├── founder-wizard/
│   ├── jyson-bridge/                # JYSON context + dispatch
│   └── supabase.ts                  # Supabase admin client
├── types/                           # RUNTIME — TypeScript types
├── public/                          # RUNTIME — static assets
├── proxy.ts                         # RUNTIME — Clerk middleware (root)
├── next.config.ts                   # CONFIG
├── tsconfig.json                    # CONFIG (paths → ../ monorepo siblings)
├── postcss.config.mjs               # CONFIG
├── eslint.config.mjs                # CONFIG
├── package.json                     # CONFIG
├── package-lock.json                # CONFIG
├── schemas/                         # CONFIG — blueprint JSON schema
│   └── blueprint.schema.mvp.json
├── supabase/                        # SQL migrations — APPLY_ORDER.md
│   ├── schema.sql … schema_v4_m2_tenant_jwt.sql
├── fixtures/                        # CONFIG — test/export fixtures
├── scripts/                         # SCRIPTS + preflight-access-app-root.mjs
├── docs/                            # DOCUMENTATION
│   ├── legacy-doctrine/             # ARCHIVED (renamed from "access app/")
│   ├── FUTURE_JYSON_COMPANION_UI.md
│   └── screenshots/
├── ACCESS_STRUCTURE.md              # Canonical paths + commands
├── .env.local                       # ENV — active (must stay at root)
├── .env.local.example               # ENV — template
├── .env.preview.local               # ENV — backup (Vercel pull)
├── .env.local.vercel-pull-empty     # ENV — backup (empty pull)
├── .env.local.app                   # ENV — failed partial pull
├── .vercel/                         # DEPLOYMENT — link metadata (gitignored)
│   └── project.json
├── .clerk/                          # GENERATED — local Clerk cache (gitignored)
├── .next/                           # GENERATED — build output (gitignored)
├── node_modules/                    # GENERATED — dependencies (gitignored)
├── next-env.d.ts                    # GENERATED — Next types (gitignored)
├── README.md                        # DOCUMENTATION — default create-next-app (stale)
├── AGENTS.md                        # DOCUMENTATION — agent rules
├── CLAUDE.md                        # DOCUMENTATION — points to AGENTS.md
├── DEVELOPER_GUIDE.md               # DOCUMENTATION — this guide (new)
└── REPOSITORY_MAP.md                # DOCUMENTATION — this file (new)
```

### Scripts inventory (current)

| Script | Category | Purpose |
|--------|----------|---------|
| `scripts/e2e-founder-pipeline.ts` | E2E / verify | Backend founder flow |
| `scripts/test-founder-blueprint.ts` | Verify | Blueprint validation |
| `scripts/verify-jyson-command-p10.ts` | Verify | JYSON P10 command |
| `scripts/verify-local-env-once.ts` | Audit / diagnostics | Local env check (no secrets) |
| `scripts/export-handle-context-once.ts` | Dev | Export handle context |
| `scripts/dispatch-once.ts` | Dev | One-off dispatch |

---

## File classification

| Class | Paths |
|-------|--------|
| **Runtime** | `app/`, `components/`, `lib/`, `types/`, `public/`, `proxy.ts` |
| **Configuration** | `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `schemas/`, `supabase/` |
| **Environment** | `.env.local`, `.env.local.example`, `.env.preview.local`, `.env.local.*` backups |
| **Deployment** | `.vercel/`, Vercel dashboard (external), git `origin` → GitHub |
| **Scripts** | `scripts/*.ts` |
| **Generated** | `.next/`, `node_modules/`, `next-env.d.ts`, `.clerk/` |
| **Documentation** | `docs/`, `DEVELOPER_GUIDE.md`, `REPOSITORY_MAP.md`, `AGENTS.md`, `CLAUDE.md` |
| **Legacy / archive** | `docs/legacy-doctrine/` (doctrine only), root `README.md` (CRA boilerplate) |
| **Fixtures** | `fixtures/` |
| **Unused / low value** | `docs/legacy-doctrine/app/` (empty stub), `docs/legacy-doctrine/ui/` (empty) |

### Duplicate / overlap notes

| Item | Issue |
|------|--------|
| `docs/legacy-doctrine/` | Archived doctrine; not imported by Next.js — use `app/` for routes |
| `schemas/blueprint.schema.mvp.json` vs monorepo `schemas/` | May drift; single source of truth unclear |
| Multiple `.env.local*` backups at root | Clutters navigation; safe to archive under `environments/backups/` |

### External dependencies (not in this repo)

| System | Location when in monorepo |
|--------|---------------------------|
| Founder OS packages | `../founder-os/` |
| access-agent-runtime | `../access-agent-runtime/` |
| jyson-runtime | `../jyson-runtime/` |
| JYSON Vite app | `../jyson/` (separate git) |

---

## Recommended structure (target)

**Principle:** Keep Next.js-required paths at root. Group everything else for clarity.

```
access-app/
├── app/                             # UNCHANGED — Next.js routes
├── components/                      # UNCHANGED
├── lib/                             # UNCHANGED
├── types/                           # UNCHANGED
├── public/                          # UNCHANGED
├── proxy.ts                         # UNCHANGED — Clerk middleware
├── next.config.ts                   # UNCHANGED
├── tsconfig.json                    # UNCHANGED (until path aliases approved)
├── package.json                     # UPDATE script paths only if scripts move
│
├── .env.local                       # STAYS AT ROOT (Next.js requirement)
│
├── config/                          # NEW — non-runtime configuration hub
│   ├── environments/
│   │   ├── README.md                # Where secrets live, how to pull from Vercel
│   │   ├── .env.local.example       # COPY or symlink from root template
│   │   └── backups/                 # .env.preview.local, .env.local.vercel-pull-empty, etc.
│   ├── deployment/
│   │   ├── README.md                # vercel link, branch, GitHub repo
│   │   └── vercel.project.json.example
│   └── supabase/                    # OPTIONAL MOVE from root supabase/
│       ├── schema.sql
│       └── schema_v2.sql
│
├── scripts/
│   ├── dev/                         # export-handle-context-once, dispatch-once
│   ├── e2e/                         # e2e-founder-pipeline
│   ├── verify/                      # test-founder-blueprint, verify-jyson-command-p10
│   └── audit/                       # verify-local-env-once
│
├── docs/
│   ├── product/                     # FUTURE_JYSON_COMPANION_UI.md
│   ├── architecture/                # optional merge from legacy-doctrine/docs/architecture
│   ├── doctrine/                    # optional merge from legacy-doctrine/docs/doctrine
│   ├── vision/                      # optional merge from legacy-doctrine/docs/vision
│   ├── ecosystem/                   # optional merge from legacy-doctrine/docs/ecosystem
│   ├── screenshots/                 # existing
│   └── legacy/                      # ACCESS_AGENT.md, JYSON.md from nested folder
│
├── fixtures/                        # UNCHANGED
├── schemas/                         # UNCHANGED (or move to config/schemas/ with import audit)
│
├── environments/                  # ALT: flat README-only pointer if config/ not preferred
│   └── README.md → points to root .env.local
│
├── deployment/                      # ALT: top-level deployment README + link docs
│   └── README.md
│
├── DEVELOPER_GUIDE.md               # Root navigation entry
├── REPOSITORY_MAP.md                # This file
└── README.md                        # REPLACE CRA boilerplate with pointer to DEVELOPER_GUIDE
```

**Done:** `access app/` renamed to `docs/legacy-doctrine/`. Monorepo `.audit/access-app` moved to `../archive/audit-access-app-2026-06-02/`.

---

## Navigation map (logical)

```
ACCESS (access-app)
├── Runtime
│   ├── app/                    → routes (/, /founder, /companion, API)
│   ├── components/             → UI by domain (access, founder, jyson)
│   ├── lib/                    → business logic + server actions
│   ├── types/                  → shared TS types
│   ├── public/                 → static files
│   └── proxy.ts                → Clerk middleware
│
├── Configuration
│   ├── package.json
│   ├── tsconfig.json           → @/* paths; monorepo sibling imports
│   ├── next.config.ts
│   ├── schemas/
│   └── supabase/ (or config/supabase/)
│
├── Environments
│   ├── .env.local              → ACTIVE (root only)
│   └── config/environments/    → templates + backups + README
│
├── Deployment
│   ├── .vercel/                → local link (gitignored)
│   └── config/deployment/      → human docs
│
├── Scripts
│   ├── scripts/dev/
│   ├── scripts/e2e/
│   ├── scripts/verify/
│   └── scripts/audit/
│
├── Documentation
│   ├── DEVELOPER_GUIDE.md
│   ├── REPOSITORY_MAP.md
│   ├── docs/
│   └── AGENTS.md / CLAUDE.md
│
├── Generated (never commit)
│   ├── .next/
│   ├── node_modules/
│   ├── .clerk/
│   └── next-env.d.ts
│
└── Legacy (to archive)
    └── legacy-doctrine/        → archived under docs/legacy-doctrine/
```

---

## Reorganization report

### 1. Current structure

- **Strengths:** Standard Next.js layout (`app/`, `lib/`, `components/`); clear domain folders under `lib/` and `components/`.
- **Resolved:** `access app/` renamed to `docs/legacy-doctrine/`. Remaining: env backup files at root; scripts still flat (optional future grouping).

### 2. Recommended structure

See **Recommended structure (target)** above. Focus on `docs/` consolidation, `config/environments/` + `config/deployment/`, and `scripts/` subfolders.

### 3. Safe changes (approve before executing)

| Change | Risk | Notes |
|--------|------|-------|
| Add `DEVELOPER_GUIDE.md`, `REPOSITORY_MAP.md` | None | Done in this audit |
| Replace root `README.md` with link to developer guide | Low | No import impact |
| Move `.env.preview.local`, `.env.local.vercel-pull-empty`, `.env.local.app` → `config/environments/backups/` | Low | Not loaded by Next.js |
| Add `config/environments/README.md` | None | Documents root `.env.local` requirement |
| Merge `docs/legacy-doctrine/docs/**` → `docs/**` | Low | No runtime imports |
| Move `docs/screenshots/` → `docs/verification/` | Low | Paths in markdown only |
| Move `ACCESS_AGENT.md` → `docs/legacy/ACCESS_AGENT.md` | Low | Update links in docs |
| Organize `scripts/` into subfolders + update `package.json` script paths | **Medium** | Must update npm scripts |
| Add `scripts/audit/` and move `verify-local-env-once.ts` | Low | Optional path in docs |

### 4. Risky changes (require explicit approval + verification)

| Change | Risk | Why |
|--------|------|-----|
| Move `app/`, `lib/`, `components/` | **Breaking** | Next.js conventions + `@/*` imports |
| Move `proxy.ts` | **Breaking** | Next.js 16 expects root middleware name/location |
| Move `.env.local` away from root | **Breaking** | Next.js will not load it |
| Move `supabase/` without updating docs/tooling | Medium | Human reference paths |
| Rename `lib/*` or `components/*` files | **Breaking** | Import graph |
| Delete `docs/legacy-doctrine/` before merge verification | Medium | Possible unique files |
| Change `tsconfig.json` monorepo paths (`../jyson-runtime`) | **Breaking** | Dispatch + agent context loaders |
| Commit `.env.local` | **Security** | Currently gitignored via `.env*` |

### 5. Files that must remain untouched (runtime)

```
app/
components/
lib/
types/
public/
proxy.ts
next.config.ts
tsconfig.json          # paths block — review only with approval
package.json           # dependency + script entry points
postcss.config.mjs
eslint.config.mjs
.env.local             # location fixed at root; values only edited by developer
schemas/blueprint.schema.mvp.json   # imported by validation code
fixtures/              # referenced by scripts/tests
```

**Import-critical files (sample — not exhaustive):**

- `lib/supabase.ts`
- `lib/jyson-bridge/jyson-runtime-loader.ts` (hardcoded `../jyson-runtime`)
- `lib/access-handle/package-loader.ts` (hardcoded `../founder-os`)
- `app/api/internal/handle-context/route.ts`
- All `lib/actions/*.ts` server actions

---

## Approval checklist (before any moves)

- [x] `access app/` renamed to `docs/legacy-doctrine/` (2026-06-02)
- [ ] Confirm `docs/legacy-doctrine/` has no unique content vs `docs/` after diff
- [ ] Approve `scripts/` subdirectory move + `package.json` updates
- [ ] Approve env backup relocation (keep `.env.local` + `.env.local.example` at root)
- [ ] Run `npm run build` after each phase
- [ ] Run `npx tsx scripts/verify-local-env-once.ts` after env doc changes
- [ ] Push only from `access-app/` git root for Vercel deploy

---

*Generated: repository organization audit. No files were moved or deleted.*
