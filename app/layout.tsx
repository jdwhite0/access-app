import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACCESS — JD AI Systems',
  description: 'The identity layer for people, systems, and intelligence. Create your ACCESS ID. Own your systems. Connect intelligence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full">{children}</body>
      </html>
    </ClerkProvider>
  )
}
