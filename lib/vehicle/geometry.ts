export interface ProfileParams {
  name: string;
  wheelbase: number;
  rearOverhang: number;
  frontOverhang: number;
  wheelR: number;
  archR: number;
  ground: number;
  noseY: number;
  cowlX: number;
  cowlY: number;
  roofFrontX: number;
  roofFrontY: number;
  roofRearX: number;
  roofRearY: number;
  glassBaseX: number;
  glassBaseY: number;
  trunkX: number;
  trunkY: number;
  tailTopX: number;
  tailTopY: number;
  tailBottomX: number;
  beltlineY: number;
  rockerY: number;
}

export const GROUND = 858;

export const SERAPH_PARAMS: ProfileParams = {
  name: "seraph-r",
  wheelbase: 640,
  rearOverhang: 170,
  frontOverhang: 182,
  wheelR: 110,
  archR: 146,
  ground: GROUND,
  noseY: 716,
  cowlX: 968,
  cowlY: 612,
  roofFrontX: 906,
  roofFrontY: 520,
  roofRearX: 762,
  roofRearY: 506,
  glassBaseX: 596,
  glassBaseY: 592,
  trunkX: 494,
  trunkY: 588,
  tailTopX: 358,
  tailTopY: 630,
  tailBottomX: 300,
  beltlineY: 574,
  rockerY: 756,
};

export const TEMPEST_PARAMS: ProfileParams = {
  ...SERAPH_PARAMS,
  name: "tempest-vx",
  wheelbase: 668,
  frontOverhang: 216,
  noseY: 700,
  cowlX: 1000,
  cowlY: 596,
  roofFrontX: 936,
  roofFrontY: 498,
  roofRearX: 806,
  roofRearY: 482,
  glassBaseX: 640,
  glassBaseY: 574,
  trunkX: 552,
  trunkY: 570,
  tailTopX: 430,
  tailTopY: 608,
  tailBottomX: 356,
  beltlineY: 560,
  rockerY: 752,
};

export const MARLIN_PARAMS: ProfileParams = {
  ...SERAPH_PARAMS,
  name: "marlin-88",
  wheelbase: 640,
  rearOverhang: 150,
  frontOverhang: 216,
  wheelR: 116,
  archR: 152,
  noseY: 724,
  cowlX: 956,
  cowlY: 622,
  roofFrontX: 900,
  roofFrontY: 512,
  roofRearX: 744,
  roofRearY: 504,
  glassBaseX: 586,
  glassBaseY: 600,
  trunkX: 480,
  trunkY: 596,
  tailTopX: 348,
  tailTopY: 636,
  tailBottomX: 300,
  beltlineY: 584,
  rockerY: 760,
};

export interface ProfileGeometry {
  params: ProfileParams;
  axleY: number;
  rax: number;
  fax: number;
  archR: number;
  wheelR: number;
  noseX: number;
  body: string;
  windows: string;
  mirror: string;
  liveryRegion: string;
  fenderFront: string;
  fenderRear: string;
  doorLine: string;
  hoodVent: string;
  rockerAccent: string;
}

function archSweepToRight(): string {
  return "0 1";
}

