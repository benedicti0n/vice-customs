# Changelog

## 2.5.0

### Added

- Production GLB pipeline (`scripts/pipeline-cars.mjs`, `pipeline-env.mjs`) using glTF-Transform + meshopt
- Typed asset registry (`lib/3d/assets/registry.ts`) — semantic node prefixes, wheel pivots, dims, camera framing, attribution
- Production vehicles: SERAPH R (Supra-style coupe source) and TEMPEST VX (futuristic concept source) with split/spin/steer wheels, PBR body paint + clearcoat, livery texture, LOD0/LOD1, meshopt compression
- Authored garage shell from the SPLEEN VISION parking-garage scan (simplified to ~45k tris) behind the authored props
- City kit props (Kenney CC0 industrial/commercial/traffic packs) instanced into the street run
- Missing-texture lenient GLB loader, kit caching/disposal, ray-based decal placement
- NOTICE.md + in-app credits (CC BY 4.0 / CC0 attribution)

### Changed

- SERAPH R ↔ TEMPEST VX vehicle-source swap for design fit (documented in `docs/17-asset-pipeline.md`)
- Decals place via world-point ray picking (UV-independent on production bodies)
- `materializeBuild` is async and prefers production assets with procedural fallback

### Known limitations (V2.5)

- MARLIN 88 keeps the procedural fallback (source lacks material separation, wheel topology, textures; validator error)
- Livery wrap uses source UV0 (compat layer; decals unaffected)
- Street road remains procedural; kits supply the city dressing

## Unreleased

- V2 3D customization experience in development (see below).

## 2.0.0

### Added

- Babylon.js 3D engine with WebGPU-first, WebGL-fallback rendering (`lib/3d/engine.ts`)
- Procedural 3D vehicle rigs built from the V1 profile geometry (PBR paint with clearcoat, glass, chrome, rubber, emissive lights, spinning/steering wheels)
- 3D garage environment (bay platform, hazard strips, neon strips, VICE//CUSTOMS sign, dust particles, reflection probe)
- V2 paint booth: live body painting (brush + eraser on a canvas-backed livery texture), projected decals with 14 presets, tints, five material presets, move/rotate/scale/duplicate/delete/opacity, undo/redo, body paint colors
- 3D reveal sequence (matte→gloss material sweep, light ramp) with the original SURFACE PREP / INK ARRAY / CLEAR COAT / CURING copy
- 3D arcade street run: instanced night city, chase camera, keyboard driving (WASD + Shift), wheel spin/steer, body roll, speed HUD, heat-reactive scanner + siren
- Deterministic V2 build telemetry (coverage, decal counts, symmetry, palette) and nine documented classifications
- Interactive 3D turntable on the final build card with PNG export rendered from the 3D frame
- Versioned `ViceBuild` schema (v2) with V1 save migration
- V2 Playwright capture flow (`scripts/screenshot-v2.ts`)

### Fixed

- Babylon v8 API differences (attachControl signatures, InstancedMesh side-effect import, clearcoat assignment)
- Body picking not registering — camera is now set as the scene's active camera so `scene.pick` works
- Painted strokes not persisting — `materializeBuild` now syncs the serialized strokes into the live livery layer
- Stroke point gating dropped single-dot marks; micro-moves no longer lose points
- Keyboard shortcuts not attaching until after the 3D stage is ready
- Audio failures no longer abort scene transitions (sound engine public API is fail-safe)
- Street run kept dispatching `complete` every frame after the run ended, blocking later transitions — the engine render loop now stops at run end
- Customize Again now reliably re-opens the paint booth (verified end-to-end)

### Notes

- The Unlayer booth is preserved behind `NEXT_PUBLIC_VC_V2_UNLAYER=1` during migration.

## 1.0.0

Initial competition build.

### Added

- Eight-scene experience shell: boot → garage → vehicle select → paint booth → reveal → analysis → street run → final build card
- Parametric 2D vehicle renderer with three original platforms (SERAPH R, TEMPEST VX, MARLIN 88)
- Unlayer paint booth with a generated 1600×900 body-graphics template
- Canvas livery compositor (body-mask clipping, region transform, curvature/edge/saturation shading, specular streak)
- Deterministic 96×96 pixel analysis → STYLE / STREET REP / SUBTLETY / POLICE HEAT + five classifications
- Heat-reactive street sequence (scanner feed, police lights, siren) gated on `policeHeat`
- Downloadable PNG build card
- Synthesized Web Audio engine with mute control
- Livery + build-number persistence in `localStorage`
- Dev verification tooling (`scripts/`: headless flow test, scene audit, analysis tests, livery tests, ASCII renderers)

### Improved

- Vehicle paint depth: 6-stop gradient, horizontal side shading, radial sheen, metallic noise overlay
- Lower-body occlusion and wheel-arch shadows for believable depth
- Detailed wheels (drilled disc, spokes, caliper, rim lip), grill, splitter, diffuser, exhausts, mirror glass
- Headlight/taillight lenses with projector dots and glow
- Specular reflections, neon floor reflection, screen-blend rim light
- Grounding: broad + per-tire contact shadows
- Street run: converging-perspective road, scrolling perspective dashes, amber edge lines, neon light pools
- Reveal sequence: tightened pacing, faster brighter car fade, light sweep across the body
- Unified color palette (bg `#050609`, ink `#ede9df`, pink `#ff3f8e`, cyan `#39d9e6`, amber `#ffa640`)
- Boot screen ambient glow; garage fluorescent ignition flash on entry
- Analysis scene: BUILD CLASS promoted to hero position
- Removed grain/chromatic overlays from the editor surface

### Fixed

- Corrected livery placement on body panels — artwork previously mapped from the rear bumper because the geometry used the arch *radius* instead of the arch *edge*
- Restored wheel rendering — implicit-path `ctx.fill()` calls broke in the canvas binding; the compositor now uses explicit `Path2D` objects throughout
- Analysis hue bug — replaced linear hue averaging with a circular mean so pink+orange no longer reads as cyan
- Chroma-based saturation — near-black pixels no longer inflate saturation
- SSR-safe `localStorage` access (prevents prerender crashes and hydration mismatches)
- Paint booth boot sequence now actually runs (previously the editor never mounted)

### Known Limitations

See [15 — Known Limitations](./15-known-limitations.md).