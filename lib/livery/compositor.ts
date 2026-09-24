import { buildProfile, buildVisual, type ProfileParams, type VehicleVisual } from "@/lib/vehicle/geometry";
import type { VehicleSpec } from "@/types/game";

export const COMPOSITE_W = 1600;
export const COMPOSITE_H = 900;
const GROUND = 858;

type RGB = [number, number, number];

const PALETTE = {
  pink: "#ff3f8e",
  cyan: "#39d9e6",
  amber: "#ffa640",
  chrome: "#e9eef5",
};

let noiseCanvas: HTMLCanvasElement | null = null;

type CanvasFactory = () => HTMLCanvasElement;

let canvasFactory: CanvasFactory = () => document.createElement("canvas");

export function setCanvasFactory(fn: CanvasFactory): void {
  canvasFactory = fn;
}

function getNoise(): HTMLCanvasElement {
  if (noiseCanvas) return noiseCanvas;
  const canvas = canvasFactory();
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseCanvas = canvas;
  return canvas;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(n, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t);
}

function shade(hex: string, amt: number): string {
  const t = amt > 0 ? "#ffffff" : "#000000";
  return mix(hex, t, Math.abs(amt));
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function path(ctx: CanvasRenderingContext2D, d: string): Path2D {
  return new Path2D(d);
}

function arcPath(cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2): Path2D {
  const p = new Path2D();
  p.arc(cx, cy, r, a0, a1);
  return p;
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number, rot = 0, a0 = 0, a1 = Math.PI * 2): Path2D {
  const p = new Path2D();
  p.ellipse(cx, cy, rx, ry, rot, a0, a1);
  return p;
}

function rectPath(x: number, y: number, w: number, h: number): Path2D {
  const p = new Path2D();
  p.rect(x, y, w, h);
  return p;
}

function withState(ctx: CanvasRenderingContext2D, fn: () => void) {
  ctx.save();
  fn();
  ctx.restore();
}

interface LiveryTransform {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

function computeLiveryTransform(geom: ReturnType<typeof buildProfile>, imageW: number, imageH: number): LiveryTransform {
  const g = geom;
  const topLeftX = g.rax + g.archR + 24;
  const topLeftY = g.params.beltlineY + 34;
  const topRightX = g.fax - g.archR - 30;
  const topRightY = g.params.beltlineY + 26;
  const botLeftY = g.params.rockerY - 6;

  const regionW = topRightX - topLeftX;
  const regionH = botLeftY - topLeftY;

  const angle = Math.atan2(topRightY - topLeftY, topRightX - topLeftX);

  return {
    dx: topLeftX,
    dy: topLeftY,
    scaleX: regionW / imageW,
    scaleY: regionH / imageH,
    rotation: angle,
  };
}

export interface CompositeOptions {
  livery?: HTMLImageElement | HTMLCanvasElement | null;
  shadow?: boolean;
}

export function compositeVehicle(spec: VehicleSpec, opts: CompositeOptions = {}): HTMLCanvasElement {
  const visual: VehicleVisual = buildVisual(spec.id, spec.paint);
  const { geometry: g } = visual;
  const p = visual.params;

  const canvas = canvasFactory();
  canvas.width = COMPOSITE_W;
  canvas.height = COMPOSITE_H;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, COMPOSITE_W, COMPOSITE_H);

  if (opts.shadow !== false) {
    drawGroundShadows(ctx, g, p);
  }

  drawBodyPaint(ctx, g, p, spec.paint);
  drawLowerOcclusion(ctx, g, p);
  drawCreases(ctx, g, p);

  if (opts.livery) {
    drawLivery(ctx, g, p, opts.livery);
  }

  drawArchShadows(ctx, g);
  drawWindows(ctx, g, p, spec.paint);
  drawDetails(ctx, g, p, spec.paint);
  drawWheels(ctx, g, p, spec.paint);
  drawGloss(ctx, g, p);

  return canvas;
}

function drawGroundShadows(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams) {
  const cx = (g.noseX + p.rearOverhang) / 2;
  const w = g.noseX - p.rearOverhang + 140;

  const broad = ctx.createRadialGradient(cx, GROUND + 10, 20, cx, GROUND + 10, w / 2);
  broad.addColorStop(0, "rgba(0,0,0,0.42)");
  broad.addColorStop(0.7, "rgba(0,0,0,0.18)");
  broad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = broad;
  ctx.fill(ellipsePath(cx, GROUND + 10, w / 2, 26, 0, 0, Math.PI * 2));

  for (const wx of [g.rax, g.fax]) {
    const contact = ctx.createRadialGradient(wx, GROUND + 6, 2, wx, GROUND + 6, g.wheelR * 0.95);
    contact.addColorStop(0, "rgba(0,0,0,0.62)");
    contact.addColorStop(0.8, "rgba(0,0,0,0.3)");
    contact.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = contact;
    ctx.fill(ellipsePath(wx, GROUND + 6, g.wheelR * 0.95, 15, 0, 0, Math.PI * 2));
  }
}

function drawBodyPaint(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams, paint: VehicleSpec["paint"]) {
  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));

    const grad = ctx.createLinearGradient(0, p.beltlineY - 40, 0, p.ground);
    grad.addColorStop(0, shade(paint.base, 0.52));
    grad.addColorStop(0.3, shade(paint.base, 0.2));
    grad.addColorStop(0.55, paint.base);
    grad.addColorStop(0.78, shade(paint.base, -0.22));
    grad.addColorStop(0.94, shade(paint.base, -0.5));
    grad.addColorStop(1, shade(paint.base, -0.62));
    ctx.fillStyle = grad;
    ctx.fillRect(p.rearOverhang - 60, p.beltlineY - 60, g.noseX - p.rearOverhang + 120, p.ground - p.beltlineY + 80);

    const side = ctx.createLinearGradient(0, 0, g.noseX, 0);
    side.addColorStop(0, "rgba(0,0,0,0.3)");
    side.addColorStop(0.16, "rgba(0,0,0,0.06)");
    side.addColorStop(0.45, "rgba(0,0,0,0)");
    side.addColorStop(0.72, "rgba(0,0,0,0)");
    side.addColorStop(0.94, "rgba(0,0,0,0.34)");
    side.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = side;
    ctx.fillRect(p.rearOverhang - 60, p.beltlineY - 60, g.noseX - p.rearOverhang + 120, p.ground - p.beltlineY + 80);

    const sheen = ctx.createRadialGradient(g.fax - 250, p.beltlineY - 20, 10, g.fax - 250, p.beltlineY + 20, 430);
    sheen.addColorStop(0, rgba("#ffffff", 0.16));
    sheen.addColorStop(0.5, rgba("#ffffff", 0.045));
    sheen.addColorStop(1, rgba("#ffffff", 0));
    ctx.fillStyle = sheen;
    ctx.fillRect(p.rearOverhang - 60, p.beltlineY - 60, g.noseX - p.rearOverhang + 120, p.ground - p.beltlineY + 80);

    const noise = getNoise();
    ctx.globalAlpha = 0.055;
    ctx.globalCompositeOperation = "overlay";
    const nw = g.noseX - p.rearOverhang + 120;
    const nh = p.ground - p.beltlineY + 80;
    for (let y = 0; y < nh; y += 128) {
      for (let x = 0; x < nw; x += 128) {
        ctx.drawImage(noise, p.rearOverhang - 60 + x, p.beltlineY - 60 + y, 128, 128);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const accentGrad = ctx.createLinearGradient(0, 0, g.noseX, 0);
    accentGrad.addColorStop(0, shade(paint.accent, -0.25));
    accentGrad.addColorStop(0.5, paint.accent);
    accentGrad.addColorStop(1, shade(paint.accent, -0.25));
    ctx.fillStyle = accentGrad;
    ctx.fill(rectPath(p.rearOverhang, p.rockerY - 22, g.noseX - p.rearOverhang, 22));

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill(rectPath(p.rearOverhang, p.rockerY - 24, g.noseX - p.rearOverhang, 2));
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill(rectPath(p.rearOverhang, p.rockerY, g.noseX - p.rearOverhang, 2));
  });
}

