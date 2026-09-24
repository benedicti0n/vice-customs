"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/ui/GameButton";
import Scanlines from "@/components/effects/Scanlines";
import FilmGrain from "@/components/effects/FilmGrain";
import { useGame } from "@/lib/game/GameContext";
import { sound } from "@/lib/sound";

const STATUS_LINES = [
  "INITIALIZING SHOP SYSTEM...",
  "PAINT ARRAY........ONLINE",
  "BODY SCANNER.......ONLINE",
  "STREET LINK........ONLINE",
];

export default function BootScene() {
  const { setScene } = useGame();
  const [phase, setPhase] = useState<"status" | "logo" | "ready">("status");
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    sound.boot();
    const t = window.setTimeout(() => sound.boot(), 200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const iv = window.setInterval(() => {
      setLineCount((c) => {
        if (c >= STATUS_LINES.length) {
          window.clearInterval(iv);
          return c;
        }
        if (c === 0) sound.beep();
        return c + 1;
      });
    }, 260);
    return () => window.clearInterval(iv);
  }, []);

  useEffect(() => {
    if (lineCount >= STATUS_LINES.length) {
      const t1 = window.setTimeout(() => setPhase("logo"), 350);
      const t2 = window.setTimeout(() => setPhase("ready"), 1900);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [lineCount]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-bg">
      <div className="chroma pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 34% at 50% 42%, rgba(255,63,142,0.07), transparent 70%), radial-gradient(ellipse 34% 26% at 50% 52%, rgba(57,217,230,0.05), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(255,63,142,0.04)), radial-gradient(ellipse at 50% 100%, rgba(57,217,230,0.06), transparent 55%)",
        }}
      />
      <FilmGrain opacity={0.07} />
      <Scanlines />

      <div className="absolute inset-x-0 top-8 flex justify-between px-8 font-mono text-[10px] uppercase tracking-[0.4em] text-ink-faint">
        <span className="blink">● REC</span>
        <span>VC-CUSTOMS/OS v2.4</span>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {phase === "status" && (
            <motion.div
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="w-72"
            >
              <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-ink-dim">
                CUSTOM VEHICLE OPERATIONS
                <br />
                AUTHORIZED PERSONNEL ONLY
              </p>
              <div className="space-y-2 text-left">
                {STATUS_LINES.slice(0, lineCount).map((line, i) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-mono text-[11px] tracking-[0.15em] text-ink-dim"
                  >
                    <span className="mr-3 text-cyan">{String(i + 1).padStart(2, "0")}</span>
                    {line}
                  </motion.p>
                ))}
              </div>
              <div className="mt-6 h-px w-full overflow-hidden bg-white/10">
                <motion.div
                  className="h-full bg-neon"
                  initial={{ width: 0 }}
                  animate={{ width: `${(lineCount / STATUS_LINES.length) * 100}%` }}
                  transition={{ ease: "linear", duration: 0.25 }}
                />
              </div>
            </motion.div>
          )}

          {phase === "logo" && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, letterSpacing: "0.9em" }}
              animate={{ opacity: 1, letterSpacing: "0.18em" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.6em] text-cyan text-glow-cyan">
                Ocean District
              </p>
              <h1 className="font-display text-[clamp(3rem,12vw,7.5rem)] leading-none text-ink">
                <span className="text-glow-neon">VICE</span>
                <span className="mx-1 text-ink-faint">{"//"}</span>
                <span className="text-glow-cyan">CUSTOMS</span>
              </h1>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.4em] text-ink-dim">
                Build it loud. Drive it louder.
              </p>
            </motion.div>
          )}

          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <h1 className="font-display text-[clamp(3rem,12vw,7.5rem)] leading-none text-ink">
                <span className="text-glow-neon">VICE</span>
                <span className="mx-1 text-ink-faint">{"//"}</span>
                <span className="text-glow-cyan">CUSTOMS</span>
              </h1>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.4em] text-ink-dim">
                Build it loud. Drive it louder.
              </p>
              <GameButton
                size="lg"
                className="mt-12"
                onClick={() => {
                  sound.thump();
                  setScene("garage");
                }}
              >
                Enter Garage
              </GameButton>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                Ocean District • Open 02:47 AM
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-8 flex justify-between px-8 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
        <span>Vice Customs // Ocean District</span>
        <span className="flicker">FL-01 ARRAY STANDBY</span>
      </div>
    </div>
  );
}