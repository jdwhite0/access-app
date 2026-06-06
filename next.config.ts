import type { NextConfig } from "next";

/** Scoped tracing root — monorepo has a parent package-lock.json. */
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    cpus: 1,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Prevent IDE extension packages from being bundled by Turbopack
  serverExternalPackages: ['@cursor/sdk'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Clickjacking protection — only allow framing by same origin
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer info to origin only on cross-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not used by the platform
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // DNS prefetch for performance while keeping security posture
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      // Strict-Transport-Security for all non-localhost origins (Vercel also sets this,
      // but belt-and-suspenders for any custom domain proxy)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
