#!/usr/bin/env python3
"""
Generate ACCESS homepage marketing loop videos via FAL (image-to-video).

Requires FAL_KEY in environment or access-app/.env.local.

Outputs: access-app/public/marketing/video/*.mp4 + *.webm + *-poster.webp + manifest.json

Post-processes with ffmpeg when available (target <5MB per clip).
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import fal_client
import httpx

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
MARKETING = ROOT / "public" / "marketing"
OUT = MARKETING / "video"
STILL_MODEL = "fal-ai/flux-pro"
I2V_MODEL = "fal-ai/minimax-video/image-to-video"
STILL_STEPS = 28

CLIPS = [
    {
        "slug": "hero-ambient",
        "source_image": "hero-void-background.png",
        "skip_still": True,
        "motion_prompt": (
            "Very slow subtle ambient drift, pearl white void with translucent silver planes "
            "breathing gently, sparse cyan luminous paths flowing like quiet rivers, soft "
            "cinematic parallax, calm premium SaaS atmosphere, seamless loop feel, no text, "
            "no logos, no people, no sudden motion"
        ),
    },
    {
        "slug": "how-home",
        "image_size": "landscape_16_9",
        "still_prompt": (
            "Premium calm software home dashboard UI mockup, pearl white background, navy "
            "typography blocks as abstract bars, soft card rows for next steps and saved notes, "
            "cyan accent highlight on one row, minimal chrome dots top left, editorial SaaS "
            "product screenshot aesthetic, generous whitespace, no readable text, no logos, "
            "no people, 16:9 landscape"
        ),
        "motion_prompt": (
            "Subtle UI motion: gentle highlight pulse on accent row, soft parallax on cards, "
            "calm product demo loop, no scrolling, no text changes, premium SaaS feel"
        ),
    },
    {
        "slug": "how-guide",
        "image_size": "landscape_16_9",
        "still_prompt": (
            "Premium chat guide interface mockup, pearl white background, conversation bubbles "
            "user right and guide left in soft cyan tint, minimal header bar, calm AI assistant "
            "product UI, no readable text, no logos, editorial SaaS screenshot, 16:9 landscape"
        ),
        "motion_prompt": (
            "Subtle chat UI motion: guide bubble gently fades in, soft typing indicator pulse, "
            "calm loop, no new messages, premium product demo"
        ),
    },
    {
        "slug": "how-plans",
        "image_size": "landscape_16_9",
        "still_prompt": (
            "Premium pricing plans UI mockup, three tier cards in a row, center card subtly "
            "featured with cyan border, pearl white background, navy price blocks as abstract "
            "shapes, calm SaaS plans screen, no readable text, no logos, 16:9 landscape"
        ),
        "motion_prompt": (
            "Subtle pricing UI motion: gentle glow on featured center tier, soft card lift, "
            "calm product loop, no price changes, premium SaaS demo"
        ),
    },
]


def load_fal_key() -> str | None:
    key = os.environ.get("FAL_KEY", "").strip()
    if key:
        return key
    env_local = ROOT / ".env.local"
    if not env_local.exists():
        return None
    for line in env_local.read_text().splitlines():
        line = line.strip()
        if line.startswith("FAL_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def download(url: str, dest: Path) -> None:
    with httpx.Client(follow_redirects=True, timeout=180) as client:
        dest.write_bytes(client.get(url).content)


def generate_still(slug: str, prompt: str, image_size: str) -> Path:
    print(f"  [still] {slug}")
    result = fal_client.run(
        STILL_MODEL,
        arguments={
            "prompt": prompt,
            "image_size": image_size,
            "num_inference_steps": STILL_STEPS,
            "num_images": 1,
            "guidance_scale": 3.5,
        },
    )
    images = result.get("images", [])
    if not images:
        raise RuntimeError(f"No still image: {result}")
    url = images[0]["url"] if isinstance(images[0], dict) else images[0]
    png = OUT / f"{slug}-source.png"
    download(url, png)
    return png


def upload_image(path: Path) -> str:
    return fal_client.upload_file(str(path))


def generate_i2v(slug: str, image_path: Path, motion_prompt: str) -> Path:
    print(f"  [i2v] {slug} ← {image_path.name}")
    image_url = upload_image(image_path)
    result = fal_client.run(
        I2V_MODEL,
        arguments={"image_url": image_url, "prompt": motion_prompt},
    )
    video_url = (result.get("video") or {}).get("url") or result.get("video_url")
    if not video_url:
        raise RuntimeError(f"No video URL: {result}")
    raw = OUT / f"{slug}-raw.mp4"
    download(video_url, raw)
    return raw


def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def optimize_video(raw: Path, slug: str) -> tuple[Path, Path | None]:
    mp4 = OUT / f"{slug}.mp4"
    webm = OUT / f"{slug}.webm"

    if not ffmpeg_available():
        shutil.copy(raw, mp4)
        print("  (skip transcode — ffmpeg not found)")
        return mp4, None

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw),
            "-an",
            "-vf",
            "scale=1280:-2",
            "-c:v",
            "libx264",
            "-crf",
            "28",
            "-preset",
            "slow",
            "-movflags",
            "+faststart",
            str(mp4),
        ],
        check=True,
        capture_output=True,
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw),
            "-an",
            "-vf",
            "scale=1280:-2",
            "-c:v",
            "libvpx-vp9",
            "-crf",
            "35",
            "-b:v",
            "0",
            str(webm),
        ],
        check=True,
        capture_output=True,
    )

    return mp4, webm


def poster_from_video(video: Path, slug: str) -> Path:
    poster = OUT / f"{slug}-poster.webp"
    png = OUT / f"{slug}-poster-frame.png"

    if ffmpeg_available() and video.exists() and video.stat().st_size > 0:
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", str(video), "-vframes", "1", str(png)],
            capture_output=True,
        )
        if result.returncode == 0 and png.exists() and png.stat().st_size > 0:
            if Image is not None:
                Image.open(png).convert("RGB").save(poster, "WEBP", quality=85, method=6)
                png.unlink(missing_ok=True)
                return poster
            webp_fallback = poster.with_suffix(".png")
            shutil.copy(png, webp_fallback)
            return webp_fallback

    # fallback: reuse marketing still
    slug_map = {
        "hero-ambient": "hero-void-background.webp",
        "how-home": "hero-void-background.webp",
        "how-guide": "hero-void-background.webp",
        "how-plans": "hero-void-background.webp",
    }
    fallback = MARKETING / slug_map.get(slug, "hero-void-background.webp")
    if fallback.exists():
        shutil.copy(fallback, poster)
    return poster


def main() -> int:
    key = load_fal_key()
    if not key:
        print("ERROR: Set FAL_KEY in environment or access-app/.env.local", file=sys.stderr)
        return 1
    os.environ["FAL_KEY"] = key

    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    clips = [c for c in CLIPS if not only or c["slug"] in only]

    OUT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []

    for clip in clips:
        slug = clip["slug"]
        print(f"\n=== {slug} ===")

        if clip.get("skip_still"):
            source = MARKETING / clip["source_image"]
            if not source.exists():
                raise FileNotFoundError(f"Missing source image: {source}")
        else:
            source = generate_still(slug, clip["still_prompt"], clip["image_size"])

        raw = generate_i2v(slug, source, clip["motion_prompt"])
        mp4, webm = optimize_video(raw, slug)
        poster = poster_from_video(mp4, slug)
        raw.unlink(missing_ok=True)

        entry = {
            "slug": slug,
            "mp4": mp4.name,
            "poster": poster.name,
            "model_still": None if clip.get("skip_still") else STILL_MODEL,
            "model_video": I2V_MODEL,
        }
        if webm and webm.exists():
            entry["webm"] = webm.name
        manifest.append(entry)

        for f in (mp4, webm, poster):
            if f and Path(f).exists():
                print(f"  {Path(f).name} ({Path(f).stat().st_size // 1024} KB)")

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("\nDone. Wire clips in MarketingLoopVideo / MarketingHowItWorks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
