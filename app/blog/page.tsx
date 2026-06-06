import Link from 'next/link'

export const metadata = {
  title: 'Blog — ACCESS · JD AI Systems',
  description: 'Thinking on operating systems, AI, founder infrastructure, and building with intention.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

const POSTS = [
  {
    date: 'June 6, 2026',
    category: 'Product',
    title: 'Why we rebuilt pricing from the ground up',
    excerpt: 'The old operator plan at $299/month was built for the wrong customer. Here\'s how we rethought the entire pricing architecture — and what it means for founders and creators who are just getting started.',
    href: '#',
    readTime: '4 min read',
  },
  {
    date: 'June 3, 2026',
    category: 'Philosophy',
    title: 'The operating system gap: why most founders are running blind',
    excerpt: 'Most founders have the vision. What they\'re missing is the infrastructure layer — the structured system that connects their ideas, work, clients, and intelligence into one coherent operation. That\'s the gap ACCESS is built to close.',
    href: '#',
    readTime: '6 min read',
  },
  {
    date: 'May 28, 2026',
    category: 'Feature',
    title: 'JYSON is not a chatbot — it\'s a compounding operator',
    excerpt: 'Every AI tool claims to be your assistant. JYSON is different because it reads your workspace — your registry, projects, CRM, and memory — and builds intelligence from it. This is what compound intelligence actually means.',
    href: '#',
    readTime: '5 min read',
  },
  {
    date: 'May 20, 2026',
    category: 'Infrastructure',
    title: 'Why we made bank transfer a first-class payment option',
    excerpt: 'Most platforms treat ACH as a buried afterthought. We built bank transfer into the core billing flow so operators have a seamless, secure way to pay without reaching for a card. Here\'s the thinking behind it.',
    href: '#',
    readTime: '3 min read',
  },
  {
    date: 'May 15, 2026',
    category: 'Philosophy',
    title: 'Build churches, not cages: the operating philosophy behind ACCESS',
    excerpt: 'The goal of ACCESS has never been to create dependency. It\'s to transfer power — to give founders the infrastructure to operate independently, at scale, without needing a team of six to do it.',
    href: '#',
    readTime: '7 min read',
  },
  {
    date: 'May 10, 2026',
    category: 'Security',
    title: 'Florida, Georgia, and why legal compliance is a product decision',
    excerpt: 'Most startups treat legal pages as a box to check. We treated them as infrastructure. Here\'s how we built FL/GA compliance — FIPA, FDBR, FDUTPA, GFBPA — into the actual product architecture.',
    href: '#',
    readTime: '5 min read',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  Product: '#0EA5B9',
  Philosophy: '#8B5CF6',
  Feature: '#2D8A6E',
  Infrastructure: '#D4A017',
  Security: '#E55A2B',
}

export default function BlogPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['About', '/about'], ['Changelog', '/changelog'], ['Sign in', '/sign-in']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,48px)' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>The ACCESS Blog</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 16px' }}>
          Thinking on operating systems, AI, and building with intention.
        </h1>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.7, margin: 0 }}>
          From the team at JD AI Systems — behind ACCESS, JYSON, and the infrastructure layer for the next generation of operators.
        </p>
      </section>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(16px,3vw,48px) clamp(64px,8vw,120px)' }}>
        {POSTS.map((post, i) => (
          <article key={post.title} style={{ paddingBottom: 40, marginBottom: 40, borderBottom: i < POSTS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: (CATEGORY_COLORS[post.category] ?? C.accent) + '18',
                color: CATEGORY_COLORS[post.category] ?? C.accent,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{post.category}</span>
              <span style={{ fontSize: 12, color: C.mute }}>{post.date}</span>
              <span style={{ fontSize: 12, color: C.mute }}>· {post.readTime}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h2>
            <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>
            <Link href={post.href} style={{ fontSize: 14, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>Read more →</Link>
          </article>
        ))}
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Changelog', '/changelog'], ['About', '/about'], ['Terms', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
