import type { ViceBuild } from "@/types/build";
import { BUILD_V2_KEY, migrateToV2 } from "@/types/build";
import { loadLastLivery } from "@/lib/game/buildNumber";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveBuildV2(build: ViceBuild): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(BUILD_V2_KEY, JSON.stringify(build));
  } catch {
    /* storage full — ignore */
  }
}

export function loadBuildV2(): ViceBuild | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(BUILD_V2_KEY);
  if (raw) {
    try {
      const parsed = migrateToV2(JSON.parse(raw));
      if (parsed) return parsed;
    } catch {
      /* corrupt save — fall through to V1 migration */
    }
  }
  const v1 = loadLastLivery();
  if (v1) {
    const migrated = migrateToV2({ version: 1, liveryDataUrl: v1 });
    if (migrated) {
      saveBuildV2(migrated);
      return migrated;
    }
  }
  return null;
}

export function clearBuildV2(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(BUILD_V2_KEY);
  } catch {
    /* ignore */
  }
}