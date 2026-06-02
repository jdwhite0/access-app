import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { buildAccessHandleContext } from '../lib/access-handle/build-handle-context'

async function main() {
  const handle = process.argv[2] ?? 'jdwhite.access'
  const outPath = process.argv[3]
  if (!outPath) {
    console.error('Usage: tsx export-handle-context-once.ts <handle> <out.json>')
    process.exit(1)
  }

  const { context, error } = await buildAccessHandleContext(handle)
  if (!context) {
    console.error(error ?? 'Failed to build context')
    process.exit(1)
  }

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(context, null, 2), 'utf8')
  console.log(`Wrote ${outPath}`)
}

main()
