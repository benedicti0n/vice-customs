# 17 — Asset Pipeline (V2.5)

## Sources

The source bundle lives at `<repo-root>/vice-customs-assets/` (development material, not shipped). Production outputs are written to `public/assets/`.

| Output | Source | Pipeline |
|--------|--------|----------|
| `public/assets/vehicles/seraph-r/*.glb` | `cars/tempest-vx/tempest-vx-source.glb` | cars pipeline |
| `public/assets/vehicles/tempest-vx/*.glb` | `cars/seraph-r/seraph-r-source.glb` | cars pipeline |
| `public/assets/garage/parking-garage.glb` | `environments/mannys-garage/base/parking-garage-source.glb` | env pipeline |
| `public/assets/city/{industrial,commercial,traffic}/*.glb` | Kenney CC0 GLB kits | env pipeline |

### Vehicle assignment decision

The source pack's naming strongly indicates the design intent: the tempest-vx source is a Supra-style Japanese coupe and the seraph-r source is a futuristic concept. The brief permits one swap when the fit is better, so:

- **SERAPH R** ← Supra-style coupe (Japanese tuner heritage)
- **TEMPEST VX** ← futuristic street weapon (EV-era machine)

### MARLIN 88 keeps the procedural fallback

The marlin-88 source was evaluated and rejected for production use in V2.5:

- uniform gray materials with no body-paint separation (cannot recolor only the body),
- no wheel topology (wheels fused into body meshes, no pivots),
- no textures,
- a validator error (`ANIMATION_SAMPLER_ACCESSOR_WITH_BYTESTRIDE`),
- 657k triangles.

The gameplay for MARLIN 88 remains fully functional through the procedural builder.

## Commands

```bash
npx tsx scripts/pipeline-cars.mjs   # production vehicles → public/assets/vehicles
npx tsx scripts/pipeline-env.mjs    # garage shell + city kits → public/assets/garage + city
```

Both require `npm install` (dev deps include `@gltf-transform/*`, `meshoptimizer`).

## Cars pipeline steps

1. Strip badges (`Text.*` nodes), cameras, lights, animations.
2. `bakeTransforms` — bake every node's world matrix into mesh vertices (Sketchfab exports keep a root rotation that `flatten()` alone does not apply).
3. `normalizeDoc` — metres, Y-up, ground at Y=0, centerline at X=0, length 4.55 m, forward +Z.
4. **Wheel extraction** — k-means (k=4 on x,z) over the wheel-ish vertices (rubber/rims/calipers/metal/protector materials), then per-vertex index splitting of fused wheel primitives into 4 pivoted assemblies (`vc-wheel-0..3` with children offset by `-pivot`). This makes fused wheel meshes spin/steer correctly.
5. Semantic mesh names (`vc-body-*`, `vc-rim-*`, `vc-rubber-*`, …) and `vc-body-paint` material name.
6. Quantize (14-bit positions) + meshopt (`EXT_meshopt_compression`).
7. LOD1: meshopt simplification to ~22k triangles.
8. `manifest.json` per vehicle: bounds, wheel pivots, forward axis, attribution.

## Env pipeline steps

- **Garage**: hard simplify (679k → ~45k triangles, error 0.02), keep metre scale, quantize+meshopt.
- **City kits**: simplify each GLB to ≤2.5k triangles, quantize+meshopt, manifest. Missing shared textures (`Textures/colormap.png` dropped from the pack) are rewritten to an embedded fallback image at the GLB level (`loadDocLenient`).

## Runtime

`lib/3d/assets/registry.ts` is the single typed registry: semantic node prefixes, wheel pivots, dimensions, camera framing, livery UV tuning, attribution, and the procedural-fallback pointer.

`lib/3d/vehicles/glbVehicle.ts` loads the GLB via Babylon's GLTF loader, merges body meshes (pickable, shadow-casting), attaches the shared `LiveryLayer` texture to the body-paint material, and rebuilds the `VehicleRig` (wheels spin around X, front wheels steer) — the same contract the procedural builder produces. `materializeBuild` prefers the production path and falls back to the procedural builder on any load failure.

Decals place via **ray picking** (world point + normal), so they conform to the production body without depending on UV mapping. The livery texture maps onto the body's UV0 atlas (documented compatibility layer; per-vehicle tuning knobs live in the registry).

## Known limitations (V2.5)

- Livery wrap uses the source UV0 atlas — multi-island UVs mean strokes may wrap across islands (documented compat layer; decals are UV-independent).
- MARLIN 88 remains procedural (see above).
- The garage shell is a hard-simplified scan; authored props/lighting sit on top.
- Street kits are simplified midground/background models; the road itself remains procedural.
- Nose direction is assumed +Z per the normalized export; registry `yawOffset` exists for a corrective flip if a model review finds otherwise.