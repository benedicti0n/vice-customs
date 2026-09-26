import type { VehicleSpec } from "@/types/game";
import { getVehicle } from "@/lib/game/vehicles";

/**
 * Typed production asset registry.
 *
 * Each vehicle maps semantic roles to GLB nodes/materials by NAME (never by
 * index). Source meshes are renamed by the asset pipeline into `vc-<role>-*`
 * prefixes; materials are renamed semantically (e.g. `vc-body-paint`).
 *
 * Vehicles without a usable production asset keep the procedural fallback
 * definition (source path = null) and render through the V1-style builder.
 */
export interface VehicleAssetDefinition {
  id: string;
  name: string;
  lore: string;
  /** production GLB paths (public/…); null → procedural fallback */
  lod0: string | null;
  lod1: string | null;
  /** forward axis convention in the exported model (+Z = nose) */
  forwardAxis: "+Z" | "-Z";
  /** yaw offset applied at load when the export faces -Z */
  yawOffset: number;
  /** semantic node prefix maps */
  nodePrefixes: {
    body: string;
    glass: string;
    chrome: string;
    rubber: string;
    rim: string;
    light: string;
    trim: string;
    interior: string;
  };
  /** exact material names after pipeline rename */
  bodyPaintMaterial: string;
  wheelPivotPrefix: string;
  /** measured/normalized dims in metres (from pipeline manifest) */
  dimensions: { length: number; width: number; height: number };
  wheelbase: number;
  /** wheel pivots (x, y, z) — local space, from pipeline manifest */
  wheelPivots: [number, number, number][] | null;
  /** livery texture mapping tuning for this vehicle's body UVs */
  livery: { uScale: number; vScale: number; uOffset: number; vOffset: number };
  /** camera framing offsets (m) applied to the bbox center */
  camera: { y: number; radius: number };
  /** attribution shown in credits */
  attribution: string;
  notes: string[];
}

const UNITY_FAN_ATTRIBUTION = "Concept car source meshes by Unity Fan; modified for VICE//CUSTOMS.";

export const VEHICLE_ASSETS: Record<string, VehicleAssetDefinition> = {
  "seraph-r": {
    id: "seraph-r",
    name: "SERAPH R",
    lore: "Ocean District street coupe — Japanese tuner culture, late-night spec.",
    lod0: "/assets/vehicles/seraph-r/seraph-r.glb",
    lod1: "/assets/vehicles/seraph-r/seraph-r-lod1.glb",
    forwardAxis: "+Z",
    yawOffset: 0,
    nodePrefixes: {
      body: "vc-body-",
      glass: "vc-glass-",
      chrome: "vc-chrome-",
      rubber: "vc-rubber-",
      rim: "vc-rim-",
      light: "vc-light-",
      trim: "vc-trim-",
      interior: "vc-interior-",
    },
    bodyPaintMaterial: "vc-body-paint",
    wheelPivotPrefix: "vc-wheel-",
    dimensions: { length: 4.55, width: 1.65, height: 1.29 },
    wheelbase: 2.69,
    wheelPivots: [
      [0.706, 0.415, -1.169],
      [-0.706, 0.415, -3.862],
      [0.706, 0.415, -3.862],
      [-0.706, 0.415, -1.168],
    ],
    livery: { uScale: 1.6, vScale: 1, uOffset: 0, vOffset: 0 },
    camera: { y: 0.78, radius: 5.4 },
    attribution: UNITY_FAN_ATTRIBUTION,
    notes: ["Source: tempest-vx-source.glb (Supra-style coupe) — swapped with TEMPEST VX for design fit."],
  },
  "tempest-vx": {
    id: "tempest-vx",
    name: "TEMPEST VX",
    lore: "Wet-run street weapon — futuristic AWD/EV-style machine.",
    lod0: "/assets/vehicles/tempest-vx/tempest-vx.glb",
    lod1: "/assets/vehicles/tempest-vx/tempest-vx-lod1.glb",
    forwardAxis: "+Z",
    yawOffset: 0,
    nodePrefixes: {
      body: "vc-body-",
      glass: "vc-glass-",
      chrome: "vc-chrome-",
      rubber: "vc-rubber-",
      rim: "vc-rim-",
      light: "vc-light-",
      trim: "vc-trim-",
      interior: "vc-interior-",
    },
    bodyPaintMaterial: "vc-body-paint",
    wheelPivotPrefix: "vc-wheel-",
    dimensions: { length: 4.55, width: 1.96, height: 1.08 },
    wheelbase: 2.46,
    wheelPivots: [
      [0.811, 0.439, -0.98],
      [-0.736, 0.439, -3.438],
      [-0.818, 0.439, -0.98],
      [0.744, 0.439, -3.438],
    ],
    livery: { uScale: 1.6, vScale: 1, uOffset: 0, vOffset: 0 },
    camera: { y: 0.65, radius: 5.2 },
    attribution: UNITY_FAN_ATTRIBUTION,
    notes: ["Source: seraph-r-source.glb (futuristic concept) — swapped with SERAPH R for design fit."],
  },
  "marlin-88": {
    id: "marlin-88",
    name: "MARLIN 88",
    lore: "Baywater muscle sport — long-hood, big-cube attitude.",
    lod0: null,
    lod1: null,
    forwardAxis: "+Z",
    yawOffset: 0,
    nodePrefixes: {
      body: "vc-body-",
      glass: "vc-glass-",
      chrome: "vc-chrome-",
      rubber: "vc-rubber-",
      rim: "vc-rim-",
      light: "vc-light-",
      trim: "vc-trim-",
      interior: "vc-interior-",
    },
    bodyPaintMaterial: "vc-body-paint",
    wheelPivotPrefix: "vc-wheel-",
    dimensions: { length: 4.55, width: 1.9, height: 1.3 },
    wheelbase: 2.78,
    wheelPivots: null,
    livery: { uScale: 1.4, vScale: 1, uOffset: 0, vOffset: 0 },
    camera: { y: 0.8, radius: 5.4 },
    attribution: "Sports Car Highpoly by Renafox, licensed under CC BY 4.0.",
    notes: [
      "Production source kept on procedural fallback for V2.5: no material separation (uniform gray), no wheel topology, no textures, validator error (ANIMATION_SAMPLER_ACCESSOR_WITH_BYTESTRIDE), 657k tris.",
    ],
  },
};

export function getVehicleAsset(spec: VehicleSpec): VehicleAssetDefinition {
  return VEHICLE_ASSETS[spec.id] ?? VEHICLE_ASSETS["seraph-r"];
}

export function hasProductionModel(id: string): boolean {
  const def = VEHICLE_ASSETS[id];
  return Boolean(def?.lod0);
}

export function vehicleSpecFor(id: string): VehicleSpec {
  return getVehicle(id);
}