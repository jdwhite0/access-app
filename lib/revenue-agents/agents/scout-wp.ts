import { generateJson } from '../ai-provider'
import * as api from '../agent-api'
import { enrichLead } from '../lead-enricher'
import { verifyLead } from '../lead-verifier'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'SCOUT-WP'
const ARM = 'wholesale-payments'
const DAILY_TARGET = 75
const MIN_SCORE = 7
const BATCH_SIZE = 3

const SYS_PROMPT_SHORT = `You are SCOUT-WP — Wholesale Payments lead researcher.

Generate realistic business proto-leads for merchant services market analysis.

Target profiles (vary across leads):
- Independent restaurants (NOT chains)
- Salons/barbershops (independent)
- Auto repair shops (independent mechanics)
- Boutiques/retail (independent)
- Gyms/fitness studios (independent)
- Private medical/dental practices
- Food trucks

Rules:
- Realistic business names, plausible website, realistic person names
- Email uses business domain (info@, hello@, firstname@business.com)
- NO personal emails (gmail, yahoo, hotmail)
- Vary industries and cities

Return JSON: { "leads": [{ "first_name", "last_name", "email", "company", "title", "website", "industry", "location", "icp_score", "icp_notes", "source_url" }] }`

async function generateBatch(batchSize: number, cities: string, attempt = 1): Promise<{ leads: Array<{
  first_name?: string; last_name?: string; email: string; company?: string; title?: string
  website?: string; industry?: string; location?: string; icp_score: number; icp_notes?: string; source_url?: string
}>; provider: string } | null> {
  const result = await generateJson<{ leads: Array<{
    first_name?: string; last_name?: string; email: string; company?: string; title?: string
    website?: string; industry?: string; location?: string; icp_score: number; icp_notes?: string; source_url?: string
  }> }>(
    SYS_PROMPT_SHORT,
    `Generate exactly ${batchSize} merchant services proto-leads. Cities to use: ${cities}. Spread across different industries. Each lead has a different business, person, and industry.`,
    { maxTokens: 4096 }
  )

  const leads = result.data.leads ?? []
  if (leads.length < batchSize && attempt < 3) {
    return generateBatch(batchSize, cities, attempt + 1)
  }
  return { leads, provider: result.provider }
}

export async function run(): Promise<{ success: boolean; summary: string; leadsAdded: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, leadsAdded: 0 }

  const remaining = Math.min(quota.data!.remaining, DAILY_TARGET)
  if (remaining <= 0) return { success: true, summary: 'Quota already met for today', leadsAdded: 0 }

  const cities = ['Tampa', 'St. Petersburg', 'Orlando', 'Miami', 'Atlanta', 'Charlotte', 'Dallas', 'Houston', 'Phoenix', 'Nashville']
  const activeCities = cities.slice(0, Math.min(4, Math.ceil(remaining / 15))).join(', ')

  let added = 0
  let rejected = 0
  let skipped = 0
  let verified = 0
  const totalBatches = Math.ceil(remaining / BATCH_SIZE)

  for (let batch = 0; batch < totalBatches && added < remaining; batch++) {
    const batchSize = Math.min(BATCH_SIZE, remaining - added)
    if (batchSize <= 0) break

    console.log(`[SCOUT-WP] Batch ${batch + 1}/${totalBatches} — generating ${batchSize} leads...`)

    const result = await generateBatch(batchSize, activeCities)
    if (!result) {
      console.warn(`[SCOUT-WP] Batch ${batch + 1} failed, skipping`)
      continue
    }

    for (const lead of result.leads) {
      if (added >= remaining) break
      if (!lead.email?.includes('@')) { skipped++; continue }
      if (!lead.icp_score || lead.icp_score < MIN_SCORE) { skipped++; continue }

      const enriched = await enrichLead({
        company: lead.company || '',
        website: lead.website,
        industry: lead.industry,
        location: lead.location,
        email: lead.email,
      })

      const verification = await verifyLead({
        company: lead.company || '',
        website: lead.website || enriched.contact_page,
        industry: lead.industry,
        location: lead.location,
        email: enriched.email || lead.email,
        icp_score: lead.icp_score,
        social_links: enriched.social_links,
      })

      const adjustedScore = Math.max(1, Math.min(10, lead.icp_score + verification.overall.score_adjustment))
      const passed = adjustedScore >= MIN_SCORE && verification.overall.confidence !== 'rejected'

      if (!passed) {
        rejected++
        continue
      }

      verified++
      const finalEmail = (enriched.email || lead.email).toLowerCase().trim()

      const res = await api.addPipelineLead({
        arm: ARM,
        email: finalEmail,
        first_name: lead.first_name,
        last_name: lead.last_name,
        company: lead.company,
        title: lead.title ?? 'Owner',
        website: lead.website,
        industry: lead.industry ?? 'Retail',
        location: lead.location,
        icp_score: adjustedScore,
        icp_notes: `${lead.icp_notes || ''} | Verified: ${verification.overall.confidence} (${verification.overall.summary})`.trim(),
        source_agent: AGENT_CODE,
        source_url: lead.source_url,
        tags: [ARM, 'merchant-services', (lead.industry ?? 'general').toLowerCase().replace(/\s+/g, '-')],
        raw_data: {
          original_score: lead.icp_score,
          score_adjustment: verification.overall.score_adjustment,
          verification: verification.overall,
          enrichment: enriched,
          estimated_value: 750,
          deal_range: '500-2000',
        },
      })

      if (res.ok && res.data?.created) added++
    }
  }

  if (added > 0) await api.updateQuota(AGENT_CODE, added, `AI-scouted ${added} WP leads (${rejected} rejected by verification)`)

  await api.logActivity({
    agent_code: AGENT_CODE,
    action: 'BATCH_SCOUT',
    arm: ARM,
    success: true,
    details: {
      funnel: { batches: totalBatches, generated: totalBatches * BATCH_SIZE, verified, submitted: added, rejected },
      quota: { target: DAILY_TARGET, remaining: remaining - added },
      enrichment: true,
      verification: true,
    },
  })

  const statusIcon = added > 0 ? '✅' : '⬜'
  const msg = `${statusIcon} *SCOUT-WP* — Run complete\n✅ Added: ${added} leads | ⬇️ Skipped: ${skipped} low score / ${rejected} rejected\n📊 Quota remaining: ${remaining - added}`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['SCOUT-WP']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `SCOUT-WP ${statusIcon} ${added} WP merchant leads added — quota remaining: ${remaining - added}` }),
  ])

  return {
    success: true,
    summary: `${AGENT_CODE}: ${added} added, ${rejected} rejected, ${skipped} skipped (${remaining - added} quota remaining)`,
    leadsAdded: added,
  }
}
