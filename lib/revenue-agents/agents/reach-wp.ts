import { generateText } from '../ai-provider'
import * as api from '../agent-api'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'REACH-WP'
const ARM = 'wholesale-payments'
const QUOTA_DAILY = 75

const OFFER_SUMMARY = `Wholesale Payments Dual Pricing Program:
- Eliminates credit card processing fees entirely (not reduces — eliminates)
- Business doing $100K/month: from $2,500/month fees to $45 flat
- Legal in all 50 states under Durbin Amendment (2010 Dodd-Frank Law)
- Free state-of-the-art equipment included
- $500 guarantee: if we can't beat current rates, Jerry writes them a check
- Jerry White, Account Manager`

const SYSTEM_PROMPT = `You are REACH-WP, an outreach agent for Wholesale Payments.

You write short, human cold emails that create curiosity. Rules:
- Use Opener A (Rewards Hook) for restaurants, retail, salons, spas — ask about "getting your points"
- Use Opener B (Fee Eliminator) for auto shops, gyms, medical offices — ask about processing fees
- 5–8 sentences max
- Always personalize: swap in business type and city
- Never say "act now" or "limited availability"
- CTA: 5-minute call
- Sign as: Jerry White, Account Manager

Return JSON: { "subject": "subject line", "body": "full email body including signature" }`

export async function run(): Promise<{ success: boolean; summary: string; emailsSent: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, emailsSent: 0 }

  const remaining = Math.min(quota.data!.remaining, QUOTA_DAILY)
  if (remaining <= 0) return { success: true, summary: 'Quota already met', emailsSent: 0 }

  // Get leads across all stages (QUEUED first, then follow-up stages)
  const queue = await api.getPipelineLeads(ARM, 'QUEUED', 30)
  const followUp1 = await api.getPipelineLeads(ARM, 'OUTREACH_SENT', 15)
  const allLeads = [
    ...(queue.data?.leads ?? []),
    ...(followUp1.data?.leads ?? []),
  ]

  if (!allLeads.length) {
    return { success: true, summary: 'No leads in pipeline for outreach', emailsSent: 0 }
  }

  let sent = 0
  let skipped = 0

  for (const lead of allLeads.slice(0, remaining)) {
    const l = lead as { id: string; email: string; first_name?: string; company?: string; stage: string; website?: string; industry?: string; location?: string }

    const messageType = l.stage === 'QUEUED' ? 'OUTREACH_1' : l.stage === 'OUTREACH_SENT' ? 'FOLLOW_UP_1' : 'OUTREACH_1'

    const dedup = await api.checkOutreachDedup(l.email, ARM, messageType)
    if (dedup.ok && dedup.data?.contacted) { skipped++; continue }

    const bizType = l.industry ?? 'local business'
    const city = l.location?.split(',')[0]?.trim() ?? 'your area'
    const targetName = l.first_name ?? 'there'

    const systemPrompt = messageType === 'OUTREACH_1'
      ? SYSTEM_PROMPT
      : `You are REACH-WP sending a follow-up email. This lead was contacted before but didn't reply.
         Subject: "The $500 Guarantee — ${l.company ?? 'your business'}"
         Keep it short, polite, reference the $500 guarantee. CTA: 5-minute call comparison.`

    const userPrompt = messageType === 'OUTREACH_1'
      ? `Write an OUTREACH_1 cold email for: Business: ${l.company ?? 'Unknown'}, Type: ${bizType}, Location: ${city}, Owner: ${targetName}.\n\nOffer: ${OFFER_SUMMARY}`
      : `Write a FOLLOW_UP_1 email for: ${l.company ?? 'Unknown'} (${bizType}, ${city}). Contacted before with outreach email. Now send follow-up about the $500 guarantee.`

    const emailResult = await generateText(systemPrompt, userPrompt)
    let email: { subject: string; body: string }
    try { email = JSON.parse(emailResult.content) } catch { email = { subject: `Quick question for ${l.company ?? 'your business'}`, body: emailResult.content } }

    if (!email.body) { skipped++; continue }

    const bodyWithSig = email.body.includes('Jerry White')
      ? email.body
      : `${email.body}\n\nJerry White\nAccount Manager, Wholesale Payments\n(813) 790-8810\njerry.white@wholesalepayments.com`

    const sendRes = await api.sendAgentEmail({
      to: l.email, subject: email.subject, body: bodyWithSig,
      arm: ARM, lead_id: l.id, message_type: messageType as 'OUTREACH_1' | 'FOLLOW_UP_1',
    })
    if (!sendRes.ok) { skipped++; continue }

    await api.recordOutreach({
      email: l.email, arm: ARM, lead_id: l.id, message_type: messageType,
      subject: email.subject, body_preview: bodyWithSig.slice(0, 100),
    })

    const nextStage = l.stage === 'QUEUED' ? 'OUTREACH_SENT' : 'FOLLOW_UP_1'
    await api.updateLeadStage(l.id, nextStage, `${messageType} sent by REACH-WP`)
    sent++
    await new Promise(r => setTimeout(r, 300))
  }

  if (sent > 0) await api.updateQuota(AGENT_CODE, sent)

  await api.logActivity({
    agent_code: AGENT_CODE, action: 'BATCH_OUTREACH', arm: ARM, success: true,
    details: { emails_sent: sent, skipped },
  })

  const statusIcon = sent > 0 ? '✅' : '⬜'
  const msg = `${statusIcon} *REACH-WP* — Run complete\n📤 Emails sent: ${sent} | ⬇️ Skipped: ${skipped}\n📊 Quota remaining: ${remaining - sent}`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['REACH-WP']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `REACH-WP ${statusIcon} ${sent} WP outreach sent` }),
  ])

  return { success: true, summary: `${AGENT_CODE}: ${sent} sent, ${skipped} skipped`, emailsSent: sent }
}
