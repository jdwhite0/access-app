#!/usr/bin/env bash
# Local email intake test — reads secret from .env.local (Terminal 2, not npm run dev tab)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "error: missing .env.local in $ROOT" >&2
  exit 1
fi

SECRET="$(grep -E '^INTERNAL_EMAIL_API_SECRET=' .env.local | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')"
if [[ -z "$SECRET" ]]; then
  echo "error: INTERNAL_EMAIL_API_SECRET not set in .env.local" >&2
  exit 1
fi

echo "→ POST /api/internal/email/intake (localhost:3000)" >&2
curl -sS -X POST "http://localhost:3000/api/internal/email/intake" \
  -H "Content-Type: application/json" \
  -H "x-internal-email-secret: ${SECRET}" \
  -d '{"source_type":"jdai_dossier","source_id":"terminal-test","payload":{"handle":"jdwhite.access","system_status":"OK","intelligence_summary":"Terminal test","recommended_action":"Run dispatch next","product_tip":"Use npm run email:dispatch"}}'
echo ""
