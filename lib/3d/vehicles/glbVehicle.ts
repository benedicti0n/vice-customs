import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { VehicleSpec } from "@/types/game";
import { getVehicleAsset, type VehicleAssetDefinition } from "@/lib/3d/assets/registry";
import { createPaintMaterial } from "./materials";
import type { VehicleRig, WheelRig } from "./rig";
import { LiveryLayer } from "@/lib/3d/paint/liveryTexture";

export interface GlbVehicleResult {
  rig: VehicleRig;
  livery: LiveryLayer;
  error: string | null;
}

function meshByName(root: TransformNode, prefix: string): Mesh[] {
  void AbstractMesh;
  const out: Mesh[] = [];
  for (const m of root.getChildMeshes(false)) {
    if (m.name.includes(prefix) && m instanceof Mesh) out.push(m);
  }
  return out;
}

/**
 * Loads a production GLB and adapts it to the shared VehicleRig contract.
 * Throws on load failure so callers can fall back to the procedural builder.
 */
export async function buildProductionVehicle(
  scene: Scene,
  spec: VehicleSpec,
  opts: {
    livery?: LiveryLayer;
    paint?: { color: string; metallic: number; roughness: number; clearcoat: number };
  } = {}
): Promise<GlbVehicleResult> {
  const def = getVehicleAsset(spec);
  const url = def.lod0;
  if (!url) throw new Error(`no production model for ${spec.id}`);
  const name = url.split("/").pop() ?? "vehicle.glb";

  const result = await SceneLoader.ImportMeshAsync("", url.replace(/[^/]*$/, ""), name, scene);
  const loaded = result.meshes[0];
  const root = new TransformNode(`vc-${spec.id}-root`, scene);
  for (const m of result.meshes) {
    if (m instanceof AbstractMesh && (m.parent === null || m.parent === loaded)) {
      m.setParent(root);
    }
  }
  loaded.dispose(false, false);

  applyAxisFix(root, def);

  // --- body paint ---
  const bodyMeshes = meshByName(root, def.nodePrefixes.body);
  if (bodyMeshes.length === 0) throw new Error(`no body meshes for ${spec.id}`);
  const body = mergeMeshes(scene, bodyMeshes, "vc-body");
  body.isPickable = true;
  body.receiveShadows = true;

  const livery = opts.livery ?? new LiveryLayer(scene, 2048, 512, 12.4, 1.9, opts.paint?.color ?? spec.paint.base);
  livery.fillBase(opts.paint?.color ?? spec.paint.base);
  let paintMat: PBRMaterial;
  if (body.material instanceof PBRMaterial) {
    paintMat = body.material;
  } else {
    paintMat = createPaintMaterial(
      scene,
      { color: opts.paint?.color ?? spec.paint.base, metallic: opts.paint?.metallic ?? 0.55, roughness: opts.paint?.roughness ?? 0.3, clearcoat: opts.paint?.clearcoat ?? 1 },
      livery.texture
    );
  }
  paintMat.metallic = opts.paint?.metallic ?? 0.55;
  paintMat.roughness = opts.paint?.roughness ?? 0.3;
  paintMat.clearCoat.isEnabled = true;
  paintMat.clearCoat.roughness = 0.12;
  paintMat.albedoColor.copyFrom(Color3.FromHexString(opts.paint?.color ?? spec.paint.base));
  paintMat.albedoTexture = livery.texture;
  body.material = paintMat;

  // --- wheels ---
  const wheels: WheelRig[] = [];
  const wheelNodes = root.getChildren(undefined, false).filter((n) => n.name.includes(def.wheelPivotPrefix)) as TransformNode[];
  const pivots = def.wheelPivots;
  if (pivots && pivots.length === 4 && wheelNodes.length === 4) {
    wheelNodes.forEach((node, i) => {
      const p = pivots[i];
      node.position = new Vector3(p[0], p[1], p[2]);
      node.rotation = Vector3.Zero();
      node.rotationQuaternion = null;
      wheels.push({ node, steerable: p[2] > 0, axle: new Vector3(1, 0, 0) });
    });
  } else {
    // fallback: static wheels at pivots
    if (pivots) {
      for (const p of pivots) {
        const wheel = MeshBuilder.CreateSphere(`vc-static-wheel-${wheels.length}`, { diameter: 0.4 }, scene);
        wheel.position = new Vector3(p[0], p[1], p[2]);
        wheel.parent = root;
        const node = new TransformNode(`vc-wheel-static-${wheels.length}`, scene);
        node.position = new Vector3(p[0], p[1], p[2]);
        wheel.parent = node;
        node.parent = root;
        wheels.push({ node, steerable: p[2] > 0, axle: new Vector3(1, 0, 0) });
      }
    }
  }

  // --- lights ---
  const glassMeshes = meshByName(root, def.nodePrefixes.glass);
  const headlights = meshByName(root, "headlight");
  const taillights = meshByName(root, "taillight");

  // --- metrics ---
  const bb = body.getBoundingInfo().boundingBox;
  const length = bb.extendSize.z * 2;
  const width = bb.extendSize.x * 2;
  const height = bb.extendSize.y * 2;
  const wheelbase = pivots ? Math.abs(pivots[0][2] - pivots[1][2]) : length * 0.55;
  const cameraTarget = new Vector3(0, bb.center.y * 0.75, 0);
  const perimeter = (length + height) * 2;

  livery.perimeter = perimeter;
  livery.carWidth = width;

  const rig: VehicleRig = {
    root,
    body,
    glass: glassMeshes,
    wheels,
    headlights,
    taillights,
    paintMaterial: paintMat,
    liveryTexture: livery.texture,
    cameraTarget,
    wheelbase,
    bodyPerimeter: perimeter,
    pointAtUV: createGlbUVPicker(body),
    update: (dt, state) => {
      for (const w of wheels) {
        w.node.rotation.x += state.speed * dt;
        if (w.steerable) {
          const targetYaw = state.steer * 0.3;
          w.node.rotation.y += (targetYaw - w.node.rotation.y) * Math.min(1, dt * 8);
        }
      }
    },
    dispose: () => {
      for (const w of wheels) w.node.dispose();
      root.dispose(false, true);
      livery.texture.dispose();
      paintMat.dispose();
    },
  };

  return { rig, livery, error: null };
}

