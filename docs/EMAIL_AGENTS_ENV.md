# ACCESS Email Agents — Environment Variables

> **App:** `access-app`  
> **Architecture:** `jdai-content-engine/email-agents/`

---

## Required for Production Sends

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Email provider API key (Resend) |
| `EMAIL_FROM` or `EMAIL_FROM_ADDRESS` | From address (verified domain) |
| `EMAIL_PROVIDER_NAME` | Provider identifier (default: `resend`) |
| `EMAIL_UNSUBSCRIBE_SECRET` | HMAC secret for unsubscribe tokens (min 16 chars) |
| `NEXT_PUBLIC_APP_URL` | Base URL for links in emails |
| `SUPABASE_SERVICE_ROLE_KEY` | Queue + preferences + delivery logs |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `INTERNAL_EMAIL_API_SECRET` | Protects `/api/internal/email/*` routes |

---

## Founder Test Mode (Required Before Production Batch)

| Variable | Purpose |
|---|---|
| `EMAIL_TEST_MODE` | Set `true` to restrict sends to founder only |
| `FOUNDER_TEST_EMAIL` | Founder email address for test sends |
| `FOUNDER_TEST_USER_ID` | Founder `access_identities.id` UUID |

When `EMAIL_TEST_MODE=true`:

- Only founder account receives actual sends
- Other eligible users logged as `skipped_test_mode`
- Never sends production batch

---

## Optional

| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Vercel cron auth (production) |
| `JDAI_CONTENT_ENGINE_PATH` | Path to `jdai-content-engine` on server (default: `../jdai-content-engine` from access-app) |
| `COMPANY_MAILING_ADDRESS` | CAN-SPAM physical address in email footer (required before production batch) |

---

## Example `.env.local` Block

```bash
# Email provider
RESEND_API_KEY=re_...
EMAIL_FROM=ACCESS <notifications@yourdomain.com>
EMAIL_PROVIDER_NAME=resend
EMAIL_UNSUBSCRIBE_SECRET=long-random-string-min-16-chars
INTERNAL_EMAIL_API_SECRET=another-long-random-string

# Founder test mode — keep true until validated
EMAIL_TEST_MODE=true
FOUNDER_TEST_EMAIL=founder@example.com
FOUNDER_TEST_USER_ID=uuid-from-access_identities

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Production Checklist

1. Apply Supabase v6 + v7
2. Set `EMAIL_TEST_MODE=true` — validate founder receives test daily brief
3. Set `COMPANY_MAILING_ADDRESS` on Vercel (CAN-SPAM)
4. Verify domain in Resend
5. Set `CRON_SECRET` + `INTERNAL_EMAIL_API_SECRET` on Vercel
6. Run `npm run email:finish` — publishes dossier snapshot + verifies all agents
7. Deploy access-app (cron reads Supabase snapshot on Vercel)
8. Set `EMAIL_TEST_MODE=false` only after founder sign-off

---

## Operator Commands (minimal manual)

| Command | Purpose |
|---|---|
| `npm run email:finish` | Publish latest dossier to Supabase + run full agent verify |
| `npm run email:daily-brief:send` | Queue + send daily brief (auto-publishes snapshot) |
| `npm run email:publish-dossier` | Snapshot only — run after intelligence cycle |
| `npm run email:verify` | Automated MANUAL_TEST_PLAN checks |
| `npm run email:weekly-digest:send` | Weekly digest test send |

---

## What Still Requires Provider Configuration

- Resend domain verification + DKIM/SPF
- Production `EMAIL_FROM` on verified domain
- Cron trigger for `/api/internal/email/dispatch` (Vercel Cron or external)
- Webhook handler for bounces/complaints (future — log to `email_delivery_logs`)
- Physical mailing address in compliance footer
