#!/usr/bin/env bash
# ============================================================
# bootstrap-m4.sh — Run this AFTER completing the 3 Supabase
# manual steps listed at the bottom of this file.
#
# What it does:
#   1. Verifies schema is applied (all tables + functions)
#   2. Pushes anon key + JWT secret to Vercel production
#   3. Runs M4 validation (pairing → register → scan → sync)
#
# Usage:
#   cd access-app
#   bash scripts/bootstrap-m4.sh
# ============================================================
set -e

HANDLE="jdwhite.access"
VAULT_ROOT="/Users/jdproductions/Documents/JD_Ai_System"

# ── Load .env.local ──────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local not found. Run from access-app directory."
  exit 1
fi

export $(grep -v '^#' .env.local | grep -v '^$' | xargs)

# ── Guard: require anon key + JWT secret ─────────────────────
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo ""
  echo "BLOCKED: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local"
  echo ""
  echo "Get it from:"
  echo "  https://supabase.com/dashboard/project/flxlusqktlstjvjusbpz/settings/api"
  echo "  Section: Project API Keys → anon / public"
  echo ""
  echo "Add to access-app/.env.local:"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<value>"
  echo ""
  exit 1
fi

if [ -z "$SUPABASE_JWT_SECRET" ]; then
  echo ""
  echo "BLOCKED: SUPABASE_JWT_SECRET is not set in .env.local"
  echo ""
  echo "Get it from:"
  echo "  https://supabase.com/dashboard/project/flxlusqktlstjvjusbpz/settings/api"
  echo "  Section: JWT Settings → JWT Secret"
  echo ""
  echo "Add to access-app/.env.local:"
  echo "  SUPABASE_JWT_SECRET=<value>"
  echo ""
  exit 1
fi

echo ""
echo "▶ Step 1 — Verify schema is applied"
echo "──────────────────────────────────────"
npm run platform:verify-m0
echo ""

echo "▶ Step 2 — Push remaining env vars to Vercel"
echo "──────────────────────────────────────────────"
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes
echo "$SUPABASE_JWT_SECRET"           | vercel env add SUPABASE_JWT_SECRET production --yes
echo "  ✓ Supabase anon key + JWT secret pushed to Vercel"
echo ""

echo "▶ Step 3 — Set vault root for connector"
echo "────────────────────────────────────────"
export ACCESS_VAULT_ROOT="$VAULT_ROOT"
echo "  ACCESS_VAULT_ROOT=$ACCESS_VAULT_ROOT"
echo ""

echo "▶ Step 4 — Generate pairing code for $HANDLE"
echo "──────────────────────────────────────────────"
PAIRING_OUTPUT=$(npm run pairing:code -- "$HANDLE" 2>&1)
echo "$PAIRING_OUTPUT"
CODE=$(echo "$PAIRING_OUTPUT" | grep '"code"' | head -1 | sed 's/.*"code": *"\([^"]*\)".*/\1/')
if [ -z "$CODE" ]; then
  echo ""
  echo "ERROR: Could not extract pairing code from output."
  echo "Run manually: npm run pairing:code -- $HANDLE"
  exit 1
fi
echo ""
echo "  Pairing code: $CODE"
echo ""

echo "▶ Step 5 — Register connector"
echo "──────────────────────────────"
cd packages/access-connector
npm run register -- "$CODE"
cd ../..
echo ""

echo "▶ Step 6 — Run connector pipeline"
echo "───────────────────────────────────"
cd packages/access-connector
export ACCESS_VAULT_ROOT="$VAULT_ROOT"
npm run scan
npm run compile
npm run sync:plan
npm run sync:apply
cd ../..
echo ""

echo "▶ Step 7 — Run M4 full validation"
echo "───────────────────────────────────"
npx tsx scripts/m4-full-validation.ts "$HANDLE"
echo ""

echo "▶ Step 8 — Redeploy ACCESS to Vercel with complete env"
echo "────────────────────────────────────────────────────────"
vercel deploy --prod --yes | grep -E "Aliased|Production|Error"
echo ""
echo "================================================================"
echo "  M4 bootstrap complete."
echo "  ACCESS: https://app-iota-inky-62.vercel.app"
echo "  JYSON:  https://jyson.vercel.app"
echo "================================================================"
echo ""

# ============================================================
# MANUAL STEPS REQUIRED BEFORE RUNNING THIS SCRIPT:
#
# 1. Apply Supabase schema — open SQL Editor at:
#    https://supabase.com/dashboard/project/flxlusqktlstjvjusbpz/sql
#
#    Run these files in order (copy each, paste, click Run):
#      access-app/supabase/schema.sql
#      access-app/supabase/schema_v2.sql
#      access-app/supabase/schema_v3_vault.sql
#      access-app/supabase/schema_v4_platform_hardening.sql
#      access-app/supabase/schema_v4_m2_tenant_jwt.sql
#
# 2. Add anon key to access-app/.env.local:
#    Get from: supabase.com/dashboard/project/flxlusqktlstjvjusbpz/settings/api
#    Under "Project API Keys" → "anon / public"
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste>
#
# 3. Add JWT secret to access-app/.env.local:
#    Same settings page → "JWT Settings" → "JWT Secret" → Reveal
#    SUPABASE_JWT_SECRET=<paste>
#
# Then run: cd access-app && bash scripts/bootstrap-m4.sh
# ============================================================
