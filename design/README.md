# Źródła grafik

Edytowalne źródła dla wygenerowanych obrazów w `public/`. Bez tego pliki
PNG w `public/` były jedynym zapisem tych grafik w repo — każda przyszła
zmiana (np. inne liczby w przykładzie na og-image) wymagałaby odtwarzania
layoutu od zera zamiast edycji istniejącego SVG.

- `og-image.svg` → `public/og-image.png` (1200×630, og:image / twitter:image)
- `icon.svg` → `public/icon-192.png` i `public/icon-512.png` (manifest PWA)

## Regeneracja po edycji SVG

Wymaga `rsvg-convert` (macOS: `brew install librsvg`).

```bash
rsvg-convert -w 1200 -h 630 --background-color=white design/og-image.svg -o public/og-image.png
rsvg-convert -w 512 -h 512 design/icon.svg -o public/icon-512.png
rsvg-convert -w 192 -h 192 design/icon.svg -o public/icon-192.png
```

Uwaga: `rsvg-convert` nie renderuje kolorowych emoji (fallback na czarną
sylwetkę) — dlatego oba pliki używają wektorowych kształtów/tekstu zamiast
emoji, w przeciwieństwie do `public/favicon.svg`, który realne przeglądarki
renderują poprawnie.
