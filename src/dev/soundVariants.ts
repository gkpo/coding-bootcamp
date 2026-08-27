/**
 * Candidate cues for the sound studio.
 *
 * Temporary: this exists so cues can be chosen by ear on a real phone rather
 * than argued about in a diff. Once one wins it moves into `CUES` in
 * `src/engine/feedback.ts`, and when both families are settled this file goes
 * away.
 *
 * Equal temperament, A4 = 440. Every candidate is built from the same note
 * grammar as the shipped cues, so the studio's sliders drive all of them.
 */

import { CUES, DEFAULT_TUNING, type Note, type Tuning } from '../engine/feedback';

export interface Variant {
  id: string;
  name: string;
  /** One line, in the terms someone listening would use. */
  blurb: string;
  notes: Note[];
}

export interface Family {
  id: string;
  label: string;
  /** What the sliders start at for this family. */
  tuning: Tuning;
  variants: Variant[];
}

const A3 = 220;
const A4 = 440;
const CS5 = 554.37;
const E5 = 659.25;
const A5 = 880;
const CS6 = 1108.73;
const E6 = 1318.51;
const A6 = 1760;

const C3 = 130.81;
const G3 = 196;
const C4 = 261.63;
const E4 = 329.63;
const G4 = 392;
const C5 = 523.25;
const E5C = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6C = 1318.51;
const G6 = 1567.98;

/** The success cue, settled. Kept here so it can still be compared against. */
const RIGHT: Variant[] = [
  {
    id: 'warm-low',
    name: 'Warm, lower (chosen)',
    blurb: 'What plays now. Pitched low, rounded off, heavy underneath, wide and wet.',
    notes: CUES.right.notes,
  },
  {
    id: 'warm',
    name: 'Warm, higher bass',
    blurb: 'The same cue with its bottom note an octave up. Lighter underneath.',
    notes: [
      { freq: A4, at: 0, dur: 0.32, level: 0.05, spread: 8, type: 'triangle', send: 0.6 },
      { freq: CS5, at: 0.08, dur: 0.34, level: 0.048, spread: 9, type: 'triangle', send: 0.75 },
      { freq: E5, at: 0.16, dur: 0.7, level: 0.05, spread: 11, send: 1 },
      { freq: A5, at: 0.17, dur: 0.45, level: 0.008, spread: 14, send: 1, sparkle: true },
      { freq: A3, at: 0.16, dur: 0.45, level: 0.032, type: 'triangle', send: 0.25 },
    ],
  },
  {
    id: 'original',
    name: 'Before',
    blurb: 'The cue as it shipped originally: two plain notes, centred, no room.',
    notes: [
      { freq: E5, at: 0, dur: 0.17, level: 0.06 },
      { freq: A5, at: 0.09, dur: 0.17, level: 0.06 },
    ],
  },
  {
    id: 'bell',
    name: 'Bell',
    blurb: 'One note left to ring. The most restrained option.',
    notes: [
      { freq: A5, at: 0, dur: 0.9, level: 0.055, spread: 10, send: 1 },
      { freq: A6, at: 0.01, dur: 0.6, level: 0.014, spread: 18, send: 1, sparkle: true },
      { freq: A3, at: 0, dur: 0.45, level: 0.03, type: 'triangle', send: 0.2 },
    ],
  },
  {
    id: 'lift',
    name: 'Lift',
    blurb: 'Three notes climbing. The brightest of the rises.',
    notes: [
      { freq: E5, at: 0, dur: 0.28, level: 0.048, spread: 9, send: 0.6 },
      { freq: A5, at: 0.075, dur: 0.3, level: 0.05, spread: 10, send: 0.8 },
      { freq: CS6, at: 0.15, dur: 0.7, level: 0.05, spread: 13, send: 1 },
      { freq: E6, at: 0.155, dur: 0.55, level: 0.01, spread: 18, send: 1, sparkle: true },
      { freq: A3, at: 0.15, dur: 0.4, level: 0.028, type: 'triangle', send: 0.2 },
    ],
  },
];

