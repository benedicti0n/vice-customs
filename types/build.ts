import type { VehicleId } from "@/types/game";
import type { BrushStroke } from "@/lib/3d/paint/liveryTexture";
import type { DecalInstance } from "@/lib/3d/paint/decals";

export type BuildClassification =
  | "LOW PROFILE"
  | "NEON OUTLAW"
  | "MIDNIGHT RUNNER"
  | "HEAT MAGNET"
  | "OEM+"
  | "STREET SPEC"
  | "SHOW CAR"
  | "GHOST BUILD"
  | "VICE ICON";

export interface BuildTelemetry {
  style: number;
  streetRep: number;
  subtlety: number;
  policeHeat: number;
  coverage: number;
  decalCount: number;
  emissiveCoverage: number;
  reflectivity: number;
  symmetry: number;
  paletteComplexity: number;
  dominantHue: number;
  classification: BuildClassification;
  diagnostics: string[];
}

export interface BuildPaint {
  color: string;
  metallic: number;
  roughness: number;
  clearcoat: number;
}

export interface ViceBuild {
  version: 2;
  buildId: number;
  vehicleId: VehicleId;
  paint: BuildPaint;
  livery: {
    strokes: BrushStroke[];
    /** V1 raster artwork preserved during migration (optional). */
    legacyImage: string | null;
  };
  decals: DecalInstance[];
  analysis: BuildTelemetry | null;
  createdAt: number;
  updatedAt: number;
}

export const BUILD_V2_KEY = "vc-build-v2";

let buildSeq = 1;

export function emptyBuild(vehicleId: VehicleId, buildId: number, paintColor: string): ViceBuild {
  const t = Date.now() + buildSeq++;
  return {
    version: 2,
    buildId,
    vehicleId,
    paint: { color: paintColor, metallic: 0.62, roughness: 0.28, clearcoat: 1 },
    livery: { strokes: [], legacyImage: null },
    decals: [],
    analysis: null,
    createdAt: t,
    updatedAt: t,
  };
}

export function migrateToV2(raw: unknown): ViceBuild | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.version === 2) {
    const v = raw as ViceBuild;
    if (v.vehicleId && v.paint) {
      const migrated: ViceBuild = {
        version: 2,
        buildId: v.buildId,
        vehicleId: v.vehicleId,
        paint: { ...{ color: "#9fb0c6", metallic: 0.62, roughness: 0.28, clearcoat: 1 }, ...(v.paint ?? {}) },
        livery: { ...{ strokes: [], legacyImage: null }, ...(v.livery ?? {}) },
        decals: Array.isArray(v.decals) ? v.decals : [],
        analysis: v.analysis ?? null,
        createdAt: v.createdAt ?? Date.now(),
        updatedAt: v.updatedAt ?? Date.now(),
      };
      return migrated;
    }
    return null;
  }
  if (r.version === 1 || (r.liveryDataUrl && typeof r.liveryDataUrl === "string")) {
    const legacy = (r.liveryDataUrl as string) ?? null;
    const vehicleId = (r.vehicleId as VehicleId) ?? "seraph-r";
    const build = emptyBuild(vehicleId, 1, "#9fb0c6");
    build.livery.legacyImage = legacy;
    return build;
  }
  return null;
}