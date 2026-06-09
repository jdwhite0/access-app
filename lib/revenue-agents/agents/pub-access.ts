import { generateText, generateJson } from '../ai-provider'
import * as api from '../agent-api'
import { slackPostMessage } from '@/lib/slack/client'
import { AGENT_CHANNELS, EMPIRE_PIPELINE_CHANNEL } from '../slack-channels'

const AGENT_CODE = 'PUB-ACCESS'
const ARM = 'access'
const QUOTA_DAILY = 3

const CONTENT_THEMES = [
  'Systems thinking — why chaos is a choice, builders who systematize first win',
  'AI as infrastructure — difference between using AI tools and having an AI operating system',
  'The operator mindset — running your business like an operator, not a creator',
  'What ACCESS solves — scattered tools, no central command, no visibility into your own operation',
  'Story/proof — how ACCESS users or people like them are building differently',
  'The cost of no system — what it costs to keep operating without infrastructure',
]

const ACCESS_PITCH = `ACCESS is an AI operating system for builders and creative entrepreneurs.
Features: JYSON AI companion, Registry, Pipeline + CRM, Terminal, Vault.
Pricing: Personal $29/mo, Builder $99/mo (14-day free trial), Enterprise $299/mo.
CTA: https://app-iota-inky-62.vercel.app/plans`

export async function run(): Promise<{ success: boolean; summary: string; piecesPublished: number }> {
  const quota = await api.getQuota(AGENT_CODE)
  if (!quota.ok) return { success: false, summary: `Quota check failed: ${quota.error}`, piecesPublished: 0 }

  const remaining = Math.min(quota.data!.remaining, QUOTA_DAILY)
  if (remaining <= 0) return { success: true, summary: 'Quota already met', piecesPublished: 0 }

  // Get recent activity to determine theme cycle
  const themeIndex = new Date().getDate() % CONTENT_THEMES.length
  const theme = CONTENT_THEMES[themeIndex]

  // Generate all 3 pieces
  const content = await generateJson<{
    linkedin: { hook: string; body: string; cta: string }
    twitter: { tweets: string[] }
    short_form: { hook: string }
  }>(
    `You are PUB-ACCESS, the content engine for ACCESS platform.
Create premium, non-generic content. Never sound like marketing copy.
No buzzwords like "revolutionary" or "game-changer."
Theme: ${theme}
Product: ${ACCESS_PITCH}

Return JSON:
{
  "linkedin": { "hook": "first line that stops the scroll", "body": "3-5 short paragraphs", "cta": "natural CTA with link" },
  "twitter": { "tweets": ["hook tweet", "idea 2", "idea 3", "idea 4", "idea 5", "CTA tweet"] },
  "short_form": { "hook": "one powerful line or 3-line sequence" }
}`,
    `Create 3 pieces of content for today's theme: ${theme}
LinkedIn post (150-300 words), Twitter/X thread (5-8 tweets), and a short-form hook.
Make them useful, not salesy. Speak to builders and creative entrepreneurs.`
  )

  // Log LinkedIn content
  const linkedinText = `${content.data.linkedin.hook}\n\n${content.data.linkedin.body}\n\n${content.data.linkedin.cta}`
  console.log(`\n[PUB-ACCESS] LinkedIn:\n${linkedinText}\n`)

  // Log Twitter thread
  const twitterText = content.data.twitter.tweets.join('\n\n')
  console.log(`[PUB-ACCESS] Twitter/X Thread:\n${twitterText}\n`)

  // Log short-form
  console.log(`[PUB-ACCESS] Short-form hook:\n${content.data.short_form.hook}\n`)

  // Log activity (content is drafted, not auto-published — requires manual or Zapier approval)
  await api.logActivity({
    agent_code: AGENT_CODE,
    action: 'CONTENT_DRAFTED',
    arm: ARM,
    success: true,
    details: {
      theme,
      linkedin_length: linkedinText.length,
      twitter_tweets: content.data.twitter.tweets.length,
      short_form_hook: content.data.short_form.hook.slice(0, 80),
      provider: content.provider,
      note: 'Drafted — needs manual publish or Zapier trigger',
    },
  })

  await api.updateQuota(AGENT_CODE, 3, `Content drafted for theme: ${theme.split('—')[0]?.trim()}`)

  const themeName = theme.split('—')[0]?.trim() ?? theme
  const linkedinPreview = linkedinText.slice(0, 120)
  const twitterHook = content.data.twitter.tweets[0] ?? ''
  const msg = `✅ *PUB-ACCESS* — Content ready\n📌 Theme: ${themeName}\n\n*LinkedIn preview:*\n"${linkedinPreview}..."\n\n*Twitter hook:*\n"${twitterHook}"`
  await Promise.all([
    slackPostMessage({ channel: AGENT_CHANNELS['PUB-ACCESS']!, text: msg }),
    slackPostMessage({ channel: EMPIRE_PIPELINE_CHANNEL, text: `PUB-ACCESS ✅ Content published — Theme: ${themeName} — LinkedIn + Twitter ready to post` }),
  ])

  return {
    success: true,
    summary: `${AGENT_CODE}: 3 pieces drafted for theme "${themeName}" — LinkedIn + Twitter + short-form. Ready for review.`,
    piecesPublished: 3,
  }
}
