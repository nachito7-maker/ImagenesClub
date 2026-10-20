#!/usr/bin/env python3
"""Create Android launcher icons from the official logo artwork.

Outputs, per density (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi):
  ic_launcher.png / ic_launcher_round.png   legacy fallback (logo on dark square)
  ic_launcher_foreground.png                adaptive-icon foreground: transparent
                                            108dp canvas, wordmark inside the 72dp
                                            visible circle / 66dp safe zone

The artwork (logo-ui.png) is white + alpha, so compositing it over the game's
dark brand colour reproduces exactly the menu treatment: white logo on near-black.
Adaptive icons (API 26+, this app's minSdk) use mipmap-anydpi-v26/ic_launcher.xml
with a solid dark background layer, so the launcher never adds a white backing.
"""
from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / 'public' / 'assets' / 'references' / 'logo-ui.png'
assert src.exists(), f'Artwork not found: {src}'

logo = Image.open(src).convert('RGBA')
bbox = logo.split()[3].getbbox()
assert bbox, 'Logo has no visible pixels'
logo = logo.crop(bbox)

BACKGROUND = (12, 14, 20, 255)  # #0c0e14, same as the window background
DENSITIES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
LEGACY_FILL = 0.80   # logo width relative to the legacy square icon
FG_CANVAS_DP = 108   # adaptive-icon layer canvas
FG_WIDTH_DP = 56     # wordmark width: fits the 72dp visible circle incl. diagonal
DENSITY_SCALE = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}

res = root / 'android' / 'app' / 'src' / 'main' / 'res'
for name, size in DENSITIES.items():
    # --- legacy square icon (fallback) ---
    canvas = Image.new('RGBA', (size, size), BACKGROUND)
    target = int(size * LEGACY_FILL)
    scaled = logo.resize((target, max(1, round(logo.height * target / logo.width))), Image.LANCZOS)
    canvas.alpha_composite(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2))
    out = res / f'mipmap-{name}'
    canvas.save(out / 'ic_launcher.png', optimize=True)
    canvas.save(out / 'ic_launcher_round.png', optimize=True)

    # --- adaptive foreground: 108dp transparent canvas, wordmark centred ---
    density = DENSITY_SCALE[name]
    fg_px = round(FG_CANVAS_DP * density)
    fg = Image.new('RGBA', (fg_px, fg_px), (0, 0, 0, 0))
    w_px = round(FG_WIDTH_DP * density)
    h_px = max(1, round(logo.height * w_px / logo.width))
    fg_logo = logo.resize((w_px, h_px), Image.LANCZOS)
    fg.alpha_composite(fg_logo, ((fg_px - w_px) // 2, (fg_px - h_px) // 2))
    fg.save(out / 'ic_launcher_foreground.png', optimize=True)
    print(f'{name}: legacy {size}x{size}, foreground {fg_px}x{fg_px} (logo {w_px}x{h_px})')

print('Generated ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png per density')
