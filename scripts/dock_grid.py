#!/usr/bin/env python3
"""The dock icon grid, measured and enforced.

Every Apple icon in workspace/assets sits on the macOS icon grid: on a 256
canvas the body is a 205px squircle (or circle) at (25,25), with Apple's own
soft shadow around it. Two third-party icons filled the whole canvas, so at
dock size their top edges sat 5px above every neighbour and read as raised.

    python3 scripts/dock_grid.py            measure every dock icon, exit 1 if any is off the grid
    python3 scripts/dock_grid.py --bake     fit the named full-bleed icons to the grid, then measure
    python3 scripts/dock_grid.py --sheet out.png   also write a contact sheet at dock size

The shadow silhouettes are taken from Apple's own files (terminal.png for a
squircle, chrome.png for a circle), so a baked icon carries the same shadow
as the icons beside it rather than an approximation of one.
"""
import sys, os
from PIL import Image, ImageDraw

ASSETS = 'workspace/assets'
DOCK = ['finder', 'notes', 'messages', 'chrome', 'spotify', 'claude', 'chatgpt', 'hermes', 'activity', 'terminal', 'settings']
GRID = (0.78, 0.85)          # visible extent of the canvas, shadow included; Apple's own files measure 0.824-0.840
BODY = (25, 25, 231, 231)    # the body box on a 256 canvas, measured off terminal.png (alpha 255 from 26 to 229, AA row at 25)

def extent(path):
    im = Image.open(path).convert('RGBA'); w, h = im.size
    a = im.getchannel('A').point(lambda v: 255 if v > 8 else 0)
    x0, y0, x1, y1 = a.getbbox()
    return (x1 - x0) / w, (y1 - y0) / h, (x0, y0, x1, y1)

def silhouette(name):
    """Apple's alpha for the shape, shadow and all, as a black layer."""
    a = Image.open(f'{ASSETS}/{name}.png').convert('RGBA').getchannel('A')
    layer = Image.new('RGBA', a.size, (0, 0, 0, 255)); layer.putalpha(a)
    return layer, a

def squircle_mask(alpha):
    """The body of the Apple tile: its own alpha with the shadow removed."""
    return alpha.point(lambda v: v if v >= 30 else 0)

def circle_mask(size=256, cx=128, cy=128, r=102.5, ss=4):
    big = Image.new('L', (size * ss, size * ss), 0)
    ImageDraw.Draw(big).ellipse(((cx - r) * ss, (cy - r) * ss, (cx + r) * ss, (cy + r) * ss), fill=255)
    return big.resize((size, size), Image.LANCZOS)

def fit(art, mask, shadow):
    """art: RGBA already scaled to the body box. Composite over the shadow, masked to the body."""
    from PIL import ImageChops
    out = shadow.copy()
    layer = Image.new('RGBA', out.size, (0, 0, 0, 0))
    layer.paste(art, (BODY[0], BODY[1]))
    layer.putalpha(ImageChops.darker(layer.getchannel('A'), mask))
    out.alpha_composite(layer)
    return out

def bake_spotify():
    """The green disk out of its white tile, on Chrome's circle and shadow."""
    src = Image.open(f'{ASSETS}/spotify.png').convert('RGBA')
    disk = src.crop((4, 4, 252, 252)).resize((206, 206), Image.LANCZOS)   # disk bbox measured 4..251
    disk.putalpha(255)
    shadow, _ = silhouette('chrome')
    return fit(disk, circle_mask(), shadow)

def bake_hermes():
    """The Nous tile, frame and all, fitted to the squircle and Apple's shadow."""
    src = Image.open(f'{ASSETS}/hermes.png').convert('RGBA').resize((206, 206), Image.LANCZOS)
    shadow, alpha = silhouette('terminal')
    return fit(src, squircle_mask(alpha), shadow)

def main():
    args = sys.argv[1:]
    if '--bake' in args:
        for name, fn in (('spotify', bake_spotify), ('hermes', bake_hermes)):
            ew, eh, _ = extent(f'{ASSETS}/{name}.png')
            if ew > GRID[1] or eh > GRID[1]:
                fn().save(f'{ASSETS}/{name}.png'); print(f'baked {name}.png onto the grid')
            else:
                print(f'{name}.png already on the grid ({ew:.3f}), left alone')
    bad = []
    for name in DOCK:
        ew, eh, bbox = extent(f'{ASSETS}/{name}.png')
        ok = GRID[0] <= ew <= GRID[1] and GRID[0] <= eh <= GRID[1]
        if not ok: bad.append(name)
        print(f'{"  " if ok else "!!"} {name:10s} extent {ew:.3f} x {eh:.3f}  bbox {bbox}')
    if '--sheet' in args:
        out = args[args.index('--sheet') + 1]
        sheet = Image.new('RGBA', (len(DOCK) * 66 + 12, 90), (120, 124, 132, 255)); d = ImageDraw.Draw(sheet)
        for k, name in enumerate(DOCK):
            sheet.alpha_composite(Image.open(f'{ASSETS}/{name}.png').convert('RGBA').resize((52, 52), Image.LANCZOS), (6 + k * 66, 19))
        d.line([(0, 19 + 5), (sheet.width, 19 + 5)], fill=(255, 80, 80, 200)); d.line([(0, 71 - 5), (sheet.width, 71 - 5)], fill=(255, 80, 80, 200))
        sheet.save(out); print('sheet', out)
    print(f'{len(DOCK) - len(bad)} of {len(DOCK)} dock icons on the grid' + (f'; OFF: {", ".join(bad)}' if bad else ''))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
