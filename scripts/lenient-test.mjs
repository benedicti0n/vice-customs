import { loadDocLenient } from "./asset-utils.mjs";
try {
  const doc = await loadDocLenient("vice-customs-assets/environments/vice-coast/industrial/kenney_city_industrial_glb_cc0_v1/models_glb/building-a.glb");
  console.log("lenient OK — textures:", doc.getRoot().listTextures().length);
} catch (e) {
  console.log("ERR:", String(e).slice(0, 160));
}
