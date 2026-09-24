"use client";

import { motion } from "framer-motion";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  rumble?: boolean;
  dropShadow?: boolean;
}

export default function VehicleRenderer({
  src,
  alt = "Custom vehicle",
  className = "",
  style,
  rumble = false,
  dropShadow = true,
}: Props) {
  return (
    <div className={`relative ${className}`} style={style}>
      <motion.img
        src={src}
        alt={alt}
        draggable={false}
        className={`relative z-10 h-full w-full object-contain select-none ${rumble ? "rumble" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {dropShadow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            boxShadow: "inset 0 -120px 120px -60px rgba(255,63,142,0.12), inset 0 120px 160px -80px rgba(57,217,230,0.06)",
          }}
        />
      )}
    </div>
  );
}