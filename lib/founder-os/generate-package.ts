/**
 * P4 — Founder OS package generation (server-side).
 * Mirrors jd-system/scripts/lib/founder-os-generate.mjs output shape.
 */
import { mkdir, writeFile, cp } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import yaml from 'yaml'
import type { FounderBlueprintSpec } from '@/types/founder-blueprint'

export const PACKAGE_VERSION = '1.0.0'

export type GenerateStage =
  | 'validating'
  | 'generating_yaml'
  | 'generating_registry'
  | 'generating_vault_seeds'
  | 'complete'

export interface GeneratePackageResult {
  success: boolean
  stages: GenerateStage[]
  founderOsId?: string
  outDir?: string
  filesWritten?: string[]
  error?: string
}

function resolveOutputRoot(): string {
  if (process.env.FOUNDER_OS_OUTPUT_ROOT) {
    return resolve(process.env.FOUNDER_OS_OUTPUT_ROOT)
  }
  // Serverless environments (Vercel) have no writable cwd parent.
  // /tmp is the only writable path available per invocation.
  // The companion reads readiness from blueprint status in Supabase, not the filesystem.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return '/tmp/founder-os'
  }
  return resolve(process.cwd(), '..', 'founder-os')
}

function orgSeed(org: { id: string; name: string }, blueprint: FounderBlueprintSpec) {
  return `---
type: organization
id: ${org.id}
name: "${org.name.replace(/"/g, '\\"')}"
blueprint_id: ${blueprint.blueprint_id}
blueprint_version: ${blueprint.blueprint_version}
generated_by: founder-os-generate
---

# ${org.name}

${org.name} is an organization in your Founder operating model.

## Description

Registered from Founder Blueprint \`${blueprint.blueprint_id}\`.

## Relationships

- Founder: \`${blueprint.founder.access_handle}\`
- Products: see \`vault-seeds/products/\` for items linked to this organization

## Source

- Blueprint: \`${blueprint.blueprint_id}\` (v${blueprint.blueprint_version})
- Founder OS: \`${blueprint.output.founder_os_id}\`
`
}

function productSeed(
  product: FounderBlueprintSpec['products'][number],
  blueprint: FounderBlueprintSpec
) {
  const orgRel = product.organization_id
    ? `- Organization: [[organizations/${product.organization_id}]] (\`${product.organization_id}\`)\n`
    : ''
  return `---
type: product
id: ${product.id}
name: "${product.name.replace(/"/g, '\\"')}"
product_type: ${product.type}
${product.organization_id ? `organization_id: ${product.organization_id}\n` : ''}blueprint_id: ${blueprint.blueprint_id}
generated_by: founder-os-generate
---

# ${product.name}

${product.name} is a **${product.type}** product in your digital world.

## Description

Defined in Founder Blueprint \`${blueprint.blueprint_id}\`.

## Relationships

- Founder: \`${blueprint.founder.access_handle}\`
${orgRel}- Experiences: see \`vault-seeds/experiences/\` for surfaces linked to this product

## Source

- Blueprint: \`${blueprint.blueprint_id}\`
- Founder OS: \`${blueprint.output.founder_os_id}\`
`
}

function experienceSeed(
  exp: FounderBlueprintSpec['experiences'][number],
  blueprint: FounderBlueprintSpec
) {
  const productRel = exp.product_id
    ? `- Product: [[products/${exp.product_id}]] (\`${exp.product_id}\`)\n`
    : ''
  return `---
type: experience
id: ${exp.id}
name: "${exp.name.replace(/"/g, '\\"')}"
${exp.url ? `url: "${exp.url.replace(/"/g, '\\"')}"\n` : ''}${exp.product_id ? `product_id: ${exp.product_id}\n` : ''}blueprint_id: ${blueprint.blueprint_id}
generated_by: founder-os-generate
---

# ${exp.name}

${exp.name} is where people encounter, consume, or interact with your product.

## Description

${exp.url ? `Live surface: ${exp.url}` : 'URL not yet assigned.'}

## Relationships

- Founder: \`${blueprint.founder.access_handle}\`
${productRel}
## Source

- Blueprint: \`${blueprint.blueprint_id}\`
- Founder OS: \`${blueprint.output.founder_os_id}\`
`
}

function buildRegistryYaml(blueprint: FounderBlueprintSpec, materializedAt: string) {
  const registry = {
    schema_version: '1.0.0-mvp',
    package_version: PACKAGE_VERSION,
    founder_handle: blueprint.founder.access_handle,
    founder_display_name: blueprint.founder.display_name,
    founder_os_id: blueprint.output.founder_os_id,
    source_blueprint_id: blueprint.blueprint_id,
    blueprint_version: blueprint.blueprint_version,
    materialized_at: materializedAt,
    organizations: blueprint.organizations.map((o) => ({ id: o.id, name: o.name })),
    products: blueprint.products.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      ...(p.organization_id ? { organization_id: p.organization_id } : {}),
    })),
    experiences: blueprint.experiences.map((e) => ({
      id: e.id,
      name: e.name,
      url: e.url,
      ...(e.product_id ? { product_id: e.product_id } : {}),
    })),
    relationships: [
      ...blueprint.products
        .filter((p) => p.organization_id)
        .map((p) => ({
          type: 'product_organization',
          product_id: p.id,
          organization_id: p.organization_id,
        })),
      ...blueprint.experiences
        .filter((e) => e.product_id)
        .map((e) => ({
          type: 'experience_product',
          experience_id: e.id,
          product_id: e.product_id,
        })),
    ],
  }
  return yaml.stringify(registry)
}

