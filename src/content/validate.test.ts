import { describe, expect, it } from 'vitest';
import { findContentProblems, type ContentBundle } from './validate';
import type { ConceptCard, Exercise, McqExercise, Track } from './types';

const card = (over: Partial<ConceptCard> = {}): ConceptCard => ({
  id: 'big-o',
  title: 'Big-O',
  icon: 'growth',
  trackIds: ['t1'],
  plainWords: 'How work grows.',
  analogy: 'Flyers and megaphones.',
  interviewerSays: ["what's the complexity?"],
  sayThis: ['It grows linearly.'],
  related: [],
  ...over,
});

const mcq = (over: Partial<McqExercise> = {}): Exercise => ({
  id: 't1-01',
  trackId: 't1',
  type: 'mcq',
  difficulty: 1,
  conceptId: 'big-o',
  prompt: 'Which one?',
  explanation: 'Because.',
  options: [
    { text: 'Right', correct: true },
    { text: 'Wrong', whyWrong: 'Here is why.' },
  ],
  ...over,
});

const track = (exerciseIds: string[]): Track => ({
  id: 't1',
  title: 'Track 1',
  icon: 'growth',
  tagline: 'x',
  lessons: [{ id: 't1-l1', title: 'L1', exerciseIds }],
});

const bundle = (over: Partial<ContentBundle> = {}): ContentBundle => ({
  tracks: [track(['t1-01', 't1-02', 't1-03'])],
  exercises: [mcq(), mcq({ id: 't1-02' }), mcq({ id: 't1-03' })],
  cards: [card()],
  ...over,
});

describe('a well-formed bundle', () => {
  it('reports no problems', () => {
    expect(findContentProblems(bundle())).toEqual([]);
  });
});

describe('cross-references', () => {
  it('catches an exercise pointing at a concept card that does not exist', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [mcq({ conceptId: 'closure' }), mcq({ id: 't1-02' }), mcq({ id: 't1-03' })],
      }),
    );
    expect(problems).toContain('t1-01 links to unknown concept card "closure"');
  });

  it('catches a card relating to a card that does not exist', () => {
    const problems = findContentProblems(bundle({ cards: [card({ related: ['closure'] })] }));
    expect(problems).toContain('Card "big-o" relates to unknown card "closure"');
  });

  it('catches a card relating to itself', () => {
    const problems = findContentProblems(bundle({ cards: [card({ related: ['big-o'] })] }));
    expect(problems).toContain('Card "big-o" lists itself as related');
  });

  it('catches duplicate exercise ids', () => {
    const problems = findContentProblems(
      bundle({ exercises: [mcq(), mcq(), mcq({ id: 't1-02' }), mcq({ id: 't1-03' })] }),
    );
    expect(problems).toContain('Duplicate exercise id "t1-01"');
  });
});

describe('mcq invariants', () => {
  it('catches having no correct option', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          mcq({
            options: [
              { text: 'a', whyWrong: 'x' },
              { text: 'b', whyWrong: 'y' },
            ],
          }),
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 has 0 correct options, expected exactly 1');
  });

  it('catches having two correct options', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          mcq({
            options: [
              { text: 'a', correct: true },
              { text: 'b', correct: true },
            ],
          }),
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 has 2 correct options, expected exactly 1');
  });

  it('catches a wrong option with no misconception feedback', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          mcq({ options: [{ text: 'a', correct: true }, { text: 'lazy' }] }),
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 wrong option "lazy" has no whyWrong');
  });
});

describe('type-specific invariants', () => {
  it('catches a complexity exercise missing its mandatory sayIt', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          {
            id: 't1-01',
            trackId: 't1',
            type: 'complexity',
            difficulty: 1,
            conceptId: 'big-o',
            prompt: 'How does it grow?',
            explanation: 'Because.',
            answer: 'O(n)',
            sayIt: '   ',
          },
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 is missing the mandatory sayIt phrase');
  });

  it('catches a complexity answer missing from its own option set', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          {
            id: 't1-01',
            trackId: 't1',
            type: 'complexity',
            difficulty: 1,
            conceptId: 'big-o',
            prompt: 'How does it grow?',
            explanation: 'Because.',
            answer: 'O(n·m)',
            optionSet: ['O(1)', 'O(n)'],
            sayIt: 'It grows linearly.',
          },
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 answer "O(n·m)" is not in its optionSet');
  });

  it('catches a spot-bug index past the end of its snippet', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          {
            id: 't1-01',
            trackId: 't1',
            type: 'spot-bug',
            difficulty: 1,
            conceptId: 'big-o',
            prompt: 'Tap the bug.',
            explanation: 'Because.',
            code: { lang: 'js', source: 'a();\nb();' },
            buggyLineIndex: 7,
          },
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 buggyLineIndex 7 is outside its 2-line snippet');
  });

  it('catches a blank whose gap count disagrees with its answers', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          {
            id: 't1-01',
            trackId: 't1',
            type: 'blank',
            difficulty: 1,
            conceptId: 'big-o',
            prompt: 'Fill it in.',
            explanation: 'Because.',
            template: 'const x = ____;',
            gaps: ['1', '2'],
            bank: ['1', '2'],
          },
          mcq({ id: 't1-02' }),
          mcq({ id: 't1-03' }),
        ],
      }),
    );
    expect(problems).toContain('t1-01 template has 1 gaps but 2 answers');
  });
});

describe('lesson coverage', () => {
  it('catches an exercise that belongs to no lesson', () => {
    const problems = findContentProblems(bundle({ tracks: [track(['t1-01', 't1-02', 't1-99'])] }));
    expect(problems).toContain('t1-03 belongs to t1 but is in no lesson');
  });

  it('catches a lesson referencing an exercise that does not exist', () => {
    const problems = findContentProblems(bundle({ tracks: [track(['t1-01', 't1-02', 't1-99'])] }));
    expect(problems).toContain('Track t1 lesson references unknown exercise "t1-99"');
  });

  it('catches the same exercise appearing in two lessons', () => {
    const problems = findContentProblems(
      bundle({
        tracks: [
          {
            id: 't1',
            title: 'T',
            icon: 'growth',
            tagline: 'x',
            lessons: [
              { id: 't1-l1', title: 'A', exerciseIds: ['t1-01', 't1-02', 't1-03'] },
              { id: 't1-l2', title: 'B', exerciseIds: ['t1-01', 't1-02', 't1-03'] },
            ],
          },
        ],
      }),
    );
    expect(problems).toContain('Track t1 lists the same exercise in more than one lesson');
  });
});

describe('prompt variants', () => {
  it('accepts an exercise with alternate phrasings', () => {
    const exercises = [
      mcq({ promptVariants: ['Which of these?', 'Pick the one that fits.'] }),
      mcq({ id: 't1-02' }),
      mcq({ id: 't1-03' }),
    ];
    expect(findContentProblems(bundle({ exercises }))).toEqual([]);
  });

  it('rejects a blank variant', () => {
    const exercises = [mcq({ promptVariants: ['  '] }), mcq({ id: 't1-02' }), mcq({ id: 't1-03' })];
    expect(findContentProblems(bundle({ exercises }))).toContain(
      't1-01 has a blank prompt variant',
    );
  });

  it('rejects an empty variant list, which is a leftover rather than a choice', () => {
    const exercises = [mcq({ promptVariants: [] }), mcq({ id: 't1-02' }), mcq({ id: 't1-03' })];
    expect(findContentProblems(bundle({ exercises }))).toContain(
      't1-01 has an empty promptVariants list, drop the field instead',
    );
  });
});
