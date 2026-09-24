import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

export interface BrushStroke {
  points: [number, number][]; // texture-space pixels
  size: number; // world meters
  color: string;
  eraser: boolean;
}

/**
 * Canvas-backed livery layer: base paint + brush strokes, rendered into a
 * DynamicTexture applied as the body albedo. Serialized via dataURL export.
 */
export class LiveryLayer {
  readonly texture: DynamicTexture;
  readonly width: number;
  readonly height: number;
  perimeter: number; // world meters
  carWidth: number; // world meters
  strokes: BrushStroke[] = [];
  baseColor: string;

  constructor(scene: Scene, width: number, height: number, perimeter: number, carWidth: number, baseColor: string) {
    this.width = width;
    this.height = height;
    this.perimeter = perimeter;
    this.carWidth = carWidth;
    this.baseColor = baseColor;
    this.texture = new DynamicTexture(`vc-livery-${Date.now()}`, { width, height }, scene, false);
    this.texture.hasAlpha = false;
    this.fillBase(baseColor);
  }

  uPxPerMeter(): number {
    return this.width / this.perimeter;
  }

  vPxPerMeter(): number {
    return this.height / this.carWidth;
  }

  fillBase(color: string): void {
    this.baseColor = color;
    const ctx = this.texture.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.width, this.height);
    const base = Color3.FromHexString(color);
    const light = base.scale(1.28).toHexString();
    const dark = base.scale(0.72).toHexString();
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, light);
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    this.texture.update(false);
  }

  /** Draw one brush stamp at uv-space coordinates. */
  stamp(u: number, v: number, sizeMeters: number, color: string, eraser: boolean): void {
    const ctx = this.texture.getContext() as unknown as CanvasRenderingContext2D;
    const x = u * this.width;
    const y = v * this.height;
    const rx = Math.max(1, (sizeMeters * this.uPxPerMeter()) / 2);
    const ry = Math.max(1, (sizeMeters * this.vPxPerMeter()) / 2);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = eraser ? this.baseColor : color;
    ctx.fill();
    ctx.restore();
    this.texture.update(false);
  }

  /** Stamp along a polyline with gaps interpolated. */
  stampPath(pts: [number, number][], sizeMeters: number, color: string, eraser: boolean): void {
    const ctx = this.texture.getContext() as unknown as CanvasRenderingContext2D;
    const step = Math.max(0.5, (sizeMeters * this.uPxPerMeter()) / 6);
    const rx = Math.max(1, (sizeMeters * this.uPxPerMeter()) / 2);
    const ry = Math.max(1, (sizeMeters * this.vPxPerMeter()) / 2);
    ctx.save();
    ctx.fillStyle = eraser ? this.baseColor : color;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1] ?? pts[i];
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(dist / step));
      for (let s = 0; s <= steps; s++) {
        const x = x0 + ((x1 - x0) * s) / steps;
        const y = y0 + ((y1 - y0) * s) / steps;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    this.texture.update(false);
  }

  redrawAll(): void {
    const ctx = this.texture.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.width, this.height);
    const base = Color3.FromHexString(this.baseColor);
    const light = base.scale(1.28).toHexString();
    const dark = base.scale(0.72).toHexString();
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, light);
    grad.addColorStop(0.5, this.baseColor);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    for (const st of this.strokes) {
      this.stampPath(st.points, st.size, st.color, st.eraser);
    }
    this.texture.update(false);
  }

  exportDataUrl(): string {
    return this.texture.getContext().canvas.toDataURL("image/png");
  }
}