export function buildProfile(p: ProfileParams): ProfileGeometry {
  const axleY = p.ground - p.wheelR;
  const rax = p.rearOverhang;
  const fax = p.rearOverhang + p.wheelbase;
  const noseX = p.rearOverhang + p.wheelbase + p.frontOverhang;
  const archL = rax - p.archR;
  const archR = rax + p.archR;
  const archF = fax + p.archR;

  const hoodMidX = (noseX + p.cowlX) * 0.5 - 40;

  const body =
    `M ${noseX - 6} ${p.ground - 10} ` +
    `C ${noseX + 8} ${p.ground - 34}, ${noseX + 10} ${p.ground - 62}, ${noseX + 8} ${p.ground - 82} ` +
    `C ${noseX + 12} ${p.ground - 104}, ${noseX + 8} ${p.ground - 130}, ${noseX} ${p.noseY} ` +
    `C ${noseX - 14} ${p.noseY - 20}, ${noseX - 40} ${p.noseY - 34}, ${noseX - 70} ${p.noseY - 42} ` +
    `C ${hoodMidX} ${p.noseY - 66}, ${p.cowlX + 44} ${p.cowlY - 16}, ${p.cowlX} ${p.cowlY} ` +
    `C ${p.cowlX - 16} ${p.cowlY - 12}, ${p.cowlX - 42} ${p.cowlY - 44}, ${p.roofFrontX + 20} ${p.roofFrontY - 18} ` +
    `C ${p.roofFrontX} ${p.roofFrontY - 26}, ${p.roofFrontX - 8} ${p.roofFrontY}, ${p.roofFrontX} ${p.roofFrontY} ` +
    `C ${p.roofFrontX - 18} ${p.roofFrontY - 10}, ${p.roofRearX + 22} ${p.roofRearY - 6}, ${p.roofRearX} ${p.roofRearY} ` +
    `C ${p.roofRearX - 20} ${p.roofRearY + 8}, ${p.roofRearX - 44} ${p.roofRearY + 28}, ${p.glassBaseX + 12} ${p.glassBaseY - 24} ` +
    `C ${p.glassBaseX - 10} ${p.glassBaseY - 8}, ${p.glassBaseX - 34} ${p.glassBaseY - 2}, ${p.trunkX} ${p.trunkY} ` +
    `C ${p.trunkX - 44} ${p.trunkY + 6}, ${p.tailTopX + 52} ${p.tailTopY + 2}, ${p.tailTopX + 20} ${p.tailTopY + 10} ` +
    `C ${p.tailTopX + 8} ${p.tailTopY + 26}, ${p.tailTopX} ${p.tailTopY + 58}, ${p.tailBottomX + 8} ${p.tailTopY + 118} ` +
    `C ${p.tailBottomX + 3} ${p.tailTopY + 176}, ${p.tailBottomX} ${p.tailTopY + 204}, ${p.tailBottomX} ${p.ground - 10} ` +
    `C ${p.tailBottomX + 34} ${p.ground - 4}, ${archL - 16} ${p.ground - 4}, ${archL} ${axleY} ` +
    `A ${p.archR} ${p.archR} 0 ${archSweepToRight()} ${archR} ${axleY} ` +
    `L ${archF} ${axleY} ` +
    `A ${p.archR} ${p.archR} 0 ${archSweepToRight()} ${fax + p.archR} ${axleY} ` +
    `C ${fax + p.archR + 14} ${axleY + 10}, ${fax + p.archR + 24} ${axleY + 42}, ${noseX - 6} ${p.ground - 10} ` +
    `Z`;

  const windows =
    `M ${p.cowlX + 2} ${p.beltlineY + 6} ` +
    `C ${p.cowlX - 34} ${p.beltlineY + 4}, ${p.cowlX - 28} ${p.beltlineY - 26}, ${p.cowlX - 52} ${p.beltlineY - 44} ` +
    `C ${p.cowlX - 66} ${p.beltlineY - 58}, ${p.roofFrontX + 6} ${p.roofFrontY - 22}, ${p.roofFrontX + 2} ${p.roofFrontY - 2} ` +
    `L ${p.roofRearX - 6} ${p.roofRearY + 4} ` +
    `C ${p.roofRearX - 30} ${p.roofRearY + 16}, ${p.roofRearX - 60} ${p.roofRearY + 38}, ${p.glassBaseX + 6} ${p.beltlineY + 2} ` +
    `C ${p.glassBaseX + 30} ${p.beltlineY + 2}, ${p.cowlX - 10} ${p.beltlineY + 8}, ${p.cowlX + 2} ${p.beltlineY + 6} ` +
    `Z`;

  const mirror =
    `M ${p.cowlX - 4} ${p.beltlineY - 6} ` +
    `C ${p.cowlX + 16} ${p.beltlineY - 18}, ${p.cowlX + 26} ${p.beltlineY - 26}, ${p.cowlX + 20} ${p.beltlineY - 32} ` +
    `C ${p.cowlX + 12} ${p.beltlineY - 40}, ${p.cowlX - 4} ${p.beltlineY - 30}, ${p.cowlX - 10} ${p.beltlineY - 14} ` +
    `Z`;

  const liveryRegion =
    `M ${rax + p.archR + 24} ${p.beltlineY + 34} ` +
    `L ${fax - p.archR - 30} ${p.beltlineY + 26} ` +
    `L ${fax - p.archR - 44} ${p.rockerY - 6} ` +
    `L ${rax + p.archR + 38} ${p.rockerY - 6} ` +
    `Z`;

  const doorLine =
    `M ${fax - 158} ${p.beltlineY + 34} ` +
    `C ${fax - 168} ${p.beltlineY + 80}, ${fax - 172} ${p.rockerY - 30}, ${fax - 168} ${p.rockerY + 2}`;

  const hoodVent =
    `M ${noseX - 108} ${p.noseY - 28} ` +
    `C ${noseX - 140} ${p.noseY - 22}, ${noseX - 190} ${p.noseY - 14}, ${noseX - 224} ${p.noseY - 12} ` +
    `C ${noseX - 222} ${p.noseY - 26}, ${noseX - 184} ${p.noseY - 36}, ${noseX - 104} ${p.noseY - 42} ` +
    `Z`;

  const rockerAccent =
    `M ${archR + 34} ${p.rockerY - 2} ` +
    `L ${archF - 40} ${p.rockerY - 2} ` +
    `L ${archF - 44} ${p.rockerY + 10} ` +
    `L ${archR + 30} ${p.rockerY + 10} ` +
    `Z`;

  const fenderFront =
    `M ${fax + p.archR + 4} ${axleY + 2} ` +
    `C ${fax + p.archR + 18} ${axleY - 8}, ${fax + p.archR + 26} ${axleY - 30}, ${fax + p.archR + 20} ${axleY - 52} ` +
    `C ${fax + p.archR + 14} ${axleY - 72}, ${fax + p.archR + 4} ${axleY - 88}, ${fax + p.archR - 6} ${axleY - 100} `;

  const fenderRear =
    `M ${rax - p.archR - 4} ${axleY + 2} ` +
    `C ${rax - p.archR - 18} ${axleY - 10}, ${rax - p.archR - 26} ${axleY - 34}, ${rax - p.archR - 18} ${axleY - 58} ` +
    `C ${rax - p.archR - 10} ${axleY - 82}, ${rax - p.archR + 2} ${axleY - 96}, ${rax - p.archR + 12} ${axleY - 106} `;

  return {
    params: p,
    axleY,
    rax,
    fax,
    archR: p.archR,
    wheelR: p.wheelR,
    noseX,
    body,
    windows,
    mirror,
    liveryRegion,
    fenderFront,
    fenderRear,
    doorLine,
    hoodVent,
    rockerAccent,
  };
}

