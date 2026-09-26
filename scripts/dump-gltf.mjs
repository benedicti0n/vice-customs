import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

const file = process.argv[2];
if (!file) {
  console.error("usage: node dump.mjs <file.glb>");
  process.exit(1);
}

const doc = await io.read(file);
const root = doc.getRoot();

function walk(node, depth) {
  const mesh = node.getMesh();
  const meshName = mesh ? mesh.getName() : "";
  const matNames = mesh ? mesh.listPrimitives().map((p) => (p.getMaterial() ? p.getMaterial().getName() : "none")).join("|") : "";
  const t = node.getTranslation();
  const r = node.getRotation();
  const s = node.getScale();
  const extras = node.getExtras();
  const tStr = t ? `${t.map((v) => +v.toFixed(4))}` : "-";
  const rStr = r ? `${r.map((v) => +v.toFixed(4))}` : "-";
  console.log(
    `${"  ".repeat(depth)}${node.getName()}` +
      `${meshName ? `  [mesh=${meshName}]` : ""}` +
      `${matNames ? `  (${matNames})` : ""}` +
      `  T${tStr} R${rStr} S${s ? s.map((v) => +v.toFixed(3)) : "-"}` +
      `${extras && Object.keys(extras).length ? `  EXTRA=${JSON.stringify(extras).slice(0, 80)}` : ""}`
  );
  for (const child of node.listChildren()) walk(child, depth + 1);
}

for (const scene of root.listScenes()) {
  console.log(`\n=== SCENE ${scene.getName()} ===`);
  for (const node of scene.listChildren()) walk(node, 0);
}

console.log(`\n=== ANIMATIONS (${root.listAnimations().length}) ===`);
for (const a of root.listAnimations()) {
  console.log(`  ${a.getName()} channels=${a.listChannels().length} samplers=${a.listSamplers().length}`);
}

console.log(`\n=== CAMERAS (${root.listCameras().length}) ===`);
console.log(`=== MATERIALS (${root.listMaterials().length}) / TEXTURES (${root.listTextures().length}) / MESHES (${root.listMeshes().length}) / NODES (${root.listNodes().length}) ===`);

// primitive stats per mesh
console.log(`\n=== MESH PRIM COUNTS ===`);
for (const m of root.listMeshes()) {
  const prims = m.listPrimitives();
  let tris = 0;
  for (const p of prims) {
    const idx = p.getIndices();
    if (idx) tris += idx.getCount() / 3;
  }
  console.log(`  ${m.getName().padEnd(30)} prims=${prims.length} tris~${Math.round(tris)}`);
}