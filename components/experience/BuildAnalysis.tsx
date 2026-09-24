"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import GarageBackdrop from "@/components/effects/GarageBackdrop";
import FilmGrain from "@/components/effects/FilmGrain";
import Scanlines from "@/components/effects/Scanlines";
import VehicleRenderer from "@/components/vehicle/VehicleRenderer";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import CountUp from "@/components/ui/CountUp";
import RadioSubtitle from "@/components/ui/RadioSubtitle";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { CLASSIFICATIONS, pickLine } from "@/lib/game/classifications";
import { sound } from "@/lib/sound";

function StatRow({
  label,
  value,
  accent,
  delay,
}: {
  label: string;
  value: number;
  accent: string;
  delay: number;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/5 py-2.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-dim">{label}</span>
      <span className="flex items-baseline gap-1" style={{ color: accent, textShadow: `0 0 14px ${accent}55` }}>
        <CountUp value={value} delay={delay} className="font-display text-3xl leading-none" />
      </span>
    </div>
  );
}

export default function BuildAnalysis() {
  const { state, setScene } = useGame();
  const vehicle = getVehicle(state.vehicleId);
  const analysis = state.analysis;
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis) return;
    sound.engineLoop(0.35);
    const t = window.setTimeout(() => {
      setLine(pickLine(analysis.personality, state.buildNumber));
      sound.scanner();
    }, 1300);
    return () => {
      window.clearTimeout(t);
      sound.engineOff();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.personality, state.buildNumber]);

  const cls = useMemo(() => {
    return analysis ? CLASSIFICATIONS[analysis.personality] : null;
  }, [analysis]);

  if (!analysis || !cls) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <p className="pulse-slow font-mono text-xs uppercase tracking-[0.4em] text-ink-dim">
          Processing Build Data…
        </p>
      </div>
    );
  }

  const heatStars = Math.max(1, Math.min(5, Math.round((analysis.policeHeat / 100) * 5)));

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GarageBackdrop dim />
      <FilmGrain opacity={0.05} />
      <Scanlines />

      <div className="absolute inset-x-0 top-6 z-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-cyan text-glow-cyan">
          Build Analysis
        </p>
      </div>

      <div className="absolute inset-y-0 left-[5%] z-10 flex w-[46%] items-center justify-center opacity-90">
        <VehicleRenderer
          src={state.compositedUrl ?? ""}
          alt={`${vehicle.name} build`}
          className="h-[46vh] w-full"
          rumble
        />
      </div>

      <div className="absolute inset-y-0 right-[5%] z-20 flex items-center">
        <HudPanel className="w-[370px] px-8 py-7">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">Telemetry</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {vehicle.name}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-4 border-b border-white/10 pb-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
              Build Class
            </p>
            <p className="mt-0.5 font-display text-4xl uppercase leading-none tracking-[0.06em]" style={{ color: cls.color, textShadow: `0 0 24px ${cls.color}77` }}>
              {cls.key}
            </p>
          </motion.div>

          <div className="mt-3">
            <StatRow label="Style" value={analysis.styleScore} accent="#39d9e6" delay={0.1} />
            <StatRow label="Street Rep" value={analysis.streetRep} accent="#39d9e6" delay={0.3} />
            <StatRow label="Subtlety" value={analysis.subtlety} accent="#9aa0ad" delay={0.5} />
            <StatRow label="Police Heat" value={analysis.policeHeat} accent="#ff3f8e" delay={0.7} />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
              Street Presence
            </span>
            <span className="font-mono text-lg tracking-[0.2em] text-amber" style={{ textShadow: "0 0 12px rgba(255,166,64,0.6)" }}>
              {"★".repeat(heatStars)}
              <span className="text-ink-faint/40">{"★".repeat(5 - heatStars)}</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.6 }}
            className="mt-6"
          >
            <GameButton size="lg" className="w-full" onClick={() => { sound.engineStart(); setScene("street-run"); }}>
              Take It Out
            </GameButton>
          </motion.div>
        </HudPanel>
      </div>

      <div className="absolute bottom-7 left-6 z-20">
        <RadioSubtitle speaker="Manny // Shop Radio" text={line} />
      </div>
    </div>
  );
}