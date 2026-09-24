import type { VehicleSpec } from "@/types/game";
import { compositeVehicle } from "@/lib/livery/compositor";

const cache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("livery decode failed"));
    img.src = src;
  });
}

export async function composeCarImage(
  spec: VehicleSpec,
  liveryDataUrl: string | null,
  force = false
): Promise<string> {
  const key = liveryDataUrl ? `${spec.id}::${liveryDataUrl.slice(-64)}` : `${spec.id}::base`;
  const cached = cache.get(key);
  if (cached && !force) return cached;

  const livery = liveryDataUrl ? await loadImage(liveryDataUrl).catch(() => null) : null;
  const canvas = compositeVehicle(spec, { livery: livery as HTMLImageElement | null });
  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}