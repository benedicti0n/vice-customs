import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptEncoder } from "meshoptimizer";
import { MeshoptDecoder } from "meshoptimizer";
import { MeshoptSimplifier } from "meshoptimizer";
import {
  flatten,
  prune,
  dedup,
  quantize,
  simplify,
  weld,
  joinPrimitives,
  meshopt,
} from "@gltf-transform/functions";
import { mkdirSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, basename, dirname } from "path";

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);

export async function loadDoc(path) {
  return io.read(path);
}

const FALLBACK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8Dwn4GBgYGJAAAxYAP99qTzKQAAAABJRU5ErkJggg==",
  "base64"
);
const FALLBACK_DATA_URI = `data:image/png;base64,${FALLBACK_PNG.toString("base64")}`;

/**
 * Reads a GLB even when external resources (e.g. a shared texture that was
 * dropped from the bundle) are missing. External texture URIs are rewritten
 * to a tiny embedded fallback image at the GLB level, so the geometry loads.
 */
export async function loadDocLenient(path) {
  const fs = await import("fs/promises");
  const raw = Buffer.from(await fs.readFile(path));
  if (raw.length > 20 && raw.toString("utf8", 16, 20) === "JSON") {
    const jsonLen = raw.readUInt32LE(12);
    let json = raw.toString("utf8", 20, 20 + jsonLen);
    if (/\.(png|jpg|jpeg)"/i.test(json)) {
      json = json.replace(/"(?:[^"]*\/)?[^"]+\.(?:png|jpe?g)"/gi, `"${FALLBACK_DATA_URI}"`);
      let jsonBuf = Buffer.from(json, "utf8");
      const paddedLen = Math.ceil(jsonBuf.length / 4) * 4;
      if (paddedLen > jsonBuf.length) {
        const padded = Buffer.alloc(paddedLen, 0x20);
        jsonBuf.copy(padded);
        jsonBuf = padded;
      }
      const bin = raw.subarray(20 + jsonLen);
      const binLen = bin.length >= 8 ? bin.readUInt32LE(0) + 8 : bin.length;
      const total = 20 + 8 + paddedLen + binLen;
      const out = Buffer.alloc(total);
      raw.copy(out, 0, 0, 12);
      out.writeUInt32LE(total, 8);
      out.writeUInt32LE(paddedLen, 12);
      out.writeUInt32LE(0x4e4f534a, 16); // "JSON"
      jsonBuf.copy(out, 20);
      bin.copy(out, 20 + paddedLen);
      return io.readBinary(out);
    }
  }
  return io.read(raw);
}

export async function writeDoc(doc, path) {
  await io.write(path, doc);
  console.log("  wrote", path, formatBytes(statSync(path).size));
}

export function formatBytes(b) {
  if (b > 1e6) return (b / 1e6).toFixed(2) + " MiB";
  if (b > 1e3) return (b / 1e3).toFixed(1) + " KiB";
  return b + " B";
}

/** World-space positions of a primitive. */
function primPositions(prim) {
  const pos = prim.getAttribute("POSITION");
  if (!pos) return [];
  const arr = pos.getArray();
  const out = [];
  for (let i = 0; i < arr.length; i += 3) out.push([arr[i], arr[i + 1], arr[i + 2]]);
  return out;
}

/** Bounds of a list of vectors. */
export function boundsOf(pts) {
  if (!pts.length) return null;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) {
    for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i];
      if (p[i] > max[i]) max[i] = p[i];
    }
  }
  return { min, max };
}

/** Remove nodes by name substring. */
export function removeNodes(doc, patterns) {
  const root = doc.getRoot();
  let removed = 0;
  for (const node of root.listNodes()) {
    if (patterns.some((p) => node.getName().includes(p))) {
      node.dispose();
      removed++;
    }
  }
  if (removed) console.log("  removed nodes:", removed);
}

/** Semantically rename nodes whose mesh carries a material name. */
export function renameByMaterial(doc, map) {
  const root = doc.getRoot();
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const mats = mesh.listPrimitives().map((p) => p.getMaterial()?.getName() ?? "");
    for (const [pattern, name] of Object.entries(map)) {
      if (mats.some((m) => m.includes(pattern))) {
        const base = node.getName().replace(/\.[0-9]+$/g, "");
        node.setName(`${name}-${base}`);
        break;
      }
    }
  }
}

