import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ReflectionProbe } from "@babylonjs/core/Probes/reflectionProbe";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { IShadowLight } from "@babylonjs/core/Lights/shadowLight";
import { detectQuality } from "@/lib/3d/quality";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

export interface GarageEnvironment {
  floor: Mesh;
  platform: Mesh;
  dispose: () => void;
}

export interface GarageEnvOptions {
  mode?: "garage" | "booth" | "reveal" | "card";
}

export async function buildGarageEnvironment(scene: Scene, opts: GarageEnvOptions = {}): Promise<GarageEnvironment> {
  const quality = detectQuality(false);
  const mode = opts.mode ?? "garage";
  const dim = mode === "reveal";

  // authored parking-garage shell (production asset); procedural walls below as fallback
  let shell: import("@babylonjs/core/Meshes/abstractMesh").AbstractMesh[] | null = null;
  {
    try {
      const res = await SceneLoader.ImportMeshAsync("", "/assets/garage/", "parking-garage.glb", scene);
      shell = res.meshes;
    } catch {
      shell = null;
    }
  }
  const shellRoot = new TransformNode("vc-garage-shell", scene);
  if (shell) {
    for (const m of shell) {
      m.setParent(shellRoot);
    }
  }
  if (shell) {
    shellRoot.position = new Vector3(0, 0, -6);
    shellRoot.rotation.y = Math.PI / 2;
    shellRoot.scaling = new Vector3(1.4, 1.4, 1.4);
    shellRoot.position.y = -0.35;
  }

  const floorMat = new PBRMaterial("vc-floor-mat", scene);
  floorMat.metallic = 0.05;
  floorMat.roughness = 0.55;
  floorMat.albedoColor = new Color3(0.05, 0.055, 0.07);
  const floor = MeshBuilder.CreateGround("vc-floor", { width: 40, height: 40 }, scene);
  floor.material = floorMat;
  floor.receiveShadows = true;

  // hazard strip texture around the platform
  const stripTex = new DynamicTexture("vc-hazard", { width: 128, height: 16 }, scene, false);
  const stripCtx = stripTex.getContext() as unknown as CanvasRenderingContext2D;
  stripCtx.fillStyle = "#1a1a1f";
  stripCtx.fillRect(0, 0, 128, 16);
  stripCtx.fillStyle = "#ffa640";
  for (let x = 0; x < 128; x += 16) {
    stripCtx.beginPath();
    stripCtx.moveTo(x, 16);
    stripCtx.lineTo(x + 16, 0);
    stripCtx.lineTo(x + 16, 8);
    stripCtx.lineTo(x, 16);
    stripCtx.fill();
  }
  stripTex.update(false);

  const platformMat = new PBRMaterial("vc-platform-mat", scene);
  platformMat.metallic = 0.2;
  platformMat.roughness = 0.5;
  platformMat.albedoColor = new Color3(0.08, 0.085, 0.1);
  const platform = MeshBuilder.CreateBox("vc-platform", { width: 6.2, height: 0.16, depth: 10 }, scene);
  platform.position = new Vector3(0, -0.08, 0);
  platform.material = platformMat;
  platform.receiveShadows = true;

  const stripL = MeshBuilder.CreatePlane("vc-strip-l", { width: 10, height: 0.16 }, scene);
  stripL.rotation.x = Math.PI / 2;
  stripL.position = new Vector3(-3.12, 0.012, 0);
  stripL.material = new StandardMaterial("vc-strip-mat-l", scene);
  (stripL.material as StandardMaterial).diffuseTexture = stripTex;
  const stripR = stripL.clone("vc-strip-r");
  stripR.position.x = 3.12;

  // structural silhouettes: walls + ceiling
  const wallMat = new PBRMaterial("vc-wall", scene);
  wallMat.metallic = 0;
  wallMat.roughness = 0.9;
  wallMat.albedoColor = new Color3(0.016, 0.017, 0.024);

  const backWall = MeshBuilder.CreateBox("vc-wall-back", { width: 24, height: 7, depth: 0.4 }, scene);
  backWall.position = new Vector3(0, 3.3, -8.5);
  backWall.material = wallMat;
  if (shell) backWall.isVisible = false;

  const ceilMat = new PBRMaterial("vc-ceil", scene);
  ceilMat.metallic = 0;
  ceilMat.roughness = 0.85;
  ceilMat.albedoColor = new Color3(0.02, 0.02, 0.028);
  const ceiling = MeshBuilder.CreateBox("vc-ceiling", { width: 24, height: 0.4, depth: 20 }, scene);
  ceiling.position = new Vector3(0, 6.6, 0);
  ceiling.material = ceilMat;
  if (shell) ceiling.isVisible = false;

  // overhead light bars
  const lightBarMat = new PBRMaterial("vc-lightbar", scene);
  lightBarMat.metallic = 0;
  lightBarMat.roughness = 0.4;
  lightBarMat.albedoColor = new Color3(0.85, 0.9, 1);
  lightBarMat.emissiveColor = new Color3(0.8, 0.88, 1);
  lightBarMat.emissiveIntensity = dim ? 0.35 : 1;
  const bars: Mesh[] = [];
  for (const x of [-3, 0, 3]) {
    const bar = MeshBuilder.CreateBox(`vc-lightbar-${x}`, { width: 3.2, height: 0.06, depth: 0.3 }, scene);
    bar.position = new Vector3(x, 6.35, 0);
    bar.material = lightBarMat;
    bars.push(bar);
  }

  // neon strips: magenta left, cyan right
  const neonMat = (color: Color3) => {
    const m = new PBRMaterial("vc-neon", scene);
    m.metallic = 0;
    m.roughness = 0.3;
    m.albedoColor = color;
    m.emissiveColor = color;
    m.emissiveIntensity = dim ? 0.4 : 1.6;
    return m;
  };
  const pink = neonMat(new Color3(1, 0.247, 0.557));
  const cyan = neonMat(new Color3(0.224, 0.851, 0.902));

  const stripPink = MeshBuilder.CreateBox("vc-neon-pink", { width: 0.06, height: 0.06, depth: 10 }, scene);
  stripPink.position = new Vector3(-3.3, 1.6, 0);
  stripPink.material = pink;

  const stripCyan = MeshBuilder.CreateBox("vc-neon-cyan", { width: 0.06, height: 0.06, depth: 10 }, scene);
  stripCyan.position = new Vector3(3.3, 1.6, 0);
  stripCyan.material = cyan;

  // signage plane behind the car
  const signTex = new DynamicTexture("vc-sign", { width: 512, height: 128 }, scene, false);
  const signCtx = signTex.getContext() as unknown as CanvasRenderingContext2D;
  signCtx.clearRect(0, 0, 512, 128);
  signCtx.font = "900 56px Arial, sans-serif";
  signCtx.textAlign = "center";
  signCtx.textBaseline = "middle";
  signCtx.shadowColor = "#ff3f8e";
  signCtx.shadowBlur = 24;
  signCtx.fillStyle = "#ff3f8e";
  signCtx.fillText("VICE//CUSTOMS", 256, 50);
  signCtx.shadowColor = "#39d9e6";
  signCtx.fillStyle = "#39d9e6";
  signCtx.font = "600 22px Arial, sans-serif";
  signCtx.shadowBlur = 16;
  signCtx.fillText("OCEAN DISTRICT", 256, 96);
  signTex.update(false);

  const signMat = new PBRMaterial("vc-sign-mat", scene);
  signMat.albedoTexture = signTex;
  signMat.emissiveTexture = signTex;
  signMat.emissiveColor = new Color3(1, 1, 1);
  signMat.emissiveIntensity = dim ? 0.5 : 1.2;
  const sign = MeshBuilder.CreatePlane("vc-sign", { width: 6, height: 1.5 }, scene);
  sign.position = new Vector3(0, 2.9, -8.2);
  sign.material = signMat;

  // lights
  const hemi = new HemisphericLight("vc-hemi", new Vector3(0, 1, 0.2), scene);
  hemi.diffuse = new Color3(0.42, 0.44, 0.55);
  hemi.groundColor = new Color3(0.08, 0.08, 0.1);
  hemi.intensity = dim ? 0.35 : 0.85;

  const key = new SpotLight("vc-key", new Vector3(0, 6.4, 0), new Vector3(0, -1, 0), Math.PI / 3, 1.6, scene);
  key.diffuse = new Color3(0.9, 0.92, 1);
  key.specular = new Color3(0.6, 0.6, 0.7);
  key.intensity = dim ? 0.35 : 0.9;

  const pinkLight = new PointLight("vc-pink", new Vector3(-3.3, 2.6, 2), scene);
  pinkLight.diffuse = new Color3(1, 0.25, 0.56);
  pinkLight.intensity = dim ? 0.5 : 1.4;

  const cyanLight = new PointLight("vc-cyan", new Vector3(3.3, 2.6, 2), scene);
  cyanLight.diffuse = new Color3(0.22, 0.85, 0.9);
  cyanLight.intensity = dim ? 0.5 : 1.4;

  const fill = new PointLight("vc-fill", new Vector3(0, 1.6, -6), scene);
  fill.diffuse = new Color3(0.3, 0.32, 0.4);
  fill.intensity = dim ? 0.3 : 0.55;

  const frontFill = new PointLight("vc-front-fill", new Vector3(0, 1.6, 4.6), scene);
  frontFill.diffuse = new Color3(0.6, 0.62, 0.75);
  frontFill.intensity = dim ? 0.3 : 1.1;

  const backFill = new PointLight("vc-back-fill", new Vector3(0, 1.6, -4.6), scene);
  backFill.diffuse = new Color3(0.4, 0.42, 0.5);
  backFill.intensity = dim ? 0.2 : 0.7;

  // shadow
  let shadowGen: ShadowGenerator | null = null;
  if (quality.profile !== "low") {
    shadowGen = new ShadowGenerator(quality.shadowQuality, key as unknown as IShadowLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 8;
  }

  // reflection probe for car paint
  let probe: ReflectionProbe | null = null;
  if (quality.reflections && mode === "garage") {
    probe = new ReflectionProbe("vc-probe", 256, scene);
    probe.refreshRate = 60;
    const probeMesh = MeshBuilder.CreateBox("vc-probe-mesh", { size: 0.01 }, scene);
    probeMesh.position = new Vector3(0, 1, 0);
    probe.renderList = [platform, ...bars, stripPink, stripCyan, backWall, sign, floor];
    probe.attachToMesh(probeMesh);

  }

  // dust particles
  const particles = new ParticleSystem("vc-dust", Math.round(160 * quality.particlesScale), scene);
  particles.particleTexture = new Texture(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVR42mNk+M9Qz0AEYBxVSF+FAP+tCAILaJUWJQAAAABJRU5ErkJggg==",
    scene,
    true,
    false
  );
  particles.emitter = new Vector3(0, 3, 0);
  particles.minSize = 0.02;
  particles.maxSize = 0.07;
  particles.minLifeTime = 3;
  particles.maxLifeTime = 7;
  particles.emitRate = 14 * quality.particlesScale;
  particles.blendMode = ParticleSystem.BLENDMODE_ONEONE;
  particles.direction1 = new Vector3(-1, -0.15, -1);
  particles.direction2 = new Vector3(1, 0.2, 1);
  particles.minEmitPower = 0.05;
  particles.maxEmitPower = 0.2;
  particles.color1 = new Color4(0.5, 0.55, 0.65, 0.08);
  particles.color2 = new Color4(0.4, 0.45, 0.55, 0.05);
  particles.colorDead = new Color4(0, 0, 0, 0);
  particles.start();

  return {
    floor,
    platform,
    dispose: () => {
      shellRoot.dispose();
      floor.dispose();
      platform.dispose();
      stripL.dispose();
      stripR.dispose();
      backWall.dispose();
      ceiling.dispose();
      for (const b of bars) b.dispose();
      stripPink.dispose();
      stripCyan.dispose();
      sign.dispose();
      floorMat.dispose();
      platformMat.dispose();
      wallMat.dispose();
      ceilMat.dispose();
      lightBarMat.dispose();
      pink.dispose();
      cyan.dispose();
      signMat.dispose();
      stripTex.dispose();
      signTex.dispose();
      key.dispose();
      pinkLight.dispose();
      cyanLight.dispose();
      fill.dispose();
      frontFill.dispose();
      backFill.dispose();
      hemi.dispose();
      shadowGen?.dispose();
      probe?.dispose();
      particles.dispose();
    },
  };
}