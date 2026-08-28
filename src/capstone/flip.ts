import { EASE, motionOff } from './motion';

/**
 * First-last-invert, for the two moves that change the layout (docs/12 part D).
 *
 * Placing a part takes it out of the tray and puts it in a lane. Both ends of
 * that are real layout changes, and layout cannot be animated, so the element
 * lands first and is then walked back to where it came from and released.
 * That keeps every frame on transform, and it is what makes a placement read
 * as a chess move rather than as a chip teleporting.
 */
export type Rects = Map<string, DOMRect>;

export function snapshotRects(root: HTMLElement | null, attribute: string): Rects {
  const rects: Rects = new Map();
  if (!root) return rects;
  for (const el of root.querySelectorAll(`[${attribute}]`)) {
    const key = el.getAttribute(attribute);
    if (key !== null) rects.set(key, el.getBoundingClientRect());
  }
  return rects;
}

/** Slides every element that moved back from where it was, then lets go. */
export function replayFrom(
  root: HTMLElement | null,
  attribute: string,
  before: Rects,
  ms: number,
): void {
  if (!root || motionOff()) return;
  for (const el of root.querySelectorAll(`[${attribute}]`)) {
    const key = el.getAttribute(attribute);
    const was = key === null ? undefined : before.get(key);
    if (was) slide(el as HTMLElement, was, ms);
  }
}

/** The same walk-back for one element, from a rect it no longer occupies. */
export function slide(el: HTMLElement, from: DOMRect, ms: number): void {
  if (motionOff()) return;
  const now = el.getBoundingClientRect();
  const dx = from.left - now.left;
  const dy = from.top - now.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
    duration: ms,
    easing: EASE,
  });
}
