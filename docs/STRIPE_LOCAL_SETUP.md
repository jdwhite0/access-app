# Stripe setup (ACCESS) — local test mode + Vercel production

## Production (Vercel) — required for https://app-iota-inky-62.vercel.app

If checkout shows **“Stripe is not configured: STRIPE_SECRET_KEY is missing”** on the deployed app, the cause is almost always **missing Stripe variables on Vercel**, not a wrong variable name in code.

`vercel env ls` for project **app** (Production) must include every name below. As of the last audit, Production had Clerk/Supabase/`NEXT_PUBLIC_APP_URL` but **no** `STRIPE_*` keys — add them and **redeploy**.

### Variable names (set in Vercel — values from Stripe Dashboard)

| Name | Notes |
|------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (staging) or `sk_live_...` (live billing) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Matching `pk_test_...` or `pk_live_...` |
| `STRIPE_PRICE_OPERATOR` | Price id `price_...` for Operator plan |
| `STRIPE_PRICE_BUILDER` | Price id `price_...` for Builder plan |
| `STRIPE_WEBHOOK_SECRET` | Dashboard webhook signing secret `whsec_...` (not CLI secret on Vercel) |
| `NEXT_PUBLIC_APP_URL` | `https://app-iota-inky-62.vercel.app` (Checkout return URLs + logo URL) |

**Never** commit secret keys to git. Use `.env.local` locally only.

### Vercel Dashboard steps

1. Open [Vercel Dashboard](https://vercel.com) → team **jd-white-s-projects** → project **app**
2. **Settings** → **Environment Variables**
3. For each name in the table above → **Add** → paste value from Stripe (test or live mode must match across all Stripe vars)
4. Scope: **Production** (add **Preview** too if you test preview deployments)
5. **Redeploy** Production (env changes do not apply to an already-built deployment until redeploy)

### Copy from local `.env.local` (manual)

If local billing already works:

```bash
cd access-app
bash scripts/check-stripe-env.sh    # confirms names present locally (no values printed)
```

Then in Vercel Dashboard, add the **same variable names** with the **same values** from your `.env.local` (or live keys from Stripe Dashboard for production billing).

CLI alternative (you paste the secret when prompted — agent must not invent keys):

```bash
cd access-app
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_PRICE_OPERATOR production
vercel env add STRIPE_PRICE_BUILDER production
vercel env add STRIPE_WEBHOOK_SECRET production
# NEXT_PUBLIC_APP_URL may already exist — update if wrong
```

### Production Stripe webhook (Dashboard)

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) (test or live mode to match your keys)
2. Endpoint URL: `https://app-iota-inky-62.vercel.app/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret → Vercel env `STRIPE_WEBHOOK_SECRET` → redeploy

### Verify after deploy

```bash
curl -I https://app-iota-inky-62.vercel.app/brand/jd-ai-systems-logo.png
# expect HTTP 200

vercel env ls   # STRIPE_SECRET_KEY and related names should appear for Production
```

---

## Local development — test mode only

Do **not** create a production Dashboard webhook for local work. Use **Stripe CLI** forwarding to `localhost:3000`.

## Prerequisites

1. [Stripe CLI](https://stripe.com/docs/stripe-cli) installed and logged in: `stripe login`
2. Supabase migration applied: `access-app/supabase/schema_v5_billing.sql` (adds `plan`, `stripe_customer_id` on `access_identities`)
3. ACCESS dev server on port **3000**

## 1. Use **test mode** keys (required)

In [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) (toggle **Test mode**):

| Variable | Source |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_PRICE_OPERATOR` | Test product → Operator price id `price_...` |
| `STRIPE_PRICE_BUILDER` | Test product → Builder price id `price_...` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (return URLs only on local) |

**Do not use live `sk_live_` / `pk_live_` for local checkout** — Checkout and webhooks must stay in test mode.

### Checkout branding (JD AI Systems logo)

Hosted Checkout shows the **JD AI Systems** logo when each session is created with `branding_settings.logo` pointing at a **public HTTPS** URL:

`{NEXT_PUBLIC_APP_URL}/brand/jd-ai-systems-logo.png`

