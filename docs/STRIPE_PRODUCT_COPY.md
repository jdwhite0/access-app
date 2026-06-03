# Stripe product copy — ACCESS monetization

Use this document when configuring **Stripe Dashboard** products, prices, and environment variables for ACCESS subscriptions.

---

## What Stripe Checkout cannot customize

**Stripe Checkout controls the checkout layout.** You cannot fully redesign the payment screen (columns, custom HTML, embedded forms) without building a custom checkout flow.

What we **can** control:

| Layer | Controlled by |
|-------|----------------|
| Value sell before payment | `/plans` page in ACCESS (implemented) |
| Product name & description on Checkout | Stripe Dashboard **Product** attached to each **Price** |
| Logo & display name on Checkout | `branding_settings` per session (`lib/stripe/branding.ts`) |
| Session metadata | `createCheckoutSession` (`lib/stripe/actions.ts`) |
| Submit-area message | `custom_text.submit.message` on Checkout Session |
| Success / cancel experience | `/checkout/success` and `/checkout/cancel` in ACCESS |
| Billing management | Stripe Customer Portal + `/settings/billing` |

**Recommendation:** Sell value on `/plans`. Use Checkout to remove doubt with clear product copy, branding, and metadata — not hype.

---

## Pricing (must match Dashboard)

**Commitment pricing** — see **`docs/PLANS_V2_STRIPE.md`** for full Dashboard steps and env vars.

| Plan | Monthly | Annual | Eq. monthly | Env vars (preferred) |
|------|---------|--------|-------------|----------------------|
| ACCESS Operator | **$299/month** | **$2,388/year** | $199/mo | `STRIPE_PRICE_OPERATOR_MONTHLY`, `STRIPE_PRICE_OPERATOR_ANNUAL` |
| ACCESS Builder | **$599/month** | **$4,788/year** | $399/mo | `STRIPE_PRICE_BUILDER_MONTHLY`, `STRIPE_PRICE_BUILDER_ANNUAL` |
| ACCESS Enterprise | Custom | — | — | Contact sales (no Price ID) |

**Legacy env:** `STRIPE_PRICE_OPERATOR` / `STRIPE_PRICE_BUILDER` still map to **monthly** when `*_MONTHLY` is unset.

Price IDs in Vercel / `.env.local` **must** be Stripe Price IDs (`price_...`) at the amounts above. If you change prices in Stripe, update env vars and redeploy.

---

## Stripe Dashboard — Product setup

