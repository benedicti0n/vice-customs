"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { GameProvider, useGame } from "@/lib/game/GameContext";
import BootScene from "@/components/experience/BootScene";
import GarageScene from "@/components/experience/GarageScene";
import VehicleSelector from "@/components/experience/VehicleSelector";
import PaintBooth from "@/components/experience/PaintBooth";
import RevealSequence from "@/components/experience/RevealSequence";
import BuildAnalysis from "@/components/experience/BuildAnalysis";
import StreetRun from "@/components/experience/StreetRun";
import FinalBuildCard from "@/components/experience/FinalBuildCard";
import { sound } from "@/lib/sound";

function MuteToggle() {
  const { state, toggleMute } = useGame();
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      onClick={() => {
        sound.unlock();
        toggleMute();
      }}
      aria-label={state.muted ? "Unmute" : "Mute"}
      className="absolute right-3 top-1/2 z-[70] -translate-y-1/2 rounded-sm border border-white/10 bg-black/60 p-2.5 text-ink-dim backdrop-blur-sm transition-colors hover:border-cyan/50 hover:text-cyan"
    >
      {state.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </motion.button>
  );
}

function Scenes() {
  const { state } = useGame();
  const scene = state.scene;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scene}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.35 } }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0"
      >
        {scene === "boot" && <BootScene />}
        {scene === "garage" && <GarageScene />}
        {scene === "vehicle-select" && <VehicleSelector />}
        {scene === "paint-booth" && <PaintBooth />}
        {scene === "reveal" && <RevealSequence />}
        {scene === "analysis" && <BuildAnalysis />}
        {scene === "street-run" && <StreetRun />}
        {scene === "complete" && <FinalBuildCard />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Experience() {
  return (
    <GameProvider>
      <MotionConfig reducedMotion="user">
        <main className="relative h-dvh w-full overflow-hidden bg-bg">
          <Scenes />
          <MuteToggle />
        </main>
      </MotionConfig>
    </GameProvider>
  );
}