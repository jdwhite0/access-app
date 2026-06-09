import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  // Internal email agents — secret header auth in route handlers
  '/api/internal/email(.*)',
  '/api/cron/email-daily-brief',
  '/api/cron/email-dispatch',
  '/api/cron/email-weekly-digest',
  // Connector device JWT auth in route handlers — bypass Clerk session
  '/api/connector/v1(.*)',
  // Sales Concierge — public lead capture from jdwhite.world
  '/api/concierge/(.*)',
  // JDWhite.world public endpoints
  '/api/jdw/(.*)',
  // Revenue agent API — header-based auth (x-agent-key), not Clerk session
  '/api/agents/(.*)',
  '/api/cron/agent-pipe',
  '/api/cron/agent-report(.*)',
  '/api/cron/run-all-agents',
  // Communications — Quo/OpenPhone webhooks, Slack events, internal routing
  '/api/communications/(.*)',
  '/api/integrations/slack/(.*)',
])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { userId, isAuthenticated, redirectToSignIn } = await auth()

  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

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
