"use client";

import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import GarageBackdrop from "@/components/effects/GarageBackdrop";
import FilmGrain from "@/components/effects/FilmGrain";
import Scanlines from "@/components/effects/Scanlines";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import CountUp from "@/components/ui/CountUp";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { CLASSIFICATIONS } from "@/lib/game/classifications";
import { padBuild } from "@/lib/game/buildNumber";
import { sound } from "@/lib/sound";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function FinalBuildCard() {
  const { state, setScene, newBuild } = useGame();
  const vehicle = getVehicle(state.vehicleId);
  const analysis = state.analysis;
  const cls = analysis ? CLASSIFICATIONS[analysis.personality] : null;

  useEffect(() => {
    sound.engineLoop(0.4);
    return () => sound.engineOff();
  }, []);

  const saveCard = useCallback(async () => {
    if (!state.compositedUrl) return;
    sound.click();
    const car = await loadImage(state.compositedUrl);
    const W = 1200;
    const H = 720;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0c12");
    bg.addColorStop(0.6, "#0d0f16");
    bg.addColorStop(1, "#07080c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    ctx.fillStyle = "#ff3f8e";
    ctx.font = '600 26px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText("VICE//CUSTOMS", 44, 74);
    ctx.fillStyle = "rgba(139,147,166,0.8)";
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText(`BUILD #${padBuild(state.buildNumber)}`, W - 44, 74);

    ctx.textAlign = "right";
    ctx.font = '600 26px "Archivo Black", sans-serif';
    ctx.fillStyle = "#e9edf5";
    ctx.fillText(vehicle.name, W - 44, 132);
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.fillStyle = "rgba(139,147,166,0.9)";
    ctx.fillText(vehicle.tagline, W - 44, 158);

    const carW = Math.min(980, W - 120);
    const carH = carW * (720 / 980);
    const carY = 210;
    ctx.drawImage(car, (W - carW) / 2, carY, carW, carH);

    const grad = ctx.createLinearGradient(0, carY + carH - 80, 0, carY + carH + 40);
    grad.addColorStop(0, "rgba(7,8,12,0)");
    grad.addColorStop(1, "rgba(7,8,12,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, carY + carH - 80, W, 120);

    if (analysis && cls) {
      const stats: [string, number, string][] = [
        ["STYLE", analysis.styleScore, "#39d9e6"],
        ["STREET REP", analysis.streetRep, "#39d9e6"],
        ["HEAT", analysis.policeHeat, "#ff3f8e"],
      ];
      ctx.textAlign = "left";
      stats.forEach(([label, value, color], i) => {
        const x = 90 + i * 240;
        ctx.fillStyle = "rgba(139,147,166,0.8)";
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.fillText(label, x, H - 96);
        ctx.fillStyle = color;
        ctx.font = '600 42px "Archivo Black", sans-serif';
        ctx.fillText(String(value), x, H - 52);
      });

      ctx.textAlign = "right";
      ctx.fillStyle = cls.color;
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(cls.key.toUpperCase(), W - 44, H - 52);
    }

    ctx.fillStyle = "rgba(139,147,166,0.6)";
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("OCEAN DISTRICT — VICE COAST", W / 2, H - 26);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `vice-customs-build-${padBuild(state.buildNumber)}.png`;
    a.click();
  }, [state.buildNumber, state.compositedUrl, vehicle, analysis, cls]);

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
          <HudPanel className="relative w-[min(92vw,840px)] px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl tracking-[0.1em] text-ink">
                  <span className="text-neon text-glow-neon">VICE</span>
                  <span className="mx-1 text-ink-faint">{"//"}</span>
                  <span className="text-cyan text-glow-cyan">CUSTOMS</span>
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                  Build #{padBuild(state.buildNumber)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-dim">Ocean District</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">02:57 AM</p>
              </div>
            </div>

            <div className="relative mt-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.compositedUrl ?? ""}
                alt={`${vehicle.name} final build`}
                className="h-[min(44vh,420px)] w-full object-contain"
                draggable={false}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(255,63,142,0.16), transparent 62%)",
                }}
              />
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-3xl uppercase tracking-[0.08em] text-ink">{vehicle.name}</h2>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                  {vehicle.tagline}
                </p>
              </div>
              {cls && (
                <p
                  className="font-display text-2xl uppercase tracking-[0.1em]"
                  style={{ color: cls.color, textShadow: `0 0 22px ${cls.color}66` }}
                >
                  {cls.key}
                </p>
              )}
            </div>

            {analysis && (
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {(
                  [
                    ["Style", analysis.styleScore, "#39d9e6"],
                    ["Street Rep", analysis.streetRep, "#39d9e6"],
                    ["Heat", analysis.policeHeat, "#ff3f8e"],
                  ] as const
                ).map(([label, value, color]) => (
                  <div key={label} className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">{label}</p>
                    <CountUp
                      value={value}
                      className="mt-1 inline-block font-display text-4xl leading-none"
                    />
                    <div className="mx-auto mt-1 h-1 w-16" style={{ background: `${color}55` }}>
                      <div className="h-full" style={{ width: `${value}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <GameButton
                onClick={() => {
                  sound.select();
                  setScene("paint-booth");
                }}
              >
                Customize Again
              </GameButton>
              <GameButton
                variant="secondary"
                onClick={() => {
                  sound.thump();
                  newBuild();
                }}
              >
                New Build
              </GameButton>
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
    </div>
  );
}