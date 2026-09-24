"use client";

import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  opacity?: number;
}

export default function GarageFog({ className = "", opacity = 0.06 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const blobs = Array.from({ length: 9 }, (_, i) => ({
      x: (i * 137) % 100,
      y: 40 + ((i * 53) % 55),
      r: 26 + (i % 4) * 9,
      vx: 0.06 + (i % 3) * 0.03,
      vy: 0.02 + (i % 2) * 0.015,
      a: 0.04 + (i % 3) * 0.02,
    }));

    const step = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      t += 0.01;
      for (const b of blobs) {
        b.x += Math.sin(t + b.y) * 0.02;
        b.y += Math.cos(t + b.x) * 0.01;
        if (b.x < -20) b.x = 120;
        if (b.x > 120) b.x = -20;
        const g = ctx.createRadialGradient(
          (b.x / 100) * w,
          (b.y / 100) * h,
          0,
          (b.x / 100) * w,
          (b.y / 100) * h,
          (b.r / 100) * w
        );
        g.addColorStop(0, `rgba(200,215,235,${b.a})`);
        g.addColorStop(1, "rgba(200,215,235,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-20 ${className}`}
      style={{ opacity }}
    />
  );
}