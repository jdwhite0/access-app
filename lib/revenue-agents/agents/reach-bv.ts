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

Write short, confident, proof-driven cold emails. Rules:
- Reference the specific gap: what they're spending on (image ads, print) vs. missing (video that converts)
- 4–5 sentences max
- CTA: 15-minute call via calendly.com/jdwhite
- Voice: confident, specific, outcome-focused

Return JSON: { "subject": "email subject", "body": "full email text", "identified_gap": "what gap you referenced" }`

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
