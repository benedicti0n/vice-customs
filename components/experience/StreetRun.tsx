"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/ui/GameButton";
import Scanlines from "@/components/effects/Scanlines";
import FilmGrain from "@/components/effects/FilmGrain";
import PoliceLights from "@/components/effects/PoliceLights";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { sound } from "@/lib/sound";

const DURATION = 13000;

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Scenery {
  far: { x: number; h: number; w: number; lit: boolean; hue: number }[];
  mid: { x: number; type: "palm" | "sign" | "building"; h: number; hue: number }[];
  posts: { x: number }[];
  stars: { x: number; y: number; r: number }[];
}

function buildScenery(): Scenery {
  const rand = mulberry(1337);
  const far = [];
  for (let i = 0; i < 26; i++) {
    far.push({ x: rand() * 2000, h: 80 + rand() * 170, w: 26 + rand() * 70, lit: rand() > 0.45, hue: rand() > 0.5 ? 340 : 188 });
  }
  const mid = [];
  for (let i = 0; i < 18; i++) {
    const r = rand();
    const type: "palm" | "sign" | "building" = r < 0.4 ? "palm" : r < 0.75 ? "sign" : "building";
    mid.push({
      x: rand() * 2200,
      type,
      h: 120 + rand() * 160,
      hue: rand() > 0.5 ? 340 : 188,
    });
  }
  const posts = [];
  for (let i = 0; i < 24; i++) posts.push({ x: rand() * 2000 });
  const stars = [];
  for (let i = 0; i < 70; i++) stars.push({ x: rand() * 2000, y: rand() * 400, r: rand() * 1.4 });
  return { far, mid, posts, stars };
}

