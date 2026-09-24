"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { GameProvider, useGame } from "@/lib/game/GameContext";
import BootScene from "@/components/experience/BootScene";
import GarageScene from "@/components/experience/GarageScene";
import VehicleSelector from "@/components/experience/VehicleSelector";
import PaintBooth from "@/components/experience/PaintBooth";
import PaintBoothV2 from "@/components/experience/PaintBoothV2";
import RevealSequenceV2 from "@/components/experience/RevealSequenceV2";
import BuildAnalysisV2 from "@/components/experience/BuildAnalysisV2";
import StreetRunV2 from "@/components/experience/StreetRunV2";
import FinalBuildCardV2 from "@/components/experience/FinalBuildCardV2";
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

const LEGACY = process.env.NEXT_PUBLIC_VC_V2_UNLAYER === "1";

function Scenes() {
  const { state } = useGame();
  const scene = state.scene;

  return (
    <AnimatePresence mode="sync">
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
        {scene === "paint-booth" && (LEGACY ? <PaintBooth /> : <PaintBoothV2 />)}
        {scene === "reveal" && (LEGACY ? <RevealSequence /> : <RevealSequenceV2 />)}
        {scene === "analysis" && (LEGACY ? <BuildAnalysis /> : <BuildAnalysisV2 />)}
        {scene === "street-run" && (LEGACY ? <StreetRun /> : <StreetRunV2 />)}
        {scene === "complete" && (LEGACY ? <FinalBuildCard /> : <FinalBuildCardV2 />)}
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