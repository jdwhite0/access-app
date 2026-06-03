'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import { cn } from '../cn'

const PENDING_KEY = 'access_jyson_pending_prompt'
const RECENT_KEY = 'access_recent_intents'

export function pushRecentIntent(text: string) {
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    const next = [text.trim(), ...prev.filter((t) => t !== text.trim())].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function readRecentIntents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

type HomeCommandHeroProps = {
  /** Optional — prefer parent `access-home-v4__headline` for contextual copy */
  headline?: string
  placeholder?: string
  className?: string
  hideHeadline?: boolean
}

export function HomeCommandHero({
  headline,
  placeholder = 'Continue or ask anything…',
  className,
  hideHeadline = false,
}: HomeCommandHeroProps) {
  const router = useRouter()
  const layer = useJysonLayerOptional()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const text = value.trim()
    if (!text) return
    pushRecentIntent(text)
    if (layer) {
      setValue('')
      void layer.submit(text)
      return
    }
    try {
      sessionStorage.setItem(PENDING_KEY, text)
    } catch {
      /* ignore */
    }
    router.push('/companion')
  }

  return (
    <div className={cn('access-home-command', className)}>
      {!hideHeadline && headline ? (
        <motion.h1
          className="access-home-command__headline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          {headline}
        </motion.h1>
      ) : null}

      <motion.form
        className={cn('access-home-command__form', focused && 'is-focused')}
        onSubmit={submit}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22 }}
      >
        <textarea
          className="access-home-command__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={2}
          aria-label={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button type="submit" className="access-home-command__send" disabled={!value.trim()}>
          Ask JYSON
        </button>
      </motion.form>
    </div>
  )
}

export const ACCESS_PENDING_PROMPT_KEY = PENDING_KEY
