import { type FlowStep, type RunPlan } from './flowRun';
import { PACKETS, opacityOf, planPackets, progressOf } from './packets';
import type { PartKind } from '../engine/archgraph';

/**
 * How many packet elements the board keeps.
 *
 * One more than a convoy, because a convoy's tail is still in the air when
 * the next check's leader sets off, and both want an element of their own.
 */
export const PACKET_SLOTS = PACKETS + 1;

export interface Point {
  x: number;
  y: number;
}

export interface PlayOptions {
  plan: RunPlan;
  /** Where a kind sits on the board, or null when it is not there. */
  positionOf: (kind: PartKind) => Point | null;
  /**
   * A point along the drawn connection between two kinds, 0 to 1. Connections
   * curve, so a packet interpolated between two chip centres would leave the
   * line it is meant to be tracing.
   */
  along: (from: PartKind, to: PartKind, t: number) => Point | null;
  /**
   * How long that drawn connection is, in pixels.
   *
   * Traffic moves at a fixed speed, so a route's length is what decides both
   * how long its check takes and where each packet is at any moment. Given a
   * flat time per hop instead, a packet crosses a short connection slowly and
   * a long one fast, and lurches at every part on the way.
   */
  lengthOf: (from: PartKind, to: PartKind) => number | null;
  /** The packet elements. Written to directly: they are the things moving. */
  dots: HTMLElement[];
  /** No packets and no travel, but the same order at the same pace (docs/12). */
  reduceMotion: boolean;
  onResolve: (step: FlowStep) => void;
  onFinish: () => void;
}

interface Leg {
  hops: [PartKind, PartKind][];
  lengths: number[];
  total: number;
  /** Where a route with nothing to walk parks its packets. */
  anchor: Point | null;
}

/**
 * Plays a planned run (docs/12 part D).
 *
 * One requestAnimationFrame driver for the whole thing, writing each packet's
 * transform straight to its element. Going through React state at 60fps would
 * re-render the board every frame to move a few pixels of traffic.
 *
 * The rings resolve on the schedule the plan sets, and the packets are free
 * to still be in the air when they do: the last of one check's convoy crosses
 * the first of the next one's, so the board carries traffic rather than a
 * single cursor, and the run is over no later than it was before.
 *
 * Returns a cancel function. Call it when the run is abandoned or the screen
 * goes away, or the loop outlives the board it was drawing on.
 */
export function playRun({
  plan,
  positionOf,
  along,
  lengthOf,
  dots,
  reduceMotion,
  onResolve,
  onFinish,
}: PlayOptions): () => void {
  // Measured first, planned second: at a constant speed a route's length is
  // what decides how long its check takes, so the geometry has to be in hand
  // before there is a schedule at all.
  const legs: Leg[] = plan.steps.map((step) => {
    const hops = hopsOf(step.route);
    const lengths = hops.map(([a, b]) => lengthOf(a, b) ?? span(positionOf(a), positionOf(b)));
    return {
      hops,
      lengths,
      total: lengths.reduce((sum, n) => sum + n, 0),
      anchor: step.route.length > 0 ? positionOf(step.route[0]) : null,
    };
  });

  const timeline = planPackets(
    plan,
    legs.map((leg) => leg.total),
    !reduceMotion,
  );

  let frame = 0;
  let cancelled = false;
  let startedAt: number | null = null;
  let resolved = 0;
  let finished = false;

  const park = (dot: HTMLElement) => {
    dot.style.opacity = '0';
  };
  const draw = (dot: HTMLElement, at: Point, opacity: number) => {
    dot.style.opacity = String(opacity);
    dot.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
  };

  dots.forEach(park);

  const tick = (time: number) => {
    if (cancelled) return;
    if (startedAt === null) startedAt = time;
    const now = time - startedAt;

    // The rings, in order. A frame that straddles two of them fills both:
    // dropping one because the tab stalled would leave a check unanswered.
    while (resolved < timeline.resolveAt.length && now >= timeline.resolveAt[resolved]) {
      onResolve(plan.steps[resolved]);
      resolved += 1;
    }
    if (!finished && now >= timeline.decidedAt) {
      finished = true;
      onFinish();
    }

    let slot = 0;
    for (const packet of timeline.packets) {
      if (slot >= dots.length) break;
      const opacity = opacityOf(packet, now);
      if (opacity <= 0) continue;
      const at = pointOn(legs[packet.leg], progressOf(packet, now) ?? 0);
      if (at === null) continue;
      draw(dots[slot], at, opacity);
      slot += 1;
    }
    for (let i = slot; i < dots.length; i += 1) park(dots[i]);

    if (now >= timeline.duration) {
      dots.forEach(park);
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    dots.forEach(park);
  };

  /** Where a packet that is `progress` of the way along a route has got to. */
  function pointOn(leg: Leg, progress: number): Point | null {
    if (leg.hops.length === 0 || leg.total <= 0) return leg.anchor;
    let left = progress * leg.total;
    for (let i = 0; i < leg.hops.length; i += 1) {
      const length = leg.lengths[i];
      if (left <= length || i === leg.hops.length - 1) {
        const [from, to] = leg.hops[i];
        const t = length > 0 ? Math.min(left / length, 1) : 1;
        return along(from, to, t) ?? lerp(positionOf(from), positionOf(to), t);
      }
      left -= length;
    }
    return leg.anchor;
  }
}

function hopsOf(route: PartKind[]): [PartKind, PartKind][] {
  return route.slice(1).map((kind, i) => [route[i], kind]);
}

/** Centre to centre, when the drawn connection cannot be measured. */
function span(from: Point | null, to: Point | null): number {
  if (!from || !to) return 0;
  return Math.hypot(to.x - from.x, to.y - from.y);
}

/** Straight from centre to centre, when the drawn connection cannot be found. */
function lerp(from: Point | null, to: Point | null, t: number): Point | null {
  if (!from || !to) return null;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
