# 05 — Vehicle Rendering (V2)

## Why 3D Now

V2 replaces the V1 2D canvas presentation with a **real-time Babylon.js 3D vehicle** while keeping the recognizable side-profile silhouette (the 3D hull is lofted from the same parametric profile geometry that defined V1).

## Geometry Generation

`lib/3d/vehicles/profile.ts` parses the V1 SVG path data (`M/L/C/A/Z` subset) and samples the body and window loops into point sets. `builder.ts` maps them to 3D (canvas X → world Z forward, canvas Y → world Y up, car ~4.55 m long):

1. **Body hull** — a closed ribbon "sleeve": 9 copies of the body loop, spread across the width axis, each scaled toward the centroid by `1 - (1-0.86)·(|2x/w|)²`. The result is an elliptical cross-section car with the exact V1 side profile.
2. **UV mapping** — `u` = perimeter fraction (0..1 around the loop), `v` = width fraction. The door/fender region is a contiguous `u`-range; painting at a picked point writes into the livery texture at `(u·texW, v·texH)`.
3. **Glass** — two flat double-sided sheets from the window loop, offset just outside the hull sides.
4. **Wheels** — tire/rim/hub/spokes built per wheel; each wheel is a steerable/spinning transform node.
5. **Details** — grill, splitter, diffuser, twin exhausts, mirrors, spoiler, emissive headlight/taillight boxes.

## Materials (PBR)

`lib/3d/vehicles/materials.ts`:

| Material | Properties |
|----------|-----------|
| Paint | metallic 0.62, roughness 0.28, clearcoat 1.0, albedo = livery texture |
| Glass | alpha 0.32, roughness 0.06 |
| Chrome | metallic 1, roughness 0.1 |
| Rubber | metallic 0, roughness 0.92 |
| Light lens | emissive, used for headlights |
| Tail lens | red emissive |

## Render Order

```text
ground contact shadows (scene compositor side is replaced by real shadows)
↓
body hull (paint + livery texture)
↓
flat side glass
↓
wheels (spin/steer per frame)
↓
grill / splitter / diffuser / exhausts / mirrors / spoiler
↓
headlights / taillights (emissive)
↓
lighting: key spot + cyan/magenta neon + hemi + fills
↓
shadow map (quality-gated)
```

## Lighting

Garage/booth scenes use: a key spot from above, pink point (left), cyan point (right), a hemisphere light for base lift, and front/back fills so PBR metallic paint stays readable. The reveal mode dims the rig and ramps it back up during the sequence.

## Vehicle Asset Contract

`VehicleDefinition` in `rig.ts` documents the mesh-name-agnostic contract for future production GLBs (`modelUrl`, `bodyMeshes`, `glassMeshes`, `wheelNodes`, `lightNodes`, `paintMaterialSlots`, `cameraTargets`). The procedural builder currently produces the development vehicles behind that contract; a GLB loader can be swapped in without touching gameplay.
