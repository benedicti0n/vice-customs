export type Scene =
  | "boot"
  | "garage"
  | "vehicle-select"
  | "paint-booth"
  | "reveal"
  | "analysis"
  | "street-run"
  | "complete";

export type VehicleId = "seraph-r" | "tempest-vx" | "marlin-88";

export type Personality =
  | "Ghost Spec"
  | "Street Clean"
  | "Vice Classic"
  | "Heat Magnet"
  | "Full Chaos";

export interface LiveryAnalysis {
  saturation: number;
  brightness: number;
  contrast: number;
  complexity: number;
  colorfulness: number;
  dominantHue: number;

  styleScore: number;
  streetRep: number;
  subtlety: number;
  policeHeat: number;

  personality: Personality;
}

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  serialPrefix: string;
  tagline: string;
  drivetrain: string;
  classLabel: string;
  stats: { speed: number; acceleration: number; control: number; attitude: number };
  paint: {
    base: string;
    shade: string;
    accent: string;
    glass: string;
  };
  profileScale: number;
  profileShiftY: number;
}

export interface BuildState {
  scene: Scene;
  vehicleId: VehicleId;
  liveryDataUrl: string | null;
  compositedUrl: string | null;
  analysis: LiveryAnalysis | null;
  buildNumber: number;
  muted: boolean;
}

export type BuildAction =
  | { type: "SET_SCENE"; scene: Scene }
  | { type: "SELECT_VEHICLE"; vehicleId: VehicleId }
  | { type: "SET_LIVERY"; dataUrl: string }
  | { type: "SET_COMPOSITED"; url: string }
  | { type: "SET_ANALYSIS"; analysis: LiveryAnalysis }
  | { type: "TOGGLE_MUTE" }
  | { type: "NEW_BUILD" };