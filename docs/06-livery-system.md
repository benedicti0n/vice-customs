# 06 — Livery System

The most important feature: the Unlayer editor's output becomes the vehicle's body graphics.

## Pipeline

```text
Unlayer
→ onSave({ dataUrl, blob })
→ store dataUrl (state + localStorage)
→ load into an HTMLImageElement
→ compositeVehicle(spec, { livery })
   → draw body paint
   → clip to body silhouette
   → clip to livery region
   → transform + draw the artwork
   → curvature / edge / saturation shading
   → specular streak
   → details, wheels, gloss above it
→ PNG data URL cached
→ rendered by VehicleRenderer in every scene
```

Ownership: `lib/livery/cache.ts` (async, memoized per `vehicleId::livery`) calls `lib/livery/compositor.ts`.

## Livery Template

Before the editor opens, `lib/livery/template.ts` generates a **1600×900 body-graphics sheet** on canvas:

- dark radial background
- faint grid
- dashed **SAFE AREA** frame with `VICE CUSTOMS // BODY GRAPHICS` title
- `LEFT BODY / CENTER / RIGHT BODY` labels
- corner registration marks
- `VC-LIVERY/2.4` system tag

The template is the editor's starting image (or the existing livery when re-entering the booth via *Customize Again*).

## Save Handling

`PaintBooth.onSave` receives `{ dataUrl, blob }` from Unlayer. It:

1. `applyLivery(dataUrl)` → dispatches `LIVERY`, persists via `persistLivery`, and kicks off `analyzeLivery`
2. Transitions to the reveal scene

## Compositing Algorithm

```ts
ctx.save();
ctx.clip(bodyPath);                 // 1. never draw outside the car
ctx.save();
ctx.clip(liveryRegionPath);         // 2. never draw outside the door region
ctx.translate(t.dx, t.dy);          // 3. position region
ctx.rotate(t.rotation);             // 4. match beltline slope
ctx.scale(t.scaleX, t.scaleY);      // 5. fit image into region
ctx.globalAlpha = 0.95;
ctx.drawImage(livery, 0, 0, w, h);  // 6. paint the artwork
// 7. curvature gradient (darker toward rocker)
// 8. edge gradient (dark at front/rear of region)
// 9. saturation dip in deep shadow (globalCompositeOperation: "saturation")
// 10. specular streak above the art
ctx.restore();
ctx.restore();
```

### Clipping

Two nested clips guarantee the artwork never covers windows, wheels, glass, or the ground — only the body panel between the wheel arches and the beltline/rocker.

### Perspective Approximation

The region transform is a **single affine fit** (translate + rotate + scale). True perspective is approximated with:

- a rotation matching the beltline slope (`atan2` of the region's top edge)
- curvature/edge gradients that fake body roundness
- a specular streak aligned with the door

A per-pixel mesh warp was deliberately not used — the affine fit + shading reads correctly at scene scale and stays deterministic.

### Placement

The region spans from just behind the rear wheel arch to just before the front arch, between `beltlineY + 34` and `rockerY - 6` — i.e. the door and front fender, leaving a clean painted strip below.

### Shadow / Highlight Interaction

Shading is applied **above** the artwork, so highlights still read over dark designs and deep shadows sit at the rocker. `globalAlpha 0.95` lets base paint tint show through slightly, keeping the design attached to the surface rather than floating over it.

## Persistence

The exported `dataUrl` is stored under `localStorage["vc-last-livery"]`. On reload, `GameContext` restores it and recomputes analysis + composite, so a refresh does not destroy the creation.

## V2: Live Customization (replaces flat export-only workflow)

V2 adds two complementary systems (`lib/3d/paint/`):

### A. Livery texture (paint + freehand)

- `LiveryLayer` wraps a `DynamicTexture` (2048×256, u≈perimeter / v≈width).
- Base fill = build paint color with a light-to-dark gradient.
- Brush strokes are stamped into the texture at picked-body UVs; eraser stamps the base color.
- Undo/redo re-render the full texture from the serialized stroke list.
- The texture is the body material's albedo, so painting is **live on the car** — no save-then-discover.

### B. Projected decals (discrete graphics)

- `DecalManager` places flat box meshes (DynamicTexture art) on the body via ray picking:
  `pointer → camera ray → body hit → surface normal → orientation quaternion → offset 7mm`.
- Serialized as `DecalInstance` (position, rotation quaternion, scale, tint, material, layer) — never raw Babylon objects.
- Transforms: drag to move along the surface, R rotate, `[`/`]` scale, D duplicate, X material cycle (VINYL/PAINTED/CHROME/REFLECTIVE/EMISSIVE), O opacity, Del delete.
- Polygon-offset-free: the small normal offset + depth bias avoids z-fighting.

## QA History — the Region Bug

During visual QA it was discovered that artwork mapped from the **rear bumper** instead of the door.

**Root cause:** `computeLiveryTransform` (and the `liveryRegion` path) computed the region's left edge as `archR + 24`, where `archR` is the *wheel-arch radius* (146px), not the *arch edge* (`rax + archR`, ~616px). The region therefore started at x≈170 — behind the tail — instead of at the rear wheel arch.

**Fix:** both `geometry.ts` and `compositor.ts` now compute the region from `g.rax + g.archR` (rear arch right edge) and `g.fax - g.archR` (front arch left edge). The design now sits on the door where body graphics belong.

**Lesson recorded:** any code using the geometry's `archR` must be verified against whether the radius or the arch-edge position is intended.