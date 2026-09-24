export interface PathPoint {
  x: number;
  y: number;
}

interface ArcSeg {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  startAngle: number;
  endAngle: number;
  sweep: number;
}

function arcToCenter(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, large: number, sweep: number): ArcSeg {
  const phi = 0;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const x1p2 = x1p * x1p;
  const y1p2 = y1p * y1p;
  const lambda = Math.sqrt(Math.max(0, (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2)));
  const cxp = (lambda * rx * y1p) / ry;
  const cyp = (-lambda * ry * x1p) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  const startAngle = Math.atan2(uy, ux);
  let delta = Math.atan2(vy, vx) - startAngle;
  if (sweep === 0 && delta > 0) delta -= Math.PI * 2;
  if (sweep === 1 && delta < 0) delta += Math.PI * 2;
  const endAngle = startAngle + delta;
  return { cx, cy, rx: Math.abs(rx), ry: Math.abs(ry), startAngle, endAngle, sweep };
}

/**
 * Samples an SVG path (subset: M, L, C, A, Z) into `count` points.
 * Used to convert the V1 2D vehicle geometry into 3D construction paths.
 */
export function samplePath(d: string, count: number): PathPoint[] {
  const pts: PathPoint[] = [];
  let cur: PathPoint = { x: 0, y: 0 };
  let start: PathPoint = { x: 0, y: 0 };

  const tokens = d.match(/[MmLlCcAaZz]|[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = "";
  const pushSeg = (a: PathPoint, b: PathPoint, steps: number) => {
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  };

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/^[MmLlCcAaZz]$/.test(tok)) {
      cmd = tok;
      i++;
      continue;
    }
    const num = parseFloat(tok);
    if (cmd === "M") {
      cur = { x: num, y: parseFloat(tokens[++i]) };
      start = cur;
      pts.push(cur);
      i++;
      cmd = "L";
    } else if (cmd === "L") {
      const nx = num;
      const ny = parseFloat(tokens[++i]);
      pushSeg(cur, { x: nx, y: ny }, 1);
      cur = { x: nx, y: ny };
      i++;
    } else if (cmd === "C") {
      const c1x = num;
      const c1y = parseFloat(tokens[++i]);
      const c2x = parseFloat(tokens[++i]);
      const c2y = parseFloat(tokens[++i]);
      const ex = parseFloat(tokens[++i]);
      const ey = parseFloat(tokens[++i]);
      const steps = 14;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const mt = 1 - t;
        pts.push({
          x: mt * mt * mt * cur.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex,
          y: mt * mt * mt * cur.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey,
        });
      }
      cur = { x: ex, y: ey };
      i++;
    } else if (cmd === "A") {
      const rx = num;
      const ry = parseFloat(tokens[++i]);
      const rot = parseFloat(tokens[++i]);
      void rot;
      const large = parseFloat(tokens[++i]);
      const sweep = parseFloat(tokens[++i]);
      const ex = parseFloat(tokens[++i]);
      const ey = parseFloat(tokens[++i]);
      const arc = arcToCenter(cur.x, cur.y, ex, ey, rx, ry, large, sweep);
      const steps = 12;
      const span = arc.endAngle - arc.startAngle;
      for (let s = 1; s <= steps; s++) {
        const a = arc.startAngle + (span * s) / steps;
        pts.push({ x: arc.cx + arc.rx * Math.cos(a), y: arc.cy + arc.ry * Math.sin(a) });
      }
      cur = { x: ex, y: ey };
      i++;
    } else if (cmd === "Z") {
      pushSeg(cur, start, 1);
      cur = start;
      i++;
    } else {
      i++;
    }
  }

  // Resample to exactly `count` evenly spaced points
  const total = pts.length;
  if (total === 0) return pts;
  const out: PathPoint[] = [];
  for (let k = 0; k < count; k++) {
    const idx = Math.min(total - 1, Math.round((k / count) * (total - 1)));
    out.push(pts[idx]);
  }
  return out;
}

/** Closes the loop explicitly (first point appended at the end). */
export function closeLoop(pts: PathPoint[]): PathPoint[] {
  return pts.length > 1 && (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y)
    ? [...pts, pts[0]]
    : [...pts];
}