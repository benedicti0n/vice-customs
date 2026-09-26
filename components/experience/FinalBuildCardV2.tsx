"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import GarageBackdrop from "@/components/effects/GarageBackdrop";
import FilmGrain from "@/components/effects/FilmGrain";
import Scanlines from "@/components/effects/Scanlines";
import VehicleStage, { type StageApi } from "@/components/3d/VehicleStage";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import CountUp from "@/components/ui/CountUp";
import { useBuild } from "@/lib/game/useBuild";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { padBuild } from "@/lib/game/buildNumber";
import { sound } from "@/lib/sound";

const CLASS_COLORS: Record<string, string> = {
  "LOW PROFILE": "#9aa0ad",
  "NEON OUTLAW": "#ff3f8e",
  "MIDNIGHT RUNNER": "#39d9e6",
  "HEAT MAGNET": "#ffa640",
  "OEM+": "#22ff88",
  "STREET SPEC": "#39d9e6",
  "SHOW CAR": "#ff3f8e",
  "GHOST BUILD": "#8ea3bf",
  "VICE ICON": "#ff3f8e",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function FinalBuildCardV2() {
  const { setScene, newBuild } = useGame();
  const build = useBuild();
  const vehicle = getVehicle(build.vehicleId);
  const stageRef = useRef<StageApi | null>(null);
  const telemetry = build.analysis;

  useEffect(() => {
    sound.engineLoop(0.4);
    return () => sound.engineOff();
  }, []);

  const saveCard = useCallback(async () => {
    if (!stageRef.current) return;
    sound.click();
    const snapshot = stageRef.current.snapshotDataUrl();
    const car = snapshot ? await loadImage(snapshot).catch(() => null) : null;

    const W = 1200;
    const H = 720;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0c12");
    bg.addColorStop(0.6, "#0d0f16");
    bg.addColorStop(1, "#050609");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    ctx.fillStyle = "#ff3f8e";
    ctx.font = '600 26px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText("VICE//CUSTOMS", 44, 74);
    ctx.fillStyle = "rgba(154,160,173,0.8)";
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText(`BUILD #${padBuild(build.buildId)}`, W - 44, 74);

    ctx.textAlign = "right";
    ctx.font = '600 26px "Archivo Black", sans-serif';
    ctx.fillStyle = "#ede9df";
    ctx.fillText(vehicle.name, W - 44, 132);
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(154,160,173,0.9)";
    ctx.fillText(vehicle.tagline, W - 44, 158);

    if (car) {
      const carW = Math.min(760, W - 240);
      const carH = (carW * car.naturalHeight) / car.naturalWidth;
      ctx.drawImage(car, (W - carW) / 2, 200, carW, carH);
      const grad = ctx.createLinearGradient(0, 200 + carH - 60, 0, 200 + carH + 30);
      grad.addColorStop(0, "rgba(5,6,9,0)");
      grad.addColorStop(1, "rgba(5,6,9,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 200 + carH - 60, W, 90);
    }

    if (telemetry) {
      const stats: [string, number, string][] = [
        ["STYLE", telemetry.style, "#39d9e6"],
        ["STREET REP", telemetry.streetRep, "#39d9e6"],
        ["HEAT", telemetry.policeHeat, "#ff3f8e"],
      ];
      ctx.textAlign = "left";
      stats.forEach(([label, value, color], i) => {
        const x = 90 + i * 240;
        ctx.fillStyle = "rgba(154,160,173,0.8)";
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.fillText(label, x, H - 96);
        ctx.fillStyle = color;
        ctx.font = '600 42px "Archivo Black", sans-serif';
        ctx.fillText(String(value), x, H - 52);
      });
      ctx.textAlign = "right";
      ctx.fillStyle = CLASS_COLORS[telemetry.classification] ?? "#9aa0ad";
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(telemetry.classification.toUpperCase(), W - 44, H - 52);
    }

    ctx.fillStyle = "rgba(154,160,173,0.6)";
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("OCEAN DISTRICT — VICE COAST", W / 2, H - 26);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `vice-customs-build-${padBuild(build.buildId)}.png`;
    a.click();
  }, [build, telemetry, vehicle]);

  const clsColor = telemetry ? CLASS_COLORS[telemetry.classification] ?? "#9aa0ad" : "#9aa0ad";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GarageBackdrop dim />
      <FilmGrain opacity={0.05} />
      <Scanlines />

      <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HudPanel className="relative w-[min(94vw,880px)] px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl tracking-[0.1em] text-ink">
                  <span className="text-neon text-glow-neon">VICE</span>
                  <span className="mx-1 text-ink-faint">{"//"}</span>
                  <span className="text-cyan text-glow-cyan">CUSTOMS</span>
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                  Build #{padBuild(build.buildId)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-dim">Ocean District</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">02:57 AM</p>
              </div>
            </div>

            <div className="relative mt-4 flex h-[min(38vh,340px)] justify-center">
              <VehicleStage
                build={build}
                mode="card"
                onReady={(api) => {
                  stageRef.current = api;
                }}
              />
              <p className="pointer-events-none absolute bottom-1 z-10 font-mono text-[9px] uppercase tracking-[0.35em] text-ink-faint">
                Drag to rotate
              </p>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-3xl uppercase tracking-[0.08em] text-ink">{vehicle.name}</h2>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">{vehicle.tagline}</p>
              </div>
              {telemetry && (
                <p className="font-display text-2xl uppercase tracking-[0.1em]" style={{ color: clsColor, textShadow: `0 0 22px ${clsColor}66` }}>
                  {telemetry.classification}
                </p>
              )}
            </div>

            {telemetry && (
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {(
                  [
                    ["Style", telemetry.style, "#39d9e6"],
                    ["Street Rep", telemetry.streetRep, "#39d9e6"],
                    ["Heat", telemetry.policeHeat, "#ff3f8e"],
                  ] as const
                ).map(([label, value, color]) => (
                  <div key={label} className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">{label}</p>
                    <CountUp value={value} className="mt-1 inline-block font-display text-4xl leading-none" />
                    <div className="mx-auto mt-1 h-1 w-16" style={{ background: `${color}55` }}>
                      <div className="h-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <GameButton onClick={() => { setScene("paint-booth"); sound.select(); }}>Customize Again</GameButton>
              <GameButton variant="secondary" onClick={() => { sound.thump(); newBuild(); }}>New Build</GameButton>
              <GameButton variant="ghost" onClick={saveCard}>
                <Download className="mr-2 h-4 w-4" /> Save Build Card
              </GameButton>
            </div>
          </HudPanel>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-30 text-center font-mono text-[9px] uppercase tracking-[0.4em] text-ink-faint">
        Vice Customs // Ocean District — all vehicles fictional
      </div>
      <div className="absolute inset-x-0 bottom-1 z-30 text-center font-mono text-[8px] tracking-[0.2em] text-ink-faint/60">
        Concept cars by Unity Fan (CC0) · Parking Garage by SPLEEN VISION (CC BY 4.0) · Kenney (CC0) — modified for VICE//CUSTOMS
      </div>
    </div>
  );
}