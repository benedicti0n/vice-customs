import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

interface KitEntry {
  roots: TransformNode[];
  meshes: Mesh[];
}

const kitCache = new Map<string, KitEntry>();

export interface KitOptions {
  /** scale per-vehicle tuning for kit content */
  scale?: number;
}

/**
 * Loads a city-kit GLB once per scene and caches the meshes so repeated
 * scenes (garage → street → card) don't re-download or re-parse.
 */
export async function loadKit(scene: Scene, path: string, opts: KitOptions = {}): Promise<KitEntry> {
  const cached = kitCache.get(path);
  if (cached) return cached;
  const name = path.split("/").pop() ?? "kit.glb";
  const result = await SceneLoader.ImportMeshAsync("", path.replace(/[^/]*$/, ""), name, scene);
  const roots: TransformNode[] = [];
  const meshes: Mesh[] = [];
  for (const m of result.meshes) {
    if (m instanceof Mesh) meshes.push(m);
  }
  for (const n of result.transformNodes ?? []) roots.push(n);
  const scale = opts.scale ?? 1;
  if (scale !== 1) {
    for (const m of meshes) m.scaling.scaleInPlace(scale);
  }
  const entry: KitEntry = { roots, meshes };
  kitCache.set(path, entry);
  return entry;
}

export function instanceKit(source: KitEntry, name: string): InstancedMesh[] {
  const out: InstancedMesh[] = [];
  for (const m of source.meshes) {
    if (!m.isVisible) continue;
    const inst = m.createInstance(`${name}-${m.name}`);
    out.push(inst);
  }
  return out;
}

export function disposeKit(path: string): void {
  const entry = kitCache.get(path);
  if (!entry) return;
  for (const m of entry.meshes) m.dispose();
  for (const r of entry.roots) r.dispose();
  kitCache.delete(path);
}

export function clearKitCache(scene: Scene): void {
  for (const [path, entry] of kitCache) {
    let belongs = false;
    for (const m of entry.meshes) {
      if (m.getScene() === scene) {
        belongs = true;
        break;
      }
    }
    if (belongs) {
      for (const m of entry.meshes) m.dispose();
      for (const r of entry.roots) r.dispose();
      kitCache.delete(path);
    }
  }
}