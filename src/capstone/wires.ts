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
  /** Where the line meets each chip. */
  from: Point;
  to: Point;
  /**
   * Where the dot sits: the anchor nudged onto the chip, so it reads as
   * plugged into the box rather than floating beside it.
   */
  fromPort: Point;
  toPort: Point;
}

/** How much of a chip edge the anchors may spread across. */
const FAN_INSET = 26;
/** How far a dot sits inside the edge, so it overlaps the box it belongs to. */
const PORT_INSET = 2;

export function wireKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function planWires(
  edges: [number, number][],
  centres: Record<number, Point>,
  chip: number,
): WirePlan[] {
  const half = chip / 2;
  const span = Math.max(chip - FAN_INSET, 0);
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
      fromPort: inset(from, centres[a]),
      toPort: inset(to, centres[b]),
      d: link(from, to),
    });
  }
  return plans;
}

/** The dot's centre: a nudge from the edge toward the middle of its chip. */
function inset(anchor: Point, centre: Point | undefined): Point {
  if (!centre) return anchor;
  const dx = centre.x - anchor.x;
  const dy = centre.y - anchor.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: r(anchor.x + (dx / length) * PORT_INSET),
    y: r(anchor.y + (dy / length) * PORT_INSET),
  };
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
