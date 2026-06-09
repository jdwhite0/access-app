import { generateJson } from '../ai-provider'
import * as api from '../agent-api'
import { enrichLead } from '../lead-enricher'
import { verifyLead } from '../lead-verifier'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'SCOUT-BV'
const ARM = 'bridge-video'
const DAILY_TARGET = 15
const MIN_SCORE = 7

const SYSTEM_PROMPT = `You are SCOUT-BV — market research analyst for Bridge Video (commercial video production, $2K-$8K/project).

Generate realistic business profiles matching these targeting criteria. These are proto-leads for market analysis — the system will verify them against real-world data.

═══ TARGET PROFILES ═══

1. RESTAURANTS (Tampa Bay area)
   - Running Facebook/Instagram ads with static food photos
   - No video reels, no video ads visible
   - 1+ locations, dine-in service, independent (not chain)

2. REAL ESTATE AGENCIES (Tampa Bay area)
   - Using only photo galleries for listings
   - No property video tours, no agent video intros
   - 5+ active listings

3. FITNESS STUDIOS / GYMS (Tampa Bay area)
   - Promoting with photos only on social media
   - No class preview videos, no trainer reels
   - No client transformation video content

4. MEDICAL / DENTAL PRACTICES (Tampa Bay area)
   - Running ads with stock photos
   - No patient testimonial videos, no office tours
   - No doctor intro videos on website or social

5. RETAIL STORES / BOUTIQUES (Tampa Bay area)
   - Physical storefronts running product ads with still images
   - No product demo videos, no lifestyle videos

═══ RULES ═══
- Use realistic business names and person names
- Assign a plausible website domain based on the company name
- Score 1-10 based on match quality
- Never fabricate personal emails — use info@ or hello@ format
- If you don't know a specific real person's name, use realistic placeholder names
- Location must be Tampa Bay / Florida

Return JSON: { "leads": [{ "first_name": "", "last_name": "", "email": "info@business.com", "company": "", "title": "Owner/Marketing Director", "website": "", "industry": "", "location": "Tampa, FL", "icp_score": 8, "icp_notes": "", "source_url": "" }] }`

export async function run(): Promise<{ success: boolean; summary: string; leadsAdded: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, leadsAdded: 0 }

  const remaining = Math.min(quota.data!.remaining, DAILY_TARGET)
  if (remaining <= 0) return { success: true, summary: 'Quota already met for today', leadsAdded: 0 }

  const result = await generateJson<{ leads: Array<{
    first_name?: string; last_name?: string; email: string; company?: string; title?: string
    website?: string; industry?: string; location?: string; icp_score: number; icp_notes?: string; source_url?: string
  }> }>(
    SYSTEM_PROMPT,
    `Generate ${Math.min(remaining, DAILY_TARGET)} realistic market profiles for video production targeting in Tampa Bay.

Segments to cover (spread evenly):
1. Independent restaurants running photo-only ads
2. Real estate agencies without video tours
3. Fitness studios with no video content
4. Medical/dental practices using stock photos
5. Retail stores with only still images

Each profile needs: first_name, last_name, company, website, title, location (City, FL), email (info@ or hello@), icp_score (1-10), icp_notes explaining the match.`,
    { maxTokens: 8192 }
  )

  const leads = result.data.leads ?? []
  let added = 0
  let skipped = 0
  let verified = 0
  let rejected = 0

  for (const lead of leads) {
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
      title: lead.title ?? 'Business Owner',
      website: lead.website,
      industry: lead.industry ?? 'Local Business',
      location: lead.location,
      icp_score: adjustedScore,
      icp_notes: `${lead.icp_notes || ''} | Verified: ${verification.overall.confidence} (${verification.overall.summary})`.trim(),
      source_agent: AGENT_CODE,
      source_url: lead.source_url,
      tags: [ARM, 'video', lead.industry ?? 'general'].filter(Boolean),
      raw_data: {
        original_score: lead.icp_score,
        score_adjustment: verification.overall.score_adjustment,
        verification: verification.overall,
        enrichment: enriched,
        estimated_value: 5000,
        deal_range: '2000-8000',
      },
    })

    if (res.ok && res.data?.created) added++
  }

  if (added > 0) await api.updateQuota(AGENT_CODE, added, `AI-scouted ${added} BV leads (${rejected} rejected by verification)`)

  await api.logActivity({
    agent_code: AGENT_CODE,
    action: 'BATCH_SCOUT',
    arm: ARM,
    success: true,
    details: {
      funnel: { discovered: leads.length, scored: leads.length - skipped, verified, submitted: added, rejected },
      quota: { target: DAILY_TARGET, remaining: remaining - added },
      provider: result.provider,
      enrichment: true,
      verification: true,
    },
  })

  const statusIcon = added > 0 ? '✅' : '⬜'
  const msg = `${statusIcon} *SCOUT-BV* — Run complete\n✅ Added: ${added} leads | ⬇️ Skipped: ${skipped} low score / ${rejected} rejected\n📊 Quota remaining: ${remaining - added}`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['SCOUT-BV']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `SCOUT-BV ${statusIcon} ${added} Bridge Video leads added — quota remaining: ${remaining - added}` }),
  ])

  return {
    success: true,
    summary: `${AGENT_CODE}: ${added} added, ${rejected} rejected by verification, ${skipped} skipped`,
    leadsAdded: added,
  }
}
