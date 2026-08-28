#!/usr/bin/env python3
import json
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image

FRAME = 256
COLS = 8
QUALITY = 92
PADDING = 12

ROOT = Path(__file__).resolve().parents[1]
RESOURCE_ROOT = ROOT / "assets" / "art" / "resources"
ATLAS_PATH = RESOURCE_ROOT / "resource-atlas-256.webp"
META_PATH = RESOURCE_ROOT / "resource-atlas-256.json"

RESOURCES = (
    ("fungal", "food-resources", "fungal-shelf.png"),
    ("flora", "food-resources", "edible-flora.png"),
    ("herd", "food-resources", "grazing-herd.png"),
    ("nutrient", "food-resources", "nutrient-crop.png"),
    ("protein", "food-resources", "protein-bloom.png"),
    ("thermal", "food-resources", "thermal-algae.png"),
    ("synthetic", "food-resources", "synthetic-nutrient.png"),
    ("fiber", "build-resources", "construction-fibre.png"),
    ("stone", "build-resources", "stone.png"),
    ("clay", "build-resources", "clay.png"),
    ("silica", "build-resources", "silica.png"),
    ("limestone", "build-resources", "limestone.png"),
    ("structural", "build-resources", "structural-mineral.png"),
    ("ceramic", "build-resources", "advanced-ceramic-feedstock.png"),
    ("biomass", "fuel-resources", "biomass.png"),
    ("peat", "fuel-resources", "peat-bed.png"),
    ("coal", "fuel-resources", "coal-seam.png"),
    ("oil", "fuel-resources", "crude-oil.png"),
    ("gas", "fuel-resources", "natural-gas.png"),
    ("fissile", "fuel-resources", "fissile-mineral.png"),
    ("brine", "fuel-resources", "hydrogen-rich-brine.png"),
    ("exotic-fuel", "fuel-resources", "exotic-fuel-crystal.png"),
    ("surface-iron", "industrial-ores", "surface-iron-nodules.png"),
    ("iron", "industrial-ores", "iron-ore.png"),
    ("copper", "industrial-ores", "copper-ore.png"),
    ("reactive", "industrial-ores", "reactive-metal-ore.png"),
    ("conductive", "industrial-ores", "conductive-ore.png"),
    ("magnetic", "industrial-ores", "magnetic-ore.png"),
    ("exotic", "industrial-ores", "exotic-industrial-mineral.png"),
    ("advanced", "industrial-ores", "advanced-element-deposit.png"),
    ("silver", "precious-metals", "silver.png"),
    ("gold", "precious-metals", "gold.png"),
    ("gems", "precious-metals", "gemstone-deposit.png"),
    ("platinum", "precious-metals", "platinum.png"),
    ("palladium", "precious-metals", "palladium.png"),
    ("sapphire", "precious-metals", "sapphire.png"),
    ("ruby", "precious-metals", "ruby.png"),
    ("emerald", "precious-metals", "emerald.png"),
    ("diamond", "precious-metals", "diamond.png"),
    ("crystal", "precious-metals", "exotic-crystal.png"),
)


def source_path(category: str, filename: str) -> Path:
    for folder in ("Originals", "originals"):
        candidate = RESOURCE_ROOT / category / folder / filename
        if candidate.exists():
            return candidate
    return RESOURCE_ROOT / category / "Originals" / filename


def edge_background_colour(image: Image.Image):
    w, h = image.size
    px = image.load()
    samples = []
    step = max(1, min(w, h) // 64)

    for x in range(0, w, step):
        samples.append(px[x, 0][:3])
        samples.append(px[x, h - 1][:3])
    for y in range(0, h, step):
        samples.append(px[0, y][:3])
        samples.append(px[w - 1, y][:3])

    if not samples:
        return None

    bg = tuple(int(median(channel)) for channel in zip(*samples))
    if max(bg) > 72 or max(bg) - min(bg) > 30:
        return None
    return bg


def remove_dark_edge_background(image: Image.Image):
    """Remove only a dark neutral background connected to an outer edge.

    Existing alpha is preserved exactly. Opaque generated originals get a
    conservative one-time edge flood fill, which avoids the aggressive
    per-frame black-pixel filtering that degraded dark resource details.
    """
    image = image.convert("RGBA")
    alpha_min, _ = image.getchannel("A").getextrema()
    if alpha_min < 250:
        return image, False

    bg = edge_background_colour(image)
    if bg is None:
        return image, False

    w, h = image.size
    pixels = image.load()
    seen = bytearray(w * h)
    queue = deque()

    def background_like(x: int, y: int) -> bool:
        r, g, b, a = pixels[x, y]
        if a <= 8:
            return True
        if max(r, g, b) > 52 or max(r, g, b) - min(r, g, b) > 22:
            return False
        return max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2])) <= 32

    def push(x: int, y: int):
        idx = y * w + x
        if seen[idx] or not background_like(x, y):
            return
        seen[idx] = 1
        queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(1, h - 1):
        push(0, y)
        push(w - 1, y)

    removed = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        removed += 1
        if x:
            push(x - 1, y)
        if x + 1 < w:
            push(x + 1, y)
        if y:
            push(x, y - 1)
        if y + 1 < h:
            push(x, y + 1)

    return image, removed > 0


def prepare_frame(path: Path):
    image = Image.open(path).convert("RGBA")
    original_size = image.size
    image, cleared = remove_dark_edge_background(image)

    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        image = image.crop(bbox)

    max_size = FRAME - PADDING * 2
    scale = min(max_size / image.width, max_size / image.height)
    size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )

    if image.size != size:
        image = image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")

    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    frame.alpha_composite(image, ((FRAME - image.width) // 2, (FRAME - image.height) // 2))
    return frame, original_size, cleared


def main() -> None:
    rows = (len(RESOURCES) + COLS - 1) // COLS
    atlas = Image.new("RGBA", (FRAME * COLS, FRAME * rows), (0, 0, 0, 0))
    frames = {}

    for index, (resource_id, category, filename) in enumerate(RESOURCES):
        path = source_path(category, filename)
        if not path.exists():
            raise FileNotFoundError(f"Missing resource source: {path.relative_to(ROOT)}")

        frame, original_size, cleared = prepare_frame(path)
        col = index % COLS
        row = index // COLS
        x = col * FRAME
        y = row * FRAME
        atlas.alpha_composite(frame, (x, y))
        frames[resource_id] = {
            "x": x,
            "y": y,
            "w": FRAME,
            "h": FRAME,
            "source": str(path.relative_to(ROOT)),
        }
        print(
            f"{resource_id:>12}: {original_size[0]}x{original_size[1]}"
            f" -> {FRAME}x{FRAME} frame"
            f"{' • cleared dark edge background' if cleared else ''}"
        )

    ATLAS_PATH.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS_PATH, "WEBP", quality=QUALITY, method=6, exact=True)

    metadata = {
        "version": 1,
        "frameSize": FRAME,
        "columns": COLS,
        "rows": rows,
        "width": atlas.width,
        "height": atlas.height,
        "quality": QUALITY,
        "frames": frames,
    }
    META_PATH.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")

    print(
        f"built {ATLAS_PATH.relative_to(ROOT)} "
        f"({atlas.width}x{atlas.height}, {ATLAS_PATH.stat().st_size} bytes)"
    )
    print(f"wrote {META_PATH.relative_to(ROOT)} with {len(frames)} frames")


if __name__ == "__main__":
    main()
