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
 * The shape of each cue is a small score (see `VOICES`) played through one
 * shared bus: notes fan out to a dry path and to a short synthesised tail, so
 * a correct answer rings in a room rather than beeping in a box. Level stays
 * low on purpose. The cue should read as expensive, not as loud.
 *
 * Every call is wrapped because audio is blocked outright in some contexts and
 * throws in others, and every node past the oscillator is optional: WebKit
 * shipped panning and convolution later than the rest, and the cue has to
 * degrade to plain tones there rather than fall over.
 */

interface Note {
  /** Pitch in Hz. */
  freq: number;
  /** Start, in seconds after the cue is triggered. */
  at: number;
  /** Seconds for the tail to fall away to silence. */
  dur: number;
  /** Peak gain of this note, before the master. */
  level: number;
  /**
   * Detune spread in cents. Above zero the note is stacked as two oscillators
   * pulled apart in pitch and panned to opposite sides, which is what makes it
   * sound wide instead of centred in the listener's head.
   */
  spread?: number;
  type?: OscillatorType;
  /** Slide the pitch here across the note. Used to stop a miss sounding flat. */
  bendTo?: number;
  /** Share of the note sent to the tail. Low keeps it dry and close. */
  send?: number;
}

/**
 * Equal temperament, A4 = 440. The correct cue is the same rising E5 to A5 it
 * always was; what is new is the octave of sparkle over it, the quiet low A
 * underneath for body, and the tail behind all of it.
 */
const VOICES: Record<FeedbackKind, Note[]> = {
  right: [
    { freq: 659.25, at: 0, dur: 0.34, level: 0.05, spread: 9, send: 0.65 },
    { freq: 880, at: 0.085, dur: 0.66, level: 0.055, spread: 12, send: 1 },
    { freq: 1760, at: 0.1, dur: 0.5, level: 0.011, spread: 18, send: 1 },
    { freq: 220, at: 0.085, dur: 0.36, level: 0.028, type: 'triangle', send: 0.2 },
  ],
  // Unchanged in character: one low note, quiet, over quickly. The small fall
  // in pitch is there so it reads as a shrug rather than a buzzer.
  wrong: [{ freq: 220, at: 0, dur: 0.3, level: 0.066, bendTo: 196, send: 0.25 }],
  complete: [
    { freq: 523.25, at: 0, dur: 0.3, level: 0.042, spread: 8, send: 0.6 },
    { freq: 659.25, at: 0.09, dur: 0.34, level: 0.042, spread: 8, send: 0.7 },
    { freq: 783.99, at: 0.18, dur: 0.4, level: 0.044, spread: 10, send: 0.85 },
    { freq: 1046.5, at: 0.27, dur: 0.9, level: 0.05, spread: 14, send: 1 },
    { freq: 130.81, at: 0.27, dur: 0.5, level: 0.03, type: 'triangle', send: 0.2 },
  ],
};

/** How far apart a spread note's two halves sit in the stereo field. */
const WIDTH = 0.34;

type AudioCtor = typeof AudioContext;

interface Bus {
  ctx: AudioContext;
  /** Where every voice lands, dry. */
  master: GainNode;
  /** Input to the tail, or null where convolution is unavailable. */
  tail: GainNode | null;
}

let context: AudioContext | null = null;
let bus: Bus | null = null;

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

/**
 * A room, generated rather than shipped: noise under an exponential decay is
 * the cheapest impulse response that still sounds like a space and not like a
 * delay. Short and dark, so the cue keeps its edges.
 */
function roomImpulse(ctx: AudioContext): AudioBuffer | null {
  if (typeof ctx.createBuffer !== 'function') return null;
  const rate = ctx.sampleRate || 44100;
  const length = Math.floor(rate * 1.1);
  // A beat of silence before the room answers. Without it the tail lands on
  // top of the note and reads as a slap; with it the note has somewhere to be.
  const preDelay = Math.floor(rate * 0.014);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let i = preDelay; i < length; i += 1) {
      const t = (i - preDelay) / (length - preDelay);
      // The two channels get independent noise, which is most of why the tail
      // sounds wide rather than like one sound placed in the middle.
      samples[i] = (Math.random() * 2 - 1) * (1 - t) ** 3.2;
    }
  }
  return buffer;
}

/** Build the shared output chain once per context. */
function getBus(ctx: AudioContext): Bus | null {
  if (bus && bus.ctx === ctx) return bus;
  const master = ctx.createGain();
  master.gain.value = 0.9;

  // A safety net, not an effect: several notes plus a tail can stack past full
  // scale, and clipping is the least premium sound there is. This is a soft
  // curve rather than a DynamicsCompressor because Chrome's compressor costs
  // around 7dB even on material far below its threshold, which would quietly
  // undo the whole point of this. tanh is straight through the level these
  // cues actually live at and only rounds the peaks above it.
  let out: AudioNode = master;
  if (typeof ctx.createWaveShaper === 'function') {
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i += 1) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(1.2 * x) / 1.2;
    }
    shaper.curve = curve;
    master.connect(shaper);
    out = shaper;
  }
  out.connect(ctx.destination);

  let tail: GainNode | null = null;
  const impulse = typeof ctx.createConvolver === 'function' ? roomImpulse(ctx) : null;
  if (impulse) {
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    tail = ctx.createGain();
    tail.gain.value = 0.3;
    tail.connect(convolver);
    convolver.connect(master);
  }

  bus = { ctx, master, tail };
  return bus;
}

/** One oscillator: a single voice, or half of a spread pair. */
function playVoice(b: Bus, note: Note, start: number, cents: number, pan: number): void {
  const { ctx } = b;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = note.type ?? 'sine';
  osc.frequency.setValueAtTime(note.freq, start);
  if (note.bendTo) osc.frequency.exponentialRampToValueAtTime(note.bendTo, start + note.dur);
  if (cents) osc.detune.value = cents;

  // Fast in, long exponential out. A bell decays, a beep stops.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(note.level, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

  let node: AudioNode = gain;
  if (pan && typeof ctx.createStereoPanner === 'function') {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    node = panner;
  }
  node.connect(b.master);

  if (b.tail && note.send) {
    const send = ctx.createGain();
    send.gain.value = note.send;
    node.connect(send);
    send.connect(b.tail);
  }

  osc.connect(gain);
  osc.start(start);
  osc.stop(start + note.dur + 0.05);
}

export function playTone(kind: FeedbackKind, enabled: boolean): void {
  if (!enabled) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    // Answers are user gestures, so a suspended context can resume here.
    if (ctx.state === 'suspended') void ctx.resume();
    const b = getBus(ctx);
    if (!b) return;
    VOICES[kind].forEach((note) => {
      const start = ctx.currentTime + note.at;
      if (note.spread) {
        playVoice(b, note, start, -note.spread / 2, -WIDTH);
        playVoice(b, note, start, note.spread / 2, WIDTH);
      } else {
        playVoice(b, note, start, 0, 0);
      }
    });
  } catch {
    // Autoplay policy, a closed context, or no output device. Never fatal.
  }
}

/** Test seam: drop the cached context and bus so a stubbed one is picked up. */
export function resetAudioForTests(): void {
  context = null;
  bus = null;
}
