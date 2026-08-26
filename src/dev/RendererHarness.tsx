import { useState } from 'react';
import { ExerciseRenderer } from '../exercises/ExerciseRenderer';
import { getExercise } from '../content';
import type { Exercise } from '../content/types';
import type { Outcome } from '../exercises/ExerciseFrame';

const base = { trackId: 't2', difficulty: 2, conceptId: 'big-o', explanation: 'x' } as const;

/** Real authored exercises for the types Track 1 already covers. */
const REAL = ['t1-10', 't1-14', 't1-18', 't1-09', 't1-02']
  .map((id) => getExercise(id))
  .filter((e): e is Exercise => e !== undefined);

const FIXTURES: Exercise[] = [
  {
    ...base,
    id: 'demo-parsons',
    type: 'parsons',
    prompt: 'Build greedy coin change.',
    lines: [
      { code: 'const out = [];', indent: 0 },
      { code: 'for (const coin of coins) {', indent: 0 },
      { code: 'while (amount >= coin) {', indent: 1 },
      { code: 'amount -= coin;', indent: 2 },
      { code: 'out.push(coin);', indent: 2 },
      { code: '}', indent: 1 },
      { code: '}', indent: 0 },
      { code: 'amount =- coin;', indent: 2, distractor: true },
    ],
  },
  {
    ...base,
    id: 'demo-blank',
    type: 'blank',
    prompt: 'Fill in the frequency counter.',
    template:
      'const counts = words.reduce((acc, w) => {\n  acc[w] = (acc[w] ____ 0) + 1;\n  return acc;\n}, ____);',
    gaps: ['??', '{}'],
    bank: ['??', '{}', '||', '[]'],
  },
  {
    ...base,
    id: 'demo-ladder',
    type: 'ladder',
    prompt: 'It works. What would you improve **first**?',
    code: {
      lang: 'js',
      source: 'function f(d) {\n  if (d > 86400000) return true;\n  return false;\n}',
    },
    options: [
      { text: 'Name the magic number', correct: true },
      { text: 'Add types to the parameter', whyWrong: 'Types are the last rung, not the first.' },
      { text: 'Replace the loop with a Set', whyWrong: 'There is no loop here to replace.' },
    ],
  },
  ...REAL,
];

/** Dev-only harness for driving each renderer without needing its content. */
export function RendererHarness() {
  const [index, setIndex] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const exercise = FIXTURES[index];

  const onResolve = (outcome: Outcome) => {
    setRevealed(true);
    setLog((l) => [...l, `${exercise.id}:${outcome}`]);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FIXTURES.map((f, i) => (
          <button
            key={f.id}
            id={`pick-${f.id}`}
            onClick={() => {
              setIndex(i);
              setRevealed(false);
            }}
            style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8 }}
          >
            {f.type}
          </button>
        ))}
      </div>
      <p style={{ marginBottom: 12 }}>{exercise.prompt}</p>
      {exercise.code && (
        <pre className="code" style={{ marginBottom: 12 }}>
          <code>{exercise.code.source}</code>
        </pre>
      )}
      <ExerciseRenderer
        key={`${exercise.id}-${revealed}`}
        exercise={exercise}
        seed={7}
        revealed={revealed}
        onResolve={onResolve}
      />
      <p id="harness-log" style={{ marginTop: 16, fontSize: 12 }}>
        {log.join(' ')}
      </p>
    </div>
  );
}
