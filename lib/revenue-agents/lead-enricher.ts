import { generateText } from './ai-provider'

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const SOCIAL_DOMAINS = ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'youtube.com', 'tiktok.com']
const URL_REGEX = /https?:\/\/[^\s"'<>]+/g

export interface EnrichmentCandidate {
  company: string
  website?: string
  industry?: string
  location?: string
  email?: string
}

export interface EnrichmentResult {
  email?: string
  confidence: 'high' | 'medium' | 'low' | 'none'
  source: 'scrape' | 'search' | 'ai' | 'none'
  contact_page?: string
  phone?: string
  social_links: string[]
  verified: boolean
}

async function scrapeWebsite(domain: string): Promise<{
  emails: string[]; social_links: string[]; contact_page?: string; phone?: string
}> {
  const result = { emails: [] as string[], social_links: [] as string[], contact_page: undefined as string | undefined, phone: undefined as string | undefined }
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  const urls = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://www.${domain}`,
    `https://www.${domain}/contact`,
  ]

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadEnricher/1.0)' },
      })
      clearTimeout(timeout)
      if (!res.ok) continue
      const text = await res.text()

      const foundEmails = text.match(EMAIL_REGEX)
      if (foundEmails) {
        for (const e of foundEmails) {
          if (['.png', '.jpg', '.svg', '.gif', '.webp'].some(ext => e.endsWith(ext))) continue
          if (e.includes('noreply') || e.includes('donotreply')) continue
          if (!result.emails.includes(e)) result.emails.push(e)
        }
      }

      const foundPhones = text.match(phoneRegex)
      if (foundPhones && !result.phone) result.phone = foundPhones[0].trim()

      const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi
      let match
      while ((match = linkRegex.exec(text)) !== null) {
        const href = match[1].toLowerCase()
        if (SOCIAL_DOMAINS.some(d => href.includes(d)) && !result.social_links.includes(match[1])) {
          result.social_links.push(match[1])
        }
      }

      if (!result.contact_page && (url.includes('/contact') || url.includes('/about')) && res.ok) {
        result.contact_page = url
      }
    } catch {}
  }

  return result
}

async function searchBrave(query: string): Promise<{
  results: Array<{ title: string; url: string; description: string }>
} | null> {
  const key = process.env.BRAVE_API_KEY?.trim()
  if (!key) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'x-api-key': key },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json() as { web?: { results: Array<{ title: string; url: string; description: string }> } }
    return { results: data.web?.results ?? [] }
  } catch {
    return null
  }
}

async function tryAIEnrich(candidate: EnrichmentCandidate): Promise<{ email?: string; social_links: string[] }> {
  try {
    const result = await generateText(
      `You are a business contact finder. Given a company name, suggest the most likely business contact email.

Rules:
- Do NOT fabricate personal email addresses
- Only suggest company-contact emails (info@, hello@, contact@, support@)
- If a website is given, use it to form the domain
Return as plain text:
EMAIL: <suggestion or "unknown">
SOCIAL: <comma-separated or "none">`,
      `Company: ${candidate.company}
Website: ${candidate.website || 'unknown'}
Industry: ${candidate.industry || 'unknown'}
Location: ${candidate.location || 'unknown'}`
    )

    const emailMatch = result.content.match(/EMAIL:\s*([^\n]+)/)
    const socialMatch = result.content.match(/SOCIAL:\s*([^\n]+)/)

    return {
      email: emailMatch ? emailMatch[1].trim() : undefined,
      social_links: socialMatch && socialMatch[1].trim() !== 'none'
        ? socialMatch[1].split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }
  } catch {
    return { social_links: [] }
  }
}

export async function enrichLead(candidate: EnrichmentCandidate): Promise<EnrichmentResult> {
  const website = candidate.website || `${candidate.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
  const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

  const scrapeResult = await scrapeWebsite(domain)

  if (scrapeResult.emails.length > 0) {
    const bestEmail = scrapeResult.emails.find(e => !e.includes('noreply') && !e.includes('donotreply')) || scrapeResult.emails[0]
    return {
      email: bestEmail,
      confidence: 'high',
      source: 'scrape',
      contact_page: scrapeResult.contact_page,
      phone: scrapeResult.phone,
      social_links: scrapeResult.social_links,
      verified: true,
    }
  }

  const searchQuery = `${candidate.company} ${candidate.location || ''} contact email`.trim()
  const searchResult = await searchBrave(searchQuery)

  if (searchResult && searchResult.results.length > 0) {
    for (const r of searchResult.results) {
      const foundEmails = r.description.match(EMAIL_REGEX) || r.title.match(EMAIL_REGEX)
      if (foundEmails) {
        const email = foundEmails[0]
        if (!email.includes('example') && !email.includes('domain')) {
          return {
            email,
            confidence: 'medium',
            source: 'search',
            social_links: scrapeResult.social_links,
            verified: true,
          }
        }
      }
      if (r.url.includes('linkedin.com') || r.url.includes('facebook.com')) {
        if (!scrapeResult.social_links.includes(r.url)) scrapeResult.social_links.push(r.url)
      }
    }

    const bestResult = searchResult.results[0]
    const aiResult = await tryAIEnrich({
      ...candidate,
      website: bestResult.url,
      email: scrapeResult.emails[0] || candidate.email,
    })

    if (aiResult.email && aiResult.email.includes('@') && !aiResult.email.includes('unknown')) {
      return {
        email: aiResult.email,
        confidence: 'medium',
        source: 'ai',
        social_links: [...new Set([...scrapeResult.social_links, ...aiResult.social_links])],
        verified: true,
      }
    }
  }

  const aiResult = await tryAIEnrich(candidate)

  if (aiResult.email && aiResult.email.includes('@') && !aiResult.email.includes('unknown')) {
    return {
      email: aiResult.email,
      confidence: 'low',
      source: 'ai',
      social_links: [...scrapeResult.social_links, ...aiResult.social_links],
      phone: scrapeResult.phone,
      verified: true,
    }
  }

  if (scrapeResult.social_links.length > 0) {
    return {
      confidence: 'low',
      source: 'scrape',
      social_links: scrapeResult.social_links,
      phone: scrapeResult.phone,
      contact_page: scrapeResult.contact_page,
      verified: true,
    }
  }

  if (candidate.email && candidate.email.includes('@')) {
    return {
      email: candidate.email,
      confidence: 'none',
      source: 'none',
      social_links: [],
      verified: false,
    }
  }

  return { confidence: 'none', source: 'none', social_links: [], verified: false }
}
