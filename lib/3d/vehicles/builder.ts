import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildProfile, PROFILES } from "@/lib/vehicle/geometry";
import { samplePath, closeLoop, type PathPoint } from "./profile";
import { createVehicleMaterials, createPaintMaterial, makeTailLensMaterial, type VehicleMaterialSet } from "./materials";
import { getVehicle } from "@/lib/game/vehicles";
import type { VehicleRig, WheelRig, VehicleBuildOptions } from "./rig";

const CAR_LENGTH = 4.55;
const ROWS = 9;
const ROW_EDGE_SCALE = 0.86;
const WHEEL_R = 0.33;

export function buildProceduralVehicle(scene: Scene, spec: ReturnType<typeof getVehicle>, opts: VehicleBuildOptions = {}): VehicleRig {
  const params = PROFILES[spec.id];
  const g = buildProfile(params);

  const bodyLoop = closeLoop(samplePath(g.body, 128));
  const windowLoop = closeLoop(samplePath(g.windows, 48));

  const cx = (g.noseX + params.rearOverhang) / 2;
  const cy = params.ground;
  const s = CAR_LENGTH / (g.noseX - params.rearOverhang);

  const to3D = (p: PathPoint): Vector3 => new Vector3(0, (cy - p.y) * s, (p.x - cx) * s);

  const centroid = new Vector3(0, (cy - (params.beltlineY + params.ground) / 2) * s, 0);

  const width = 1.9;
  const halfW = width / 2;

  const root = new TransformNode(`vc-${spec.id}-root`, scene);

  // ---- body hull: sleeve of scaled profile rings across the width axis ----
  const ringPoints = bodyLoop.map(to3D);
  const rings: Vector3[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const xi = -halfW + (r / (ROWS - 1)) * width;
    const f = Math.pow(Math.abs(2 * (xi / width)), 2);
    const k = 1 - (1 - ROW_EDGE_SCALE) * f;
    rings.push(ringPoints.map((p) => new Vector3(xi, centroid.y + (p.y - centroid.y) * k, centroid.z + (p.z - centroid.z) * k)));
  }

  const hull = buildSleeve(scene, rings, "vc-body");
  hull.parent = root;
  hull.receiveShadows = true;
  hull.metadata = { part: "body" };

  const liveryTexture =
    opts.liveryTexture ?? new DynamicTexture(`vc-livery-${spec.id}`, { width: 2048, height: 256 }, scene, false);

  const paintCfg = {
    color: opts.paint?.color ?? spec.paint.base,
    metallic: opts.paint?.metallic ?? 0.62,
    roughness: opts.paint?.roughness ?? 0.28,
    clearcoat: opts.paint?.clearcoat ?? 1,
  };
  const mats: VehicleMaterialSet = createVehicleMaterials(scene, paintCfg);
  const paintMat = createPaintMaterial(scene, paintCfg, liveryTexture);
  hull.material = paintMat;
  mats.paint = paintMat;

  // ---- glass: flat sheets from the window loop, offset outside the hull ----
  const glassX = ROW_EDGE_SCALE * halfW + 0.006;
  const glass = [buildFlatSheet(scene, windowLoop, to3D, -glassX, mats.glass), buildFlatSheet(scene, windowLoop, to3D, glassX, mats.glass)];
  for (const gm of glass) {
    gm.parent = root;
    gm.metadata = { part: "glass" };
  }

  // ---- wheels ----
  const halfWheelbase = (params.wheelbase * s) / 2;
  const wheels: WheelRig[] = [];
  const wheelXs = [-halfW * 0.93, halfW * 0.93];
  const wheelZs = [-halfWheelbase, halfWheelbase];
  for (const z of wheelZs) {
    for (const x of wheelXs) {
      const wheel = buildWheel(scene, new Vector3(x, WHEEL_R, z), mats);
      wheel.node.parent = root;
      wheels.push({ node: wheel.node, steerable: z > 0, axle: new Vector3(1, 0, 0) });
    }
  }

  // ---- lights / details ----
  const noseZ = (g.noseX - cx) * s;
  const tailZ = (params.rearOverhang - cx) * s;
  const beltY = (cy - params.beltlineY) * s;

  const headLights: Mesh[] = [];
  const tailLights: Mesh[] = [];
  for (const x of [-0.78 * halfW, 0.78 * halfW]) {
    const hl = MeshBuilder.CreateBox("vc-headlight", { width: 0.05, height: 0.035, depth: 0.02 }, scene);
    hl.position = new Vector3(x, beltY * 0.62, noseZ - 0.02);
    hl.parent = root;
    hl.material = mats.lightLens;
    hl.metadata = { part: "headlight" };
    headLights.push(hl);

    const tl = MeshBuilder.CreateBox("vc-taillight", { width: 0.44, height: 0.04, depth: 0.015 }, scene);
    tl.position = new Vector3(x, beltY * 0.68, tailZ + 0.012);
    tl.parent = root;
    tl.material = makeTailLensMaterial(scene);
    tl.metadata = { part: "taillight" };
    tailLights.push(tl);
  }

  const grill = MeshBuilder.CreateBox("vc-grill", { width: 0.9 * halfW, height: 0.09, depth: 0.015 }, scene);
  grill.position = new Vector3(0, beltY * 0.5, noseZ - 0.005);
  grill.parent = root;
  grill.material = mats.interior;

  const splitter = MeshBuilder.CreateBox("vc-splitter", { width: 0.95 * width, height: 0.025, depth: 0.14 }, scene);
  splitter.position = new Vector3(0, 0.06, noseZ - 0.06);
  splitter.parent = root;
  splitter.material = mats.rubber;

  const diffuser = MeshBuilder.CreateBox("vc-diffuser", { width: 0.9 * width, height: 0.03, depth: 0.1 }, scene);
  diffuser.position = new Vector3(0, 0.07, tailZ + 0.05);
  diffuser.parent = root;
  diffuser.material = mats.rubber;

  for (const x of [-0.5 * halfW, 0.5 * halfW]) {
    const ex = MeshBuilder.CreateCylinder("vc-exhaust", { diameter: 0.055, height: 0.06 }, scene);
    ex.rotation.x = Math.PI / 2;
    ex.position = new Vector3(x, 0.1, tailZ + 0.07);
    ex.parent = root;
    ex.material = mats.chrome;
  }

  for (const x of [-0.9 * halfW, 0.9 * halfW]) {
    const mir = MeshBuilder.CreateBox("vc-mirror", { width: 0.09, height: 0.05, depth: 0.05 }, scene);
    mir.position = new Vector3(x, beltY * 0.92, (params.cowlX - cx) * s + 0.1);
    mir.parent = root;
    mir.material = paintMat;
  }

  const lip = MeshBuilder.CreateBox("vc-spoiler", { width: 0.86 * width, height: 0.012, depth: 0.11 }, scene);
  lip.position = new Vector3(0, beltY * 1.24, tailZ + 0.02);
  lip.parent = root;
  lip.material = mats.rubber;

  // ---- metrics ----
  const cameraTarget = new Vector3(0, beltY * 0.75, 0);
  const perimeter = ringPerimeter(ringPoints);

  const rig: VehicleRig = {
    root,
    body: hull,
    glass,
    wheels,
    headlights: headLights,
    taillights: tailLights,
    paintMaterial: paintMat,
    liveryTexture,
    cameraTarget,
    wheelbase: halfWheelbase * 2,
    bodyPerimeter: perimeter,
    pointAtUV: createUVPicker(rings),
    update: (dt, state) => {
      const { speed, steer } = state;
      for (const w of wheels) {
        w.node.rotation.x += speed * dt;
        if (w.steerable) {
          const targetYaw = steer * 0.35;
          w.node.rotation.y += (targetYaw - w.node.rotation.y) * Math.min(1, dt * 8);
        }
      }
    },
    dispose: () => {
      for (const w of wheels) w.node.dispose();
      for (const gm of glass) gm.dispose();
      for (const h of headLights) h.dispose();
      for (const t of tailLights) t.dispose();
      grill.dispose();
      splitter.dispose();
      diffuser.dispose();
      lip.dispose();
      hull.dispose();
      root.dispose();
      paintMat.dispose();
      mats.glass.dispose();
      mats.chrome.dispose();
      mats.rubber.dispose();
      mats.interior.dispose();
      mats.lightLens.dispose();
      mats.accent.dispose();
      if (liveryTexture) liveryTexture.dispose();
    },
  };

  return rig;
}

