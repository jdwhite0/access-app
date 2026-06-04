#!/usr/bin/env bash
# Stable local dev for ACCESS — keep port 3000 alive during agent sessions.
# Agents must NOT kill this process without explicit user request.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"

if command -v lsof >/dev/null 2>&1; then
  if lsof -i ":${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID="$(lsof -i ":${PORT}" -sTCP:LISTEN -t 2>/dev/null | head -1)"
    echo "Dev server already on http://127.0.0.1:${PORT}/ (pid ${PID}). Not restarting."
    echo "Policy: agents must NOT kill port ${PORT} without user ask."
    exit 0
  fi
fi

node scripts/preflight-access-app-root.mjs
echo "Starting stable dev on http://127.0.0.1:${PORT}/ (webpack). Leave this terminal open."
exec npx next dev --webpack -p "${PORT}"
