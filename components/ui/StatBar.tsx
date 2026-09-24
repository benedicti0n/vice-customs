"use client";

import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number;
  accent?: string;
  className?: string;
}

export default function StatBar({ label, value, accent = "#39d9e6", className = "" }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="w-40 shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
        {label}
      </span>
      <div className="relative h-3 flex-1 border border-white/10 bg-black/40">
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ background: accent, boxShadow: `0 0 14px ${accent}66` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-y-0 w-px bg-black/70"
            style={{ left: `${((i + 1) / 10) * 100}%` }}
          />
        ))}
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-ink">{value}</span>
    </div>
  );
}