function buildSleeve(scene: Scene, rings: Vector3[][], name: string): Mesh {
  const n = rings[0].length;
  const rows = rings.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    for (let j = 0; j < n; j++) {
      const p = rings[r][j];
      positions.push(p.x, p.y, p.z);
      uvs.push(j / (n - 1), r / (rows - 1));
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      const a = r * n + j;
      const b = r * n + j2;
      const c = (r + 1) * n + j;
      const d = (r + 1) * n + j2;
      indices.push(a, c, b, b, c, d);
    }
  }

  const mesh = new Mesh(name, scene);
  mesh.setVerticesBuffer(new VertexBuffer(mesh.getEngine(), positions, VertexBuffer.PositionKind, false, false, 3));
  mesh.setVerticesBuffer(new VertexBuffer(mesh.getEngine(), uvs, VertexBuffer.UVKind, false, false, 2));
  mesh.setIndices(indices);
  mesh.isVisible = true;
  return mesh;
}

function buildFlatSheet(scene: Scene, loop: PathPoint[], to3D: (p: PathPoint) => Vector3, x: number, material: VehicleMaterialSet["glass"]): Mesh {
  const pts = loop.map(to3D);
  const n = pts.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let r = 0; r < 2; r++) {
    for (let j = 0; j < n; j++) {
      const p = pts[j];
      positions.push(x, p.y, p.z);
      uvs.push(j / (n - 1), r);
    }
  }
  for (let j = 0; j < n; j++) {
    const j2 = (j + 1) % n;
    const a = j;
    const b = j2;
    const c = n + j;
    const d = n + j2;
    indices.push(a, b, c, b, d, c);
  }
  const mesh = new Mesh(`vc-glass-${x > 0 ? "r" : "l"}`, scene);
  mesh.setVerticesBuffer(new VertexBuffer(mesh.getEngine(), positions, VertexBuffer.PositionKind, false, false, 3));
  mesh.setVerticesBuffer(new VertexBuffer(mesh.getEngine(), uvs, VertexBuffer.UVKind, false, false, 2));
  mesh.setIndices(indices);
  mesh.material = material;
  mesh.sideOrientation = Mesh.DOUBLESIDE;
  return mesh;
}

