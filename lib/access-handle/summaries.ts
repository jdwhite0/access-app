import type { AccessHandleContext } from './types'

export function buildConsumerSummary(ctx: Omit<AccessHandleContext, 'summaries'>): string {
  const lines: string[] = []
  lines.push('This is your digital identity.')
  lines.push(
    `${ctx.identity.displayName} — ACCESS ID ${ctx.accessHandle}. Everything in your digital world attaches to this handle.`
  )
  lines.push('')
  lines.push(
    'This blueprint tells ACCESS who you are and what you are building. ACCESS is the source of truth; your agent reads from here.'
  )
  if (ctx.organizations.length) {
    lines.push('')
    lines.push('Companies / organizations:')
    ctx.organizations.forEach((o) => lines.push(`  • ${o.name}`))
  }
  if (ctx.products.length) {
    lines.push('')
    lines.push('Products / offers / projects:')
    ctx.products.forEach((p) => lines.push(`  • ${p.name}`))
  }
  if (ctx.experiences.length) {
    lines.push('')
    lines.push('Experiences — where people meet what you create:')
    ctx.experiences.forEach((e) => lines.push(`  • ${e.name} (${e.url})`))
  }
  lines.push('')
  lines.push('Your agent uses this blueprint to help organize and operate your digital world.')
  return lines.join('\n')
}

export function buildTechnicalSummary(ctx: Omit<AccessHandleContext, 'summaries'>): string {
  return [
    '=== ACCESS Handle Context (technical) ===',
    `Handle (ownership anchor): ${ctx.accessHandle}`,
    `User system id: ${ctx.userSystemId}`,
    `Blueprint: ${ctx.blueprint.blueprint_id} v${ctx.blueprint.blueprint_version}`,
    `Source: ${ctx.source}`,
    `Package: ${ctx.userSystemPackagePath ?? 'none'}`,
    `Vault seeds: ${ctx.vaultSeedSummaries.length}`,
    `Allowed: ${ctx.allowedActions.join(', ')}`,
    `Denied: ${ctx.deniedActions.join(', ')}`,
  ].join('\n')
}
