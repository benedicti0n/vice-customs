import { createCanvas, Path2D } from "@napi-rs/canvas";
import { setCanvasFactory, compositeVehicle } from "@/lib/livery/compositor";
import type { VehicleSpec } from "@/types/game";

(globalThis as { Path2D?: unknown }).Path2D = Path2D;
setCanvasFactory(() => createCanvas(1600, 900) as never);

const paints: Record<string, VehicleSpec> = {
  "seraph-r": {
    id: "seraph-r",
    name: "SERAPH R",
    serialPrefix: "VC-SR",
    tagline: "OCEAN DISTRICT SPEC",
    drivetrain: "Twin Cam / RWD",
    classLabel: "Street Coupe",
    stats: { speed: 78, acceleration: 88, control: 86, attitude: 74 },
    paint: { base: "#9fb0c6", shade: "#232d40", accent: "#ff2260", glass: "#0e1626" },
    profileScale: 1,
    profileShiftY: 0,
  },
  "tempest-vx": {
    id: "tempest-vx",
    name: "TEMPEST VX",
    serialPrefix: "VC-TV",
    tagline: "WET RUN SPEC",
    drivetrain: "Twin Turbo / AWD",
    classLabel: "Super Coupe",
    stats: { speed: 92, acceleration: 94, control: 78, attitude: 88 },
    paint: { base: "#1f6feb", shade: "#0d2b52", accent: "#00e5c3", glass: "#0a1018" },
    profileScale: 1,
    profileShiftY: 0,
  },
  "marlin-88": {
    id: "marlin-88",
    name: "MARLIN 88",
    serialPrefix: "VC-M8",
    tagline: "BAYWATER SPEC",
    drivetrain: "V8 / RWD",
    classLabel: "Muscle Sport",
    stats: { speed: 82, acceleration: 80, control: 74, attitude: 96 },
    paint: { base: "#d9c07a", shade: "#5a4512", accent: "#141414", glass: "#10141c" },
    profileScale: 1,
    profileShiftY: 0,
  },
};

async function main() {
  const gid = process.argv[2] ?? "seraph-r";
  const canvas = compositeVehicle(paints[gid], { livery: null });
  const fs = await import("fs/promises");
  await fs.writeFile(`/tmp/vc-base-${gid}.png`, (canvas as unknown as { toBuffer: (f: string) => Buffer }).toBuffer("image/png"));
  console.log("base written", gid);
}

void main();