"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { BuildState, Scene, VehicleId } from "@/types/game";
import { currentBuildNumber, loadLastLivery, nextBuildNumber, persistLivery } from "@/lib/game/buildNumber";
import { sound } from "@/lib/sound";
import { getVehicle } from "@/lib/game/vehicles";
import { analyzeLivery } from "@/lib/livery/analysis";
import { composeCarImage } from "@/lib/livery/cache";
import { loadBuildV2, saveBuildV2 } from "@/lib/game/buildStore";

const initialState: BuildState = {
  scene: "boot",
  vehicleId: "seraph-r",
  liveryDataUrl: null,
  compositedUrl: null,
  analysis: null,
  buildNumber: 1,
  muted: false,
  build: null,
};

function bootstrap(): BuildState {
  return { ...initialState };
}

type Action =
  | { type: "SCENE"; scene: Scene }
  | { type: "VEHICLE"; id: VehicleId }
  | { type: "LIVERY"; dataUrl: string }
  | { type: "COMPOSITE"; url: string }
  | { type: "ANALYSIS"; analysis: BuildState["analysis"] }
  | { type: "BUILD_NUMBER"; n: number }
  | { type: "MUTE" }
  | { type: "BUILD"; build: BuildState["build"] }
  | { type: "RESET" };

function reducer(state: BuildState, action: Action): BuildState {
  switch (action.type) {
    case "SCENE":
      return { ...state, scene: action.scene };
    case "VEHICLE":
      return { ...state, vehicleId: action.id };
    case "LIVERY":
      return { ...state, liveryDataUrl: action.dataUrl };
    case "COMPOSITE":
      return { ...state, compositedUrl: action.url };
    case "ANALYSIS":
      return { ...state, analysis: action.analysis };
    case "BUILD_NUMBER":
      return { ...state, buildNumber: action.n };
    case "MUTE":
      return { ...state, muted: !state.muted };
    case "BUILD":
      return { ...state, build: action.build };
    case "RESET":
      return { ...initialState, scene: "garage", buildNumber: nextBuildNumber() };
    default:
      return state;
  }
}

interface GameApi {
  state: BuildState;
  setScene: (s: Scene) => void;
  selectVehicle: (id: VehicleId) => void;
  applyLivery: (dataUrl: string) => void;
  setComposite: (url: string) => void;
  setAnalysis: (a: BuildState["analysis"]) => void;
  toggleMute: () => void;
  newBuild: () => void;
  ensureComposite: (opts?: { force?: boolean }) => void;
  updateBuild: (build: BuildState["build"]) => void;
}

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, bootstrap);
  const stateRef = useRef(state);

  useEffect(() => {
    dispatch({ type: "BUILD_NUMBER", n: currentBuildNumber() });
    const savedV2 = loadBuildV2();
    if (savedV2) {
      dispatch({ type: "BUILD", build: savedV2 });
      dispatch({ type: "VEHICLE", id: savedV2.vehicleId });
      if (savedV2.analysis) dispatch({ type: "ANALYSIS", analysis: savedV2.analysis });
    } else {
      const saved = loadLastLivery();
      if (saved) dispatch({ type: "LIVERY", dataUrl: saved });
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.liveryDataUrl && !state.analysis) {
      void analyzeLivery(state.liveryDataUrl).then((a) => dispatch({ type: "ANALYSIS", analysis: a }));
    }
  }, [state.liveryDataUrl, state.analysis]);

  useEffect(() => {
    if (state.build && !state.build.analysis) {
      void import("@/lib/game/analysisV2").then(({ analyzeBuildV2 }) =>
        analyzeBuildV2(state.build as NonNullable<BuildState["build"]>).then((a) => {
          const b = stateRef.current.build;
          if (b) dispatch({ type: "BUILD", build: { ...b, analysis: a, updatedAt: Date.now() } });
        })
      );
    }
  }, [state.build?.analysis, state.build?.buildId, state.build]);

  useEffect(() => {
    sound.setMuted(state.muted);
  }, [state.muted]);

  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const ensureComposite = useCallback(
    (opts?: { force?: boolean }) => {
      const s = stateRef.current;
      const spec = getVehicle(s.vehicleId);
      void composeCarImage(spec, s.liveryDataUrl, opts?.force).then((url) => {
        if (stateRef.current.compositedUrl !== url) dispatch({ type: "COMPOSITE", url });
      });
    },
    []
  );

  useEffect(() => {
    ensureComposite();
  }, [state.vehicleId, state.liveryDataUrl, ensureComposite]);

  const api = useMemo<GameApi>(() => {
    const s = stateRef.current;
    return {
      state,
      setScene: (scene) => {
        if (scene === s.scene) return;
        dispatch({ type: "SCENE", scene });
      },
      selectVehicle: (id) => {
        dispatch({ type: "VEHICLE", id });
        const b = stateRef.current.build;
        if (b) {
          dispatch({ type: "BUILD", build: { ...b, vehicleId: id, decals: [], updatedAt: Date.now() } });
        }
      },
      applyLivery: (dataUrl) => {
        persistLivery(dataUrl);
        dispatch({ type: "LIVERY", dataUrl });
        void analyzeLivery(dataUrl).then((a) => dispatch({ type: "ANALYSIS", analysis: a }));
      },
      setComposite: (url) => dispatch({ type: "COMPOSITE", url }),
      setAnalysis: (a) => dispatch({ type: "ANALYSIS", analysis: a }),
      updateBuild: (build) => {
        dispatch({ type: "BUILD", build });
        if (build) saveBuildV2(build);
      },
      toggleMute: () => dispatch({ type: "MUTE" }),
      newBuild: () => dispatch({ type: "RESET" }),
      ensureComposite,
    };
  }, [state, ensureComposite]);

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}