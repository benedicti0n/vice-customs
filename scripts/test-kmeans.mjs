import { loadDoc, bakeTransforms } from "./asset-utils.mjs";

const doc = await loadDoc("vice-customs-assets/cars/seraph-r/seraph-r-source.glb");
bakeTransforms(doc);

function primPositions(prim) {
  const pos = prim.getAttribute("POSITION");
  if (!pos) return [];
  const arr = pos.getArray();
  const out = [];
  for (let i = 0; i < arr.length; i += 3) out.push([arr[i], arr[i + 1], arr[i + 2]]);
  return out;
}

function kmeans(pts, k, iters = 14) {
  if (!pts.length) return [];
  const use = pts.map((p) => [p[0], p[2]]);
  const centers = [use[0].slice()];
  while (centers.length < k) {
    let best = -1, bestD = -1;
    for (let i = 0; i < use.length; i++) {
      const d = Math.min(...centers.map((c) => (c[0] - use[i][0]) ** 2 + (c[1] - use[i][1]) ** 2));
      if (d > bestD) { bestD = d; best = i; }
    }
    centers.push(use[best].slice());
  }
  const labels = new Array(use.length).fill(0);
  for (let iter = 0; iter < iters; iter++) {
    let moved = false;
    for (let i = 0; i < use.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = (centers[c][0] - use[i][0]) ** 2 + (centers[c][1] - use[i][1]) ** 2;
        if (d < bestD) { bestD = d; best = c; }
      }
      if (labels[i] !== best) { labels[i] = best; moved = true; }
    }
    if (!moved) break;
    const sums = centers.map(() => [0, 0]);
    const counts = new Array(k).fill(0);
    for (let i = 0; i < use.length; i++) { sums[labels[i]][0] += use[i][0]; sums[labels[i]][1] += use[i][1]; counts[labels[i]]++; }
    for (let c = 0; c < k; c++) if (counts[c]) { centers[c][0] = sums[c][0] / counts[c]; centers[c][1] = sums[c][1] / counts[c]; }
  }
  return { labels, centers };
}

const wheelMats = ["rubber___tires", "rims", "brakeCalipers", "metal_1", "tireProtector"];
const allPts = [];
for (const mesh of doc.getRoot().listMeshes()) {
  const mats = mesh.listPrimitives().map((p) => p.getMaterial()?.getName() ?? "");
  if (mats.some((m) => wheelMats.some((w) => m.includes(w)))) {
    for (const p of mesh.listPrimitives()) allPts.push(...primPositions(p));
  }
}
console.log("total wheel-ish vertices:", allPts.length);
const { labels, centers } = kmeans(allPts, 4);
console.log("centers:", centers.map((c) => c.map((v) => +v.toFixed(3))));
const dist = [0,0,0,0];
for (const l of labels) dist[l]++;
console.log("distribution:", dist);