function drawLowerOcclusion(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams) {
  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));
    const occ = ctx.createLinearGradient(0, p.rockerY - 44, 0, p.rockerY + 8);
    occ.addColorStop(0, "rgba(0,0,0,0)");
    occ.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = occ;
    ctx.fillRect(p.rearOverhang - 60, p.rockerY - 50, g.noseX - p.rearOverhang + 120, 60);
  });
}

function drawCreases(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams) {
  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));

    const lx = g.rax + g.archR;
    const rx = g.fax - g.archR;

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2.5;
    const hi = new Path2D();
    hi.moveTo(lx + 30, p.beltlineY + 30);
    hi.quadraticCurveTo((lx + rx) / 2, p.beltlineY + 26, rx - 26, p.beltlineY + 30);
    ctx.stroke(hi);

    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 2;
    const lo = new Path2D();
    lo.moveTo(lx + 30, p.beltlineY + 34);
    lo.quadraticCurveTo((lx + rx) / 2, p.beltlineY + 30, rx - 26, p.beltlineY + 34);
    ctx.stroke(lo);
  });
}

function drawLivery(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams, livery: HTMLImageElement | HTMLCanvasElement) {
  const imageW = livery.width || 1600;
  const imageH = livery.height || 900;
  const t = computeLiveryTransform(g, imageW, imageH);
  const lx = g.rax + g.archR;
  const rx = g.fax - g.archR;
  const regionW = rx - lx;
  const regionH = p.rockerY - 6 - (p.beltlineY + 34);

  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));

    withState(ctx, () => {
      ctx.clip(path(ctx, g.liveryRegion));

      ctx.translate(t.dx, t.dy);
      ctx.rotate(t.rotation);
      ctx.scale(t.scaleX, t.scaleY);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(livery, 0, 0, imageW, imageH);
      ctx.globalAlpha = 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const curvature = ctx.createLinearGradient(0, p.beltlineY + 20, 0, p.rockerY + 6);
      curvature.addColorStop(0, "rgba(0,0,0,0.03)");
      curvature.addColorStop(0.4, "rgba(0,0,0,0.14)");
      curvature.addColorStop(0.72, "rgba(0,0,0,0.3)");
      curvature.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = curvature;
      ctx.fillRect(lx, p.beltlineY, regionW, regionH + 20);

      const edge = ctx.createLinearGradient(0, 0, regionW, 0);
      edge.addColorStop(0, "rgba(0,0,0,0.4)");
      edge.addColorStop(0.14, "rgba(0,0,0,0)");
      edge.addColorStop(0.86, "rgba(0,0,0,0)");
      edge.addColorStop(1, "rgba(0,0,0,0.46)");
      ctx.fillStyle = edge;
      ctx.fillRect(lx, p.beltlineY, regionW, regionH + 20);

      const satDip = ctx.createLinearGradient(0, p.beltlineY, 0, p.rockerY + 6);
      satDip.addColorStop(0, "rgba(0,0,0,0)");
      satDip.addColorStop(0.85, "rgba(0,0,0,0)");
      satDip.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = satDip;
      ctx.fillRect(lx, p.beltlineY, regionW, regionH + 20);
      ctx.globalCompositeOperation = "source-over";

      const specStreak = ctx.createRadialGradient(g.fax - 260, p.beltlineY + 46, 10, g.fax - 260, p.beltlineY + 50, 320);
      specStreak.addColorStop(0, "rgba(255,255,255,0.14)");
      specStreak.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = specStreak;
      ctx.fillRect(lx, p.beltlineY, regionW, regionH + 20);
    });
  });
}

