'use client'

import MarketingLoopVideo from '@/components/marketing/MarketingLoopVideo'

const HERO_VIDEO = {
  mp4: '/marketing/video/hero-ambient.mp4',
  webm: '/marketing/video/hero-ambient.webm',
  poster: '/marketing/video/hero-ambient-poster.webp',
  fallbackPoster: '/marketing/hero-void-background.webp',
} as const

/**
 * Subtle ambient loop for hero canvas — falls back to CSS background when reduced motion.
 */
export default function HeroAmbientVideo() {
  return (
    <MarketingLoopVideo
      {...HERO_VIDEO}
      className="access-mkt-hero__ambient-video"
      ariaHidden
    />
  )
}
