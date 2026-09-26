import { loadDoc } from "./asset-utils.mjs";
for (const f of ["van.glb", "sedan.glb", "cone.glb"]) {
  try {
    const doc = await loadDoc(`vice-customs-assets/environments/vice-coast/traffic/kenney_car_kit_glb_cc0_v1/models_glb/${f}`);
    console.log(f, "ok — textures:", doc.getRoot().listTextures().length);
  } catch (e) {
    console.log(f, "ERR:", String(e).slice(0, 400));
  }
}
