import type { Point } from './Board';

/**
 * Where a connection meets a chip, and the curve it takes to get there.
 *
 * Two problems this solves, both of which made the board look scratchy. A
 * line drawn centre to centre stabs through the chip it lands on, so anchors
 * sit on the edge instead. And four lines leaving one server all left from
 * the same point, so anchors fan across that edge in the order of where they
 * are going.
 */
export interface WirePlan {
  /** Stable, low part id first. */
  key: string;
  a: number;
  b: number;
  d: string;
  /**
   * Where the line meets each chip, and where its dot sits: exactly on the
   * border, half in and half out, so the dot reads as plugged into the box.
   */
  from: Point;
  to: Point;
}

/**
 * The straight run of a chip edge is what the anchors spread across: past
 * that the border is curving away, and an anchor placed by edge arithmetic
 * alone stops being on the border at all. boundaryPoint below is what makes
 * that a guarantee rather than an intention.
 */
function fanSpan(chip: number, radius: number): number {
  return Math.max(chip - 2 * radius, 0);
}

/**
 * Where a ray leaving the middle of a chip crosses its rounded border.
 *
 * Exact, not approximate: on the flat run it is the square's edge, and around
 * a corner it is the corner circle, solved. This is the whole reason a dot
 * can be trusted to sit on the border however many connections a chip carries
 * and wherever they are heading.
 *
 * The chip is square, which is why one half-extent is enough.
 */
export function boundaryPoint(half: number, radius: number, dx: number, dy: number): Point {
  const longest = Math.max(Math.abs(dx), Math.abs(dy));
  if (longest === 0) return { x: 0, y: 0 };

  // Where the ray leaves the plain square.
  const t = half / longest;
  const x = dx * t;
  const y = dy * t;
  const flat = half - radius;
  if (Math.abs(x) <= flat || Math.abs(y) <= flat) return { x, y };

  // Past the flat run, so it leaves through a corner: meet that circle.
  const cx = Math.sign(x) * flat;
  const cy = Math.sign(y) * flat;
  const a = dx * dx + dy * dy;
  const b = -2 * (dx * cx + dy * cy);
  const c = cx * cx + cy * cy - radius * radius;
  const root = Math.sqrt(Math.max(b * b - 4 * a * c, 0));
  const hit = (-b + root) / (2 * a);
  return { x: dx * hit, y: dy * hit };
}

/** A wire, sampled along its length, for working out what a tap meant. */
export interface WireSamples {
  key: string;
  points: Point[];
}

/**
 * Which wire a tap was aiming at (docs/12 part C).
 *
 * Nearest, not topmost. A tap target for a line has to be far wider than the
 * line, and on a full board those targets overlap; letting the last-drawn one
 * win means the board removes a connection the user was not pointing at.
 * Returns null when nothing is within reach, so a tap on empty paper does
 * nothing rather than something arbitrary.
 */
export function nearestWire(wires: WireSamples[], at: Point, reach: number): string | null {
  let best: string | null = null;
  let closest = reach;
  for (const wire of wires) {
    for (const point of wire.points) {
      const distance = Math.hypot(point.x - at.x, point.y - at.y);
      if (distance < closest) {
        closest = distance;
        best = wire.key;
      }
    }
  }
  return best;
}

export function wireKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function planWires(
  edges: [number, number][],
  centres: Record<number, Point>,
  chip: number,
  radius: number,
): WirePlan[] {
  const half = chip / 2;
  const span = fanSpan(chip, radius);
  const anchors = new Map<string, Point>();

  // Group by the edge of the chip each connection leaves from, so they can be
  // spread along it rather than stacked on its midpoint.
  const sides = new Map<string, { key: string; toward: Point }[]>();
  const bucket = (
    id: number,
    side: 'top' | 'bottom' | 'left' | 'right',
    key: string,
    toward: Point,
  ) => {
    const at = `${id}:${side}`;
    if (!sides.has(at)) sides.set(at, []);
    sides.get(at)?.push({ key, toward });
  };

  for (const [a, b] of edges) {
    const pa = centres[a];
    const pb = centres[b];
    if (!pa || !pb) continue;
    const key = wireKey(a, b);
    if (Math.abs(pa.y - pb.y) < 1) {
      bucket(a, pb.x > pa.x ? 'right' : 'left', `${key}:${a}`, pb);
      bucket(b, pa.x > pb.x ? 'right' : 'left', `${key}:${b}`, pa);
    } else {
      bucket(a, pa.y < pb.y ? 'bottom' : 'top', `${key}:${a}`, pb);
      bucket(b, pb.y < pa.y ? 'bottom' : 'top', `${key}:${b}`, pa);
    }
  }

  for (const [at, group] of sides) {
    const id = Number(at.split(':')[0]);
    const side = at.split(':')[1];
    const centre = centres[id];
    if (!centre) continue;
    const vertical = side === 'top' || side === 'bottom';
    const ordered = [...group].sort((x, y) =>
      vertical ? x.toward.x - y.toward.x : x.toward.y - y.toward.y,
    );
    ordered.forEach((entry, index) => {
      const offset = ordered.length === 1 ? 0 : -span / 2 + (span * index) / (ordered.length - 1);
      anchors.set(
        entry.key,
        vertical
          ? { x: centre.x + offset, y: centre.y + (side === 'bottom' ? half : -half) }
          : { x: centre.x + (side === 'right' ? half : -half), y: centre.y + offset },
      );
    });
  }

  const plans: WirePlan[] = [];
  for (const [a, b] of edges) {
    const key = wireKey(a, b);
    const from = anchors.get(`${key}:${a}`);
    const to = anchors.get(`${key}:${b}`);
    if (!from || !to) continue;
    plans.push({
      key,
      a,
      b,
      from,
      to,
      d: link(from, to),
    });
  }
  return plans;
}

/**
 * Between rows, a cubic with tangents perpendicular to the edge it leaves, so
 * a connection grows out of the chip rather than grazing it, and a crossing
 * reads as one line passing over another.
 *
 * Within a row it is a straight line. Two chips side by side have nothing to
 * curve around, and bending that line only makes it look drawn by a machine
 * that did not know why.
 */
function link(from: Point, to: Point): string {
  const dy = to.y - from.y;
  if (Math.abs(dy) < 1) {
    return `M ${r(from.x)} ${r(from.y)} L ${r(to.x)} ${r(to.y)}`;
  }
  const reach = dy * 0.34;
  return `M ${r(from.x)} ${r(from.y)} C ${r(from.x)} ${r(from.y + reach)}, ${r(to.x)} ${r(to.y - reach)}, ${r(to.x)} ${r(to.y)}`;
}

function r(n: number): number {
  return Math.round(n * 10) / 10;
}
