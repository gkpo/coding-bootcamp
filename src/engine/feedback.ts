/**
 * Haptics and sound for answer feedback.
 *
 * Both are behind settings toggles and both must be silent no-ops where the
 * platform lacks support — `navigator.vibrate` does not exist on desktop
 * Safari or iOS at all, so this can never assume it is there.
 *
 * Kept free of React; the DOM/BOM touch here is deliberate and contained.
 */

export type FeedbackKind = 'right' | 'wrong' | 'complete';

const PATTERNS: Record<FeedbackKind, number | number[]> = {
  right: 12,
  wrong: [0, 30, 60, 30],
  complete: [0, 20, 40, 20, 40, 40],
};

export function vibrate(kind: FeedbackKind, enabled: boolean): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined') return;
  const canVibrate = typeof navigator.vibrate === 'function';
  if (!canVibrate) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw when the page is not visible; nothing to do.
  }
}
