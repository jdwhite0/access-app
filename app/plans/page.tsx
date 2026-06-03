import Link from 'next/link'

export const metadata = {
  title: 'Plans — ACCESS',
  description: 'Choose the ACCESS plan that matches where you are and where you\'re going.',
}

const PLANS = [
  {
    name: 'Operator',
    price: '$299',
    period: '/month',
    tagline: 'For individuals getting started with AI-powered operations.',
    highlight: false,
    features: [
      'JYSON cloud intelligence',
      'ACCESS companion interface',
      'Founder OS blueprint',
      'Systems & registry (up to 5)',
      'Projects workspace',
      'Community support',
    ],
    cta: 'Start with Operator',
    ctaHref: '/onboarding',
  },
  {
    name: 'Builder',
    price: '$599',
    period: '/month',
    tagline: 'For founders and operators building serious infrastructure.',
    highlight: true,
    features: [
      'Everything in Operator',
      'Unlimited registry objects',
      'Local connector + OpenJarvis',
      'Vault scan & vault sync',
      'Agents, offers, assets, workflows',
      'Terminal (advanced)',
      'Command center access',
      'Priority support',
    ],
    cta: 'Start with Builder',
    ctaHref: '/onboarding',
  },
  {
    name: 'Enterprise',
    price: '$2,000+',
    period: '/month',
    tagline: 'For teams, agencies, and operators who need white-label and dedicated infrastructure.',
    highlight: false,
    features: [
      'Everything in Builder',
      'White-label (your brand, your domain)',
      'Multi-user access',
      'Custom AI persona for your business',
      'Dedicated infrastructure',
      'SLA + dedicated Slack support',
      'Custom onboarding & training',
      'Revenue share option',
    ],
    cta: 'Contact for Enterprise',
    ctaHref: 'mailto:jerry@jdwhite.world?subject=ACCESS Enterprise',
  },
] as const

const FAQ = [
  {
    q: 'What is ACCESS?',
    a: 'ACCESS is an AI operating system. It gives you a permanent digital identity (your handle), a Founder OS blueprint of your business, and JYSON — an intelligence layer that understands your world and can execute local operations on your machine.',
  },
  {
    q: 'What is JYSON?',
    a: 'JYSON is the intelligence layer inside ACCESS. It knows your organizations, products, systems, and context — and responds as your personal AI operator, not a generic chatbot.',
  },
  {
    q: 'What is the local connector?',
    a: 'The local connector links ACCESS to your machine. With it active and OpenJarvis running, JYSON can read your files, explore your vault, and execute tools directly on your operating system.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from the billing settings page. Your data stays accessible through the end of your billing period.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your Founder OS blueprint, registry, and identity are retained for 90 days. After that, data is permanently deleted. You can export at any time from the registry.',
  },
] as const

export default function PlansPage() {
  return (
    <div className="access-plans-page">
      {/* Header */}
      <header className="access-plans-header">
        <Link href="/dashboard" className="access-plans-back">← ACCESS</Link>
        <p className="access-plans-eyebrow">PRICING</p>
        <h1 className="access-plans-title">Build on your own infrastructure.</h1>
        <p className="access-plans-subtitle">
          ACCESS gives you a permanent identity, AI intelligence that knows your world, and tools to execute from anywhere. Pick the plan that matches where you are.
        </p>
      </header>

      {/* Plan grid */}
      <div className="access-plans-grid">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`access-plan-card${plan.highlight ? ' access-plan-card--featured' : ''}`}
          >
            {plan.highlight && (
              <div className="access-plan-badge">Most popular</div>
            )}
            <div className="access-plan-card__header">
              <p className="access-plan-name">{plan.name}</p>
              <div className="access-plan-price-row">
                <span className="access-plan-price">{plan.price}</span>
                <span className="access-plan-period">{plan.period}</span>
              </div>
              <p className="access-plan-tagline">{plan.tagline}</p>
            </div>
            <ul className="access-plan-features">
              {plan.features.map(f => (
                <li key={f}>
                  <span className="access-plan-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="access-plan-card__footer">
              <a
                href={plan.ctaHref}
                className={`access-plan-cta${plan.highlight ? ' access-plan-cta--primary' : ' access-plan-cta--secondary'}`}
              >
                {plan.cta}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="access-plans-faq">
        <h2 className="access-plans-faq__title">Frequently asked</h2>
        <div className="access-plans-faq__grid">
          {FAQ.map(item => (
            <div key={item.q} className="access-plans-faq__item">
              <p className="access-plans-faq__q">{item.q}</p>
              <p className="access-plans-faq__a">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="access-plans-footer">
        <p>Questions? <a href="mailto:jerry@jdwhite.world">jerry@jdwhite.world</a></p>
        <Link href="/dashboard">Go to ACCESS →</Link>
      </footer>
    </div>
  )
}
