import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { bakeTransforms } from "./asset-utils.mjs";
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const file = process.argv[2];
const doc = await io.read(file);
bakeTransforms(doc);
for (const m of doc.getRoot().listMeshes()) {
  const all = [];
  for (const p of m.listPrimitives()) {
    const pos = p.getAttribute("POSITION");
    if (pos) { const a = pos.getArray(); for (let i=0;i<a.length;i+=3) all.push([a[i],a[i+1],a[i+2]]); }
  }
  if (!all.length) continue;
  const min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9];
  for (const p of all) for (let i=0;i<3;i++){ if(p[i]<min[i])min[i]=p[i]; if(p[i]>max[i])max[i]=p[i]; }
  const mat = m.listPrimitives()[0].getMaterial()?.getName() ?? "?";
  const span = max.map((v,i)=>+(v-min[i]).toFixed(2));
  console.log(m.getName().padEnd(18), mat.padEnd(22), `min[${min.map(v=>+v.toFixed(2))}] max[${max.map(v=>+v.toFixed(2))}] span[${span}]`);
}
