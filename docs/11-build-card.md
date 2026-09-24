# 11 — Build Card

## Final Build Card Screen

`components/experience/FinalBuildCard.tsx` renders the closing screen:

```text
VICE//CUSTOMS              BUILD #042
Ocean District             02:57 AM

        [ large customized vehicle image ]

SERAPH R                   HEAT MAGNET
OCEAN DISTRICT SPEC

STYLE 91   STREET REP 78   HEAT 84
[mini bars]

[ CUSTOMIZE AGAIN ]  [ NEW BUILD ]  [ SAVE BUILD CARD ]
```

- The customized vehicle is rendered prominently (up to `min(44vh, 420px)` tall) over a dimmed garage backdrop.
- Build number comes from persisted state (`padBuild` → `#042`).
- Classification color/glow uses the classification palette.
- Stat values animate up with `CountUp`.
- Actions: **CUSTOMIZE AGAIN**, **NEW BUILD**, **SAVE BUILD CARD**.

## PNG Download

`saveCard()` renders a **1200×720** canvas:

1. dark gradient background + frame
2. `VICE//CUSTOMS` wordmark (top-left), `BUILD #042` (top-right)
3. vehicle name + tagline
4. the composited car image (loaded from the cached data URL), drawn large
5. a fade-out gradient under the car so it sits into the frame
6. three stat columns — STYLE, STREET REP, HEAT — each with label, big display number, and color
7. classification text (colored) at bottom-right
8. `OCEAN DISTRICT — VICE COAST` footer

The result is exported via `canvas.toDataURL("image/png")` and downloaded as `vice-customs-build-042.png`.

## Data Included

| Item | Source |
|------|--------|
| Build number | `buildNumber` state (`padBuild`) |
| Vehicle name / tagline | `getVehicle(state.vehicleId)` |
| Car artwork | `state.compositedUrl` (the composited livery render) |
| Stats | `state.analysis` (styleScore, streetRep, policeHeat) |
| Classification | `CLASSIFICATIONS[analysis.personality]` |
| Location | static — "OCEAN DISTRICT — VICE COAST" |

The download works entirely client-side (the car is already a data URL in state, so there is no taint or CORS problem on the canvas).