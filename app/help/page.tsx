import type { Metadata } from 'next'
import HelpPageClient from './HelpPageClient'

export const metadata: Metadata = {
  title: 'Help Center — ACCESS · JD AI Systems',
  description: 'Frequently asked questions about ACCESS, JYSON, plans, billing, data, and privacy.',
}

export default function HelpPage() {
  return <HelpPageClient />
}
