import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const file = process.argv[2];
const doc = await io.read(file);
for (const m of doc.getRoot().listMaterials()) {
  const bc = m.getBaseColorFactor();
  const metal = m.getMetallicFactor();
  const rough = m.getRoughnessFactor();
  const tex = m.getBaseColorTexture() ? m.getBaseColorTexture().getImage() : null;
  const texSize = tex ? `${tex.width}x${tex.height}` : "-";
  console.log(m.getName().padEnd(22), `base=${bc ? bc.map(v=>+v.toFixed(2)) : '-'}`, `metal=${metal}`, `rough=${rough}`, `tex=${texSize}`, m.listExtensions().map(e=>e.extensionName).join(','));
}
