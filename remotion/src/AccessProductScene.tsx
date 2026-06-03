import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { CaptionBar } from './components/CaptionBar'
import { ProductChrome } from './components/ProductChrome'
import { ACCESS_BRAND } from './theme'

export type ProductSceneId = 'home' | 'guide' | 'plans'

export type AccessProductSceneProps = {
  scene: ProductSceneId
}

const SCENE_COPY: Record<
  ProductSceneId,
  { label: string; title: string; subtitle: string }
> = {
  home: {
    label: 'Home',
    title: 'See your day at a glance',
    subtitle: 'Your ideas, plans, and next steps — on one calm screen.',
  },
  guide: {
    label: 'AI guide',
    title: 'Ask JYSON what to do next',
    subtitle: 'Talk through a decision. JYSON remembers where you left off.',
  },
  plans: {
    label: 'Plans',
    title: 'Plans that grow with you',
    subtitle: 'Start with what you need. Upgrade when you are ready.',
  },
}

function HomePanel({ highlight }: { highlight: number }) {
  const rows = [
    { label: 'Next step', value: 'Outline your first offer', accent: true },
    { label: 'Saved note', value: 'Ideas for the side business', accent: false },
    { label: 'This week', value: 'Talk with JYSON about pricing', accent: false },
  ]
  return (
    <>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: ACCESS_BRAND.navy }}>
        Good morning
      </p>
      <p style={{ margin: '6px 0 20px', fontSize: 14, color: 'rgba(26,31,54,0.55)' }}>
        Wednesday · 3 things saved for you
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => (
          <li
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderRadius: 12,
              background: row.accent
                ? `rgba(14, 165, 185, ${0.08 + highlight * 0.06})`
                : ACCESS_BRAND.navySoft,
              border: row.accent
                ? `1px solid rgba(14, 165, 185, ${0.25 + highlight * 0.2})`
                : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: 13, color: 'rgba(26,31,54,0.5)' }}>{row.label}</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: row.accent ? ACCESS_BRAND.cyan : ACCESS_BRAND.navy,
              }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

function GuidePanel({ reveal }: { reveal: number }) {
  return (
    <>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: ACCESS_BRAND.navy }}>
        JYSON
      </p>
      <p style={{ margin: '6px 0 20px', fontSize: 14, color: 'rgba(26,31,54,0.55)' }}>
        Your guide · remembers your story
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '78%',
            padding: '12px 16px',
            borderRadius: '16px 16px 4px 16px',
            background: ACCESS_BRAND.navySoft,
            fontSize: 14,
            color: ACCESS_BRAND.navy,
            lineHeight: 1.45,
          }}
        >
          I want to start something small but I keep stalling.
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '82%',
            padding: '12px 16px',
            borderRadius: '16px 16px 16px 4px',
            background: `rgba(14, 165, 185, ${0.1 + reveal * 0.08})`,
            fontSize: 14,
            color: ACCESS_BRAND.navy,
            lineHeight: 1.45,
            opacity: reveal,
            transform: `translateY(${(1 - reveal) * 8}px)`,
          }}
        >
          Last time you mentioned tutoring. Want to sketch one simple offer you could try this
          week?
        </div>
      </div>
    </>
  )
}

function PlansPanel({ glow }: { glow: number }) {
  const tiers = [
    { name: 'Operator', price: '$299', featured: false },
    { name: 'Builder', price: '$599', featured: true },
    { name: 'Enterprise', price: 'Custom', featured: false },
  ]
  return (
    <>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: ACCESS_BRAND.navy }}>
        Your plans
      </p>
      <p style={{ margin: '6px 0 20px', fontSize: 14, color: 'rgba(26,31,54,0.55)' }}>
        Simple tiers · change anytime
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {tiers.map((tier) => (
          <div
            key={tier.name}
            style={{
              flex: 1,
              padding: '16px 14px',
              borderRadius: 14,
              background: tier.featured ? 'rgba(14,165,185,0.06)' : ACCESS_BRAND.navySoft,
              border: tier.featured
                ? `2px solid rgba(14, 165, 185, ${0.35 + glow * 0.35})`
                : '1px solid rgba(26,31,54,0.06)',
              transform: tier.featured ? `translateY(${-glow * 4}px)` : 'none',
              boxShadow: tier.featured
                ? `0 12px 32px rgba(14, 165, 185, ${0.08 + glow * 0.1})`
                : 'none',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: ACCESS_BRAND.navy }}>
              {tier.name}
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 18,
                fontWeight: 600,
                color: tier.featured ? ACCESS_BRAND.cyan : ACCESS_BRAND.navy,
              }}
            >
              {tier.price}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

export const AccessProductScene: React.FC<AccessProductSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const copy = SCENE_COPY[scene]

  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 80 } })
  const highlight = spring({
    frame: frame - fps * 2,
    fps,
    config: { damping: 120, stiffness: 60 },
  })
  const guideReveal = interpolate(frame, [fps * 1.2, fps * 2.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const plansGlow = spring({
    frame: frame - fps * 1.5,
    fps,
    config: { damping: 100, stiffness: 50 },
  })

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${ACCESS_BRAND.pearl} 0%, #f1f5f9 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          background: `radial-gradient(ellipse 60% 50% at 70% 20%, ${ACCESS_BRAND.cyanSoft}, transparent 70%)`,
        }}
      />
      <div style={{ transform: `scale(${0.96 + enter * 0.04})`, width: '100%', height: '100%' }}>
        <ProductChrome label={copy.label}>
          {scene === 'home' && <HomePanel highlight={Math.min(1, highlight)} />}
          {scene === 'guide' && <GuidePanel reveal={guideReveal} />}
          {scene === 'plans' && <PlansPanel glow={Math.min(1, plansGlow)} />}
        </ProductChrome>
      </div>
      <CaptionBar title={copy.title} subtitle={copy.subtitle} />
    </AbsoluteFill>
  )
}

export const PRODUCT_DURATION_FRAMES = 14 * 30
