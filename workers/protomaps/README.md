# Basemap tiles — self-hosted, vector, free

The map's basemap used to be raster tiles from CARTO's free CDN. This is a
real vector basemap instead: a Guyana-only slice of
[Protomaps](https://protomaps.com)' open, self-hostable OSM-derived tiles,
served as a static file from each app's own `public/` — no account, no API
key, no per-tile cost, and it looks like a real map instead of a CDN
placeholder. `FleetMap.tsx` reads it via the `pmtiles://` protocol and styles
it with `@protomaps/basemaps`' own dark theme.

## One-time setup (already done for this checkout)

The extract tool is a Go binary with no Node/npm distribution, downloaded
once rather than built:

```bash
mkdir -p workers/protomaps-tool
cd workers/protomaps-tool
curl -sL -o go-pmtiles.zip \
  https://github.com/protomaps/go-pmtiles/releases/download/v1.31.2/go-pmtiles_1.31.2_Windows_x86_64.zip
unzip -o go-pmtiles.zip   # → pmtiles.exe (Linux/Mac: the .tar.gz build for your platform)
```

Protomaps publishes a monthly build of the whole planet at
`https://build.protomaps.com/YYYYMMDD.pmtiles` (first of the month; check
which date exists before running this). `extract` pulls only Guyana's
bounding box out of that REMOTE file via HTTP range requests — it never
downloads the planet:

```bash
./workers/protomaps-tool/pmtiles.exe extract \
  "https://build.protomaps.com/20260801.pmtiles" \
  apps/ops/public/tiles/guyana.pmtiles \
  --bbox=-61.6,0.9,-56.3,8.8

cp apps/ops/public/tiles/guyana.pmtiles apps/buyer/public/tiles/guyana.pmtiles
```

Both apps get their own copy — each is a separate static build serving its
own `public/`, so there's no way to share one file between them at runtime.
`apps/*/public/tiles/` and `workers/protomaps-tool/` are both gitignored:
regenerate with the commands above rather than committing a ~78 MB binary.

## Why Protomaps' own theme, not a hand-tuned one

`@protomaps/basemaps`' `layers()` takes a `Flavor` — water, roads, park
fill, label halos, around 70 colour slots in total — and `DARK` is
Protomaps' own validated dark palette. Deriving all 70 from this product's
2–3 brand tokens would be mostly guessing at values nobody has actually
looked at; reusing a maintained, professionally-designed theme beats that,
the same call the dataviz guidance makes for "sequential is the safe
default" over inventing a palette by hand.

## What happens if the file is missing or stale

`FleetMap` doesn't check for it — a missing `guyana.pmtiles` is a 404 the
`pmtiles://` protocol surfaces as failed tile requests, same as any other
broken tile source. Nothing else on the page depends on it loading.
