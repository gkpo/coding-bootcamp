import { stepDuration, type FlowStep, type RunPlan } from './flowRun';
import type { PartKind } from '../engine/archgraph';

/** Per hop, and per check with nothing to walk. The docs/12 micro duration. */
export const HOP_MS = 150;
export const REST_MS = 150;

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
   * curve, so a dot interpolated between two chip centres would leave the
   * line it is meant to be tracing.
   */
  along: (from: PartKind, to: PartKind, t: number) => Point | null;
  /** The dot element. Written to directly: it is the one thing moving. */
  dot: HTMLElement | null;
  /** No dot and no travel, but the same order at the same pace (docs/12). */
  reduceMotion: boolean;
  onResolve: (step: FlowStep) => void;
  onFinish: () => void;
}

/**
 * Plays a planned run (docs/12 part D).
 *
 * One requestAnimationFrame driver for the whole thing, writing the dot's
 * transform straight to the element. Going through React state at 60fps would
 * re-render the board every frame to move eight pixels of cursor.
 *
 * Returns a cancel function. Call it when the run is abandoned or the screen
 * goes away, or the loop outlives the board it was drawing on.
 */
export function playRun({
  plan,
  positionOf,
  along,
  dot,
  reduceMotion,
  onResolve,
  onFinish,
}: PlayOptions): () => void {
  const legs = plan.steps.map((step) => ({
    step,
    hops: reduceMotion ? [] : hopsOf(step.route),
    points: reduceMotion ? [] : (step.route.map(positionOf).filter((p) => p !== null) as Point[]),
    ms: reduceMotion ? REST_MS : stepDuration(step, HOP_MS, REST_MS),
  }));

  let frame = 0;
  let cancelled = false;
  let index = 0;
  let legStart: number | null = null;

  const hide = () => {
    if (dot) dot.style.opacity = '0';
  };
  const show = (at: Point) => {
    if (!dot) return;
    dot.style.opacity = '1';
    dot.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
  };

  hide();

  const tick = (now: number) => {
    if (cancelled) return;
    const leg = legs[index];
    if (leg === undefined) {
      hide();
      onFinish();
      return;
    }
    if (legStart === null) legStart = now;
    const elapsed = now - legStart;

    if (leg.hops.length === 0 && leg.points.length === 1) show(leg.points[0]);
    else if (leg.hops.length > 0) {
      // Constant speed, no easing between hops: this is a cursor, not a
      // character with a personality.
      const t = Math.min(elapsed / leg.ms, 1) * leg.hops.length;
      const index = Math.min(Math.floor(t), leg.hops.length - 1);
      const [from, to] = leg.hops[index];
      const at =
        along(from, to, t - index) ?? fallback(positionOf(from), positionOf(to), t - index);
      if (at) show(at);
    } else hide();

    if (elapsed >= leg.ms) {
      onResolve(leg.step);
      index += 1;
      legStart = null;
    }
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    hide();
  };
}

function hopsOf(route: PartKind[]): [PartKind, PartKind][] {
  return route.slice(1).map((kind, i) => [route[i], kind]);
}

/** Straight from centre to centre, when the drawn connection cannot be found. */
function fallback(from: Point | null, to: Point | null, t: number): Point | null {
  if (!from || !to) return null;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
