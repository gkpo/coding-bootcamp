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

export interface Note {
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
  /**
   * Marks the note as the bright partial on top rather than part of the cue's
   * spine, which is what lets the sparkle be dialled without retuning the rest.
   */
  sparkle?: true;
}

/**
 * The four things worth moving by ear rather than by argument. Every cue is
 * rendered through these, so the same note list can be auditioned wide or
 * narrow, wet or dry, without a second copy of the synthesis.
 */
export interface Tuning {
  /** Master gain. */
  level: number;
  /** How far a spread note's halves sit apart, 0 (mono) to 1 (hard). */
  width: number;
  /** How much of the cue reaches the room, 0 (dry) to 1. */
  tail: number;
  /** Length of the room itself, in seconds. */
  tailSeconds: number;
  /** Multiplier on notes flagged `sparkle`. */
  sparkle: number;
}

export const DEFAULT_TUNING: Tuning = {
  level: 0.9,
  width: 0.34,
  tail: 0.3,
  tailSeconds: 1.1,
  sparkle: 1,
};

/**
 * Equal temperament, A4 = 440. The correct cue is the same rising E5 to A5 it
 * always was; what is new is the octave of sparkle over it, the quiet low A
 * underneath for body, and the tail behind all of it.
 */
export const VOICES: Record<FeedbackKind, Note[]> = {
  right: [
    { freq: 659.25, at: 0, dur: 0.34, level: 0.05, spread: 9, send: 0.65 },
    { freq: 880, at: 0.085, dur: 0.66, level: 0.055, spread: 12, send: 1 },
    { freq: 1760, at: 0.1, dur: 0.5, level: 0.011, spread: 18, send: 1, sparkle: true },
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

type AudioCtor = typeof AudioContext;

interface Bus {
  ctx: AudioContext;
  /** Where every voice lands, dry. */
  master: GainNode;
  /** Input to the tail, or null where convolution is unavailable. */
  tail: GainNode | null;
  /** The convolver, kept so a new room length can be swapped in. */
  room: ConvolverNode | null;
  /** Length the current room was built at. */
  roomSeconds: number;
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
function roomImpulse(ctx: AudioContext, seconds: number): AudioBuffer | null {
  if (typeof ctx.createBuffer !== 'function') return null;
  const rate = ctx.sampleRate || 44100;
  const length = Math.max(1, Math.floor(rate * seconds));
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

/**
 * Build the shared output chain once per context, then keep it, re-pointing
 * the two gains at whatever tuning asks for. Only a change of room length
 * costs anything: that one has to be generated again.
 */
function getBus(ctx: AudioContext, tuning: Tuning): Bus | null {
  if (bus && bus.ctx === ctx) {
    bus.master.gain.value = tuning.level;
    if (bus.tail) bus.tail.gain.value = tuning.tail;
    if (bus.room && bus.roomSeconds !== tuning.tailSeconds) {
      const next = roomImpulse(ctx, tuning.tailSeconds);
      if (next) {
        bus.room.buffer = next;
        bus.roomSeconds = tuning.tailSeconds;
      }
    }
    return bus;
  }
  const master = ctx.createGain();
  master.gain.value = tuning.level;

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
  let room: ConvolverNode | null = null;
  const impulse =
    typeof ctx.createConvolver === 'function' ? roomImpulse(ctx, tuning.tailSeconds) : null;
  if (impulse) {
    room = ctx.createConvolver();
    room.buffer = impulse;
    tail = ctx.createGain();
    tail.gain.value = tuning.tail;
    tail.connect(room);
    room.connect(master);
  }

  bus = { ctx, master, tail, room, roomSeconds: tuning.tailSeconds };
  return bus;
}

/** One oscillator: a single voice, or half of a spread pair. */
function playVoice(
  b: Bus,
  note: Note,
  start: number,
  cents: number,
  pan: number,
  tuning: Tuning,
): void {
  const { ctx } = b;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = note.type ?? 'sine';
  osc.frequency.setValueAtTime(note.freq, start);
  if (note.bendTo) osc.frequency.exponentialRampToValueAtTime(note.bendTo, start + note.dur);
  if (cents) osc.detune.value = cents;

  // Never zero: an exponential ramp cannot reach or leave silence, so the
  // floor has to stay above it even when a slider is pulled all the way down.
  const peak = Math.max(0.00011, note.level * (note.sparkle ? tuning.sparkle : 1));

  // Fast in, long exponential out. A bell decays, a beep stops.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
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

/**
 * Play an arbitrary cue. `playTone` is this with the shipped notes and the
 * shipped tuning; the sound studio is this with everything else.
 */
export function playNotes(notes: Note[], enabled: boolean, tuning?: Partial<Tuning>): void {
  if (!enabled) return;
  const ctx = audioContext();
  if (!ctx) return;
  const t = { ...DEFAULT_TUNING, ...tuning };
  try {
    // Answers are user gestures, so a suspended context can resume here.
    if (ctx.state === 'suspended') void ctx.resume();
    const b = getBus(ctx, t);
    if (!b) return;
    notes.forEach((note) => {
      const start = ctx.currentTime + note.at;
      if (note.spread && t.width > 0) {
        playVoice(b, note, start, -note.spread / 2, -t.width, t);
        playVoice(b, note, start, note.spread / 2, t.width, t);
      } else {
        playVoice(b, note, start, 0, 0, t);
      }
    });
  } catch {
    // Autoplay policy, a closed context, or no output device. Never fatal.
  }
}

export function playTone(kind: FeedbackKind, enabled: boolean): void {
  playNotes(VOICES[kind], enabled);
}

/** Test seam: drop the cached context and bus so a stubbed one is picked up. */
export function resetAudioForTests(): void {
  context = null;
  bus = null;
}
