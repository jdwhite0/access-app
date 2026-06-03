#!/usr/bin/env npx tsx
/**
 * Renders ACCESS marketing clips + poster WebPs into access-app/public/marketing/video/
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REMOTION_ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.resolve(REMOTION_ROOT, '../public/marketing/video')
const ENTRY = 'src/index.ts'
const POSTER_FRAME = 90

type Clip = {
  compositionId: string
  slug: string
  props?: Record<string, string>
}

const CLIPS: Clip[] = [
  { compositionId: 'AccessHeroAmbient', slug: 'hero-ambient' },
  {
    compositionId: 'AccessProductScene',
    slug: 'how-home',
    props: { scene: 'home' },
  },
  {
    compositionId: 'AccessProductScene',
    slug: 'how-guide',
    props: { scene: 'guide' },
  },
  {
    compositionId: 'AccessProductScene',
    slug: 'how-plans',
    props: { scene: 'plans' },
  },
  { compositionId: 'AccessHowItWorks', slug: 'access-how-it-works' },
]

function run(cmd: string) {
  console.log(`\n> ${cmd}\n`)
  execSync(cmd, { cwd: REMOTION_ROOT, stdio: 'inherit', env: process.env })
}

function hasFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function optimizeMp4(src: string) {
  if (!hasFfmpeg()) {
    console.warn('ffmpeg not found — skipping MP4 optimize')
    return
  }
  const tmp = `${src}.tmp.mp4`
  run(
    `ffmpeg -y -i "${src}" -c:v libx264 -preset slow -crf 23 -movflags +faststart -an "${tmp}"`,
  )
  fs.renameSync(tmp, src)
}

function pngToWebpPoster(png: string, webp: string) {
  try {
    run(
      `python3 -c "from PIL import Image; Image.open('${png}').save('${webp}', 'WEBP', quality=85)"`,
    )
    fs.unlinkSync(png)
    return
  } catch {
    console.warn('PIL WebP failed — trying ffmpeg')
  }
  if (hasFfmpeg()) {
    try {
      run(`ffmpeg -y -i "${png}" -c:v libwebp -quality 82 "${webp}"`)
      fs.unlinkSync(png)
      return
    } catch {
      /* fall through */
    }
  }
  fs.renameSync(png, webp.replace(/\.webp$/, '-poster.png'))
  console.warn(`Poster left as PNG: ${png}`)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const clip of CLIPS) {
  const mp4 = path.join(OUT_DIR, `${clip.slug}.mp4`)
  const webm = path.join(OUT_DIR, `${clip.slug}.webm`)
  const poster = path.join(OUT_DIR, `${clip.slug}-poster.webp`)
  const posterPng = path.join(OUT_DIR, `${clip.slug}-poster.png`)
  const propsFlag = clip.props
    ? `--props='${JSON.stringify(clip.props)}'`
    : ''

  run(
    `npx remotion render ${ENTRY} ${clip.compositionId} "${mp4}" ${propsFlag} --codec=h264 --crf=23`.trim(),
  )
  optimizeMp4(mp4)

  try {
    run(
      `npx remotion render ${ENTRY} ${clip.compositionId} "${webm}" ${propsFlag} --codec=vp8 --crf=32`.trim(),
    )
  } catch (e) {
    console.warn(`WebM skipped for ${clip.slug}:`, e)
  }

  run(
    `npx remotion still ${ENTRY} ${clip.compositionId} "${posterPng}" --frame=${POSTER_FRAME} ${propsFlag}`.trim(),
  )
  pngToWebpPoster(posterPng, poster)
}

const manifest = {
  generator: 'access-app/remotion',
  renderedAt: new Date().toISOString(),
  clips: CLIPS.map((c) => c.slug),
  fps: 30,
  size: '1280x720',
}

fs.writeFileSync(
  path.join(OUT_DIR, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

console.log('\nDone. Outputs in public/marketing/video/')
