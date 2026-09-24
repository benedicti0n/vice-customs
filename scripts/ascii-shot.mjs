import sharp from "sharp";

const file = process.argv[2];
const { data, info } = await sharp(file).resize(120, 68, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
let out = "";
for (let y = 0; y < H; y++) {
  let row = "";
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * info.channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const isNeon = max - min > 80 && (r > 190 || b > 190);
    if (lum < 0.06) row += " ";
    else if (lum < 0.16) row += ".";
    else if (lum < 0.34) row += "+";
    else if (lum < 0.62) row += "#";
    else if (isNeon) row += "*";
    else row += "%";
  }
  out += row + "\n";
}
console.log(out);