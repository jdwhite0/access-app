# ACCESS OS — Canonical paths

## Roots

| Role | Absolute path |
|------|----------------|
| **ACCESS app (Next.js, Supabase SQL, `.env.local`)** | `/Users/jdproductions/Documents/JD_Ai_System/access-app` |
| **Ecosystem / Intelligence Vault (local files)** | `/Users/jdproductions/Documents/JD_Ai_System` |
| **Connector package cwd** | `access-app/packages/access-connector` |

There is **no** `access app` folder at the monorepo root. Legacy doctrine lives at `access-app/docs/legacy-doctrine/`.

## Commands (copy-paste)

```bash
# App, Supabase verify, dev server, M4 scripts
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
npm run platform:verify-m0
npm run dev

# Connector (via app root — recommended)
cd /Users/jdproductions/Documents/JD_Ai_System/access-app
export ACCESS_VAULT_ROOT="/Users/jdproductions/Documents/JD_Ai_System"
npm run connector:scan
```

## Environment

| File | Used by |
|------|---------|
| `access-app/.env.local` | Next.js (`npm run dev`), server actions, verify scripts |
| `access-app/.env.local.example` | Template only |
| Connector | Reads `ACCESS_API_BASE_URL` from `packages/access-connector/.env.local` or `../../.env.local` — never service role |

## Supabase SQL apply order

See `supabase/APPLY_ORDER.md`:

1. `schema.sql`
2. `schema_v2.sql`
3. `schema_v3_vault.sql`
4. `schema_v4_platform_hardening.sql`
5. `schema_v4_m2_tenant_jwt.sql`

Then: `npm run platform:verify-m0` from **access-app**.

## Guardrails

- `npm run preflight` — checks cwd is access-app
- Wrong directory → scripts exit with the `cd` path above

## Archive

Monorepo `archive/audit-access-app-2026-06-02/` — stale audit snapshot; do not use for development.
