import sharp from "sharp";
import { readFile } from "fs/promises";

const gid = process.argv[2] ?? "seraph-r";
const scale = Number(process.argv[3] ?? "1");
const buf = await readFile(`/tmp/vc-${process.argv[4] === "livery" ? "composite" : "base"}-${gid}.png`);
const Wpx = Math.round(220 * scale);
const Hpx = Math.round(124 * scale);
const { data, info } = await sharp(buf).resize(Wpx, Hpx, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });

const W = info.width, H = info.height;
function lumChar(l) {
  if (l < 0.04) return " ";
  if (l < 0.1) return ".";
  if (l < 0.2) return ":";
  if (l < 0.32) return "-";
  if (l < 0.45) return "=";
  if (l < 0.58) return "+";
  if (l < 0.7) return "*";
  if (l < 0.82) return "#";
  return "%";
}
let out = "";
for (let y = 0; y < H; y++) {
  let row = "";
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * info.channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max - min;
    // tint markers: M=magenta dominant, C=cyan dominant, A=amber, G=green
    if (sat > 55 && lum > 0.06) {
      if (r > 150 && b > 110 && g < 120) row += "M";
      else if (b > 150 && g > 130 && r < 150) row += "C";
      else if (r > 170 && g > 110 && b < 110) row += "A";
      else if (g > 150 && r < 150 && b < 150) row += "G";
      else row += "!";
    } else {
      row += lumChar(lum);
    }
  }
  out += row + "\n";
}
console.log(out);