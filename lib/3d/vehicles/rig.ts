import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { VehicleSpec } from "@/types/game";

/**
 * Vehicle asset contract.
 *
 * Production GLB files can be dropped in later; this interface is what gameplay
 * binds to. Mesh-name-agnostic: a VehicleDefinition maps logical parts to meshes.
 */
export interface VehicleDefinition {
  id: string;
  name: string;
  modelUrl: string | null; // GLB path when production assets exist
  bodyMeshes: string[];
  glassMeshes: string[];
  wheelNodes: string[];
  headlightNodes: string[];
  taillightNodes: string[];
  paintMaterialSlots: string[];
  cameraTargets: { garage: Vector3; booth: Vector3; reveal: Vector3; card: Vector3 };
  wheelbase: number;
  width: number;
  stats: VehicleSpec["stats"];
}

export interface WheelRig {
  node: TransformNode;
  steerable: boolean;
  axle: Vector3;
}

export interface VehicleRig {
  root: TransformNode;
  body: Mesh;
  glass: Mesh[];
  wheels: WheelRig[];
  headlights: Mesh[];
  taillights: Mesh[];
  paintMaterial: PBRMaterial;
  liveryTexture: DynamicTexture | null;
  cameraTarget: Vector3;
  wheelbase: number;
  /** perimeter length of the body cross-section (world units) */
  bodyPerimeter: number;
  /** mapping uv (0..1) to a world point on the body surface */
  pointAtUV: (u: number, v: number) => { position: Vector3; normal: Vector3 } | null;
  update: (dt: number, state: { speed: number; steer: number }) => void;
  dispose: () => void;
}

export interface VehicleBuildOptions {
  liveryTexture?: DynamicTexture | null;
  paint?: { color: string; metallic: number; roughness: number; clearcoat: number };
  initialSteer?: number;
}