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
