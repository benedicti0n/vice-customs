"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import GarageBackdrop from "@/components/effects/GarageBackdrop";
import FilmGrain from "@/components/effects/FilmGrain";
import Scanlines from "@/components/effects/Scanlines";
import VehicleRenderer from "@/components/vehicle/VehicleRenderer";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import RadioSubtitle from "@/components/ui/RadioSubtitle";
import Clock from "@/components/ui/Clock";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { sound } from "@/lib/sound";

const GARAGE_LINES = [
  "Bay three is yours. Try not to leave fingerprints.",
  "Shop's quiet tonight. Just how I like it.",
  "Whatever you're planning, the paint booth's ready.",
  "Fresh liner on the floor. Be gentle.",
  "You pick the ride, I'll handle the rest.",
];

export default function GarageScene() {
  const { state, setScene } = useGame();
  const vehicle = getVehicle(state.vehicleId);
  const [muteLine, setMuteLine] = useState<string | null>(null);

  useEffect(() => {
    sound.engineLoop(0.25);
    const iv = window.setInterval(() => {
      sound.scanner();
    }, 9000);
    const lineIv = window.setInterval(() => {
      setMuteLine(GARAGE_LINES[Math.floor(Math.random() * GARAGE_LINES.length)]);
    }, 7000);
    window.setTimeout(() => setMuteLine(GARAGE_LINES[0]), 900);
    return () => {
      window.clearInterval(iv);
      window.clearInterval(lineIv);
      sound.engineOff();
    };
  }, []);

  const serial = useMemo(() => {
    const prefix = vehicle.serialPrefix;
    return `${prefix}-${String(state.buildNumber * 7919 + 3).padStart(6, "0")}`;
  }, [vehicle.serialPrefix, state.buildNumber]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GarageBackdrop />
      <FilmGrain opacity={0.05} />
      <Scanlines />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 bg-[#dce8ff]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.06, 0.3, 0] }}
        transition={{ duration: 1.1, times: [0, 0.25, 0.45, 0.65, 1], ease: "easeOut" }}
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(214,232,255,0.9), rgba(120,140,180,0.4) 60%, transparent 100%)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-[7%] z-10 flex justify-center"
      >
        <div className="relative w-[min(82vw,980px)]">
          <div
            className="pointer-events-none absolute -inset-10"
            style={{
              background:
                "radial-gradient(ellipse 50% 38% at 50% 42%, rgba(255,63,142,0.10), transparent 70%)",
            }}
          />
          <VehicleRenderer
            src={state.compositedUrl ?? ""}
            alt={`${vehicle.name} on the garage floor`}
            className="h-[min(60vh,560px)] w-full"
            rumble
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[96%] h-16 w-[64%] -translate-x-1/2"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), transparent), linear-gradient(180deg, rgba(20,22,30,0.8), transparent)",
              transform: "scaleY(-1)",
              filter: "blur(6px)",
              maskImage: "linear-gradient(180deg, black 0%, transparent 78%)",
            }}
          />
          <motion.div
            aria-hidden
            className="scan-sweep pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(140,220,255,0.07) 48%, rgba(140,220,255,0.14) 50%, rgba(140,220,255,0.07) 52%, transparent 100%)",
            }}
          />
        </div>
      </motion.div>

      <div className="absolute left-6 top-6 z-20">
        <HudPanel className="px-5 py-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">Bay 03</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                VC-LIVERY/2.4
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="font-display text-lg leading-none text-ink">{vehicle.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {serial}
              </p>
            </div>
          </div>
        </HudPanel>
      </div>

      <div className="absolute right-6 top-6 z-20 text-right">
        <HudPanel className="px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
            Vice Coast · Ocean District
          </p>
          <p className="mt-1 font-display text-xl leading-none text-cyan text-glow-cyan">
            <Clock />
          </p>
        </HudPanel>
      </div>

      <div className="absolute bottom-8 left-6 z-20">
        <RadioSubtitle speaker="Manny // Shop Radio" text={muteLine} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="absolute bottom-8 right-6 z-20 flex flex-col items-end gap-3"
      >
        <p className="pr-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          {state.liveryDataUrl ? "Livery on file" : "No livery loaded"}
        </p>
        <div className="flex items-center gap-3">
          <GameButton variant="secondary" onClick={() => { sound.whoosh(); setScene("vehicle-select"); }}>
            Select Vehicle
          </GameButton>
          <GameButton
            onClick={() => {
              sound.shutter();
              setScene("paint-booth");
            }}
          >
            Paint Booth
          </GameButton>
        </div>
      </motion.div>
    </div>
  );
}