function drawArchShadows(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>) {
  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));
    for (const wx of [g.rax, g.fax]) {
      const shadow = ctx.createRadialGradient(wx, g.axleY, g.wheelR * 0.75, wx, g.axleY, g.archR * 1.02);
      shadow.addColorStop(0, "rgba(5,6,9,0)");
      shadow.addColorStop(0.72, "rgba(5,6,9,0.4)");
      shadow.addColorStop(1, "rgba(5,6,9,0.66)");
      ctx.fillStyle = shadow;
      ctx.fill(arcPath(wx, g.axleY, g.archR * 1.02));
    }
  });
}

function drawWindows(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams, paint: VehicleSpec["paint"]) {
  withState(ctx, () => {
    ctx.clip(path(ctx, g.windows));

    const glass = ctx.createLinearGradient(0, p.roofRearY, 0, p.beltlineY + 10);
    glass.addColorStop(0, shade(paint.glass, 0.1));
    glass.addColorStop(0.5, paint.glass);
    glass.addColorStop(1, shade(paint.glass, 0.35));
    ctx.fillStyle = glass;
    ctx.fillRect(p.rearOverhang, p.roofRearY - 10, g.noseX, p.beltlineY - p.roofRearY + 20);

    const horizon = ctx.createLinearGradient(0, p.beltlineY - 88, 0, p.beltlineY - 40);
    horizon.addColorStop(0, "rgba(160,200,235,0.16)");
    horizon.addColorStop(0.5, "rgba(160,200,235,0.28)");
    horizon.addColorStop(1, "rgba(160,200,235,0.05)");
    ctx.fillStyle = horizon;
    ctx.fillRect(p.rearOverhang, p.beltlineY - 110, g.noseX, 90);

    const streak = ctx.createLinearGradient(p.cowlX, p.beltlineY, p.cowlX - 240, p.beltlineY - 120);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.35, "rgba(255,255,255,0.22)");
    streak.addColorStop(0.42, "rgba(255,255,255,0.05)");
    streak.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = streak;
    ctx.fillRect(p.rearOverhang, p.beltlineY - 130, g.noseX, 130);

    const pink = ctx.createLinearGradient(0, p.beltlineY - 34, 0, p.beltlineY - 2);
    pink.addColorStop(0, "rgba(255,63,142,0)");
    pink.addColorStop(0.6, "rgba(255,63,142,0.16)");
    pink.addColorStop(1, "rgba(255,63,142,0.05)");
    ctx.fillStyle = pink;
    ctx.fillRect(p.rearOverhang, p.beltlineY - 40, g.noseX, 40);

    const bPillarX = p.cowlX - (p.cowlX - p.glassBaseX) * 0.62;
    ctx.fillStyle = "rgba(8,10,14,0.92)";
    ctx.fill(rectPath(bPillarX - 5, p.beltlineY - 92, 10, 90));
    ctx.fillStyle = "rgba(220,230,240,0.22)";
    ctx.fill(rectPath(bPillarX - 6, p.beltlineY - 92, 2, 90));
  });

  withState(ctx, () => {
    ctx.strokeStyle = "rgba(200,212,228,0.3)";
    ctx.lineWidth = 3;
    ctx.stroke(path(ctx, g.windows));
  });
}

