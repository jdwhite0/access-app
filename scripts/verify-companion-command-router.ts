#!/usr/bin/env npx tsx
import { routeCompanionCommand } from '../lib/jyson-bridge/companion-command-router'

function expectExecute(
  input: string,
  toolId: 'read_file' | 'list_files',
  paramKey: string,
  paramVal: string
) {
  const r = routeCompanionCommand(input)
  if (r.kind !== 'execute' || r.toolId !== toolId) {
    console.error(`FAIL "${input}"`, r)
    process.exit(1)
  }
  if (String(r.params[paramKey]) !== paramVal) {
    console.error(`FAIL "${input}" param`, r.params)
    process.exit(1)
  }
  console.log(`✓ "${input}" → ${toolId} ${paramKey}=${paramVal}`)
}

expectExecute('show me the docs folder', 'list_files', 'directory', 'docs')
expectExecute('list my files', 'list_files', 'directory', '.')
expectExecute('read package.json', 'read_file', 'path', 'package.json')
expectExecute('read the milestone 10 file', 'read_file', 'path', 'docs/MILESTONE_10_COMPANION_EXECUTE_UI.md')

const clarify = routeCompanionCommand('do something vague with files maybe')
if (clarify.kind !== 'clarify') {
  console.error('FAIL expected clarify', clarify)
  process.exit(1)
}
console.log('✓ ambiguous → clarify')

console.log('\nM11 ROUTER: PASS')
