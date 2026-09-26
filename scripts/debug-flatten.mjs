import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { flatten } from "@gltf-transform/functions";

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const file = process.argv[2];
const doc = await io.read(file);
const root = doc.getRoot();
function bounds() {
  const all = [];
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
    const pos = p.getAttribute("POSITION");
    if (pos) { const a = pos.getArray(); for (let i=0;i<a.length;i+=3) all.push([a[i],a[i+1],a[i+2]]); }
  }
  const min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
  for (const p of all) for (let i=0;i<3;i++){ if(p[i]<min[i])min[i]=p[i]; if(p[i]>max[i])max[i]=p[i]; }
  return {min,max,count:all.length};
}
console.log("before flatten:", JSON.stringify(bounds()));
await flatten()(doc);
console.log("after flatten:", JSON.stringify(bounds()));
const scene = root.listScenes()[0];
console.log("root nodes:", scene.listChildren().map(n=>n.getName()+` T${n.getTranslation().map(v=>+v.toFixed(3))} R${n.getRotation().map(v=>+v.toFixed(2))} S${n.getScale().map(v=>+v.toFixed(3))}`));
