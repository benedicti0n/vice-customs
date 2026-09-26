# 13 — Testing & Verification

## Mandatory Commands

```bash
npm run lint
npm run build
```

Both must pass before any commit.

## Regression Flow

The full judge flow is verified headlessly with `scripts/flow.mjs` (puppeteer-core against a production `next start`):

```text
boot
→ garage
→ vehicle select
→ paint booth (editor loads)
→ draw a stroke
→ save
→ reveal
→ analysis
→ street run
→ final build card
→ customize again (editor re-initializes)
```

The script asserts each step, captures console errors and page errors, and fails if any appear. It also reads back real analysis numbers (e.g. `style / rep / heat`) to prove the stats came from the artwork.

## Hydration / Console Checks

The same harness listens for `console.error` and `pageerror` across the whole run — including the second editor session — and reports any hydration warnings or runtime failures. A clean run reports `errors: []`.

## Scene Audit

`scripts/audit.mjs` walks every scene, screenshots it, and (used with the ASCII renderers) lets a reviewer inspect the actual pixels: boot, garage, selector, editor, reveal (early + late), analysis, street, complete.

## V2 Capture Flow

`scripts/screenshot-v2.ts` drives the real V2 journey headlessly (Playwright, Chrome, 1600×900):

```text
01 boot → 02 3D garage → 03/04 selector (platforms) → 05 booth painted
→ 06 booth decals → 07 reveal applying → 08 reveal car
→ 09 analysis → 10 street run (drives with W/A) → 11 build card
```

It draws real brush strokes, places decals by pointer events, applies the livery, and reports every console/page error. The V2 flow captures with **zero console errors**.

## Screenshot Capture

`scripts/screenshot.ts` (Playwright, `channel: "chrome"`) captures all 12 key frames into `screenshots/` for human review: boot, garage, all three vehicle previews, the paint booth (blank + with a drawn design), reveal (applying + revealed), analysis, street run, and the final build card. A `screenshots/README.md` maps each file to its scene. The folder is generated output and gitignored.

```bash
npx tsx scripts/screenshot.ts
```

Requires Playwright (`npm install`) and Chrome at the default macOS path.

## Deterministic Analysis Test

`scripts/test-analysis.ts` (runs the real `analyzeLivery` against generated canvases) verifies:

- **Determinism** — the same image twice yields identical JSON output
- **Colorful vs near-black** — the two produce meaningfully different stats/classifications:

```text
near-black / minimal    → Ghost Spec   (style 7,  heat 4)
highly colorful/complex → Full Chaos   (style 64, heat 77)
pink/orange gradient    → Vice Classic (heat 64)
```

## Livery Compositing Tests

- `scripts/composite.ts` — renders each vehicle with a multi-color test livery to a PNG
- `scripts/livery-tests.ts` — renders the SERAPH R with a **detailed** design (text + shapes + scribble + 5 colors) and a **dark** design, proving artwork stays recognizable and dark values are not crushed
- `scripts/base.ts` — renders each vehicle without livery (stock paint)

## Verification Tooling Notes

- `scripts/ascii-*.mjs` convert PNGs to ASCII so visual QA can be performed in a terminal (the model used for this project cannot view images directly).
- All scripts are dev-only dependencies (`sharp`, `@napi-rs/canvas`, `puppeteer-core`) and are not part of the production bundle.

## V2.5 Asset Verification

- `scripts/pipeline-cars.mjs` / `pipeline-env.mjs` are the conversion commands; manifests written next to each production GLB
- The review screenshot flow (`scripts/screenshot-v2-review.ts`) exercises the production flow: boot, authored garage, all three selector platforms, paint, decals, reveal, analysis, street, build card
- Fallback check: MARLIN 88 exercises the procedural path; delete/move a production GLB to verify the procedural fallback engages cleanly

## Chrome

The headless harness expects a local Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (macOS default path).