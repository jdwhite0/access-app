#!/usr/bin/env python3
"""
Generate ACCESS homepage marketing hero images via FAL (flux-pro).

Requires: FAL_KEY in environment (or access-app/.env.local — not read automatically;
export manually: export FAL_KEY=$(grep FAL_KEY access-app/.env.local | cut -d= -f2))

Outputs: access-app/public/marketing/*.png + *.webp + manifest.json
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import fal_client
import httpx

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "marketing"

PROMPTS = [
    {
        "slug": "hero-intelligence-infrastructure",
        "size": "portrait_16_9",
        "model": "fal-ai/flux-pro",
        "steps": 28,
        "prompt": (
            "Premium 3D digital illustration for enterprise software homepage hero, "
            "abstract concept intelligence becoming calm infrastructure. Volumetric white pearl "
            "glass planes folding into deep navy structural core, thin cyan intelligence flow "
            "lines tracing paths between translucent silver layers, restrained soft gold accent "
            "glints. Expansive pearl void atmosphere, soft studio rim light, depth of field, "
            "dimensional flowing geometry. NOT a brain, NOT cyberpunk neon, NOT robot, NOT orb "
            "in a card UI, NOT generic AI clipart. Editorial luxury tech aesthetic, Octane-style "
            "render, generous negative space on left for marketing copy, vertical portrait "
            "composition, ultra clean, no text, no logos, no people."
        ),
    },
    {
        "slug": "hero-void-background",
        "size": "landscape_16_9",
        "model": "fal-ai/flux-pro",
        "steps": 28,
        "prompt": (
            "Abstract full-bleed background for premium SaaS homepage, pearl white void fading "
            "to cool gray haze, distant flowing translucent architecture planes in silver and "
            "white, navy depth at center-bottom, sparse cyan luminous paths like quiet data "
            "rivers, micro gold highlights. Soft cinematic lighting, shallow depth, widescreen "
            "16:9, serene infrastructural mood, no characters, no logos, no text, no cyberpunk, "
            "no brain imagery, no UI mockup."
        ),
    },
]


def to_webp(png: Path) -> Path:
    if Image is None:
        print("  (skip webp — install Pillow: pip install Pillow)")
        return png
    webp = png.with_suffix(".webp")
    img = Image.open(png).convert("RGB")
    img.save(webp, "WEBP", quality=88, method=6)
    return webp


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


def main() -> int:
    key = load_fal_key()
    if not key:
        print("ERROR: Set FAL_KEY in environment or access-app/.env.local", file=sys.stderr)
        return 1
    os.environ["FAL_KEY"] = key

    OUT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []

    for item in PROMPTS:
        print(f"\n=== {item['slug']} ===")
        result = fal_client.run(
            item["model"],
            arguments={
                "prompt": item["prompt"],
                "image_size": item["size"],
                "num_inference_steps": item["steps"],
                "num_images": 1,
                "guidance_scale": 3.5,
            },
        )
        images = result.get("images", [])
        if not images:
            raise RuntimeError(f"No images: {result}")

        url = images[0]["url"] if isinstance(images[0], dict) else images[0]
        png = OUT / f"{item['slug']}.png"
        with httpx.Client(follow_redirects=True, timeout=120) as client:
            png.write_bytes(client.get(url).content)
        webp = to_webp(png)
        print(f"  {png.name} ({png.stat().st_size} bytes)")
        if webp.suffix == ".webp":
            print(f"  {webp.name} ({webp.stat().st_size} bytes)")

        manifest.append(
            {
                "slug": item["slug"],
                "png": png.name,
                "webp": webp.name,
                "model": item["model"],
                "image_size": item["size"],
            }
        )

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("\nDone. Wire hero-intelligence-infrastructure.webp in HeroIntelligenceArtwork.tsx")
    return 0


if __name__ == "__main__":
    sys.exit(main())