/**
 * Level-matching. Measured through an offline render, the six new candidates
 * peaked between 0.067 and 0.158, and in a straight comparison the loudest one
 * wins for the wrong reason. These factors bring them together so the choice
 * is about character. "Current" is deliberately left alone: it is the
 * reference for what actually plays today.
 */
const matched = (gain: number, notes: Note[]): Note[] =>
  notes.map((n) => ({ ...n, level: n.level * gain }));

/**
 * Session complete. The brief here is glory, so these are longer, fuller and
 * built out of whole chords rather than single notes: the arrival is the
 * point. All of them resolve to C so they can be compared like for like.
 */
const COMPLETE: Variant[] = [
  {
    id: 'ascension',
    name: 'Ascension (chosen)',
    blurb: 'What plays now. A fast run up the scale onto a high held note.',
    notes: CUES.complete.notes,
  },
  {
    id: 'previous',
    name: 'Before',
    blurb: 'The cue this replaced: four notes up a C chord, in a smaller room.',
    notes: matched(1.3, [
      { freq: C5, at: 0, dur: 0.3, level: 0.042, spread: 8, send: 0.6 },
      { freq: E5C, at: 0.09, dur: 0.34, level: 0.042, spread: 8, send: 0.7 },
      { freq: G5, at: 0.18, dur: 0.4, level: 0.044, spread: 10, send: 0.85 },
      { freq: C6, at: 0.27, dur: 0.9, level: 0.05, spread: 14, send: 1 },
      { freq: C3, at: 0.27, dur: 0.5, level: 0.03, type: 'triangle', send: 0.2 },
    ]),
  },
  {
    id: 'fanfare',
    name: 'Fanfare',
    blurb: 'Three short notes and a long one. The rhythm does the work.',
    notes: matched(0.85, [
      { freq: G4, at: 0, dur: 0.16, level: 0.045, spread: 7, send: 0.4 },
      { freq: C5, at: 0.11, dur: 0.16, level: 0.048, spread: 8, send: 0.4 },
      { freq: E5C, at: 0.22, dur: 0.18, level: 0.05, spread: 9, send: 0.5 },
      { freq: G5, at: 0.34, dur: 1.5, level: 0.055, spread: 12, send: 1 },
      { freq: C6, at: 0.34, dur: 1.4, level: 0.038, spread: 14, send: 1 },
      { freq: G6, at: 0.36, dur: 1, level: 0.012, spread: 20, send: 1, sparkle: true },
      { freq: C3, at: 0.34, dur: 0.9, level: 0.038, type: 'triangle', send: 0.25 },
    ]),
  },
  {
    id: 'bloom',
    name: 'Bloom',
    blurb: 'The whole chord at once, then it opens upward. Least busy, most size.',
    notes: matched(1.08, [
      { freq: C4, at: 0, dur: 1.6, level: 0.036, spread: 8, attack: 0.05, send: 0.8 },
      { freq: E4, at: 0, dur: 1.6, level: 0.032, spread: 10, attack: 0.07, send: 0.8 },
      { freq: G4, at: 0, dur: 1.7, level: 0.032, spread: 12, attack: 0.09, send: 0.9 },
      { freq: C5, at: 0.22, dur: 1.6, level: 0.042, spread: 12, attack: 0.06, send: 1 },
      { freq: E5C, at: 0.34, dur: 1.5, level: 0.03, spread: 14, attack: 0.06, send: 1 },
      { freq: C6, at: 0.46, dur: 1.4, level: 0.016, spread: 18, send: 1, sparkle: true },
      { freq: C3, at: 0, dur: 1.2, level: 0.04, type: 'triangle', attack: 0.04, send: 0.3 },
    ]),
  },
  {
    id: 'choir',
    name: 'Choir',
    blurb: 'Swells in rather than strikes, then resolves. Slowest and grandest.',
    notes: matched(1.01, [
      { freq: G3, at: 0, dur: 1.9, level: 0.034, spread: 10, attack: 0.35, send: 0.9 },
      { freq: C4, at: 0.05, dur: 1.9, level: 0.036, spread: 12, attack: 0.35, send: 0.9 },
      { freq: G4, at: 0.1, dur: 1.8, level: 0.03, spread: 14, attack: 0.4, send: 1 },
      { freq: C5, at: 0.45, dur: 1.6, level: 0.042, spread: 14, attack: 0.12, send: 1 },
      { freq: E5C, at: 0.55, dur: 1.5, level: 0.034, spread: 16, attack: 0.14, send: 1 },
      {
        freq: C6,
        at: 0.65,
        dur: 1.3,
        level: 0.014,
        spread: 20,
        attack: 0.1,
        send: 1,
        sparkle: true,
      },
      { freq: C3, at: 0, dur: 1.6, level: 0.038, type: 'triangle', attack: 0.3, send: 0.3 },
    ]),
  },
  {
    id: 'triumph',
    name: 'Triumph',
    blurb: 'Fanfare rhythm over a held chord underneath. The loudest idea here.',
    notes: matched(0.67, [
      { freq: C4, at: 0, dur: 1.8, level: 0.03, spread: 10, attack: 0.06, send: 0.7 },
      { freq: G4, at: 0, dur: 1.8, level: 0.026, spread: 12, attack: 0.08, send: 0.7 },
      { freq: C5, at: 0, dur: 0.2, level: 0.05, spread: 8, send: 0.5 },
      { freq: C5, at: 0.15, dur: 0.2, level: 0.05, spread: 8, send: 0.5 },
      { freq: E5C, at: 0.3, dur: 0.22, level: 0.05, spread: 9, send: 0.6 },
      { freq: G5, at: 0.45, dur: 1.5, level: 0.058, spread: 13, send: 1 },
      { freq: C6, at: 0.45, dur: 1.4, level: 0.04, spread: 15, send: 1 },
      { freq: E6C, at: 0.47, dur: 1.1, level: 0.013, spread: 20, send: 1, sparkle: true },
      { freq: C3, at: 0.45, dur: 1, level: 0.04, type: 'triangle', send: 0.25 },
    ]),
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    blurb: 'One long note that swells and blooms into the chord above it.',
    notes: matched(1.57, [
      { freq: C4, at: 0, dur: 2.2, level: 0.042, spread: 8, attack: 0.5, send: 1 },
      { freq: C5, at: 0.3, dur: 1.9, level: 0.036, spread: 12, attack: 0.4, send: 1 },
      { freq: G5, at: 0.6, dur: 1.6, level: 0.03, spread: 16, attack: 0.3, send: 1 },
      {
        freq: C6,
        at: 0.9,
        dur: 1.3,
        level: 0.02,
        spread: 20,
        attack: 0.25,
        send: 1,
        sparkle: true,
      },
      {
        freq: E6C,
        at: 1.05,
        dur: 1.1,
        level: 0.012,
        spread: 24,
        attack: 0.2,
        send: 1,
        sparkle: true,
      },
      { freq: C3, at: 0, dur: 1.8, level: 0.04, type: 'triangle', attack: 0.45, send: 0.35 },
    ]),
  },
];

