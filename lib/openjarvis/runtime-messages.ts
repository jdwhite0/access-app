import type { OpenJarvisInstallInfo } from './detect-setup'

export function buildOpenJarvisStatusMessage(input: {
  deploymentMode: 'cloud' | 'local'
  privateLayerEnabled: boolean
  install: OpenJarvisInstallInfo
  openJarvisOnline: boolean
  connectorOnline: boolean
  healthError?: string
}): string | undefined {
  if (input.deploymentMode === 'cloud') {
    return 'Production cloud — OpenJarvis runs on your machine only. Founder local stack: npm run dev + connector:heartbeat + openjarvis:serve.'
  }

  if (!input.privateLayerEnabled) {
    return 'Local ACCESS without Private JYSON — set PRIVATE_JYSON_ENABLED=true in access-app/.env.local and restart npm run dev.'
  }

  if (!input.install.installed) {
    return `OpenJarvis is not installed on this machine. See ${input.install.docsPath} (install ~/.openjarvis venv).`
  }

  if (!input.openJarvisOnline) {
    const detail = input.healthError ? ` (${input.healthError})` : ''
    return `OpenJarvis server not reachable at ${input.install.localUrl}${detail}. Run: ${input.install.startCommand}`
  }

  if (!input.connectorOnline) {
    return 'OpenJarvis is running. Connector offline — run npm run connector:heartbeat (Terminal 2) to enable live tool execution.'
  }

  return undefined
}
