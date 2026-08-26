/**
 * Haptics and sound for answer feedback.
 *
 * Both are behind settings toggles and both must be silent no-ops where the
 * platform lacks support: `navigator.vibrate` does not exist on desktop
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

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

/**
 * Short synthesised tones, so there are no audio files to ship or cache.
 *
 * This exists because the Sound toggle in settings was previously stored and
 * drawn but never read by anything: a control that pretends to work is worse
 * than no control.
 *
 * Two notes rising for a correct answer, one low note for a miss. Quiet by
 * design, and every call is wrapped because audio is blocked outright in some
 * contexts and throws in others.
 */
const TONES: Record<FeedbackKind, number[]> = {
  right: [660, 880],
  wrong: [220],
  complete: [523, 659, 784],
};

type AudioCtor = typeof AudioContext;

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const w = globalThis as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
    return context;
  } catch {
    return null;
  }
}

export function playTone(kind: FeedbackKind, enabled: boolean): void {
  if (!enabled) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    // Answers are user gestures, so a suspended context can resume here.
    if (ctx.state === 'suspended') void ctx.resume();
    TONES[kind].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.09;
      osc.type = 'sine';
      osc.frequency.value = frequency;
      // Fade in and out; a raw square edge clicks.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.06, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch {
    // Autoplay policy, a closed context, or no output device. Never fatal.
  }
}

/** Test seam: drop the cached context so a stubbed one is picked up. */
export function resetAudioForTests(): void {
  context = null;
}
