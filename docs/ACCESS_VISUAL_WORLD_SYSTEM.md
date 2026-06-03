# ACCESS Visual World System

JD world-building 3D language + Stripe-level clean layout.

**Ratio:** 80% clean SaaS · 15% atmosphere · 5% motion

## Primitives

| Primitive | Component | Meaning |
|-----------|-----------|---------|
| Planets | `AccessPlanetScene` | Worlds — ACCESS, JYSON, Founder, Memory |
| Orbits | CSS rings on scene | Connection, sync, cloud/local bridge |
| Glass panels | `GlassPanel` | Software surfaces, cards |
| Light trails | SVG paths on scene | Data flow, AI reasoning |
| Atmosphere | `WorldAtmosphere` | Navy/black/cyan/gold gradients |

### Planet kinds

- `access` — cyan — public brand / landing
- `jyson` — cyan pulse — intelligence layer
- `founder` — gold — identity / blueprint
- `memory` — soft violet — knowledge

### Scales

- `hero` — landing right column
- `lg` — auth split
- `md` — home (calm)
- `sm` — floating JYSON orb

## Where used

| Surface | Treatment |
|---------|-----------|
| `/` landing | Split layout + hero `access` planet |
| Founder sign-in | `AccessAuthSplit` + founder planet |
| Home | `WorldAtmosphere` subtle + `jyson` md (no trails) |
| JYSON orb | `jyson` sm |
| Projects | `ProjectWorldNode` + `GlassPanel` cards |

## Stripe principles applied (not copied)

- Whitespace and left-aligned form on landing
- Single focal column + immersive right visual
- Sans typography on public surfaces
- Soft gradients, hairline borders, glass depth
- Motion: orbital spin, breathing glow, gradient drift

## Files

```
components/visual-world/
  AccessPlanetScene.tsx
  WorldAtmosphere.tsx
  GlassPanel.tsx
  AccessAuthSplit.tsx
  ProjectWorldNode.tsx
lib/design-system/styles/visual-world.css
```
