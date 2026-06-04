import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Next.js 16 uses proxy.ts with a named `proxy` export.
 * Clerk v7 clerkMiddleware handles auth state for all routes.
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/jyson',
  '/pricing',
  '/product',
  '/solutions',
  '/developers',
  '/resources',
  '/help',
  '/contact(.*)',
  '/plans(.*)',
  '/status(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/privacy',
  '/terms',
  '/email-preferences',
  '/unsubscribe',
  '/api/email/unsubscribe(.*)',
  '/api/stripe/webhook(.*)',
  // Internal email agents — secret header auth in route handlers (INTERNAL_EMAIL_API_SECRET)
  '/api/internal/email(.*)',
  '/api/cron/email-daily-brief',
  '/api/cron/email-dispatch',
  '/api/cron/email-weekly-digest',
  // Connector device JWT auth in route handlers — bypass Clerk session
  '/api/connector/v1(.*)',
])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId, isAuthenticated, redirectToSignIn } = await auth()

  // Authenticated users hitting sign-in/sign-up → dashboard
  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Unauthenticated users hitting protected routes → sign-in (not 404)
  if (!isPublicRoute(request) && !isAuthenticated) {
    return redirectToSignIn({ returnBackUrl: request.url })
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
