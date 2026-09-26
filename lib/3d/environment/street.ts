import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Meshes/instancedMesh";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { DirectionalLight, PointLight, SpotLight } from "@babylonjs/core/Lights";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { detectQuality } from "@/lib/3d/quality";
import { loadKit, instanceKit } from "./kitLoader";

export const ROAD_LENGTH = 1500;
const ROAD_WIDTH = 11;

export interface StreetEnvironment {
  dispose: () => void;
  ground: InstancedMesh[];
}

let streetSeed = 7;
const streetRnd = () => {
  streetSeed = (streetSeed * 16807) % 2147483647;
  return streetSeed / 2147483647;
};
const rnd = streetRnd;

async function authorStreetProps(scene: Scene) {
  try {
    const ind = await loadKit(scene, "/assets/city/industrial/building-a.glb");
    const ind2 = await loadKit(scene, "/assets/city/industrial/building-d.glb");
    const ind3 = await loadKit(scene, "/assets/city/industrial/building-k.glb");
    const chimney = await loadKit(scene, "/assets/city/industrial/chimney-basic.glb").catch(() => null);
    const tank = await loadKit(scene, "/assets/city/industrial/tank.glb").catch(() => null);
    const com = await loadKit(scene, "/assets/city/commercial/building-a.glb").catch(() => null);
    const com2 = await loadKit(scene, "/assets/city/commercial/building-c.glb").catch(() => null);
    const sedan = await loadKit(scene, "/assets/city/traffic/sedan.glb").catch(() => null);
    const van = await loadKit(scene, "/assets/city/traffic/van.glb").catch(() => null);
    const police = await loadKit(scene, "/assets/city/traffic/police.glb").catch(() => null);

    const kits = [ind, ind2, ind3, com, com2].filter(Boolean);
    for (let i = 0; i < 64; i++) {
      const kit = kits[i % kits.length];
      if (!kit) continue;
      const z = -ROAD_LENGTH / 2 + streetRnd() * ROAD_LENGTH;
      const side = streetRnd() > 0.5 ? 1 : -1;
      const dist = ROAD_WIDTH / 2 + 8 + streetRnd() * 30;
      const scale = 2 + streetRnd() * 6;
      const instances = instanceKit(kit, `vc-kit-b${i}`);
      for (const inst of instances) {
        inst.position = new Vector3(side * dist, 0, z);
        inst.scaling.scaleInPlace(scale);
        inst.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
    }
    for (const kit of [chimney, tank]) {
      if (!kit) continue;
      for (let i = 0; i < 10; i++) {
        const z = -ROAD_LENGTH / 2 + streetRnd() * ROAD_LENGTH;
        const side = streetRnd() > 0.5 ? 1 : -1;
        const instances = instanceKit(kit, `vc-kit-c${i}`);
        for (const inst of instances) {
          inst.position = new Vector3(side * (ROAD_WIDTH / 2 + 4), 0, z);
          inst.scaling.scaleInPlace(2 + streetRnd() * 2);
        }
      }
    }
    const traffic = [sedan, van, police, sedan].filter(Boolean);
    for (let i = 0; i < 16; i++) {
      const kit = traffic[i % traffic.length];
      if (!kit) continue;
      const z = -ROAD_LENGTH / 2 + 30 + i * 90;
      const side = i % 2 === 0 ? 1 : -1;
      const instances = instanceKit(kit, `vc-parked-${i}`);
      for (const inst of instances) {
        inst.position = new Vector3(side * 2.2, 0, z);
        inst.scaling.scaleInPlace(2.6);
        inst.rotation.y = side > 0 ? Math.PI : 0;
      }
    }
  } catch {
    /* kit load failure — street keeps the procedural fallback set */
  }
}

export async function buildStreetEnvironment(scene: Scene): Promise<StreetEnvironment> {
  await authorStreetProps(scene);
  const quality = detectQuality(false);

  const asphalt = new PBRMaterial("vc-asphalt", scene);
  asphalt.metallic = 0;
  asphalt.roughness = 0.92;
  asphalt.albedoColor = new Color3(0.04, 0.042, 0.05);

  const road = MeshBuilder.CreateBox("vc-road", { width: ROAD_WIDTH, height: 0.06, depth: ROAD_LENGTH }, scene);
  road.position.y = -0.03;
  road.material = asphalt;
  road.receiveShadows = true;

  const laneTex = new DynamicTexture("vc-lane", { width: 256, height: 64 }, scene, false);
  const lctx = laneTex.getContext() as unknown as CanvasRenderingContext2D;
  lctx.clearRect(0, 0, 256, 64);
  lctx.fillStyle = "rgba(57,217,230,0.75)";
  for (let i = 0; i < 6; i++) {
    lctx.fillRect(0, i * 12 + 4, 190, 3);
  }
  laneTex.update(false);

  const laneMat = new StandardMaterial("vc-lane-mat", scene);
  laneMat.diffuseTexture = laneTex;
  laneMat.emissiveColor = new Color3(0.7, 0.9, 1);

  const dashes = MeshBuilder.CreatePlane("vc-dash", { width: 0.28, height: 48 }, scene);
  dashes.rotation.x = Math.PI / 2;
  dashes.material = laneMat;

  const dashCount = Math.floor(ROAD_LENGTH / 30);
  for (let i = 0; i < dashCount; i++) {
    if (i % 6 !== 0) continue;
    const d = dashes.createInstance("vc-dash-inst");
    d.position = new Vector3(0, 0.03, -ROAD_LENGTH / 2 + 15 + i * 30);
  }

  // ground alongside
  const groundMat = new PBRMaterial("vc-ground", scene);
  groundMat.metallic = 0;
  groundMat.roughness = 0.95;
  groundMat.albedoColor = new Color3(0.016, 0.017, 0.022);
  const ground = MeshBuilder.CreateGround("vc-ground-mesh", { width: ROAD_WIDTH + 80, height: ROAD_LENGTH }, scene);
  ground.position.y = -0.06;
  ground.material = groundMat;
  ground.receiveShadows = true;

  const buildings: InstancedMesh[] = [];

  // ---- palms ----
  const trunkMat = new PBRMaterial("vc-trunk", scene);
  trunkMat.metallic = 0;
  trunkMat.roughness = 0.9;
  trunkMat.albedoColor = new Color3(0.1, 0.07, 0.05);
  const frondMat = new PBRMaterial("vc-frond", scene);
  frondMat.metallic = 0;
  frondMat.roughness = 0.8;
  frondMat.albedoColor = new Color3(0.04, 0.09, 0.06);

  const trunk = MeshBuilder.CreateCylinder("vc-trunk-mesh", { diameter: 0.4, height: 6 }, scene);
  trunk.material = trunkMat;
  const frond = MeshBuilder.CreatePlane("vc-frond-mesh", { width: 3.4, height: 1.2 }, scene);
  frond.material = frondMat;

  for (let i = 0; i < 120; i++) {
    const z = -ROAD_LENGTH / 2 + rnd() * ROAD_LENGTH;
    const side = rnd() > 0.5 ? 1 : -1;
    const dist = ROAD_WIDTH / 2 + 1 + rnd() * 4;
    const t = trunk.createInstance("vc-palm-trunk");
    t.position = new Vector3(side * dist, 3, z);
    t.rotation.z = side * 0.08;
    for (const rot of [-0.5, 0, 0.5]) {
      const f = frond.createInstance("vc-palm-frond");
      f.parent = t;
      f.position = new Vector3(0, 3.2, 0);
      f.rotation.y = rot;
      f.rotation.x = -0.5;
    }
  }

  // ---- streetlights ----
  const poleMat = new PBRMaterial("vc-pole", scene);
  poleMat.metallic = 0.6;
  poleMat.roughness = 0.5;
  poleMat.albedoColor = new Color3(0.12, 0.13, 0.16);
  const lampMat = new PBRMaterial("vc-lamp", scene);
  lampMat.metallic = 0;
  lampMat.roughness = 0.4;
  lampMat.albedoColor = new Color3(1, 0.95, 0.8);
  lampMat.emissiveColor = new Color3(1, 0.95, 0.8);
  lampMat.emissiveIntensity = 1.6;

  const pole = MeshBuilder.CreateCylinder("vc-pole-mesh", { diameter: 0.18, height: 7 }, scene);
  pole.material = poleMat;
  const arm = MeshBuilder.CreateBox("vc-pole-arm", { width: 2.4, height: 0.1, depth: 0.1 }, scene);
  arm.material = poleMat;
  const lamp = MeshBuilder.CreateBox("vc-lamp-mesh", { width: 0.9, height: 0.12, depth: 0.3 }, scene);
  lamp.material = lampMat;

  const poles: InstancedMesh[] = [];
  for (let i = 0; i < 60; i++) {
    const z = -ROAD_LENGTH / 2 + 20 + i * 25;
    for (const side of [-1, 1]) {
      const dist = ROAD_WIDTH / 2 + 0.8;
      const p = pole.createInstance("vc-pole-inst");
      p.position = new Vector3(side * dist, 3.5, z);
      const a = arm.createInstance("vc-pole-arm-inst");
      a.parent = p;
      a.position = new Vector3(-side * 1.2, 3.5, 0);
      const l = lamp.createInstance("vc-lamp-inst");
      l.parent = p;
      l.position = new Vector3(-side * 1.2, 3.42, 0);
      poles.push(p);
    }
  }

  // ---- billboards ----
  const billMat = new DynamicTexture("vc-billboard", { width: 256, height: 64 }, scene, false);
  const bctx = billMat.getContext() as unknown as CanvasRenderingContext2D;
  bctx.clearRect(0, 0, 256, 64);
  bctx.fillStyle = "#ff3f8e";
  bctx.font = "900 30px Arial, sans-serif";
  bctx.textAlign = "center";
  bctx.fillText("VICE//CUSTOMS", 128, 34);
  bctx.fillStyle = "#39d9e6";
  bctx.font = "600 14px Arial, sans-serif";
  bctx.fillText("OCEAN DISTRICT", 128, 52);
  billMat.update(false);

  const billMatPbr = new StandardMaterial("vc-bill-mat", scene);
  billMatPbr.diffuseTexture = billMat;
  billMatPbr.emissiveTexture = billMat;
  billMatPbr.emissiveColor = new Color3(1, 1, 1);
  const bill = MeshBuilder.CreatePlane("vc-bill-mesh", { width: 9, height: 2.3 }, scene);
  bill.material = billMatPbr;
  bill.isPickable = false;

  for (let i = 0; i < 18; i++) {
    const z = -ROAD_LENGTH / 2 + 30 + i * 80;
    const side = rnd() > 0.5 ? 1 : -1;
    const b = bill.createInstance("vc-bill-inst");
    b.position = new Vector3(side * (ROAD_WIDTH / 2 + 5), 4.4, z);
    b.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  }

  // ---- lights ----
  const hemi = new HemisphericLight("vc-hemi", new Vector3(0, 1, 0), scene);
  hemi.diffuse = new Color3(0.16, 0.2, 0.32);
  hemi.groundColor = new Color3(0.05, 0.05, 0.07);
  hemi.intensity = 0.55;

  const moonlight = new DirectionalLight("vc-moon", new Vector3(0.3, -0.8, 0.1), scene);
  moonlight.diffuse = new Color3(0.4, 0.48, 0.7);
  moonlight.intensity = 0.9;

  const moonShadow = new ShadowGenerator(quality.shadowQuality, moonlight);
  moonShadow.useBlurExponentialShadowMap = true;
  moonShadow.blurKernel = 12;

  const headGlow = new SpotLight("vc-headlight", new Vector3(0, 0.8, 0), new Vector3(0, 0, 1), Math.PI / 4, 60, scene);
  headGlow.diffuse = new Color3(0.8, 0.85, 1);
  headGlow.intensity = 1.2;

  const pinkAmb = new PointLight("vc-pink-amb", new Vector3(-12, 4, 0), scene);
  pinkAmb.diffuse = new Color3(1, 0.25, 0.56);
  pinkAmb.intensity = 1.1;

  const cyanAmb = new PointLight("vc-cyan-amb", new Vector3(12, 4, 0), scene);
  cyanAmb.diffuse = new Color3(0.22, 0.85, 0.9);
  cyanAmb.intensity = 1.1;

  const camFill = new PointLight("vc-cam-fill", new Vector3(0, 2.5, -6), scene);
  camFill.diffuse = new Color3(0.35, 0.38, 0.5);
  camFill.intensity = 1.3;

  // ---- dust particles ----
  const particles = new ParticleSystem("vc-street-dust", Math.round(120 * quality.particlesScale), scene);
  particles.particleTexture = new Texture(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVR42mNk+M9Qz0AEYBxVSF+FAP+tCAILaJUWJQAAAABJRU5ErkJggg==",
    scene,
    true,
    false
  );
  particles.emitter = new Vector3(0, 3, 0);
  particles.minSize = 0.04;
  particles.maxSize = 0.12;
  particles.minLifeTime = 2;
  particles.maxLifeTime = 5;
  particles.emitRate = 10 * quality.particlesScale;
  particles.blendMode = ParticleSystem.BLENDMODE_ONEONE;
  particles.direction1 = new Vector3(-0.4, -0.1, 0.6);
  particles.direction2 = new Vector3(0.4, 0.15, 0.9);
  particles.minEmitPower = 0.6;
  particles.maxEmitPower = 1.4;
  particles.color1 = new Color4(0.4, 0.45, 0.55, 0.06);
  particles.color2 = new Color4(0.3, 0.35, 0.45, 0.04);
  particles.colorDead = new Color4(0, 0, 0, 0);
  particles.start();

  return {
    ground: [],
    dispose: () => {
      road.dispose();
      ground.dispose();
      dashes.dispose();

      trunk.dispose();
      frond.dispose();
      pole.dispose();
      arm.dispose();
      lamp.dispose();
      bill.dispose();
      for (const b of buildings) b.dispose();
      for (const p of poles) p.dispose();
      asphalt.dispose();
      laneMat.dispose();
      trunkMat.dispose();
      frondMat.dispose();
      poleMat.dispose();
      lampMat.dispose();
      billMatPbr.dispose();
      laneTex.dispose();
      billMat.dispose();
      hemi.dispose();
      moonlight.dispose();
      headGlow.dispose();
      pinkAmb.dispose();
      cyanAmb.dispose();
      camFill.dispose();
      moonShadow.dispose();
      particles.dispose();
    },
  };
}