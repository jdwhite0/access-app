import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type OpenJarvisInstallInfo = {
  installed: boolean
  pythonPath: string | null
  jarvisPath: string | null
  localUrl: string
  startCommand: string
  docsPath: string
}

const DOCS_PATH = 'access-app/docs/DEVELOPER_GUIDE.md#openjarvis-local-setup'

export function detectOpenJarvisInstall(): OpenJarvisInstallInfo {
  const home = process.env.HOME ?? ''
  const base = join(home, '.openjarvis')
  const pythonPath = join(base, '.venv', 'bin', 'python')
  const jarvisPath = join(base, '.venv', 'bin', 'jarvis')
  const installed = existsSync(pythonPath)
  const localUrl = process.env.OPENJARVIS_LOCAL_URL ?? 'http://localhost:8000'

  return {
    installed,
    pythonPath: existsSync(pythonPath) ? pythonPath : null,
    jarvisPath: existsSync(jarvisPath) ? jarvisPath : null,
    localUrl,
    startCommand: 'cd access-app && npm run openjarvis:serve',
    docsPath: DOCS_PATH,
  }
}
