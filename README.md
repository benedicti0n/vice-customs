# VICE//CUSTOMS

**Custom vehicle operations — Ocean District, Vice Coast.**

VICE//CUSTOMS is an original GTA VI-inspired interactive experience that turns the **Unlayer React Image Editor into an in-world vehicle paint system**. You walk into a garage, pick a fictional ride, design a livery inside the shop's own paint array, and watch your exact artwork get applied to the bodywork — then the machine analyzes your design and the streets react to it.

> VICE//CUSTOMS is an original fan-made interactive experience created for the Unlayer "Build with React Image Editor" challenge. It is not affiliated with or endorsed by Rockstar Games.

## Concept

The image editor doesn't sit next to the game — **it is part of the game world**. Unlayer is the paint machine. Your image is the livery. The livery becomes the car. The car affects the world.

## Core Loop

```
CREATE → APPLY → ANALYZE → DRIVE
```

1. **Create** — enter the paint booth; the Unlayer editor loads on a real body-graphics template (draw, text, shapes, stickers, filters).
2. **Apply** — on save, the garage performs a cinematic reveal sequence and your exported design is composited onto the vehicle body via a canvas livery pipeline (body-mask clipping, perspective-approximating transform, curvature shading, gloss overlays).
3. **Analyze** — the exported image is downsampled and analyzed client-side (saturation, brightness, contrast, edge complexity, colorfulness, dominant hue) to produce deterministic build stats and a classification: *Ghost Spec, Street Clean, Vice Classic, Heat Magnet, Full Chaos*.
4. **Drive** — a short cinematic street sequence renders the customized car. The classification shapes the world: low-heat builds cruise in silence, high-heat builds draw police-light reflections and a live scanner feed.

## Scenes

```
BOOT → GARAGE → VEHICLE SELECT → PAINT BOOTH → REVEAL → BUILD ANALYSIS → STREET RUN → BUILD CARD
```

Three fictional vehicles are included (SERAPH R, TEMPEST VX, MARLIN 88) — original parametric side-view silhouettes rendered as layered 2D canvas art. No 3D, no game assets, no copyrighted material.

## Documentation

Detailed technical documentation lives in [`/docs`](./docs/00-index.md).

- [Architecture](./docs/02-architecture.md)
- [Vehicle Rendering](./docs/05-vehicle-rendering.md)
- [Livery System](./docs/06-livery-system.md)
- [Image Analysis](./docs/07-image-analysis.md)
- [Unlayer Integration](./docs/08-unlayer-integration.md)
- [Scene System](./docs/09-scene-system.md)
- [Testing & Verification](./docs/13-testing-and-verification.md)
- [Deployment](./docs/14-deployment.md)
- [Changelog](./docs/16-changelog.md)

## Technologies

- Next.js (App Router) 16
- React 19 + TypeScript
- Tailwind CSS v4
- Framer Motion (scene transitions, reveal, stat counters)
- [`@unlayer/react-image-editor`](https://github.com/unlayer/react-image-editor) — the paint array itself
- HTML Canvas 2D — vehicle compositor, street environment, build-card export, pixel analysis
- Web Audio API — synthesized UI/garage/street sounds (no audio files)

Everything runs client-side. No backend, no database, no accounts, no payments. An Unlayer `projectId` is **optional** — it is only required for Unlayer's AI features, which this project does not use.

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production checks:

```bash
npm run lint
npm run build
```

## Flow to try

1. Boot screen → **ENTER GARAGE**
2. **SELECT VEHICLE** → pick a platform → **SELECT**
3. **PAINT BOOTH** — draw/text/shapes/stickers on the template, then **Save**
4. Watch the reveal sequence apply the design to the car
5. Read your build stats and classification
6. **TAKE IT OUT** — watch the street reaction (low vs high heat)
7. **SAVE BUILD CARD** to download a PNG of your build

Designs persist in `localStorage`, so a refresh keeps your last livery.

## Project structure

```
app/                 entry, layout, global styles
components/
  experience/        the eight scenes + state orchestrator
  vehicle/           composited vehicle renderer
  effects/           grain, scanlines, fog, backdrop, police lights
  ui/                game buttons, HUD panels, stat bars, count-up
lib/
  vehicle/           parametric vehicle geometry (3 silhouettes)
  livery/            canvas compositor, image analysis, template
  game/              vehicles, classifications, copy, build numbers, context
docs/                living project documentation (see Documentation above)
scripts/             dev-only art/analysis verification tools
```