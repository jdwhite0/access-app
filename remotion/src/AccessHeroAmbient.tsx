import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { ACCESS_BRAND } from './theme'

/**
 * Calm void background loop for homepage hero canvas (15–20s).
 */
export const AccessHeroAmbient: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const drift = interpolate(frame, [0, durationInFrames], [0, 1])
  const breathe = spring({
    frame: frame % (fps * 4),
    fps,
    config: { damping: 200, stiffness: 40 },
  })

  const planeY = interpolate(drift, [0, 1], [-18, 22])
  const cyanPulse = 0.55 + breathe * 0.25

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${ACCESS_BRAND.pearl} 0%, #eef2f7 42%, #e8edf4 100%)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-15%',
          background: `radial-gradient(ellipse 50% 42% at ${68 + planeY * 0.2}% ${28 + planeY * 0.15}%, rgba(14, 165, 185, ${0.09 * cyanPulse}), transparent 72%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-10%',
          background: `radial-gradient(ellipse 40% 36% at 82% 55%, rgba(184, 149, 106, 0.06), transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '18%',
          top: `${32 + planeY}%`,
          width: '48%',
          height: '28%',
          borderRadius: 24,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(148,163,184,0.2))',
          transform: `rotate(-6deg) translateY(${planeY * 0.6}px)`,
          boxShadow: '0 40px 100px rgba(26, 31, 54, 0.08)',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '12%',
          top: `${22 - planeY * 0.4}%`,
          width: '38%',
          height: '22%',
          borderRadius: 20,
          background:
            'linear-gradient(120deg, rgba(255,255,255,0.55), rgba(14,165,185,0.08))',
          transform: `rotate(8deg) translateY(${-planeY * 0.5}px)`,
          opacity: 0.55,
        }}
      />
      <svg
        viewBox="0 0 1280 720"
        style={{ position: 'absolute', inset: 0, opacity: 0.35 + breathe * 0.1 }}
      >
        <path
          d="M120 420 C 320 360, 520 480, 720 400 S 1080 320, 1180 380"
          fill="none"
          stroke={ACCESS_BRAND.cyan}
          strokeWidth="2"
          strokeOpacity={0.35 * cyanPulse}
        />
        <path
          d="M80 520 C 280 460, 480 560, 680 500"
          fill="none"
          stroke={ACCESS_BRAND.navy}
          strokeWidth="1"
          strokeOpacity={0.08}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, transparent 0%, transparent 55%, rgba(248,250,252,0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  )
}

export const HERO_DURATION_FRAMES = 20 * 30
