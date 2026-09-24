"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GarageBackdrop from "@/components/effects/GarageBackdrop";
import FilmGrain from "@/components/effects/FilmGrain";
import Scanlines from "@/components/effects/Scanlines";
import VehicleStage from "@/components/3d/VehicleStage";
import GameButton from "@/components/ui/GameButton";
import HudPanel from "@/components/ui/HudPanel";
import StatBar from "@/components/ui/StatBar";
import { useGame } from "@/lib/game/GameContext";
import { VEHICLES } from "@/lib/game/vehicles";
import { useBuild } from "@/lib/game/useBuild";
import { sound } from "@/lib/sound";

export default function VehicleSelector() {
  const { selectVehicle, setScene, updateBuild } = useGame();
  const build = useBuild();
  const [index, setIndex] = useState(() => Math.max(0, VEHICLES.findIndex((v) => v.id === build.vehicleId)));

  const vehicle = VEHICLES[index];
  const previewBuild = {
    ...build,
    vehicleId: vehicle.id,
    decals: [],
  };

  const move = (dir: number) => {
    sound.click();
    setIndex((i) => (i + dir + VEHICLES.length) % VEHICLES.length);
  };

  const select = () => {
    sound.select();
    selectVehicle(vehicle.id);
    updateBuild({ ...build, vehicleId: vehicle.id, decals: [], updatedAt: Date.now() });
    setScene("paint-booth");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "Enter") select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GarageBackdrop dim />
      <FilmGrain opacity={0.05} />
      <Scanlines />

      <div className="absolute inset-x-0 top-6 z-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-ink-dim">
          Select Platform
        </p>
      </div>

      <div className="absolute inset-y-0 left-[4%] z-20 flex items-center">
        <HudPanel className="w-[340px] px-7 py-7">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">
              {String(index + 1).padStart(2, "0")} / {String(VEHICLES.length).padStart(2, "0")}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {vehicle.drivetrain}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="mt-4 font-display text-4xl leading-none text-ink">{vehicle.name}</h2>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                {vehicle.classLabel} · {vehicle.tagline}
              </p>

              <div className="mt-7 space-y-4">
                <StatBar label="Speed" value={vehicle.stats.speed} accent="#39d9e6" />
                <StatBar label="Acceleration" value={vehicle.stats.acceleration} accent="#39d9e6" />
                <StatBar label="Control" value={vehicle.stats.control} accent="#39d9e6" />
                <StatBar label="Attitude" value={vehicle.stats.attitude} accent="#ff3f8e" />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            <GameButton variant="secondary" size="sm" onClick={() => move(-1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </GameButton>
            <GameButton size="sm" onClick={select}>
              Select
            </GameButton>
            <GameButton variant="secondary" size="sm" onClick={() => move(1)}>
              Next <ChevronRight className="h-4 w-4" />
            </GameButton>
          </div>
        </HudPanel>
      </div>

      <div className="absolute inset-y-0 right-[4%] z-10 flex w-[52%] items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-[56vh] w-full"
          >
            <VehicleStage build={previewBuild} mode="garage" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-7 z-20 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-ink-faint">
          Use ← / → to browse · Enter to select
        </p>
      </div>
    </div>
  );
}