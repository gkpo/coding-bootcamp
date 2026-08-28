import { describe, expect, it } from 'vitest';

import TOKENS from './tokens.css?raw';
import BUTTON_CSS from '../components/Button.css?raw';

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
/* WCAG treats text at 18.66px bold (14pt) or larger as "large", and large text
   needs 3:1 rather than 4.5:1. The primary button's label is the one place the
   app relies on that, and it is what lets the accent be light enough to look
   friendly rather than heavy. */
const AA_LARGE_TEXT = 3;
const LARGE_TEXT_PX = 18.66;

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
    /** The primary button's label size and weight, read out of Button.css. */
    function buttonLabel(): { px: number; weight: number } {
      const block = BUTTON_CSS.slice(BUTTON_CSS.indexOf('.btn {'));
      const px = block.match(/font-size:\s*([\d.]+)px;/);
      const weight = block.match(/font-weight:\s*(\d+);/);
      if (!px || !weight) throw new Error('could not read .btn font-size/font-weight');
      return { px: Number(px[1]), weight: Number(weight[1]) };
    }

    // The exemption and the thing that earns it are asserted together. Testing
    // only the ratio would let someone shrink the button back to 17px and
    // silently drop the label under its real threshold, with this file still
    // green. That is precisely the failure mode this whole suite exists for:
    // the original bug was a rule nobody checked, not a rule nobody had.
    it('the button label is large enough to earn the 3:1 threshold', () => {
      const { px, weight } = buttonLabel();
      expect(px).toBeGreaterThanOrEqual(LARGE_TEXT_PX);
      expect(weight).toBeGreaterThanOrEqual(700);
    });

    it('--on-accent reads on an --accent fill', () => {
      expect(ratio(token('on-accent'), token('accent'))).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
    });

    it('--on-accent still reads once the fill is pressed', () => {
      // The pressed state is a real state, not a transient: a finger can rest
      // on a button indefinitely. It gets the same threshold as the rest.
      expect(ratio(token('on-accent'), token('accent-pressed'))).toBeGreaterThanOrEqual(
        AA_LARGE_TEXT,
      );
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

  describe('every surface that puts text on an accent fill', () => {
    /* The button label earns a 3:1 threshold by being large and bold. Nothing
       else in the app automatically does, and the two that got missed the first
       time (a 12px review badge and a confirm button with no size at all) were
       both sitting on the light --accent at 3.67:1 against a 4.5 requirement.
       So rather than fix those two by hand and hope, this walks every rule in
       the app that sets `color: var(--on-accent)` and checks the pairing. */
    const sheets = import.meta.glob('../**/*.css', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;

    /** Every `selector { ... }` pair in a stylesheet, comments stripped so a
     *  documented rule's selector still matches its own name. */
    function rules(css: string): { selector: string; block: string }[] {
      return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
        (m) => ({ selector: m[1].trim(), block: m[2] }),
      );
    }

    const size = (block: string) => Number(block.match(/font-size:\s*([\d.]+)px/)?.[1] ?? NaN);
    const weight = (block: string) => Number(block.match(/font-weight:\s*(\d+)/)?.[1] ?? NaN);

    /** Every rule that paints text in --on-accent, with its effective type size.
     *  A BEM modifier (.btn--primary) inherits from its base (.btn), which is
     *  where .btn--primary's own size actually lives. */
    const painted = Object.entries(sheets).flatMap(([path, css]) => {
      const all = rules(css);
      return all
        .filter((r) => /color:\s*var\(--on-accent\)/.test(r.block))
        .map((r) => {
          const base = r.selector.includes('--')
            ? all.find((o) => o.selector === r.selector.split('--')[0])
            : undefined;
          const inherit = (read: (b: string) => number) =>
            Number.isNaN(read(r.block)) && base ? read(base.block) : read(r.block);
          return {
            file: path.split('/').pop() as string,
            selector: r.selector,
            fill: r.block.match(/background:\s*var\(--([a-z-]+)\)/)?.[1] ?? null,
            px: inherit(size),
            weight: inherit(weight),
          };
        });
    });

    it('finds them all', () => {
      // A guard on the guard: if this drops to zero the checks below pass
      // vacuously, which is exactly how the original bug survived.
      expect(painted.length).toBeGreaterThanOrEqual(3);
    });

    it.each(painted)('$selector on --$fill carries its label', (use) => {
      expect(use.fill).not.toBeNull();
      const contrast = ratio(token('on-accent'), token(use.fill as string));

      // Large and bold earns 3:1. Anything else, including a rule that never
      // states its own size, has to clear the full 4.5:1.
      const isLarge = use.px >= LARGE_TEXT_PX && use.weight >= 700;
      expect(contrast).toBeGreaterThanOrEqual(isLarge ? AA_LARGE_TEXT : AA_TEXT);
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

/* A custom property that loses its semicolon does not fail to parse: custom
 * properties accept almost any token sequence, so `--info-bg` quietly ate the
 * line below it and swallowed `--tok-keyword` whole. Both then resolved to
 * nothing wherever they were used, which meant the concept chip lost its tint
 * and code blocks lost their keyword colour, in silence. Nothing above could
 * see it, because `token()` reads the file with a regex rather than the way a
 * browser reads a declaration. These two do.
 */
describe('the tokens actually parse', () => {
  /** Comments are removed before a declaration is read, so remove them here. */
  function stripComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  /** Every custom property the sheet declares, split the way a parser splits. */
  function declared(css: string): string[] {
    return stripComments(css)
      .split(';')
      .map((chunk) => chunk.slice(Math.max(chunk.lastIndexOf('{'), chunk.lastIndexOf('}')) + 1))
      .map((tail) => tail.trim().match(/^(--[\w-]+)\s*:/)?.[1])
      .filter((name): name is string => name !== undefined);
  }

  it('declares one property per statement', () => {
    // A second colon in one statement is the fingerprint of the missing
    // semicolon: the declaration below has been absorbed into this value.
    const malformed = stripComments(TOKENS)
      .split(';')
      .map((chunk) => chunk.slice(Math.max(chunk.lastIndexOf('{'), chunk.lastIndexOf('}')) + 1).trim())
      .filter((tail) => tail.startsWith('--'))
      .filter((tail) => (tail.match(/:/g) ?? []).length !== 1);

    expect(malformed).toEqual([]);
  });

  it('declares every token the stylesheets ask for', () => {
    const sheets = import.meta.glob('../**/*.css', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;

    // Locally scoped properties count as declared: --btn-drop lives on .btn.
    const names = new Set(Object.values(sheets).flatMap(declared));

    const missing = new Set<string>();
    for (const css of Object.values(sheets)) {
      for (const [, name] of stripComments(css).matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!names.has(name)) missing.add(name);
      }
    }

    expect([...missing].sort()).toEqual([]);
  });
});
