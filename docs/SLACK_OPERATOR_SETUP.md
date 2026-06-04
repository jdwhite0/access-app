# Slack ACCESS Intelligence Operator — Setup

One-time setup (~10 min). After this, text the bot from Slack — no npm commands needed.

---

## What you get

| You text in Slack | What happens |
|---|---|
| `brief on platform infrastructure` | **Full preview in Slack** (Finimize-style) — read on your phone |
| `send it` | Emails the brief you just reviewed |
| `send it now on platform` | Skip review, email immediately |
| `research AI workflow tools` | Research → preview in Slack → you approve |
| `list topics` / `status` / `cancel` | Operator info |

**You never need to open files on your Mac.** The bot reads them and posts the brief here.

Two ways to connect:

1. **Local bot (recommended)** — `npm run slack:bot` on your Mac. Full pipeline (compile + send + research).
2. **Vercel webhook** — Events API on production URL. Send/status from snapshot when laptop is off.

---

## Step 1 — Create Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → From scratch
2. Name: `ACCESS Intelligence`
3. Pick your workspace

### OAuth & Permissions → Bot Token Scopes

Add:
- `app_mentions:read`
- `chat:write`
- `im:history`
- `im:read`
- `im:write`
- `reactions:write`

**Install to Workspace** → copy **Bot User OAuth Token** → `SLACK_BOT_TOKEN=xoxb-...`

### Basic Information → App-Level Tokens

Create token with scope `connections:write` → `SLACK_APP_TOKEN=xapp-...`

### Event Subscriptions (Vercel path only)

Enable → Request URL: `https://YOUR-ACCESS-DOMAIN/api/integrations/slack/events`

Subscribe to bot events:
- `app_mention`
- `message.im`

Copy **Signing Secret** → `SLACK_SIGNING_SECRET=...`

### Slash Commands (optional)

Create `/access` → Request URL: `https://YOUR-ACCESS-DOMAIN/api/integrations/slack/commands`

### Socket Mode (local bot path)

**Enable Socket Mode** in app settings (uses `SLACK_APP_TOKEN` — no public URL needed)

---

## Step 2 — Add env vars

In `access-app/.env.local`:

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SLACK_ALLOWED_USER_IDS=U01234567   # your Slack member ID (comma-separated)

# Optional — research from Slack via Cursor cloud/local agent
CURSOR_API_KEY=...

# Already configured for email pipeline
EMAIL_TEST_MODE=true
FOUNDER_TEST_EMAIL=...
RESEND_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Find your Slack user ID: click profile → ⋮ → Copy member ID.

Add the same Slack vars to **Vercel** if using production Events API.

---

## Step 3 — Start the bot

```bash
cd access-app
npm run slack:bot
```

Leave running (or use `pm2`, `launchd`, or Cursor Automations to keep alive).

Open Slack → **Apps** → **ACCESS Intelligence** → **Message** the bot:

```
help
send platform brief
research competitor AI orchestration platforms
```

---

## Step 4 — Cursor Automation (optional)

For research without typing npm commands, create a Cursor Automation:

- **Trigger:** Slack message in DM with bot (or schedule)
- **Tools:** Shell, MCP as needed
- **Instructions:** Follow `.cursor/skills/jdai-content-intelligence/SKILL.md`, then run `npm run intelligence:run -- --publish`

Template: `access-app/docs/cursor-automation-access-intelligence.md`

---

## Architecture

```
Slack DM / @mention
       ↓
slack:bot (Socket Mode)  OR  /api/integrations/slack/events (Vercel)
       ↓
parseOperatorIntent → handleOperatorMessage
       ↓
┌──────────────┬─────────────────┬──────────────────┐
│ compile      │ sendDailyBrief  │ runCursorResearch│
│ (local JDAI) │ (email agents)  │ (CURSOR_API_KEY) │
└──────────────┴─────────────────┴──────────────────┘
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `Unauthorized` | Add your Slack user ID to `SLACK_ALLOWED_USER_IDS` |
| `JDAI engine not found` | Run `slack:bot` from machine with monorepo; set `JDAI_CONTENT_ENGINE_PATH` |
| Research fails | Set `CURSOR_API_KEY` or run research in Cursor chat |
| Send works locally, not on Vercel | Vercel can't compile — publish snapshot locally first, or use local bot |
| `intake is not defined` | Fixed — pull latest `intake-snapshot.ts` |

---

## npm reference (bot uses these internally)

```bash
npm run slack:bot              # Start Slack operator
npm run intelligence:run -- --publish
npm run email:daily-brief:send
```

You should not need these once Slack is wired — just text the bot.
