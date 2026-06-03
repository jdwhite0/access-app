# Stripe local setup (ACCESS) — test mode only

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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

**Do not use live `sk_live_` / `pk_live_` for local checkout** — Checkout and webhooks must stay in test mode.

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
6. After success, you land on **Settings → Billing** (`/settings/billing?success=1`)
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
| `Webhook signature failed` | `STRIPE_WEBHOOK_SECRET` must be the **CLI** `whsec_`, not a Dashboard endpoint secret |
| Checkout error / wrong price | Price IDs must be from **test** products; keys must be `sk_test_` / `pk_test_` |
| `Not signed in` on checkout | Sign in via Clerk before `/plans` |
| Plan stays `free` after pay | Check CLI for 400/500; confirm `schema_v5_billing.sql` applied; confirm metadata on Checkout session |
| No identity row | Run onboarding once so `access_identities` exists for your `clerk_user_id` |

## Production webhooks

Only when deploying — create a Dashboard webhook pointing to `https://your-domain/api/stripe/webhook`. Not required for local development.
