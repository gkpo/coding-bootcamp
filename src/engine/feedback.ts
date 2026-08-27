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
 * The shape of each cue is a small score (see `CUES`) played through one
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
  /**
   * Seconds to reach full level. The default is a strike; longer makes the
   * note swell in, which is most of what separates a fanfare from a chime.
   */
  attack?: number;
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

/** A cue is its notes plus the treatment they are played through. */
export interface Cue {
  notes: Note[];
  tuning: Tuning;
}

/**
 * Equal temperament, A4 = 440.
 *
 * Each cue carries its own tuning because they do not want the same room. The
 * correct answer was chosen by ear in the sound studio and is deliberately
 * wet, wide and bright; a miss drenched in the same 2.4s hall would read as an
 * event rather than a shrug.
 */
export const CUES: Record<FeedbackKind, Cue> = {
  // "Warm, lower", chosen by ear: A4 up to E5 through the third, rounded off
  // with triangles, over an E an octave below where the first pass put it.
  // More wood than glass, and heavier underneath.
  right: {
    notes: [
      { freq: 440, at: 0, dur: 0.32, level: 0.05, spread: 8, type: 'triangle', send: 0.6 },
      { freq: 554.37, at: 0.08, dur: 0.34, level: 0.048, spread: 9, type: 'triangle', send: 0.75 },
      { freq: 659.25, at: 0.16, dur: 0.8, level: 0.05, spread: 11, send: 1 },
      { freq: 880, at: 0.17, dur: 0.5, level: 0.008, spread: 14, send: 1, sparkle: true },
      { freq: 164.81, at: 0.16, dur: 0.6, level: 0.036, type: 'triangle', send: 0.25 },
    ],
    tuning: { level: 1, width: 0.6, tail: 0.8, tailSeconds: 2.4, sparkle: 2.5 },
  },
  // Unchanged in character: one low note, quiet, over quickly. The small fall
  // in pitch is there so it reads as a shrug rather than a buzzer. Kept on the
  // close, dry treatment on purpose.
  wrong: {
    notes: [{ freq: 220, at: 0, dur: 0.3, level: 0.066, bendTo: 196, send: 0.25 }],
    tuning: DEFAULT_TUNING,
  },
  // "Ascension", chosen by ear: a fast run up the C scale landing on a high
  // held note, in the biggest room in the app. The level carries the studio's
  // match factor, which is a gain and so belongs here rather than smeared
  // across nine note levels.
  complete: {
    notes: [
      { freq: 523.25, at: 0, dur: 0.14, level: 0.04, spread: 6, send: 0.5 },
      { freq: 587.33, at: 0.07, dur: 0.14, level: 0.04, spread: 6, send: 0.5 },
      { freq: 659.25, at: 0.14, dur: 0.14, level: 0.042, spread: 7, send: 0.6 },
      { freq: 783.99, at: 0.21, dur: 0.14, level: 0.044, spread: 8, send: 0.6 },
      { freq: 880, at: 0.28, dur: 0.14, level: 0.044, spread: 9, send: 0.7 },
      { freq: 987.77, at: 0.35, dur: 0.14, level: 0.046, spread: 10, send: 0.8 },
      { freq: 1046.5, at: 0.42, dur: 1.6, level: 0.055, spread: 14, send: 1 },
      { freq: 2093, at: 0.44, dur: 1.1, level: 0.011, spread: 22, send: 1, sparkle: true },
      { freq: 130.81, at: 0.42, dur: 0.9, level: 0.036, type: 'triangle', send: 0.25 },
    ],
    tuning: { level: 1.07, width: 0.6, tail: 0.85, tailSeconds: 3, sparkle: 1.6 },
  },
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
  /**
   * Impulses already generated, by length. Cues carry different rooms, so
   * without this every switch between them would build a fresh one: at 48kHz
   * a 2.4s stereo impulse is a quarter of a million random samples, on the
   * thread that is trying to play the cue.
   */
  rooms: Map<number, AudioBuffer>;
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
      const next = bus.rooms.get(tuning.tailSeconds) ?? roomImpulse(ctx, tuning.tailSeconds);
      if (next) {
        bus.rooms.set(tuning.tailSeconds, next);
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

  const rooms = new Map<number, AudioBuffer>();
  if (impulse) rooms.set(tuning.tailSeconds, impulse);
  bus = { ctx, master, tail, room, roomSeconds: tuning.tailSeconds, rooms };
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

  // In, then a long exponential out. A bell decays, a beep stops. The attack
  // is a strike by default and a swell when a cue asks for one, and is capped
  // below the note's length so a slow swell cannot outlive its own note.
  const attack = Math.min(note.attack ?? 0.012, note.dur * 0.6);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + attack);
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
  playNotes(CUES[kind].notes, enabled, CUES[kind].tuning);
}

/** Test seam: drop the cached context and bus so a stubbed one is picked up. */
export function resetAudioForTests(): void {
  context = null;
  bus = null;
}
