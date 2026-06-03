'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type PageMotionProps = {
  children: ReactNode
  className?: string
}

export function PageMotion({ children, className }: PageMotionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
