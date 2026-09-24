"use client";

import { useEffect, useRef } from "react";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createViceEngine, type RenderBackend } from "@/lib/3d/engine";
import { buildGarageEnvironment, type GarageEnvironment } from "@/lib/3d/environment/garage";
import { materializeBuild } from "@/lib/3d/materializer";
import { CinematicCamera, garageShot, boothShot, revealShot, cardShot, type CameraShot } from "@/lib/3d/camera";
import type { VehicleRig } from "@/lib/3d/vehicles/rig";
import type { LiveryLayer } from "@/lib/3d/paint/liveryTexture";
import type { DecalManager } from "@/lib/3d/paint/decals";
import type { ViceBuild } from "@/types/build";

export type StageMode = "garage" | "booth" | "reveal" | "card";

export interface StageApi {
  engine: Engine | WebGPUEngine;
  scene: Scene;
  backend: RenderBackend;
  rig: VehicleRig;
  livery: LiveryLayer;
  decals: DecalManager;
  camera: CinematicCamera;
  env: GarageEnvironment | null;
  snapshotDataUrl: () => string | null;
}

export interface VehicleStageProps {
  build: ViceBuild;
  mode: StageMode;
  interactive?: boolean;
  onReady?: (api: StageApi) => void;
  onFail?: () => void;
  className?: string;
}

function shotFor(mode: StageMode, target: Vector3): CameraShot {
  if (mode === "garage") return garageShot(target);
  if (mode === "booth") return boothShot(target);
  if (mode === "reveal") return revealShot(target);
  return cardShot(target);
}

export default function VehicleStage({ build, mode, interactive = true, onReady, onFail, className = "" }: VehicleStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let api: StageApi | null = null;

    void (async () => {
      try {
        const handle = await createViceEngine(canvas, {
          preserveDrawingBuffer: mode === "card",
        });
        if (disposed) {
          handle.dispose();
          return;
        }
        const { scene } = handle;

        const materialized = materializeBuild(scene, build);
        const env = buildGarageEnvironment(scene, { mode });
        const camera = new CinematicCamera(scene, canvas, shotFor(mode, materialized.rig.cameraTarget));
        camera.setActive(interactive);

        api = {
          engine: handle.engine,
          scene,
          backend: handle.backend,
          rig: materialized.rig,
          livery: materialized.livery,
          decals: materialized.decals,
          camera,
          env,
          snapshotDataUrl: () => {
            handle.engine.stopRenderLoop();
            scene.render();
            try {
              return canvas.toDataURL("image/png");
            } catch {
              return null;
            } finally {
              startLoop();
            }
          },
        };

        const startLoop = () => {
          handle.engine.runRenderLoop(() => scene.render());
        };
        startLoop();

        scene.onBeforeRenderObservable.add(() => camera.update(1 / 60));

        if (!disposed && api) onReady?.(api);

        if (mode === "card" && !interactive) {
          scene.onBeforeRenderObservable.add(() => {
            camera.camera.alpha += 0.001;
          });
        }
      } catch {
        if (!disposed) onFail?.();
      }
    })();

    return () => {
      disposed = true;
      api?.camera.dispose();
      api?.decals.dispose();
      api?.rig.dispose();
      api?.env?.dispose();
      api?.engine.stopRenderLoop();
      api?.scene.dispose();
      api?.engine.dispose();
      api = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.buildId, mode, interactive]);

  return <canvas ref={canvasRef} className={`block h-full w-full touch-none ${className}`} aria-label="Vehicle view" />;
}