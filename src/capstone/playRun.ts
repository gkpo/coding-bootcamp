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
  dot,
  reduceMotion,
  onResolve,
  onFinish,
}: PlayOptions): () => void {
  const legs = plan.steps.map((step) => ({
    step,
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

    if (leg.points.length === 1) show(leg.points[0]);
    else if (leg.points.length > 1) {
      // Constant speed, no easing between hops: this is a cursor, not a
      // character with a personality.
      const hops = leg.points.length - 1;
      const t = Math.min(elapsed / leg.ms, 1) * hops;
      const hop = Math.min(Math.floor(t), hops - 1);
      show(between(leg.points[hop], leg.points[hop + 1], t - hop));
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

function between(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
