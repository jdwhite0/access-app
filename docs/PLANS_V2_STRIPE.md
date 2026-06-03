# ACCESS Plans — Stripe Dashboard setup (Commitment pricing)

Use this guide when configuring **commitment pricing** for `/plans` and embedded checkout. Product copy also lives in `docs/STRIPE_PRODUCT_COPY.md`.

---

## Products to create or update

Create three products in [Stripe Dashboard → Products](https://dashboard.stripe.com/products) (test mode for local, live for production).

### 1. ACCESS Operator

**Product name:** `ACCESS Operator`

**Product description (Dashboard):**

```text
Your personal AI workspace for organizing projects, memory, and next actions with JYSON.

Use ACCESS to understand what you are building, stay organized, and move faster with an AI companion that remembers your work.
```

**Checkout / price description:**

```text
Organize your work with JYSON — your AI companion for projects, memory, next actions, and intelligent workspace guidance.
```

**Prices to create:**

| Nickname (suggested) | Amount | Interval | Env var |
|----------------------|--------|----------|---------|
| Operator Monthly | **$299.00** | month | `STRIPE_PRICE_OPERATOR_MONTHLY` |
| Operator Annual | **$2,388.00** | year | `STRIPE_PRICE_OPERATOR_ANNUAL` |

**Legacy:** `STRIPE_PRICE_OPERATOR` maps to **monthly** if `STRIPE_PRICE_OPERATOR_MONTHLY` is unset.

---

### 2. ACCESS Builder

**Product name:** `ACCESS Builder`

**Product description (Dashboard):**

```text
Build companies, systems, products, content, and workflows with an AI that understands your world.

ACCESS Builder gives you JYSON, memory, projects, agents, offers, registry intelligence, and connected workspace context so you can turn ideas into operating systems.
```

**Checkout / price description:**

```text
Build companies, systems, products, content, and workflows with JYSON — your AI companion for memory, projects, agents, offers, and connected workspace intelligence.
```

**Prices to create:**

| Nickname (suggested) | Amount | Interval | Env var |
|----------------------|--------|----------|---------|
| Builder Monthly | **$599.00** | month | `STRIPE_PRICE_BUILDER_MONTHLY` |
| Builder Annual | **$4,788.00** | year | `STRIPE_PRICE_BUILDER_ANNUAL` |

**Legacy:** `STRIPE_PRICE_BUILDER` maps to **monthly** if `STRIPE_PRICE_BUILDER_MONTHLY` is unset.

---

### 3. ACCESS Enterprise

**Product name:** `ACCESS Enterprise`

**Price:** Custom — no `STRIPE_PRICE_*` env. Sales: `/contact` or `mailto:jerry@jdwhite.world?subject=ACCESS Enterprise`

---

## Environment variables

All Price IDs must start with `price_` (not `prod_`).

```env
STRIPE_PRICE_OPERATOR_MONTHLY=price_...
STRIPE_PRICE_OPERATOR_ANNUAL=price_...
STRIPE_PRICE_BUILDER_MONTHLY=price_...
STRIPE_PRICE_BUILDER_ANNUAL=price_...
```

Until **both** annual Price IDs are set, the plans page keeps the Annual toggle disabled (development shows a dev-only env hint).

---

## Checkout behavior

| Flow | URL / API |
|------|-----------|
| Plans page | `/plans` |
| Embedded checkout | `/checkout/operator?interval=month` or `?interval=year` |
| Session creation | `POST /api/stripe/embedded-checkout` body: `{ "plan": "builder", "interval": "year" }` |
| Success | `/checkout/success?session_id=...` |

Session metadata includes `billing_interval`: `month` | `year`.

---

## Display vs Stripe amounts

| Plan | Monthly | Annual | Eq. monthly | Savings vs monthly × 12 |
|------|---------|--------|-------------|-------------------------|
| Operator | $299/mo | $2,388/yr | $199/mo | $1,200/yr |
| Builder | $599/mo | $4,788/yr | $399/mo | $2,400/yr |

Dashboard Price amounts **must match** these figures or buyers will see a mismatch at checkout.

---

## Step-by-step (test mode)

1. Dashboard → **Products** → create/update **ACCESS Operator** and **ACCESS Builder** with copy above.
2. For each product, add recurring prices at commitment amounts (month + year).
3. Copy each `price_...` ID into `.env.local` (see `.env.local.example`).
4. Restart `npm run dev`.
5. Visit `/plans` → toggle Monthly / Annual → confirm amounts and CTAs.
6. Repeat in **live mode** for Vercel Production env vars, then redeploy.

See also: `docs/STRIPE_LOCAL_SETUP.md`, `docs/CHECKOUT_V2.md`.
