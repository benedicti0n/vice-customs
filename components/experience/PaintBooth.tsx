"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import GameButton from "@/components/ui/GameButton";
import Scanlines from "@/components/effects/Scanlines";
import FilmGrain from "@/components/effects/FilmGrain";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { templateDataUrl } from "@/lib/livery/template";
import { padBuild } from "@/lib/game/buildNumber";
import { sound } from "@/lib/sound";

const ImageEditor = dynamic(() => import("@unlayer/react-image-editor"), { ssr: false });

const BOOT_STEPS = ["PAINT ARRAY ONLINE", "BODY TEMPLATE ACQUIRED", "INK ARRAY WARMING"];

export default function PaintBooth() {
  const { state, applyLivery, setScene } = useGame();
  const vehicle = getVehicle(state.vehicleId);
  const [phase, setPhase] = useState<"shutter" | "editor" | "error">("shutter");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const template = useMemo(() => templateDataUrl(), []);
  const session = useMemo(() => `SESSION ${String(4000 + state.buildNumber).padStart(4, "0")}`, [state.buildNumber]);

  const startBoot = () => {
    setPhase("shutter");
    sound.shutter();
    window.setTimeout(() => {
      setPhase("editor");
      sound.select();
    }, 1900);
  };

  useEffect(() => {
    const id = window.setTimeout(() => startBoot(), 250);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0c12]/95 px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="font-display text-base tracking-[0.15em] text-ink">
            <span className="text-neon text-glow-neon">VICE</span>
            <span className="mx-1 text-ink-faint">{"//"}</span>
            <span className="text-cyan text-glow-cyan">CUSTOMS</span>
          </span>
          <span className="hidden h-6 w-px bg-white/10 sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-ink-dim sm:block">
            Paint Array · {session}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            {vehicle.name} · {vehicle.serialPrefix}
          </span>
          <span className="blink font-mono text-[10px] uppercase tracking-[0.25em] text-neon">
            ● Array Hot
          </span>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-black/40 px-5 py-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-dim">
          Create your livery. It will be physically applied to the vehicle.
        </p>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint md:block">
          Draw · Text · Shapes · Stickers · Filters
        </p>
      </div>

      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === "shutter" && (
            <motion.div
              key="shutter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black"
            >
              <FilmGrain opacity={0.05} />
              <Scanlines />
              <div className="text-center">
                {BOOT_STEPS.map((step, i) => (
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, letterSpacing: "0.4em" }}
                    animate={{ opacity: 1, letterSpacing: "0.25em" }}
                    transition={{ delay: i * 0.45 + 0.2, duration: 0.4 }}
                    className="mt-3 font-mono text-sm uppercase text-cyan text-glow-cyan"
                  >
                    {step}
                  </motion.p>
                ))}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1] }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="mt-8 font-mono text-[10px] uppercase tracking-[0.4em] text-ink-faint"
                >
                  Loadout #{padBuild(state.buildNumber)}
                </motion.p>
              </div>
            </motion.div>
          )}

          {phase === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="vc-editor-shell absolute inset-0 flex flex-col"
            >
              <div className="min-h-0 flex-1">
                <ImageEditor
                  key={`${state.buildNumber}-${retryKey}`}
                  image={state.liveryDataUrl ?? template}
                  minHeight={460}
                  style={{ width: "100%", height: "100%" }}
                  options={{
                    theme: "dark",
                    features: {
                      imageEditor: {
                        tools: {
                          crop: true,
                          resize: true,
                          filter: true,
                          draw: true,
                          text: true,
                          shapes: true,
                          stickers: true,
                          frame: true,
                        },
                      },
                    },
                  }}
                  onSave={({ dataUrl }) => {
                    sound.reveal();
                    applyLivery(dataUrl);
                    setScene("reveal");
                  }}
                  onCancel={() => {
                    sound.cancel();
                    setScene("garage");
                  }}
                  onLoadError={() => {
                    setError("BODY IMAGE COULD NOT BE LOADED.");
                    setPhase("error");
                  }}
                  onError={() => {
                    setError("PAINT ARRAY OFFLINE");
                    setPhase("error");
                  }}
                />
              </div>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/95"
            >
              <Scanlines />
              <h2 className="font-display text-3xl tracking-[0.15em] text-neon text-glow-neon">
                {error ?? "PAINT ARRAY OFFLINE"}
              </h2>
              <p className="mt-3 max-w-md text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
                {error === "BODY IMAGE COULD NOT BE LOADED."
                  ? "The body template failed to load. Check your connection and retry."
                  : "The paint array could not be reached. Check your connection and retry."}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <GameButton
                  onClick={() => {
                    setError(null);
                    setRetryKey((k) => k + 1);
                    startBoot();
                  }}
                >
                  Retry
                </GameButton>
                <GameButton variant="ghost" onClick={() => setScene("garage")}>
                  Back to Garage
                </GameButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="relative z-10 flex items-center justify-between border-t border-white/10 bg-[#0a0c12]/95 px-5 py-2">
        <div className="flex items-center gap-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
            Bay 03
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
            VC-LIVERY/2.4
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
            {vehicle.serialPrefix}-{String(state.buildNumber * 7919).padStart(6, "0")}
          </span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon">
          Design it → Save → We apply it
        </p>
      </footer>
    </div>
  );
}