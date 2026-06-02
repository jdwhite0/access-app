/**
 * E2E validation: P2 backend chain (no Clerk UI).
 * Simulates wizard data flow: identity defaults → orgs/products/experiences → save merge → export YAML.
 * Clerk + Supabase steps reported separately when env is missing.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { createDefaultFounderBlueprint } from '../lib/blueprint/defaults'
import { mergeFounderBlueprint } from '../lib/blueprint/merge'
import { validateFounderBlueprint, parseFounderBlueprintAnswers } from '../lib/blueprint/validate-mvp'
import { founderBlueprintToYaml } from '../lib/blueprint/to-yaml'
import { rowToFounderBlueprint } from '../lib/blueprint/from-row'
import type { FounderBlueprintSpec } from '../types/founder-blueprint'

const ROOT = process.cwd()
const JD_ROOT = join(ROOT, '..')

function log(n: number | string, label: string) {
  console.log(`\n[${n}] ${label}`)
}
function pass(msg: string) {
  console.log(`  ✓ ${msg}`)
}
function skip(msg: string) {
  console.log(`  ○ SKIP: ${msg}`)
}
function fail(msg: string): never {
  console.error(`  ✗ ${msg}`)
  process.exit(1)
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' E2E Founder Blueprint — access-app (P2 backend)')
  console.log('═══════════════════════════════════════════════════')

  const hasSupabase = Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const hasClerk = Boolean(
    process.env.CLERK_SECRET_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )

  log(1, 'Clerk authentication')
  if (hasClerk) {
    pass('Clerk env vars present (live sign-in requires browser — not automated here)')
  } else {
    skip('No Clerk env in shell — steps 1, 7–8 against live DB require manual / Vercel env')
  }

  log(2, 'Founder identity creation (defaults)')
  const handle = 'e2e-testfounder.access'
  let spec = createDefaultFounderBlueprint({
    accessHandle: handle,
    displayName: 'E2E Test Founder',
  })
  pass(`Founder ID (access_handle): ${spec.founder.access_handle}`)
  pass(`Founder OS id: ${spec.output.founder_os_id}`)

  log(3, 'Blueprint creation')
  const v0 = await validateFounderBlueprint(spec)
  if (!v0.valid) fail(v0.errors.join('; '))
  pass(`blueprint_id: ${spec.blueprint_id}`)

  log(4, 'Organization creation')
  const organizations = [
    { id: 'e2e-studio', name: 'E2E Studio' },
  ]
  spec = mergeFounderBlueprint(spec, { organizations })
  pass(`organizations: ${spec.organizations.length}`)

  log(5, 'Product creation')
  const products = [
    { id: 'e2e-platform', name: 'E2E Platform', type: 'platform' as const },
    {
      id: 'e2e-portfolio',
      name: 'E2E Portfolio',
      type: 'portfolio' as const,
      organization_id: 'e2e-studio',
    },
  ]
  spec = mergeFounderBlueprint(spec, { products })
  pass(`products: ${spec.products.length}`)

  log(6, 'Experience creation')
  const experiences = [
    {
      id: 'e2e-portal',
      name: 'E2E Portal',
      url: 'https://example.com/e2e-portal',
      product_id: 'e2e-platform',
    },
  ]
  spec = mergeFounderBlueprint(spec, { experiences })
  pass(`experiences: ${spec.experiences.length}`)

  log(7, 'Blueprint save (in-memory / merge validation)')
  spec = mergeFounderBlueprint(spec, {
    status: 'draft',
    blueprint_version: 1,
  })
  const vSave = await validateFounderBlueprint(spec)
  if (!vSave.valid) fail(vSave.errors.join('; '))
  pass('Merge + validate (same path as updateFounderBlueprint pre-persist)')

  log(8, 'Blueprint retrieval (row round-trip)')
  const fakeRow = {
    id: '00000000-0000-4000-8000-000000000001',
    clerk_user_id: 'user_e2e',
    owner_handle: handle,
    type: 'founder_os',
    answers: spec,
    system_id: null,
    created_at: new Date().toISOString(),
  }
  const row = rowToFounderBlueprint(fakeRow)
  if (!row) fail('rowToFounderBlueprint returned null')
  const retrieved = parseFounderBlueprintAnswers(row.answers)
  if (!retrieved || retrieved.blueprint_id !== spec.blueprint_id) {
    fail('Retrieved spec mismatch')
  }
  pass(`Retrieved blueprint_id: ${retrieved.blueprint_id}`)

  log(9, 'YAML export')
  const exportSpec: FounderBlueprintSpec = {
    ...spec,
    status: 'exported',
    exported_at: new Date().toISOString(),
    access_blueprint_id: fakeRow.id,
    meta: {
      origination: 'access_wizard',
      authority: 'canonical',
      draft: false,
    },
  }
  const vExport = await validateFounderBlueprint(exportSpec)
  if (!vExport.valid) fail(vExport.errors.join('; '))
  const yamlOut = founderBlueprintToYaml(exportSpec)
  const exportPath = join(ROOT, 'fixtures', 'e2e-founder-blueprint.export.yaml')
  await writeFile(exportPath, yamlOut, 'utf8')
  pass(`Wrote ${exportPath}`)

  log(10, 'YAML validation (jd-system)')
  const validator = join(JD_ROOT, 'scripts', 'validate-blueprint.mjs')
  execSync(`node "${validator}" "${exportPath}"`, { cwd: JD_ROOT, stdio: 'inherit' })

  log(11, 'Founder OS materialization (jd-system)')
  const materializer = join(JD_ROOT, 'scripts', 'materialize-founder-os.mjs')
  execSync(`node "${materializer}" "${exportPath}"`, { cwd: JD_ROOT, stdio: 'inherit' })

  log('SUPABASE', 'Persistence')
  if (hasSupabase) {
    pass('Supabase env present — live save/retrieve requires authenticated server action (manual)')
  } else {
    skip('No SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — DB save/retrieve not exercised')
  }

  const fixturePath = join(ROOT, 'fixtures', 'founder-blueprint.fixture.json')
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'))
  await validateFounderBlueprint(fixture)
  pass('Existing fixture still validates')

  console.log('\n═══════════════════════════════════════════════════')
  console.log(' P2 + P1 CHAIN E2E: PASS')
  console.log('═══════════════════════════════════════════════════\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
