# Asset Manifest

## Hero vehicles

| Production target | File | Approx. source triangles | Source size | Creator | License/status |
| --- | --- | ---: | ---: | --- | --- |
| SERAPH R | `cars/seraph-r/seraph-r-source.glb` | 300,736 | 9.3 MiB | Unity Fan | Creator-declared public domain/CC0 |
| TEMPEST VX | `cars/tempest-vx/tempest-vx-source.glb` | 293,182 | 10.1 MiB | Unity Fan | Creator-declared public domain/CC0 |
| MARLIN 88 | `cars/marlin-88/marlin-88-source.glb` | 657,558 | 19.8 MiB | Renafox | CC BY 4.0 |
| Alternate | `cars/alternate/concept-car-037-source.glb` | 198,296 | 6.9 MiB | Unity Fan | Creator-declared public domain/CC0 |

All four models need production cleanup. Expected work includes removing or replacing badges, correcting scale/orientation, generating semantic mesh maps, creating usable wheel pivots, identifying the body-paint surfaces, producing LODs, and optimizing materials and textures.

## Garage

| File or folder | Contents | Intended use |
| --- | --- | --- |
| `environments/mannys-garage/base/parking-garage-source.glb` | 679,140-triangle scanned parking garage | Spatial shell and concrete realism for Bay 03 |
| `environments/mannys-garage/dressing/OGA_industrial_a52_version_baked_models/` | Blender source plus baked PBR textures | Selective clutter: garage doors, tanks, vents, containers, pipes, ladders, terminals, roof machinery |
| `lighting/workshop_2k.hdr` | 2K workshop HDRI | Garage reflections and image-based lighting |

Do not load the whole garage and the whole industrial pack at runtime. Select a compact playable bay, delete invisible geometry, and export only the props used by the authored scene.

## VICE Coast

| Folder | Source set | Intended use |
| --- | --- | --- |
| `environments/vice-coast/roads/` | City Roads GLB pack | Curves, intersections, bridge pieces, sidewalks, lamps, barriers |
| `environments/vice-coast/industrial/` | Industrial City GLB pack | Ocean District, warehouses, harbor silhouettes |
| `environments/vice-coast/commercial/` | Commercial City GLB pack | Little Vice, Downtown, skyline and shop blocks |
| `environments/vice-coast/traffic/` | Car Kit GLB pack | Cheap parked cars, distant traffic, cones and debris |
| `lighting/abandoned_parking_2k.hdr` | 2K parking HDRI | Street/parking reflections and secondary lighting reference |

The city kits are intentionally light enough for background and streamed chunks. They are not final art. Rework materials, add VICE fictional brands, use surface decals and grime, and mix foreground PBR props with midground modules and distant silhouettes.

## Suggested runtime budget

| Runtime group | Target compressed transfer |
| --- | ---: |
| Selected hero vehicle, LOD0 | 12–25 MiB |
| Hero vehicle LOD1 | 4–10 MiB |
| Manny's Garage playable set | 20–35 MiB |
| Shared surface/material library | 15–25 MiB |
| One VICE Coast sector | 15–35 MiB |
| Traffic/prop pool | Streamed and instanced |

These are targets, not reasons to degrade close-up quality. Load the selected vehicle and garage first; preload booth assets in the garage; preload the first street sector during Reveal; stream subsequent sectors during Street Run.

