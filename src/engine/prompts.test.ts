import { describe, expect, it } from 'vitest';
import { promptChoices, promptFor } from './prompts';

const plain = { prompt: 'Name the pattern.' };
const varied = {
  prompt: 'Name the pattern.',
  promptVariants: ['Which pattern is this?', 'What shape is this problem?'],
};

describe('prompt variants', () => {
  it('leaves an exercise with no variants alone', () => {
    expect(promptChoices(plain)).toEqual(['Name the pattern.']);
    for (let seed = 0; seed < 50; seed++) {
      expect(promptFor(plain, seed)).toBe('Name the pattern.');
    }
  });

  it('counts the authored prompt as one of the phrasings', () => {
    expect(promptChoices(varied)).toEqual([
      'Name the pattern.',
      'Which pattern is this?',
      'What shape is this problem?',
    ]);
  });

  it('picks the same phrasing for the same seed', () => {
    expect(promptFor(varied, 7)).toBe(promptFor(varied, 7));
  });

  it('shows different phrasings across presentations', () => {
    const seen = new Set(Array.from({ length: 60 }, (_, seed) => promptFor(varied, seed)));
    expect(seen.size).toBe(3);
  });

  it('only ever returns a phrasing the exercise authored', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(promptChoices(varied)).toContain(promptFor(varied, seed));
    }
  });
});