export const PROFILES: Record<string, ProfileParams> = {
  "seraph-r": SERAPH_PARAMS,
  "tempest-vx": TEMPEST_PARAMS,
  "marlin-88": MARLIN_PARAMS,
};

export interface VehicleVisual {
  params: ProfileParams;
  geometry: ProfileGeometry;
  paint: { base: string; shade: string; accent: string; glass: string; rim?: string };
}

export function buildVisual(id: string, paint: VehicleVisual["paint"]): VehicleVisual {
  const params = PROFILES[id];
  return { params, geometry: buildProfile(params), paint };
}

export function profileSvgPreview(visual: VehicleVisual): string {
  const { geometry: g, paint } = visual;
  const p = visual.params;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#0b0b10"/>
  <path d="${g.body}" fill="${paint.base}"/>
  <path d="${g.windows}" fill="${paint.glass}"/>
  <path d="${g.liveryRegion}" fill="#ff3f8e" opacity="0.5"/>
  <path d="${g.doorLine}" stroke="#000" stroke-width="3" fill="none" opacity="0.5"/>
  <path d="${g.hoodVent}" fill="#000" opacity="0.5"/>
  <path d="${g.rockerAccent}" fill="${paint.accent}"/>
  <path d="${g.mirror}" fill="${paint.shade}"/>
  <circle cx="${g.rax}" cy="${g.axleY}" r="${g.wheelR}" fill="#000" opacity="0.35"/>
  <circle cx="${g.fax}" cy="${g.axleY}" r="${g.wheelR}" fill="#000" opacity="0.35"/>
  <line x1="${p.ground}" y1="${p.ground}" x2="0" y2="${p.ground}" stroke="#ff3f8e" stroke-width="2"/>
</svg>`;
}