For each plan, create or update a **Product** in [Stripe Dashboard → Products](https://dashboard.stripe.com/products) (test mode for local dev, live mode for production).

### ACCESS Operator

**Product name**

```text
ACCESS Operator
```

**Product description** (Dashboard — full marketing copy)

```text
Your personal AI workspace for organizing projects, memory, and next actions with JYSON.

Use ACCESS to understand what you are building, stay organized, and move faster with an AI companion that remembers your work.
```

**Price description / Checkout summary** (paste into Price description or Statement descriptor if shown)

```text
Organize your work with JYSON — your AI companion for projects, memory, next actions, and intelligent workspace guidance.
```

**Recurring price:** $299.00 USD / month

**Product metadata**

| Key | Value |
|-----|-------|
| `plan_tier` | `operator` |
| `product_family` | `access` |
| `primary_outcome` | `personal_ai_workspace` |
| `includes_jyson` | `true` |
| `includes_memory` | `true` |
| `includes_projects` | `true` |
| `includes_agents` | `limited` |
| `includes_offers` | `false` |
| `includes_registry` | `true` |
| `target_user` | `individual_builders` |

Copy the **Price ID** (`price_...`) → `STRIPE_PRICE_OPERATOR`

---

### ACCESS Builder

**Product name**

```text
ACCESS Builder
```

**Product description** (Dashboard — full marketing copy)

```text
Build companies, systems, products, content, and workflows with an AI that understands your world.

ACCESS Builder gives you JYSON, memory, projects, agents, offers, registry intelligence, and connected workspace context so you can turn ideas into operating systems.
```

**Price description / Checkout summary** (use verbatim — this is what buyers should see)

```text
Build companies, systems, products, content, and workflows with JYSON — your AI companion for memory, projects, agents, offers, and connected workspace intelligence.
```

**Shorter fallback** (if only a short field is available)

```text
Build faster with JYSON, memory, projects, agents, offers, and connected workspace intelligence.
```

**Recurring price:** $599.00 USD / month

**Product metadata**

| Key | Value |
|-----|-------|
| `plan_tier` | `builder` |
| `product_family` | `access` |
| `primary_outcome` | `build_systems_with_ai` |
| `includes_jyson` | `true` |
| `includes_memory` | `true` |
| `includes_projects` | `true` |
| `includes_agents` | `true` |
| `includes_offers` | `true` |
| `includes_registry` | `true` |
| `target_user` | `founders_creators_operators` |

Copy the **Price ID** (`price_...`) → `STRIPE_PRICE_BUILDER`

---

### ACCESS Enterprise

**Product name**

```text
ACCESS Enterprise
```

**Product description** (Dashboard)

```text
Operate teams, organizations, workflows, and intelligent systems with ACCESS as your AI-native command layer.

Designed for advanced collaboration, agent teams, custom integrations, governance, and enterprise-grade operating infrastructure.
```

**Checkout summary** (for quotes / future self-serve)

```text
Operate your organization with ACCESS — an AI-native workspace for teams, agents, memory, workflows, integrations, and intelligent execution.
```

**Price:** Custom — no `STRIPE_PRICE_*` env var. Sales flow: `mailto:jerry@jdwhite.world?subject=ACCESS Enterprise`

**Product metadata**

| Key | Value |
|-----|-------|
| `plan_tier` | `enterprise` |
| `product_family` | `access` |
| `primary_outcome` | `ai_native_org_operations` |
| `includes_jyson` | `true` |
| `includes_memory` | `true` |
| `includes_projects` | `true` |
| `includes_agents` | `advanced` |
| `includes_offers` | `true` |
| `includes_registry` | `true` |
| `target_user` | `teams_organizations` |

---

## Checkout session metadata (set in code)

Each Checkout Session also receives metadata from `lib/stripe/plans.ts` via `createCheckoutSession`:

- All keys from the tables above
- Plus `clerk_user_id` and `plan` (required for webhooks)

Webhook handler: `app/api/stripe/webhook/route.ts` reads `metadata.clerk_user_id` and `metadata.plan`.

---

## Environment variables

### Local (`.env.local`)

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_OPERATOR=price_...   # $299/mo Operator product
STRIPE_PRICE_BUILDER=price_...    # $599/mo Builder product
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel (Production)

1. Open **Vercel → Project app → Settings → Environment Variables**
2. Set `STRIPE_PRICE_OPERATOR` and `STRIPE_PRICE_BUILDER` to **live** Price IDs at $299 / $599
3. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (live)
4. Set `NEXT_PUBLIC_APP_URL` to your production origin (for return URLs + Checkout logo)
5. **Redeploy** after any env change

---

## Step-by-step: update prices to $299 / $599

1. **Stripe Dashboard** (test or live mode) → **Products**
2. For **ACCESS Operator**: edit product copy above → add or archive old price → create new recurring price **$299.00/month**
3. For **ACCESS Builder**: edit product copy above → add or archive old price → create new recurring price **$599.00/month**
4. Copy new `price_...` IDs
5. Update `STRIPE_PRICE_OPERATOR` and `STRIPE_PRICE_BUILDER` in Vercel (and `.env.local` for local testing)
6. Redeploy ACCESS
7. Test: `/plans` → **Start Builder** → confirm Checkout shows product name, description, **JD AI Systems** logo, and $599/month

---

## Branding on Checkout

- **Logo:** `{NEXT_PUBLIC_APP_URL}/brand/jd-ai-systems-logo.png` (set per session in code)
- **Display name:** Plan-specific — `ACCESS Operator`, `ACCESS Builder` (overrides account default when session is created)
- **Customer Portal:** Uses account-level Dashboard branding only — upload the same logo under [Settings → Branding](https://dashboard.stripe.com/settings/branding)

See also: `docs/STRIPE_LOCAL_SETUP.md`

---

## User flow after payment

| Step | URL |
|------|-----|
| Plans (sell) | `/plans` |
| Stripe Checkout | Hosted by Stripe |
| Success | `/checkout/success?session_id={CHECKOUT_SESSION_ID}` |
| Cancel | `/checkout/cancel` |
| Billing | `/settings/billing` |
| Portal | Stripe Customer Portal (Manage subscription / View invoices) |

---

## Plans page & checkout (user-facing)

- Emphasize **Builder** as Recommended on `/plans`.
- Checkout copy explains transformation, not just product name.
- Do not include revenue targets, MRR goals, customer-count math, or acquisition projections in UI or this doc.
