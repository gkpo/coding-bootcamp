/** The docs/06 motion tokens, for the animations JavaScript has to drive. */
export const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
export const MICRO = 150;
export const STANDARD = 250;
/** The summary's dot cascade, reused for the check strip on a stage clear. */
export const STAGGER = 45;

/**
 * Whether motion is off, by the OS preference or the in-app toggle.
 *
 * The stylesheet honours either (docs/06), and so must anything animating
 * from script: an effect that only reads the media query ignores half the
 * users who asked for stillness.
 */
export function motionOff(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.dataset.reduceMotion === 'true') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
