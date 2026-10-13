"""Generate a labelled, illustrated crop-field image dataset (synthetic, drawn procedurally).
Classes map to yield bands from the CSV:
  low (<7), medium (7-9), high (9-11), very_high (>11)  -- yield in the dataset's units
"""
import random, math, os, csv
from PIL import Image, ImageDraw, ImageFilter

OUT = "/home/claude/crop-yield-app/public/dataset"
W, H = 480, 320
random.seed(7)

CLASSES = {
    # density, height, leaf colour palette, soil, sky
    "low":       dict(rows=7,  h=(14, 30), leaf=[(150, 140, 70), (170, 150, 80), (130, 120, 60)], soil=(150, 115, 80), sky=((235, 200, 150), (250, 235, 200)), gap=0.45),
    "medium":    dict(rows=9,  h=(26, 46), leaf=[(120, 160, 60), (140, 170, 70), (105, 145, 55)], soil=(130, 100, 70), sky=((150, 195, 235), (225, 240, 250)), gap=0.2),
    "high":      dict(rows=11, h=(40, 64), leaf=[(70, 150, 60), (85, 165, 70), (60, 135, 55)], soil=(110, 85, 62), sky=((120, 180, 240), (215, 238, 252)), gap=0.07),
    "very_high": dict(rows=13, h=(56, 86), leaf=[(35, 130, 55), (50, 150, 65), (30, 115, 50)], soil=(95, 72, 54), sky=((90, 165, 245), (205, 235, 253)), gap=0.0),
}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def jitter(c, d=14):
    return tuple(max(0, min(255, v + random.randint(-d, d))) for v in c)


def plant(draw, x, y, h, cfg, scale):
    col = random.choice(cfg["leaf"])
    stem = (int(col[0] * .7), int(col[1] * .75), int(col[2] * .6))
    draw.line([(x, y), (x, y - h)], fill=stem, width=max(1, int(2 * scale)))
    n = max(3, int(h / 9))
    for i in range(n):
        ly = y - h * (i + 1) / (n + 1)
        side = 1 if i % 2 == 0 else -1
        ln = h * 0.45 * (1 - i / (n * 1.6))
        pts = [(x, ly), (x + side * ln * .6, ly - ln * .35), (x + side * ln, ly - ln * .1), (x + side * ln * .55, ly + ln * .05)]
        draw.polygon(pts, fill=jitter(col, 10))
    # grain head for taller / healthier plants
    if h > 50 * scale:
        draw.ellipse([x - 3 * scale, y - h - 8 * scale, x + 3 * scale, y - h + 6 * scale], fill=(214, 178, 70))


def make(label, idx):
    cfg = CLASSES[label]
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    horizon = random.randint(100, 135)
    top, bot = cfg["sky"]
    for y in range(horizon):
        d.line([(0, y), (W, y)], fill=lerp(top, bot, y / horizon))
    # sun / cloud
    sx = random.randint(60, W - 60)
    d.ellipse([sx - 22, 22, sx + 22, 66], fill=(255, 245, 190))
    for _ in range(random.randint(1, 3)):
        cx, cy = random.randint(40, W - 40), random.randint(20, 70)
        for k in range(4):
            d.ellipse([cx + k * 18 - 22, cy - 9, cx + k * 18 + 6, cy + 11], fill=(255, 255, 255))
    # distant tree line
    for x in range(0, W, 14):
        th = random.randint(10, 22)
        d.ellipse([x - 12, horizon - th, x + 14, horizon + 6], fill=(60, 100, 70))
    # soil
    for y in range(horizon, H):
        t = (y - horizon) / (H - horizon)
        d.line([(0, y), (W, y)], fill=jitter(lerp(cfg["soil"], tuple(int(c * .8) for c in cfg["soil"]), t), 4))
    # perspective crop rows (back to front)
    rows = cfg["rows"]
    for r in range(rows):
        t = r / (rows - 1)
        y = horizon + 12 + (H - horizon - 10) * (t ** 1.5)
        scale = 0.35 + 1.15 * t
        spacing = 16 + 34 * t
        x = random.randint(0, int(spacing))
        while x < W + spacing:
            if random.random() > cfg["gap"]:
                h = random.uniform(*cfg["h"]) * scale
                plant(d, x + random.randint(-3, 3), y + random.randint(-2, 2), h, cfg, scale)
            x += spacing
    # weeds / dry patches for low yield
    if label == "low":
        for _ in range(40):
            x, y = random.randint(0, W), random.randint(horizon + 20, H)
            d.ellipse([x, y, x + random.randint(6, 14), y + random.randint(3, 6)], fill=(120, 105, 70))
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    name = f"{label}_{idx:02d}.png"
    img.save(os.path.join(OUT, label, name), optimize=True)
    return name


if __name__ == "__main__":
    PER = 12
    rows = []
    bands = {"low": "<7", "medium": "7-9", "high": "9-11", "very_high": ">11"}
    for label in CLASSES:
        os.makedirs(os.path.join(OUT, label), exist_ok=True)
        for i in range(1, PER + 1):
            rows.append((f"{label}/{make(label, i)}", label, bands[label]))
    with open(os.path.join(OUT, "labels.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["file", "class", "yield_band"])
        w.writerows(rows)
    print(len(rows), "images")