export async function setupMeshopt() {
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  return { MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder };
}

/** Normalize: ground at Y=0, center X=0, forward +Z preserved, length→target. */
export async function normalizeDoc(doc, targetLength = 1) {
  const root = doc.getRoot();
  const allPts = [];
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      allPts.push(...primPositions(prim));
    }
  }
  const b = boundsOf(allPts);
  if (!b) return b;
  const len = b.max[2] - b.min[2];
  const scale = targetLength > 0 ? targetLength / len : 1;
  const tx = -((b.min[0] + b.max[0]) / 2);
  const ty = -b.min[1];
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      if (!pos) continue;
      const arr = pos.getArray();
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = (arr[i] + tx) * scale;
        arr[i + 1] = (arr[i + 1] + ty) * scale;
        arr[i + 2] = arr[i + 2] * scale;
      }
      pos.setArray(arr);
    }
  }
  return { min: [0, 0, b.min[2] * scale], max: [b.max[0] * scale + tx * scale * 0, b.max[1] * scale + ty * scale, b.max[2] * scale] };
}

/** Simplify every mesh to a target triangle budget. */
export async function simplifyDoc(doc, targetTris, opts = {}) {
  const root = doc.getRoot();
  let total = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      if (idx) total += idx.getCount() / 3;
    }
  }
  if (total <= targetTris) return total;
  const ratio = targetTris / total;
  await simplify({
    simplifier: MeshoptSimplifier,
    ratio,
    error: opts.error ?? 0.004,
    lockBorder: opts.lockBorder ?? false,
  })(doc);
  return total;
}

/** Quantize + meshopt compress + dedup. */
export async function compressDoc(doc, qp = 14) {
  await dedup()(doc);
  await quantize({
    quantizePosition: qp,
    quantizeNormal: 10,
    quantizeTexcoord: 12,
    quantizeColor: 8,
  })(doc);
  await prune()(doc);
  const { MeshoptEncoder, MeshoptDecoder } = await setupMeshopt();
  await meshopt({ encoder: MeshoptEncoder, decoder: MeshoptDecoder, level: "medium" })(doc);
}

/**
 * Bake every node's world transform into its mesh vertices, then reset node
 * transforms. More reliable than flatten() for Sketchfab exports (which keep
 * per-node rotations that flatten() leaves untouched).
 */
export function bakeTransforms(doc) {
  const root = doc.getRoot();
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const wm = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      if (!pos) continue;
      const arr = pos.getArray();
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        const z = arr[i + 2];
        arr[i] = wm[0] * x + wm[4] * y + wm[8] * z + wm[12];
        arr[i + 1] = wm[1] * x + wm[5] * y + wm[9] * z + wm[13];
        arr[i + 2] = wm[2] * x + wm[6] * y + wm[10] * z + wm[14];
      }
      pos.setArray(arr);
      const norm = prim.getAttribute("NORMAL");
      if (norm) {
        const na = norm.getArray();
        for (let i = 0; i < na.length; i += 3) {
          const x = na[i];
          const y = na[i + 1];
          const z = na[i + 2];
          const lx = wm[0] * x + wm[4] * y + wm[8] * z;
          const ly = wm[1] * x + wm[5] * y + wm[9] * z;
          const lz = wm[2] * x + wm[6] * y + wm[10] * z;
          const inv = 1 / Math.sqrt(lx * lx + ly * ly + lz * lz);
          na[i] = lx * inv;
          na[i + 1] = ly * inv;
          na[i + 2] = lz * inv;
        }
        norm.setArray(na);
      }
    }
    node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
  }
}

export async function flattenDoc(doc) {
  bakeTransforms(doc);
  await flatten()(doc);
  await weld({ tolerance: 1e-5 })(doc);
}

export { join, dirname, basename, mkdirSync, writeFileSync, readdirSync, existsSync, joinPrimitives, prune, dedup };

export async function outDir(path) {
  mkdirSync(path, { recursive: true });
}