function drawDetails(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams, paint: VehicleSpec["paint"]) {
  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));

    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 3;
    const seam = new Path2D();
    seam.moveTo(g.fax - 168, p.beltlineY + 34);
    seam.quadraticCurveTo(g.fax - 184, p.beltlineY + 90, g.fax - 170, p.rockerY - 2);
    ctx.stroke(seam);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    const seamHi = new Path2D();
    seamHi.moveTo(g.fax - 164, p.beltlineY + 36);
    seamHi.quadraticCurveTo(g.fax - 180, p.beltlineY + 90, g.fax - 166, p.rockerY - 4);
    ctx.stroke(seamHi);

    ctx.fillStyle = shade(paint.base, -0.45);
    ctx.fill(ellipsePath(g.fax - 148, p.beltlineY + 54, 25, 7, 0.18, 0, Math.PI * 2));
    ctx.fillStyle = shade(paint.base, -0.3);
    ctx.fill(ellipsePath(g.fax - 148, p.beltlineY + 56, 25, 7, 0.18, 0, Math.PI * 2));

    ctx.fillStyle = "rgba(10,11,14,0.9)";
    ctx.fill(ellipsePath(g.fax - 230, p.beltlineY + 62, 9, 5, 0, 0, Math.PI * 2));
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill(ellipsePath(g.fax - 232, p.beltlineY + 60, 4, 2, 0, 0, Math.PI * 2));

    const fuelX = g.rax + 92;
    ctx.fillStyle = "rgba(10,11,14,0.8)";
    ctx.fill(ellipsePath(fuelX, p.beltlineY + 78, 8, 5, 0, 0, Math.PI * 2));
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke(ellipsePath(fuelX, p.beltlineY + 78, 8, 5, 0, 0, Math.PI * 2));

    ctx.fillStyle = "rgba(8,9,12,0.9)";
    ctx.fill(ellipsePath(g.noseX - 118, p.beltlineY + 150, 15, 8, 0, 0, Math.PI * 2));
    ctx.fill(ellipsePath(g.noseX - 248, p.beltlineY + 128, 12, 7, 0, 0, Math.PI * 2));
  });

  withState(ctx, () => {
    ctx.fillStyle = "rgba(6,7,10,0.95)";
    ctx.fill(ellipsePath(g.noseX - 8, p.ground - 30, 22, 12, 0, 0, Math.PI * 2));
    ctx.fillStyle = "rgba(20,22,28,0.9)";
    ctx.fill(ellipsePath(g.noseX - 16, p.ground - 30, 14, 7, 0, 0, Math.PI * 2));

    ctx.fillStyle = "rgba(6,7,10,0.92)";
    ctx.fill(ellipsePath(p.tailBottomX + 14, p.ground - 24, 17, 9, 0, 0, Math.PI * 2));
    ctx.strokeStyle = PALETTE.chrome;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 4;
    ctx.stroke(ellipsePath(p.tailBottomX + 14, p.ground - 24, 8, 4.5, 0, 0, Math.PI * 2));
    ctx.globalAlpha = 1;
  });

  withState(ctx, () => {
    ctx.fillStyle = "rgba(10,11,14,0.5)";
    ctx.fill(path(ctx, g.hoodVent));
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2.5;
    ctx.stroke(path(ctx, g.hoodVent));
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke(path(ctx, g.hoodVent));
  });

  withState(ctx, () => {
    ctx.fillStyle = paint.accent;
    ctx.fill(path(ctx, g.rockerAccent));
  });

  withState(ctx, () => {
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 4;
    ctx.stroke(path(ctx, g.fenderFront));
    ctx.stroke(path(ctx, g.fenderRear));
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke(path(ctx, g.fenderFront));
    ctx.stroke(path(ctx, g.fenderRear));
  });

  drawFrontFace(ctx, g, p);
  drawRearFace(ctx, g, p);

  withState(ctx, () => {
    ctx.fillStyle = shade(paint.base, -0.3);
    ctx.fill(path(ctx, g.mirror));
    ctx.translate(p.cowlX + 8, p.beltlineY - 23);
    ctx.scale(0.58, 0.58);
    ctx.fillStyle = "rgba(8,10,14,0.95)";
    ctx.fill(path(ctx, g.mirror));
    ctx.translate(-4, 2);
    ctx.fillStyle = "rgba(160,220,255,0.35)";
    ctx.fill(path(ctx, g.mirror));
  });
}

