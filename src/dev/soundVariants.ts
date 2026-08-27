/**
 * Candidate success cues for the sound studio.
 *
 * Temporary: this exists so the cue can be chosen by ear on a real phone
 * rather than argued about in a diff. Once one wins, it moves into
 * `VOICES.right` in `src/engine/feedback.ts` and this file goes away.
 *
 * Equal temperament, A4 = 440. Every candidate is built from the same note
 * grammar as the shipped cue, so the studio's sliders drive all of them.
 */

import { VOICES, type Note } from '../engine/feedback';

export interface Variant {
  id: string;
  name: string;
  /** One line, in the terms someone listening would use. */
  blurb: string;
  notes: Note[];
}

const A3 = 220;
const A4 = 440;
const CS5 = 554.37;
const E5 = 659.25;
const A5 = 880;
const CS6 = 1108.73;
const E6 = 1318.51;
const A6 = 1760;

export const VARIANTS: Variant[] = [
  {
    id: 'shipped',
    name: 'Current',
    blurb: 'What is live now. Rising two notes, wide, with a room behind it.',
    notes: VOICES.right,
  },
  {
    id: 'original',
    name: 'Before',
    blurb: 'The cue as it was: two plain notes, centred, no room. Here to compare against.',
    notes: [
      { freq: E5, at: 0, dur: 0.17, level: 0.06 },
      { freq: A5, at: 0.09, dur: 0.17, level: 0.06 },
    ],
  },
  {
    id: 'bell',
    name: 'Bell',
    blurb: 'One note instead of two, left to ring. The most restrained option.',
    notes: [
      { freq: A5, at: 0, dur: 0.9, level: 0.055, spread: 10, send: 1 },
      { freq: A6, at: 0.01, dur: 0.6, level: 0.014, spread: 18, send: 1, sparkle: true },
      { freq: A3, at: 0, dur: 0.45, level: 0.03, type: 'triangle', send: 0.2 },
    ],
  },
  {
    id: 'lift',
    name: 'Lift',
    blurb: 'Three notes climbing instead of two. The most obviously celebratory.',
    notes: [
      { freq: E5, at: 0, dur: 0.28, level: 0.048, spread: 9, send: 0.6 },
      { freq: A5, at: 0.075, dur: 0.3, level: 0.05, spread: 10, send: 0.8 },
      { freq: CS6, at: 0.15, dur: 0.7, level: 0.05, spread: 13, send: 1 },
      { freq: E6, at: 0.155, dur: 0.55, level: 0.01, spread: 18, send: 1, sparkle: true },
      { freq: A3, at: 0.15, dur: 0.4, level: 0.028, type: 'triangle', send: 0.2 },
    ],
  },
  {
    id: 'warm',
    name: 'Warm',
    blurb: 'Same shape, pitched lower and rounder. Less bright, more wood than glass.',
    notes: [
      { freq: A4, at: 0, dur: 0.32, level: 0.05, spread: 8, type: 'triangle', send: 0.6 },
      { freq: CS5, at: 0.08, dur: 0.34, level: 0.048, spread: 9, type: 'triangle', send: 0.75 },
      { freq: E5, at: 0.16, dur: 0.7, level: 0.05, spread: 11, send: 1 },
      { freq: A5, at: 0.17, dur: 0.45, level: 0.008, spread: 14, send: 1, sparkle: true },
      { freq: A3, at: 0.16, dur: 0.45, level: 0.032, type: 'triangle', send: 0.25 },
    ],
  },
  {
    id: 'chime',
    name: 'Chime',
    blurb: 'A wide leap upward with the longest tail. Airy, closest to a notification.',
    notes: [
      { freq: A5, at: 0, dur: 0.4, level: 0.048, spread: 10, send: 0.7 },
      { freq: E6, at: 0.12, dur: 1, level: 0.045, spread: 16, send: 1 },
      { freq: A6, at: 0.13, dur: 0.8, level: 0.013, spread: 20, send: 1, sparkle: true },
      { freq: A3, at: 0, dur: 0.4, level: 0.022, type: 'triangle', send: 0.2 },
    ],
  },
  {
    id: 'pop',
    name: 'Pop',
    blurb: 'The current notes, faster and drier. Snappy, gets out of the way.',
    notes: [
      { freq: E5, at: 0, dur: 0.16, level: 0.055, spread: 8, send: 0.3 },
      { freq: A5, at: 0.06, dur: 0.28, level: 0.06, spread: 10, send: 0.45 },
      { freq: A6, at: 0.065, dur: 0.2, level: 0.014, spread: 16, send: 0.4, sparkle: true },
      { freq: A3, at: 0.06, dur: 0.2, level: 0.03, type: 'triangle', send: 0.1 },
    ],
  },
];
