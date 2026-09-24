# 04 — Design System

## Palette

Tokens are defined in `app/globals.css` (`:root`) and exposed to Tailwind via `@theme inline`.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#050609` | Page/scene background, near-black |
| `--surface` | `#0b0d10` | Scene surfaces, floors |
| `--panel` | `#10131c` | HUD panels, chrome |
| `--ink` | `#ede9df` | Primary text — warm off-white |
| `--ink-dim` | `#9aa0ad` | Secondary text |
| `--ink-faint` | `#5b6170` | Tertiary/system text |
| `--neon` | `#ff3f8e` | Vice pink — primary accent, active UI |
| `--cyan` | `#39d9e6` | Signal cyan — secondary accent, "online" state |
| `--amber` | `#ffa640` | Warning — heat, street presence |

Tailwind utilities produced: `bg-bg`, `text-ink`, `text-ink-dim`, `text-neon`, `text-cyan`, `text-amber`, `border-cyan/60`, etc.

## Typography

Three typefaces, loaded via `next/font/google`:

| Role | Font | Usage |
|------|------|-------|
| Display | Anton (single weight) | Titles: VICE//CUSTOMS, vehicle names, classifications, big numbers |
| Sans | Inter | Body, labels, paragraphs |
| Mono | JetBrains Mono | System/status text, HUD data, buttons, timestamps |

Discipline:
- Display type is used sparingly and set with deliberate tracking (`tracking-[0.12em]`–`[0.5em]`).
- HUD data is compact mono, uppercase, letter-spaced.
- Not every string is uppercase — only where hierarchy benefits (labels, system text).
- The VICE//CUSTOMS wordmark splits into `VICE` (pink glow) `//` (faint) `CUSTOMS` (cyan glow).

## Spacing

- Scene elements are anchored to screen edges with consistent offsets (6, 8, 20 px families).
- HUD panels use a consistent internal rhythm (`py-3`–`py-7`, `px-5`–`px-8`).
- Related items group tightly; separation is created with hairlines (`border-white/10`, `/5`) rather than padding-only gaps.
- Large negative space is intentional (cinematic framing around the car) and is not filled.

## Button Hierarchy

`components/ui/GameButton.tsx` — one component, three variants:

| Variant | Style | Used for |
|---------|-------|----------|
| `primary` | Pink fill + glow shadow | ENTER GARAGE, PAINT BOOTH, SELECT, TAKE IT OUT, CUSTOMIZE AGAIN |
| `secondary` | Panel fill + hairline border | SELECT VEHICLE, PREV/NEXT, NEW BUILD |
| `ghost` | Text only | SKIP, SAVE BUILD CARD |

All buttons share a clipped-corner silhouette (`btn-clip`), mono uppercase labels, and `hover:scale-1.03` / `tap:scale-0.97` microinteraction. No pill buttons.

## HUD Treatment

`components/ui/HudPanel.tsx` — `hud-clip` corner-cut panel: dark `#0c0e15` at 80% opacity with a hairline border and subtle backdrop blur. Panels feel like machine readouts, not SaaS cards.

## Border Radius Philosophy

Gaming HUD corners are cut, not rounded:
- `hud-clip` / `btn-clip` — clipped corners (polygon), the primary silhouette
- Small 2–6px radii only where a shape genuinely needs it (dots, badges)
- No large rounded rectangles

## Glow Usage

Glow is an **illumination signal**, not decoration:
- `text-glow-neon` / `text-glow-cyan` on the wordmark and classification
- `shadow-[0_0_28px rgba(255,63,142,0.35)]` on primary buttons
- Neon sign, ceiling light bars, head/taillight halos
- Everything else stays flat to preserve contrast between lit and dark areas

## CRT / Grain Rules

- `scanlines`: a 2–4px repeating gradient at `mix-blend-overlay`, used in most scenes but kept subtle
- `film-grain`: animated SVG turbulence at opacity `0.04`–`0.07` — nearly invisible unless noticed
- `chroma`: ±1px red/cyan edge on full-screen overlays, used on boot/reveal/street only
- These are removed from the Unlayer editor surface entirely (see [08 — Unlayer Integration](./08-unlayer-integration.md))

## Motion Principles

- Scene transitions: fade through black (`AnimatePresence mode="wait"`, ~0.35–0.4s)
- Easing: `[0.22, 1, 0.36, 1]` (expo-out) or `[0.16, 1, 0.3, 1]` for reveals — weighty, no bouncy springs
- Camera push/parallax via `useSpring` in the garage backdrop
- Counters use cubic ease-out
- `MotionConfig reducedMotion="user"` honors `prefers-reduced-motion`; CSS animations are also reduced

## What the Design Deliberately Avoids

- SaaS card grids / dashboards
- Generic glassmorphism (blur used only behind HUD panels)
- Excessive multi-stop gradients
- Excessive rounded rectangles / pills
- Cyberpunk UI clutter (gratuitous glyphs, glowing every element)
- Purple AI-startup aesthetics
- Default shadcn/Tailwind component look