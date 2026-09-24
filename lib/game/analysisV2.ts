import type { ViceBuild, BuildClassification, BuildTelemetry } from "@/types/build";
import { analyzeLivery } from "@/lib/livery/analysis";
import { DECAL_PRESETS } from "@/lib/3d/paint/presets";

function hexToHue(hex: string): number {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const c = max - min;
  if (c === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / c) % 6;
  else if (max === g) hue = (b - r) / c + 2;
  else hue = (r - g) / c + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

function isViceHue(hue: number): boolean {
  return hue >= 320 || hue <= 45;
}

/**
 * Deterministic V2 analysis. Re-renders the serialized livery (strokes) to a
 * canvas, reuses the V1 pixel analysis, then adds decal telemetry and a
 * documented classification. Same build → same output.
 */
export async function analyzeBuildV2(build: ViceBuild): Promise<BuildTelemetry> {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallbackTelemetry();

  ctx.fillStyle = build.paint.color;
  ctx.fillRect(0, 0, 1024, 128);
  const uScale = 1024 / 12.4; // perimeter ~12.4m
  const vScale = 128 / 1.9;
  for (const stroke of build.livery.strokes) {
    ctx.strokeStyle = stroke.eraser ? build.paint.color : stroke.color;
    ctx.lineWidth = Math.max(1, stroke.size * uScale);
    ctx.lineCap = "round";
    ctx.beginPath();
    const pts = stroke.points;
    for (let i = 0; i < pts.length; i++) {
      const x = (pts[i][0] / 2048) * 1024;
      const y = (pts[i][1] / 256) * 128;
      void vScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const base = await analyzeLivery(canvas.toDataURL());

  const decals = build.decals;
  const decalCount = decals.length;
  let coverage = 0;
  let emissiveArea = 0;
  let chromeArea = 0;
  let reflectiveArea = 0;
  const hues = new Set<number>();
  const left = new Set<string>();
  const right = new Set<string>();
  for (const d of decals) {
    const preset = DECAL_PRESETS.find((p) => p.id === d.assetId);
    const area = (preset?.size ?? 0.5) * d.scale;
    coverage += area * area;
    if (d.material === "emissive") emissiveArea += area * area;
    if (d.material === "chrome") chromeArea += area * area;
    if (d.material === "reflective") reflectiveArea += area * area;
    const h = hexToHue(d.tint);
    hues.add(Math.round(h / 20) * 20);
    if (d.position[0] < -0.05) left.add(d.id);
    else if (d.position[0] > 0.05) right.add(d.id);
  }

  const bodyArea = 12.4 * 1.9;
  const coverageRatio = Math.min(1, coverage / (bodyArea * 0.25));
  const emissiveCoverage = Math.min(1, emissiveArea / (bodyArea * 0.25));
  const reflectivity = Math.min(1, (chromeArea + reflectiveArea) / (bodyArea * 0.25));
  const paletteComplexity = hues.size / 14;
  const symmetry = left.size === 0 && right.size === 0 ? 0.5 : Math.min(1, Math.min(left.size, right.size) / Math.max(1, Math.max(left.size, right.size)));

  // style/rep/subtlety/heat preserved from V1 analysis, modulated by decals
  const style = clamp(Math.round(base.styleScore + decalCount * 2 + Math.round(coverageRatio * 10)));
  const streetRep = clamp(Math.round(base.streetRep + decalCount * 1.5 + reflectivity * 8));
  const subtlety = clamp(Math.round(base.subtlety - decalCount * 2 - emissiveCoverage * 20));
  const policeHeat = clamp(
    Math.round(base.policeHeat + decalCount * 1.5 + emissiveCoverage * 30 + coverageRatio * 8)
  );

  const classification = classifyBuild({
    style,
    subtlety,
    policeHeat,
    streetRep,
    coverageRatio,
    emissiveCoverage,
    reflectivity,
    paletteComplexity,
    decalCount,
    dominantHue: base.dominantHue,
    brightness: base.brightness,
    saturation: base.saturation,
    symmetry,
  });

  const diagnostics = buildDiagnostics({
    policeHeat,
    subtlety,
    style,
    coverageRatio,
    decalCount,
    paletteComplexity,
    emissiveCoverage,
    symmetry,
    classification,
    hue: base.dominantHue,
  });

  return {
    style,
    streetRep,
    subtlety,
    policeHeat,
    coverage: Math.round(coverageRatio * 100),
    decalCount,
    emissiveCoverage: Math.round(emissiveCoverage * 100),
    reflectivity: Math.round(reflectivity * 100),
    symmetry: Math.round(symmetry * 100),
    paletteComplexity: Math.round(paletteComplexity * 100),
    dominantHue: base.dominantHue,
    classification,
    diagnostics,
  };
}

interface ClassifyInput {
  style: number;
  subtlety: number;
  policeHeat: number;
  streetRep: number;
  coverageRatio: number;
  emissiveCoverage: number;
  reflectivity: number;
  paletteComplexity: number;
  decalCount: number;
  dominantHue: number;
  brightness: number;
  saturation: number;
  symmetry: number;
}

/** Documented classification rules — checked in order, fully deterministic. */
export function classifyBuild(a: ClassifyInput): BuildClassification {
  if (a.policeHeat >= 78 || (a.emissiveCoverage >= 0.5 && a.coverageRatio >= 0.4)) return "HEAT MAGNET";
  if (a.style >= 72 && a.decalCount >= 6 && a.coverageRatio >= 0.35) return "SHOW CAR";
  if (a.emissiveCoverage >= 0.25 && a.saturation >= 0.45) return "NEON OUTLAW";
  if (a.subtlety >= 72 && a.decalCount <= 1 && a.saturation <= 0.28) return "GHOST BUILD";
  if (a.brightness <= 0.28 && a.dominantHue >= 200 && a.dominantHue <= 280 && a.decalCount <= 3) return "MIDNIGHT RUNNER";
  if (a.streetRep >= 66 && a.decalCount >= 3) return "STREET SPEC";
  if (a.decalCount === 0 && a.saturation <= 0.18 && a.coverageRatio <= 0.05) return "OEM+";
  if (isViceHue(a.dominantHue) && a.saturation >= 0.3) return "VICE ICON";
  return "LOW PROFILE";
}

function buildDiagnostics(a: {
  policeHeat: number;
  subtlety: number;
  style: number;
  coverageRatio: number;
  decalCount: number;
  paletteComplexity: number;
  emissiveCoverage: number;
  symmetry: number;
  classification: BuildClassification;
  hue: number;
}): string[] {
  const out: string[] = [];
  if (a.policeHeat >= 60) {
    out.push("HIGH CONTRAST / LARGE BODY COVERAGE");
    if (a.emissiveCoverage >= 0.25) out.push("EMISSIVE GRAPHICS ACTIVE");
  }
  if (a.decalCount >= 8) out.push("HIGH DECAL DENSITY");
  if (a.paletteComplexity >= 0.4) out.push(`${Math.round(a.paletteComplexity * 10) * 10}% PALETTE SPREAD`);
  if (a.symmetry >= 0.7) out.push("MIRRORED LAYOUT");
  else if (a.symmetry <= 0.35) out.push("ASYMMETRIC LIVERY");
  if (a.subtlety <= 25) out.push("MINIMAL SUBTLETY DETECTED");
  if (isViceHue(a.hue)) out.push("VICE RANGE HUE BIAS");
  if (out.length === 0) out.push("BALANCED BUILD PROFILE");
  return out.slice(0, 3);
}

export function fallbackTelemetry(): BuildTelemetry {
  return {
    style: 40,
    streetRep: 40,
    subtlety: 60,
    policeHeat: 20,
    coverage: 0,
    decalCount: 0,
    emissiveCoverage: 0,
    reflectivity: 0,
    symmetry: 50,
    paletteComplexity: 0,
    dominantHue: 0,
    classification: "LOW PROFILE",
    diagnostics: ["BALANCED BUILD PROFILE"],
  };
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