/**
 * Button taps. The brief is subtlety, because unlike the answer cues this one
 * is heard on every press: a tap that is charming the first time is a tell the
 * hundredth. So all of these are short, quiet and close, an order of magnitude
 * below the answer cues in level. They are meant to be felt more than heard.
 */
const TAP: Variant[] = [
  {
    id: 'none',
    name: 'Silence',
    blurb: 'No tap at all. Worth hearing against the rest before adding one.',
    notes: [],
  },
  {
    id: 'tick',
    name: 'Tick (chosen)',
    blurb: 'What every button plays now. A tiny high blip, closest to a system click.',
    notes: CUES.tap.notes,
  },
  {
    id: 'key',
    name: 'Key',
    blurb: 'Mid, with a small drop in pitch. Like a good keyboard.',
    notes: [{ freq: 800, at: 0, dur: 0.045, level: 0.028, bendTo: 690 }],
  },
  {
    id: 'thock',
    name: 'Thock',
    blurb: 'Low and soft, no top end at all. The least intrusive of these.',
    notes: [{ freq: 150, at: 0, dur: 0.07, level: 0.038, type: 'triangle', bendTo: 120 }],
  },
  {
    id: 'pebble',
    name: 'Pebble',
    blurb: 'Wooden, with the smallest hint of brightness over it.',
    notes: [
      { freq: 520, at: 0, dur: 0.05, level: 0.03, type: 'triangle' },
      { freq: 1560, at: 0, dur: 0.03, level: 0.006, sparkle: true },
    ],
  },
  {
    id: 'glass',
    name: 'Glass',
    blurb: 'High and delicate, with a touch of ring. The prettiest, and the riskiest.',
    notes: [
      { freq: 1760, at: 0, dur: 0.09, level: 0.014, spread: 12, send: 0.5 },
      { freq: 2640, at: 0, dur: 0.06, level: 0.005, spread: 18, send: 0.5, sparkle: true },
    ],
  },
  {
    id: 'soft',
    name: 'Soft',
    blurb: 'Barely there. Rounded, no attack to speak of, almost subliminal.',
    notes: [{ freq: 300, at: 0, dur: 0.11, level: 0.024, type: 'triangle', attack: 0.02 }],
  },
];

