'use client'

import MarketingLoopVideo from '@/components/marketing/MarketingLoopVideo'

/** Higgsfield cinematic b-roll — abstract hero loop (see scripts/generate-access-marketing-higgsfield-videos.ts) */
const CINEMATIC_VIDEO = {
  mp4: '/marketing/video/hero-cinematic.mp4',
  webm: '/marketing/video/hero-cinematic.webm',
  poster: '/marketing/video/hero-cinematic-poster.webp',
  fallbackPoster: '/marketing/hero-void-background.webp',
} as const

/**
 * Cinematic ambient layer for hero canvas (Higgsfield i2v).
 * Falls back to static void art when clip or poster is missing.
 */
export default function HeroCinematicVideo() {
  return (
    <MarketingLoopVideo
      {...CINEMATIC_VIDEO}
      className="access-mkt-hero__cinematic-video"
      ariaHidden
    />
  )
}
