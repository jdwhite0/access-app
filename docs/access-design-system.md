# ACCESS OS Design System

Unified operating-system visual language for Registry, Dashboard, Founder Blueprint, Companion, Command Center, Terminal, and future modules.

**Package root:** `access-app/lib/design-system/`

---

## Design tokens

Source of truth: `lib/design-system/tokens.ts`

| Category | Notes |
|----------|--------|
| **Colors** | Void-dominant night palette; day mode keeps terminal / command-center feel (cool gray base, teal accent) |
| **Typography** | JetBrains Mono (`--mono`) for OS chrome; Inter available via `--sans` where needed |
| **Spacing** | 4px scale (`--ds-space-*`) |
| **Radius** | 2px / 3px / 6px — sharp, instrument-panel feel |
| **Shadows** | Subtle depth + accent glow |
| **Status** | operational, degraded, blocked, offline |
| **Surfaces** | base → shell → panel → overlay; OS layout widths |

CSS variables are applied in `lib/design-system/styles/themes.css` and map to legacy names (`--bg`, `--accent`, `--os-surface`, etc.) so existing screens keep working.

---

## Theme behavior

### Schedule (local device time)

| Mode | Window |
|------|--------|
| **Day** | 5:30 AM – 5:59 PM |
| **Night** | 6:00 PM – 5:29 AM |

### Override

Stored in `localStorage` key `access-theme-preference`:

- `auto` — follow schedule (default)
- `day` — force day
- `night` — force night

```ts
import { useTheme } from '@/lib/design-system'

const { preference, resolved, setPreference } = useTheme()
setPreference('night')
```

Console override:

```js
localStorage.setItem('access-theme-preference', 'night') // or 'day' | 'auto'
location.reload()
```

### Implementation

- `html[data-theme="day" | "night"]` drives CSS variables
- Inline boot script in `app/layout.tsx` avoids flash before hydration
- `ThemeProvider` + `useTheme()` sync schedule and preference on the client

---

## Components

Import from `@/lib/design-system`:

| Component | Class prefix | Use |
|-----------|--------------|-----|
| `Card` | `access-ds-card` | Metric / content tiles |
| `Panel` | `access-ds-panel` | Raised sections |
| `Section` | `access-ds-section` | Eyebrow + title + description block |
| `StatusBadge` | `access-ds-badge` | Operational / degraded / blocked states |
| `MetricCard` | `access-ds-metric` | KPI display |
| `DataTable` | `access-ds-table` | Registry-style tables |
| `CommandButton` | `access-ds-cmd-btn` | Primary / ghost actions |
| `NavigationItem` | `access-ds-nav-item` | Rail / module nav |
| `ModuleHeader` | `access-ds-module-header` | Module title block |
| `EmptyState` | `access-ds-empty` | No data placeholders |
| `AlertBanner` | `access-ds-alert` | Warnings / errors / info |

### Example

```tsx
import {
  ModuleHeader,
  MetricCard,
  StatusBadge,
  AlertBanner,
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeaderCell,
  DataTableCell,
} from '@/lib/design-system'

export function RegistrySnapshot() {
  return (
    <>
      <ModuleHeader eyebrow="Registry" title="System map" subtitle="Live topology." />
      <StatusBadge variant="operational" label="Live" />
      <AlertBanner variant="warning">Identity sync delayed.</AlertBanner>
      <MetricCard label="Nodes" value="12" />
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Handle</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>@operator</DataTableCell>
            <DataTableCell>active</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>
    </>
  )
}
```

---

## ACCESSShell

`ACCESSShell` — top bar, left navigation, main workspace, optional context column.

```tsx
import { ACCESSShell } from '@/lib/design-system'

<ACCESSShell
  topbar={<>{/* trail + meta */}</>}
  navigation={<nav>...</nav>}
  context={<aside>...</aside>}
>
  {children}
</ACCESSShell>
```

Signed-in OS uses this via `components/os/AccessOsShell.tsx` (module state unchanged).

**Mobile:** ≤768px — slide-over rail, backdrop, 44px touch targets, scrollable main/context.

---

## Stylesheets

Imported from `app/globals.css`:

1. `styles/themes.css` — token variables
2. `styles/components.css` — `access-ds-*` components
3. `styles/shell.css` — shell layout + mobile

---

## Out of scope (do not mix into design-system PRs)

- Onboarding / post-login redirect
- Founder OS generation
- Companion loading
- Route guards / middleware
- Module routing IDs and registry fetch logic

Design system is **presentation only**.
