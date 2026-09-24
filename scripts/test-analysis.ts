import { createCanvas, Image, Path2D } from "@napi-rs/canvas";
import { setCanvasFactory, compositeVehicle } from "@/lib/livery/compositor";
import { analyzeLivery } from "@/lib/livery/analysis";
import type { VehicleSpec } from "@/types/game";

(globalThis as { Path2D?: unknown }).Path2D = Path2D;

(globalThis as { document?: unknown }).document = {
  createElement: () => createCanvas(1, 1),
} as unknown as Document;
(globalThis as { Image?: unknown }).Image = Image;

setCanvasFactory(() => createCanvas(1600, 900) as never);

function makeCanvas(): HTMLCanvasElement {
  return createCanvas(1600, 900) as unknown as HTMLCanvasElement;
}

function toDataURL(c: HTMLCanvasElement): string {
  return (c as unknown as { toDataURL: (f: string) => string }).toDataURL("image/png");
}

function colorful(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#10131c";
  ctx.fillRect(0, 0, 1600, 900);
  const cols = ["#ff2260", "#2de2e6", "#ffb347", "#7b2dff", "#ff5533", "#22ff88"];
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.arc((i * 173) % 1600, (i * 97) % 900, 40 + (i % 5) * 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 90px Arial";
  ctx.fillText("LOUD & BRIGHT", 200, 600);
  return c;
}

function dark(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, 1600, 900);
  ctx.fillStyle = "#141416";
  ctx.fillRect(200, 200, 300, 200);
  return c;
}

function viceClassic(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#1a0a14";
  ctx.fillRect(0, 0, 1600, 900);
  const grad = ctx.createLinearGradient(0, 0, 1600, 0);
  grad.addColorStop(0, "#ff6fb0");
  grad.addColorStop(0.5, "#ff9e6f");
  grad.addColorStop(1, "#ff2260");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 300, 1600, 300);
  return c;
}

function templateDark(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0d0f16";
  ctx.fillRect(0, 0, 1600, 900);
  ctx.fillStyle = "rgba(120,200,255,0.14)";
  ctx.strokeRect(160, 120, 1280, 660);
  return c;
}

async function main() {
  const tests: [string, HTMLCanvasElement][] = [
    ["colorful", colorful()],
    ["dark", dark()],
    ["vice-classic", viceClassic()],
    ["template-dark", templateDark()],
  ];

  for (const [name, canvas] of tests) {
    const a1 = await analyzeLivery(toDataURL(canvas));
    const a2 = await analyzeLivery(toDataURL(canvas));
    const deterministic = JSON.stringify(a1) === JSON.stringify(a2);
    console.log(
      name.padEnd(14),
      `sat=${a1.saturation.toFixed(2)} br=${a1.brightness.toFixed(2)} con=${a1.contrast.toFixed(2)}`,
      `cpx=${a1.complexity.toFixed(2)} col=${a1.colorfulness.toFixed(2)} hue=${a1.dominantHue}`,
      `style=${a1.styleScore} rep=${a1.streetRep} sub=${a1.subtlety} heat=${a1.policeHeat}`,
      `${a1.personality.padEnd(12)}`,
      `det=${deterministic}`
    );
  }

  const spec: VehicleSpec = {
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
  };
  const out = compositeVehicle(spec, { livery: colorful() });
  console.log("composite ok, width =", (out as unknown as { width: number }).width);
}

void main();