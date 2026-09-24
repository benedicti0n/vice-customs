import type { LiveryAnalysis, Personality } from "@/types/game";

const SAMPLE = 96;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = src;
  });
}

export async function analyzeLivery(dataUrl: string): Promise<LiveryAnalysis> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

  let sumL = 0;
  let sumChroma = 0;
  let sumGrad = 0;
  let l2 = 0;
  let hueSin = 0;
  let hueCos = 0;
  let hueWeight = 0;
  const hueBins = new Float32Array(18);

  for (let y = 0; y < SAMPLE; y++) {
    for (let x = 0; x < SAMPLE; x++) {
      const i = (y * SAMPLE + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;

      sumL += l;
      l2 += l * l;
      sumChroma += chroma;

      if (chroma > 0.05) {
        let hue = 0;
        if (max === r) hue = ((g - b) / chroma) % 6;
        else if (max === g) hue = (b - r) / chroma + 2;
        else hue = (r - g) / chroma + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
        const w = chroma * chroma;
        hueSin += Math.sin((hue * Math.PI) / 180) * w;
        hueCos += Math.cos((hue * Math.PI) / 180) * w;
        hueWeight += w;
        const bin = Math.min(17, Math.floor(hue / 20));
        hueBins[bin] += w;
      }

      if (x > 0 && y > 0) {
        const cur = data[(y * SAMPLE + x) * 4] / 255;
        const lx = data[(y * SAMPLE + x - 1) * 4] / 255;
        const ly = data[((y - 1) * SAMPLE + x) * 4] / 255;
        sumGrad += Math.sqrt((cur - lx) * (cur - lx) + (cur - ly) * (cur - ly));
      }
    }
  }

  const n = SAMPLE * SAMPLE;
  const brightness = sumL / n;
  const meanL = sumL / n;
  const variance = Math.max(0, l2 / n - meanL * meanL);
  const contrast = Math.sqrt(variance);
  const saturation = Math.min(1, (sumChroma / n) * 2.2);
  const complexity = Math.min(1, Math.sqrt(sumGrad / n) * 2.1);
  const colorfulness = Math.min(1, Math.sqrt(sumChroma / n) * Math.sqrt(1.7));

  let spread = 0;
  if (hueWeight > 0) {
    for (let i = 0; i < 18; i++) hueBins[i] /= hueWeight;
    for (let i = 0; i < 18; i++) spread += hueBins[i] * hueBins[i];
  }
  const uniform = 1 / 18;
  const purity = hueWeight > 0 ? Math.max(0, 1 - (spread - uniform) / (1 - uniform)) : 0;

  let dominantHue = Math.atan2(hueSin, hueCos) * (180 / Math.PI);
  if (dominantHue < 0) dominantHue += 360;
  dominantHue = hueWeight > 0 ? Math.round(dominantHue) % 360 : 0;

  const styleScore = clamp(Math.round(complexity * 28 + saturation * 38 + colorfulness * 42 + contrast * 12));
  const streetRep = clamp(Math.round(styleScore * 0.6 + saturation * 25 + purity * 10));
  const subtlety = clamp(Math.round(100 - (saturation * 80 + complexity * 60 + colorfulness * 30)));
  const policeHeat = clamp(
    Math.round(complexity * 55 + saturation * 60 + brightness * 12 + (colorfulness > 0.5 ? 14 : 0) + (styleScore > 75 ? 8 : 0))
  );

  const personality = classify({ saturation, brightness, complexity, colorfulness, dominantHue });

  return {
    saturation,
    brightness,
    contrast,
    complexity,
    colorfulness,
    dominantHue,
    styleScore,
    streetRep,
    subtlety,
    policeHeat,
    personality,
  };
}

function classify(a: {
  saturation: number;
  brightness: number;
  complexity: number;
  colorfulness: number;
  dominantHue: number;
}): Personality {
  if (a.colorfulness >= 0.58 && a.complexity >= 0.3) return "Full Chaos";
  if (a.brightness <= 0.22 && a.saturation <= 0.3 && a.complexity <= 0.24) return "Ghost Spec";
  if (isViceHue(a.dominantHue) && a.saturation >= 0.26) return "Vice Classic";
  if (a.saturation >= 0.4 && (a.complexity >= 0.26 || a.colorfulness >= 0.36)) return "Heat Magnet";
  return "Street Clean";
}

export function isViceHue(hue: number): boolean {
  return hue >= 320 || hue <= 45;
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}