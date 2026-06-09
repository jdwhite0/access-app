import { generateJson } from '../ai-provider'
import * as api from '../agent-api'
import { enrichLead } from '../lead-enricher'
import { verifyLead } from '../lead-verifier'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'SCOUT-CON'
const ARM = 'consulting'
const DAILY_TARGET = 10
const MIN_SCORE = 7

const SYSTEM_PROMPT = `You are SCOUT-CON — market research analyst for a creative consulting firm ($10K-$25K engagements).

Generate realistic business profiles matching these targeting criteria. These are proto-leads for market analysis — the system will verify them against real-world data.

═══ TARGET PROFILES ═══

1. INDEPENDENT MUSIC ARTISTS (Tampa Bay / Florida)
   - 1K-50K monthly listeners on streaming platforms
   - Active Instagram but inconsistent posting
   - No cohesive brand identity across platforms
   - Genres: hip-hop, gospel, R&B, indie, Christian

2. PODCASTERS (Florida-based)  
   - Growing audience, no professional visual brand
   - Generic cover art, inconsistent social media presence
   - Topics: business, creativity, Christianity, culture

3. SMALL CREATIVE AGENCIES (Tampa Bay)
   - 1-10 employees, service-based (branding, web, video)
   - Growing but no operational systems or strategic framework

4. CHURCH MEDIA LEADERS (Tampa area)
   - Managing media/creative teams
   - Need strategic brand framework, not just production

5. CREATIVE ENTREPRENEURS (Florida)
   - Consultants, coaches, course creators
   - Launched product/service but no brand strategy

═══ RULES ═══
- Use realistic company and person names
- Assign a plausible website domain based on the company name
- Score 1-10 based on how well they match the criteria above
- Never fabricate personal email addresses — use info@ or hello@ format
- If you don't know a specific real person's name, use realistic placeholder names
- Location must be in Florida (Tampa Bay preferred)

Return JSON: { "leads": [{ "first_name": "", "last_name": "", "email": "info@domain.com", "company": "Company Name", "title": "Owner/Creator", "website": "https://domain.com", "industry": "", "location": "City, FL", "icp_score": 8, "icp_notes": "Why this profile matches", "source_url": "" }] }`

export async function run(): Promise<{ success: boolean; summary: string; leadsAdded: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, leadsAdded: 0 }

  const remaining = Math.min(quota.data!.remaining, DAILY_TARGET)
  if (remaining <= 0) return { success: true, summary: 'Quota already met for today', leadsAdded: 0 }

  const maxLeads = Math.min(remaining, DAILY_TARGET)
  const result = await generateJson<{ leads: Array<{
    first_name?: string; last_name?: string; email: string; company?: string; title?: string
    website?: string; industry?: string; location?: string; icp_score: number; icp_notes?: string; source_url?: string
  }> }>(
    SYSTEM_PROMPT,
    `Generate ${maxLeads} realistic market profiles for creative consulting targeting in Florida.

Segments to cover (spread evenly):
1. Independent musicians (Tampa Bay area) — hip-hop, gospel, R&B
2. Podcasters (Florida-based) — growing shows without cohesive branding
3. Small creative agencies (Tampa Bay) — 1-10 people, service-based
4. Church media directors (Tampa) — leading creative teams
5. Creative entrepreneurs (Florida) — consultants and course creators

Each profile needs: first_name, last_name, company, website, title, location (City, FL), email (info@ or hello@ format), icp_score (1-10), icp_notes explaining the match.`,
    { maxTokens: 8192 }
  )

  const leads = result.data.leads ?? []
  let added = 0
  let skipped = 0
  let verified = 0
  let rejected = 0

  for (const lead of leads) {
    if (added >= maxLeads) break
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
      title: lead.title ?? 'Creative Professional',
      website: lead.website,
      industry: lead.industry ?? 'Creative',
      location: lead.location,
      icp_score: adjustedScore,
      icp_notes: `${lead.icp_notes || ''} | Verified: ${verification.overall.confidence} (${verification.overall.summary})`.trim(),
      source_agent: AGENT_CODE,
      source_url: lead.source_url,
      tags: [ARM, 'creative', lead.industry ?? 'general'].filter(Boolean),
      raw_data: {
        original_score: lead.icp_score,
        score_adjustment: verification.overall.score_adjustment,
        verification: verification.overall,
        enrichment: enriched,
        estimated_value: 17500,
        deal_range: '10000-25000',
      },
    })

    if (res.ok && res.data?.created) {
      added++
    }
  }

  if (added > 0) {
    await api.updateQuota(AGENT_CODE, added, `AI-scouted ${added} leads (${rejected} rejected by verification)`)
  }

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
  const msg = `${statusIcon} *SCOUT-CON* — Run complete\n✅ Added: ${added} leads | ⬇️ Skipped: ${skipped} low score / ${rejected} rejected\n📊 Quota remaining: ${remaining - added}`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['SCOUT-CON']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `SCOUT-CON ${statusIcon} ${added} consulting leads added — quota remaining: ${remaining - added}` }),
  ])

  return {
    success: true,
    summary: `${AGENT_CODE}: ${added} added, ${rejected} rejected by verification, ${skipped} skipped (${remaining - added} quota remaining)`,
    leadsAdded: added,
  }
}
