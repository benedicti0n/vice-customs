# 12 — State & Persistence

## GameContext

`lib/game/GameContext.tsx` exposes a `useGame()` hook returning `{ state, actions }`. State lives in a `useReducer` and is mirrored into a ref for use inside callbacks.

### State Shape (`types/game.ts`)

```ts
interface BuildState {
  scene: Scene;
  vehicleId: VehicleId;              // "seraph-r" | "tempest-vx" | "marlin-88"
  liveryDataUrl: string | null;      // exported Unlayer artwork
  compositedUrl: string | null;      // cached composite PNG data URL
  analysis: LiveryAnalysis | null;   // stats + classification
  buildNumber: number;
  muted: boolean;
}
```

### Actions

| Action | Effect |
|--------|--------|
| `SCENE` | set scene |
| `VEHICLE` | set selected vehicle |
| `LIVERY` | store exported data URL |
| `COMPOSITE` | store composited image URL |
| `ANALYSIS` | store analysis result |
| `BUILD_NUMBER` | set build counter |
| `MUTE` | toggle mute |
| `RESET` | new build: clear session, increment build number, scene → garage |

### Composite Invariant

`ensureComposite()` recomputes the vehicle composite whenever `vehicleId` or `liveryDataUrl` changes (memoized per pair). Scenes simply render `state.compositedUrl`.

## Persistent vs. Session State

### Persistent (survives refresh) — `localStorage`

| Key | Holds | Written by |
|-----|-------|-----------|
| `vc-build-number` | incrementing build counter | `nextBuildNumber()` on NEW BUILD; read on boot via `currentBuildNumber()` |
| `vc-last-livery` | last exported livery data URL | `persistLivery()` on save; read on boot via `loadLastLivery()` |

On boot, `GameContext` restores both and recomputes analysis/composite from the restored livery, so a refresh does not destroy the creation.

### Session (in-memory only)

- `scene` — always starts at `boot`
- `compositedUrl` — recomputed on demand
- `analysis` — recomputed from the livery
- `vehicleId` — defaults to SERAPH R each session
- `muted` — in-memory only (deliberately not persisted)

## Why Not More Persistence

The experience is a single-session game; persisting the vehicle choice or mute state would add noise without value. Build number and livery are the only data with meaningful continuity, and both are intentionally scoped.

## SSR Safety

`buildNumber.ts` guards all storage access with `typeof window !== "undefined"` so prerendering never crashes, and the restored livery is applied in an effect (not during render) to avoid hydration mismatches.