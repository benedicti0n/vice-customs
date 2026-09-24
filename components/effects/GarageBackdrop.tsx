"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface Props {
  className?: string;
  dim?: boolean;
  interactive?: boolean;
}

export default function GarageBackdrop({ className = "", dim = false, interactive = true }: Props) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const [lightsOn, setLightsOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLightsOn((v) => (Math.random() < 0.06 ? !v : v));
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-bg ${className}`}
      onMouseMove={(e) => {
        if (!interactive) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 22);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 14);
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ x: sx, y: sy, scale: 1.02 }}
      >
        <Wall />
        <CityGlow />
        <CeilingLights lightsOn={lightsOn} />
        <Floor />
        <Props />
        <NeonSign lightsOn={lightsOn} />
        <Vignette dim={dim} />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-black/50" />
    </div>
  );
}

function Wall() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, #0a0c12 0%, #0d1018 40%, #0b0d14 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 90px)",
      }}
    />
  );
}

function CityGlow() {
  return (
    <div className="absolute inset-x-[12%] top-[24%] h-[42%] overflow-hidden opacity-80">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,90,150,0.16) 0%, rgba(57,217,230,0.1) 45%, transparent 90%), linear-gradient(90deg, transparent, rgba(255,63,142,0.1), transparent)",
        }}
      />
      <Cityline />
      <Palm />
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent 0 40px, rgba(0,0,0,0.35) 40px 46px, transparent 46px 120px, rgba(0,0,0,0.25) 120px 124px)",
          maskImage: "linear-gradient(180deg, transparent, black 20%, black 100%)",
        }}
      />
    </div>
  );
}

function Cityline() {
  const bars = [
    { x: "4%", w: 26, h: "34%" },
    { x: "10%", w: 40, h: "52%" },
    { x: "18%", w: 22, h: "28%" },
    { x: "26%", w: 54, h: "64%" },
    { x: "36%", w: 30, h: "40%" },
    { x: "47%", w: 60, h: "70%" },
    { x: "58%", w: 26, h: "30%" },
    { x: "66%", w: 48, h: "58%" },
    { x: "76%", w: 24, h: "38%" },
    { x: "86%", w: 40, h: "50%" },
  ];
  return (
    <div className="absolute bottom-0 inset-x-0 h-full">
      {bars.map((b, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{
            left: b.x,
            width: b.w,
            height: b.h,
            background:
              "linear-gradient(180deg, rgba(10,12,18,0.92), rgba(10,12,18,0.7))",
            boxShadow: `inset 0 0 18px rgba(${i % 2 ? "255,34,96" : "45,226,230"},0.14)`,
          }}
        />
      ))}
    </div>
  );
}

function Palm() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute -right-6 top-2 h-[70%] opacity-80"
      aria-hidden
    >
      <g transform="translate(330 300)">
        <path d="M0 0 C -18 -70 -26 -130 -12 -190" stroke="#0a0d14" strokeWidth={10} fill="none" />
        {[-60, -30, 0, 25, 55].map((a, i) => (
          <path
            key={i}
            d={`M-12 -190 C ${-12 + a * 0.3} ${-190 - Math.abs(a) * 1.6}, ${-12 + a} ${-200 - Math.abs(a) * 1.4}, ${-12 + a * 1.6} ${-186 - Math.abs(a) * 1.5}`}
            stroke="#0a0d14"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

function CeilingLights({ lightsOn }: { lightsOn: boolean }) {
  const rows = [14, 38, 62, 86];
  return (
    <div className="absolute inset-x-0 top-0 h-24">
      {rows.map((x) => (
        <div key={x} className="absolute top-6" style={{ left: `${x}%` }}>
          <div className="h-[6px] w-28 bg-[#20242e]" />
          <div
            className="mx-2 h-1 w-24"
            style={{
              background: lightsOn ? "rgba(220,235,255,0.75)" : "rgba(220,235,255,0.08)",
              boxShadow: lightsOn ? "0 0 22px rgba(220,235,255,0.7), 0 0 60px rgba(220,235,255,0.25)" : "none",
              transition: "background 0.4s, box-shadow 0.4s",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function Floor() {
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[34%]"
      style={{
        background:
          "linear-gradient(180deg, rgba(20,22,30,0) 0%, #13161f 30%, #0b0d13 100%)",
      }}
    >
      <div
        className="absolute bottom-0 inset-x-0 h-24"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 44px), linear-gradient(180deg, transparent, rgba(0,0,0,0.6))",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-28 w-[70%] -translate-x-1/2"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,63,142,0.05), transparent 70%), radial-gradient(ellipse at 50% 100%, rgba(255,63,142,0.1), transparent 60%)",
          filter: "blur(2px)",
        }}
      />
      <WarningStrip />
    </div>
  );
}

function WarningStrip() {
  return (
    <div className="absolute bottom-0 left-1/2 flex h-5 w-[78%] -translate-x-1/2 overflow-hidden opacity-60">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="h-full flex-1"
          style={{
            background: i % 2 ? "rgba(255,180,40,0.7)" : "rgba(0,0,0,0.85)",
            transform: `skewX(-18deg) translateX(${i % 2 ? 0 : 0}px)`,
            marginLeft: -6,
          }}
        />
      ))}
    </div>
  );
}

function Props() {
  return (
    <>
      <div
        className="absolute left-[4%] top-[30%] h-48 w-36 opacity-90"
        style={{
          background:
            "linear-gradient(180deg, #171b26 0%, #10131c 100%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="absolute inset-x-2 h-10 border-b border-white/10" style={{ top: i * 48 + 4 }} />
        ))}
      </div>
      <div className="absolute right-[5%] top-[34%] flex items-end gap-2 opacity-90">
        <div className="h-24 w-24 rounded-[40%] border-[10px] border-[#14161f] bg-[#0a0b10]" />
        <div className="h-20 w-20 rounded-[40%] border-[9px] border-[#14161f] bg-[#0a0b10]" />
        <div className="h-16 w-16 rounded-[40%] border-[8px] border-[#14161f] bg-[#0a0b10]" />
      </div>
      <div
        className="absolute right-[16%] top-[18%] h-40 w-6"
        style={{
          background: "linear-gradient(90deg, #1a1e2a, #0d1018)",
          borderRadius: 6,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />
      <div
        className="absolute left-[22%] top-[16%] h-3 w-56"
        style={{ background: "#141720", borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.6)" }}
      />
      <div
        className="absolute left-[24%] top-[20%] h-3 w-44"
        style={{ background: "#141720", borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.6)" }}
      />
    </>
  );
}

function NeonSign({ lightsOn }: { lightsOn: boolean }) {
  return (
    <div className="absolute left-1/2 top-[26%] -translate-x-1/2 text-center">
      <div
        className={`font-display text-3xl tracking-[0.2em] neon-sign ${lightsOn ? "" : "opacity-40"}`}
        style={{ transition: "opacity 0.3s" }}
      >
        VICE//CUSTOMS
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.5em] text-cyan/70">
        Ocean District
      </div>
    </div>
  );
}

function Vignette({ dim }: { dim: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,0.55) 100%)",
        transition: "opacity 0.6s",
        opacity: dim ? 0.7 : 1,
      }}
    />
  );
}