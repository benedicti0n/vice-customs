import type { Scene } from "@babylonjs/core/scene";
import { getVehicle } from "@/lib/game/vehicles";
import { buildProceduralVehicle } from "./vehicles/builder";
import { LiveryLayer } from "./paint/liveryTexture";
import { DecalManager } from "./paint/decals";
import { detectQuality } from "./quality";
import type { VehicleRig } from "./vehicles/rig";
import type { ViceBuild } from "@/types/build";

export interface MaterializedBuild {
  rig: VehicleRig;
  livery: LiveryLayer;
  decals: DecalManager;
}

/**
 * Materializes a serializable ViceBuild into 3D objects inside a given scene.
 * Every scene (garage, booth, reveal, street, card) rebuilds from the same
 * build data — no per-scene divergence.
 */
export function materializeBuild(scene: Scene, build: ViceBuild): MaterializedBuild {
  const spec = getVehicle(build.vehicleId);
  const quality = detectQuality(false);

  const livery = new LiveryLayer(
    scene,
    quality.liveryResolution,
    Math.max(64, Math.round(quality.liveryResolution / 8)),
    1,
    1,
    build.paint.color
  );
  livery.fillBase(build.paint.color);

  const rig = buildProceduralVehicle(scene, spec, {
    paint: build.paint,
    liveryTexture: livery.texture,
  });

  livery.perimeter = rig.bodyPerimeter;
  livery.carWidth = 1.9;
  livery.redrawAll();

  for (const stroke of build.livery.strokes) {
    if (stroke.points.length >= 2) {
      livery.stampPath(stroke.points, stroke.size, stroke.color, stroke.eraser);
    }
  }

  const decals = new DecalManager(scene, rig);
  for (const instance of build.decals) {
    decals.restore(instance);
  }

  return { rig, livery, decals };
}