# 04, Data schemas

Content is authored as TypeScript data modules (typed literals, checked by the compiler, no JSON schema tooling needed). Progress is persisted to `localStorage` as JSON. These shapes are the contract; extend cautiously and never repurpose existing fields.

## Content types

```ts
type TrackId = 't1' | 't2' | 't3' | 't4' | 't5' | 't6';
type Difficulty = 1 | 2 | 3;

interface Track {
  id: TrackId;
  title: string; // "Big-O & optimization talk"
  icon: IconName; // key into the drawn icon set
  tagline: string; // one line shown on the track card
  lessons: Lesson[];
}

interface Lesson {
  id: string; // "t1-l1"
  title: string; // "Seeing growth"
  exerciseIds: string[]; // ordered, 3–5 per lesson, ids from the manifest
}

// ---- exercises ----

interface ExerciseBase {
  id: string; // manifest id, e.g. "t2-03". STABLE, progress keys off it
  trackId: TrackId;
  type: 'mcq' | 'parsons' | 'spot-bug' | 'blank' | 'complexity' | 'ladder' | 'match' | 'steps';
  difficulty: Difficulty;
  conceptId: string; // linked concept card (the "?" chip target)
  prompt: string; // may contain **bold** (tiny markdown subset: bold + inline code)
  code?: CodeBlock; // optional snippet shown under the prompt
  explanation: string; // 2–4 sentences, plain words; shown on miss and via "Why?"
}

interface CodeBlock {
  lang: 'js' | 'ts';
  source: string;
}

interface McqExercise extends ExerciseBase {
  type: 'mcq' | 'ladder'; // ladder reuses mcq mechanics; options are "moves"
  options: McqOption[]; // 2–4, exactly one correct
}
interface McqOption {
  text: string;
  correct?: true;
  whyWrong?: string;
}

interface ComplexityExercise extends ExerciseBase {
  type: 'complexity';
  answer: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n·m)' | 'O(2ⁿ)';
  optionSet?: ComplexityExercise['answer'][]; // defaults to the standard five; override to add O(n·m)/O(2ⁿ)
  sayIt: string; // MANDATORY: "It grows linearly. Double the input, double the work."
}

interface ParsonsExercise extends ExerciseBase {
  type: 'parsons';
  lines: ParsonsLine[]; // authored in CORRECT order; renderer shuffles
}
interface ParsonsLine {
  code: string;
  indent: 0 | 1 | 2 | 3;
  distractor?: true;
}

interface SpotBugExercise extends ExerciseBase {
  type: 'spot-bug'; // `code` is required for this type
  buggyLineIndex: number; // 0-based into code.source lines
  lineHints?: Record<number, string>; // shown when a specific wrong line is tapped
}

interface BlankExercise extends ExerciseBase {
  type: 'blank';
  template: string; // code with `____` gap markers, in order
  gaps: string[]; // correct token per gap, in order
  bank: string[]; // full word bank incl. correct tokens + distractors
}

interface MatchExercise extends ExerciseBase {
  type: 'match';
  pairs: { left: string; right: string }[]; // 3–5; left = phrase, right = term
}

interface StepsExercise extends ExerciseBase {
  type: 'steps';
  steps: string[]; // authored in correct order; renderer shuffles
}

type Exercise =
  | McqExercise
  | ComplexityExercise
  | ParsonsExercise
  | SpotBugExercise
  | BlankExercise
  | MatchExercise
  | StepsExercise;
```

## Concept card types

```ts
interface ConceptCard {
  id: string; // e.g. "closure". Matches Exercise.conceptId
  title: string; // "Closure"
  icon: IconName; // key into the drawn icon set
  trackIds: TrackId[]; // for grouping in the Sheets tab
  plainWords: string; // 1–2 sentences, zero jargon
  analogy: string; // 2–3 sentences, one concrete everyday image
  interviewerSays: string[]; // riddle phrases, searchable
  example?: CodeBlock; // ≤ 8 lines
  exampleCaption?: string;
  sayThis: string[]; // 1–2 canonical out-loud sentences
  related: string[]; // other card ids
}
```

Content module layout (see architecture doc for paths): one file per track exporting its `Track` + `Exercise[]`, one file for all concept cards, and an `index.ts` that assembles and **validates at build/dev time**: every `conceptId` and `related` id resolves; every manifest id present exactly once; every `mcq` has exactly one `correct`; `spot-bug` index in range; complexity `sayIt` non-empty. Validation failures throw at startup in dev. Content bugs must be loud.

## Progress & persistence

Single `localStorage` key `interview-reps:v1` holding one JSON document. Read once at startup into the store; write (debounced ~500ms) on every mutation. Include `schemaVersion` and run tiny forward migrations on load if it ever bumps.

```ts
interface Persisted {
  schemaVersion: 1;
  xp: { lifetime: number; byDay: Record<string, number> }; // day = "2026-08-26" local
  streak: { current: number; best: number; lastActiveDay: string; freezes: number };
  exercises: Record<string, ExerciseProgress>; // keyed by exercise id
  conceptCardsOpened: string[]; // for "concept of the day" rotation
  settings: { sound: boolean; haptics: boolean; reduceMotion: boolean };
  session?: SessionSnapshot; // in-flight session for resume-after-close (optional nicety)
}

interface ExerciseProgress {
  box: 0 | 1 | 2 | 3 | 4 | 5; // Leitner box; mastered = box >= 4
  dueDay: string; // next review day, local "YYYY-MM-DD"
  seen: number; // total presentations
  lapses: number; // total misses (stats only)
  lastResult: 'right' | 'wrong' | 'unsure' | null;
}
```

Derived (never persisted): track mastery %, due-review list, daily-session composition, card "known" state. Compute from the store on demand.

## Randomization rule

Shuffles (mcq option order, parsons/steps order, match layout) derive from a per-presentation random seed, never persisted, never authored. The correct answer must not be positionally learnable.