Asset in repo: `public/brand/jd-ai-systems-logo.png` (from [jdproductions.io](https://jdproductions.io) footer — `assets/logos/jd-system-logo.png`).

| Environment | Logo on Checkout |
|-------------|------------------|
| **Vercel / production** | Set `NEXT_PUBLIC_APP_URL` to your deployed origin (e.g. `https://app-iota-inky-62.vercel.app`). Code passes the logo URL on every session — overrides Stripe Dashboard “JD Productions” branding. |
| **Local (`localhost`)** | Code **does not** send a logo URL (Stripe servers cannot reach your machine). Options: (1) set `NEXT_PUBLIC_APP_URL` to a tunnel, e.g. ngrok `https://….ngrok-free.app`, while testing branding; (2) upload `public/brand/jd-ai-systems-logo.png` in [Stripe Dashboard → Settings → Branding](https://dashboard.stripe.com/settings/branding) (test mode) as **JD AI Systems**. |

### Option 2: Public URL (recommended for Checkout logo)

Use the deployed ACCESS app origin so Stripe can fetch the logo over HTTPS. No ngrok or Dashboard upload needed for Checkout sessions.

1. **Set the env var** (Vercel → Project **app** → Settings → Environment Variables → Production, and Preview if you test there):

   ```env
   NEXT_PUBLIC_APP_URL=https://app-iota-inky-62.vercel.app
   ```

   For local dev against production branding, add the same line to `access-app/.env.local` (see `.env.local.example`).

2. **Deploy** `access-app` to Vercel so `public/brand/jd-ai-systems-logo.png` is served. The logo must return **200** before Checkout will show it.

3. **Redeploy or restart dev** after changing the env var (Next.js bakes `NEXT_PUBLIC_*` at build/start time).

4. **Verify the logo URL loads:**

   ```bash
   curl -I https://app-iota-inky-62.vercel.app/brand/jd-ai-systems-logo.png
   ```

   Expected: `HTTP/2 200` with `content-type: image/png`. If you get **404**, deploy the latest `access-app` code first.

5. **Test Checkout:** sign in → open `/plans` → start Operator or Builder → confirm **JD AI Systems** logo on Stripe Checkout (not legacy JD Productions Dashboard branding).

**Customer Portal** (“Manage subscription”) uses **account-level** Dashboard branding only — no per-session logo API. Update test/live Dashboard branding to the same file for portal consistency.

## 2. Start ACCESS

```bash
cd access-app
npm run dev -- --webpack -p 3000
```

## 3. Start Stripe CLI forwarding (second terminal)

```bash
bash access-app/scripts/stripe-local-listen.sh
```

Copy the signing secret printed as:

```text
Ready! Your webhook signing secret is whsec_xxxxxxxx
```

Put it in `access-app/.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

**Restart** the Next dev server after changing `.env.local`.

## 4. End-to-end test (clicks)

1. Sign in to ACCESS (Clerk) at http://localhost:3000
2. Complete onboarding if you have no `access_identities` row yet
3. Open **http://localhost:3000/plans**
4. Click **Start with Operator** or **Start with Builder** (not Enterprise)
5. Stripe Checkout opens (test mode) — pay with test card `4242 4242 4242 4242`, any future expiry, any CVC
6. After success, you land on **Checkout success** (`/checkout/success?session_id=...`)
7. In the **Stripe CLI terminal**, confirm `checkout.session.completed` → `200`
8. Open **Supabase** → Table Editor → `access_identities` → your row:
   - `plan` → `operator` or `builder`
   - `stripe_customer_id` → `cus_...`
9. Refresh **Billing** — “Current plan” should show the plan from the database

## 5. What the webhook updates

Handler: `app/api/stripe/webhook/route.ts`

| Event | Supabase change |
|-------|-----------------|
| `checkout.session.completed` | `access_identities.plan`, `stripe_customer_id` (from session metadata `clerk_user_id`, `plan`) |
| `customer.subscription.updated` | `plan` = active plan or `free` |
| `customer.subscription.deleted` | `plan` = `free` |

## 6. Quick webhook test (no browser)

With `stripe listen` running and `STRIPE_WEBHOOK_SECRET` set:

```bash
stripe trigger checkout.session.completed
```

Note: triggered events may lack your real `metadata.clerk_user_id` — use the browser flow for a full E2E check.

## 7. Manage subscription (local)

After a real test checkout, open Billing → **Manage subscription** (Stripe Customer Portal). Requires the same test-mode customer.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Stripe is not configured: STRIPE_SECRET_KEY is missing` on **Vercel** | Add all Stripe env vars in Vercel → project **app** → Production → **redeploy**. See § Production (Vercel) above. |
| Same error **locally** | `bash scripts/check-stripe-env.sh` — add missing vars to `.env.local`, restart `npm run dev` |
| `Webhook signature failed` | `STRIPE_WEBHOOK_SECRET` must be the **CLI** `whsec_`, not a Dashboard endpoint secret |
| Checkout error / wrong price | Price IDs must be from **test** products; keys must be `sk_test_` / `pk_test_` |
| `Not signed in` on checkout | Sign in via Clerk before `/plans` |
| Plan stays `free` after pay | Check CLI for 400/500; confirm `schema_v5_billing.sql` applied; confirm metadata on Checkout session |
| No identity row | Run onboarding once so `access_identities` exists for your `clerk_user_id` |
| Checkout still shows **JD Productions** logo | Set `NEXT_PUBLIC_APP_URL` to production URL (Option 2 above), deploy so logo returns 200, or upload `public/brand/jd-ai-systems-logo.png` in Dashboard → Settings → Branding |
| Logo URL returns **404** | Deploy latest `access-app` to Vercel — `public/brand/jd-ai-systems-logo.png` is not on the current deployment |

## Production webhooks

Only when deploying — create a Dashboard webhook pointing to `https://your-domain/api/stripe/webhook`. Not required for local development.
