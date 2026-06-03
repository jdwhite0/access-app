#!/usr/bin/env npx tsx
/**
 * Generate ACCESS homepage cinematic b-roll via Higgsfield (image-to-video).
 *
 * Requires HF_CREDENTIALS (KEY_ID:KEY_SECRET) or HF_API_KEY + HF_API_SECRET
 * in environment or access-app/.env.local.
 *
 * Outputs: access-app/public/marketing/video/hero-cinematic.{mp4,webm} + poster
 *
 * Official SDK: @higgsfield/client — install before first run:
 *   npm install -D @higgsfield/client
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MARKETING = path.join(ROOT, 'public', 'marketing')
const OUT = path.join(MARKETING, 'video')

const CLIPS = [
  {
    slug: 'hero-cinematic',
    sourceImage: 'hero-void-background.png',
    prompt: [
      'Very slow cinematic ambient drift through pearl white void, translucent silver',
      'architecture planes breathing gently, sparse cyan luminous paths flowing like quiet',
      'data rivers, soft gold micro highlights, premium calm SaaS atmosphere, seamless loop',
      'feel, no text, no logos, no people, no sudden motion',
    ].join(' '),
  },
] as const

type Credentials = { apiKey: string; apiSecret: string }

function loadCredentials(): Credentials | null {
  const combined = process.env.HF_CREDENTIALS?.trim()
  if (combined?.includes(':')) {
    const [apiKey, ...rest] = combined.split(':')
    const apiSecret = rest.join(':')
    if (apiKey && apiSecret) return { apiKey, apiSecret }
  }

  const apiKey = process.env.HF_API_KEY?.trim()
  const apiSecret = process.env.HF_API_SECRET?.trim()
  if (apiKey && apiSecret) return { apiKey, apiSecret }

  const envLocal = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envLocal)) return null

  const vars: Record<string, string> = {}
  for (const line of fs.readFileSync(envLocal, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    vars[key] = val
  }

  if (vars.HF_CREDENTIALS?.includes(':')) {
    const [k, ...rest] = vars.HF_CREDENTIALS.split(':')
    if (k && rest.join(':')) return { apiKey: k, apiSecret: rest.join(':') }
  }
  if (vars.HF_API_KEY && vars.HF_API_SECRET) {
    return { apiKey: vars.HF_API_KEY, apiSecret: vars.HF_API_SECRET }
  }
  return null
}

function hasFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function run(cmd: string) {
  execSync(cmd, { stdio: 'inherit' })
}

async function download(url: string, dest: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`)
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

function optimizeVideo(raw: string, slug: string) {
  const mp4 = path.join(OUT, `${slug}.mp4`)
  const webm = path.join(OUT, `${slug}.webm`)

  if (!hasFfmpeg()) {
    fs.copyFileSync(raw, mp4)
    console.warn('ffmpeg not found — copied raw to mp4')
    return { mp4, webm: null as string | null }
  }

  run(
    `ffmpeg -y -i "${raw}" -an -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -movflags +faststart "${mp4}"`,
  )
  run(
    `ffmpeg -y -i "${raw}" -an -vf scale=1280:-2 -c:v libvpx-vp9 -crf 35 -b:v 0 "${webm}"`,
  )
  return { mp4, webm }
}

function posterFromVideo(video: string, slug: string) {
  const poster = path.join(OUT, `${slug}-poster.webp`)
  const png = path.join(OUT, `${slug}-poster-frame.png`)
  const fallback = path.join(MARKETING, 'hero-void-background.webp')

  if (hasFfmpeg() && fs.existsSync(video) && fs.statSync(video).size > 0) {
    try {
      execSync(`ffmpeg -y -i "${video}" -vframes 1 "${png}"`, { stdio: 'ignore' })
      run(`ffmpeg -y -i "${png}" -quality 82 "${poster}"`)
      fs.unlinkSync(png)
      return poster
    } catch {
      // fall through
    }
  }

  if (fs.existsSync(fallback)) {
    fs.copyFileSync(fallback, poster)
  }
  return poster
}

async function main() {
  const creds = loadCredentials()
  if (!creds) {
    console.error(
      'ERROR: Set HF_CREDENTIALS=KEY_ID:KEY_SECRET (or HF_API_KEY + HF_API_SECRET) in env or .env.local',
    )
    process.exit(1)
  }

  let HiggsfieldClient: typeof import('@higgsfield/client').HiggsfieldClient
  let InputImage: typeof import('@higgsfield/client/helpers').InputImage
  let DoPModel: typeof import('@higgsfield/client/helpers').DoPModel

  try {
    ;({ HiggsfieldClient } = await import('@higgsfield/client'))
    ;({ InputImage, DoPModel } = await import('@higgsfield/client/helpers'))
  } catch {
    console.error(
      'ERROR: Install @higgsfield/client first:\n  npm install -D @higgsfield/client',
    )
    process.exit(1)
  }

  process.env.HF_API_KEY = creds.apiKey
  process.env.HF_API_SECRET = creds.apiSecret

  const client = new HiggsfieldClient({
    apiKey: creds.apiKey,
    apiSecret: creds.apiSecret,
  })

  fs.mkdirSync(OUT, { recursive: true })

  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const clips = CLIPS.filter((c) => !only.length || only.includes(c.slug))

  const manifest: Array<Record<string, string | null>> = []

  for (const clip of clips) {
    console.log(`\n=== ${clip.slug} (Higgsfield DoP) ===`)
    const source = path.join(MARKETING, clip.sourceImage)
    if (!fs.existsSync(source)) {
      throw new Error(`Missing source image: ${source}`)
    }

    const imageUrl = await client.uploadImage(fs.readFileSync(source), 'png')
    console.log(`  uploaded ${clip.sourceImage}`)

    const jobSet = await client.generate(
      '/v1/image2video/dop',
      {
        model: DoPModel.TURBO,
        prompt: clip.prompt,
        input_images: [InputImage.fromUrl(imageUrl)],
      },
      { withPolling: true },
    )

    if (!jobSet.isCompleted) {
      throw new Error(`Generation failed for ${clip.slug}: ${jobSet.jobs[0]?.status}`)
    }

    const videoUrl = jobSet.jobs[0]?.results?.raw?.url
    if (!videoUrl) throw new Error(`No video URL in response for ${clip.slug}`)

    const raw = path.join(OUT, `${clip.slug}-raw.mp4`)
    await download(videoUrl, raw)
    const { mp4, webm } = optimizeVideo(raw, clip.slug)
    const poster = posterFromVideo(mp4, clip.slug)
    fs.unlinkSync(raw)

    const entry: Record<string, string | null> = {
      slug: clip.slug,
      mp4: path.basename(mp4),
      poster: path.basename(poster),
      provider: 'higgsfield',
      model: 'dop-turbo',
    }
    if (webm && fs.existsSync(webm)) entry.webm = path.basename(webm)
    manifest.push(entry)

    for (const f of [mp4, webm, poster]) {
      if (f && fs.existsSync(f)) {
        console.log(`  ${path.basename(f)} (${Math.round(fs.statSync(f).size / 1024)} KB)`)
      }
    }
  }

  fs.writeFileSync(
    path.join(OUT, 'higgsfield-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )
  console.log('\nDone. Wire hero-cinematic in HeroCinematicVideo.tsx')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