function drawFrontFace(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams) {
  withState(ctx, () => {
    const x0 = g.noseX - 22;
    const y0 = p.noseY - 36;

    const grill = ctx.createLinearGradient(0, p.beltlineY + 100, 0, p.ground);
    grill.addColorStop(0, "rgba(0,0,0,0.92)");
    grill.addColorStop(1, "rgba(8,9,12,0.8)");
    ctx.fillStyle = grill;
    const grillP = new Path2D();
    grillP.moveTo(g.noseX - 10, p.beltlineY + 108);
    grillP.lineTo(g.noseX - 4, p.beltlineY + 150);
    grillP.lineTo(g.noseX - 30, p.beltlineY + 148);
    grillP.lineTo(g.noseX - 34, p.beltlineY + 108);
    grillP.closePath();
    ctx.fill(grillP);

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const yy = p.beltlineY + 118 + i * 12;
      const slat = new Path2D();
      slat.moveTo(g.noseX - 8, yy);
      slat.lineTo(g.noseX - 31, yy + 2);
      ctx.stroke(slat);
    }

    const lens = ctx.createLinearGradient(x0, 0, x0 - 70, 0);
    lens.addColorStop(0, "#eaffff");
    lens.addColorStop(0.4, "#bfe4ff");
    lens.addColorStop(1, "#8fc9f5");
    ctx.fillStyle = lens;
    const headP = new Path2D();
    headP.moveTo(x0, y0);
    headP.lineTo(x0 - 8, y0 + 9);
    headP.lineTo(x0 - 62, y0 + 7);
    headP.lineTo(x0 - 70, y0 - 3);
    headP.closePath();
    ctx.fill(headP);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill(ellipsePath(x0 - 40, y0 + 2, 16, 3, 0, 0, Math.PI * 2));

    const glow = ctx.createRadialGradient(x0 - 18, y0 + 2, 4, x0 - 18, y0 + 2, 110);
    glow.addColorStop(0, "rgba(190,240,255,0.5)");
    glow.addColorStop(1, "rgba(190,240,255,0)");
    ctx.fillStyle = glow;
    ctx.fill(arcPath(x0 - 18, y0 + 2, 110));
  });
}