function buildWheel(scene: Scene, center: Vector3, mats: VehicleMaterialSet): { node: TransformNode } {
  const group = new TransformNode("vc-wheel-node", scene);
  const tire = MeshBuilder.CreateCylinder("vc-tire", { diameter: WHEEL_R * 2, height: 0.26, tessellation: 24 }, scene);
  tire.rotation.z = Math.PI / 2;
  tire.parent = group;
  tire.material = mats.rubber;

  const rim = MeshBuilder.CreateCylinder("vc-rim", { diameter: WHEEL_R * 1.28, height: 0.28, tessellation: 24 }, scene);
  rim.rotation.z = Math.PI / 2;
  rim.parent = group;
  rim.material = mats.chrome;

  const hub = MeshBuilder.CreateCylinder("vc-hub", { diameter: WHEEL_R * 0.5, height: 0.3, tessellation: 16 }, scene);
  hub.rotation.z = Math.PI / 2;
  hub.parent = group;
  hub.material = mats.accent;

  const spokes = 6;
  for (let i = 0; i < spokes; i++) {
    const spoke = MeshBuilder.CreateBox("vc-spoke", { width: 0.03, height: WHEEL_R * 0.78, depth: 0.24 }, scene);
    spoke.parent = group;
    spoke.material = mats.chrome;
    const a = (i / spokes) * Math.PI * 2;
    spoke.position = new Vector3(0, Math.cos(a) * WHEEL_R * 0.55, Math.sin(a) * WHEEL_R * 0.55);
  }

  group.position = center;
  return { node: group };
}

function ringPerimeter(ring: Vector3[]): number {
  let len = 0;
  for (let j = 0; j < ring.length; j++) {
    len += ring[j].subtract(ring[(j + 1) % ring.length]).length();
  }
  return len;
}

/** Analytic UV picker: normal derived from ring geometry (no facet indexing). */
function createUVPicker(rings: Vector3[][]): (u: number, v: number) => { position: Vector3; normal: Vector3 } | null {
  const n = rings[0].length;
  const rows = rings.length;
  return (u, v) => {
    const r = Math.max(0, Math.min(rows - 1, Math.round(v * (rows - 1))));
    const j = Math.round(u * (n - 1)) % n;
    const p = rings[r][j];
    const jPrev = (j - 1 + n) % n;
    const jNext = (j + 1) % n;
    const rPrev = Math.max(0, r - 1);
    const rNext = Math.min(rows - 1, r + 1);
    const dU = rings[r][jNext].subtract(rings[r][jPrev]);
    const dV = rings[rNext][j].subtract(rings[rPrev][j]);
    const normal = Vector3.Cross(dU, dV).normalize();
    return { position: p, normal };
  };
}