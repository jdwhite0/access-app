import type { CompanionDiagnostic } from '@/lib/jyson-bridge/companion-diagnostic'
import type { VaultSyncRequestResult } from '@/lib/actions/vaults'
import type { DeviceClass } from '@/lib/vault/device-detection'
import {
  JYSON_FIX_PREFIX,
  type RecoveryAction,
  type RecoveryPlan,
} from '@/lib/access/recovery-framework'

type DeviceHint = { isMobile: boolean; deviceLabel: string }

function action(
  id: RecoveryAction['id'],
  label: string,
  opts?: Partial<RecoveryAction>
): RecoveryAction {
  return { id, label, kind: opts?.kind ?? 'primary', ...opts }
}

export function buildRecoveryPlanFromCompanion(
  diagnostic: CompanionDiagnostic,
  device: DeviceHint
): RecoveryPlan {
  const code = diagnostic.status
  const cloudReady = diagnostic.cloudReady

  const basePrompt = `${JYSON_FIX_PREFIX}${diagnostic.title} — ${diagnostic.message}`

  if (code === 'auth_missing') {
    return {
      layer: 'account',
      accountArea: 'auth',
      blockerCode: code,
      title: 'Sign in to continue',
      body: 'ACCESS needs your session before JYSON or your vault can load.',
      jysonCanAutoFix: false,
      jysonPrompt: basePrompt,
      actions: [
        action('sign_in', 'Sign in to ACCESS', { kind: 'primary', href: '/' }),
      ],
    }
  }

  if (cloudReady && (code === 'cloud_package_ready' || code === 'local_sync_pending' || code === 'local_founder_os_ready')) {
    return {
      layer: 'operation',
      operationArea: 'companion_chat',
      blockerCode: code,
      title: 'Ready to talk to JYSON',
      body: device.isMobile
        ? `Your cloud vault and identity are active on ${device.deviceLabel}. We can open chat now — local folder tools are optional on a Mac or PC.`
        : 'Your cloud context is ready. Open JYSON chat — local tools are optional.',
      jysonCanAutoFix: true,
      jysonPrompt: `${JYSON_FIX_PREFIX}Open companion chat from cloud context.`,
      actions: [
        action('open_companion', 'Open JYSON chat', { kind: 'primary' }),
        action('go_vaults', 'Check vault sync', { kind: 'secondary', href: '/vaults' }),
        action('retry_load', 'Retry', { kind: 'secondary' }),
      ],
      question: {
        prompt: 'What do you want to do first?',
        choices: [
          { id: 'chat', label: 'Talk to JYSON', actionId: 'open_companion' },
          { id: 'vault', label: 'Sync my vault', actionId: 'go_vaults' },
          { id: 'team', label: 'See agents & tools', actionId: 'go_agents' },
        ],
      },
      technicalDetail: diagnostic.message,
    }
  }

  if (code === 'blueprint_missing' || code === 'blueprint_draft') {
    return {
      layer: 'account',
      accountArea: 'blueprint',
      blockerCode: code,
      title: 'Finish your ACCESS profile',
      body: cloudReady
        ? 'Your vault may already be syncing. Completing your blueprint unlocks the full ecosystem map for JYSON.'
        : 'A short blueprint tells JYSON who you are and what you are building — required once per account.',
      jysonCanAutoFix: false,
      jysonPrompt: `${JYSON_FIX_PREFIX}Guide me through completing my Founder blueprint without blocking my work.`,
      actions: [
        action('complete_blueprint', 'Complete blueprint', {
          kind: 'primary',
          href: '/founder',
        }),
        ...(cloudReady
          ? [action('open_companion', 'Open JYSON anyway', { kind: 'secondary' })]
          : [action('retry_load', 'Retry loading', { kind: 'secondary' })]),
        action('view_diagnostics', 'What is missing?', { kind: 'secondary' }),
      ],
      question: {
        prompt: 'What is your priority right now?',
        choices: cloudReady
          ? [
              { id: 'blueprint', label: 'Set up my profile', actionId: 'complete_blueprint' },
              { id: 'chat', label: 'Talk to JYSON now', actionId: 'open_companion' },
            ]
          : [
              { id: 'blueprint', label: 'Set up my profile', actionId: 'complete_blueprint' },
              { id: 'retry', label: 'Try again', actionId: 'retry_load' },
            ],
      },
      technicalDetail: diagnostic.message,
    }
  }

  if (code === 'identity_missing') {
    return {
      layer: 'account',
      accountArea: 'identity',
      blockerCode: code,
      title: 'Connect your ACCESS identity',
      body: 'We will create your handle and link your account — one tap.',
      jysonCanAutoFix: true,
      jysonPrompt: `${JYSON_FIX_PREFIX}Create or repair my ACCESS identity.`,
      actions: [
        action('retry_load', 'Set up my account', { kind: 'primary' }),
        action('view_diagnostics', 'Show details', { kind: 'secondary' }),
      ],
      technicalDetail: diagnostic.recommendedFix ?? diagnostic.message,
    }
  }

  return {
    layer: 'operation',
    operationArea: 'companion_chat',
    blockerCode: code,
    title: diagnostic.title || 'Something paused your session',
    body: diagnostic.body || 'JYSON can retry or walk you through the fix.',
    jysonCanAutoFix: diagnostic.canRepair && cloudReady,
    jysonPrompt: basePrompt,
    actions: [
      ...(cloudReady
        ? [action('open_companion', 'Open JYSON chat', { kind: 'primary' })]
        : []),
      ...(diagnostic.canRepair && !device.isMobile
        ? [
            action('generate_world', 'Build ACCESS world', {
              kind: cloudReady ? 'secondary' : 'primary',
              desktopOnly: true,
            }),
          ]
        : []),
      action('complete_blueprint', 'Blueprint', {
        kind: 'secondary',
        href: '/founder',
      }),
      action('retry_load', 'Retry', { kind: 'secondary' }),
      action('view_diagnostics', 'Diagnostics', { kind: 'secondary' }),
    ],
    question: {
      prompt: 'What were you trying to do?',
      choices: [
        { id: 'chat', label: 'Use JYSON', actionId: cloudReady ? 'open_companion' : 'retry_load' },
        { id: 'vault', label: 'Sync vault', actionId: 'go_vaults' },
        { id: 'fix', label: 'Fix my account', actionId: 'retry_load' },
      ],
    },
    technicalDetail: diagnostic.message,
  }
}

