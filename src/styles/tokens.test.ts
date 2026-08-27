import { describe, expect, it } from 'vitest';

import TOKENS from './tokens.css?raw';

/* Guards the contrast rule docs/06 binds: "all text/background pairs must pass
 * WCAG AA". That rule was already in the doc when the primary button shipped at
 * 1.97:1 against the page behind it, because nothing checked it. The button's
 * label passed at 7.06:1, so reading the doc's own table was not enough to
 * catch it: the failing pair was the fill against the page, which the table
 * never listed. These cases list the pairs that actually matter, so a future
 * palette edit fails here instead of shipping.
 */

/** Reads one custom property off the `:root` block. */
function token(name: string): string {
  const match = TOKENS.match(new RegExp(`^\\s*--${name}:\\s*(#[0-9a-fA-F]{6});`, 'm'));
  if (!match) throw new Error(`token --${name} not found in tokens.css`);
  return match[1];
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

/** Rounded down, so a pair sitting exactly on the threshold still counts. */
function ratio(a: string, b: string): number {
  return Math.floor(contrast(a, b) * 100) / 100;
}

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe('token contrast', () => {
  describe('text on its background', () => {
    const surfaces = ['bg', 'surface', 'surface-2'] as const;

    it.each(surfaces)('--text reads on --%s', (surface) => {
      expect(ratio(token('text'), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it.each(surfaces)('--text-dim reads on --%s', (surface) => {
      expect(ratio(token('text-dim'), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it.each(surfaces)('--accent-text reads on --%s', (surface) => {
      expect(ratio(token('accent-text'), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it.each(surfaces)('--info reads on --%s', (surface) => {
      expect(ratio(token('info'), token(surface))).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('accent-filled surfaces', () => {
    it('--on-accent reads on an --accent fill', () => {
      expect(ratio(token('on-accent'), token('accent'))).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('--on-accent still reads once the fill is pressed', () => {
      // The pressed state is a real state, not a transient: a finger can rest
      // on a button indefinitely. It gets the same threshold as the rest.
      expect(ratio(token('on-accent'), token('accent-pressed'))).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('the accent as a shape, not as a label', () => {
    // The pair the old palette failed. An accent fill has to be findable
    // against whatever sits behind it, or the control does not read as a
    // control. Buttons and progress fills sit on all three surfaces.
    it.each(['bg', 'surface', 'surface-2'] as const)(
      '--accent is visible against --%s',
      (surface) => {
        expect(ratio(token('accent'), token(surface))).toBeGreaterThanOrEqual(AA_NON_TEXT);
      },
    );

    it('--accent-pressed is visible against --bg', () => {
      expect(ratio(token('accent-pressed'), token('bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });
  });

  describe('semantic colours as borders and glyphs', () => {
    // docs/06: success and danger are only ever borders, tints and small
    // glyphs, which are UI components needing 3:1 rather than 4.5:1.
    it.each(['success', 'danger'] as const)('--%s is visible on --surface-2', (name) => {
      expect(ratio(token(name), token('surface-2'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });
  });

  describe('syntax highlighting', () => {
    const tokens = [
      'tok-keyword',
      'tok-string',
      'tok-number',
      'tok-function',
      'tok-property',
      'tok-comment',
    ] as const;

    // Code blocks sit on --surface-2; concept-card examples sit on --surface.
    it.each(tokens)('--%s reads on both code surfaces', (name) => {
      expect(ratio(token(name), token('surface-2'))).toBeGreaterThanOrEqual(AA_TEXT);
      expect(ratio(token(name), token('surface'))).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('track identity colours', () => {
    const tracks = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'] as const;

    // Used for bar fills and icon glyphs, so they are UI components (3:1),
    // and docs/06 restricts them to 15px+ bold where they carry text.
    it.each(tracks)('--track-%s is visible on --surface', (track) => {
      expect(ratio(token(`track-${track}`), token('surface'))).toBeGreaterThanOrEqual(
        AA_NON_TEXT,
      );
    });
  });

  describe('the decorative gold is kept out of the load-bearing tokens', () => {
    it('--accent-bright is not used where --accent is required', () => {
      // It cannot pass the rules above, which is exactly why docs/06 confines
      // it to decoration. This asserts the reason rather than the value, so
      // the split does not quietly erode into "gold looks nicer here".
      expect(ratio(token('accent-bright'), token('bg'))).toBeLessThan(AA_NON_TEXT);
    });

    it('is referenced only by the summary bloom', () => {
      // Every stylesheet in the app, read at build time by Vite rather than
      // off disk, so this runs the same way in CI as it does locally.
      const sheets = import.meta.glob('../**/*.css', {
        query: '?raw',
        import: 'default',
        eager: true,
      }) as Record<string, string>;

      const uses = Object.entries(sheets)
        .filter(([, css]) => css.includes('var(--accent-bright)'))
        .map(([path]) => path.split('/').pop())
        .sort();

      expect(uses).toEqual(['SessionSummaryScreen.css']);
    });
  });
});
