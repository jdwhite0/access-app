#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "[access-bridge] Keeping connector online (heartbeat every 45s). Press Ctrl+C to stop."
while true; do
  npm run connector:heartbeat >/dev/null 2>&1 || npm run connector:heartbeat || true
  sleep 45
done
