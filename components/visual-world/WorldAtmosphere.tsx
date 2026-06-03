'use client'

import { cn } from '@/lib/design-system/components/cn'

type WorldAtmosphereProps = {
  /** subtle = home/dashboard; rich = landing/auth */
  intensity?: 'subtle' | 'rich'
  className?: string
}

/** 15% immersive atmosphere — background only, no layout competition */
export function WorldAtmosphere({ intensity = 'subtle', className }: WorldAtmosphereProps) {
  return (
    <div
      className={cn('access-world-atmosphere', `access-world-atmosphere--${intensity}`, className)}
      aria-hidden
    >
      <div className="access-world-atmosphere__drift" />
      <div className="access-world-atmosphere__glow-cyan" />
      <div className="access-world-atmosphere__glow-gold" />
    </div>
  )
}
