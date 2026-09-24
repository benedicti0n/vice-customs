"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GarageBackdrop from "@/components/effects/GarageBackdrop";
import FilmGrain from "@/components/effects/FilmGrain";
import Scanlines from "@/components/effects/Scanlines";
import VehicleStage from "@/components/3d/VehicleStage";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import CountUp from "@/components/ui/CountUp";
import RadioSubtitle from "@/components/ui/RadioSubtitle";
import { useBuild } from "@/lib/game/useBuild";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
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

const COMMENTARY: Record<string, string[]> = {
  "LOW PROFILE": ["Stays out of the scanner's good graces. Respect.", "Quiet money. The best kind around here."],
  "NEON OUTLAW": ["That glows harder than the sign out front.", "The night's gonna light you right back up."],
  "MIDNIGHT RUNNER": ["Built for 3 AM and nothing else.", "Blue hour's your territory now."],
  "HEAT MAGNET": ["Cops are gonna see you from three counties away.", "I can hear the radio chatter already. Enjoy it."],
  "OEM+": ["So clean I double-checked the inventory.", "Dealer-spec. Nobody'll believe it's ours."],
  "STREET SPEC": ["Ready for the meet. Maybe the street.", "That'll hold its own down Ocean Ave."],
  "SHOW CAR": ["I asked for a car. You built a centerpiece.", "Every flash in the district's aimed at you."],
  "GHOST BUILD": ["Clean. Quiet. Almost suspiciously sensible.", "Barely registered on the scanner. That's a first for this bay."],
  "VICE ICON": ["Looks like midnight on Ocean Drive.", "Right out of a postcard. The kind they confiscate."],
};

function StatRow({ label, value, accent, delay }: { label: string; value: number; accent: string; delay: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/5 py-2.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-dim">{label}</span>
      <span className="flex items-baseline gap-1" style={{ color: accent, textShadow: `0 0 14px ${accent}55` }}>
        <CountUp value={value} delay={delay} className="font-display text-3xl leading-none" />
      </span>
    </div>
  );
}

export default function BuildAnalysisV2() {
  const { setScene } = useGame();
  const build = useBuild();
  const vehicle = getVehicle(build.vehicleId);
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    sound.engineLoop(0.35);
    const t = window.setTimeout(() => {
      const cls = build.analysis?.classification ?? "LOW PROFILE";
      const lines = COMMENTARY[cls] ?? COMMENTARY["LOW PROFILE"];
      setLine(lines[build.buildId % lines.length]);
      sound.scanner();
    }, 1300);
    return () => {
      window.clearTimeout(t);
      sound.engineOff();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.buildId]);

  const telemetry = build.analysis;

  if (!telemetry) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <p className="pulse-slow font-mono text-xs uppercase tracking-[0.4em] text-ink-dim">Processing Build Data…</p>
      </div>
    );
  }

  const heatStars = Math.max(1, Math.min(5, Math.round((telemetry.policeHeat / 100) * 5)));
  const clsColor = CLASS_COLORS[telemetry.classification] ?? "#9aa0ad";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GarageBackdrop dim />
      <FilmGrain opacity={0.05} />
      <Scanlines />

      <div className="absolute inset-x-0 top-6 z-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-cyan text-glow-cyan">Build Analysis</p>
      </div>

      <div className="absolute inset-y-0 left-[4%] z-10 flex w-[48%] items-center justify-center">
        <div className="h-[52vh] w-full">
          <VehicleStage build={build} mode="garage" />
        </div>
      </div>

      <div className="absolute inset-y-0 right-[4%] z-20 flex items-center">
        <HudPanel className="w-[380px] px-8 py-7">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">Telemetry</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">{vehicle.name}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-4 border-b border-white/10 pb-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">Build Class</p>
            <p className="mt-0.5 font-display text-4xl uppercase leading-none tracking-[0.06em]" style={{ color: clsColor, textShadow: `0 0 24px ${clsColor}77` }}>
              {telemetry.classification}
            </p>
          </motion.div>

          <div className="mt-3">
            <StatRow label="Style" value={telemetry.style} accent="#39d9e6" delay={0.1} />
            <StatRow label="Street Rep" value={telemetry.streetRep} accent="#39d9e6" delay={0.3} />
            <StatRow label="Subtlety" value={telemetry.subtlety} accent="#9aa0ad" delay={0.5} />
            <StatRow label="Police Heat" value={telemetry.policeHeat} accent="#ff3f8e" delay={0.7} />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">Street Presence</span>
            <span className="font-mono text-lg tracking-[0.2em] text-amber" style={{ textShadow: "0 0 12px rgba(255,166,64,0.6)" }}>
              {"★".repeat(heatStars)}
              <span className="text-ink-faint/40">{"★".repeat(5 - heatStars)}</span>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-5 border-t border-white/10 pt-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">Diagnostics</p>
            <div className="mt-2 space-y-1">
              {telemetry.diagnostics.map((d) => (
                <p key={d} className="font-mono text-[10px] tracking-[0.15em] text-ink-dim">{d}</p>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.6 }} className="mt-6">
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