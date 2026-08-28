import { describe, expect, it } from 'vitest';
import { findContentProblems, type ContentBundle } from './validate';
import type {
  Capstone,
  CapstoneCheck,
  ConceptCard,
  Exercise,
  McqExercise,
  ParsonsLine,
  Track,
} from './types';

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

describe('parsons swap groups', () => {
  const parsons = (lines: ParsonsLine[]): Exercise => ({
    id: 't1-01',
    trackId: 't1',
    type: 'parsons',
    difficulty: 1,
    conceptId: 'big-o',
    prompt: 'Put the lines in order.',
    explanation: 'Because.',
    lines,
  });

  const withParsons = (lines: ParsonsLine[]) =>
    findContentProblems(
      bundle({ exercises: [parsons(lines), mcq({ id: 't1-02' }), mcq({ id: 't1-03' })] }),
    );

  it('accepts two neighbouring lines marked interchangeable', () => {
    expect(
      withParsons([
        { code: 'const seen = new Set();', indent: 0, swapGroup: 'decls' },
        { code: 'const out = [];', indent: 0, swapGroup: 'decls' },
        { code: 'return out;', indent: 0 },
      ]),
    ).toEqual([]);
  });

  it('catches a group of one, which swaps with nothing', () => {
    const problems = withParsons([
      { code: 'const out = [];', indent: 0, swapGroup: 'decls' },
      { code: 'out.push(1);', indent: 0 },
      { code: 'return out;', indent: 0 },
    ]);
    expect(problems).toContain('t1-01 swapGroup "decls" has 1 line, expected at least 2');
  });

  it('catches a distractor in a group, which would grade a wrong line right', () => {
    const problems = withParsons([
      { code: 'const out = [];', indent: 0, swapGroup: 'decls' },
      { code: 'out.push(1);', indent: 0 },
      { code: 'return out;', indent: 0 },
      { code: 'const out = {};', indent: 0, distractor: true, swapGroup: 'decls' },
    ]);
    expect(problems).toContain(
      't1-01 swapGroup "decls" includes the distractor line "const out = {};"',
    );
  });

  it('catches members with a line between them, which is not a swap of neighbours', () => {
    const problems = withParsons([
      { code: 'const out = [];', indent: 0, swapGroup: 'decls' },
      { code: 'out.push(1);', indent: 0 },
      { code: 'const seen = new Set();', indent: 0, swapGroup: 'decls' },
      { code: 'return out;', indent: 0 },
    ]);
    expect(problems).toContain(
      't1-01 swapGroup "decls" lines are not next to each other in the solution',
    );
  });

  it('catches members at different indents, which cannot be the same slot', () => {
    const problems = withParsons([
      { code: 'if (ok) {', indent: 0 },
      { code: 'const out = [];', indent: 1, swapGroup: 'decls' },
      { code: 'const seen = new Set();', indent: 2, swapGroup: 'decls' },
      { code: '}', indent: 0 },
    ]);
    expect(problems).toContain('t1-01 swapGroup "decls" mixes indent levels, expected one');
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

const check = (over: Partial<CapstoneCheck> = {}): CapstoneCheck => ({
  id: 'k1',
  label: 'The app reaches an API',
  when: { op: 'path', from: 'client', to: 'server' },
  hintNudge: 'What is the phone supposed to be talking to?',
  hintPoint: { highlight: ['server'], text: 'The compute lane is empty.' },
  hintMoves: [{ place: 'server' }, { connect: ['client', 'server'] }],
  ...over,
});

const capstone = (over: Partial<Capstone> = {}): Capstone => ({
  id: 'c1-01',
  trackId: 't1',
  title: 'A small system',
  scenario: 'Build me something.',
  difficulty: 2,
  icon: 'blocks',
  conceptIds: ['big-o'],
  stages: [
    {
      requirement: 'Get the basics working.',
      prePlaced: ['client'],
      tray: [
        { kind: 'server', count: 1 },
        { kind: 'db', count: 1 },
      ],
      checks: [
        check(),
        check({
          id: 'k2',
          label: 'Records sit behind the API',
          when: { op: 'pathVia', from: 'client', to: 'db', via: 'server' },
          hintNudge: 'Who checks that this person is allowed to read it?',
          hintPoint: { highlight: ['db'], text: 'The database belongs behind the server.' },
          hintMoves: [{ place: 'db' }, { connect: ['server', 'db'] }],
        }),
      ],
      clearLine: 'That is the shape of it.',
      debrief: 'The API sits in the middle so one place decides who may read what.',
    },
    {
      requirement: 'Now take ten times the traffic.',
      tray: [{ kind: 'cache', count: 1 }],
      checks: [
        check({
          id: 'k3',
          label: 'Hot reads come from memory',
          when: { op: 'edge', a: 'server', b: 'cache' },
          hintNudge: 'Does the database need to answer the same question twice?',
          hintPoint: { highlight: ['cache'], text: 'Nothing is holding the popular answers.' },
          hintMoves: [{ place: 'cache' }, { connect: ['server', 'cache'] }],
        }),
        check({
          id: 'k4',
          label: 'More than one server',
          when: { op: 'placed', kind: 'server' },
          hintNudge: 'How many machines is that?',
          hintPoint: { highlight: ['server'], text: 'The compute lane has room.' },
          hintMoves: [],
        }),
      ],
      clearLine: 'That is the standard answer.',
      debrief: 'The cache answers the popular reads, so the database sees far fewer of them.',
    },
  ],
  ...over,
});

describe('capstones (docs/12)', () => {
  const withCapstone = (over: Partial<Capstone> = {}) =>
    findContentProblems(bundle({ capstones: [capstone(over)] }));

  it('accepts a well-formed one', () => {
    expect(withCapstone()).toEqual([]);
  });

  it('catches a link to a concept card that does not exist', () => {
    expect(withCapstone({ conceptIds: ['caching'] })).toContain(
      'c1-01 links to unknown concept card "caching"',
    );
  });

  it('catches a capstone on a track that does not exist', () => {
    expect(withCapstone({ trackId: 't7' })).toContain('c1-01 belongs to unknown track "t7"');
  });

  it('catches a one-stage capstone. A capstone that never grows is an exercise', () => {
    const one = capstone();
    one.stages = [one.stages[0]];
    expect(findContentProblems(bundle({ capstones: [one] }))).toContain(
      'c1-01 has 1 stages, expected 2–3',
    );
  });

  it('catches a stage with a single check', () => {
    const thin = capstone();
    thin.stages[1].checks = [thin.stages[1].checks[0]];
    expect(findContentProblems(bundle({ capstones: [thin] })).join('\n')).toContain(
      'has 1 ordinary checks, expected 2–4',
    );
  });

  it('catches a label too long to sit in a check row', () => {
    const wordy = capstone();
    wordy.stages[0].checks[0].label = 'The application on the phone can reach an API server';
    expect(findContentProblems(bundle({ capstones: [wordy] })).join('\n')).toContain(
      'has a 10-word label, expected 8 or fewer',
    );
  });

  it('catches a level-1 hint that answers instead of asking', () => {
    const told = capstone();
    told.stages[0].checks[0].hintNudge = 'Place a server and wire the client to it.';
    expect(findContentProblems(bundle({ capstones: [told] })).join('\n')).toContain(
      'has a level-1 hint that is not a question',
    );
  });

  it('catches a level-2 hint pointing at a part no tray offers', () => {
    const lost = capstone();
    lost.stages[0].checks[0].hintPoint = { highlight: ['cdn'], text: 'Look over here.' };
    expect(findContentProblems(bundle({ capstones: [lost] })).join('\n')).toContain(
      'highlights cdn, which is in no tray by this stage',
    );
  });

  it('lets a budget check point at nothing in particular', () => {
    const budgeted = capstone();
    budgeted.stages[1].checks[1] = check({
      id: 'k4',
      label: 'Four parts, nothing spare',
      when: { op: 'maxParts', n: 4 },
      hintNudge: 'Is anything up there doing nothing?',
      hintPoint: { highlight: [], text: 'Something on the board is not earning its place.' },
      hintMoves: [],
    });
    expect(findContentProblems(bundle({ capstones: [budgeted] }))).toEqual([]);
  });

  it('catches a stage with nothing to say once it is cleared', () => {
    const silent = capstone();
    silent.stages[1].debrief = '   ';
    expect(findContentProblems(bundle({ capstones: [silent] })).join('\n')).toContain(
      'c1-01 stage 2 has no debrief',
    );
  });

  it('catches two checks sharing an id, which would collide in the strip', () => {
    const clashing = capstone();
    clashing.stages[1].checks[0].id = 'k1';
    expect(findContentProblems(bundle({ capstones: [clashing] })).join('\n')).toContain(
      'Duplicate check id "k1" in c1-01',
    );
  });

  it('runs the engine solvability check too, so a broken hint cannot ship', () => {
    const unsolvable = capstone();
    unsolvable.stages[0].checks[1].hintMoves = [{ place: 'db' }];
    expect(findContentProblems(bundle({ capstones: [unsolvable] })).join('\n')).toContain(
      'c1-01 check "k2" is red after stage 1',
    );
  });
});

describe('a prompt naming code the user cannot see', () => {
  it('catches an exercise leaning on a function it never shows', () => {
    const problems = findContentProblems(
      bundle({ exercises: [mcq({ prompt: 'Should `addItem` mutate the array it was given?' })] }),
    );
    expect(problems.join('\n')).toContain(
      't1-01 prompt names `addItem`, which the exercise never shows',
    );
  });

  it('accepts the name once the snippet is on screen', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          mcq({
            prompt: 'Should `addItem` mutate the array it was given?',
            code: { lang: 'js', source: 'addItem(cart, item);' },
          }),
        ],
      }),
    );
    expect(problems.join('\n')).not.toContain('prompt names');
  });

  it('accepts a name an option puts on screen', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          mcq({
            prompt: 'Which one does `getCity` need?',
            options: [
              { text: 'A guard clause in `getCity`', correct: true },
              { text: 'Nothing', whyWrong: 'Here is why.' },
            ],
          }),
        ],
      }),
    );
    expect(problems.join('\n')).not.toContain('prompt names');
  });

  it('does not count whyWrong, which the user only sees after answering', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [
          mcq({
            prompt: 'What should `addItem` do?',
            options: [
              { text: 'Return a new array', correct: true },
              { text: 'Mutate', whyWrong: 'The caller sees `addItem(cart, x)`, not the docblock.' },
            ],
          }),
        ],
      }),
    );
    expect(problems.join('\n')).toContain('prompt names `addItem`');
  });

  it('leaves language and framework names alone', () => {
    const problems = findContentProblems(
      bundle({
        exercises: [mcq({ prompt: 'Where does `useMemo` earn its place over `indexOf`?' })],
      }),
    );
    expect(problems.join('\n')).not.toContain('prompt names');
  });

  it('checks prompt variants too, since any of them can be the one shown', () => {
    const problems = findContentProblems(
      bundle({ exercises: [mcq({ promptVariants: ['What does `parseCart` return?'] })] }),
    );
    expect(problems.join('\n')).toContain('prompt names `parseCart`');
  });
});
