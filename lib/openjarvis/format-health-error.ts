const OPENJARVIS_URL = process.env.OPENJARVIS_LOCAL_URL ?? 'http://localhost:8000'

/** Turn fetch/connection failures into founder-actionable health errors. */
export function formatOpenJarvisHealthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()

  if (
    lower.includes('econnrefused') ||
    lower.includes('fetch failed') ||
    lower.includes('connection refused') ||
    lower.includes('failed to fetch')
  ) {
    return `Nothing listening at ${OPENJARVIS_URL}. In a new terminal run: cd access-app && npm run openjarvis:serve`
  }

  if (lower.includes('aborted') || lower.includes('timeout')) {
    return `OpenJarvis at ${OPENJARVIS_URL} did not respond within 3s. Start it with: npm run openjarvis:serve`
  }

  return raw || 'Cannot reach OpenJarvis server.'
}
