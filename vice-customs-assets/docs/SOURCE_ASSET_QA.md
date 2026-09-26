# Source Asset QA

The five primary GLBs were checked with glTF-Transform/glTF Validator before packaging.

| Source asset | Validation result | Action |
| --- | --- | --- |
| SERAPH R source | Pass | Inspect and optimize; no source-format blocker found |
| TEMPEST VX source | Pass | Inspect and optimize; no source-format blocker found |
| Concept Car 037 alternate | Pass | Inspect and optimize; no source-format blocker found |
| Parking Garage source | Pass | Crop, clean, optimize, and author the playable bay |
| MARLIN 88 source | Needs repair | Validator reports `ANIMATION_SAMPLER_ACCESSOR_WITH_BYTESTRIDE` on an animation output accessor |

The MARLIN source error is repairable during the mandatory cleanup/export stage. Inspect whether the source animation is useful. If it is not needed, remove it before the production export. If it is needed, re-export the animation with a tightly packed output accessor and validate again. Do not ship the uncorrected source GLB as the production asset.

Passing structural validation does not mean an asset is production-ready. All sources still require semantic mesh mapping, branding review, scale/orientation normalization, material work, LOD generation, compression, runtime testing, and visual review.

