"use client";

import { motion } from "framer-motion";

interface Props {
  level: "none" | "medium" | "high";
}

export default function PoliceLights({ level }: Props) {
  if (level === "none") return null;
  const active = level === "high";
  return (
    <>
      {active && (
        <div
          aria-hidden
          className="siren-overlay pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              "radial-gradient(ellipse at 22% 0%, rgba(255,40,60,0.18), transparent 45%), radial-gradient(ellipse at 78% 0%, rgba(40,90,255,0.18), transparent 45%)",
          }}
        />
      )}
      {active && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[18%] top-[6%] z-40"
          animate={{ rotate: [-6, 6] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          style={{
            width: 26,
            height: 12,
            transform: "perspective(60px) rotateX(55deg)",
            background: "linear-gradient(90deg,#ff2a3c 50%,#2a5aff 50%)",
            boxShadow: "0 0 18px rgba(255,60,80,0.8), 0 0 18px rgba(60,100,255,0.8)",
            borderRadius: 2,
          }}
        />
      )}
    </>
  );
}