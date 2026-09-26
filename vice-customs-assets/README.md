# VICE//CUSTOMS Free Asset Pack

This pack is a source-asset bundle for upgrading the existing Babylon.js VICE//CUSTOMS V2 experience. Extract the ZIP in the repository root so this directory remains available as:

```text
<repo-root>/vice-customs-assets/
```

The assets are deliberately kept as source material. Do not point the production app at every file in this folder. Use the implementation prompt in `docs/CODEX_IMPLEMENTATION_PROMPT.md` to select, normalize, optimize, and copy production outputs into the app's public asset structure.

## Recommended mapping

| VICE vehicle | Source | Role |
| --- | --- | --- |
| SERAPH R | `cars/seraph-r/seraph-r-source.glb` | Exotic Japanese-inspired hero coupe |
| TEMPEST VX | `cars/tempest-vx/tempest-vx-source.glb` | Modern AWD/EV-style street weapon |
| MARLIN 88 | `cars/marlin-88/marlin-88-source.glb` | Long-hood muscle/GT hero car |
| Alternate | `cars/alternate/concept-car-037-source.glb` | Optional retro-futurist replacement or traffic hero |

## Scene sources

- `environments/mannys-garage/base/` — scanned underground parking environment.
- `environments/mannys-garage/dressing/` — PBR industrial Blender source and baked textures.
- `environments/vice-coast/roads/` — modular roads, sidewalks, bridges, lights, and barriers.
- `environments/vice-coast/industrial/` — warehouses and industrial city modules.
- `environments/vice-coast/commercial/` — commercial buildings and skyline pieces.
- `environments/vice-coast/traffic/` — low-cost traffic cars and road debris.
- `lighting/` — 2K HDRIs for garage and parking/street reflections.

## Important production notes

1. Keep the existing procedural vehicles and environments as fallbacks until all acceptance tests pass.
2. The hero models are source-resolution assets. Generate web LODs and compressed production GLBs; do not ship them unchanged.
3. The modular city packs are layout and silhouette resources. Upgrade their materials, signs, decals, wetness, lighting, and prop density before judging the final scene.
4. Remove source names, logos, badges, and recognizable branding from production outputs. Preserve the creators' credits in the in-app credits and repository notices.
5. Read `docs/LICENSES_AND_ATTRIBUTION.md` before redistribution or release.

## Start here

Copy the entire contents of `docs/CODEX_IMPLEMENTATION_PROMPT.md` into Codex from the repository root. The prompt tells Codex how to audit the current implementation, integrate the new assets safely, preserve the customization flow, optimize for the web, and verify every major screen.

