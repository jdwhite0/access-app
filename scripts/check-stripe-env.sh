#!/usr/bin/env bash
# Report Stripe env vars as present/missing and validate resolved price ID format.
# Values are never printed — only prefix patterns (price_***, prod_***, invalid, missing).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.local}"

vars=(
  STRIPE_SECRET_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_PRICE_OPERATOR_MONTHLY
  STRIPE_PRICE_OPERATOR_ANNUAL
  STRIPE_PRICE_BUILDER_MONTHLY
  STRIPE_PRICE_BUILDER_ANNUAL
  STRIPE_PRICE_OPERATOR
  STRIPE_PRICE_BUILDER
  STRIPE_WEBHOOK_SECRET
  NEXT_PUBLIC_APP_URL
)

price_keys=(
  STRIPE_PRICE_OPERATOR
  STRIPE_PRICE_OPERATOR_MONTHLY
  STRIPE_PRICE_OPERATOR_ANNUAL
  STRIPE_PRICE_BUILDER
  STRIPE_PRICE_BUILDER_MONTHLY
  STRIPE_PRICE_BUILDER_ANNUAL
)

echo "Stripe env checklist (values never shown)"
echo "File: $ENV_FILE"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  echo "  (file not found — all vars missing)"
  exit 1
fi

read_env_value() {
  local name="$1"
  grep -E "^${name}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true
}

format_price_value() {
  local value="${1:-}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"

  if [[ -z "$value" ]]; then
    echo "missing"
  elif [[ "$value" == price_* ]]; then
    echo "price_***"
  elif [[ "$value" == prod_* ]]; then
    echo "prod_***"
  else
    echo "invalid"
  fi
}

resolve_price_id() {
  local plan="$1"
  local interval="$2"
  local monthly annual legacy

  if [[ "$plan" == operator ]]; then
    monthly="$(read_env_value STRIPE_PRICE_OPERATOR_MONTHLY)"
    annual="$(read_env_value STRIPE_PRICE_OPERATOR_ANNUAL)"
    legacy="$(read_env_value STRIPE_PRICE_OPERATOR)"
  else
    monthly="$(read_env_value STRIPE_PRICE_BUILDER_MONTHLY)"
    annual="$(read_env_value STRIPE_PRICE_BUILDER_ANNUAL)"
    legacy="$(read_env_value STRIPE_PRICE_BUILDER)"
  fi

  if [[ "$interval" == month ]]; then
    if [[ -n "${monthly// /}" ]]; then
      echo "$monthly"
    else
      echo "$legacy"
    fi
  else
    echo "$annual"
  fi
}

missing=0
for name in "${vars[@]}"; do
  if grep -qE "^${name}=.+" "$ENV_FILE" 2>/dev/null; then
    status=present
  else
    status=missing
    missing=$((missing + 1))
  fi
  printf "  %-40s %s\n" "$name" "$status"
done

echo ""
echo "STRIPE_PRICE_* format (raw env keys):"
printf "  %-40s %-10s %s\n" "key" "present" "format ok"
for name in "${price_keys[@]}"; do
  if grep -qE "^${name}=" "$ENV_FILE" 2>/dev/null; then
    present=present
    raw_value="$(grep -E "^${name}=" "$ENV_FILE" | head -1 | cut -d= -f2-)"
    fmt="$(format_price_value "$raw_value")"
  else
    present=missing
    fmt=missing
  fi
  printf "  %-40s %-10s %s\n" "$name" "$present" "$fmt"
done

echo ""
echo "Resolved checkout price IDs (matches lib/stripe/prices.ts):"
resolved_ok=0
for spec in "operator|month" "operator|year" "builder|month" "builder|year"; do
  plan="${spec%%|*}"
  interval="${spec##*|}"
  resolved="$(resolve_price_id "$plan" "$interval")"
  fmt="$(format_price_value "$resolved")"
  if [[ "$fmt" == "price_***" ]]; then
    resolved_ok=$((resolved_ok + 1))
  fi
  printf "  %-24s %s\n" "${plan} ${interval}" "$fmt"
done

echo ""
if [[ $missing -eq 0 ]]; then
  echo "All Stripe vars present in $ENV_FILE."
else
  echo "$missing variable(s) missing or empty in $ENV_FILE."
fi

echo ""
if [[ $resolved_ok -eq 4 ]]; then
  echo "Annual billing: enabled (resolved operator/builder annual price_ IDs)."
  echo "Plans page: annual toggle enabled; \"Annual billing coming soon\" hidden."
else
  echo "Annual billing: NOT fully configured (need price_ IDs for operator + builder annual)."
  echo "Plans page: annual toggle disabled until STRIPE_PRICE_OPERATOR_ANNUAL and STRIPE_PRICE_BUILDER_ANNUAL are price_ IDs."
  echo "Common mistake: dollar amounts like \$1988 — Next.js treats \$ as env expansion; use price_... from Stripe Dashboard."
fi
echo "Monthly fallback: STRIPE_PRICE_*_MONTHLY, else legacy STRIPE_PRICE_OPERATOR / STRIPE_PRICE_BUILDER."
echo ""
echo "For Vercel production, copy the same names via Dashboard or: vercel env add <NAME> production"
echo "After adding or changing env vars locally, restart \`npm run dev\`; on Vercel, redeploy."

if [[ $missing -eq 0 && $resolved_ok -eq 4 ]]; then
  exit 0
fi
exit 1
