import { describe, expect, it } from 'vitest';
import { muscleLabelFor, muscleLabels } from './muscleLabels';
import { exercises } from '../content';
import type { Exercise } from '../content/types';

const mcq = (over: Partial<Exercise> = {}): Exercise =>
  ({
    id: 't1-01',
    trackId: 't1',
    type: 'mcq',
    difficulty: 1,
    conceptId: 'big-o',
    prompt: 'Which one?',
    explanation: 'Because.',
    options: [{ text: 'Right', correct: true }],
    ...over,
  }) as Exercise;

describe('the kicker above a question', () => {
  it('says read and judge when there is a snippet to read', () => {
    expect(muscleLabelFor(mcq({ code: { lang: 'js', source: 'a();' } }))).toBe('Read and judge');
  });

  it('does not tell the user to read when nothing is on screen', () => {
    expect(muscleLabelFor(mcq())).toBe('Make the call');
  });

  it('leaves the other mechanics on their type', () => {
    const steps = mcq({ type: 'steps', steps: ['a', 'b', 'c', 'd'] });
    expect(muscleLabelFor(steps)).toBe(muscleLabels.steps);
  });

  it('names no concept, which would hand over the answer', () => {
    const conceptWords = new Set(['closure', 'window', 'memo', 'pointer', 'index', 'cache']);
    for (const label of Object.values(muscleLabels)) {
      for (const word of label.toLowerCase().split(/\W+/)) {
        expect(conceptWords.has(word)).toBe(false);
      }
    }
  });

  it('gives every authored exercise a label', () => {
    for (const exercise of exercises) {
      expect(muscleLabelFor(exercise)).toBeTruthy();
    }
  });
});
