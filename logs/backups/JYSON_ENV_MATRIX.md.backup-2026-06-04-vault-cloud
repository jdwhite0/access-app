# JYSON environment matrix

How ACCESS + JYSON Core behave by deployment mode. Vault excerpt chat and OpenJarvis live tools are **separate** capabilities.

## Capability split

| Capability | What it uses | Blocked when |
|------------|--------------|--------------|
| **Orb chat (general)** | `POST /api/jyson/chat` → local Claude or `jyson.vercel.app` | Missing API keys / proxy down |
| **Vault excerpt Q&A** | `.jyson-vault-index` + `[JYSON VAULT CONTENT]` preamble | `PRIVATE_JYSON_ENABLED` off, or no vault path on host |
| **OpenJarvis live tools** | `PRIVATE_JYSON_ENABLED=true` + OpenJarvis `GET /health` on `:8000` | Private off, server down, or not installed |
| **Connector heartbeat** | `connector_devices` TTL (vault sync / pairing) | Optional for local file tools on founder Mac |

Connector offline does **not** block vault excerpt Q&A when excerpts are injected.  
Connector offline does **not** block OpenJarvis file tools when private layer + server are up on the same machine.

Start server: `cd access-app && npm run openjarvis:serve` — see `docs/DEVELOPER_GUIDE.md#openjarvis-local-setup`.

---

## Local founder (`next dev` on Mac)

| Variable | Required | Role |
|----------|----------|------|
| `PRIVATE_JYSON_ENABLED=true` | Yes | Enables vault index retrieval + local harness (not on Vercel) |
| `ANTHROPIC_API_KEY` | Yes for local Claude | Streams via `access-local-claude` (no jyson.vercel hop) |
| `JYSON_INTERNAL_API_URL` | Optional | `http://127.0.0.1:3000` when testing jyson package locally |
| `GOOGLE_API_KEY` | Optional | Research routing on jyson Core only |
| `GEMINI_MODEL` | Optional | Default `gemini-2.5-flash` on jyson deploy |

**Harness:** `X-JYSON-Harness: access-local-claude` when Private JYSON + Anthropic key.

**Vault index:** `cd access-app && npm run jyson:vault:index`

**OpenJarvis (live tools):** 3 terminals — see [OPENJARVIS_FOUNDER_SETUP.md](./OPENJARVIS_FOUNDER_SETUP.md) (`dev` + `connector:heartbeat` + `openjarvis:serve`).

**Dev log:** `[jyson/chat]` — `retrievedChunkCount`, `firstSource`, `finalPromptHasVaultContext`.

---

## Production ACCESS user (Vercel)

| Variable | Typical | Role |
|----------|---------|------|
| `PRIVATE_JYSON_ENABLED` | **unset / false** | Vercel sets `VERCEL=1` — private layer off |
| `ANTHROPIC_API_KEY` | On ACCESS or jyson | Fallback if proxy fails |
| `NEXT_PUBLIC_JYSON_URL` | `https://jyson.vercel.app` | Default chat proxy |

**Chat path:** ACCESS → JYSON Core proxy. General conversation + ACCESS context block. No local vault index on Vercel unless you add a cloud vault pipeline later.

---

## Production JYSON Core (`jyson.vercel.app`)

| Variable | Required | Role |
|----------|----------|------|
| `ANTHROPIC_API_KEY` | Yes (primary) | Claude for default + **all vault-grounded** turns |
| `GOOGLE_API_KEY` | For research | `gemini-2.5-flash` research route |
| `GEMINI_MODEL` | Recommended | Set `gemini-2.5-flash` (retired 1.5 models auto-map) |
| `OPENAI_API_KEY` | Optional | Fallback chain |

**Routing:** Messages containing `[JYSON VAULT CONTENT]` → Claude only (`resolveModelRoute`).

**Redeploy after env change:** Vercel project `jyson-system` → Environment Variables → redeploy.

---

## Manual test strings (orb)

| Prompt | Expected |
|--------|----------|
| `What are my priorities today?` | Cites `brain/priorities.md` or `daily/today.md` from excerpts; no “connect connector” deflection |
| `Explain OAuth in simple terms` | Normal conversational answer; no DISCOVERY REPORT boilerplate |
| `What is my connector status?` | Explains connector vs vault excerpts; does not block vault answer on same turn if excerpts present |

---

## Deploy checklist (production users)

1. **jyson:** `GEMINI_MODEL=gemini-2.5-flash`, `ANTHROPIC_API_KEY`, optional `GOOGLE_API_KEY` → redeploy.
2. **access-app:** `NEXT_PUBLIC_JYSON_URL=https://jyson.vercel.app` (or `JYSON_INTERNAL_API_URL` for staging).
3. Confirm `POST /api/chat` returns `X-JYSON-Model: claude` for vault-grounded test payload.
4. Founder local: keep `PRIVATE_JYSON_ENABLED=true` + re-run `npm run jyson:vault:index` after vault edits.
