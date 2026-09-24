const KEY = "vc-build-number";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function nextBuildNumber(): number {
  if (!canUseStorage()) return 1;
  const raw = window.localStorage.getItem(KEY);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = Number.isFinite(current) && current > 0 ? current + 1 : 1;
  window.localStorage.setItem(KEY, String(next));
  return next;
}

export function currentBuildNumber(): number {
  if (!canUseStorage()) return 1;
  const raw = window.localStorage.getItem(KEY);
  const current = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(current) && current > 0 ? current : 1;
}

const LIVERY_KEY = "vc-last-livery";

export function persistLivery(dataUrl: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(LIVERY_KEY, dataUrl);
  } catch {
    /* storage full — ignore */
  }
}

export function loadLastLivery(): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(LIVERY_KEY);
  } catch {
    return null;
  }
}

export function padBuild(n: number): string {
  return String(n).padStart(3, "0");
}