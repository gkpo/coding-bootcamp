import { describe, expect, it } from 'vitest';
import { complexityOptions, correctOptionIndex, gradeComplexity, gradeMcq } from './grading';
import { getExercise } from '../content';
import type { ComplexityExercise, McqExercise } from '../content/types';

const mcq = getExercise('t1-09') as McqExercise;
const complexity = getExercise('t1-02') as ComplexityExercise;
const wideOptions = getExercise('t1-06') as ComplexityExercise;

describe('gradeMcq', () => {
  it('accepts the correct option', () => {
    expect(gradeMcq(mcq, correctOptionIndex(mcq))).toEqual({ correct: true });
  });

  it('rejects a wrong option and returns its misconception feedback', () => {
    const wrongIndex = mcq.options.findIndex((o) => o.correct !== true);
    const result = gradeMcq(mcq, wrongIndex);
    expect(result.correct).toBe(false);
    expect(result.whyWrong).toBe(mcq.options[wrongIndex].whyWrong);
  });

  it('returns feedback specific to the option picked, not a generic message', () => {
    const wrongIndexes = mcq.options
      .map((o, i) => (o.correct === true ? -1 : i))
      .filter((i) => i >= 0);
    const messages = wrongIndexes.map((i) => gradeMcq(mcq, i).whyWrong);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it('throws on an out-of-range selection rather than silently marking it wrong', () => {
    expect(() => gradeMcq(mcq, 99)).toThrow(RangeError);
    expect(() => gradeMcq(mcq, -1)).toThrow(RangeError);
  });

  it('finds exactly one correct option in authored content', () => {
    expect(correctOptionIndex(mcq)).toBeGreaterThanOrEqual(0);
  });
});

describe('gradeComplexity', () => {
  it('accepts the authored answer', () => {
    expect(gradeComplexity(complexity, 'O(n)')).toEqual({ correct: true });
  });

  it('rejects a different notation', () => {
    expect(gradeComplexity(complexity, 'O(n²)').correct).toBe(false);
  });

  it('rejects a near-miss string rather than being lenient', () => {
    // Grading is exact: "O(N)" and "O(n) " are not the answer.
    expect(gradeComplexity(complexity, 'O(N)').correct).toBe(false);
    expect(gradeComplexity(complexity, 'O(n) ').correct).toBe(false);
  });
});

describe('complexityOptions', () => {
  it('defaults to the standard five so the answers become reflex', () => {
    expect(complexityOptions(complexity)).toEqual([
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n log n)',
      'O(n²)',
    ]);
  });

  it('uses the authored option set when one widens the choices', () => {
    expect(complexityOptions(wideOptions)).toContain('O(n·m)');
  });

  it('always contains the answer', () => {
    expect(complexityOptions(wideOptions)).toContain(wideOptions.answer);
    expect(complexityOptions(complexity)).toContain(complexity.answer);
  });
});

// ---------------------------------------------------------------------------
// M3 types
// ---------------------------------------------------------------------------

import {
  blankGapCount,
  gradeBlank,
  gradeMatch,
  gradeParsons,
  gradeSpotBug,
  gradeSteps,
  isMatchingPair,
  parsonsSolution,
} from './grading';
import type {
  BlankExercise,
  MatchExercise,
  ParsonsExercise,
  SpotBugExercise,
  StepsExercise,
} from '../content/types';

const base = { trackId: 't1', difficulty: 1, conceptId: 'big-o', explanation: 'x' } as const;

const parsons: ParsonsExercise = {
  ...base,
  id: 'p',
  type: 'parsons',
  prompt: 'Build it',
  lines: [
    { code: 'const out = [];', indent: 0 },
    { code: 'for (const x of xs) {', indent: 0 },
    { code: 'out.push(x);', indent: 1 },
    { code: '}', indent: 0 },
    { code: 'out.push[x];', indent: 1, distractor: true },
  ],
};

const steps: StepsExercise = {
  ...base,
  id: 's',
  type: 'steps',
  prompt: 'Order it',
  steps: ['first', 'second', 'third', 'fourth'],
};

const spotBug: SpotBugExercise = {
  ...base,
  id: 'sb',
  type: 'spot-bug',
  prompt: 'Tap it',
  code: { lang: 'js', source: 'a();\nb();\nc();' },
  buggyLineIndex: 1,
  lineHints: { 0: 'this line is fine', 2: 'returning is instant' },
};

const blank: BlankExercise = {
  ...base,
  id: 'b',
  type: 'blank',
  prompt: 'Fill it',
  template: 'const n = arr.reduce((a, x) => ____, ____);',
  gaps: ['a + x', '0'],
  bank: ['a + x', '0', 'a - x', '1'],
};

const match: MatchExercise = {
  ...base,
  id: 'm',
  type: 'match',
  prompt: 'Pair them',
  pairs: [
    { left: 'grows linearly', right: 'O(n)' },
    { left: 'halves each step', right: 'O(log n)' },
    { left: 'checks every pair', right: 'O(n²)' },
  ],
};

describe('gradeParsons', () => {
  it('excludes distractors from the canonical solution', () => {
    expect(parsonsSolution(parsons)).toEqual([
      'const out = [];',
      'for (const x of xs) {',
      'out.push(x);',
      '}',
    ]);
  });

  it('accepts the exact authored order', () => {
    expect(gradeParsons(parsons, parsonsSolution(parsons)).correct).toBe(true);
  });

  it('rejects a swapped pair and says which positions are wrong', () => {
    const swapped = ['for (const x of xs) {', 'const out = [];', 'out.push(x);', '}'];
    const result = gradeParsons(parsons, swapped);
    expect(result.correct).toBe(false);
    expect(result.parts).toEqual([false, false, true, true]);
  });

  it('rejects a solution containing a distractor', () => {
    const withDistractor = ['const out = [];', 'for (const x of xs) {', 'out.push[x];', '}'];
    expect(gradeParsons(parsons, withDistractor).correct).toBe(false);
  });

  it('rejects an incomplete solution', () => {
    expect(gradeParsons(parsons, ['const out = [];']).correct).toBe(false);
  });

  it('rejects an empty attempt', () => {
    expect(gradeParsons(parsons, []).correct).toBe(false);
  });
});

describe('gradeSteps', () => {
  it('accepts the authored order', () => {
    expect(gradeSteps(steps, ['first', 'second', 'third', 'fourth']).correct).toBe(true);
  });

  it('rejects a reversed order and marks every position', () => {
    const result = gradeSteps(steps, ['fourth', 'third', 'second', 'first']);
    expect(result.correct).toBe(false);
    expect(result.parts).toEqual([false, false, false, false]);
  });

  it('marks the positions that happen to be right', () => {
    expect(gradeSteps(steps, ['first', 'third', 'second', 'fourth']).parts).toEqual([
      true,
      false,
      false,
      true,
    ]);
  });
});

describe('gradeSpotBug', () => {
  it('accepts the buggy line', () => {
    expect(gradeSpotBug(spotBug, 1)).toEqual({ correct: true });
  });

  it('rejects another line and returns that line’s authored hint', () => {
    expect(gradeSpotBug(spotBug, 0)).toEqual({ correct: false, whyWrong: 'this line is fine' });
    expect(gradeSpotBug(spotBug, 2).whyWrong).toBe('returning is instant');
  });

  it('copes with a line that has no hint', () => {
    const noHints: SpotBugExercise = { ...spotBug, lineHints: undefined };
    expect(gradeSpotBug(noHints, 0)).toEqual({ correct: false, whyWrong: undefined });
  });
});

describe('gradeBlank', () => {
  it('accepts all gaps filled correctly', () => {
    expect(gradeBlank(blank, ['a + x', '0']).correct).toBe(true);
  });

  it('grades each gap independently', () => {
    const result = gradeBlank(blank, ['a + x', '1']);
    expect(result.correct).toBe(false);
    expect(result.parts).toEqual([true, false]);
  });

  it('treats an unfilled gap as wrong rather than throwing', () => {
    expect(gradeBlank(blank, ['a + x', null]).parts).toEqual([true, false]);
    expect(gradeBlank(blank, []).correct).toBe(false);
  });

  it('reports how many gaps there are', () => {
    expect(blankGapCount(blank)).toBe(2);
  });
});

describe('gradeMatch', () => {
  it('recognises a correct pair', () => {
    expect(isMatchingPair(match, 'grows linearly', 'O(n)')).toBe(true);
  });

  it('rejects a crossed pair', () => {
    expect(isMatchingPair(match, 'grows linearly', 'O(log n)')).toBe(false);
  });

  it('is complete only when every pair is found', () => {
    expect(gradeMatch(match, match.pairs).correct).toBe(true);
    expect(gradeMatch(match, match.pairs.slice(0, 2)).correct).toBe(false);
  });

  it('does not accept duplicates standing in for a missing pair', () => {
    const dupes = [match.pairs[0], match.pairs[0], match.pairs[0]];
    expect(gradeMatch(match, dupes).correct).toBe(false);
  });
});
