'use client'

import { cn } from '../cn'

type CommandInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  busy?: boolean
  onFocus?: () => void
  onBlur?: () => void
  className?: string
}

export function CommandInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask JYSON or give a command…',
  disabled,
  busy,
  onFocus,
  onBlur,
  className,
}: CommandInputProps) {
  return (
    <form
      className={cn('access-command-input', className)}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <textarea
        className="access-command-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder={placeholder}
        rows={2}
        disabled={disabled || busy}
        aria-label={placeholder}
      />
      <button
        type="submit"
        className="access-command-input__submit"
        disabled={disabled || busy || !value.trim()}
      >
        {busy ? '…' : 'Send'}
      </button>
    </form>
  )
}
