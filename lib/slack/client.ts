export async function slackPostMessage(input: {
  channel: string
  text: string
  threadTs?: string
}): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN?.trim()
  if (!token) return { ok: false, error: 'SLACK_BOT_TOKEN not configured' }

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: input.channel,
      text: input.text,
      thread_ts: input.threadTs,
      unfurl_links: false,
    }),
  })

  const data = (await res.json()) as { ok?: boolean; ts?: string; error?: string }
  return { ok: data.ok === true, ts: data.ts, error: data.error }
}

export async function slackAddReaction(input: {
  channel: string
  timestamp: string
  emoji: string
}): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN?.trim()
  if (!token) return
  await fetch('https://slack.com/api/reactions.add', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: input.channel,
      timestamp: input.timestamp,
      name: input.emoji.replace(/:/g, ''),
    }),
  })
}
