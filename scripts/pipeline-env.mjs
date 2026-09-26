import {
  loadDocLenient as loadDoc,
  writeDoc,
  outDir,
  flattenDoc,
  normalizeDoc,
  simplifyDoc,
  compressDoc,
  setupMeshopt,
  formatBytes,
} from "./asset-utils.mjs";
import { readdirSync, statSync, writeFileSync } from "fs";
import { join, basename } from "path";

/**
 * Garage + city kit pipeline.
 *
 * The scanned parking garage is raw spatial material: we simplify it hard and
 * treat it as the shell; the authored scene adds the VICE props + lighting.
 *
 * City kits (Kenney CC0 GLB packs) are simplified to background/midground
 * budgets and written into public/assets/city/ with a manifest.
 */

async function processGarage() {
  console.log("\n=== garage ===");
  const doc = await loadDoc("vice-customs-assets/environments/mannys-garage/base/parking-garage-source.glb");
  const root = doc.getRoot();
  for (const c of root.listCameras()) c.dispose();
  await flattenDoc(doc);
  const b = await normalizeDoc(doc, -1); // keep metre scale; just ground/center
  console.log("  garage bounds", b.min.map((v) => +v.toFixed(2)), b.max.map((v) => +v.toFixed(2)));
  await simplifyDoc(doc, 45000, { error: 0.02 });
  await outDir("public/assets/garage/");
  await compressDoc(doc, 12);
  await writeDoc(doc, "public/assets/garage/parking-garage.glb");
  console.log("  garage done");
}

async function processCityKit(dir, outDirPath, maxTris, label) {
  console.log(`\n=== ${label} ===`);
  const files = readdirSync(dir).filter((f) => f.endsWith(".glb"));
  await outDir(outDirPath);
  const manifest = [];
  let wrote = 0;
  for (const f of files) {
    const src = join(dir, f);
    const id = basename(f, ".glb");
    try {
      const doc = await loadDoc(src);
      const root = doc.getRoot();
      for (const c of root.listCameras()) c.dispose();
      await flattenDoc(doc);
      await simplifyDoc(doc, maxTris, { error: 0.02 });
      await compressDoc(doc, 12);
      const outFile = join(outDirPath, id + ".glb");
      await writeDoc(doc, outFile);
      manifest.push({ id, file: `${id}.glb`, size: statSync(outFile).size });
      wrote++;
    } catch (e) {
      console.log(`  SKIP ${f}: ${String(e).slice(0, 80)}`);
    }
  }
  writeFileSync(join(outDirPath, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`  ${label}: wrote ${wrote}/${files.length} models`);
}

await setupMeshopt();
await processGarage();
await processCityKit(
  "vice-customs-assets/environments/vice-coast/industrial/kenney_city_industrial_glb_cc0_v1/models_glb",
  "public/assets/city/industrial",
  2500,
  "industrial kit"
);
await processCityKit(
  "vice-customs-assets/environments/vice-coast/commercial/kenney_city_commercial_glb_cc0_v1/models_glb",
  "public/assets/city/commercial",
  2000,
  "commercial kit"
);
await processCityKit(
  "vice-customs-assets/environments/vice-coast/traffic/kenney_car_kit_glb_cc0_v1/models_glb",
  "public/assets/city/traffic",
  1600,
  "traffic kit"
);
console.log("\npipeline done");
void formatBytes;