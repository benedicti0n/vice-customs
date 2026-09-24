"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createViceEngine } from "@/lib/3d/engine";
import type { SpotLight } from "@babylonjs/core/Lights/spotLight";
import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import { materializeBuild } from "@/lib/3d/materializer";
import { buildStreetEnvironment, ROAD_LENGTH } from "@/lib/3d/environment/street";
import { ChaseCamera } from "@/lib/3d/camera";
import { ArcadeController, type DriveInput } from "@/lib/3d/street/controller";
import GameButton from "@/components/ui/GameButton";
import Scanlines from "@/components/effects/Scanlines";
import FilmGrain from "@/components/effects/FilmGrain";
import PoliceLights from "@/components/effects/PoliceLights";
import { useBuild } from "@/lib/game/useBuild";
import { useGame } from "@/lib/game/GameContext";
import { getVehicle } from "@/lib/game/vehicles";
import { sound } from "@/lib/sound";

const DURATION = 45000;

export default function StreetRunV2() {
  const { setScene } = useGame();
  const build = useBuild();
  const vehicle = getVehicle(build.vehicleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mph, setMph] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const heatLevel = (build.analysis?.policeHeat ?? 0) >= 38 ? "high" : "none";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;

    void (async () => {
      try {
        const handle = await createViceEngine(canvas);
        if (disposed) {
          handle.dispose();
          return;
        }
        const { scene } = handle;
        const materialized = materializeBuild(scene, build);
        buildStreetEnvironment(scene);
        const camera = new ChaseCamera(scene, canvas);
        const controller = new ArcadeController({ maxSpeed: 26 + (vehicle.stats.speed / 100) * 12 });

        const input: DriveInput = { throttle: false, brake: false, steer: 0, boost: false };
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === "w" || e.key === "ArrowUp") input.throttle = true;
          if (e.key === "s" || e.key === "ArrowDown") input.brake = true;
          if (e.key === "a" || e.key === "ArrowLeft") input.steer = -1;
          if (e.key === "d" || e.key === "ArrowRight") input.steer = 1;
          if (e.key === "Shift") input.boost = true;
        };
        const onKeyUp = (e: KeyboardEvent) => {
          if (e.key === "w" || e.key === "ArrowUp") input.throttle = false;
          if (e.key === "s" || e.key === "ArrowDown") input.brake = false;
          if (e.key === "a" || e.key === "ArrowLeft" || e.key === "d" || e.key === "ArrowRight") input.steer = 0;
          if (e.key === "Shift") input.boost = false;
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        let started = 0;
        let lastUpdate = 0;
        const rig = materialized.rig;
        const headGlow = scene.getLightByName("vc-headlight");
        const keyMat = rig.paintMaterial;

        if (heatLevel === "high") {
          sound.sirenLoop();
        }
        sound.engineLoop(0.7);
        sound.roadLoop(0.7);
        sound.windLoop();

        const loop = () => {
          try {
          const now = performance.now();
          const dt = Math.min(0.05, (now - lastUpdate) / 1000);
          lastUpdate = now;
          if (started === 0) started = now;

          controller.update(dt, input);
          const st = controller.state;

          const speedRatio = st.speed / 34;
          rig.root.position.copyFrom(st.position);
          rig.root.rotation.y = st.yaw;
          rig.root.rotation.x = -0.06 * speedRatio * (input.throttle ? 1 : 0);
          rig.root.rotation.z = -input.steer * 0.05 * speedRatio;

          rig.update(dt, { speed: st.speed, steer: input.steer });

          if (headGlow) {
            (headGlow as SpotLight).position.copyFrom(st.position).addInPlace(new Vector3(0, 0.9, 0));
            (headGlow as SpotLight).setDirectionToTarget(st.position.add(new Vector3(0, 0.8, 10)));
          }

          camera.update(dt, st.position, st.yaw, new Vector3(st.position.x, 0.6, st.position.z), speedRatio);
          const camFill = scene.getLightByName("vc-cam-fill");
          if (camFill) {
            (camFill as PointLight).position.copyFrom(camera.camera.position);
          }
          keyMat.emissiveColor = input.throttle && speedRatio > 0.85 ? new Color3(0.02, 0.02, 0.02) : new Color3(0, 0, 0);

          setMph(Math.round(st.speed * 2.237));

          const elapsed = now - started;
          if (elapsed > DURATION) {
            setFrozen(true);
            sound.engineOff();
            sound.stop("road");
            sound.stop("wind");
            sound.stop("siren");
            window.setTimeout(() => setScene("complete"), 1300);
            return;
          }
          scene.render();
          } catch (e) {
            console.error("street frame failed", e);
            handle.engine.stopRenderLoop();
            setFrozen(true);
          }
        };

        handle.engine.runRenderLoop(loop);
        sound.engineStart();

        return () => {
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
        };
      } catch (e) {
        console.error("street setup failed", e);
        if (!disposed) setFrozen(true);
      }
    })();

    return () => {
      disposed = true;
      sound.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.buildId, vehicle.stats.speed]);

  const skip = () => {
    if (skipped) return;
    setSkipped(true);
    setScene("complete");
  };

  const stars = Math.max(1, Math.min(5, Math.round(((build.analysis?.policeHeat ?? 0) / 100) * 5)));

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" />
      {heatLevel === "high" && <PoliceLights level="high" />}
      <FilmGrain opacity={0.05} />
      <Scanlines />

      <div className="absolute left-6 top-6 z-20">
        <div className="hud-clip border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-ink">Vice Coast</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">Ocean District</p>
        </div>
      </div>

      <div className="absolute right-6 top-6 z-20 text-right">
        <div className="hud-clip border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-sm">
          <p className="font-display text-3xl leading-none text-cyan text-glow-cyan">{mph}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">MPH</p>
        </div>
      </div>

      {heatLevel === "high" && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4, duration: 0.4 }}
          className="absolute right-6 bottom-24 z-20 max-w-[300px] text-right"
        >
          <div className="hud-clip inline-block border border-amber/30 bg-black/70 px-5 py-3 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">● Scanner Feed</p>
            <pre className="mt-1 whitespace-pre-line font-mono text-[11px] leading-relaxed text-ink-dim">
              ATTENTION ALL UNITS{"\n"}HIGH-VISIBILITY VEHICLE{"\n"}SOUTHBOUND OCEAN AVE
            </pre>
          </div>
        </motion.div>
      )}

      <div className="absolute left-6 bottom-7 z-20">
        <div className="hud-clip inline-block border border-white/10 bg-black/50 px-5 py-2 backdrop-blur-sm">
          <span className="font-mono text-xs tracking-[0.25em] text-amber" style={{ textShadow: "0 0 10px rgba(255,166,64,0.5)" }}>
            {"★".repeat(stars)}
            <span className="text-ink-faint/40">{"★".repeat(5 - stars)}</span>
          </span>
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            {heatLevel === "high" ? "Heat Critical" : "Low Profile"}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-20 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-ink-faint">
        W / S — throttle · brake · A / D — steer · SHIFT — boost
      </div>

      {!skipped && !frozen && (
        <div className="absolute bottom-5 right-6 z-30">
          <GameButton variant="ghost" size="sm" onClick={skip}>
            Skip ▸
          </GameButton>
        </div>
      )}
      {frozen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <p className="pulse-slow font-mono text-xs uppercase tracking-[0.5em] text-ink-dim">Run Complete</p>
        </div>
      )}
      {void ROAD_LENGTH}
    </div>
  );
}