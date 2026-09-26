const fs = await import("fs/promises");
const raw = Buffer.from(await fs.readFile("vice-customs-assets/environments/vice-coast/industrial/kenney_city_industrial_glb_cc0_v1/models_glb/building-a.glb"));
const jsonLen = raw.readUInt32LE(12);
let json = raw.toString("utf8", 20, 20 + jsonLen);
const FALLBACK_DATA_URI = "data:image/png;base64,QUJD";
json = json.replace(/"(?:[^"]*\/)?[^"]+\.(?:png|jpe?g)"/gi, `"${FALLBACK_DATA_URI}"`);
const jsonBuf = Buffer.from(json, "utf8");
const paddedLen = Math.ceil(jsonBuf.length / 4) * 4;
const bin = raw.subarray(20 + jsonLen);
const binLen = bin.length >= 8 ? bin.readUInt32LE(0) + 8 : bin.length;
const total = 20 + 8 + paddedLen + binLen;
const out = Buffer.alloc(total);
raw.copy(out, 0, 0, 12);
out.writeUInt32LE(total, 8);
out.writeUInt32LE(paddedLen, 12);
out.writeUInt32LE(0x4e4f534a, 16);
jsonBuf.copy(out, 20);
bin.copy(out, 20 + paddedLen);
console.log("jsonBuf.len", jsonBuf.length, "paddedLen", paddedLen, "binLen", binLen, "total", total);
console.log("new header:", out.toString("utf8", 0, 4), out.readUInt32LE(4), out.readUInt32LE(8), out.readUInt32LE(12), out.toString("utf8", 16, 20));
const { NodeIO } = await import("@gltf-transform/core");
const { KHRONOS_EXTENSIONS } = await import("@gltf-transform/extensions");
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
try {
  const doc = await io.readBinary(out);
  console.log("readBinary OK", doc.getRoot().listMeshes().length);
} catch (e) {
  console.log("readBinary ERR:", String(e).slice(0, 120));
}
