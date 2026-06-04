# ACCESS Autonomy — Env Var Checklist

The exact variables to make the founder brief (and Layer 2 marketing emails) run autonomously
and gated. Names are pulled from the code; values are yours to fill.

Three places hold env: **Vercel** (sends), the **Cloud agent** (researches + publishes),
and **local `.env.local`** (fallback producer). Each only needs what it actually does.

---

## 1. Vercel project env — the SENDER (required for 6 AM autonomy)

These power the crons in `vercel.json` (daily brief, dispatch, marketing). The send path
reads the Supabase snapshot — no content engine needed here.

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key — actually sends the email |
| `EMAIL_FROM` | From line, e.g. `ACCESS <notifications@access.jd.ai>` |
| `SUPABASE_URL` | Supabase project URL (reads the dossier snapshot + queue) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key |
| `CRON_SECRET` | Vercel sends `Authorization: Bearer <this>` to cron routes |
| `INTERNAL_EMAIL_API_SECRET` | Auth for `/api/internal/*` (manual/serverless publish) |
| `EMAIL_TEST_MODE` | `true` = route all sends to the founder test address (your test mode) |
| `FOUNDER_TEST_EMAIL` | Your email — where founder-mode sends land |
| `EMAIL_REQUIRE_QUALITY_PASS` | *(optional)* defaults strict; set `false` only to relax the gate |
| `ACCESS_DAILY_BRIEF_HANDLE` | *(optional)* handle shown in the brief |

> When you're ready to send to a real list instead of just yourself, set `EMAIL_TEST_MODE=false`.

---

## 2. Cloud agent env — the PRODUCER (for true "Mac-off" autonomy)

The scheduled Cursor agent researches the day's signal, runs the gate, and publishes the
passed dossier to Supabase. It needs to reach Supabase + have the content engine on disk.

| Variable | Purpose |
|---|---|
| `CURSOR_API_KEY` | Lets the morning producer spawn the research agent (`runCursorResearch`) |
| `SUPABASE_URL` | Publish the passed dossier snapshot |
| `SUPABASE_SERVICE_ROLE_KEY` | Same |
| `JDAI_CONTENT_ENGINE_PATH` | *(optional)* defaults to `../jdai-content-engine` |

> The cloud agent does **not** send email — Vercel does. So it does not need Resend keys.

---

## 3. Local `.env.local` (access-app) — the FALLBACK producer

Already installed as a launchd job (`com.jdai.intelligence-morning`, 5:30 AM). It publishes
the snapshot when your Mac is on. Needs:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Publish the snapshot |
| `CURSOR_API_KEY` | *(optional)* enables local research; without it, it publishes the latest existing dossier |

---

## Quick verify after setting env

```bash
# Local: produce + gate + publish today's snapshot
cd access-app && npm run intelligence:morning

# Confirm the gated send path would clear (manual founder test)
npm run email:daily-brief:send
```

If a brief ever scores below the bar, every path returns **HELD** and nothing sends — by design.

---

## What is NOT required for "done"

Social **auto-posting** (Instagram, YouTube, TikTok, X, Snapchat, Facebook, LinkedIn) needs
per-platform API tokens and is a separate, optional add-on. Until then, the system still
generates gated, ready-to-post packets into `jdai-content-engine/exports/distribution/social-platforms/<date>/`
every cycle. Posting is the only thing left, and only when you want it.
