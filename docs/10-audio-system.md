# 10 — Audio System

`lib/sound.ts` is a singleton Web Audio engine. There are **no audio files** — every sound is synthesized with oscillators and filtered noise, so there are no copyrighted assets to clear.

## Core Primitives

| Primitive | Implementation |
|-----------|----------------|
| `osc(type, freq, dur, gain, slideTo?, when?)` | One oscillator with a fast attack and exponential release |
| `noise(dur, gain, filterFreq, filterType?, when?)` | Looped white-noise buffer through a biquad filter |
| `startLoop(name, build)` | Persistent source+gain loop managed by name (for ambience/engine) |

## User-Interaction Requirement

Per browser autoplay policy, the `AudioContext` is created **lazily** — `sound.unlock()` is called on the first `pointerdown`/`keydown`, and again on every button click. No sound plays before the user interacts with the page.

## Mute

`sound.setMuted(bool)` scales the master gain to 0. The mute flag lives in `BuildState.muted` and is toggled by the persistent mute button rendered by `Experience`; the engine restores the gain whenever the flag changes.

## Effects Inventory

| Effect | Used in |
|--------|---------|
| `click` | UI button presses |
| `select` | Vehicle select, editor mount |
| `cancel` | Editor cancel |
| `whoosh` | Vehicle selector enter |
| `thump` / `heavyThump` | Scene transitions, reveal complete |
| `boot` / `beep` | Boot screen status ticks |
| `scanner` | Garage, analysis, street scanner chatter |
| `shutter` | Paint booth boot, reveal start |
| `flicker` | Fluorescent instability |
| `reveal` | The paint-reveal chime |
| `engineStart` / `engineLoop` | Garage ambience, analysis, street |
| `roadLoop` / `windLoop` | Street run |
| `sirenLoop` | High-heat street run |

## Loop Management

- `engineLoop(strength)` — layered saw/square oscillators through a lowpass, gain proportional to strength
- `roadLoop(speed)` — filtered noise whose playback rate scales with speed
- `sirenLoop` — LFO-modulated saw (wail)
- `stopAll()` clears every active loop on scene exit so ambience never leaks across scenes

## Design Notes

- Volumes are deliberately subtle (gains in the 0.02–0.35 range) — the audio is ambience, not a soundtrack.
- Loops are only started after the user has entered a scene, and stopped on unmount.
- The engine is feature-detected (`webkitAudioContext` fallback); if no AudioContext exists, every call safely no-ops.