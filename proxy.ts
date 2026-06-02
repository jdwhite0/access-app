import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * Required for auth() in Server Actions and RSC (Clerk v7 + Next.js 16).
 * Does not force sign-in on public routes — client gates /founder and /companion.
 */
/** Next.js 16 requires named `proxy` export (default export is ignored). */
export const proxy = clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
