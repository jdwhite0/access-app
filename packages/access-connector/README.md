# ACCESS Local Connector

Metadata-only compiler between your **Intelligence Vault** (local) and **ACCESS Cloud** (Supabase).

ACCESS Cloud and Vercel **never** read your filesystem. This package runs on your machine.

## Quick start

```bash
cd access-app/packages/access-connector
npm install
cp config.example.json config.local.json
```

Set locally (never commit):

```bash
export ACCESS_VAULT_ROOT="/absolute/path/to/your/vault"  # e.g. JD_Ai_System repo root
```

## Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev entry / help |
| `npm run scan` | Walk vault → `vault-scan-report.json` |
| `npm run compile` | Registry candidates → `vault-compile-summary.json` |
| `npm run sync:plan` | Safe upsert plan (stdout, no cloud writes) |

From `access-app` root:

```bash
npm run connector:scan
npm run connector:compile
npm run connector:sync-plan
```

## What is scanned

- Markdown, JSON, YAML, SQL, TS, HTML, shell — **metadata only** (path, size, mtime)
- Skips: `node_modules`, `.git`, `.next`, `.vercel`, `.env*`, secrets, keys

## What is not done yet

- No upload to Supabase
- No service role key in committed files
- No file body reads for sync

See `../../docs/REGISTRY_SOURCE_OF_TRUTH.md` and `../../docs/PHASE_3_PLATFORM_FOUNDATION.md`.
