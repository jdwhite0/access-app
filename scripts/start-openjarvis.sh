#!/usr/bin/env bash
# Start OpenJarvis HTTP server for ACCESS local tool execution (default :8000).
set -euo pipefail

OPENJARVIS_HOME="${OPENJARVIS_HOME:-$HOME/.openjarvis}"
JARVIS="${OPENJARVIS_JARVIS:-$OPENJARVIS_HOME/.venv/bin/jarvis}"
HOST="${OPENJARVIS_HOST:-127.0.0.1}"
PORT="${OPENJARVIS_PORT:-8000}"

if [[ ! -x "$JARVIS" ]]; then
  echo "OpenJarvis CLI not found at: $JARVIS" >&2
  echo "Install per access-app/docs/DEVELOPER_GUIDE.md#openjarvis-local-setup" >&2
  exit 1
fi

echo "Starting OpenJarvis at http://${HOST}:${PORT} (Ctrl+C to stop)"
exec "$JARVIS" serve --host "$HOST" --port "$PORT"
