"use client";

import { useEffect, useMemo } from "react";
import { useGame } from "@/lib/game/GameContext";
import { emptyBuild } from "@/types/build";
import type { ViceBuild } from "@/types/build";

/**
 * Returns the current serializable build, creating a default one on first use
 * (vehicle default paint, no graphics). Scenes consume this; the booth mutates
 * and persists it via updateBuild.
 */
export function useBuild(): ViceBuild {
  const { state, updateBuild, selectVehicle } = useGame();

  useEffect(() => {
    if (!state.build) {
      updateBuild(emptyBuild(state.vehicleId, state.buildNumber, "#9fb0c6"));
    }
  }, [state.build, state.vehicleId, state.buildNumber, updateBuild]);

  const fallback = useMemo<ViceBuild>(() => {
    void state;
    return emptyBuild(state.vehicleId, state.buildNumber, "#9fb0c6");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  void selectVehicle;
  return state.build ?? fallback;
}