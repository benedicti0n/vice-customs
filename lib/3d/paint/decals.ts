import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3, Quaternion, Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Ray } from "@babylonjs/core/Culling/ray";
import type { Scene } from "@babylonjs/core/scene";
import type { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { getDecalTexture, DECAL_PRESETS, type DecalMaterialId } from "./presets";
import { makeDecalMaterial, makeEmissiveDecalMaterial, makeChromeDecalMaterial, makeReflectiveDecalMaterial } from "@/lib/3d/vehicles/materials";
import type { VehicleRig } from "@/lib/3d/vehicles/rig";

export interface DecalInstance {
  id: string;
  assetId: string;
  vehicleId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: number;
  opacity: number;
  tint: string;
  material: DecalMaterialId;
  layerIndex: number;
}

let decalSeq = 0;

export function nextDecalId(): string {
  decalSeq += 1;
  return `d${Date.now().toString(36)}${decalSeq}`;
}

/** Orient a flat decal so its face matches the surface normal. */
export function orientationFromNormal(normal: Vector3, upHint: Vector3 = new Vector3(0, 1, 0)): Quaternion {
  const n = normal.clone().normalize();
  let right = Vector3.Cross(upHint, n);
  if (right.lengthSquared() < 1e-4) right = new Vector3(1, 0, 0);
  right.normalize();
  const fwd = Vector3.Cross(n, right).normalize();
  const m = new Matrix();
  Matrix.FromXYZAxesToRef(right, n, fwd, m);
  const q = new Quaternion();
  Quaternion.FromRotationMatrixToRef(m, q);
  return q;
}

export class DecalManager {
  private scene: Scene;
  private rig: VehicleRig;
  private meshes = new Map<string, Mesh>();
  private instances = new Map<string, DecalInstance>();
  private materials: PBRMaterial[] = [];

  constructor(scene: Scene, rig: VehicleRig) {
    this.scene = scene;
    this.rig = rig;
  }

  private buildMesh(instance: DecalInstance): Mesh {
    const preset = DECAL_PRESETS.find((p) => p.id === instance.assetId) ?? DECAL_PRESETS[0];
    const texture = getDecalTexture(this.scene, instance.assetId, instance.tint);
    let mat: PBRMaterial;
    if (instance.material === "emissive") mat = makeEmissiveDecalMaterial(this.scene, texture, Color3.FromHexString(instance.tint));
    else if (instance.material === "chrome") mat = makeChromeDecalMaterial(this.scene, texture);
    else if (instance.material === "reflective") mat = makeReflectiveDecalMaterial(this.scene, texture);
    else mat = makeDecalMaterial(this.scene, texture);
    if (instance.material === "painted") {
      mat.metallic = 0.6;
      mat.roughness = 0.3;
    }
    mat.alpha = instance.opacity;

    this.materials.push(mat);

    const mesh = MeshBuilder.CreateBox(
      `vc-decal-${instance.assetId}`,
      { width: preset.size, height: preset.size / preset.aspect, depth: 0.002 },
      this.scene
    );
    mesh.material = mat;
    mesh.parent = this.rig.root;
    mesh.position = new Vector3(instance.position[0], instance.position[1], instance.position[2]);
    mesh.rotationQuaternion = new Quaternion(instance.rotation[0], instance.rotation[1], instance.rotation[2], instance.rotation[3]);
    mesh.scaling = new Vector3(instance.scale, instance.scale / preset.aspect, instance.scale);
    mesh.isPickable = true;
    mesh.metadata = { decalId: instance.id };
    return mesh;
  }

  placeAtUV(u: number, v: number, assetId: string, tint: string, material: DecalMaterialId, offset = 0.007): DecalInstance | null {
    const hit = this.rig.pointAtUV(u, v);
    if (!hit) return null;
    const inv = this.rig.root.getWorldMatrix().invert();
    const localPos = Vector3.TransformCoordinates(hit.position, inv);
    const localNormal = Vector3.TransformNormal(hit.normal, inv).normalize();
    const q = orientationFromNormal(localNormal);
    const instance: DecalInstance = {
      id: nextDecalId(),
      assetId,
      vehicleId: this.rig.root.name,
      position: [localPos.x + localNormal.x * offset, localPos.y + localNormal.y * offset, localPos.z + localNormal.z * offset],
      rotation: [q.x, q.y, q.z, q.w],
      scale: 1,
      opacity: 1,
      tint,
      material,
      layerIndex: this.instances.size,
    };
    this.meshes.set(instance.id, this.buildMesh(instance));
    this.instances.set(instance.id, instance);
    return instance;
  }

  snapToSurface(instance: DecalInstance, u: number, v: number, offset = 0.007): void {
    const hit = this.rig.pointAtUV(u, v);
    const mesh = this.meshes.get(instance.id);
    if (!hit || !mesh) return;
    const inv = this.rig.root.getWorldMatrix().invert();
    const localPos = Vector3.TransformCoordinates(hit.position, inv);
    const localNormal = Vector3.TransformNormal(hit.normal, inv).normalize();
    mesh.position.copyFromFloats(localPos.x + localNormal.x * offset, localPos.y + localNormal.y * offset, localPos.z + localNormal.z * offset);
    mesh.rotationQuaternion = orientationFromNormal(localNormal);
    instance.position = [mesh.position.x, mesh.position.y, mesh.position.z];
    instance.rotation = [mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w];
  }

  moveAlongRay(instance: DecalInstance, ray: Ray): boolean {
    const mesh = this.meshes.get(instance.id);
    if (!mesh) return false;
    const pick = ray.intersectsMesh(this.rig.body, false);
    if (!pick.hit || !pick.pickedPoint || !pick.getNormal) return false;
    const rawNormal = pick.getNormal(true);
    if (!rawNormal) return false;
    const worldNormal = rawNormal.normalize();
    const inv = this.rig.root.getWorldMatrix().invert();
    const localPos = Vector3.TransformCoordinates(pick.pickedPoint, inv);
    const localNormal = Vector3.TransformNormal(worldNormal, inv).normalize();
    mesh.position.copyFromFloats(localPos.x + localNormal.x * 0.007, localPos.y + localNormal.y * 0.007, localPos.z + localNormal.z * 0.007);
    mesh.rotationQuaternion = orientationFromNormal(localNormal);
    if (!mesh.rotationQuaternion) return false;
    instance.position = [mesh.position.x, mesh.position.y, mesh.position.z];
    instance.rotation = [mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w];
    return true;
  }

  rotate(instance: DecalInstance, degrees: number): void {
    const mesh = this.meshes.get(instance.id);
    if (!mesh?.rotationQuaternion) return;
    const n = this.normalOf(mesh);
    const delta = Quaternion.RotationAxis(n, (degrees * Math.PI) / 180);
    mesh.rotationQuaternion = delta.multiply(mesh.rotationQuaternion);
    instance.rotation = [mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w];
  }

  scaleBy(instance: DecalInstance, factor: number): void {
    const mesh = this.meshes.get(instance.id);
    if (!mesh) return;
    const preset = DECAL_PRESETS.find((p) => p.id === instance.assetId) ?? DECAL_PRESETS[0];
    instance.scale = Math.max(0.25, Math.min(6, instance.scale * factor));
    mesh.scaling = new Vector3(instance.scale, instance.scale / preset.aspect, instance.scale);
  }

  setOpacity(instance: DecalInstance, opacity: number): void {
    const mesh = this.meshes.get(instance.id);
    if (!mesh?.material) return;
    if (!mesh.material) return;
    instance.opacity = Math.max(0.1, Math.min(1, opacity));
    mesh.material.alpha = instance.opacity;
  }

  setTint(instance: DecalInstance, tint: string): void {
    const mesh = this.meshes.get(instance.id);
    if (!mesh) return;
    const tex = getDecalTexture(this.scene, instance.assetId, tint);
    instance.tint = tint;
    (mesh.material as PBRMaterial).albedoTexture = tex;
    if (instance.material === "emissive") {
      (mesh.material as PBRMaterial).emissiveColor = Color3.FromHexString(tint);
    }
  }

  setMaterial(instance: DecalInstance, material: DecalMaterialId): void {
    const mesh = this.meshes.get(instance.id);
    if (!mesh) return;
    instance.material = material;
    const old = mesh.material as PBRMaterial;
    const texture = getDecalTexture(this.scene, instance.assetId, instance.tint);
    let mat: PBRMaterial;
    if (material === "emissive") mat = makeEmissiveDecalMaterial(this.scene, texture, Color3.FromHexString(instance.tint));
    else if (material === "chrome") mat = makeChromeDecalMaterial(this.scene, texture);
    else if (material === "reflective") mat = makeReflectiveDecalMaterial(this.scene, texture);
    else mat = makeDecalMaterial(this.scene, texture);
    if (material === "painted") {
      mat.metallic = 0.6;
      mat.roughness = 0.3;
    }
    mat.alpha = instance.opacity;

    mesh.material = mat;
    this.materials.push(mat);
    old.dispose();
  }

  duplicate(instance: DecalInstance): DecalInstance {
    const copy: DecalInstance = {
      ...instance,
      id: nextDecalId(),
      layerIndex: this.instances.size,
      position: [instance.position[0] + 0.08, instance.position[1], instance.position[2] + 0.04],
    };
    this.restore(copy);
    return copy;
  }

  /** Rebuild a decal mesh at its exact stored transform (used when loading a build). */
  restore(instance: DecalInstance): void {
    this.meshes.set(instance.id, this.buildMesh(instance));
    this.instances.set(instance.id, instance);
  }

  remove(instance: DecalInstance): void {
    const mesh = this.meshes.get(instance.id);
    if (mesh) mesh.dispose();
    this.meshes.delete(instance.id);
    this.instances.delete(instance.id);
  }

  get(id: string): DecalInstance | null {
    return this.instances.get(id) ?? null;
  }

  private normalOf(mesh: Mesh): Vector3 {
    if (!mesh.rotationQuaternion) return new Vector3(0, 1, 0);
    const z = new Vector3(0, 0, 1);
    const n = z.rotateByQuaternionToRef(mesh.rotationQuaternion, new Vector3()).normalize();
    return n.lengthSquared() < 1e-4 ? new Vector3(0, 1, 0) : n;
  }

  get count(): number {
    return this.instances.size;
  }

  list(): DecalInstance[] {
    return Array.from(this.instances.values());
  }

  dispose(): void {
    for (const m of this.meshes.values()) m.dispose();
    this.meshes.clear();
    this.instances.clear();
    for (const mat of this.materials) mat.dispose();
    this.materials = [];
  }
}