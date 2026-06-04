/**
 * Tiny, email-safe Markdown → inline HTML renderer.
 *
 * The intelligence dossiers are authored in Markdown (**bold**, _italics_,
 * `[text](url)`, `---` rules, leading `##` headers). Dumping that straight
 * into an email leaks raw asterisks and dashes — which reads like a bot.
 * This converts the small subset we actually use, and nothing else.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Strip markdown noise that should never reach the reader. */
export function cleanText(raw: string): string {
  return String(raw ?? '')
    .replace(/^#{1,6}\s+/gm, '') // leading headers like "## Audience"
    .replace(/\s*-{3,}\s*$/g, '') // trailing horizontal rules "---"
    .replace(/^\s*-{3,}\s*$/gm, '') // standalone rule lines
    .replace(/^\s*\*{3,}\s*$/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/** Render a single line/paragraph of markdown to inline HTML (no <p> wrapper). */
export function mdInline(raw: string, linkColor = '#2563eb'): string {
  let s = escapeHtml(cleanText(raw))

  // Links: [label](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label, url) =>
      `<a href="${url}" style="color:${linkColor};text-decoration:underline;">${label}</a>`
  )

  // Bold: **x** or __x__  (protect with placeholder so italics don't double-fire)
  s = s.replace(/\*\*([^*]+)\*\*/g, '\u0001$1\u0002')
  s = s.replace(/__([^_]+)__/g, '\u0001$1\u0002')
  // Italic: *x* or _x_
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1\u0003$2\u0004')
  s = s.replace(/(^|[\s(])_([^_\n]+)_/g, '$1\u0003$2\u0004')

  s = s
    .replace(/\u0001/g, '<strong>')
    .replace(/\u0002/g, '</strong>')
    .replace(/\u0003/g, '<em>')
    .replace(/\u0004/g, '</em>')

  return s.trim()
}

/** Render block markdown into paragraph HTML, splitting on blank lines. */
export function mdBlock(raw: string, linkColor = '#2563eb'): string {
  const cleaned = cleanText(raw)
  if (!cleaned) return ''
  const paras = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  return paras
    .map((p) => mdInline(p.replace(/\n/g, ' '), linkColor))
    .map((p) => p)
    .join('<br/><br/>')
}

/** Normalize text for equality comparison (markdown + punctuation removed). */
function normalizeForCompare(s: string): string {
  return cleanText(s)
    .toLowerCase()
    .replace(/\*\*|__|[*_`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Remove near-duplicate strings, and any string that is substantially
 * contained within an earlier (longer) one. Order preserved.
 */
export function dedupeStrings(items: (string | undefined | null)[]): string[] {
  const out: string[] = []
  const seen: string[] = []
  for (const item of items) {
    const text = (item ?? '').trim()
    if (!text) continue
    const norm = normalizeForCompare(text)
    if (!norm) continue
    const isDup = seen.some((prev) => {
      if (prev === norm) return true
      const [long, short] = prev.length >= norm.length ? [prev, norm] : [norm, prev]
      // treat as dup if the shorter is mostly inside the longer
      return short.length > 24 && long.includes(short.slice(0, Math.floor(short.length * 0.9)))
    })
    if (isDup) continue
    seen.push(norm)
    out.push(text)
  }
  return out
}

/** True if `candidate` is already represented inside `against`. */
export function isContainedIn(candidate: string, against: string[]): boolean {
  const c = normalizeForCompare(candidate)
  if (!c) return true
  return against.some((a) => {
    const n = normalizeForCompare(a)
    if (n === c) return true
    return c.length > 24 && n.includes(c.slice(0, Math.floor(c.length * 0.9)))
  })
}
