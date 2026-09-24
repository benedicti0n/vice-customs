import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Scene } from "@babylonjs/core/scene";

export interface DecalPreset {
  id: string;
  label: string;
  /** base footprint width in meters */
  size: number;
  /** draw function for the 256px canvas */
  draw: (ctx: CanvasRenderingContext2D, tint: string) => void;
  aspect: number;
}

const C = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.clearRect(0, 0, size, size);
};

function chevron(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(30, 210);
  ctx.lineTo(128, 40);
  ctx.lineTo(226, 210);
  ctx.lineTo(180, 210);
  ctx.lineTo(128, 100);
  ctx.lineTo(76, 210);
  ctx.closePath();
  ctx.fill();
}

function stripe(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(30, 226);
  ctx.lineTo(226, 30);
  ctx.lineTo(256, 60);
  ctx.lineTo(60, 256);
  ctx.closePath();
  ctx.fill();
}

function circle(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.fill();
}

function flame(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(128, 20);
  ctx.bezierCurveTo(220, 120, 220, 210, 128, 230);
  ctx.bezierCurveTo(60, 210, 36, 120, 128, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(128, 70);
  ctx.bezierCurveTo(170, 120, 170, 170, 128, 190);
  ctx.bezierCurveTo(92, 170, 90, 120, 128, 70);
  ctx.closePath();
  ctx.fill();
}

function skull(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(128, 130, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(78, 120, 100, 66);
  ctx.beginPath();
  ctx.moveTo(96, 186);
  ctx.lineTo(112, 236);
  ctx.lineTo(122, 196);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(160, 186);
  ctx.lineTo(144, 236);
  ctx.lineTo(134, 196);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.beginPath();
  ctx.arc(100, 116, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(156, 116, 20, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 108 : 46;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = 128 + Math.cos(a) * r;
    const y = 128 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function palm(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(128, 240);
  ctx.quadraticCurveTo(120, 130, 140, 80);
  ctx.stroke();
  ctx.lineWidth = 12;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(140, 80);
    ctx.quadraticCurveTo(140 + i * 40, 40 + Math.abs(i) * 18, 140 + i * 62, 50 + Math.abs(i) * 26);
    ctx.stroke();
  }
}

function lightning(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(150, 20);
  ctx.lineTo(70, 140);
  ctx.lineTo(120, 140);
  ctx.lineTo(100, 236);
  ctx.lineTo(190, 110);
  ctx.lineTo(138, 110);
  ctx.closePath();
  ctx.fill();
}

function textPreset(label: string, font: string) {
  return (ctx: CanvasRenderingContext2D, tint: string) => {
    const s = 256;
    C(ctx, s);
    ctx.fillStyle = tint;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 128, 132);
  };
}

function circleBadge(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.strokeStyle = tint;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 96, 0, Math.PI * 2);
  ctx.stroke();
}

function dragon(ctx: CanvasRenderingContext2D, tint: string) {
  const s = 256;
  C(ctx, s);
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.bezierCurveTo(180, 30, 220, 120, 196, 160);
  ctx.bezierCurveTo(230, 150, 240, 180, 214, 196);
  ctx.bezierCurveTo(220, 214, 186, 226, 150, 196);
  ctx.bezierCurveTo(110, 216, 70, 196, 66, 170);
  ctx.bezierCurveTo(36, 150, 40, 100, 60, 60);
  ctx.closePath();
  ctx.fill();
}

export const DECAL_PRESETS: DecalPreset[] = [
  { id: "chevron", label: "CHEVRON", size: 0.5, aspect: 1, draw: chevron },
  { id: "stripe", label: "STRIKE", size: 0.55, aspect: 1, draw: stripe },
  { id: "circle", label: "CIRCLE", size: 0.4, aspect: 1, draw: circle },
  { id: "ring", label: "RING", size: 0.45, aspect: 1, draw: circleBadge },
  { id: "flame", label: "FLAME", size: 0.5, aspect: 1, draw: flame },
  { id: "skull", label: "SKULL", size: 0.42, aspect: 1, draw: skull },
  { id: "star", label: "STAR", size: 0.45, aspect: 1, draw: star },
  { id: "palm", label: "PALM", size: 0.5, aspect: 1, draw: palm },
  { id: "bolt", label: "BOLT", size: 0.45, aspect: 1, draw: lightning },
  { id: "dragon", label: "DRAGON", size: 0.55, aspect: 1, draw: dragon },
  { id: "text-vice", label: "VICE", size: 0.75, aspect: 2.4, draw: textPreset("VICE", "900 64px Arial, sans-serif") },
  { id: "text-ocean", label: "OCEAN", size: 0.8, aspect: 2.6, draw: textPreset("OCEAN", "900 48px Arial, sans-serif") },
  { id: "text-007", label: "007", size: 0.45, aspect: 1.6, draw: textPreset("007", "900 76px Arial, sans-serif") },
  { id: "text-race", label: "RACE", size: 0.7, aspect: 2.2, draw: textPreset("RACE", "900 56px Arial, sans-serif") },
];

const cache = new Map<string, DynamicTexture>();

export function getDecalTexture(scene: Scene, presetId: string, tint: string): DynamicTexture {
  const key = `${presetId}::${tint}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const preset = DECAL_PRESETS.find((p) => p.id === presetId) ?? DECAL_PRESETS[0];
  const tex = new DynamicTexture(`vc-decal-${presetId}`, { width: 256, height: 256 }, scene, false);
  tex.hasAlpha = true;
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  preset.draw(ctx, tint);
  tex.update(false);
  if (cache.size < 40) cache.set(key, tex);
  return tex;
}

export function clearDecalTextureCache(): void {
  cache.clear();
}

export const DECAL_TINTS = ["#ffffff", "#ff3f8e", "#39d9e6", "#ffa640", "#22ff88", "#8b5cf6", "#1f1f28"];

export const DECAL_MATERIALS = [
  { id: "vinyl", label: "VINYL" },
  { id: "painted", label: "PAINTED" },
  { id: "chrome", label: "CHROME" },
  { id: "reflective", label: "REFLECTIVE" },
  { id: "emissive", label: "EMISSIVE" },
] as const;

export type DecalMaterialId = (typeof DECAL_MATERIALS)[number]["id"];