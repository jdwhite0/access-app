#!/usr/bin/env bash
# Local email dispatch test — run after email:intake
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SECRET="$(grep -E '^INTERNAL_EMAIL_API_SECRET=' .env.local | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')"
if [[ -z "$SECRET" ]]; then
  echo "error: INTERNAL_EMAIL_API_SECRET not set in .env.local" >&2
  exit 1
fi

echo "→ POST /api/internal/email/dispatch (localhost:3000)" >&2
curl -sS -X POST "http://localhost:3000/api/internal/email/dispatch?limit=5" \
  -H "x-internal-email-secret: ${SECRET}"
echo ""
