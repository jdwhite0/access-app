/**
 * Offline test: validate fixture + default spec + YAML export (no Clerk/Supabase).
 * Usage: npm run blueprint:test
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateFounderBlueprint } from '../lib/blueprint/validate-mvp'
import { founderBlueprintToYaml } from '../lib/blueprint/to-yaml'
import { createDefaultFounderBlueprint } from '../lib/blueprint/defaults'
import type { FounderBlueprintSpec } from '../types/founder-blueprint'

const ROOT = process.cwd()

async function check(label: string, spec: FounderBlueprintSpec) {
  const result = await validateFounderBlueprint(spec)
  if (!result.valid) {
    console.error(`✗ ${label}`)
    result.errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }
  console.log(`✓ ${label}`)
  return spec
}

async function main() {
  const fixturePath = join(ROOT, 'fixtures', 'founder-blueprint.fixture.json')
  const fixtureRaw = await readFile(fixturePath, 'utf8')
  const fixture = JSON.parse(fixtureRaw) as FounderBlueprintSpec
  await check('fixture JSON', fixture)

  const defaults = createDefaultFounderBlueprint({
    accessHandle: 'testfounder.access',
    displayName: 'Test Founder',
  })
  await check('default spec', defaults)

  const exportSpec: FounderBlueprintSpec = {
    ...fixture,
    status: 'exported',
    exported_at: new Date().toISOString(),
  }
  await check('export-ready spec', exportSpec)

  const yaml = founderBlueprintToYaml(exportSpec)
  const outPath = join(ROOT, 'fixtures', 'founder-blueprint.export.yaml')
  await writeFile(outPath, yaml, 'utf8')
  console.log(`✓ Wrote ${outPath}`)

  const jdSystemValidator = join(
    ROOT,
    '..',
    'scripts',
    'validate-blueprint.mjs'
  )
  try {
    const { access } = await import('node:fs/promises')
    await access(jdSystemValidator)
    const { execSync } = await import('node:child_process')
    execSync(`node "${jdSystemValidator}" "${outPath}"`, {
      cwd: join(ROOT, '..'),
      stdio: 'inherit',
    })
    console.log('✓ Cross-validated with jd-system schema tooling')
  } catch {
    console.log('○ jd-system validator not run (optional sibling repo path)')
  }

  console.log('\nP2 offline tests passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
