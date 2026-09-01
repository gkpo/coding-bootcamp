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

/**
 * Cues include the button tap, which is not an answer outcome: it never
 * vibrates and never reports anything, it just marks a press.
 */
export type CueName = FeedbackKind | 'tap';

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
export const CUES: Record<CueName, Cue> = {
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
  // "Sigh", chosen by ear: two notes stepping down, the most human of the
  // options and, at these settings, the wettest cue in the app. Width and
  // sparkle are recorded as picked but do nothing here, since none of these
  // notes are spread or flagged as sparkle; the room is what shapes it.
  wrong: {
    notes: [
      { freq: 329.63, at: 0, dur: 0.16, level: 0.0635, type: 'triangle', send: 0.3 },
      { freq: 261.63, at: 0.1, dur: 0.34, level: 0.0635, type: 'triangle', send: 0.4 },
    ],
    tuning: { level: 1, width: 0.36, tail: 1.4, tailSeconds: 3, sparkle: 3.4 },
  },
  // "Tick", chosen by ear. This is the one cue heard on every press, so it is
  // 35ms long and peaks around a third of a miss. Close and nearly dry: a tap
  // with a room on it stops sounding like a button and starts sounding like an
  // event.
  tap: {
    notes: [{ freq: 2400, at: 0, dur: 0.035, level: 0.02 }],
    tuning: { level: 1, width: 0.15, tail: 0.08, tailSeconds: 0.5, sparkle: 1 },
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

/**
 * Climbs played live, one note per step as the screen confirms it.
 *
 * Built rather than listed in `CUES` because their length is the board's or
 * the check strip's, not a constant: the run itself paces the climb, so a
 * stage with five checks earns a longer run-up than a stage with two. Both
 * climbs walk a major pentatonic, which has no wrong intervals, so any slice
 * of one resolves cleanly onto the note it hands over to. The capstone climb
 * resolves onto its own held landing, below; the match board's resolves onto
 * the shipped correct-answer cue.
 */

/** C4 up to A5 in C major pentatonic. The landing note, C6, sits above it. */
const LADDER = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];
const LANDING = 1046.5;

// A big wet room, deliberately: the climb is the correct answer's cue grown up,
// and it wants to ring rather than beep. 3 seconds is the length the miss and
// the session fanfare already generate, so this still costs no new impulse
// response. The landing shares the treatment, so the whole clear, every rung
// and the note it resolves onto, sits in the one bigger room.
const CLEARED_TUNING: Tuning = { level: 1, width: 0.6, tail: 1, tailSeconds: 3, sparkle: 1.6 };

/**
 * One rung of a climb: the note its step lands on, plus the octave above it.
 *
 * The ladder is walked from the top down, so a climb always ends on the same
 * note however many steps it has and the note it resolves onto arrives the
 * same way every time; a longer run starts lower down the ladder rather than
 * reaching higher, and a step past the ladder repeats the top note rather than
 * descending. Everything that moves across the climb, level, width and how
 * much room the note is sent to, is interpolated on how far up it is, so the
 * run opens up as it rises.
 */
function rungCue(ladder: number[], ring: number, rings: number, tuning: Tuning): Cue {
  const count = Math.min(Math.max(rings, 1), ladder.length);
  const climb = ladder.slice(ladder.length - count);
  const idx = Math.min(Math.max(ring, 0), count - 1);
  const t = count === 1 ? 1 : idx / (count - 1);

  return {
    notes: [
      {
        freq: climb[idx],
        at: 0,
        dur: 0.45,
        level: 0.048 + 0.006 * t,
        spread: Math.round(9 + 5 * t),
        send: 0.7 + 0.3 * t,
      },
      // The octave on top, quiet enough to be heard as brightness rather than
      // as a second note. This is most of what separates a chime from a beep.
      {
        freq: climb[idx] * 2,
        at: 0.01,
        dur: 0.3,
        level: 0.009,
        spread: Math.round(16 + 6 * t),
        send: 1,
        sparkle: true,
      },
    ],
    tuning,
  };
}

/** One rung of the capstone climb, played as its ring turns green. */
export function climbNote(ring: number, rings: number): Cue {
  return rungCue(LADDER, ring, rings, CLEARED_TUNING);
}

/** E4 up to E5 in A major pentatonic. The correct-answer cue's held E5 tops it. */
const MATCH_LADDER = [329.63, 369.99, 440, 493.88, 554.37, 659.25];

/** The pentatonic continued below the ladder: B3, C#4, then the ladder itself. */
const MATCH_ROLL_LADDER = [246.94, 277.18, ...MATCH_LADDER];

// Seconds between the notes of the roll. Two steps at this spacing put the rung
// itself 80ms after the tap: fast enough that the three notes read as one
// gesture rather than a melody, and still inside what a thumb reads as
// immediate.
const ROLL_STEP = 0.04;

// The room the `right` cue already carries, borrowed whole: the board's rungs
// and the cue that ends it ring in the same space, and no second impulse
// response is generated for the sake of a climb four notes long.
const MATCH_TUNING: Tuning = { level: 1, width: 0.6, tail: 0.8, tailSeconds: 2.4, sparkle: 2.5 };

/**
 * One rung of the match board's climb, played as a pair locks.
 *
 * A finished board ends on the same correct-answer cue as every other exercise
 * type rather than on the capstone's landing, so this climb is pitched to hand
 * over to that cue instead: the ladder is A major pentatonic and ends on the
 * dominant, E5, which is the very note the cue's held peak plays. The cue
 * arrives already holding the note the climb ended on, resolves it into the
 * tonic chord underneath, and rings its sparkle octave above the whole climb.
 * The climb lives up where the correct cue's own melody does because phone
 * speakers roll off steeply below about 400Hz; a first pass an octave down was
 * barely audible on a phone.
 *
 * The rung is played as a roll rather than as one note: two grace tones come up
 * the same pentatonic into it, like a flick across harp strings, so a lock has
 * movement of its own. The rung is still the note the climb is heard on, the
 * loudest and widest of the three and the one carrying the sparkle octave, and
 * the graces sit under it in both level and stereo, so the whole thing reads as
 * one strummed gesture arriving on the rung rather than as three notes.
 */
export function matchRung(pair: number, pairs: number): Cue {
  // The same clamped geometry `rungCue` walks, repeated here only to locate the
  // rung it will pick inside the full ladder, so the graces underneath it are
  // the two tones below that exact note.
  const count = Math.min(Math.max(pairs, 1), MATCH_LADDER.length);
  const idx = Math.min(Math.max(pair, 0), count - 1);
  const rung = MATCH_LADDER.length - count + idx + 2;

  const cue = rungCue(MATCH_LADDER, pair, pairs, MATCH_TUNING);
  const level = cue.notes.filter((n) => !n.sparkle)[0].level;
  // No spread and the default sine on the graces: they stay narrow and centred
  // so the roll blooms outwards into the wide rung.
  const grace1: Note = {
    freq: MATCH_ROLL_LADDER[rung - 2],
    at: 0,
    dur: 0.14,
    level: level * 0.65,
    send: 0.4,
  };
  const grace2: Note = {
    freq: MATCH_ROLL_LADDER[rung - 1],
    at: ROLL_STEP,
    dur: 0.16,
    level: level * 0.85,
    send: 0.55,
  };

  return {
    notes: [grace1, grace2, ...cue.notes.map((n) => ({ ...n, at: n.at + 2 * ROLL_STEP }))],
    tuning: MATCH_TUNING,
  };
}

/**
 * The landing the climb resolves onto: the held note, its bright octave on
 * top, and a root underneath, the same anatomy as the other celebration cues.
 */
export function landingCue(): Cue {
  return {
    notes: [
      { freq: LANDING, at: 0, dur: 1.5, level: 0.055, spread: 14, send: 1 },
      { freq: LANDING * 2, at: 0.02, dur: 1, level: 0.011, spread: 22, send: 1, sparkle: true },
      { freq: 130.81, at: 0, dur: 0.9, level: 0.036, type: 'triangle', send: 0.25 },
    ],
    tuning: CLEARED_TUNING,
  };
}

type AudioCtor = typeof AudioContext;

interface Bus {
  ctx: AudioContext;
  /** Where every voice lands, dry. Fixed gain: see `playVoice`. */
  master: GainNode;
  /**
   * One convolver per room length, built on demand and kept.
   *
   * Per length rather than one shared convolver whose buffer gets swapped,
   * because cues carry different rooms and their tails overlap in normal use:
   * tapping Continue lands well inside the 1.6s the correct cue rings for.
   * Re-pointing a convolver's buffer resets it, which would cut that tail off
   * mid-air. A null value means convolution is unavailable at all.
   */
  rooms: Map<number, ConvolverNode | null>;
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
 * Build the shared output chain once per context.
 *
 * Nothing on it is mutated per cue: level and room amount are folded into each
 * note instead (see `playVoice`), so a cue that is still ringing is never
 * touched by the next one starting.
 */
function getBus(ctx: AudioContext): Bus | null {
  if (bus && bus.ctx === ctx) return bus;
  const master = ctx.createGain();
  master.gain.value = 1;

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

  bus = { ctx, master, rooms: new Map() };
  return bus;
}

/** The convolver for a given room length, generated once and then kept. */
function roomFor(b: Bus, seconds: number): ConvolverNode | null {
  const known = b.rooms.get(seconds);
  if (known !== undefined) return known;
  const { ctx } = b;
  let room: ConvolverNode | null = null;
  const impulse = typeof ctx.createConvolver === 'function' ? roomImpulse(ctx, seconds) : null;
  if (impulse) {
    room = ctx.createConvolver();
    room.buffer = impulse;
    room.connect(b.master);
  }
  b.rooms.set(seconds, room);
  return room;
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

  // Level is applied here rather than on the shared master, so starting a cue
  // cannot change the loudness of one still ringing. Never zero: an
  // exponential ramp cannot reach or leave silence, so the floor has to stay
  // above it even when a slider is pulled all the way down.
  const peak = Math.max(0.00011, note.level * (note.sparkle ? tuning.sparkle : 1) * tuning.level);

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

  const room = note.send ? roomFor(b, tuning.tailSeconds) : null;
  if (room && note.send) {
    const send = ctx.createGain();
    // The room amount rides on the note's own send for the same reason as the
    // level above: a shared wet gain would be one more thing the next cue
    // could move underneath this one.
    send.gain.value = note.send * tuning.tail;
    node.connect(send);
    send.connect(room);
  }

  osc.connect(gain);
  osc.start(start);
  osc.stop(start + note.dur + 0.05);
}

/**
 * How far ahead of the clock a cue is scheduled, in seconds.
 *
 * Web Audio automation clamped to the past does not run: a cue scheduled at
 * exactly `currentTime` has already slipped behind by the time the graph is
 * built and connected, so it loses its attack, and on the shortest cues its
 * whole envelope. That played taps at random loudness and sometimes not at
 * all. 30ms is below anything a thumb can feel and above a render quantum at
 * every sample rate that ships.
 */
const SCHEDULE_LEAD = 0.03;

/**
 * Play an arbitrary cue. `playTone` is this with the shipped notes and the
 * shipped tuning; the sound studio is this with everything else.
 */
export function playNotes(notes: Note[], enabled: boolean, tuning?: Partial<Tuning>): void {
  if (!enabled) return;
  const ctx = audioContext();
  if (!ctx) return;
  const t = { ...DEFAULT_TUNING, ...tuning };

  const schedule = () => {
    try {
      const b = getBus(ctx);
      if (!b) return;
      // Read the clock once, so every note in the cue is placed against the
      // same instant rather than drifting as the graph is built.
      const t0 = ctx.currentTime + SCHEDULE_LEAD;
      notes.forEach((note) => {
        const start = t0 + note.at;
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
  };

  try {
    // A cue scheduled while the context is still waking comes out with its
    // head cut off, so anything but a running context is played after the
    // resume settles. Phones suspend the context aggressively, and the test is
    // `!== 'running'` on purpose: iOS also reports a non-standard
    // 'interrupted' state. `Promise.resolve` is there because old WebKit's
    // `resume` returns undefined rather than a promise, and the rejection
    // handler drops the cue where autoplay policy refuses to resume at all,
    // which is what the old code effectively did.
    if (ctx.state === 'running') schedule();
    else Promise.resolve(ctx.resume()).then(schedule, () => {});
  } catch {
    // A `resume` that throws outright rather than rejecting. Never fatal.
  }
}

export function playTone(kind: CueName, enabled: boolean): void {
  playNotes(CUES[kind].notes, enabled, CUES[kind].tuning);
}

/** Test seam: drop the cached context and bus so a stubbed one is picked up. */
export function resetAudioForTests(): void {
  context = null;
  bus = null;
}