/**
 * The miss. It has to land without punishing: the app tells you the answer was
 * wrong in words a moment later, so the sound only has to mark the moment.
 * None of these are buzzers, and all stay close and dry.
 *
 * Level matched to the current cue, with one deliberate exception: "Muted" is
 * left quieter, because being quieter is the whole of what it is proposing.
 */
const WRONG: Variant[] = [
  {
    id: 'sigh',
    name: 'Sigh (chosen)',
    blurb: 'What plays now. Two notes stepping down, in the wettest room in the app.',
    notes: CUES.wrong.notes,
  },
  {
    id: 'previous',
    name: 'Before',
    blurb: 'The miss this replaced: one low note with a small fall in pitch.',
    notes: [{ freq: 220, at: 0, dur: 0.3, level: 0.066, bendTo: 196, send: 0.25 }],
  },
  {
    id: 'thud',
    name: 'Thud',
    blurb: 'Lower and blunter, no fall. Reads as a full stop rather than a no.',
    notes: matched(0.92, [
      { freq: 164.81, at: 0, dur: 0.22, level: 0.07, type: 'triangle', send: 0.2 },
    ]),
  },
  {
    id: 'muted',
    name: 'Muted',
    blurb: 'A soft drop of a tone, quieter than the rest. Nearly a shrug.',
    notes: [
      { freq: 293.66, at: 0, dur: 0.26, level: 0.045, type: 'triangle', bendTo: 246.94, send: 0.3 },
    ],
  },
  {
    id: 'knock',
    name: 'Knock',
    blurb: 'Two quick low taps. Says try again without saying wrong.',
    notes: matched(1.26, [
      { freq: 196, at: 0, dur: 0.09, level: 0.055, type: 'triangle', send: 0.15 },
      { freq: 196, at: 0.1, dur: 0.12, level: 0.05, type: 'triangle', send: 0.2 },
    ]),
  },
  {
    id: 'neutral',
    name: 'Neutral',
    blurb: 'One flat note that does not fall at all. The least judgemental option.',
    notes: matched(1.16, [{ freq: 233.08, at: 0, dur: 0.18, level: 0.055, send: 0.2 }]),
  },
];

/**
 * Every family is settled: each list leads with the cue the app actually
 * plays, and the alternatives stay listed so any of them can be revisited
 * against what it would sit beside.
 */
export const FAMILIES: Family[] = [
  {
    id: 'tap',
    label: 'Button tap (chosen)',
    // Close and almost dry. A tap with a room on it stops sounding like a
    // button and starts sounding like an event.
    tuning: { ...DEFAULT_TUNING, level: 1, width: 0.15, tail: 0.08, tailSeconds: 0.5, sparkle: 1 },
    variants: TAP,
  },
  {
    id: 'wrong',
    label: 'Wrong answer (chosen)',
    tuning: CUES.wrong.tuning,
    variants: WRONG,
  },
  {
    id: 'right',
    label: 'Correct answer (chosen)',
    tuning: CUES.right.tuning,
    variants: RIGHT,
  },
  {
    id: 'complete',
    label: 'Session complete (chosen)',
    tuning: CUES.complete.tuning,
    variants: COMPLETE,
  },
];
