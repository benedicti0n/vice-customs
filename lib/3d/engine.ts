import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { Scene } from "@babylonjs/core/scene";
import { Scene as BabylonScene } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { detectQuality, type QualitySettings } from "./quality";

export type RenderBackend = "webgpu" | "webgl";

export interface ViceEngineHandle {
  engine: Engine | WebGPUEngine;
  scene: Scene;
  backend: RenderBackend;
  quality: QualitySettings;
  dispose: () => void;
}

export interface ViceEngineOptions {
  backgroundColor?: Color4;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
}

export async function createViceEngine(
  canvas: HTMLCanvasElement,
  opts: ViceEngineOptions = {}
): Promise<ViceEngineHandle> {
  const bg = opts.backgroundColor ?? new Color4(0.02, 0.02, 0.035, 1);

  const webgpuAvailable = typeof navigator !== "undefined" && Boolean((navigator as { gpu?: unknown }).gpu);

  let engine: Engine | WebGPUEngine;
  let backend: RenderBackend;

  if (webgpuAvailable) {
    try {
      const wgpu = new WebGPUEngine(canvas, { antialias: opts.antialias ?? true, stencil: true });
      await wgpu.initAsync();
      engine = wgpu;
      backend = "webgpu";
    } catch {
      engine = new Engine(canvas, opts.antialias ?? true, {
        preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false,
      });
      backend = "webgl";
    }
  } else {
    engine = new Engine(canvas, opts.antialias ?? true, {
      preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false,
    });
    backend = "webgl";
  }

  const quality = detectQuality(backend === "webgpu");

  const scene = new BabylonScene(engine);
  scene.clearColor = bg;

  const onResize = () => engine.resize();
  window.addEventListener("resize", onResize);

  return {
    engine,
    scene,
    backend,
    quality,
    dispose: () => {
      window.removeEventListener("resize", onResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    },
  };
}