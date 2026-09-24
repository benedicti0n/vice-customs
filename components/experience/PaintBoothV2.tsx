"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Undo2, Redo2, Brush, Sticker, MousePointer2 } from "lucide-react";
import VehicleStage, { type StageApi } from "@/components/3d/VehicleStage";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import { useBuild } from "@/lib/game/useBuild";
import { useGame } from "@/lib/game/GameContext";
import { DECAL_PRESETS, DECAL_TINTS, DECAL_MATERIALS, type DecalMaterialId } from "@/lib/3d/paint/presets";
import type { BrushStroke } from "@/lib/3d/paint/liveryTexture";
import type { DecalInstance } from "@/lib/3d/paint/decals";
import { sound } from "@/lib/sound";

type Tool = "inspect" | "paint" | "decal" | "select";

const BRUSH_COLORS = ["#ff3f8e", "#39d9e6", "#ffa640", "#22ff88", "#ffffff", "#1f1f28"];

const BODY_PAINTS = ["#9fb0c6", "#1f6feb", "#d9c07a", "#2a2a30", "#c2242e", "#0d3b2e"];

interface HistoryEntry {
  strokes: number;
  decals: DecalInstance[];
}

export default function PaintBoothV2() {
  const { state, updateBuild, setScene } = useGame();
  const build = useBuild();
  const apiRef = useRef<StageApi | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>("inspect");
  const [brushColor, setBrushColor] = useState(BRUSH_COLORS[0]);
  const [brushSize, setBrushSize] = useState(0.12);
  const [paintColor, setPaintColor] = useState(build.paint.color);
  const [selectedDecal, setSelectedDecal] = useState<string | null>(null);
  const [decalPreset, setDecalPreset] = useState(DECAL_PRESETS[0].id);
  const [eraser, setEraser] = useState(false);
  const [tint, setTint] = useState(DECAL_TINTS[0]);
  const [decalMaterial, setDecalMaterial] = useState<DecalMaterialId>("vinyl");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const drawing = useRef(false);
  const toolRef = useRef<Tool>("inspect");
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const eraserRef = useRef(eraser);
  const tintRef = useRef(tint);
  const materialRef = useRef<DecalMaterialId>(decalMaterial);
  const presetRef = useRef(decalPreset);
  const buildRef = useRef(build);
  const commitRef = useRef<(next: { strokes?: BrushStroke[]; decals?: DecalInstance[] }) => void>(() => undefined);
  const pushHistRef = useRef<() => void>(() => undefined);

  const syncTool = (t: Tool) => {
    toolRef.current = t;
    setTool(t);
    if (t === "inspect") apiRef.current?.camera.setActive(true);
  };

  const snapshot = useCallback((): HistoryEntry => {
    return { strokes: buildRef.current.livery.strokes.length, decals: buildRef.current.decals.map((d) => ({ ...d, position: [...d.position] as [number, number, number], rotation: [...d.rotation] as [number, number, number, number] })) };
  }, []);

  const commit = useCallback(
    (next: { strokes?: typeof build.livery.strokes; decals?: DecalInstance[] }) => {
      const updated = {
        ...build,
        livery: { ...build.livery, strokes: next.strokes ?? build.livery.strokes },
        decals: next.decals ?? build.decals,
        updatedAt: Date.now(),
      };
      updateBuild(updated);
    },
    [build, updateBuild]
  );

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-40), snapshot()]);
    setFuture([]);
  }, [snapshot]);

  useEffect(() => {
    brushColorRef.current = brushColor;
    brushSizeRef.current = brushSize;
    eraserRef.current = eraser;
    tintRef.current = tint;
    materialRef.current = decalMaterial;
    presetRef.current = decalPreset;
    buildRef.current = build;
    commitRef.current = commit;
    pushHistRef.current = pushHistory;
  }, [brushColor, brushSize, eraser, tint, decalMaterial, decalPreset, build, commit, pushHistory]);

  const undo = useCallback(() => {
    const prev = history[history.length - 1];
    if (!prev) return;
    const api = apiRef.current;
    if (!api) return;
    const strokes = api.livery.strokes.slice(0, prev.strokes);
    const decals = build.decals.slice(0, prev.decals.length);
    setFuture((f) => [...f, snapshot()]);
    setHistory((h) => h.slice(0, -1));
    api.livery.strokes = strokes;
    api.livery.redrawAll();
    api.decals.dispose();
    for (const d of decals) api.decals.restore(d);
    commit({ strokes, decals });
  }, [history, build, commit, snapshot]);

  const redo = useCallback(() => {
    const next = future[future.length - 1];
    if (!next) return;
    const api = apiRef.current;
    if (!api) return;
    const strokes = api.livery.strokes.slice(0, next.strokes);
    const decals = build.decals.slice(0, next.decals.length);
    setHistory((h) => [...h, snapshot()]);
    setFuture((f) => f.slice(0, -1));
    api.livery.strokes = strokes;
    api.livery.redrawAll();
    api.decals.dispose();
    for (const d of decals) api.decals.restore(d);
    commit({ strokes, decals });
  }, [future, build, commit, snapshot]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      switch (e.key) {
        case "1": syncTool("inspect"); break;
        case "2": syncTool("paint"); break;
        case "3": syncTool("decal"); break;
        case "4": syncTool("select"); break;
        case "r": case "R": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              api.decals.rotate(inst, e.shiftKey ? -10 : 10);
              pushHistory();
              commit({ decals: api.decals.list() });
            }
          }
          break;
        }
        case "[": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              api.decals.scaleBy(inst, 0.9);
              pushHistory();
              commit({ decals: api.decals.list() });
            }
          }
          break;
        }
        case "]": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              api.decals.scaleBy(inst, 1.1);
              pushHistory();
              commit({ decals: api.decals.list() });
            }
          }
          break;
        }
        case "d": case "D": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              const copy = api.decals.duplicate(inst);
              pushHistory();
              commit({ decals: api.decals.list() });
              setSelectedDecal(copy.id);
            }
          }
          break;
        }
        case "Delete": case "Backspace": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              api.decals.remove(inst);
              pushHistory();
              commit({ decals: api.decals.list() });
              setSelectedDecal(null);
            }
          }
          break;
        }
        case "o": case "O": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              api.decals.setOpacity(inst, inst.opacity + (e.shiftKey ? -0.15 : 0.15));
              pushHistory();
              commit({ decals: api.decals.list() });
            }
          }
          break;
        }
        case "x": case "X": {
          if (selectedDecal) {
            const inst = api.decals.get(selectedDecal);
            if (inst) {
              inst.material = inst.material === "emissive" ? "vinyl" : "emissive";
              api.decals.setMaterial(inst, inst.material);
              pushHistory();
              commit({ decals: api.decals.list() });
            }
          }
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDecal, history, future, build, undo, redo, pushHistory, commit]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const canvas = api.engine.getRenderingCanvas();
    if (!canvas) return;
    let down = false;
    let strokePts: [number, number][] = [];
    let lastU = 0;
    let lastV = 0;

    const uvFromPointer = (x: number, y: number) => {
      const pick = api.scene.pick(x, y, (m) => m === api.rig.body);
      if (!pick?.hit || !pick.getTextureCoordinates) return null;
      const tc = pick.getTextureCoordinates();
      if (!tc) return null;
      return { u: tc.x, v: tc.y };
    };

    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const t = toolRef.current;

      if (t === "inspect") return;

      if (t === "paint") {
        const uv = uvFromPointer(x, y);
        if (!uv) return;
        api.camera.setActive(false);
        down = true;
        drawing.current = true;
        strokePts = [[uv.u * api.livery.width, uv.v * api.livery.height]];
        lastU = uv.u;
        lastV = uv.v;
        api.livery.stamp(uv.u, uv.v, brushSizeRef.current, brushColorRef.current, eraserRef.current);
        return;
      }

      if (t === "decal") {
        const uv = uvFromPointer(x, y);
        if (!uv) return;
        api.camera.setActive(false);
        const inst = api.decals.placeAtUV(uv.u, uv.v, presetRef.current, tintRef.current, materialRef.current);
        if (inst) {
          pushHistRef.current();
          commitRef.current({ decals: api.decals.list() });
          setSelectedDecal(inst.id);
          syncTool("select");
          sound.click();
        }
        return;
      }

      if (t === "select") {
        const pick = api.scene.pick(x, y);
        const inst = pick?.pickedMesh && pick.pickedMesh.metadata?.decalId ? api.decals.get(pick.pickedMesh.metadata.decalId) : null;
        if (inst) {
          api.camera.setActive(false);
          down = true;
          setSelectedDecal(inst.id);
        } else {
          setSelectedDecal(null);
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const api2 = apiRef.current;
      if (!api2) return;

      if (toolRef.current === "paint" && down && drawing.current) {
        const uv = uvFromPointer(x, y);
        if (!uv) return;
        if (Math.hypot(uv.u - lastU, uv.v - lastV) > 0.001) {
          const tx = uv.u * api2.livery.width;
          const ty = uv.v * api2.livery.height;
          const prev = strokePts[strokePts.length - 1];
          strokePts.push([tx, ty]);
          api2.livery.stampPath([prev, [tx, ty]], brushSizeRef.current, brushColorRef.current, eraserRef.current);
          lastU = uv.u;
          lastV = uv.v;
        }
      }

      if (toolRef.current === "select" && down && selectedDecal) {
        const ray = api2.scene.createPickingRay(x, y, Matrix.Identity(), api2.camera.camera);
        const inst = api2.decals.get(selectedDecal);
        if (inst && ray) api2.decals.moveAlongRay(inst, ray);
      }
    };

    const onUp = () => {
      const api2 = apiRef.current;
      if (!api2) return;
      if (drawing.current && strokePts.length >= 2) {
        api2.livery.strokes.push({ points: strokePts, size: brushSizeRef.current, color: brushColorRef.current, eraser: eraserRef.current });
        pushHistRef.current();
        commitRef.current({ strokes: api2.livery.strokes });
      }
      if (down && toolRef.current === "select" && selectedDecal) {
        const inst = api2.decals.get(selectedDecal);
        if (inst) {
          pushHistRef.current();
          commitRef.current({ decals: api2.decals.list() });
        }
      }
      drawing.current = false;
      down = false;
      strokePts = [];
      api2.camera.setActive(toolRef.current === "inspect");
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [ready, selectedDecal]);

  useEffect(() => {
    if (ready && paintColor !== build.paint.color) {
      const api = apiRef.current;
      if (!api) return;
      const updated = { ...build, paint: { ...build.paint, color: paintColor }, updatedAt: Date.now() };
      updateBuild(updated);
      api.livery.fillBase(paintColor);
      api.livery.redrawAll();
      api.rig.paintMaterial.albedoColor = Color3.FromHexString(paintColor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintColor]);

  const apply = () => {
    sound.reveal();
    updateBuild({ ...build, updatedAt: Date.now() });
    setScene("reveal");
  };

  const onReady = useCallback((api: StageApi) => {
    apiRef.current = api;
    setReady(true);
  }, []);

  const decalCount = build.decals.length;
  const strokeCount = build.livery.strokes.length;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-[#0a0c12]/95 px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="font-display text-base tracking-[0.15em] text-ink">
            <span className="text-neon text-glow-neon">VICE</span>
            <span className="mx-1 text-ink-faint">{"//"}</span>
            <span className="text-cyan text-glow-cyan">CUSTOMS</span>
          </span>
          <span className="hidden h-6 w-px bg-white/10 sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-ink-dim sm:block">
            Paint Array · Session {String(4000 + state.buildNumber).padStart(4, "0")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="blink font-mono text-[10px] uppercase tracking-[0.25em] text-neon">● Array Hot</span>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          {ready && <div className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-ink-faint">Drag to orbit · click the body to work it</div>}
          <VehicleStage build={build} mode="booth" onReady={onReady} />
        </div>

        {!ready && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
            <p className="font-mono text-sm uppercase tracking-[0.3em] text-cyan text-glow-cyan">BODY SCAN COMPLETE</p>
            <p className="pulse-slow mt-4 font-mono text-[11px] uppercase tracking-[0.4em] text-ink-faint">PAINT ARRAY CONNECTING...</p>
          </div>
        )}

        {ready && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2">
            <HudPanel className="pointer-events-auto flex items-center gap-1 px-2 py-1.5">
              <ToolButton active={tool === "inspect"} onClick={() => syncTool("inspect")} title="Inspect (1)"><MousePointer2 className="h-4 w-4" /></ToolButton>
              <ToolButton active={tool === "paint"} onClick={() => syncTool("paint")} title="Paint (2)"><Brush className="h-4 w-4" /></ToolButton>
              <ToolButton active={tool === "decal"} onClick={() => syncTool("decal")} title="Graphics (3)"><Sticker className="h-4 w-4" /></ToolButton>
              <ToolButton active={tool === "select"} onClick={() => syncTool("select")} title="Select (4)"><MousePointer2 className="h-4 w-4" /></ToolButton>
              <span className="mx-1 h-5 w-px bg-white/10" />
              <button className="p-1.5 text-ink-dim hover:text-ink disabled:opacity-30" onClick={undo} disabled={history.length === 0} aria-label="Undo"><Undo2 className="h-4 w-4" /></button>
              <button className="p-1.5 text-ink-dim hover:text-ink disabled:opacity-30" onClick={redo} disabled={future.length === 0} aria-label="Redo"><Redo2 className="h-4 w-4" /></button>
            </HudPanel>
          </div>
        )}

        {ready && tool === "paint" && (
          <div className="absolute left-4 top-4 z-20">
            <HudPanel className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neon">Ink Array</p>
              <div className="mt-2 flex gap-1.5">
                {BRUSH_COLORS.map((c) => (
                  <button key={c} onClick={() => setBrushColor(c)} aria-label={`brush ${c}`}
                    className={`h-5 w-5 rounded-sm border ${brushColor === c ? "border-white" : "border-white/20"}`} style={{ background: c }} />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">Tip</span>
                <input type="range" min={4} max={40} value={brushSize * 200} onChange={(e) => setBrushSize(Number(e.target.value) / 200)} className="w-24 accent-cyan" aria-label="brush size" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">Erase</span>
                <button onClick={() => setEraser((e) => !e)} className={`h-4 w-4 rounded-sm border ${eraser ? "border-neon bg-neon/30" : "border-white/20"}`} aria-label="toggle eraser" />
              </div>
            </HudPanel>
          </div>
        )}

        {ready && tool === "decal" && (
          <div className="absolute left-4 top-4 z-20 max-w-[200px]">
            <HudPanel className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan">Graphic Library</p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {DECAL_PRESETS.map((p) => (
                  <button key={p.id} onClick={() => setDecalPreset(p.id)} aria-label={p.label}
                    className="border border-white/10 bg-black/40 p-1 font-mono text-[9px] uppercase tracking-wide text-ink-dim hover:border-cyan/50 hover:text-ink">
                    {p.label.slice(0, 7)}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                {DECAL_TINTS.map((c) => (
                  <button key={c} onClick={() => setTint(c)} aria-label={`tint ${c}`}
                    className={`h-4 w-4 rounded-sm border ${tint === c ? "border-white" : "border-white/20"}`} style={{ background: c }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {DECAL_MATERIALS.map((m) => (
                  <button key={m.id} onClick={() => setDecalMaterial(m.id)} aria-label={m.label}
                    className={`font-mono text-[9px] uppercase tracking-wide ${decalMaterial === m.id ? "text-cyan" : "text-ink-faint hover:text-ink-dim"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </HudPanel>
          </div>
        )}

        {ready && tool === "select" && selectedDecal && (
          <div className="absolute right-4 top-4 z-20">
            <HudPanel className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber">Selected Graphic</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-dim">
                <span>R rotate</span><span>[ ] scale</span>
                <span>D copy</span><span>X material</span>
                <span>O opacity</span><span>Del remove</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">Tint</span>
                <div className="flex gap-1">
                  {DECAL_TINTS.slice(0, 4).map((c) => (
                    <button key={c} onClick={() => { const inst = apiRef.current?.decals.get(selectedDecal); if (inst) { apiRef.current!.decals.setTint(inst, c); pushHistory(); commit({ decals: apiRef.current!.decals.list() }); } }}
                      className="h-4 w-4 rounded-sm border border-white/20" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </HudPanel>
          </div>
        )}

        {ready && (
          <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
            <HudPanel className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-faint">Body Paint</p>
              <div className="mt-2 flex gap-1.5">
                {BODY_PAINTS.map((c) => (
                  <button key={c} onClick={() => setPaintColor(c)} aria-label={`paint ${c}`}
                    className={`h-5 w-5 rounded-sm border ${paintColor === c ? "border-white" : "border-white/20"}`} style={{ background: c }} />
                ))}
              </div>
            </HudPanel>
          </div>
        )}
      </div>

      <footer className="relative z-20 flex items-center justify-between border-t border-white/10 bg-[#0a0c12]/95 px-5 py-2">
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
          <span>Bay 03</span>
          <span>Graphics {decalCount} · Strokes {strokeCount}</span>
        </div>
        <GameButton size="sm" onClick={apply}>Apply Livery</GameButton>
      </footer>
    </div>
  );
}

function ToolButton({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={title} title={title}
      className={`p-1.5 ${active ? "bg-neon/20 text-neon" : "text-ink-dim hover:text-ink"}`}>
      {children}
    </button>
  );
}

