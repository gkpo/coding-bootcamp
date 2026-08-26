import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from '../components/iconNames';
import { cards, tracks } from './index';

/**
 * Emoji are a stated no: they read as decoration rather than design, and they
 * render differently on every platform. Icons are drawn instead.
 */

// Pictographs, dingbats and the emoji variation selector. Deliberately excludes
// the middot and arrows: those are technical notation, not decoration.
// The variation selector sits outside the class: it is a combining mark, and
// ESLint rightly refuses one inside a character class.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\u{FE0F}/u;

// Vite's raw glob rather than node:fs, so the test needs no node types and
// runs through the same toolchain as the app.
const SOURCES = import.meta.glob('../**/*.{ts,tsx,css}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

describe('no emoji anywhere', () => {
  it('has none in any source file', () => {
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      if (file.includes('noEmoji')) continue; // this file names the characters
      text.split('\n').forEach((line, i) => {
        if (EMOJI.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 60)}`);
      });
    }
    expect(offenders.length, offenders.join('\n')).toBe(0);
  });

  it('actually scans the source tree', () => {
    // Guards against the glob silently matching nothing, which would make the
    // check above pass forever regardless of what is in the code.
    const files = Object.keys(SOURCES);
    expect(files.length).toBeGreaterThan(40);
    expect(files.some((f) => f.includes('screens/HomeScreen'))).toBe(true);
    // Same-directory matches come back as './concepts.ts', not '../content/...'.
    expect(files.some((f) => f.endsWith('concepts.ts'))).toBe(true);
  });

  it('catches one if it creeps back', () => {
    expect(EMOJI.test('a rocket 🚀 here')).toBe(true);
    expect(EMOJI.test('plain ascii text')).toBe(false);
  });

  it('leaves real typography alone', () => {
    // Middot, accents and arrows are notation, not decoration.
    expect(EMOJI.test('~6 min · 8 exercises')).toBe(false);
    expect(EMOJI.test('O(n²) café naïve')).toBe(false);
    expect(EMOJI.test('clarify → estimate → sketch')).toBe(false);
  });
});

describe('icons', () => {
  it('gives every card and track a known icon', () => {
    for (const card of cards) expect(ICON_NAMES, card.id).toContain(card.icon);
    for (const track of tracks) expect(ICON_NAMES, track.id).toContain(track.icon);
  });

  it('draws every icon it declares', () => {
    // Record<IconName, ReactNode> enforces this at compile time; this asserts
    // the list itself has no duplicates that would hide a missing drawing.
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
  });

  it('reuses the vocabulary rather than inventing one glyph per card', () => {
    const used = new Set(cards.map((c) => c.icon));
    expect(used.size).toBeLessThan(cards.length);
    expect(used.size).toBeGreaterThan(10);
  });
});
