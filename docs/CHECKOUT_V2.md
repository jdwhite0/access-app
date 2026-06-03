# ACCESS Checkout V2

Stripe **Hosted** Checkout renders on Stripe’s domain and cannot host a custom two-column layout on ACCESS. Checkout V2 uses a white-first `/checkout/[plan]` page with plan summary on the left and **Stripe Embedded Checkout** (`ui_mode: embedded_page`) on the right, driven by a session `client_secret` from `POST /api/stripe/embedded-checkout`.

## Routes

| Path | Purpose |
|------|---------|
| `/plans` | Plan selection; Operator/Builder CTAs → custom checkout |
| `/checkout/operator` | Operator ($299/mo) embedded checkout |
| `/checkout/builder` | Builder ($599/mo) embedded checkout |
| `/checkout/success?session_id=…` | Post-payment welcome |
| `/checkout/cancel` | Canceled hosted flow (link from plans back) |

Enterprise uses `mailto:` contact sales — no embedded checkout.

## Local testing

1. Copy `.env.local.example` → `.env.local` with test Stripe keys (see `docs/STRIPE_LOCAL_SETUP.md`).
2. `npm run dev` in `access-app`.
3. Sign in with Clerk, open `/plans`, click **Start Operator** or **Start Builder**.
4. Complete payment with Stripe test card `4242 4242 4242 4242`.
5. Confirm redirect to `/checkout/success`.

For webhooks locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Environment variables

| Variable | Required for checkout V2 |
|----------|-------------------------|
| `STRIPE_SECRET_KEY` | Yes — embedded session creation |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes — Embedded Checkout UI |
| `STRIPE_PRICE_OPERATOR` | Yes — Operator price id |
| `STRIPE_PRICE_BUILDER` | Yes — Builder price id |
| `NEXT_PUBLIC_APP_URL` | Recommended — `return_url` and branding logo URL |
| `STRIPE_WEBHOOK_SECRET` | Yes for plan activation after pay (not for UI mount) |
| Clerk keys | Yes — auth gate on checkout pages |

Legacy hosted checkout remains at `POST /api/stripe/checkout` (billing page).
