/**
 * Verify JD AI Systems platform-health classifier (sample errors).
 * npx tsx scripts/verify-platform-health.ts
 */
import {
  classifyError,
  buildHealthSnapshot,
  sanitizeForAudience,
} from '../lib/platform-health'

type Case = {
  name: string
  input: Parameters<typeof classifyError>[0]
  expect: {
    kind: string
    provider: string
    category?: string
  }
}

const CASES: Case[] = [
  {
    name: 'claude_529',
    input: {
      error: new Error('529 {"type":"error","error":{"type":"overloaded_error"}}'),
      httpStatus: 529,
      product: 'access_os',
    },
    expect: { kind: 'provider_degraded', provider: 'anthropic_claude' },
  },
  {
    name: 'supabase_missing_table',
    input: {
      error: { message: 'relation "connector_pairing_codes" does not exist', code: '42P01' },
      product: 'access_os',
    },
    expect: { kind: 'schema_blocked', provider: 'supabase', category: 'database_schema' },
  },
  {
    name: 'invalid_supabase_url',
    input: {
      error: new Error(
        'Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.'
      ),
    },
    expect: { kind: 'env_invalid', provider: 'supabase' },
  },
  {
    name: 'missing_vault_root',
    input: {
      message: 'ACCESS_VAULT_ROOT not found: /Users/jdproductions/Documents/JD_Ai_System',
      product: 'vault',
    },
    expect: { kind: 'local_env_missing', provider: 'local_filesystem' },
  },
  {
    name: 'expired_pairing',
    input: {
      error: 'Invalid or expired pairing code.',
      product: 'access_os',
    },
    expect: { kind: 'connector_pairing_expired', provider: 'local_connector' },
  },
  {
    name: 'port_conflict',
    input: {
      error: new Error('listen EADDRINUSE: address already in use :::3000'),
    },
    expect: { kind: 'local_dev_conflict', provider: 'local_runtime' },
  },
  {
    name: 'unknown_error',
    input: {
      error: new Error('Something completely unexpected xyzzy'),
    },
    expect: { kind: 'unknown_unclassified', provider: 'unknown_provider' },
  },
]

function consumerSafe(text: string): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  if (/sk-[a-zA-Z0-9_-]{10,}/.test(text)) issues.push('exposed secret pattern')
  if (/\/Users\/|\/home\/|C:\\/.test(text)) issues.push('absolute path')
  if (/\.env\.local/i.test(text)) issues.push('env file reference')
  if (/SUPABASE_SERVICE_ROLE/i.test(text)) issues.push('service role reference')
  return { ok: issues.length === 0, issues }
}

function main() {
  const results: Record<string, unknown> = { cases: [], passed: true }
  const events = []

  for (const c of CASES) {
    const classified = classifyError(c.input)
    events.push(classified.event)

    const kindOk = classified.kind === c.expect.kind
    const providerOk = classified.provider === c.expect.provider
    const categoryOk = !c.expect.category || classified.category === c.expect.category

    const consumer = classified.event.messages.consumer_public
    const safety = consumerSafe(consumer)

    const pass = kindOk && providerOk && categoryOk && safety.ok
    if (!pass) (results as { passed: boolean }).passed = false

    ;(results.cases as unknown[]).push({
      name: c.name,
      pass,
      expected: c.expect,
      got: {
        kind: classified.kind,
        provider: classified.provider,
        category: classified.category,
        status: classified.status,
      },
      consumer_public: consumer,
      consumer_safety: safety,
      engineering_preview: classified.event.messages.internal_engineering.slice(0, 120),
    })
  }

  const snapshot = buildHealthSnapshot(events)
  results.snapshot = {
    overall: snapshot.overall,
    productCount: snapshot.products.length,
    providerCount: snapshot.providers.length,
  }

  const pathLeakTest = sanitizeForAudience(
    'Failed at /Users/jdproductions/Documents/JD_Ai_System/access-app/.env.local',
    'consumer_public'
  )
  results.sanitize_path_leak = {
    input: 'absolute path + env',
    output: pathLeakTest,
    pass: !/\/Users\//.test(pathLeakTest) && !/\.env\.local/i.test(pathLeakTest),
  }
  if (!(results.sanitize_path_leak as { pass: boolean }).pass) {
    (results as { passed: boolean }).passed = false
  }

  console.log(JSON.stringify(results, null, 2))
  process.exit((results as { passed: boolean }).passed ? 0 : 1)
}

main()
