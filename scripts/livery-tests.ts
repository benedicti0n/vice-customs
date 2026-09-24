import { createCanvas, GlobalFonts, Path2D } from "@napi-rs/canvas";
import { setCanvasFactory, compositeVehicle } from "@/lib/livery/compositor";
import type { VehicleSpec } from "@/types/game";

(globalThis as { Path2D?: unknown }).Path2D = Path2D;
setCanvasFactory(() => createCanvas(1600, 900) as never);

GlobalFonts.registerFromPath("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "Arial Bold");

const spec: VehicleSpec = {
  id: "seraph-r",
  name: "SERAPH R",
  serialPrefix: "VC-SR",
  tagline: "OCEAN DISTRICT SPEC",
  drivetrain: "Twin Cam / RWD",
  classLabel: "Street Coupe",
  stats: { speed: 78, acceleration: 88, control: 86, attitude: 74 },
  paint: { base: "#9fb0c6", shade: "#232d40", accent: "#ff3f8e", glass: "#0e1626" },
  profileScale: 1,
  profileShiftY: 0,
};

function detailedLivery() {
  const c = createCanvas(1600, 900);
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 1600, 900);
  grad.addColorStop(0, "#0d0f16");
  grad.addColorStop(1, "#10131c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1600, 900);

  ctx.fillStyle = "#22ff88";
  ctx.fillRect(100, 100, 400, 260);

  ctx.fillStyle = "#ff2a5a";
  ctx.fillRect(500, 520, 520, 240);

  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.arc(1250, 260, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#39d9e6";
  ctx.lineWidth = 46;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(150, 700);
  ctx.quadraticCurveTo(700, 500, 1300, 780);
  ctx.stroke();

  ctx.strokeStyle = "#ff3f8e";
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(1200, 100);
  ctx.lineTo(950, 300);
  ctx.lineTo(1420, 420);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 150px "Arial Bold"';
  ctx.fillText("LOUD", 240, 470);
  ctx.fillStyle = "#39d9e6";
  ctx.font = 'bold 110px "Arial Bold"';
  ctx.fillText("VICE", 900, 660);
  return c;
}

function darkLivery() {
  const c = createCanvas(1600, 900);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, 1600, 900);
  ctx.fillStyle = "#111316";
  ctx.fillRect(300, 300, 500, 300);
  ctx.fillStyle = "#1c2026";
  ctx.fillRect(900, 150, 300, 500);
  return c;
}

async function main() {
  const detailed = compositeVehicle(spec, { livery: detailedLivery() as never });
  const dark = compositeVehicle(spec, { livery: darkLivery() as never });
  const fs = await import("fs/promises");
  const b = (c: unknown) => (c as { toBuffer: (f: string) => Buffer }).toBuffer("image/png");
  await fs.writeFile("/tmp/vc-livery-detailed.png", b(detailed));
  await fs.writeFile("/tmp/vc-livery-dark.png", b(dark));
  console.log("livery tests written");
}

void main();