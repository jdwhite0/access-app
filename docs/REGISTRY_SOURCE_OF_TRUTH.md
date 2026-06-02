# Registry source of truth

## Layers

| Layer | Role | Stores |
|-------|------|--------|
| **Local Intelligence Vault** (e.g. JD_AI_System on disk) | Origin of truth for files, doctrine, projects | Full content — stays on the operator machine |
| **ACCESS Connector** | Compiler and gatekeeper | Scan reports, compile summaries, sync plans (local only in Phase 3) |
| **ACCESS Cloud (Supabase)** | Structured OS picture | Identity, registry rows, vault connection status, sync runs, provenance metadata |
| **ACCESS App (Vercel)** | Orientation UI | Reads Supabase via server actions — never reads local filesystem |

## Rules

1. **No file bodies in Supabase** — only names, handles, status, counts, hashes, relative source refs.
2. **No secrets** — no `.env`, tokens, API keys, or service role keys in committed connector config.
3. **No absolute local paths in cloud** — `source_path` is vault-relative; vault root exists only in `ACCESS_VAULT_ROOT` env locally.
4. **Canonical owner** — every row is scoped by `identity_id` (and `clerk_user_id` for queries). Multi-user from day one.
5. **Providers and cloud never get filesystem access** — AI agents reason over connector-approved metadata scopes only.
6. **Service role** — may be used server-side and in local dev connector probes only; not the long-term public platform auth model. Production path: identity-scoped, device-scoped, revocable connector tokens.

## Sync direction (Phase 4+)

```
Local vault → Connector scan/compile → Approved metadata → Supabase registry
```

Until sync apply is implemented, the connector produces `vault-scan-report.json`, `vault-compile-summary.json`, and sync plans with `applyToCloud: false`.

## JD_AI_System

Jerry’s monorepo vault is a **local intelligence vault**. ACCESS registers it via `vault_connections` (`vault_key`, status, last sync). Dev seed for `JD_AI_System` is isolated in `lib/vault/dev-seed.ts` and `supabase/seed_dev_jd_ai_system_vault.sql` — not embedded in generic provisioning (`primary_vault` for all users).
