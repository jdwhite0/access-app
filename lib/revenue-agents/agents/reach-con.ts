import { generateText } from '../ai-provider'
import * as api from '../agent-api'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'REACH-CON'
const ARM = 'consulting'
const QUOTA_DAILY = 10

const OFFER_SUMMARY = `Kingdom Consulting builds a Creative Operating System for artists and creative businesses:
- Visual identity framework, brand narrative, content pillars, rollout calendar
- Self-governance model — the client owns it after the engagement
- Price: $10,000–$25,000 per engagement
- Not a service where Jerry does the work forever — it's infrastructure, a transfer of power
- Jerry is a Creative Leadership Partner, not an agency or manager`

const SYSTEM_PROMPT = `You are REACH-CON, an outreach agent for Kingdom Consulting.

You write short, human, specific cold emails. Rules:
- Reference something specific about the lead's work in the first line
- Never start with "I noticed" — it's overused
- Keep it 4–5 sentences max before the CTA
- CTA: invite a 20-minute conversation via calendly.com/jdwhite
- Never generic. If you can't find something specific, note it.
- Voice: human, direct, specific. Not corporate, not salesy.

Return JSON: { "subject": "email subject line", "body": "full email body text", "specific_detail": "what you referenced about their work" }`

export async function run(): Promise<{ success: boolean; summary: string; emailsSent: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, emailsSent: 0 }

  const remaining = Math.min(quota.data!.remaining, QUOTA_DAILY)
  if (remaining <= 0) return { success: true, summary: 'Quota already met for today', emailsSent: 0 }

  // Get queued leads
  const queue = await api.getPipelineLeads(ARM, 'QUEUED', 20)
  if (!queue.ok || !queue.data?.leads?.length) {
    return { success: true, summary: 'No queued leads to contact', emailsSent: 0 }
  }

  let sent = 0
  let skipped = 0
  let lastProvider = 'gemini-pro'

  for (const lead of queue.data.leads.slice(0, remaining)) {
    const l = lead as { id: string; email: string; first_name?: string; company?: string; website?: string; industry?: string; location?: string; icp_notes?: string }

    // Dedup check
    const dedup = await api.checkOutreachDedup(l.email, ARM, 'OUTREACH_1')
    if (dedup.ok && dedup.data?.contacted) { skipped++; continue }

    // Generate email via AI
    const profile = `${l.first_name ?? 'there'}${l.company ? ` at ${l.company}` : ''}${l.industry ? ` (${l.industry})` : ''}${l.location ? ` — ${l.location}` : ''}${l.icp_notes ? `\nScout notes: ${l.icp_notes}` : ''}`

    const emailResult = await generateText(
      SYSTEM_PROMPT,
      `Write a cold email for this lead:\n${profile}\n\nOffer:\n${OFFER_SUMMARY}\n\nMake it specific to them. Reference something real.`
    )
    lastProvider = emailResult.provider

    let email: { subject: string; body: string }
    try {
      email = JSON.parse(emailResult.content) as { subject: string; body: string }
    } catch {
      const lines = emailResult.content.split('\n').filter(Boolean)
      email = { subject: lines[0]?.replace(/^(Subject:|#|\*)/, '').trim() ?? 'Creative infrastructure', body: emailResult.content }
    }

    if (!email.subject || !email.body) { skipped++; continue }

    // Send
    const sendRes = await api.sendAgentEmail({
      to: l.email,
      subject: email.subject,
      body: email.body,
      arm: ARM,
      lead_id: l.id,
      message_type: 'OUTREACH_1',
    })

    if (!sendRes.ok) { skipped++; continue }

    // Record outreach
    await api.recordOutreach({
      email: l.email, arm: ARM, lead_id: l.id, message_type: 'OUTREACH_1',
      subject: email.subject, body_preview: email.body.slice(0, 100),
    })

    // Advance stage
    await api.updateLeadStage(l.id, 'OUTREACH_SENT', 'First outreach sent by REACH-CON')
    sent++

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  if (sent > 0) await api.updateQuota(AGENT_CODE, sent)

  await api.logActivity({
    agent_code: AGENT_CODE,
    action: 'BATCH_OUTREACH',
    arm: ARM,
    success: true,
    details: { emails_sent: sent, skipped, provider: lastProvider },
  })

  const statusIcon = sent > 0 ? '✅' : '⬜'
  const msg = `${statusIcon} *REACH-CON* — Run complete\n📤 Emails sent: ${sent} | ⬇️ Skipped (no specific detail): ${skipped}\n📊 Quota remaining: ${remaining - sent}`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['REACH-CON']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `REACH-CON ${statusIcon} ${sent} consulting outreach sent` }),
  ])

  return {
    success: true,
    summary: `${AGENT_CODE}: ${sent} emails sent, ${skipped} skipped`,
    emailsSent: sent,
  }
}
