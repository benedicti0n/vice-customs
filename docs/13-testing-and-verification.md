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

## Chrome

The headless harness expects a local Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (macOS default path).