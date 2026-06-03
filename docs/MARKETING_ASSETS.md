# ACCESS Marketing Assets

Hero and product motion for the public homepage (`PublicHomePage` → `HeroProductMotion` + `HeroAmbientVideo`).

**Brand palette (visual only):** pearl void `#f8fafc` / white, navy core `#1a1f36`, cyan intelligence `#0ea5b9`, soft gold `#b8956a`, silver translucent planes.

**Concept:** intelligence becoming calm infrastructure — not cyberpunk, not generic AI brain, not orb-in-card UI.

**Videos:** Remotion for product UI loops; Higgsfield for cinematic hero b-roll; FAL for stills. Missing clips fall back to void posters — no broken layout.

---

## Files on disk

| Asset | Path | Use |
|-------|------|-----|
| Hero (portrait) | `public/marketing/hero-intelligence-infrastructure.webp` | Optional static hero art |
| Hero PNG source | `public/marketing/hero-intelligence-infrastructure.png` | Source export from FAL |
| Void background | `public/marketing/hero-void-background.webp` | Poster fallback + section backgrounds |
| Manifest | `public/marketing/manifest.json` | Last image generation metadata |
| Video manifest | `public/marketing/video/manifest.json` | Last Remotion render metadata |

---

## Regenerate stills (FAL)

**Prerequisite:** `FAL_KEY` in `access-app/.env.local` (do not commit).

```bash
cd access-app
python3 scripts/generate-access-marketing-heroes.py
```

Uses `fal-ai/flux-pro`. Writes PNG + WebP to `public/marketing/`.

---

## Ready-to-paste prompts (FAL)

### Hero — right column (`portrait_16_9` / 9:16)

```
Premium 3D digital illustration for enterprise software homepage hero, abstract concept intelligence becoming calm infrastructure. Volumetric white pearl glass planes folding into deep navy structural core, thin cyan intelligence flow lines tracing paths between translucent silver layers, restrained soft gold accent glints. Expansive pearl void atmosphere, soft studio rim light, depth of field, dimensional flowing geometry. NOT a brain, NOT cyberpunk neon, NOT robot, NOT orb in a card UI, NOT generic AI clipart. Editorial luxury tech aesthetic, Octane-style render, generous negative space on left for marketing copy, vertical portrait composition, ultra clean, no text, no logos, no people.
```

### Full-bleed void background (`landscape_16_9` / 16:9)

```
Abstract full-bleed background for premium SaaS homepage, pearl white void fading to cool gray haze, distant flowing translucent architecture planes in silver and white, navy depth at center-bottom, sparse cyan luminous paths like quiet data rivers, micro gold highlights. Soft cinematic lighting, shallow depth, widescreen 16:9, serene infrastructural mood, no characters, no logos, no text, no cyberpunk, no brain imagery, no UI mockup.
```

---

## Wire-up in code (homepage)

| Layer | Component |
|-------|-----------|
| Hero copy + triad | `PublicHomePage.tsx` |
| Floating product cards | `HeroProductMotion.tsx` |
| Cinematic b-roll (Higgsfield) | `HeroCinematicVideo.tsx` → `MarketingLoopVideo` |
| Ambient canvas video (Remotion) | `HeroAmbientVideo.tsx` → `MarketingLoopVideo` |
| How it works tabs | `MarketingHowItWorks.tsx` → per-tab clips |
| Reduced motion / missing file | `MarketingLoopVideo.tsx` → poster / void fallback |

**Styles:** `lib/design-system/styles/marketing-home-v2.css`

---

## Marketing videos (Remotion — product UI)

Programmatic UI loops: hero ambient canvas + tab panels + combined how-it-works reel. Plain-language captions; white / navy / cyan brand.

| Clip | Composition | Output |
|------|-------------|--------|
| Hero ambient | `AccessHeroAmbient` | `hero-ambient.mp4` (+ `.webm`, `-poster.webp`) |
| How — Home | `AccessProductScene` (`scene: home`) | `how-home.mp4` |
| How — AI guide | `AccessProductScene` (`scene: guide`) | `how-guide.mp4` |
| How — Plans | `AccessProductScene` (`scene: plans`) | `how-plans.mp4` |
| How it works (combined) | `AccessHowItWorks` | `access-how-it-works.mp4` |

**Project:** `access-app/remotion/` (isolated from Next.js build).

**First-time setup:**

```bash
cd access-app
npm run remotion:install
```

**Preview:**

```bash
npm run remotion:studio
```

**Render all clips + posters** (requires `ffmpeg` on PATH for WebP posters and MP4 optimize):

```bash
cd access-app
npm run remotion:render
```

Single clips from `access-app/remotion/`:

```bash
npm run render:hero
npm run render:home
npm run render:guide
npm run render:plans
npm run render:how-it-works
```

Until you render, the UI uses CSS motion (`HeroProductMotion`) and static void posters — no broken layout.

After rendering, run `npm run build` in `access-app`.

---

## Marketing videos (Higgsfield — cinematic b-roll)

Abstract hero motion loops (image-to-video from void background still). Layered under Remotion ambient in the hero canvas.

| Clip | Model | Source | Output |
|------|-------|--------|--------|
| Hero cinematic | DoP turbo | `hero-void-background.png` | `hero-cinematic.mp4` (+ `.webm`, `-poster.webp`) |

**Prerequisite:** Higgsfield Cloud credentials in `access-app/.env.local`:

```bash
# Preferred — KEY_ID and KEY_SECRET from https://cloud.higgsfield.ai/
HF_CREDENTIALS=YOUR_KEY_ID:YOUR_KEY_SECRET

# Or separate:
# HF_API_KEY=...
# HF_API_SECRET=...
```

**Install SDK + render:**

```bash
cd access-app
npm run higgsfield:install
npm run higgsfield:render-hero
```

Script: `scripts/generate-access-marketing-higgsfield-videos.ts` (uses `@higgsfield/client`).

**Alternative CLI:**

```bash
npm install -g @higgsfield/cli
higgsfield auth login
higgsfield --help
```

**Optional FAL image-to-video** (hero ambient from void still, or tab UI stills + motion):

```bash
cd access-app
python3 scripts/generate-access-marketing-videos.py              # all clips
python3 scripts/generate-access-marketing-videos.py hero-ambient # void loop only
python3 scripts/generate-access-marketing-videos.py how-home how-guide how-plans
```

Uses `fal-ai/flux-pro` (stills) + `fal-ai/minimax-video/image-to-video` + ffmpeg optimize. Requires `FAL_KEY` in `.env.local`. Remotion preferred for product UI clips (plain-language captions, exact brand tokens).

---

## Status notes

- **Higgsfield:** optional cinematic hero b-roll — set `HF_CREDENTIALS` and run `npm run higgsfield:render-hero`.
- **FAL:** optional for hero stills only.
- Do not put revenue targets or internal pricing math in public UI.
