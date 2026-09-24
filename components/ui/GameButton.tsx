"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { sound } from "@/lib/sound";

interface Props extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  silent?: boolean;
}

export default function GameButton({
  variant = "primary",
  size = "md",
  silent,
  className = "",
  children,
  onClick,
  ...rest
}: Props) {
  const styles: Record<string, string> = {
    primary:
      "bg-neon text-white shadow-[0_0_28px_rgba(255,63,142,0.35)] hover:shadow-[0_0_44px_rgba(255,63,142,0.55)]",
    secondary:
      "bg-panel text-ink border border-white/15 hover:border-cyan/60 hover:text-cyan hover:shadow-[0_0_24px_rgba(57,217,230,0.15)]",
    ghost: "bg-transparent text-ink-dim hover:text-ink",
  };
  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-[11px] tracking-[0.18em]",
    md: "px-7 py-3 text-xs tracking-[0.22em]",
    lg: "px-10 py-4 text-sm tracking-[0.28em]",
  };
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onTapStart={() => {
        if (!silent) sound.click();
      }}
      onClick={(e) => {
        sound.unlock();
        onClick?.(e);
      }}
      className={`btn-clip relative select-none font-mono font-medium uppercase text-white transition-shadow duration-200 ${styles[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}