function drawRearFace(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams) {
  withState(ctx, () => {
    const x0 = p.tailTopX + 2;
    const y0 = p.tailTopY + 4;

    const lens = ctx.createLinearGradient(x0, 0, x0 + 70, 0);
    lens.addColorStop(0, "#ff2038");
    lens.addColorStop(0.5, "#ff5566");
    lens.addColorStop(1, "#c41c34");
    ctx.fillStyle = lens;
    const tailP = new Path2D();
    tailP.moveTo(x0, y0);
    tailP.lineTo(x0 + 9, y0 - 7);
    tailP.lineTo(x0 + 70, y0 - 9);
    tailP.lineTo(x0 + 76, y0 - 1);
    tailP.lineTo(x0 + 20, y0 + 5);
    tailP.closePath();
    ctx.fill(tailP);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill(ellipsePath(x0 + 30, y0 - 3, 18, 2.5, 0, 0, Math.PI * 2));

    const glow = ctx.createRadialGradient(x0 + 30, y0, 4, x0 + 30, y0, 90);
    glow.addColorStop(0, "rgba(255,50,70,0.35)");
    glow.addColorStop(1, "rgba(255,50,70,0)");
    ctx.fillStyle = glow;
    ctx.fill(arcPath(x0 + 30, y0, 90));
  });
}

function drawWheels(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams, paint: VehicleSpec["paint"]) {
  drawWheel(ctx, g.rax, g.axleY, g.wheelR, paint);
  drawWheel(ctx, g.fax, g.axleY, g.wheelR, paint);
}

function drawWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, paint: VehicleSpec["paint"]) {
  const rimR = r - 24;
  const hubR = rimR * 0.24;

  withState(ctx, () => {
    const tire = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    tire.addColorStop(0, "#24282f");
    tire.addColorStop(0.35, "#14161c");
    tire.addColorStop(0.7, "#0a0b0f");
    tire.addColorStop(1, "#05060a");
    ctx.fillStyle = tire;
    ctx.fill(arcPath(cx, cy, r));

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill(arcPath(cx, cy, r - 3, Math.PI * 1.08, Math.PI * 1.92));
  });

  withState(ctx, () => {
    const barrel = ctx.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, rimR);
    barrel.addColorStop(0, "#191c22");
    barrel.addColorStop(0.6, "#0c0d11");
    barrel.addColorStop(1, "#05060a");
    ctx.fillStyle = barrel;
    ctx.fill(arcPath(cx, cy, rimR));
  });

  withState(ctx, () => {
    const disc = ctx.createRadialGradient(cx - 6, cy - 8, 6, cx, cy, rimR - 10);
    disc.addColorStop(0, "#aeb6c4");
    disc.addColorStop(0.55, "#77808e");
    disc.addColorStop(1, "#4a515e");
    ctx.fillStyle = disc;
    ctx.fill(arcPath(cx, cy, rimR - 10));

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    const holes = 10;
    for (let i = 0; i < holes; i++) {
      const a = (i / holes) * Math.PI * 2;
      ctx.fill(arcPath(cx + Math.cos(a) * (rimR - 20), cy + Math.sin(a) * (rimR - 20), 2.2));
    }
  });

  const spokes = 7;
  withState(ctx, () => {
    ctx.translate(cx, cy);
    for (let i = 0; i < spokes; i++) {
      ctx.rotate((Math.PI * 2) / spokes);
      const sg = ctx.createLinearGradient(-rimR, 0, 0, 0);
      sg.addColorStop(0, "#aeb6c2");
      sg.addColorStop(0.6, "#e9edf4");
      sg.addColorStop(1, "#6b7380");
      ctx.fillStyle = sg;
      const spoke = new Path2D();
      spoke.moveTo(-rimR + 4, -7.5);
      spoke.lineTo(-hubR * 1.25, -6.5);
      spoke.lineTo(-hubR * 1.25, 6.5);
      spoke.lineTo(-rimR + 4, 7.5);
      spoke.closePath();
      ctx.fill(spoke);
    }
    ctx.strokeStyle = "rgba(20,22,28,0.55)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < spokes; i++) {
      ctx.rotate((Math.PI * 2) / spokes);
      const edge = new Path2D();
      edge.moveTo(-rimR + 4, -6);
      edge.lineTo(-hubR * 1.25, -5);
      ctx.stroke(edge);
    }
  });

  withState(ctx, () => {
    ctx.fillStyle = "rgba(10,11,15,0.92)";
    ctx.fill(arcPath(cx, cy, rimR - 12));
  });

  withState(ctx, () => {
    ctx.fillStyle = paint.accent;
    ctx.fill(arcPath(cx, cy, hubR));
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill(arcPath(cx - hubR * 0.3, cy - hubR * 0.3, hubR * 0.32));
  });

  withState(ctx, () => {
    ctx.strokeStyle = "rgba(190,200,215,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke(arcPath(cx, cy, rimR - 1));
  });

  withState(ctx, () => {
    ctx.fillStyle = paint.accent;
    const caliper = new Path2D();
    caliper.moveTo(cx - 18, cy - rimR * 0.5);
    caliper.quadraticCurveTo(cx - 10, cy - rimR * 0.56, cx - 4, cy - rimR * 0.45);
    caliper.lineTo(cx - 1, cy - rimR * 0.5);
    caliper.quadraticCurveTo(cx - 18, cy - rimR * 0.74, cx - 24, cy - rimR * 0.6);
    caliper.closePath();
    ctx.fill(caliper);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const calHi = new Path2D();
    calHi.moveTo(cx - 17, cy - rimR * 0.52);
    calHi.quadraticCurveTo(cx - 11, cy - rimR * 0.55, cx - 5, cy - rimR * 0.47);
    calHi.lineTo(cx - 4, cy - rimR * 0.49);
    calHi.quadraticCurveTo(cx - 11, cy - rimR * 0.53, cx - 16, cy - rimR * 0.5);
    calHi.closePath();
    ctx.fill(calHi);
  });

  withState(ctx, () => {
    const hi = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy - r);
    hi.addColorStop(0, "rgba(255,255,255,0)");
    hi.addColorStop(0.45, "rgba(255,255,255,0.13)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.fill(arcPath(cx, cy, r - 3, Math.PI * 1.05, Math.PI * 1.95));
  });
}

