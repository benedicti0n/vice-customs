# 07 — Image Analysis

`lib/livery/analysis.ts` converts the exported livery into build statistics and a classification. Everything is deterministic — the same input always yields the same output. There is no randomness.

## Sampling

- Load the exported image
- Draw it into a **96×96** canvas with `imageSmoothingEnabled = false` (keeps hard edges crisp for edge detection)
- Read raw pixels via `getImageData`

## Metrics

| Metric | Computation |
|--------|-------------|
| `brightness` | Mean relative luminance `0.299R + 0.587G + 0.114B` |
| `saturation` | `min(1, meanChroma × 2.2)` where `chroma = max(R,G,B) − min(R,G,B)` (chroma-based, so near-black pixels do not register as highly saturated) |
| `contrast` | Standard deviation of per-pixel luminance |
| `complexity` | `min(1, sqrt(meanGradient) × 2.1)` — mean of local luminance gradient magnitudes (edge density) |
| `colorfulness` | `min(1, sqrt(meanChroma) × sqrt(1.7))` |
| `diversity` | Fraction of 18 hue bins that contain saturated color |
| `purity` | Hue concentration: `1 − (spread − 1/18) / (1 − 1/18)` from normalized bin weights |
| `dominantHue` | **Circular mean** of hue weighted by `chroma²`, via `atan2(sinAccum, cosAccum)` — this avoids the wrap-around error where averaging 333° (pink) and 25° (orange) incorrectly yields ≈179° (cyan) |

Only pixels with `chroma > 0.05` contribute to hue statistics.

## Derived Outputs

```ts
const styleScore  = clamp(complexity*28 + saturation*38 + colorfulness*42 + contrast*12);
const streetRep   = clamp(styleScore*0.6 + saturation*25 + purity*10);
const subtlety    = clamp(100 - (saturation*80 + complexity*60 + colorfulness*30));
const policeHeat  = clamp(complexity*55 + saturation*60 + brightness*12
                          + (colorfulness > 0.5 ? 14 : 0) + (styleScore > 75 ? 8 : 0));
```

All scores are clamped to 0–100.

## Classification

Checked in this order:

| Condition | Classification |
|-----------|---------------|
| `colorfulness ≥ 0.58 && complexity ≥ 0.3` | **Full Chaos** |
| `brightness ≤ 0.22 && saturation ≤ 0.3 && complexity ≤ 0.24` | **Ghost Spec** |
| Vice hue (`hue ≥ 320 || hue ≤ 45`) `&& saturation ≥ 0.26` | **Vice Classic** |
| `saturation ≥ 0.4 && (complexity ≥ 0.26 || colorfulness ≥ 0.36)` | **Heat Magnet** |
| otherwise | **Street Clean** |

Classification copy + mechanic lines live in `lib/game/classifications.ts`.

## World Reaction

`policeHeat` drives the street run:

- `heat ≥ 68` → **high**: police-light reflections, siren, "ATTENTION ALL UNITS" scanner feed
- `heat ≥ 38` → **medium**: modified-vehicle scanner advisory
- otherwise → **low**: `NO ACTIVE ALERTS`

## V2: Build Telemetry (decals + classification)

`lib/game/analysisV2.ts` runs when a build is applied or loaded:

1. Re-renders the serialized strokes to a canvas (deterministic — no scene needed).
2. Reuses the V1 `analyzeLivery` pixel analysis for the four core scores.
3. Adds decal telemetry: coverage, decal count, emissive coverage, reflectivity, symmetry (left/right mirroring), palette complexity.
4. Applies a documented, deterministic classification table:

| Rule | Classification |
|------|---------------|
| heat ≥ 78 or (emissive ≥ 50% and coverage ≥ 40%) | **HEAT MAGNET** |
| style ≥ 72 and ≥ 6 decals and coverage ≥ 35% | **SHOW CAR** |
| emissive ≥ 25% and saturation ≥ 0.45 | **NEON OUTLAW** |
| subtlety ≥ 72, ≤ 1 decal, saturation ≤ 0.28 | **GHOST BUILD** |
| dark + blue hue + ≤ 3 decals | **MIDNIGHT RUNNER** |
| rep ≥ 66 and ≥ 3 decals | **STREET SPEC** |
| no decals, near-zero saturation | **OEM+** |
| vice-range hue with real saturation | **VICE ICON** |
| otherwise | **LOW PROFILE** |

Each classification carries short diegetic diagnostics (e.g. `HIGH CONTRAST / LARGE BODY COVERAGE`), capped at three per build.

## Verified Examples

From the deterministic analysis tests (`scripts/test-analysis.ts`):

```text
near-black / minimal  → Ghost Spec     → style 7, heat 4
highly colorful / complex → Full Chaos → style 64, heat 77
pink/orange gradient  → Vice Classic   → heat 64
```

The colorful versus near-black case proves the classification meaningfully responds to the artwork.