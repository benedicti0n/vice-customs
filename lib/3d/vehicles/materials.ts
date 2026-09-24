import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Material } from "@babylonjs/core/Materials/material";
import type { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

export interface PaintConfig {
  color: string;
  metallic: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness?: number;
}

export interface VehicleMaterialSet {
  paint: PBRMaterial;
  glass: PBRMaterial;
  chrome: PBRMaterial;
  rubber: PBRMaterial;
  interior: PBRMaterial;
  lightLens: PBRMaterial;
  accent: PBRMaterial;
}

function hexToColor3(hex: string): Color3 {
  return Color3.FromHexString(hex);
}

export function createPaintMaterial(scene: Scene, cfg: PaintConfig, liveryTexture: DynamicTexture | null): PBRMaterial {
  const mat = new PBRMaterial("vc-paint", scene);
  mat.metallic = cfg.metallic;
  mat.roughness = cfg.roughness;
  mat.clearCoat.isEnabled = true;
  mat.clearCoat.roughness = cfg.clearcoatRoughness ?? 0.12;
  mat.clearCoat.indexOfRefraction = 1.4;
  mat.albedoColor = hexToColor3(cfg.color);
  mat.environmentIntensity = 0.7;
  mat.specularIntensity = 1;
  if (liveryTexture) {
    mat.albedoTexture = liveryTexture;
    mat.useAlphaFromAlbedoTexture = false;
  }
  return mat;
}

export function createVehicleMaterials(scene: Scene, _paint: PaintConfig): Omit<VehicleMaterialSet, "paint"> & { paint: PBRMaterial } {
  void _paint;
  const glass = new PBRMaterial("vc-glass", scene);
  glass.metallic = 0.1;
  glass.roughness = 0.06;
  glass.alpha = 0.32;
  glass.disableLighting = false;
  glass.environmentIntensity = 1;
  glass.albedoColor = new Color3(0.05, 0.07, 0.09);

  const chrome = new PBRMaterial("vc-chrome", scene);
  chrome.metallic = 1;
  chrome.roughness = 0.1;
  chrome.albedoColor = new Color3(0.85, 0.88, 0.92);

  const rubber = new PBRMaterial("vc-rubber", scene);
  rubber.metallic = 0;
  rubber.roughness = 0.92;
  rubber.albedoColor = new Color3(0.03, 0.03, 0.035);

  const interior = new PBRMaterial("vc-interior", scene);
  interior.metallic = 0;
  interior.roughness = 0.8;
  interior.albedoColor = new Color3(0.06, 0.06, 0.07);

  const lightLens = new PBRMaterial("vc-light", scene);
  lightLens.metallic = 0;
  lightLens.roughness = 0.2;
  lightLens.albedoColor = new Color3(0.9, 0.95, 1);
  lightLens.emissiveColor = new Color3(0.9, 0.95, 1);
  lightLens.emissiveIntensity = 0.9;

  const accent = new PBRMaterial("vc-accent", scene);
  accent.metallic = 0.2;
  accent.roughness = 0.4;
  accent.albedoColor = new Color3(1, 0.247, 0.557);

  const paint = new PBRMaterial("vc-paint", scene);
  return { paint, glass, chrome, rubber, interior, lightLens, accent };
}

export function makeTailLensMaterial(scene: Scene): PBRMaterial {
  const mat = new PBRMaterial("vc-tail", scene);
  mat.metallic = 0;
  mat.roughness = 0.3;
  mat.albedoColor = new Color3(0.55, 0.03, 0.06);
  mat.emissiveColor = new Color3(0.85, 0.06, 0.1);
  mat.emissiveIntensity = 0.8;
  return mat;
}

export function makeDecalMaterial(scene: Scene, texture: DynamicTexture): PBRMaterial {
  const mat = new PBRMaterial("vc-decal", scene);
  mat.albedoTexture = texture;
  mat.useAlphaFromAlbedoTexture = true;
  mat.metallic = 0.05;
  mat.roughness = 0.5;
  mat.alphaMode = Constants.ALPHA_COMBINE;
  mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
  mat.disableLighting = false;
  return mat;
}

export function makeEmissiveDecalMaterial(scene: Scene, texture: DynamicTexture, color: Color3): PBRMaterial {
  const mat = makeDecalMaterial(scene, texture);
  mat.metallic = 0;
  mat.roughness = 0.55;
  mat.emissiveTexture = texture;
  mat.emissiveColor = color;
  mat.emissiveIntensity = 1.2;
  return mat;
}

export function makeChromeDecalMaterial(scene: Scene, texture: DynamicTexture): PBRMaterial {
  const mat = makeDecalMaterial(scene, texture);
  mat.metallic = 1;
  mat.roughness = 0.12;
  return mat;
}

export function makeReflectiveDecalMaterial(scene: Scene, texture: DynamicTexture): PBRMaterial {
  const mat = makeDecalMaterial(scene, texture);
  mat.metallic = 0.3;
  mat.roughness = 0.12;
  mat.environmentIntensity = 1.4;
  return mat;
}

export function makeFloorMaterial(scene: Scene, color: Color3): PBRMaterial {
  const mat = new PBRMaterial("vc-floor", scene);
  mat.metallic = 0.1;
  mat.roughness = 0.6;
  mat.albedoColor = color;
  return mat;
}

export function disposeMaterials(mats: (PBRMaterial | undefined)[]): void {
  for (const m of mats) m?.dispose();
}
