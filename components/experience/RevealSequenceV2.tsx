"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import VehicleStage, { type StageApi } from "@/components/3d/VehicleStage";
import GameButton from "@/components/ui/GameButton";
import Scanlines from "@/components/effects/Scanlines";
import FilmGrain from "@/components/effects/FilmGrain";
import GarageFog from "@/components/effects/GarageFog";
import { useBuild } from "@/lib/game/useBuild";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { sound } from "@/lib/sound";

const STEPS = ["SURFACE PREP", "INK ARRAY", "CLEAR COAT", "CURING"];

export default function RevealSequenceV2() {
  const { setScene } = useGame();
  const build = useBuild();
  const vehicle = getVehicle(build.vehicleId);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const startedAt = useRef<number>(0);
  const apiRef = useRef<StageApi | null>(null);
  const timeouts = useRef<number[]>([]);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  };

  useEffect(() => {
    startedAt.current = Date.now();
    sound.shutter();
    sound.flicker();
    schedule(() => setStep(1), 420);
    schedule(() => setStep(2), 840);
    schedule(() => setStep(3), 1260);
    schedule(() => {
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

  const onReady = useCallback((api: StageApi) => {
    apiRef.current = api;
    const paint = api.rig.paintMaterial;
    // start matte + dark
    paint.roughness = 0.9;
    paint.clearCoat.isEnabled = false;
    paint.albedoColor = Color3.FromHexString(build.paint.color).scale(0.25);

    const sweep = new (class {
      private last = 0;
      step(dt: number) {
        const t = (Date.now() - startedAt.current) / 1000;
        const progress = Math.min(1, Math.max(0, (t - 1.2) / 2.4));
        paint.roughness = 0.9 - progress * 0.62;
        paint.clearCoat.isEnabled = progress > 0.45;
        paint.clearCoat.roughness = 0.3 - progress * 0.18;
        paint.albedoColor = Color3.FromHexString(build.paint.color).scale(0.25 + progress * 0.75);
        const warm = progress > 0.8 ? (progress - 0.8) * 1.6 : 0;
        const key = api.scene.getLightByName("vc-key");
        if (key) key.intensity = 0.25 + progress * 0.65 + warm * 0.2;
        if (progress >= 1 && this.last < 1) {
          this.last = 1;
          sound.scanner();
        }
        void dt;
      }
    })();

    api.scene.onBeforeRenderObservable.add(() => sweep.step(1 / 60));
  }, [build]);

  const skip = () => {
    if (skipped) return;
    setSkipped(true);
    timeouts.current.forEach(window.clearTimeout);
    setStep(STEPS.length);
    sound.reveal();
    schedule(() => setComplete(true), 400);
    schedule(() => setScene("analysis"), 2000);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <GarageFog opacity={0.08} />
      <FilmGrain opacity={0.05} />
      <Scanlines />
      <div className="absolute inset-0">
        <VehicleStage build={build} mode="reveal" interactive={false} onReady={onReady} />
      </div>

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