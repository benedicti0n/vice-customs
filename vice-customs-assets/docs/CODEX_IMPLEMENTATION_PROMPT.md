# Codex implementation prompt — VICE//CUSTOMS V2.5 asset overhaul

You are working in the existing VICE//CUSTOMS repository. A free source-asset bundle has been extracted at:

```text
<repo-root>/vice-customs-assets/
```

Upgrade the existing V2 Babylon.js experience from procedural placeholder art to an authored, high-quality VICE//CUSTOMS V2.5 presentation. Integrate the supplied vehicle, garage, road, building, prop, traffic, and HDRI assets while preserving the complete working product flow:

```text
boot -> garage -> vehicle selector -> paint booth -> reveal -> analysis -> street run -> build card
```

Do not replace the application architecture or rebuild the product from scratch. The existing state machine, persistence, Unlayer/image-editor integration, analysis logic, paint and decal workflows, cameras, controls, audio system, street-run gameplay, screenshots/build card, and accessibility behavior must continue to work.

## 1. Audit before editing

Read the repository, README, `/docs`, package scripts, Babylon scene code, vehicle definitions, livery compositor, paint/decal code, state store, persistence, tests, and existing screenshot workflow. Find any `AGENTS.md` files and obey them.

Before making changes, document:

- current scene/module ownership;
- current vehicle coordinate system, dimensions, origin, forward axis, and wheel assumptions;
- current material/livery application path;
- current asset loading and disposal lifecycle;
- current performance budgets and quality profiles;
- existing tests and screenshot routes;
- the smallest safe integration seam for production GLBs.

Create a short implementation checklist and then proceed autonomously. Do not stop after producing a plan.

## 2. Preserve fallbacks and introduce an asset registry

Keep the procedural cars, garage, and street modules as development/failure fallbacks until the new pipeline passes all acceptance tests. Introduce one typed production asset registry instead of scattering paths and mesh-name assumptions through scene code.

The registry must define, at minimum:

- stable vehicle ID;
- display name and lore;
- source and production GLB paths;
- native forward/up axes;
- normalized dimensions and scale;
- root offset and wheelbase;
- body-paint mesh/material selectors;
- glass, trim, interior, lights, brake, and wheel selectors;
- wheel-node references and rotation axes;
- decal-eligible surfaces;
- camera framing values per scene;
- collision and shadow proxies;
- LOD files and distance thresholds;
- attribution metadata;
- fallback procedural definition.

Never depend on array indices from imported GLBs. Mesh and material names may be generic. Build and persist explicit semantic maps after inspecting every source asset.

## 3. Vehicle assignments

Use this initial mapping:

```text
SERAPH R
  vice-customs-assets/cars/seraph-r/seraph-r-source.glb

TEMPEST VX
  vice-customs-assets/cars/tempest-vx/tempest-vx-source.glb

MARLIN 88
  vice-customs-assets/cars/marlin-88/marlin-88-source.glb

OPTIONAL ALTERNATE
  vice-customs-assets/cars/alternate/concept-car-037-source.glb
```

If visual inspection proves that swapping SERAPH R and TEMPEST VX produces a better design fit, make that swap once and document it. Do not substitute the muscle coupe away from MARLIN 88 without a strong technical reason.

For each production vehicle:

1. Import and inspect the complete node, mesh, material, texture, skeleton, animation, and bounding hierarchy.
2. Remove unused cameras, lights, empty nodes, hidden duplicates, source-platform helpers, and obviously invisible geometry.
3. Remove or replace all logos, badges, license plates, source labels, and recognizable brand marks.
4. Normalize to metres, Y-up, one consistent forward axis, ground contact at Y=0, centerline at X=0, and a stable root pivot near the vehicle's center of mass.
5. Identify or separate the four wheels. Correct every wheel pivot so wheel spin and front steering work. If wheels are fused into a mesh, make a minimally destructive separation or create visual wheel instances while retaining a simplified collision shell.
6. Separate or semantically map body paint, glass, trim, lights, interior, tires, rims, brakes, and emissive elements.
7. Replace weak source materials with Babylon PBR materials while retaining useful source texture detail. Car paint needs metallic/roughness control, clearcoat, environment reflections, subtle orange-peel/flake normal detail, and color updates without recoloring glass/trim/interior.
8. Make headlights, taillights, brake lights, indicators, and emissive accents individually controllable.
9. Create simplified shadow and collision proxies. Do not use the full render mesh for collisions.
10. Generate at least LOD0 and LOD1. Create LOD2 if used for selector background/traffic. Preserve a high-quality close-up LOD for Paint Booth and Reveal.
11. Compress geometry and textures for web delivery using supported glTF tooling. Prefer KTX2/Basis textures and Meshopt where compatible with the existing Babylon loader. Test on Safari as well as Chromium.
12. Write optimized production outputs into the app's existing public/static asset convention, not back into `vice-customs-assets/`.

