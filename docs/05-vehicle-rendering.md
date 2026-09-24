# 05 — Vehicle Rendering

## Why 2D (Not Three.js)

The vehicle is rendered as **layered 2D canvas art** for four reasons:

1. **Reliability** — a deterministic canvas pipeline cannot be broken by GPU/WebGL quirks on a judge's machine.
2. **Livery compositing** — clipping the user's artwork to a body mask is trivial and robust with Canvas 2D `clip()` / `globalCompositeOperation`, and the same art is reused for the build-card PNG.
3. **Performance** — no WebGL context, no shader compile, no texture budget; the composite is produced once per (vehicle, livery) pair and cached.
4. **Scope discipline** — the brief explicitly deferred 3D until the core experience is stable.

The illusion of volume is achieved with paint gradients, curvature shading, specular streaks, and rim light — not polygons.

## Geometry Generation

`lib/vehicle/geometry.ts` defines a parametric side-profile builder. Each vehicle is described by a `ProfileParams` set (wheelbase, overhangs, wheel/arch radii, beltline, roof, cowl, tail…), and `buildProfile()` emits:

| Path | Description |
|------|-------------|
| `body` | Full silhouette including wheel-arch cutouts (single closed path) |
| `windows` | Glass panes clipped between beltline and roof |
| `mirror` | Side mirror silhouette |
| `liveryRegion` | Quadrilateral where body graphics are placed (door → front fender) |
| `fenderFront` / `fenderRear` | Wheel-arch flare lines |
| `doorLine` | Door seam curve |
| `hoodVent` | Hood vent shape |
| `rockerAccent` | Lower-body accent strip |

Three vehicles share the builder with distinct parameters:

| Vehicle | Identity | Parameters |
|---------|----------|------------|
| **SERAPH R** | Japanese tuner coupe | short overhangs, high beltline, big cabin |
| **TEMPEST VX** | European super coupe | longer wheelbase, low roof, cab-rearward |
| **MARLIN 88** | American muscle sport | long hood, upright glass, bigger arches/wheels |

Paint per vehicle is defined in `lib/game/vehicles.ts` (`base`, `shade`, `accent`, `glass`).

## Render Order

The compositor (`lib/livery/compositor.ts`, `compositeVehicle()`) draws in this order:

```text
ground shadow
↓
base body
↓
base paint
↓
custom livery          (only when a livery exists)
↓
body curvature          (on the livery region)
↓
lower-body occlusion
↓
wheel-arch shadows
↓
windows/details
↓
wheels
↓
specular reflections
↓
garage rim lighting
↓
(floor reflection is applied by scenes, not the compositor)
```

## Layer Detail

### Ground shadow
Broad radial ellipse under the car plus a tighter **contact shadow** under each wheel — the tires visibly touch the floor.

### Body paint
- 6-stop vertical gradient (bright beltline → base → dark rocker)
- horizontal side shading (dark fenders → open door)
- radial sheen on the upper door
- **metallic noise** — a tiled 128×128 random texture drawn with `globalCompositeOperation: overlay` at 5.5% alpha
- accent rocker strip with trim hairlines

### Livery
Clipped to `body` ∩ `liveryRegion`, transformed to the door region, then shaded. See [06 — Livery System](./06-livery-system.md).

### Lower-body occlusion
A vertical dark gradient at the rocker to fake curvature + ambient occlusion.

### Wheel-arch shadows
Radial dark gradients centered on each axle, clipped to the body, drawn *under* the wheels so the arch reads as a recessed well.

### Windows
Dark glass gradient, a horizon reflection band, a diagonal streak, a faint pink neon band at the base, a B-pillar, and a chrome frame stroke.

### Details
Door seam + highlight, door handle, fuel cap, hood vent, fender flare strokes, front splitter, rear diffuser, twin chrome exhausts, grill with slats.

### Headlights / taillights
Headlight: gradient lens + projector dot + soft glow. Taillight: red lens strip + white highlight + glow. These read as lit even in the stock composite.

### Wheels
Per wheel (`drawWheel`): radial tire gradient with top highlight, dark barrel, drilled brake disc, 7 metallic spokes with edge lines, hub with accent, brake caliper with highlight, rim lip ring.

### Specular reflections (`drawGloss`)
Beltline highlight stroke, door S-curve specular, roof highlight, a horizontal white band, neon floor reflection (pink→cyan), a cyan edge on the nose, and a screen-blend rim light over the whole silhouette.

## Scene Usage

`components/vehicle/VehicleRenderer.tsx` renders the composited PNG (`object-contain`). Scenes size it large and center it:
- Garage: `min(60vh, 560px)` tall with a mirrored floor glow
- Selector / Analysis / Final Card: similar hero treatment
- Street run: `min(44vh, 440px)` over the road

## Why It Reads as a Car

The combination that sells the illusion: a believable silhouette, wheels that meet the ground, a lit-from-above paint finish, recessed wheel arches, glass reflections, and neon floor reflections that tie the car to its environment.