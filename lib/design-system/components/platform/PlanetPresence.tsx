'use client'

import { motion } from 'framer-motion'
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

type PlanetPresenceProps = {
  state: PlanetState
  statusLine?: string
  className?: string
}

export function PlanetPresence({ state, statusLine, className }: PlanetPresenceProps) {
  const pulse = state === 'listening' || state === 'thinking' || state === 'executing'

  return (
    <div className={cn('access-planet', className)} aria-live="polite">
      <div className="access-planet__stage">
        <motion.div
          className={cn('access-planet__halo', `access-planet__halo--${state}`)}
          animate={
            pulse
              ? { scale: [1, 1.06, 1], opacity: [0.5, 0.85, 0.5] }
              : { scale: 1, opacity: 0.55 }
          }
          transition={{ duration: 2.8, repeat: pulse ? Infinity : 0, ease: 'easeInOut' }}
        />
        <motion.div
          className={cn('access-planet__body', `access-planet__body--${state}`)}
          animate={pulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={{ duration: 1.6, repeat: pulse ? Infinity : 0, ease: 'easeInOut' }}
        >
          <span className="access-planet__highlight" />
          <span className="access-planet__shadow" />
        </motion.div>
        <span className="access-planet__ring" aria-hidden />
      </div>
      <p className="access-planet__label">{statusLine ?? LABEL[state]}</p>
    </div>
  )
}
