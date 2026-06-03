#!/usr/bin/env bash
# Forward Stripe webhooks to local ACCESS (port 3000).
# Run in a dedicated terminal while testing checkout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${ACCESS_PORT:-3000}"
ENDPOINT="localhost:${PORT}/api/stripe/webhook"

echo "ACCESS Stripe local forward → http://${ENDPOINT}"
echo ""
echo "After this starts, copy the whsec_... line into access-app/.env.local as:"
echo "  STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "Then restart: npm run dev -- --webpack -p ${PORT}"
echo ""

exec stripe listen --forward-to "$ENDPOINT" --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted
