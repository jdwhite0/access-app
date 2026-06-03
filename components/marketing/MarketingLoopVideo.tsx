'use client'

import { useReducedMotion } from 'framer-motion'
import { useCallback, useState } from 'react'

export type MarketingVideoSources = {
  mp4: string
  webm?: string
  poster: string
  /** Static image when the primary poster asset is missing (pre-render fallback). */
  fallbackPoster?: string
}

type MarketingLoopVideoProps = MarketingVideoSources & {
  className?: string
  /** When true, video is decorative only (default). */
  ariaHidden?: boolean
}

/**
 * Autoplay marketing loop with poster fallback for prefers-reduced-motion
 * or when the video file fails to load.
 */
export default function MarketingLoopVideo({
  mp4,
  webm,
  poster,
  fallbackPoster,
  className,
  ariaHidden = true,
}: MarketingLoopVideoProps) {
  const reduced = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const [posterSrc, setPosterSrc] = useState(poster)

  const onPosterError = useCallback(() => {
    if (fallbackPoster && posterSrc !== fallbackPoster) {
      setPosterSrc(fallbackPoster)
    }
  }, [fallbackPoster, posterSrc])

  if (reduced || failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={posterSrc}
        alt=""
        className={className}
        aria-hidden={ariaHidden}
        decoding="async"
        onError={onPosterError}
      />
    )
  }

  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={posterSrc}
      aria-hidden={ariaHidden}
      preload="metadata"
      onError={() => setFailed(true)}
    >
      {webm ? <source src={webm} type="video/webm" /> : null}
      <source src={mp4} type="video/mp4" />
    </video>
  )
}