Target the selected hero car at roughly 12–25 MiB compressed for LOD0 and 4–10 MiB for LOD1. These are transfer targets, not hard caps. Avoid destroying silhouette, lights, wheels, panel gaps, normals, or close-up paint quality merely to meet a number.

## 4. Preserve and improve customization

The new models must work through the complete customization system.

- Existing paint selection must update only designated body surfaces.
- Existing imported livery/image content must remain visible in Garage, Paint Booth, Reveal, Analysis, Street Run, and Build Card.
- Decals must attach to the car and not remain as detached world-space planes.
- Prevent decals from bleeding onto glass, tires, underside, interior, or unrelated body panels.
- Keep the existing workflow functional even if true UV-wrap authoring is not completed in this pass.
- Prefer a vehicle-specific decal-surface registry and local projection coordinates.
- If a source vehicle lacks usable UVs for full livery wrapping, implement a documented compatibility layer and preserve the current compositor as a fallback.
- Do not fake customization only in one scene. Serialized customization state must reproduce the same car everywhere.

Add development-only visualization for body-paint surfaces, wheel pivots, decal surfaces, bounding boxes, collision proxies, and camera targets. Keep it off in production.

## 5. Rebuild Manny's Garage / Bay 03

Use:

```text
vice-customs-assets/environments/mannys-garage/base/parking-garage-source.glb
vice-customs-assets/environments/mannys-garage/dressing/
vice-customs-assets/lighting/workshop_2k.hdr
```

Treat the parking-garage scan as raw spatial material, not a finished level. Select and crop a compact playable bay. Delete invisible and irrelevant scan geometry. Rebuild the composition around the hero car.

The garage should feel like an underground tuner workshop inside a believable coastal city:

- dirty concrete, painted metal, rubber, oil, dust, cables, pipes, ventilation, shelves, tools, tires, compressor, workbench, lift/jacks, CRT/monitor, fan, extinguisher, parts bins, and a rolling shutter;
- neutral fluorescent key light and warm practical lights;
- sparing cyan/magenta VICE accents rather than an all-neon room;
- workshop HDRI for reflections/image-based lighting, while local Babylon lights provide authored illumination;
- reflection probes or equivalent so paint reads correctly;
- `MANNY'S MOTOR WORKS`, `BAY 03`, safety labels, fictional posters, and environmental storytelling;
- a believable view through the shutter into the first alley/street chunk;
- strong compositions for Garage, Selector, Paint Booth, Reveal, and Analysis camera modes.

Select only the industrial props actually used. Convert the selected Blender assets to a compact web GLB; do not ship the whole `.blend` scene or every texture. Instance repeated objects. Merge static meshes only when it improves draw calls without breaking culling or material reuse.

## 6. Replace the placeholder Street Run with VICE Coast

Use the supplied roads, industrial buildings, commercial buildings, traffic vehicles, and abandoned-parking HDRI as sources. Do not simply scatter every supplied model.

Create a short authored route with streamed sectors:

```text
Manny's Garage exit
  -> wet Ocean District alley
  -> industrial warehouses and port edge
  -> curved Little Vice commercial block
  -> tunnel or underpass
  -> Downtown/harbor fast section
  -> bridge or coastal overlook finish
```

Requirements:

- curves, elevation changes, lane variation, at least one intersection, and a tunnel/underpass or bridge transition;
- foreground, midground, and background layers;
- wet asphalt with roughness variation, puddle masks, markings, cracks, drains, curbs, and reflected practical lights;
- fictional VICE brands and signage, not real-world marks;
- authored clutter near the player, lightweight modular buildings in the midground, and cheap silhouettes/skyline in the background;
- parked and moving traffic from low-cost models, instanced where possible;
- chunk streaming and deterministic cleanup; never keep the entire route loaded;
- stable driving bounds, collision proxies, reset/recovery logic, and no seams that catch the vehicle;
- existing Street Run controls, HUD, boost, camera behavior, screenshots, and completion logic must remain functional.

The supplied city kits are visually simple. Use them as geometry/layout sources and upgrade them through material work, decals, signs, grime, lighting, reflections, fog, props, vegetation, and composition. Do not leave raw flat-color assets next to the realistic hero car and garage.

## 7. Loading and performance

