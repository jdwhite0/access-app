import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/design-system/ThemeProviderClient'
import JysonGlobalLayer from '@/components/jyson/JysonGlobalLayer'
import { getThemeBootScript } from '@/lib/design-system/theme/boot-script'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACCESS — JD AI Systems',
  description: 'The identity layer for people, systems, and intelligence. Create your ACCESS ID. Own your systems. Connect intelligence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: getThemeBootScript() }} />
        </head>
        <body className="h-full">
          <ThemeProvider>
            <JysonGlobalLayer>{children}</JysonGlobalLayer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
