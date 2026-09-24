# Changelog

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