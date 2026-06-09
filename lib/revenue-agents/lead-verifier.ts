import { generateText } from './ai-provider'

export interface LeadVerification {
  website: {
    reachable: boolean
    title?: string
    has_content: boolean
    content_preview?: string
  }
  social: {
    profiles_found: string[]
    platform_count: number
  }
  activity: {
    has_recent_content: boolean
    evidence?: string
    confidence: 'high' | 'medium' | 'low'
  }
  email: {
    found: boolean
    address?: string
  }
  overall: {
    score_adjustment: number
    confidence: 'verified' | 'likely' | 'uncertain' | 'rejected'
    summary: string
  }
}

const MONTHS_AGO_3 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7)

async function verifyWebsite(url: string): Promise<LeadVerification['website']> {
  const result: LeadVerification['website'] = { reachable: false, has_content: false }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) return result

    result.reachable = true
    const text = await res.text()
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i)
    result.title = titleMatch ? titleMatch[1].trim().slice(0, 200) : undefined

    const bodyText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    result.content_preview = bodyText.slice(0, 500)
    result.has_content = bodyText.length > 200

    return result
  } catch {
    return result
  }
}

function extractSocialProfiles(html: string): string[] {
  const links: string[] = []
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].toLowerCase()
    if (/linkedin\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|youtube\.com|tiktok\.com/.test(href)) {
      links.push(match[1])
    }
  }
  return [...new Set(links)]
}

function hasRecentActivity(text: string): { hasRecent: boolean; evidence?: string } {
  const lower = text.toLowerCase()
  const currentYear = new Date().getFullYear()
  const recentYear = currentYear.toString()
  const lastYear = (currentYear - 1).toString()

  const yearMentions = (lower.match(/\b(202[4-9]|2030)\b/g) || []).filter(y => y === recentYear || y === lastYear)
  if (yearMentions.length > 0) {
    return { hasRecent: true, evidence: `Mentions ${yearMentions.slice(0, 3).join(', ')}` }
  }

  const recentTerms = ['latest', 'new', 'updated', 'recent', 'now', 'current', 'blog', 'news', 'launch', '202', 'this year']
  const found = recentTerms.filter(t => lower.includes(t))
  if (found.length >= 2) {
    return { hasRecent: true, evidence: `Keywords: ${found.slice(0, 3).join(', ')}` }
  }

  if (lower.includes('@') && lower.includes('.')) {
    const emailMatches = lower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emailMatches && emailMatches.length > 0) {
      return { hasRecent: false }
    }
  }

  return { hasRecent: false }
}

export async function verifyLead(params: {
  company: string
  website?: string
  industry?: string
  location?: string
  email?: string
  icp_score: number
  social_links?: string[]
  scraped_content?: string
}): Promise<LeadVerification> {
  const websiteResult: LeadVerification['website'] = { reachable: false, has_content: false }
  const socialResult: LeadVerification['social'] = { profiles_found: params.social_links || [], platform_count: params.social_links?.length || 0 }
  const activityResult: LeadVerification['activity'] = { has_recent_content: false, confidence: 'low' }
  const emailResult: LeadVerification['email'] = { found: false, address: params.email }

  let scrapedContent = params.scraped_content || ''

  if (params.website && !scrapedContent) {
    const wv = await verifyWebsite(params.website)
    Object.assign(websiteResult, wv)
    if (wv.content_preview) scrapedContent = wv.content_preview

    if (wv.content_preview) {
      const html = wv.content_preview
      const socialLinks = extractSocialProfiles(html)
      for (const link of socialLinks) {
        if (!socialResult.profiles_found.includes(link)) {
          socialResult.profiles_found.push(link)
        }
      }
      socialResult.platform_count = socialResult.profiles_found.length

      if (html.length > 200) {
        const recent = hasRecentActivity(html)
        activityResult.has_recent_content = recent.hasRecent
        activityResult.evidence = recent.evidence
        activityResult.confidence = recent.hasRecent ? 'high' : 'medium'
      }
    }
  }

  if (!websiteResult.reachable && params.email) {
    const localPart = params.email.split('@')[0]
    const isRealPattern = !['info', 'hello', 'contact', 'support', 'admin', 'test'].includes(localPart)
    if (isRealPattern) {
      websiteResult.reachable = true
      websiteResult.has_content = false
    }
  }

  if (params.email && params.email.includes('@') && !params.email.includes('example')) {
    emailResult.found = true
    emailResult.address = params.email
  }

  if (!scrapedContent && params.industry && params.location) {
    try {
      const aiPromise = generateText(
        `You are a business verifier. Given a company, determine if it's likely a real, active business.

Reply with EXACTLY ONE of these:
VERIFIED - if you're confident this is a real active business
LIKELY - if it probably exists but you're not certain
UNCERTAIN - if you can't verify
REJECTED - if it sounds fake or fabricated

Then on the next line, give 1 sentence of evidence.`,
        `Company: ${params.company}
Industry: ${params.industry}
Location: ${params.location}
Email: ${params.email || 'unknown'}
Website: ${params.website || 'unknown'}`,
        { maxTokens: 100 }
      )

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI verify timeout')), 12000)
      })

      const result = await Promise.race([aiPromise, timeoutPromise]) as Awaited<typeof aiPromise>
      const verdict = result.content.toUpperCase()
      if (verdict.includes('VERIFIED')) {
        websiteResult.reachable = true
        websiteResult.has_content = true
        activityResult.has_recent_content = true
        activityResult.confidence = 'high'
      } else if (verdict.includes('LIKELY')) {
        websiteResult.reachable = true
        activityResult.has_recent_content = true
        activityResult.confidence = 'medium'
      }
    } catch {}
  }

  let scoreAdjustment = 0
  let overallConfidence: LeadVerification['overall']['confidence'] = 'uncertain'
  let summaryParts: string[] = []

  if (websiteResult.reachable && websiteResult.has_content) {
    scoreAdjustment += 2
    summaryParts.push('website active')
  } else if (websiteResult.reachable) {
    scoreAdjustment += 1
    summaryParts.push('website exists')
  } else {
    scoreAdjustment -= 2
    summaryParts.push('no website')
  }

  if (socialResult.platform_count >= 2) {
    scoreAdjustment += 2
    summaryParts.push(`${socialResult.platform_count} social profiles`)
  } else if (socialResult.platform_count === 1) {
    scoreAdjustment += 1
    summaryParts.push('1 social profile')
  }

  if (activityResult.has_recent_content) {
    scoreAdjustment += 2
    summaryParts.push('recent activity detected')
  } else {
    scoreAdjustment -= 1
    summaryParts.push('no recent activity')
  }

  if (emailResult.found) {
    scoreAdjustment += 1
    summaryParts.push('email found')
  }

  if (scoreAdjustment >= 4) overallConfidence = 'verified'
  else if (scoreAdjustment >= 1) overallConfidence = 'likely'
  else if (scoreAdjustment >= -1) overallConfidence = 'uncertain'
  else overallConfidence = 'rejected'

  return {
    website: websiteResult,
    social: socialResult,
    activity: activityResult,
    email: emailResult,
    overall: {
      score_adjustment: scoreAdjustment,
      confidence: overallConfidence,
      summary: summaryParts.join(', ') || 'no verification signals',
    },
  }
}
