import { getAppBaseUrl } from '@/lib/email/constants'

const BRAND = {
  muted: '#8b92a8',
  text: '#e8eaef',
  link: '#6eb5ff',
  border: 'rgba(255,255,255,0.08)',
  accentSoft: 'rgba(124,108,240,0.12)',
}

export function signalStrip(category: string, summary: string): string {
  return `
    <div style="margin:0 0 16px;padding:12px 14px;background:${BRAND.accentSoft};border:1px solid rgba(124,108,240,0.25);border-radius:8px;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">${category}</p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.text};">${summary}</p>
    </div>
  `
}

export type HeadlineInput = {
  title: string
  explainer?: string
  source_url?: string
  source_label?: string
}

export function headlinesBlock(headlines: HeadlineInput[]): string {
  if (!headlines.length) return ''
  const items = headlines
    .map((h) => {
      const link = h.source_url
        ? `<a href="${h.source_url}" style="color:${BRAND.link};text-decoration:underline;">${h.source_label ?? 'Source'}</a>`
        : ''
      const explainer = h.explainer
        ? `<p style="margin:6px 0 0;font-size:13px;color:${BRAND.muted};"><em>What's going on here?</em> ${h.explainer}</p>`
        : ''
      return `<li style="margin:0 0 14px;font-size:14px;color:${BRAND.text};"><strong>${h.title}</strong>${explainer}${link ? `<br/><span style="font-size:11px;">${link}</span>` : ''}</li>`
    })
    .join('')
  return `
    <div style="margin:0 0 16px;padding:14px 16px;border:1px solid ${BRAND.border};border-radius:8px;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Curated headlines</p>
      <ul style="margin:0;padding-left:18px;">${items}</ul>
    </div>
  `
}

export function takeawaysBlock(takeaways: string[]): string {
  if (!takeaways.length) return ''
  const items = takeaways.map((t) => `<li style="margin:0 0 6px;">${t}</li>`).join('')
  return `
    <div style="margin:0 0 16px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Key takeaways</p>
      <ul style="margin:0;padding-left:18px;font-size:14px;color:${BRAND.text};">${items}</ul>
    </div>
  `
}

export type VisualIdeaInput = { slot?: string; description?: string; format?: string }

export function visualSlotBlock(ideas: VisualIdeaInput[]): string {
  const first = ideas[0]
  if (!first?.description) return ''
  return `
    <div style="margin:0 0 16px;padding:20px 16px;border:1px dashed ${BRAND.border};border-radius:8px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">${first.slot ?? 'Visual'} · ${first.format ?? 'chart'}</p>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};">${first.description}</p>
      <p style="margin:8px 0 0;font-size:12px;"><a href="${getAppBaseUrl()}/dashboard" style="color:${BRAND.link};">View in ACCESS →</a></p>
    </div>
  `
}

export function feedbackBlock(dossierId: string, email: string): string {
  const base = getAppBaseUrl()
  const q = (rating: string) =>
    `${base}/api/email/feedback?dossier=${encodeURIComponent(dossierId)}&email=${encodeURIComponent(email)}&rating=${rating}`
  return `
    <div style="margin:16px 0 0;padding-top:14px;border-top:1px solid ${BRAND.border};">
      <p style="margin:0 0 10px;font-size:12px;color:${BRAND.muted};">Was this brief useful?</p>
      <a href="${q('useful')}" style="display:inline-block;margin-right:8px;padding:8px 14px;font-size:12px;color:${BRAND.text};text-decoration:none;border:1px solid ${BRAND.border};border-radius:6px;">Yes</a>
      <a href="${q('not_useful')}" style="display:inline-block;padding:8px 14px;font-size:12px;color:${BRAND.muted};text-decoration:none;border:1px solid ${BRAND.border};border-radius:6px;">Not really</a>
    </div>
  `
}

export function socialLinksBlock(): string {
  return `
    <p style="margin:12px 0 0;font-size:11px;color:${BRAND.muted};">
      <a href="https://jdwhite.world" style="color:${BRAND.link};text-decoration:underline;">JD Productions</a>
      · Follow the build on LinkedIn
    </p>
  `
}
