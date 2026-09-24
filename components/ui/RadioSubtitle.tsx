"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  speaker: string;
  text: string | null;
  className?: string;
}

export default function RadioSubtitle({ speaker, text, className = "" }: Props) {
  return (
    <AnimatePresence mode="wait">
      {text ? (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className={`pointer-events-none ${className}`}
        >
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">
              {speaker}
            </span>
            <span className="h-px w-6 bg-neon/50" />
          </div>
          <p className="mt-1 max-w-xl font-mono text-sm text-ink-dim">“{text}”</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}