export default function StreetRun() {
  const { state, setScene } = useGame();
  const vehicle = getVehicle(state.vehicleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [skipped, setSkipped] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const startRef = useRef<number | null>(null);
  const scenery = useMemo(() => buildScenery(), []);

  const heatRaw = state.analysis;
  const heat = heatRaw && "policeHeat" in heatRaw ? (heatRaw.policeHeat ?? 0) : 0;
  const heatLevel = heat >= 68 ? "high" : heat >= 38 ? "medium" : "none";

  const scannerText = useMemo(() => {
    if (heatLevel === "high") return "ATTENTION ALL UNITS\nHIGH-VISIBILITY VEHICLE\nSOUTHBOUND OCEAN AVE";
    if (heatLevel === "medium") return "UNITS ADVISED:\nMODIFIED VEHICLE REPORTED\nOCEAN DISTRICT";
    return "NO ACTIVE ALERTS";
  }, [heatLevel]);

  const stars = Math.max(1, Math.min(5, Math.round((heat / 100) * 5)));

  useEffect(() => {
    sound.engineLoop(0.85);
    sound.roadLoop(0.85);
    sound.windLoop();
    if (heatLevel === "high") sound.sirenLoop();
    return () => {
      sound.stopAll();
    };
  }, [heatLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = (tMs: number) => {
      const elapsed = startRef.current === null ? 0 : tMs - startRef.current;
      if (startRef.current === null) startRef.current = tMs;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const t = elapsed / 1000;
      const speed = Math.min(1, t / 2.2);

      ctx.save();
      const shake = 2.2 * speed;
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      drawSky(ctx, w, h, scenery, t);
      drawFar(ctx, w, h, scenery, speed, t);
      drawMid(ctx, w, h, scenery, speed, t);
      drawRoad(ctx, w, h, speed, t);
      drawLightPools(ctx, w, h, speed, t);
      drawStreaks(ctx, w, h, speed, t);

      ctx.restore();

      if (elapsed > DURATION) {
        setFrozen(true);
        window.setTimeout(() => setScene("complete"), 1200);
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (skipped) return;
    setSkipped(true);
    sound.engineStart();
    setScene("complete");
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" />

      <PoliceLights level={heatLevel} />
      <FilmGrain opacity={0.06} />
      <Scanlines />
      <div className="chroma pointer-events-none absolute inset-0 z-40" />

      <div className="absolute inset-x-0 bottom-[4%] z-10 flex justify-center">
        <motion.img
          src={state.compositedUrl ?? ""}
          alt={`${vehicle.name} on the street`}
          draggable={false}
          className={`h-[min(44vh,440px)] w-[min(72vw,880px)] object-contain ${frozen ? "" : "rumble"}`}
          animate={frozen ? { scale: 1.04, filter: "brightness(1.15)" } : {}}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="absolute left-6 top-6 z-20">
        <div className="hud-clip border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-ink">Vice Coast</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
            Ocean District
          </p>
        </div>
      </div>

      <div className="absolute right-6 top-6 z-20 text-right">
        <div className="hud-clip border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-sm">
          <p className="font-display text-3xl leading-none text-cyan text-glow-cyan">126</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">MPH</p>
        </div>
      </div>

      <AnimatePresence>
        {heatLevel !== "none" && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="absolute right-6 bottom-24 z-20 max-w-[300px] text-right"
          >
            <div className="hud-clip inline-block border border-amber/30 bg-black/70 px-5 py-3 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">
                ● Scanner Feed
              </p>
              <pre className="mt-1 whitespace-pre-line font-mono text-[11px] leading-relaxed text-ink-dim">
                {scannerText}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute left-6 bottom-7 z-20">
        <div className="hud-clip inline-block border border-white/10 bg-black/50 px-5 py-2 backdrop-blur-sm">
          <span className="font-mono text-xs tracking-[0.25em] text-amber" style={{ textShadow: "0 0 10px rgba(255,166,64,0.5)" }}>
            {"★".repeat(stars)}
            <span className="text-ink-faint/40">{"★".repeat(5 - stars)}</span>
          </span>
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            {heatLevel === "high" ? "Heat Critical" : heatLevel === "medium" ? "Heat Elevated" : "Low Profile"}
          </span>
        </div>
      </div>

      {!skipped && !frozen && (
        <div className="absolute bottom-5 right-6 z-30">
          <GameButton variant="ghost" size="sm" onClick={skip}>
            Skip ▸
          </GameButton>
        </div>
      )}
    </div>
  );
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, s: Scenery, t: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#05060a");
  grad.addColorStop(0.55, "#0a0c14");
  grad.addColorStop(0.82, "#12101c");
  grad.addColorStop(1, "#1a0f1d");
  ctx.fillStyle = grad;
  ctx.fillRect(-10, -10, w + 20, h + 20);

  ctx.save();
  for (const st of s.stars) {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + st.x));
    ctx.globalAlpha = tw * 0.7;
    ctx.fillStyle = "#cdd6e8";
    ctx.fillRect(((st.x + t * 2) % (w + 30)) - 15, st.y, st.r, st.r);
  }
  ctx.restore();
}

function drawFar(ctx: CanvasRenderingContext2D, w: number, h: number, s: Scenery, speed: number, t: number) {
  const horizon = h * 0.62;
  ctx.save();
  const speedPx = speed * 26;
  for (const b of s.far) {
    const x = ((b.x - t * speedPx) % (w + 400)) - 200;
    const bh = b.h * (h / 720);
    const bw = b.w * (w / 1600);
    ctx.fillStyle = "rgba(16,18,28,0.92)";
    ctx.fillRect(x, horizon - bh, bw, bh);
    if (b.lit) {
      ctx.fillStyle = b.hue > 300 ? "rgba(255,80,140,0.55)" : "rgba(45,220,230,0.45)";
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(x + 4 + Math.random() * (bw - 8), horizon - bh + 8 + Math.random() * (bh - 20), 2, 2);
      }
    }
  }
  ctx.restore();
}

function drawMid(ctx: CanvasRenderingContext2D, w: number, h: number, s: Scenery, speed: number, t: number) {
  const horizon = h * 0.62;
  ctx.save();
  const speedPx = speed * 62;
  for (const o of s.mid) {
    const x = ((o.x - t * speedPx) % (w + 500)) - 250;
    const oh = o.h * (h / 720);
    if (o.type === "palm") {
      drawPalm(ctx, x, horizon - 6, oh);
    } else if (o.type === "sign") {
      const y = horizon - oh;
      ctx.fillStyle = "rgba(12,14,20,0.9)";
      ctx.fillRect(x, y, 30, oh * 0.7);
      ctx.fillStyle = o.hue > 300 ? "#ff3f8e" : "#39d9e6";
      ctx.save();
      ctx.shadowColor = o.hue > 300 ? "#ff3f8e" : "#39d9e6";
      ctx.shadowBlur = 12;
      ctx.fillRect(x + 4, y + 8, 22, oh * 0.45);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(10,12,18,0.85)";
      ctx.fillRect(x, horizon - oh, 90, oh);
      ctx.fillStyle = "rgba(255,120,60,0.5)";
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * 20, horizon - oh + 10 + Math.random() * oh * 0.5, 6, 2);
    }
  }
  ctx.restore();
}

function drawPalm(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(8,10,14,0.95)";
  ctx.lineWidth = Math.max(4, h * 0.03);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x - h * 0.06, baseY - h * 0.5, x + h * 0.03, baseY - h);
  ctx.stroke();
  const topX = x + h * 0.03;
  const topY = baseY - h;
  ctx.lineWidth = Math.max(3, h * 0.022);
  for (let i = -2; i <= 2; i++) {
    const spread = (Math.abs(i) * 0.5 + 0.4) * h * 0.3;
    const ang = i * 0.55 + (i % 2 ? 0.2 : -0.1);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(ang) * spread * 0.6, topY - Math.sin(ang) * spread * 0.3, topX + Math.cos(ang) * spread, topY - Math.sin(ang) * spread * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number, speed: number, t: number) {
  const roadTop = h * 0.62;

  ctx.save();
  const grad = ctx.createLinearGradient(0, roadTop, 0, h);
  grad.addColorStop(0, "#101216");
  grad.addColorStop(1, "#04050a");
  ctx.fillStyle = grad;
  ctx.fillRect(-10, roadTop, w + 20, h - roadTop);

  const vpY = h * 0.46;
  const bottom = h + 30;
  const halfW = (y: number) => (w / 2) * (0.06 + 0.94 * (y - vpY) / (bottom - vpY));

  ctx.fillStyle = "rgba(255,255,255,0.055)";
  const surface = new Path2D();
  surface.moveTo(w / 2 - halfW(h), h);
  surface.lineTo(w / 2 + halfW(h), h);
  surface.lineTo(w / 2 + halfW(roadTop), roadTop);
  surface.lineTo(w / 2 - halfW(roadTop), roadTop);
  surface.closePath();
  ctx.fill(surface);

  ctx.strokeStyle = "rgba(255,166,64,0.22)";
  ctx.lineWidth = 3;
  const leftEdge = new Path2D();
  leftEdge.moveTo(w / 2 - halfW(h), h);
  leftEdge.lineTo(w / 2 - halfW(roadTop), roadTop);
  ctx.stroke(leftEdge);
  const rightEdge = new Path2D();
  rightEdge.moveTo(w / 2 + halfW(h), h);
  rightEdge.lineTo(w / 2 + halfW(roadTop), roadTop);
  ctx.stroke(rightEdge);

  const dashSpeed = speed * 0.5;
  for (let i = 0; i < 12; i++) {
    const f = (((i / 12) * 0.9 + 0.08 - t * dashSpeed) % 1 + 1) % 1;
    const y = roadTop + (bottom - roadTop) * Math.pow(f, 1.6);
    const hw = halfW(y);
    const dashW = Math.max(2, hw * 0.05);
    const dashH = Math.max(12, (bottom - roadTop) * 0.035 * ((y - vpY) / (bottom - vpY)) * 7);
    ctx.fillStyle = "rgba(57,217,230,0.75)";
    ctx.fillRect(w / 2 - dashW / 2, y - dashH, dashW, dashH);
  }

  for (let i = 0; i < 10; i++) {
    const f = (((i / 10) * 0.85 + 0.05 - t * dashSpeed * 1.15) % 1 + 1) % 1;
    const y = roadTop + (bottom - roadTop) * Math.pow(f, 1.55);
    const hw = halfW(y) * 0.94;
    const ww = Math.max(1.5, hw * 0.016);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(w / 2 - hw - ww, y - ww * 3, ww, ww * 6);
    ctx.fillRect(w / 2 + hw, y - ww * 3, ww, ww * 6);
  }

  ctx.restore();
}

function drawLightPools(ctx: CanvasRenderingContext2D, w: number, h: number, speed: number, t: number) {
  const roadTop = h * 0.62;
  const bottom = h + 30;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const f = (((i / 4) * 0.8 + 0.1 - t * speed * 0.42) % 1 + 1) % 1;
    const y = roadTop + (bottom - roadTop) * Math.pow(f, 1.7);
    const rw = (w / 2) * (0.05 + 0.3 * (y - roadTop) / (bottom - roadTop));
    const glow = ctx.createRadialGradient(w / 2, y, 2, w / 2, y, rw);
    glow.addColorStop(0, `rgba(255,63,142,${0.11 * speed})`);
    glow.addColorStop(0.6, `rgba(57,217,230,${0.06 * speed})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    const pool = new Path2D();
    pool.ellipse(w / 2, y, rw, rw * 0.35, 0, 0, Math.PI * 2);
    ctx.fill(pool);
  }
  ctx.restore();
}

function drawStreaks(ctx: CanvasRenderingContext2D, w: number, h: number, speed: number, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const y0 = h * 0.2;
  for (let i = 0; i < 8; i++) {
    const yy = y0 + ((i * 97) % Math.floor(h * 0.5));
    const alpha = (0.04 + 0.08 * speed) * (0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i)));
    const xStart = ((i * 431 + t * speed * 900) % (w + 300)) - 150;
    const len = 120 + speed * 260;
    ctx.strokeStyle = i % 2 ? `rgba(255,63,142,${alpha})` : `rgba(57,217,230,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xStart, yy);
    ctx.lineTo(xStart + len, yy);
    ctx.stroke();
  }
  ctx.restore();
}