export function buildRecoveryPlanFromVaultSync(
  result: VaultSyncRequestResult,
  device: DeviceHint
): RecoveryPlan | null {
  if (result.status === 'synced') return null

  const code = result.status
  const basePrompt = `${JYSON_FIX_PREFIX}Vault sync failed: ${result.message}`

  if (code === 'connector_offline') {
    return {
      layer: 'operation',
      operationArea: 'vault_sync',
      blockerCode: code,
      title: device.isMobile
        ? 'Sync runs from your computer'
        : 'Connect this device to ACCESS',
      body: device.isMobile
        ? `On ${device.deviceLabel}, your cloud vault still works for JYSON. To refresh files from a folder, use ACCESS on a Mac or PC where that folder lives.`
        : 'Keep ACCESS running on this device so your brain folder can sync.',
      jysonCanAutoFix: false,
      jysonPrompt: basePrompt,
      actions: device.isMobile
        ? [
            action('open_companion', 'Talk to JYSON (cloud)', {
              kind: 'primary',
              href: '/companion',
            }),
            action('go_vaults', 'Learn more', { kind: 'secondary', href: '/vaults' }),
          ]
        : [
            action('connect_device', 'Connect this device', { kind: 'primary' }),
            action('retry_load', 'Try sync again', { kind: 'secondary' }),
          ],
      question: {
        prompt: 'What do you need right now?',
        choices: device.isMobile
          ? [
              { id: 'chat', label: 'Use JYSON with cloud vault', actionId: 'open_companion' },
              { id: 'learn', label: 'How vault sync works', actionId: 'go_vaults' },
            ]
          : [
              { id: 'connect', label: 'Connect device', actionId: 'connect_device' },
              { id: 'retry', label: 'Retry sync', actionId: 'sync_vault' },
            ],
      },
      technicalDetail: result.message,
    }
  }

  return {
    layer: 'operation',
    operationArea: 'vault_sync',
    blockerCode: code,
    title: 'Vault sync paused',
    body: result.message,
    jysonCanAutoFix: false,
    jysonPrompt: basePrompt,
    actions: [
      action('retry_load', 'Try again', { kind: 'primary' }),
      action('go_vaults', 'Vault settings', { kind: 'secondary', href: '/vaults' }),
      action('open_companion', 'Ask JYSON', {
        kind: 'secondary',
        href: '/companion',
        jysonPrompt: basePrompt,
      }),
    ],
    technicalDetail: result.message,
  }
}

export function deviceHintFromClass(
  deviceClass: DeviceClass,
  deviceLabel: string
): DeviceHint {
  const isMobile =
    deviceClass === 'iphone' ||
    deviceClass === 'ipad' ||
    deviceClass === 'android'
  return { isMobile, deviceLabel }
}
