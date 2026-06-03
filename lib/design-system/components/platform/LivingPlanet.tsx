'use client'

import { AccessPlanetScene } from '@/components/visual-world/AccessPlanetScene'
import { cn } from '../cn'

export type PlanetState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'executing'
  | 'success'
  | 'error'

const LABEL: Record<PlanetState, string> = {
  idle: 'JYSON is present',
  listening: 'Listening',
  thinking: 'Thinking',
  executing: 'Executing',
  success: 'Complete',
  error: 'Attention needed',
}

type LivingPlanetProps = {
  state?: PlanetState
  statusLine?: string
  className?: string
  variant?: 'hero' | 'standard'
}

/** JYSON presence — wraps AccessPlanetScene (jyson kind) */
export function LivingPlanet({
  state = 'idle',
  statusLine,
  className,
  variant = 'hero',
}: LivingPlanetProps) {
  const pulse = state === 'listening' || state === 'thinking' || state === 'executing'
  const scale = variant === 'hero' ? 'hero' : 'sm'

  return (
    <div
      className={cn('access-planet', className)}
      aria-live="polite"
      data-state={state}
      data-pulse={pulse ? 'true' : 'false'}
    >
      <AccessPlanetScene
        kind="jyson"
        scale={scale}
        particles={scale !== 'sm'}
        orbits
        trails={scale !== 'sm'}
      />
      {scale !== 'sm' ? (
        <p className="access-planet__label">{statusLine ?? LABEL[state]}</p>
      ) : null}
    </div>
  )
}

export default LivingPlanet
