import {
  loadDoc,
  writeDoc,
  outDir,
  removeNodes,
  flattenDoc,
  normalizeDoc,
  simplifyDoc,
  compressDoc,
  setupMeshopt,
} from "./asset-utils.mjs";
import { join } from "path";
import { writeFileSync } from "fs";

/**
 * Production vehicle pipeline.
 *
 * SERAPH R ← tempest-vx source (Supra-style Japanese coupe — better SERAPH fit)
 * TEMPEST VX ← seraph-r source (futuristic street weapon — better TEMPEST fit)
 * MARLIN 88 keeps the procedural fallback (source has no material separation,
 *   no wheel topology, no textures, a validator error, and 657k tris).
 *
 * Steps: strip brands → bake transforms → normalize (m, Y-up, ground=0, X=0,
 * +Z forward) → split fused wheels into 4 pivoted assemblies → semantic names
 * → quantize + meshopt → LOD1 → manifest.
 */

const CARS = [
  {
    id: "seraph-r",
    source: "vice-customs-assets/cars/tempest-vx/tempest-vx-source.glb",
    out: "public/assets/vehicles/seraph-r/",
    removePatterns: ["Text."],
    bodyMaterial: "body_color_supra",
    wheelMaterials: ["rubber___tires", "rims", "brakeCalipers", "metal_1", "tireProtector"],
  },
  {
    id: "tempest-vx",
    source: "vice-customs-assets/cars/seraph-r/seraph-r-source.glb",
    out: "public/assets/vehicles/tempest-vx/",
    removePatterns: [],
    bodyMaterial: "body_color_supra",
    wheelMaterials: ["rubber___tires", "rims", "brakeCalipers", "metal_1", "tireProtector"],
  },
];

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
    let best = -1;
    let bestD = -1;
    for (let i = 0; i < use.length; i++) {
      const d = Math.min(...centers.map((c) => (c[0] - use[i][0]) ** 2 + (c[1] - use[i][1]) ** 2));
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    centers.push(use[best].slice());
  }
  const labels = new Array(use.length).fill(0);
  for (let iter = 0; iter < iters; iter++) {
    let moved = false;
    for (let i = 0; i < use.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = (centers[c][0] - use[i][0]) ** 2 + (centers[c][1] - use[i][1]) ** 2;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        moved = true;
      }
    }
    if (!moved) break;
    const sums = centers.map(() => [0, 0]);
    const counts = new Array(k).fill(0);
    for (let i = 0; i < use.length; i++) {
      sums[labels[i]][0] += use[i][0];
      sums[labels[i]][1] += use[i][1];
      counts[labels[i]]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c]) {
        centers[c][0] = sums[c][0] / counts[c];
        centers[c][1] = sums[c][1] / counts[c];
      }
    }
  }
  return labels;
}

