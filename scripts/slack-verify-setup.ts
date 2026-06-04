/**
 * Diagnose Slack bot setup. Run: npm run slack:verify
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'

async function main() {
  loadAccessEnv()

  const appToken = process.env.SLACK_APP_TOKEN?.trim()
  const botToken = process.env.SLACK_BOT_TOKEN?.trim()
  const allow = process.env.SLACK_ALLOWED_USER_IDS?.trim()

  const checks: { name: string; ok: boolean; detail?: string }[] = []

  checks.push({
    name: 'SLACK_APP_TOKEN (xapp-)',
    ok: Boolean(appToken?.startsWith('xapp-')),
    detail: appToken ? 'set' : 'missing from .env.local',
  })
  checks.push({
    name: 'SLACK_BOT_TOKEN (xoxb-)',
    ok: Boolean(botToken?.startsWith('xoxb-')),
    detail: botToken ? 'set' : 'missing from .env.local',
  })

  if (botToken) {
    const auth = (await fetch('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${botToken}` },
    }).then((r) => r.json())) as { ok?: boolean; user?: string; user_id?: string; error?: string }

    checks.push({
      name: 'Bot token valid (auth.test)',
      ok: auth.ok === true,
      detail: auth.ok ? `@${auth.user} (${auth.user_id})` : auth.error,
    })
  }

  checks.push({
    name: 'SLACK_ALLOWED_USER_IDS',
    ok: true,
    detail: allow
      ? `restricted to: ${allow} — your Slack member ID must match exactly`
      : 'not set (all users allowed)',
  })

  console.log(JSON.stringify({ ok: checks.every((c) => c.ok || c.name.includes('ALLOWED')), checks }, null, 2))

  console.log(`
Next steps if bot still silent:
1. Slack app → Socket Mode: ON
2. Slack app → Event Subscriptions → Subscribe to bot events:
   • app_mention
   • message.im
3. Slack app → OAuth scopes: chat:write, im:history, im:read, app_mentions:read
4. Reinstall app to workspace after scope changes
5. DM the bot directly (Apps → ACCESS Intelligence → Message)
   OR @mention in a channel — plain channel messages are ignored
6. Run: npm run slack:bot
7. Terminal must show: [slack:bot] Listening
8. When you DM, terminal must show: [slack:bot] event message D...
`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
