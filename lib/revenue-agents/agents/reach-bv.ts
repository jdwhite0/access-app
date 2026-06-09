import { generateText } from '../ai-provider'
import * as api from '../agent-api'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'REACH-BV'
const ARM = 'bridge-video'
const QUOTA_DAILY = 15

const OFFER_SUMMARY = `Bridge Video makes commercials the kind people remember.
- Brand films and product videos: $2,000–$8,000/project
- Monthly content retainer: $3,000–$5,000/month
- Based in Tampa, FL — serving local and national brands
- Story-first production: not just shooting video, building the narrative that makes someone stop scrolling`

const SYSTEM_PROMPT = `You are REACH-BV, an outreach agent for Bridge Video.

You write gap-selling emails that make the prospect feel the cost of NOT having video — before you ever mention Bridge Video.

CORE PHILOSOPHY: The sale is the gap between where they are (static ads, no story, low retention) and where they want to be (brand that stops the scroll, video that earns trust). Widen the gap first. The bigger the gap feels, the more obvious Bridge Video becomes.

VALUE EQUATION FOR THIS OFFER:
- Dream outcome: A commercial people actually watch — and remember the brand after
- Likelihood: Show you've done it (story-first production, not commodity shooting)
- Time delay: Fast turnaround, deliverable in weeks not months
- Effort: Turnkey — they just show up, Bridge handles everything

GAP OPENERS (pick the most relevant to their industry/notes):
- Restaurant / Retail: "Most [type] businesses run image ads that get scrolled past. Video that tells the story of the food / the product / the people behind it converts 3-5x better — but very few local brands have figured that out yet."
- B2B / Service: "Companies at your stage usually have great case studies buried in decks nobody watches. A 90-second brand film surfaces that proof where buyers actually look."
- Brand with social presence: "Your photos are doing the work but video is where [industry] audiences spend 80% of their time. There's a gap between what you're producing and where attention lives."

IMPLICATION SEEDS (embed one naturally, don't list):
- What's the cost of losing a customer who checked your Instagram and left because nothing showed them what the experience actually feels like?
- Static ads get impressions. Video earns trust. Which one closes deals?
- At $X/month in ad spend, how much of that is reaching people who don't feel anything?

EMAIL RULES:
- 4–5 sentences before CTA. Clean, white space, readable
- CTA: 15-minute call via calendly.com/jdwhite — no friction
- Voice: confident creative director, not desperate vendor
- Never say "just checking in" or "I wanted to reach out"
- Subject: curiosity + relevance. Under 8 words.

Return JSON: { "subject": "email subject", "body": "full email text", "identified_gap": "the specific gap you surfaced", "opener_type": "restaurant_retail | b2b_service | social_brand" }`

export async function run(): Promise<{ success: boolean; summary: string; emailsSent: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, emailsSent: 0 }

  const remaining = Math.min(quota.data!.remaining, QUOTA_DAILY)
  if (remaining <= 0) return { success: true, summary: 'Quota already met', emailsSent: 0 }

  const queue = await api.getPipelineLeads(ARM, 'QUEUED', 15)
  if (!queue.ok || !queue.data?.leads?.length) {
    return { success: true, summary: 'No queued leads', emailsSent: 0 }
  }

  let sent = 0
  let skipped = 0

  for (const lead of queue.data.leads.slice(0, remaining)) {
    const l = lead as { id: string; email: string; first_name?: string; company?: string; website?: string; industry?: string; location?: string; icp_notes?: string }

    const dedup = await api.checkOutreachDedup(l.email, ARM, 'OUTREACH_1')
    if (dedup.ok && dedup.data?.contacted) { skipped++; continue }

    const profile = `${l.first_name ?? 'there'}${l.company ? ` at ${l.company}` : ''}${l.industry ? ` (${l.industry})` : ''}${l.location ? ` — ${l.location}` : ''}`
    const gapHint = l.icp_notes ?? 'likely running static ads without video'

    const emailResult = await generateText(
      SYSTEM_PROMPT,
      `Lead: ${profile}\nSuspected gap: ${gapHint}\n\nOffer:\n${OFFER_SUMMARY}\n\nWrite a specific email referencing their ad gap.`
    )

    let email: { subject: string; body: string }
    try { email = JSON.parse(emailResult.content) } catch { email = { subject: 'Video for your business', body: emailResult.content } }

    if (!email.body) { skipped++; continue }

    const sendRes = await api.sendAgentEmail({
      to: l.email, subject: email.subject, body: email.body,
      arm: ARM, lead_id: l.id, message_type: 'OUTREACH_1',
    })
    if (!sendRes.ok) { skipped++; continue }

    await api.recordOutreach({
      email: l.email, arm: ARM, lead_id: l.id, message_type: 'OUTREACH_1',
      subject: email.subject, body_preview: email.body.slice(0, 100),
    })
    await api.updateLeadStage(l.id, 'OUTREACH_SENT', 'First outreach by REACH-BV')
    sent++
    await new Promise(r => setTimeout(r, 500))
  }

  if (sent > 0) await api.updateQuota(AGENT_CODE, sent)

  await api.logActivity({
    agent_code: AGENT_CODE, action: 'BATCH_OUTREACH', arm: ARM, success: true,
    details: { emails_sent: sent, skipped },
  })

  const statusIcon = sent > 0 ? '✅' : '⬜'
  const msg = `${statusIcon} *REACH-BV* — Run complete\n📤 Emails sent: ${sent} | ⬇️ Skipped (no gap identified): ${skipped}`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['REACH-BV']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `REACH-BV ${statusIcon} ${sent} Bridge Video outreach sent` }),
  ])

  return { success: true, summary: `${AGENT_CODE}: ${sent} sent, ${skipped} skipped`, emailsSent: sent }
}
