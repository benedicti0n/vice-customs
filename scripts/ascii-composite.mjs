import sharp from "sharp";
import { readFile } from "fs/promises";

const gid = process.argv[2] ?? "seraph-r";
const buf = await readFile(`/tmp/vc-composite-${gid}.png`);
const { data, info } = await sharp(buf).resize(140, 79, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });

const W = info.width;
const H = info.height;
let out = "";
for (let y = 0; y < H; y++) {
  let row = "";
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max - min;
    const isNeon = sat > 90 && (r > 200 || b > 200) && (g < 160);
    if (lum < 0.05) row += " ";
    else if (lum < 0.14) row += ".";
    else if (lum < 0.32) row += "+";
    else if (lum < 0.6) row += "#";
    else if (isNeon) row += "*";
    else row += "%";
  }
  out += row + "\n";
}
console.log(out);