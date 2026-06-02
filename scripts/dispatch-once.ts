#!/usr/bin/env npx tsx
/** CLI entry for P10 dispatch (used when Next cannot bundle monorepo imports). */
import { runJysonDispatch } from '../lib/jyson-bridge/run-dispatch'

async function main() {
  const handle = process.argv[2]
  const command = process.argv[3]
  if (!handle || !command) {
    console.error('Usage: dispatch-once.ts <handle> <command>')
    process.exit(1)
  }
  const result = await runJysonDispatch(handle, command)
  process.stdout.write(JSON.stringify(result))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
