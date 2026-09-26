import { loadDoc, normalizeDoc } from "./asset-utils.mjs";
import { flatten, weld } from "@gltf-transform/functions";

const doc = await loadDoc("vice-customs-assets/cars/seraph-r/seraph-r-source.glb");
const root = doc.getRoot();
function primPositions(prim) {
  const pos = prim.getAttribute("POSITION");
  if (!pos) return [];
  const arr = pos.getArray();
  const out = [];
  for (let i = 0; i < arr.length; i += 3) out.push([arr[i], arr[i + 1], arr[i + 2]]);
  return out;
}
const wheelMats = ["rubber___tires", "rims", "brakeCalipers", "metal_1", "tireProtector"];
function wheelPts() {
  const all = [];
  for (const mesh of root.listMeshes()) {
    const mats = mesh.listPrimitives().map((p) => p.getMaterial()?.getName() ?? "");
    if (mats.some((m) => wheelMats.some((w) => m.includes(w)))) {
      for (const p of mesh.listPrimitives()) all.push(...primPositions(p));
    }
  }
  return all;
}
let pts = wheelPts();
let xs = new Set(pts.map(p => p[2].toFixed(1)));
console.log("after load: pts", pts.length, "z-unique:", [...xs].sort().join(","));

await flatten()(doc);
pts = wheelPts();
xs = new Set(pts.map(p => p[2].toFixed(1)));
console.log("after flatten: pts", pts.length, "z-unique:", [...xs].sort().join(","));

await weld({ tolerance: 1e-5 })(doc);
pts = wheelPts();
xs = new Set(pts.map(p => p[2].toFixed(1)));
console.log("after weld: pts", pts.length, "z-unique:", [...xs].sort().join(","));

const b = await normalizeDoc(doc, 4.55);
console.log("normalized bounds:", b.min.map(v=>+v.toFixed(3)), b.max.map(v=>+v.toFixed(3)));
pts = wheelPts();
xs = new Set(pts.map(p => p[2].toFixed(1)));
console.log("after normalize: pts", pts.length, "z-unique:", [...xs].sort().join(","));
