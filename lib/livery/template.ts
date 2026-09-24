export const TEMPLATE_W = 1600;
export const TEMPLATE_H = 900;

export function createLiveryTemplate(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_W;
  canvas.height = TEMPLATE_H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createRadialGradient(800, 450, 120, 800, 450, 1000);
  bg.addColorStop(0, "#14161f");
  bg.addColorStop(0.6, "#0d0f16");
  bg.addColorStop(1, "#090a10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEMPLATE_W, TEMPLATE_H);

  ctx.strokeStyle = "rgba(255,255,255,0.028)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= TEMPLATE_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TEMPLATE_H);
    ctx.stroke();
  }
  for (let y = 0; y <= TEMPLATE_H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TEMPLATE_W, y);
    ctx.stroke();
  }

  const mono = '500 15px "JetBrains Mono", ui-monospace, monospace';
  ctx.textBaseline = "alphabetic";

  const guide = "rgba(120,200,255,0.14)";
  const dim = "rgba(160,170,190,0.28)";
  const accent = "rgba(255,63,142,0.55)";

  const safe = { x: 160, y: 120, w: TEMPLATE_W - 320, h: TEMPLATE_H - 240 };

  ctx.strokeStyle = guide;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 12]);
  ctx.strokeRect(safe.x, safe.y, safe.w, safe.h);
  ctx.setLineDash([]);

  ctx.fillStyle = dim;
  ctx.font = mono;
  ctx.textAlign = "left";
  ctx.fillText("SAFE AREA", safe.x + 6, safe.y + 26);

  const centerX = TEMPLATE_W / 2;
  ctx.strokeStyle = "rgba(120,200,255,0.1)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 10]);
  ctx.beginPath();
  ctx.moveTo(centerX, safe.y + 40);
  ctx.lineTo(centerX, safe.y + safe.h - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(160,170,190,0.2)";
  ctx.fillText("LEFT BODY", safe.x + safe.w / 4, safe.y + safe.h - 16);
  ctx.fillText("CENTER", centerX, safe.y + safe.h - 16);
  ctx.fillText("RIGHT BODY", safe.x + (safe.w / 4) * 3, safe.y + safe.h - 16);

  ctx.fillStyle = accent;
  ctx.font = '600 34px "Archivo Black", sans-serif';
  ctx.fillText("VICE CUSTOMS // BODY GRAPHICS", centerX, safe.y + 76);

  ctx.fillStyle = dim;
  ctx.font = mono;
  ctx.fillText("PAINT ARRAY // BODY TEMPLATE 1600x900", centerX, safe.y + 108);

  const corners: [number, number, number, number][] = [
    [safe.x, safe.y, 1, 1],
    [safe.x + safe.w, safe.y, -1, 1],
    [safe.x, safe.y + safe.h, 1, -1],
    [safe.x + safe.w, safe.y + safe.h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    const L = 34;
    ctx.beginPath();
    ctx.moveTo(cx + sx * L, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * L);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.textAlign = "right";
  ctx.font = mono;
  ctx.fillText("VC-LIVERY/2.4", TEMPLATE_W - 26, TEMPLATE_H - 26);

  return canvas;
}

export function templateDataUrl(): string {
  return createLiveryTemplate().toDataURL("image/png");
}