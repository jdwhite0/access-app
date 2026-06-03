import type { NextConfig } from "next";

/** Scoped tracing root — monorepo has a parent package-lock.json. */
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
