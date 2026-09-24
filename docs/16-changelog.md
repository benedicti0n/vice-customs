# Changelog

## Unreleased

- Documentation system (`/docs`) added.

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