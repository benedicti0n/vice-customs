export type QualityProfile = "low" | "medium" | "high";

export interface QualitySettings {
  profile: QualityProfile;
  shadowQuality: number;
  postFx: boolean;
  reflections: boolean;
  particlesScale: number;
  decalResolution: number;
  liveryResolution: number;
}

let cached: QualitySettings | null = null;

export function detectQuality(webgpu: boolean): QualitySettings {
  if (cached) return cached;
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const cores = nav?.hardwareConcurrency ?? 4;
  const mem = (nav as unknown as { deviceMemory?: number })?.deviceMemory ?? 4;

  let profile: QualityProfile = "medium";
  if (webgpu && cores >= 8 && mem >= 8) profile = "high";
  else if (!webgpu && (cores < 4 || mem <= 2)) profile = "low";

  const s: QualitySettings = {
    profile,
    shadowQuality: profile === "high" ? 1024 : profile === "medium" ? 512 : 256,
    postFx: profile !== "low",
    reflections: profile !== "low",
    particlesScale: profile === "low" ? 0.4 : profile === "medium" ? 0.7 : 1,
    decalResolution: profile === "low" ? 256 : 512,
    liveryResolution: profile === "low" ? 512 : 1024,
  };
  cached = s;
  return s;
}

export function resetQualityCache(): void {
  cached = null;
}