"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Scanlines from "@/components/effects/Scanlines";
import FilmGrain from "@/components/effects/FilmGrain";
import GarageFog from "@/components/effects/GarageFog";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { sound } from "@/lib/sound";

const STEPS = ["SURFACE PREP", "INK ARRAY", "CLEAR COAT", "CURING"];

export default function RevealSequence() {
  const { state, setScene } = useGame();
  const vehicle = getVehicle(state.vehicleId);
  const [step, setStep] = useState(0);
  const [showCar, setShowCar] = useState(false);
  const [complete, setComplete] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const timeouts = useRef<number[]>([]);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  };

  useEffect(() => {
    sound.shutter();
    sound.flicker();
    schedule(() => setStep(1), 420);
    schedule(() => setStep(2), 840);
    schedule(() => setStep(3), 1260);
    schedule(() => {
      setShowCar(true);
      sound.reveal();
    }, 1650);
    schedule(() => {
      setComplete(true);
      sound.thump();
    }, 3400);
    schedule(() => {
      sound.select();
      setScene("analysis");
    }, 5600);
    const ids = timeouts.current;
    return () => ids.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (skipped) return;
    setSkipped(true);
    timeouts.current.forEach(window.clearTimeout);
    setStep(STEPS.length);
    setShowCar(true);
    sound.reveal();
    schedule(() => setComplete(true), 400);
    schedule(() => setScene("analysis"), 2000);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <GarageFog opacity={0.09} />
      <FilmGrain opacity={0.06} />
      <Scanlines />
      <div className="chroma pointer-events-none absolute inset-0 z-40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!complete ? (
            <motion.div
              key="apply"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              className="relative z-10 flex w-full max-w-xl flex-col items-center px-6"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display text-2xl uppercase tracking-[0.3em] text-ink"
              >
                Applying Body Graphics
              </motion.p>
              <div className="mt-10 w-full space-y-3">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-4">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        i < step ? "bg-cyan shadow-[0_0_10px_rgba(57,217,230,0.9)]" : i === step ? "pulse-slow bg-neon shadow-[0_0_10px_rgba(255,63,142,0.9)]" : "bg-ink-faint/40"
                      }`}
                    />
                    <span
                      className={`font-mono text-xs uppercase tracking-[0.35em] ${
                        i < step ? "text-ink" : i === step ? "text-neon" : "text-ink-faint"
                      }`}
                    >
                      {s}
                    </span>
                    {i < step && <span className="ml-auto font-mono text-[10px] text-cyan">DONE</span>}
                  </div>
                ))}
              </div>
              <motion.div
                className="mt-8 h-px w-full overflow-hidden bg-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full bg-cyan"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(step / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex flex-col items-center px-6 text-center"
            >
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.3em" }}
                transition={{ duration: 0.8 }}
                className="font-mono text-[11px] uppercase text-cyan text-glow-cyan"
              >
                Custom Build Complete
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="mt-4 font-display text-5xl uppercase tracking-[0.12em] text-ink"
              >
                {vehicle.name}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="mt-2 font-mono text-[11px] uppercase tracking-[0.4em] text-ink-dim"
              >
                {vehicle.tagline}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1] }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="mt-10 font-mono text-[10px] uppercase tracking-[0.5em] text-ink-faint"
              >
                Analyzing Build…
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex justify-center transition-opacity duration-700 ${
          showCar && !complete ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative w-[min(84vw,1000px)]">
          <motion.img
            src={state.compositedUrl ?? ""}
            alt={`${vehicle.name} with applied livery`}
            draggable={false}
            initial={{ opacity: 0, filter: "brightness(0.2)" }}
            animate={{ opacity: 1, filter: "brightness(1)" }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-[min(52vh,520px)] w-full object-contain"
          />
          {showCar && !complete && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.2 }}
            >
              <motion.div
                className="absolute inset-y-0 w-[38%]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(220,240,255,0.22), transparent)",
                }}
                initial={{ x: "-110%" }}
                animate={{ x: "300%" }}
                transition={{ delay: 0.35, duration: 1.1, ease: [0.3, 0, 0.2, 1] }}
              />
            </motion.div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24">
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(20,22,30,0.5)), radial-gradient(ellipse at 50% 100%, rgba(255,63,142,0.16), transparent 62%)",
              }}
            />
          </div>
        </div>
      </div>

      {!skipped && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-5 right-6 z-30"
        >
          <GameButton variant="ghost" size="sm" onClick={skip}>
            Skip ▸
          </GameButton>
        </motion.div>
      )}
    </div>
  );
}