async function processCar(def) {
  console.log(`\n=== ${def.id} (from ${def.source}) ===`);
  const doc = await loadDoc(def.source);
  const root = doc.getRoot();

  if (def.removePatterns.length) removeNodes(doc, def.removePatterns);
  for (const a of root.listAnimations()) a.dispose();
  for (const c of root.listCameras()) c.dispose();

  await flattenDoc(doc);

  const bounds = await normalizeDoc(doc, 4.55);
  console.log("  bounds", bounds.min.map((v) => +v.toFixed(3)), bounds.max.map((v) => +v.toFixed(3)));

  // wheel extraction
  const wheelPrims = [];
  const scene = root.listScenes()[0];
  for (const mesh of root.listMeshes()) {
    const mats = mesh.listPrimitives().map((p) => p.getMaterial()?.getName() ?? "");
    if (mats.some((m) => def.wheelMaterials.some((w) => m.includes(w)))) {
      for (const p of mesh.listPrimitives()) wheelPrims.push({ mesh, prim: p });
    }
  }
  let wheelPivots = null;
  if (wheelPrims.length >= 2) {
    const allPts = [];
    for (const { prim } of wheelPrims) allPts.push(...primPositions(prim));
    const labels = kmeans(allPts, 4);
    const dist = [0, 0, 0, 0];
    for (const l of labels) dist[l]++;
    console.log("  wheel vertex distribution:", dist);

    const clusters = [[], [], [], []];
    let cursor = 0;
    for (const { mesh, prim } of wheelPrims) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute("POSITION");
      const n = primPositions(prim).length;
      if (!idx || !pos) {
        cursor += n;
        continue;
      }
      const idxArr = idx.getArray();
      const primLabels = labels.slice(cursor, cursor + n);
      cursor += n;
      const keep = [[], [], [], []];
      for (let i = 0; i < idxArr.length; i++) {
        const v = idxArr[i];
        keep[primLabels[v]].push(v);
      }
      for (let c = 0; c < 4; c++) {
        if (keep[c].length < 3) continue;
        const newIdx = doc.createAccessor().setArray(new Uint32Array(keep[c]));
        const newPrim = doc.createPrimitive().setIndices(newIdx).setMaterial(prim.getMaterial());
        for (const name of ["POSITION", "NORMAL", "TEXCOORD_0", "TANGENT"]) {
          const attr = prim.getAttribute(name);
          if (attr) newPrim.setAttribute(name, attr);
        }
        clusters[c].push({ mesh, prim: newPrim });
      }
    }

    wheelPivots = [];
    for (let c = 0; c < 4; c++) {
      const pts = [];
      for (let i = 0; i < allPts.length; i++) if (labels[i] === c) pts.push(allPts[i]);
      if (!pts.length) {
        wheelPivots.push(null);
        continue;
      }
      const mean = [0, 0, 0];
      for (const p of pts) for (let i = 0; i < 3; i++) mean[i] += p[i];
      mean[0] /= pts.length;
      mean[1] /= pts.length;
      mean[2] /= pts.length;
      wheelPivots.push(mean);
    }
    console.log(
      "  wheel pivots:",
      wheelPivots.map((p) => (p ? p.map((v) => +v.toFixed(3)) : "EMPTY"))
    );

    for (let c = 0; c < 4; c++) {
      const pivot = wheelPivots[c];
      if (!pivot) continue;
      const wheelNode = doc.createNode(`vc-wheel-${c}`);
      wheelNode.setTranslation(pivot);
      for (const { mesh, prim } of clusters[c]) {
        const partMesh = doc.createMesh(`vc-wheel-part-${c}-${mesh.getName()}`);
        partMesh.addPrimitive(prim);
        const partNode = doc.createNode(`vc-wheel-part-node-${c}-${mesh.getName()}`);
        partNode.setMesh(partMesh);
        partNode.setTranslation([-pivot[0], -pivot[1], -pivot[2]]);
        wheelNode.addChild(partNode);
        mesh.dispose();
      }
      scene.addChild(wheelNode);
    }
  }

  // semantic names
  const groups = { body: def.bodyMaterial, glass: "glass", chrome: "chrome", rubber: "rubber", rim: "rims", light: "light" };
  for (const mesh of root.listMeshes()) {
    const mats = mesh.listPrimitives().map((p) => p.getMaterial()?.getName() ?? "");
    for (const [key, pattern] of Object.entries(groups)) {
      if (mats.some((m) => m.includes(pattern))) {
        mesh.setName(`vc-${key}-${mesh.getName()}`);
        break;
      }
    }
  }

  for (const m of root.listMaterials()) {
    if (m.getName().includes(def.bodyMaterial)) {
      m.setName("vc-body-paint");
    }
  }

  await outDir(def.out);
  await compressDoc(doc, 14);
  const lod0 = `${def.out}${def.id}.glb`;
  await writeDoc(doc, lod0);

  const docLod1 = await loadDoc(lod0);
  await simplifyDoc(docLod1, 22000);
  await compressDoc(docLod1, 12);
  const lod1 = `${def.out}${def.id}-lod1.glb`;
  await writeDoc(docLod1, lod1);

  const manifest = {
    id: def.id,
    source: def.source,
    sourceAttribution: "Unity Fan concept car meshes (CC0); modified for VICE//CUSTOMS.",
    lod0: `${def.id}.glb`,
    lod1: `${def.id}-lod1.glb`,
    bounds,
    wheelPivots,
    bodyMaterial: "vc-body-paint",
    forwardAxis: "+Z",
    units: "meters",
    notes: [],
  };
  writeFileSync(join(def.out, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("  manifest written");
}

await setupMeshopt();
for (const car of CARS) {
  await processCar(car);
}
console.log("\ncar pipeline done");