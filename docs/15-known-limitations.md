# 15 — Known Limitations

Honest assessment of the current implementation. These are accepted trade-offs, not bugs.

## Current Limitations

| Limitation | Detail |
|------------|--------|
| Stylized 2D vehicle | The car is layered 2D canvas art, not a 3D model — it reads well at scene scale but will not survive a zoomed pixel inspection like a real render would |
| Side-view rendering | Only a profile view exists; there is no front/three-quarter camera |
| Single-quad livery mapping | Artwork maps to one quadrilateral (affine transform); it cannot wrap body curvature or flow over panel seams |
| No true UV mapping | The livery is not UV-mapped onto a 3D surface |
| No true 3D curvature | Curvature is faked with gradients/shadows |
| Approximate floor reflection | The garage "reflection" is a blurred mirrored strip, not a true mirror |
| Repeating street silhouettes | Street-run building/palm shapes are generated procedurally and repeat |
| Editor requires internet | Unlayer loads its embed script + assets from a CDN; offline judges cannot reach the paint booth |
| Desktop-first | Layout is tuned for desktop/laptop; mobile works but is secondary |
| Cinematic, not drivable | The street run is an animated illusion with no physics or steering |

## Possible Future Improvements

(Not required for the challenge — listed for reference.)

- A real 3D renderer (Three.js / React Three Fiber) with true UV livery mapping and per-pixel light response
- Perspective-mesh livery warping (splitting the region into strips or a grid) for believable door curvature
- Additional body panels for livery placement (hood, roof, rear quarter)
- More vehicle platforms and body styles
- A true reflective floor pass (mirror camera, rendered at reduced resolution)
- Non-repeating street geometry (pre-authored parallax layers)
- Offline-bundled Unlayer assets so the booth works without network
- Mobile-layout pass tuned for small screens

None of these are treated as pending scope for the challenge submission.