# Brand Assets — KGP Bazaar

## Master

`kgp-bazaar-logo-1024.png` — 1024×1024 RGBA, transparent rounded corners.
A white shopping bag with a blue check badge on a royal-blue gradient.

Sampled gradient: `#4787F9` (top-left) → `#346BEE` (bottom-right).

## Generated files (all in `public/`)

| File | Size | Purpose |
|---|---|---|
| `pwa-192x192.png` | 192 | Manifest icon, `purpose: any` |
| `pwa-512x512.png` | 512 | Manifest icon, `purpose: any`, splash screen |
| `pwa-maskable-192x192.png` | 192 | Manifest icon, `purpose: maskable` |
| `pwa-maskable-512x512.png` | 512 | Manifest icon, `purpose: maskable` |
| `apple-touch-icon.png` | 180 | iOS home screen. Flattened — **must not** have transparency or iOS renders black corners |
| `favicon.svg` | vector | Primary favicon, hand-authored to match the raster mark |
| `favicon.ico` | 16–256 | Legacy/Windows fallback |
| `favicon-16x16.png`, `-32x32`, `-48x48` | — | Explicit PNG fallbacks |
| `masked-icon.svg` | vector | Safari pinned tab. Single flat black path; Safari recolours it |
| `og-image.png` | 1200×630 | WhatsApp / Twitter link previews |

## Maskable safe zone

Android masks icons to a circle, squircle, or rounded square. Only the middle **80%**
(a circle of radius `0.4 × size`) is guaranteed visible.

The maskable variants place the logo at **88% scale on a full-bleed gradient** so the
corners are filled and nothing clips. Verified: furthest point of the bag artwork sits
**180.6px** from centre on the 512 icon, inside the **204.8px** safe radius.

Do not regenerate maskables by simply resizing the master — its transparent rounded
corners would leave gaps that Android fills with white or black.

## Regenerating

Requires Python + Pillow (`pip install pillow`).

```python
from PIL import Image
src = Image.open('docs/brand/kgp-bazaar-logo-1024.png').convert('RGBA')
c0, c1 = (71, 135, 249), (52, 107, 238)

def gradient(size, a, b):
    img = Image.new('RGB', (size, size)); p = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            p[x, y] = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
    return img.convert('RGBA')

# "any" icons keep the rounded-square silhouette
for s in (192, 512):
    src.resize((s, s), Image.LANCZOS).save(f'public/pwa-{s}x{s}.png')

# maskable: full-bleed background, logo at 88%
for s in (192, 512):
    bg = gradient(s, c0, c1); inner = int(s * 0.88)
    bg.alpha_composite(src.resize((inner, inner), Image.LANCZOS), ((s-inner)//2,)*2)
    bg.convert('RGB').save(f'public/pwa-maskable-{s}x{s}.png')

# apple-touch-icon: flattened, no alpha
ab = gradient(180, c0, c1)
ab.alpha_composite(src.resize((180, 180), Image.LANCZOS))
ab.convert('RGB').save('public/apple-touch-icon.png')
```

## Known brand inconsistency — decide before launch

The logo's blue is **royal blue `#4787F9`**. The app's design tokens and
`theme_color` are **sky blue `#0284C7`** (see `.agents/rules/react-conventions.md`).

Side by side they read as two different brands — the Android splash screen and the
address-bar tint will be sky blue while the icon is royal blue.

Three ways out, pick one:

1. **Recolour the logo to `#0284C7`** — keeps the whole design system as specced. One
   image edit, nothing else changes. *(Recommended.)*
2. **Change the design tokens to the logo's royal blue** — touches
   `react-conventions.md`, `tailwind.config.ts`, `theme_color` in `vite.config.ts` and
   `index.html`, and every spec reference to `#0284C7`.
3. **Leave it** — accept that the icon doesn't match the app chrome.

Until this is decided, `theme_color` stays `#0284c7` to match the built UI.