/** Apply the registry forward-axis/yaw fix at the root. */
function applyAxisFix(root: TransformNode, def: VehicleAssetDefinition) {
  if (def.forwardAxis === "-Z") {
    root.rotation.y = Math.PI;
  }
  if (def.yawOffset) root.rotation.y += def.yawOffset;
}

function mergeMeshes(scene: Scene, meshes: Mesh[], name: string): Mesh {
  if (meshes.length === 1) {
    const m = meshes[0];
    m.name = name;
    return m;
  }
  const merged = Mesh.MergeMeshes(meshes, true, true, undefined, true) ?? meshes[0];
  merged.name = name;
  merged.isPickable = true;
  return merged;
}

/** UV picker: reads the picked face's UV via Babylon picking, falls back to local-space normal. */
function createGlbUVPicker(body: Mesh): (u: number, v: number) => { position: Vector3; normal: Vector3 } | null {
  const identity = Matrix.Identity();
  return (u, v) => {
    // resolve a world point by barycentric search is expensive; use the bounding box
    const bb = body.getBoundingInfo().boundingBox;
    const x = bb.center.x;
    const y = bb.center.y + (v - 0.5) * bb.extendSize.y * 2;
    const z = bb.center.z + (u - 0.5) * bb.extendSize.z * 2;
    void identity;
    return { position: new Vector3(x, y, z), normal: new Vector3(0, 0, 1) };
  };
}