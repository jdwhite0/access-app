"""
Build work-with-me-header.gif:
  - Extract frames from FAL-generated MP4
  - Crop to 560×200 banner
  - Composite blue banner + JDWHITE.WORLD + WORK WITH ME text
  - Export as optimized GIF
"""

import subprocess, os, sys
from PIL import Image, ImageDraw, ImageFont

SRC      = "wm-raw.mp4"
OUT      = "work-with-me-header.gif"
W, H     = 560, 200
FPS      = 5
BLUE     = (123, 156, 255)          # #7B9CFF
BANNER_H = 52

FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"

def extract_frames(src, w, h, fps):
    """Extract frames via ffmpeg, scaled and cropped."""
    tmp = "/tmp/wm_frames"
    os.makedirs(tmp, exist_ok=True)
    # Scale to 560×560, then crop center 200px band
    subprocess.run([
        "ffmpeg", "-y", "-i", src,
        "-vf", f"scale={w}:{w},crop={w}:{h}:0:{(w-h)//2},fps={fps}",
        f"{tmp}/frame%03d.png"
    ], check=True, capture_output=True)
    frames = sorted(f"{tmp}/{f}" for f in os.listdir(tmp) if f.endswith(".png"))
    return [Image.open(f).convert("RGBA") for f in frames]

def composite_overlay(frame: Image.Image) -> Image.Image:
    img = frame.copy()
    draw = ImageDraw.Draw(img)

    # ── Blue banner at bottom ──────────────────────────────────────
    banner_y = H - BANNER_H
    banner_rect = [(0, banner_y), (W, H)]

    # Semi-transparent overlay using alpha composite
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle(banner_rect, fill=(*BLUE, 225))
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    # ── WORK WITH ME — bold, centered in banner ───────────────────
    try:
        font_main = ImageFont.truetype(FONT_PATH, 13, index=4)  # Helvetica Neue Bold
    except Exception:
        font_main = ImageFont.load_default()

    text_main = "WORK  WITH  ME"
    bb = draw.textbbox((0, 0), text_main, font=font_main)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    tx = (W - tw) // 2
    ty = banner_y + (BANNER_H - th) // 2 - 1
    draw.text((tx, ty), text_main, font=font_main, fill=(255, 255, 255, 255))

    # ── JDWHITE.WORLD — small, top-left ───────────────────────────
    try:
        font_small = ImageFont.truetype(FONT_PATH, 9, index=4)
    except Exception:
        font_small = ImageFont.load_default()

    draw.text((14, 12), "JDWHITE.WORLD", font=font_small, fill=(255, 255, 255, 130))

    return img.convert("RGB")

def build_gif(frames, out, fps):
    rgb = [composite_overlay(f) for f in frames]
    duration_ms = int(1000 / fps)
    rgb[0].save(
        out,
        save_all=True,
        append_images=rgb[1:],
        loop=0,
        duration=duration_ms,
        optimize=True,
    )
    size_kb = os.path.getsize(out) // 1024
    print(f"Saved {out}  ({len(rgb)} frames, {size_kb}KB)")

if __name__ == "__main__":
    import glob

    # Extract frames as PNG via ffmpeg first (better quality than Pillow's decoder)
    TMP = "/tmp/wm_frames"
    os.makedirs(TMP, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", SRC,
        "-vf", f"scale={W}:{W},crop={W}:{H}:0:{(W-H)//2},fps={FPS}",
        f"{TMP}/frame%03d.png"
    ], check=True, capture_output=True)

    pngs = sorted(glob.glob(f"{TMP}/frame*.png"))
    print(f"Extracted {len(pngs)} frames")

    # Add text overlay to each frame, save back to tmp
    TEXT_TMP = "/tmp/wm_text_frames"
    os.makedirs(TEXT_TMP, exist_ok=True)
    for i, p in enumerate(pngs):
        frame = Image.open(p).convert("RGBA")
        composited = composite_overlay(frame)
        composited.save(f"{TEXT_TMP}/frame{i:03d}.png")
    print(f"Composited overlays on {len(pngs)} frames")

    # Re-encode to optimized GIF via ffmpeg palette pass
    subprocess.run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", f"{TEXT_TMP}/frame%03d.png",
        "-vf", "palettegen=stats_mode=diff:max_colors=64",
        "-frames:v", "1", f"{TMP}/palette.png"
    ], check=True, capture_output=True)

    subprocess.run([
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", f"{TEXT_TMP}/frame%03d.png",
        "-i", f"{TMP}/palette.png",
        "-lavfi", "[0:v][1:v]paletteuse=dither=bayer:bayer_scale=3",
        "-loop", "0",
        OUT
    ], check=True, capture_output=True)

    size_kb = os.path.getsize(OUT) // 1024
    print(f"Saved {OUT}  ({len(pngs)} frames, {size_kb}KB)")
