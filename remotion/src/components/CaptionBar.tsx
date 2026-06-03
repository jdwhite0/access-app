import { interpolate, useCurrentFrame } from 'remotion'
import { ACCESS_BRAND, FONT } from '../theme'

type CaptionBarProps = {
  title: string
  subtitle?: string
  fadeInFrames?: number
}

export function CaptionBar({
  title,
  subtitle,
  fadeInFrames = 18,
}: CaptionBarProps) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [0, fadeInFrames], [12, 0], {
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        bottom: 48,
        opacity,
        transform: `translateY(${y}px)`,
        fontFamily: FONT,
        maxWidth: 520,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 28,
          fontWeight: 600,
          color: ACCESS_BRAND.navy,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </p>
      {subtitle ? (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 17,
            fontWeight: 400,
            color: 'rgba(26, 31, 54, 0.72)',
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