Implement staged loading:

```text
Boot: UI + minimal shell
Garage entry: selected vehicle + authored garage set
Garage idle: preload Paint Booth dependencies and next likely vehicle LODs
Reveal: preload first Street Run sector
Street Run: stream next sector and dispose sectors safely behind the player
```

Requirements:

- loading progress must be honest and tied to asset readiness;
- cache shared textures/materials without leaking GPU resources;
- cancel stale loads when the user switches vehicles quickly;
- dispose meshes, materials, textures, probes, particle systems, observers, sounds, and physics/collision objects deterministically;
- use hardware instances/thin instances for repeatable props when appropriate;
- preserve existing quality profiles and add sensible lower-quality fallbacks;
- no permanent main-thread stalls during scene transitions;
- do not bundle source assets into the application build.

Record before/after initial transfer size, scene-ready time, draw calls, triangle count, texture memory, and steady-state FPS for Garage and Street Run.

## 8. Art direction

Target grounded, slightly dirty, cinematic tuner culture rather than a generic cyberpunk showroom. GTA-like atmosphere should come from believable urban density, environmental storytelling, authored camera framing, fictional local brands, wet surfaces, practical lighting, traffic, and a sense of place. Do not copy GTA maps, logos, characters, UI, or protected artwork.

Keep the established VICE//CUSTOMS interface language. The 3D overhaul must not turn the UI into Blender, Unreal Editor, or a generic neon dashboard.

## 9. Licensing and credits

Read `vice-customs-assets/docs/LICENSES_AND_ATTRIBUTION.md` before exporting production files.

- Add required CC BY 4.0 credits to repository notices and the in-app credits surface.
- Preserve the creator and source URL in the production asset manifest.
- Record modifications.
- Keep original notices/license files.
- Do not expose or redistribute this entire source bundle as an end-user download.
- Remove real-world logos, badges, plates, and source marks before release.

## 10. Verification and acceptance criteria

Do not declare completion after the models merely load. Verify the full product.

### Functional

- All three vehicle choices load the correct production model.
- Switching vehicles repeatedly does not leak or leave old meshes.
- Paint changes affect body paint only.
- Decals/livery persist across reload and appear consistently in every downstream scene.
- Wheels spin on the correct axis; front wheels steer correctly; the car remains grounded.
- Reveal, Analysis, Street Run, and Build Card use the chosen customized car.
- Save/load and existing persistence remain compatible or include a documented migration.
- Procedural fallback activates cleanly if a production asset fails.

### Visual

- No missing textures, black materials, flipped normals, z-fighting, floating wheels, detached decals, light leaks, clipped cameras, or car-floor intersections.
- Glass, paint, tires, trim, lights, and interior read as distinct materials.
- Garage screenshots look authored from every required camera, not like an empty scanned parking level.
- Street Run has clear foreground/midground/background depth and no long empty grey corridor.
- Cyan/magenta is accent color, not the only light source.

### Performance

- No console errors or unhandled promise rejections.
- No duplicate downloads for shared assets.
- No monotonic GPU-memory growth after repeated scene/vehicle cycling.
- Test current supported desktop browsers and the existing mobile/low-quality path.
- Measure and report initial payload and scene-ready times.

### Regression suite

Run existing lint, typecheck, unit, integration, and build commands. Fix failures caused by this work. Add focused tests for asset-registry mapping, load cancellation, state persistence, and disposal.

Use the repository's existing screenshot automation to capture every major state. At minimum capture:

1. boot/title;
2. authored garage;
3. SERAPH R selector;
4. TEMPEST VX selector;
5. MARLIN 88 selector;
6. paint tool;
7. painted car;
8. decals/livery;
9. selection/transform UI;
10. reveal applying;
11. reveal car;
12. analysis;
13. Street Run normal;
14. Street Run boost;
15. final build card.

Compare the new screenshots against the current V2 references and iterate until the upgrade is visually obvious without breaking functionality.

## 11. Deliverables

Complete the implementation and leave:

- optimized runtime GLBs/textures/HDRIs in the app's normal asset structure;
- typed asset registries and semantic mesh maps;
- updated loaders, scenes, materials, customization integration, streaming, and disposal;
- credits/license notice updates;
- tests and screenshot artifacts;
- documentation of the conversion pipeline and commands;
- measured before/after performance and payload report;
- a concise changelog including compromises, remaining art tasks, and any models that need manual Blender cleanup.

Do not silently accept poor results. If a source model has unusable wheel topology, UVs, or material separation, keep the procedural fallback for that specific function, document the limitation, and continue improving the rest of the experience.

