# 09 — Scene System

**V2:** scenes keep the same state machine and transitions. The physical presentation of Garage / Paint Booth / Reveal / Analysis / Street Run / Final Card is now 3D (see [02 — Architecture](./02-architecture.md)). The Unlayer paint booth is legacy-flagged; the V2 booth is the default path.

## State Machine

`types/game.ts`:

```ts
export type Scene =
  | "boot"
  | "garage"
  | "vehicle-select"
  | "paint-booth"
  | "reveal"
  | "analysis"
  | "street-run"
  | "complete";
```

The machine lives in `lib/game/GameContext.tsx` as a `useReducer` with an explicit `BuildState` and typed `BuildAction`s.

## Valid Transitions

```text
boot ────────────→ garage ──────────→ vehicle-select ──→ paint-booth
                                                  │           │
                    complete ←── street-run ←── analysis ←── reveal ←──┘
                      │  │
                      │  └──→ paint-booth        (CUSTOMIZE AGAIN)
                      └──────→ garage            (NEW BUILD)
```

Explicit transitions implemented by the context API:

| From | Action | To | Notes |
|------|--------|----|----|
| boot | setScene("garage") | garage | ENTER GARAGE |
| garage | setScene("vehicle-select") | vehicle-select | SELECT VEHICLE |
| garage | setScene("paint-booth") | paint-booth | PAINT BOOTH |
| vehicle-select | selectVehicle + setScene("paint-booth") | paint-booth | SELECT |
| paint-booth | applyLivery + setScene("reveal") | reveal | Unlayer Save |
| paint-booth | setScene("garage") | garage | Unlayer Cancel |
| reveal | setScene("analysis") | analysis | auto-advance or skip |
| analysis | setScene("street-run") | street-run | TAKE IT OUT |
| street-run | setScene("complete") | complete | auto-advance or skip |
| complete | setScene("paint-booth") | paint-booth | CUSTOMIZE AGAIN |
| complete | newBuild (RESET) | garage | NEW BUILD |

## Transition Ownership

- **Scenes never navigate each other** — they call context actions (`setScene`, `applyLivery`, `selectVehicle`, `newBuild`), and the reducer owns the resulting state.
- Timed transitions (reveal, street run) are owned by each scene's own `useEffect` timers, cleaned up on unmount.

## Invalid-State Prevention

- `setScene` no-ops if the scene is unchanged.
- `applyLivery` requires a real data URL.
- `newBuild` clears `liveryDataUrl`, `compositedUrl`, and `analysis` before returning to the garage, so the street run cannot start with stale analysis.
- Reveal/analysis/street/complete only run after a livery exists (the flow is sequential by construction).

## Scene Animation Handling

`components/experience/Experience.tsx` wraps scenes in `AnimatePresence mode="wait"` with a 0.35–0.4s fade-through-black. `MotionConfig reducedMotion="user"` disables motion for reduced-motion users. Each scene may run its own entrance choreography (garage ignition flash, reveal sweep, etc.).

## Customize Again

From `complete`, CUSTOMIZE AGAIN → `paint-booth`. The editor remounts fresh (keyed by build number), the existing livery becomes the starting image, and `analysis`/`composite` recompute after the next save.

## New Build

From `complete`, NEW BUILD dispatches `RESET`:

```ts
case "RESET":
  return { ...initialState, scene: "garage", buildNumber: nextBuildNumber() };
```

Session state is cleared; build number increments; the player lands in the garage.