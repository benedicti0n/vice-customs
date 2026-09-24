# 08 — Unlayer Integration

> **V2 status:** the V2 paint booth replaces Unlayer as the primary editor. The Unlayer booth remains fully implemented and is reachable with `NEXT_PUBLIC_VC_V2_UNLAYER=1` (legacy flag). V1 saved livery images migrate into V2 builds (see [12 — State & Persistence](./12-state-and-persistence.md)).

The paint booth runs the official [`@unlayer/react-image-editor`](https://github.com/unlayer/react-image-editor) wrapper (v1.x).

## Initialization

`PaintBooth` mounts the editor with `next/dynamic` (`ssr: false`):

```tsx
const ImageEditor = dynamic(() => import("@unlayer/react-image-editor"), { ssr: false });

<ImageEditor
  image={state.liveryDataUrl ?? template}   // existing livery or generated 1600×900 sheet
  options={{ theme: "dark", features: { imageEditor: { tools: { ... } } } }}
  onSave={({ dataUrl }) => { applyLivery(dataUrl); setScene("reveal"); }}
  onCancel={() => setScene("garage")}
  onLoadError={() => setPhase("error")}
  onError={() => setPhase("error")}
  minHeight={460}
  style={{ width: "100%", height: "100%" }}
/>
```

The component is remounted per session via a key tied to `buildNumber` and a retry counter, guaranteeing a clean re-initialization on *Customize Again*.

## Input Image / Template

The starting image is generated client-side by `lib/livery/template.ts` (1600×900 body-graphics sheet), or the previously saved livery when the player re-enters to iterate. The editor receives it as a data URL.

## Enabled Tools

All eight tools are enabled:

| Tool | Notes |
|------|-------|
| crop | retained |
| resize | retained |
| filter | emphasized |
| draw | emphasized |
| text | emphasized |
| shapes | emphasized |
| stickers | emphasized |
| frame | retained |

The tool set is fixed at mount (per Unlayer's remount-tier options behavior).

## Save / Cancel

- **Save** → `onSave({ dataUrl, blob })`. The wrapper's result is used directly; only `dataUrl` is consumed (stored, analyzed, composited). Nothing is uploaded.
- **Cancel** → `onCancel()` → return to garage.

## Error Handling

Two channels, both surfaced as an in-world **PAINT ARRAY OFFLINE** panel with a RETRY button:

- `onLoadError` — the editor loaded but the image failed to decode
- `onError` — wrapper-level failure (CDN script load, editor creation)

Retry increments a key and replays the boot sequence.

## Second-Session Reinitialization

*Customize Again* returns to the paint booth; the editor component remounts (new key), the previous livery is passed as the starting image, and editing continues. This is covered by the regression flow.

## CDN / Network Requirement

The wrapper loads the editor's embedded script and assets remotely:

```text
https://cdn.unlayer.com/image-editor/embed.js
```

Consequences:

- The paint booth **requires internet access**
- The editor is client-side only; there is no SSR involvement
- Runtime base URLs can be overridden via `options.env` if the host app bundles the assets

## projectId Behavior

**No `projectId` is currently required.** `projectId` is only necessary for Unlayer's AI Assistant features, which this project does not use. Setting `options.projectId` from an Unlayer console would be required before enabling `features.ai`.

## Editor Surface Rules

Decorative overlays (film grain, chromatic aberration, scanlines) are **removed from the editor area** so the paint machine stays fully usable and unobstructed. They remain present in the shutter/error phases.