import { access, readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import yaml from 'yaml'
import { handleToFounderOsId } from '@/lib/blueprint/defaults'
import type { FounderBlueprintSpec } from '@/types/founder-blueprint'
import type { RegistrySnapshot, VaultSeedSummary } from './types'

function resolveFounderOsRoot(): string {
  if (process.env.FOUNDER_OS_OUTPUT_ROOT) {
    return resolve(process.env.FOUNDER_OS_OUTPUT_ROOT)
  }
  return resolve(process.cwd(), '..', 'founder-os')
}

export function packagePathForHandle(accessHandle: string): string {
  const id = handleToFounderOsId(accessHandle)
  return join(resolveFounderOsRoot(), id)
}

export async function loadPackageBlueprint(
  accessHandle: string
): Promise<{ spec: FounderBlueprintSpec; packagePath: string } | null> {
  const packagePath = packagePathForHandle(accessHandle)
  const blueprintPath = join(packagePath, 'blueprint.yaml')
  try {
    await access(blueprintPath)
    const raw = await readFile(blueprintPath, 'utf8')
    const spec = yaml.parse(raw) as FounderBlueprintSpec
    return { spec, packagePath }
  } catch {
    return null
  }
}

export async function loadPackageRegistry(
  packagePath: string
): Promise<RegistrySnapshot | null> {
  try {
    const raw = await readFile(join(packagePath, 'registry.yaml'), 'utf8')
    return yaml.parse(raw) as RegistrySnapshot
  } catch {
    return null
  }
}

async function listSeeds(
  packagePath: string,
  subdir: string,
  type: VaultSeedSummary['type']
): Promise<VaultSeedSummary[]> {
  const dir = join(packagePath, 'vault-seeds', subdir)
  try {
    const files = await readdir(dir)
    const seeds: VaultSeedSummary[] = []
    for (const file of files.filter((f) => f.endsWith('.md'))) {
      const id = file.replace(/\.md$/, '')
      const content = await readFile(join(dir, file), 'utf8')
      const nameMatch = content.match(/^#\s+(.+)$/m)
      seeds.push({
        id,
        type,
        name: nameMatch?.[1]?.trim() ?? id,
        path: `vault-seeds/${subdir}/${file}`,
      })
    }
    return seeds
  } catch {
    return []
  }
}

export async function loadPackageVaultSeedSummaries(
  packagePath: string
): Promise<VaultSeedSummary[]> {
  const orgs = await listSeeds(packagePath, 'organizations', 'organization')
  const products = await listSeeds(packagePath, 'products', 'product')
  const experiences = await listSeeds(packagePath, 'experiences', 'experience')
  return [...orgs, ...products, ...experiences]
}
