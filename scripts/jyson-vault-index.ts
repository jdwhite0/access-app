#!/usr/bin/env npx tsx
/**
 * Build local JD Command Vault content index for JYSON context injection.
 *
 * Usage:
 *   npm run jyson:vault:index
 *   npx tsx scripts/jyson-vault-index.ts --path "/path/to/JD Command Vault"
 */
import { buildVaultContentIndex, vaultIndexFilePath } from '../lib/jyson/vault-context'
import { resolveFounderVaultPathSync } from '../lib/jyson/resolve-founder-vault-path'

function parsePathArg(): string | undefined {
  const idx = process.argv.indexOf('--path')
  if (idx === -1) return undefined
  return process.argv[idx + 1]?.trim()
}

async function main() {
  const override = parsePathArg()
  const { path, source } = resolveFounderVaultPathSync(override, {
    requirePrivateJyson: false,
  })

  if (!path) {
    console.error(
      `No vault path available (source=${source}). Set --path or ensure DEFAULT_JD_COMMAND_VAULT_PATH exists.`,
    )
    process.exit(1)
  }

  console.error(`Indexing vault: ${path} (source=${source})`)
  const result = await buildVaultContentIndex(path)

  if (!result.ok || !result.manifest) {
    console.error(`Index failed: ${result.error ?? 'unknown'}`)
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        indexPath: vaultIndexFilePath(path),
        fileCount: result.manifest.fileCount,
        chunkCount: result.manifest.chunkCount,
        truncatedScan: result.manifest.truncatedScan,
        indexedAt: result.manifest.indexedAt,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
