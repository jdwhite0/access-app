'use client'

import { OS_MODULES, type OsModuleId } from './types'

type Props = {
  activeModule: OsModuleId
  onSelect: (id: OsModuleId) => void
}

export default function AccessOsLeftRail({ activeModule, onSelect }: Props) {
  return (
    <div className="access-os-module-rail" aria-label="Registry modules">
      <p className="access-nav-section-label">Registry</p>
      <ul className="access-os-rail-list">
        {OS_MODULES.map((mod) => {
          const isActive = mod.id === activeModule
          const isDisabled = !mod.enabled

          return (
            <li key={mod.id}>
              <button
                type="button"
                className={[
                  'access-os-rail-item',
                  isActive ? 'is-active' : '',
                  isDisabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isDisabled}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={isDisabled}
                onClick={() => {
                  if (mod.enabled) onSelect(mod.id)
                }}
              >
                <span className="access-os-rail-glyph" aria-hidden>
                  {mod.glyph}
                </span>
                <span className="access-os-rail-label">{mod.label}</span>
                {isDisabled && (
                  <span className="access-os-rail-soon" aria-hidden>
                    Soon
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
