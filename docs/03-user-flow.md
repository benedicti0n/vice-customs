# 03 — User Flow

This is the complete player journey. Each entry describes: **entry condition → user action → state produced → transition destination**.

## Scene Flow

```text
BOOT → GARAGE → VEHICLE SELECT → PAINT BOOTH → REVEAL → ANALYSIS → STREET RUN → FINAL BUILD
            ↑                                                                      │
            └────────────────── NEW BUILD ────────────────────────────────────────┘
                                                        CUSTOMIZE AGAIN ──→ PAINT BOOTH
```

## Boot

- **Entry:** app loads.
- **Sequence:** status lines boot (`INITIALIZING SHOP SYSTEM...`, `PAINT ARRAY....ONLINE`, …), then the VICE//CUSTOMS logo reveal, then the **ENTER GARAGE** CTA.
- **User action:** click **ENTER GARAGE** (or wait — there is no auto-advance past the CTA).
- **State produced:** `scene = "garage"`.
- **Destination:** Garage.

## Garage

- **Entry:** scene transitions from boot with a fluorescent "ignition" flash.
- **Context:** the selected vehicle sits center-stage over a neon garage backdrop. HUD shows Bay 03, a live clock, system serial, and Manny's shop-radio lines. The bottom-right action cluster is the primary control.
- **User actions:**
  - **SELECT VEHICLE** → `scene = "vehicle-select"`
  - **PAINT BOOTH** → `scene = "paint-booth"` (opens with the currently selected vehicle)
- **State produced:** none beyond the scene transition.
- **Destination:** Vehicle Select or Paint Booth.

## Vehicle Selector

- **Entry:** `scene = "vehicle-select"`.
- **Context:** shop-diagnostics panel (model, drivetrain, stat bars) beside a large live vehicle render.
- **User actions:**
  - **← PREVIOUS / NEXT →** (or arrow keys) → cycles `index`, updates preview composite
  - **SELECT** → `selectVehicle(id)`, then `scene = "paint-booth"`
  - **Enter** key behaves as SELECT
- **State produced:** `vehicleId` is set; the composite cache is warmed for the new platform.
- **Destination:** Paint Booth.

## Paint Booth

- **Entry:** `scene = "paint-booth"`.
- **Context:** a shutter sequence ("PAINT ARRAY ONLINE / BODY TEMPLATE ACQUIRED / INK ARRAY WARMING"), then the Unlayer editor mounts full-frame in a diegetic chrome shell (header shows `PAINT ARRAY · SESSION 0042`).
- **User action:** create artwork with Draw / Text / Shapes / Stickers / Filters, then press **Save** (Unlayer's save control). Cancel returns to the garage.
- **State produced:**
  - `liveryDataUrl` set (from `onSave` result)
  - `analysis` computed asynchronously via `analyzeLivery`
  - livery persisted to `localStorage`
  - composite rebuild triggered
- **Destination:** `scene = "reveal"`.

## Reveal

- **Entry:** `scene = "reveal"`.
- **Sequence (automatic):**
  - 0.0s black, fluorescent click
  - status steps: SURFACE PREP → INK ARRAY → CLEAR COAT → CURING (each ~420ms)
  - 1.65s car begins to appear with a light sweep across the body
  - 3.4s "CUSTOM BUILD COMPLETE" + vehicle name/tagline
  - "ANALYZING BUILD..." → 5.6s auto-advance
- **User action:** optional **SKIP** (available after ~1s) jumps straight to the complete label and then analysis.
- **State produced:** `scene = "analysis"`.
- **Destination:** Analysis.

## Analysis

- **Entry:** `scene = "analysis"`.
- **Context:** the customized car on the left; a telemetry panel on the right shows **BUILD CLASS** (hero) then animated STYLE / STREET REP / SUBTLETY / POLICE HEAT bars, street-presence stars, and Manny's commentary.
- **User action:** **TAKE IT OUT**.
- **State produced:** `scene = "street-run"`.
- **Destination:** Street Run.

## Street Run

- **Entry:** `scene = "street-run"`.
- **Context:** a canvas-driven cinematic drive: converging road, parallax city, palms, neon signs, light pools, camera shake. HUD shows VICE COAST / OCEAN DISTRICT, 126 MPH, heat stars, and a scanner feed. High heat adds police-light reflections + siren.
- **User action:** **SKIP** optional. The run lasts 13s, freezes, then auto-advances.
- **State produced:** `scene = "complete"`.
- **Destination:** Final Build Card.

## Final Card

- **Entry:** `scene = "complete"`.
- **Context:** large customized car, VICE//CUSTOMS branding, build number, vehicle name, classification, three key stats, location/time.
- **User actions:**
  - **CUSTOMIZE AGAIN** → `scene = "paint-booth"` (editor remounts fresh; livery preserved as the starting image)
  - **NEW BUILD** → `RESET` action: build number increments, livery/analysis/composite cleared, `scene = "garage"`
  - **SAVE BUILD CARD** → canvas-generated PNG download (see [11 — Build Card](./11-build-card.md))
- **State produced:** per action above.
- **Destination:** Paint Booth or Garage.

## Customize Again

Re-enters the paint booth with the existing livery as the editor's starting image, so the player can iterate. The editor is fully reinitialized (fresh mount) — this path is verified by the regression flow.

## New Build

Resets the session: `liveryDataUrl`, `compositedUrl`, and `analysis` become `null`, `buildNumber` increments, and the player lands back in the garage with a clean slate.