# ACCESS Design V4 — Research: Stripe-Informed, Not Stripe-Copied

**Mission:** ACCESS feels like a new operating system for builders — aware, alive, worth paying for.

**Rule:** Extract *why* Stripe (and peers) feel valuable. Do not clone purple gradients, diagonal bands, or marketing illustration style.

---

## 1. Visual hierarchy (Stripe → ACCESS)

### What Stripe does

| Principle | Stripe behavior | Why it works |
|-----------|-----------------|--------------|
| **Focal isolation** | One primary action per viewport region | Brain knows where to act |
| **Negative space as structure** | Large quiet zones; content in 560–720px reading columns inside wide canvases | Reduces cognitive load |
| **Type scale, not boxes** | Headlines carry weight; body is subdued; metadata is smallest | Hierarchy without card spam |
| **Depth through light** | Soft elevation, hairline borders, no heavy shadows everywhere | Premium, not Bootstrap |
| **Color as signal** | Accent only on interactive + status; neutrals dominate | Trust through restraint |
| **Progressive columns** | Dashboard: summary left, detail right; never all metrics equal weight | Eye path: status → action → detail |

Surfaces studied: Login (single column, one CTA), Dashboard (metric strip + table), Billing (plan state first), Developer Portal (nav + doc column), Identity (stepper calm), Connect onboarding (checklist disclosure).

### ACCESS application

- **Home:** One hero insight (JYSON-aware sentence) + one command field — not a grid of equal cards.
- **Places nav:** Secondary to conversation; rail is quiet until hovered/active.
- **Pages:** Page title → one-line context → content. Cards only when grouping *actions*, not for decoration.
- **Whitespace:** Increase vertical rhythm (`--v4-space-section`); cap reading width at 680px for prose/intelligence.

---

## 2. Motion design (Stripe → ACCESS)

### What Stripe does

- **Duration:** 150–220ms UI; 280–400ms layout; never >500ms for routine UI.
- **Easing:** Ease-out for enter; ease-in for exit; spring only for success/celebration.
- **Hover:** 1–2px translate or border brighten — not scale bombs.
- **Loading:** Skeleton shimmer or inline spinner on the *element*, not full-page blocking.
- **State:** Button → loading → success check; tables fade new rows.

### ACCESS application

- Global motion tokens: `--motion-fast`, `--motion-standard`, `--motion-emphasis`.
- `PageMotion`: subtle opacity + 4px Y (already); add stagger for list emergence.
- **Living planet:** continuous low-amplitude pulse; faster pulse on `listening` / `executing`.
- **JYSON layer:** panel slides up 12px; orb scale 1.02 on hover.
- **Nav:** background cross-fade 180ms; active indicator slides (CSS transform).

**Not flashy:** no bounce, no parallax scroll hijacking, no particle storms on every page.

---

## 3. Information density (Stripe → ACCESS)

### What Stripe does

- **Summary → detail:** Invoice list shows status chip; detail on click.
- **Defaults hidden:** Advanced API options behind "Advanced" or tabs.
- **Contextual help:** One sentence under labels, not tooltips everywhere.
- **Tables > cards** for comparable items; cards for *decisions*.

### ACCESS application

- Registry: universe map with filters, not 12 stat boxes.
- Billing: current plan state first; upgrade secondary.
- Home: **Attention list** (3 items max) from registry + recent work — not dashboard KPI grid.
- Companion page demoted to "full intelligence view"; daily work in JYSON layer.

---

## 4. Emotional architecture

### Stripe evokes

Confidence · Clarity · Professionalism · Trust · Momentum (money moving forward)

### ACCESS must evoke

Possibility · Intelligence · Momentum · Ownership · Creation

| Emotion | Design lever |
|---------|----------------|
| Possibility | Open command field; "you can ask anything" without empty dashboard |
| Intelligence | JYSON cites *your* projects, last route, sync state — not generic copy |
| Momentum | "3 projects in motion" / "vault synced today" / next action chip |
| Ownership | User name, handle, *your* registry counts — never "ACCESS world" |
| Creation | Emergent tiles appear from conversation + registry, not static placeholders |

**Paywall without saying it:** Show what they're already building; gate depth (local tools, unlimited registry) through plan — Stripe Billing pattern (state visible, upgrade one click).

---

## 5. Peer synthesis (navigation & OS feel)

| Product | Lesson for ACCESS |
|---------|-------------------|
| **Linear** | Cmd-K + minimal rail; speed is the brand |
| **Notion** | Sidebar = places; content = infinite canvas |
| **Arc** | Spaces feel like rooms, not tabs |
| **Vercel** | Project context in header; calm dark UI |
| **Supabase** | Dev tool clarity; table-first |
| **Cursor** | AI always available, never a separate "AI page" |
| **Raycast** | Floating command = primary interface |
| **Apple Intelligence** | Glow + restraint; system-level companion |

**ACCESS navigation V4:** Rail = places (quiet). **JYSON orb** = primary interface (Raycast/Cursor). Breadcrumb = where am I. No duplicate "Companion" as main journey.

---

## 6. JYSON positioning (V4 correction)

| Wrong | Right |
|-------|-------|
| Chatbot page | OS-level intelligence layer |
| "What are we building today?" | "You're refining onboarding — 2 projects in motion." |
| Companion-only | Persistent orb + contextual home |
| Form-like Q&A | Navigate · retrieve · explain · act |

Implementation map:

- `contextual-awareness.ts` — home headline, attention items, layer opener
- `JysonLayerProvider` — route + registry + recent intents + last place
- Home — insight block + command (placeholder: "Continue or ask anything…")

---

## 7. Quality bar: 6/10 → 9.5/10

**Launch-video test:** Every screen needs one cinematic moment (planet, glass command, or calm typographic hero) and zero "template dashboard" grids.

**Per-screen checklist:**

1. One focal point
2. User-centric copy (no platform vanity)
3. Motion on interaction
4. JYSON can answer "where am I / what am I building" without navigation
5. Upgrade path visible where relevant (billing, limits)

---

## 8. Implementation phases (V4)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| R1 | This research doc | Done |
| R2 | Motion + spacing tokens (`v4-experience.css`) | In progress |
| R3 | Contextual home + attention | In progress |
| R4 | JYSON layer contextual opener | In progress |
| R5 | Nav rail V4 (quieter, predictive hint) | Planned |
| R6 | Page-by-page density pass (registry, billing, plans) | Planned |

---

## 9. Why Stripe feels valuable (one paragraph)

Stripe sells **clarity at scale**: complex money movement feels simple because hierarchy is ruthless, motion confirms action, and the product never asks you to hunt. ACCESS must sell **clarity of creation**: complex founder infrastructure feels simple because JYSON already knows your context, the UI stays quiet, and every screen whispers momentum — not "welcome to our platform."
