import type { Personality } from "@/types/game";

export interface ClassificationDef {
  key: Personality;
  blurb: string;
  color: string;
}

export const CLASSIFICATIONS: Record<Personality, ClassificationDef> = {
  "Ghost Spec": {
    key: "Ghost Spec",
    blurb: "Clean. Quiet. Almost suspiciously sensible.",
    color: "#8ea3bf",
  },
  "Street Clean": {
    key: "Street Clean",
    blurb: "That'll turn heads without starting a task force.",
    color: "#5fd6c4",
  },
  "Vice Classic": {
    key: "Vice Classic",
    blurb: "Looks like midnight on Ocean Drive.",
    color: "#ff4d8d",
  },
  "Heat Magnet": {
    key: "Heat Magnet",
    blurb: "Cops are gonna see you from three counties away.",
    color: "#ffa640",
  },
  "Full Chaos": {
    key: "Full Chaos",
    blurb: "I asked for a livery. You declared war on subtlety.",
    color: "#ff2a55",
  },
};

export const MANNY_LINES: Record<Personality, string[]> = {
  "Ghost Spec": [
    "Clean. Quiet. Almost suspiciously sensible.",
    "Sure you don't want a little color? The ocean's right there.",
    "Barely registered on the scanner. That's a first for this bay.",
  ],
  "Street Clean": [
    "That'll turn heads without starting a task force.",
    "Tasteful. I'll pretend I didn't see the exhaust.",
    "Good balance. The paint booth's gonna miss you.",
  ],
  "Vice Classic": [
    "Looks like midnight on Ocean Drive.",
    "Right out of a postcard. The kind they confiscate.",
    "Pink, orange, sunset — you're basically the neon district.",
  ],
  "Heat Magnet": [
    "Cops are gonna see you from three counties away.",
    "I can hear the radio chatter already. Enjoy it.",
    "That's not a car anymore, that's a signal flare.",
  ],
  "Full Chaos": [
    "I asked for a livery. You declared war on subtlety.",
    "Every gang in Vice Coast is gonna want that car.",
    "There's art, and there's a public disturbance. You found both.",
  ],
};

export const SCANNER_LINES: Record<Personality, string> = {
  "Ghost Spec": "NO ACTIVE ALERTS",
  "Street Clean": "UNITS ADVISED:\nMODIFIED VEHICLE REPORTED\nOCEAN DISTRICT",
  "Vice Classic": "UNITS ADVISED:\nBRIGHT VEHICLE CRUISING\nOCEAN DRIVE",
  "Heat Magnet": "ATTENTION ALL UNITS\nHIGH-VISIBILITY VEHICLE\nSOUTHBOUND OCEAN AVE",
  "Full Chaos": "ALL UNITS IN THE AREA\nRESTRAINED RESPONSE ADVISED\nVEHICLE IS LOUD",
};

export function pickLine(personality: Personality, seed: number): string {
  const lines = MANNY_LINES[personality];
  return lines[seed % lines.length];
}