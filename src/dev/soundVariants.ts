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
  id: 'right' | 'complete';
  label: string;
  /** What the sliders start at for this family. */
  tuning: Tuning;
  variants: Variant[];
}

const A3 = 220;
const E3 = 164.81;
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
const D5 = 587.33;
const E5C = 659.25;
const G5 = 783.99;
const A5C = 880;
const B5 = 987.77;
const C6 = 1046.5;
const E6C = 1318.51;
const G6 = 1567.98;
const C7 = 2093;

/** The success cue, settled. Kept here so it can still be compared against. */
const RIGHT: Variant[] = [
  {
    id: 'warm',
    name: 'Warm (chosen)',
    blurb: 'The one you picked. Pitched low, rounded off, wide and wet.',
    notes: CUES.right.notes,
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
  {
    id: 'warm-low',
    name: 'Warm, lower',
    blurb: 'The chosen cue dropped an octave at the bottom. Heavier underneath.',
    notes: [
      { freq: A4, at: 0, dur: 0.32, level: 0.05, spread: 8, type: 'triangle', send: 0.6 },
      { freq: CS5, at: 0.08, dur: 0.34, level: 0.048, spread: 9, type: 'triangle', send: 0.75 },
      { freq: E5, at: 0.16, dur: 0.8, level: 0.05, spread: 11, send: 1 },
      { freq: A5, at: 0.17, dur: 0.5, level: 0.008, spread: 14, send: 1, sparkle: true },
      { freq: E3, at: 0.16, dur: 0.6, level: 0.036, type: 'triangle', send: 0.25 },
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
    id: 'current',
    name: 'Current',
    blurb: 'What plays now. Four notes up a C chord. Here to compare against.',
    notes: CUES.complete.notes,
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
    id: 'ascension',
    name: 'Ascension',
    blurb: 'A fast run up the scale landing on a high held note. The most motion.',
    notes: matched(1.07, [
      { freq: C5, at: 0, dur: 0.14, level: 0.04, spread: 6, send: 0.5 },
      { freq: D5, at: 0.07, dur: 0.14, level: 0.04, spread: 6, send: 0.5 },
      { freq: E5C, at: 0.14, dur: 0.14, level: 0.042, spread: 7, send: 0.6 },
      { freq: G5, at: 0.21, dur: 0.14, level: 0.044, spread: 8, send: 0.6 },
      { freq: A5C, at: 0.28, dur: 0.14, level: 0.044, spread: 9, send: 0.7 },
      { freq: B5, at: 0.35, dur: 0.14, level: 0.046, spread: 10, send: 0.8 },
      { freq: C6, at: 0.42, dur: 1.6, level: 0.055, spread: 14, send: 1 },
      { freq: C7, at: 0.44, dur: 1.1, level: 0.011, spread: 22, send: 1, sparkle: true },
      { freq: C3, at: 0.42, dur: 0.9, level: 0.036, type: 'triangle', send: 0.25 },
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

export const FAMILIES: Family[] = [
  {
    id: 'right',
    label: 'Correct answer',
    tuning: CUES.right.tuning,
    variants: RIGHT,
  },
  {
    id: 'complete',
    label: 'Session complete',
    // Starts wetter and longer than the app default: the brief is glory, and
    // these want more room than a per-answer cue does.
    tuning: { ...DEFAULT_TUNING, level: 1, width: 0.6, tail: 0.85, tailSeconds: 3, sparkle: 1.6 },
    variants: COMPLETE,
  },
];
