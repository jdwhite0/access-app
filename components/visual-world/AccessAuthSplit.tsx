'use client'

import type { ReactNode } from 'react'
import { AccessPlanetScene } from './AccessPlanetScene'
import { WorldAtmosphere } from './WorldAtmosphere'

type AccessAuthSplitProps = {
  children: ReactNode
  tagline?: string
  promise?: string
  planetKind?: 'access' | 'jyson' | 'founder'
}

/**
 * Stripe-style split: clean form left, immersive planet right.
 */
export function AccessAuthSplit({
  children,
  tagline = 'Build your world with your own AI.',
  promise = 'Identity, intelligence, and infrastructure — one operating system.',
  planetKind = 'access',
}: AccessAuthSplitProps) {
  return (
    <div className="access-auth-split">
      <WorldAtmosphere intensity="rich" />
      <div className="access-auth-split__form">{children}</div>
      <aside className="access-auth-split__visual" aria-hidden={false}>
        <div className="access-auth-split__visual-inner">
          <AccessPlanetScene kind={planetKind} scale="lg" />
          <p className="access-auth-split__tagline">{tagline}</p>
          <p className="access-auth-split__promise">{promise}</p>
        </div>
      </aside>
    </div>
  )
}