function buildManifest(
  blueprint: FounderBlueprintSpec,
  materializedAt: string,
  sourceFile: string | null
) {
  return {
    package_version: PACKAGE_VERSION,
    schema_version: blueprint.schema_version,
    blueprint_id: blueprint.blueprint_id,
    blueprint_version: blueprint.blueprint_version,
    founder_os_id: blueprint.output.founder_os_id,
    founder_os_name: blueprint.output.name,
    founder_handle: blueprint.founder.access_handle,
    founder_display_name: blueprint.founder.display_name,
    materialized_at: materializedAt,
    source_file: sourceFile,
    counts: {
      organizations: blueprint.organizations.length,
      products: blueprint.products.length,
      experiences: blueprint.experiences.length,
    },
  }
}

function buildReadme(blueprint: FounderBlueprintSpec) {
  return `# ${blueprint.output.name}

Portable Founder Operating System generated from blueprint \`${blueprint.blueprint_id}\`.

| Field | Value |
|-------|-------|
| Founder | ${blueprint.founder.display_name} |
| Founder ID | \`${blueprint.founder.access_handle}\` |
| Founder OS ID | \`${blueprint.output.founder_os_id}\` |
| Schema | \`${blueprint.schema_version}\` |
| Status | \`${blueprint.status}\` |

## Package contents

| Path | Purpose |
|------|---------|
| \`blueprint.yaml\` | Input snapshot |
| \`manifest.json\` | Package metadata |
| \`registry.yaml\` | Agent navigation index |
| \`vault-seeds/\` | Obsidian / vault seed notes |

Canonical blueprint truth remains in **ACCESS** after save.
`
}

export async function generateFounderOsPackageFromSpec(
  blueprint: FounderBlueprintSpec,
  options?: { blueprintYamlPath?: string }
): Promise<GeneratePackageResult> {
  const stages: GenerateStage[] = ['validating', 'generating_yaml']
  const founderOsId = blueprint.output.founder_os_id
  const materializedAt = new Date().toISOString()
  const filesWritten: string[] = []

  // In production/Vercel, filesystem is ephemeral — cloud (Supabase) is the source of truth.
  // Skip local file generation and return cloud-ready success immediately.
  const isServerless =
    !process.env.FOUNDER_OS_OUTPUT_ROOT &&
    (!!process.env.VERCEL || process.env.NODE_ENV === 'production')

  if (isServerless) {
    stages.push('generating_registry', 'generating_vault_seeds', 'complete')
    return {
      success: true,
      stages,
      founderOsId,
      outDir: 'cloud',
      filesWritten: [],
    }
  }

  const outBase = resolveOutputRoot()
  const outDir = join(outBase, founderOsId)

  try {
    stages.push('generating_registry')
    await mkdir(join(outDir, 'vault-seeds', 'organizations'), { recursive: true })
    await mkdir(join(outDir, 'vault-seeds', 'products'), { recursive: true })
    await mkdir(join(outDir, 'vault-seeds', 'experiences'), { recursive: true })

    const blueprintOut = join(outDir, 'blueprint.yaml')
    if (options?.blueprintYamlPath) {
      await cp(resolve(options.blueprintYamlPath), blueprintOut)
    } else {
      await writeFile(blueprintOut, yaml.stringify(blueprint))
    }
    filesWritten.push(blueprintOut)

    const manifestPath = join(outDir, 'manifest.json')
    await writeFile(
      manifestPath,
      JSON.stringify(
        buildManifest(blueprint, materializedAt, options?.blueprintYamlPath ?? null),
        null,
        2
      ) + '\n'
    )
    filesWritten.push(manifestPath)

    const registryPath = join(outDir, 'registry.yaml')
    await writeFile(registryPath, buildRegistryYaml(blueprint, materializedAt))
    filesWritten.push(registryPath)

    const readmePath = join(outDir, 'README.md')
    await writeFile(readmePath, buildReadme(blueprint))
    filesWritten.push(readmePath)

    stages.push('generating_vault_seeds')

    for (const org of blueprint.organizations) {
      const p = join(outDir, 'vault-seeds', 'organizations', `${org.id}.md`)
      await writeFile(p, orgSeed(org, blueprint))
      filesWritten.push(p)
    }
    for (const product of blueprint.products) {
      const p = join(outDir, 'vault-seeds', 'products', `${product.id}.md`)
      await writeFile(p, productSeed(product, blueprint))
      filesWritten.push(p)
    }
    for (const exp of blueprint.experiences) {
      const p = join(outDir, 'vault-seeds', 'experiences', `${exp.id}.md`)
      await writeFile(p, experienceSeed(exp, blueprint))
      filesWritten.push(p)
    }

    stages.push('complete')

    return {
      success: true,
      stages,
      founderOsId,
      outDir,
      filesWritten,
    }
  } catch (err) {
    return {
      success: false,
      stages,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