function drawGloss(ctx: CanvasRenderingContext2D, g: ReturnType<typeof buildProfile>, p: ProfileParams) {
  const lx = g.rax + g.archR;
  const rx = g.fax - g.archR;

  withState(ctx, () => {
    ctx.clip(path(ctx, g.body));

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const belt = new Path2D();
    belt.moveTo(p.cowlX + 8, p.beltlineY - 6);
    belt.quadraticCurveTo(g.fax - 200, p.beltlineY - 12, p.glassBaseX + 20, p.beltlineY - 2);
    ctx.stroke(belt);

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 5;
    const glass = new Path2D();
    glass.moveTo(p.cowlX - 26, p.beltlineY - 62);
    glass.lineTo(p.glassBaseX + 24, p.beltlineY - 44);
    ctx.stroke(glass);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    const sweep = new Path2D();
    sweep.moveTo(g.fax - 330, p.beltlineY + 52);
    sweep.quadraticCurveTo(g.fax - 260, p.beltlineY + 34, g.fax - 190, p.beltlineY + 56);
    ctx.stroke(sweep);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 7;
    const roofHi = new Path2D();
    roofHi.moveTo(p.roofFrontX + 30, p.roofFrontY + 6);
    roofHi.lineTo(p.roofRearX - 10, p.roofRearY + 4);
    ctx.stroke(roofHi);

    const neon = ctx.createLinearGradient(0, p.rockerY - 12, 0, p.rockerY + 16);
    neon.addColorStop(0, "rgba(255,63,142,0)");
    neon.addColorStop(0.5, "rgba(255,63,142,0.17)");
    neon.addColorStop(1, "rgba(57,217,230,0.09)");
    ctx.fillStyle = neon;
    ctx.fillRect(lx, p.rockerY - 12, rx - lx, 30);

    const cyanEdge = ctx.createLinearGradient(0, 0, g.noseX, 0);
    cyanEdge.addColorStop(0.86, "rgba(57,217,230,0)");
    cyanEdge.addColorStop(0.94, "rgba(57,217,230,0.14)");
    cyanEdge.addColorStop(1, "rgba(57,217,230,0)");
    ctx.fillStyle = cyanEdge;
    ctx.fillRect(p.rearOverhang, p.beltlineY - 60, g.noseX - p.rearOverhang, p.ground - p.beltlineY + 80);

    const rim = ctx.createLinearGradient(0, p.roofRearY - 30, 0, p.beltlineY + 10);
    rim.addColorStop(0, "rgba(140,220,255,0.12)");
    rim.addColorStop(0.5, "rgba(255,63,142,0.05)");
    rim.addColorStop(1, "rgba(140,220,255,0)");
    ctx.strokeStyle = rim;
    ctx.lineWidth = 6;
    ctx.globalCompositeOperation = "screen";
    ctx.stroke(path(ctx, g.body));
    ctx.globalCompositeOperation = "source-over";
  });
}