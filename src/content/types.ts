import type { IconName } from '../components/iconNames';
import type { CapstoneSpec, CheckSpec, PartKind, StageSpec } from '../engine/archgraph';
/**
 * Content shapes: the contract from docs/04-DATA-SCHEMAS.md.
 *
 * Content is authored as typed TypeScript literals so the compiler catches
 * mistakes before the validator has to; see content/index.ts for the runtime
 * checks that the type system can't express (id uniqueness, cross-references).
 */

export type TrackId = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7' | 't8' | 't9';
export type Difficulty = 1 | 2 | 3;

export type ExerciseType =
  'mcq' | 'parsons' | 'spot-bug' | 'blank' | 'complexity' | 'ladder' | 'match' | 'steps';

export interface Track {
  id: TrackId;
  title: string;
  icon: IconName;
  tagline: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  exerciseIds: string[];
}

export interface CodeBlock {
  lang: 'js' | 'ts';
  source: string;
}

export interface ExerciseBase {
  /** Manifest id, e.g. "t1-03". STABLE, progress keys off it. */
  id: string;
  trackId: TrackId;
  type: ExerciseType;
  difficulty: Difficulty;
  /** Linked concept card. The target of the concept chip. */
  conceptId: string;
  /** Supports a tiny markdown subset: **bold** and `inline code`. */
  prompt: string;
  /**
   * Alternate phrasings of the same question: same answer, same options, same
   * code. The renderer picks one per presentation (docs/10 part B), so an item
   * cannot be recognised by its wording alone. For problem statements and
   * riddles only; mechanics drills repeat on purpose.
   */
  promptVariants?: string[];
  code?: CodeBlock;
  /** 2–4 sentences, plain words. Shown on a miss and behind "Why?". */
  explanation: string;
}

export interface McqOption {
  text: string;
  correct?: true;
  /** Shown when this specific wrong option is picked. Target the misconception. */
  whyWrong?: string;
}

/** `ladder` reuses mcq mechanics; its options are *moves*, not code. */
export interface McqExercise extends ExerciseBase {
  type: 'mcq' | 'ladder';
  options: McqOption[];
}

export type ComplexityAnswer =
  'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n·m)' | 'O(2ⁿ)';

/** The five that appear by default, in growth order, so they become reflex. */
export const STANDARD_COMPLEXITY_OPTIONS: ComplexityAnswer[] = [
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
];

export interface ComplexityExercise extends ExerciseBase {
  type: 'complexity';
  answer: ComplexityAnswer;
  /** Defaults to the standard five; override to bring in O(n·m) or O(2ⁿ). */
  optionSet?: ComplexityAnswer[];
  /** MANDATORY: the sentence to say out loud in the interview. */
  sayIt: string;
}

export interface ParsonsLine {
  code: string;
  indent: 0 | 1 | 2 | 3;
  distractor?: true;
  /**
   * Lines sharing a swapGroup are interchangeable with each other: any
   * permutation of the group among its own positions grades correct. Only for
   * lines where the JS is genuinely identical either way (independent
   * declarations, order-free assignments). Members must be contiguous in the
   * authored solution, share an indent, and never be distractors.
   */
  swapGroup?: string;
}

export interface ParsonsExercise extends ExerciseBase {
  type: 'parsons';
  /** Authored in CORRECT order; the renderer shuffles per presentation. */
  lines: ParsonsLine[];
}

export interface SpotBugExercise extends ExerciseBase {
  type: 'spot-bug';
  code: CodeBlock;
  /** 0-based index into code.source lines. */
  buggyLineIndex: number;
  lineHints?: Record<number, string>;
}

export interface BlankExercise extends ExerciseBase {
  type: 'blank';
  /** Code carrying `____` gap markers, in order. */
  template: string;
  gaps: string[];
  /** Correct tokens plus distractors. */
  bank: string[];
}

export interface MatchExercise extends ExerciseBase {
  type: 'match';
  /** 3–5 pairs; left = interviewer phrase, right = term. */
  pairs: { left: string; right: string }[];
}

export interface StepsExercise extends ExerciseBase {
  type: 'steps';
  /** Authored in correct order; the renderer shuffles. */
  steps: string[];
}

export type Exercise =
  | McqExercise
  | ComplexityExercise
  | ParsonsExercise
  | SpotBugExercise
  | BlankExercise
  | MatchExercise
  | StepsExercise;

export interface ConceptCard {
  /** Matches Exercise.conceptId, e.g. "closure". */
  id: string;
  title: string;
  icon: IconName;
  trackIds: TrackId[];
  /** 1–2 sentences, zero jargon. */
  plainWords: string;
  /** 2–3 sentences, one concrete everyday image. */
  analogy: string;
  /** The riddle phrases an interviewer actually uses, searchable. */
  interviewerSays: string[];
  example?: CodeBlock;
  exampleCaption?: string;
  /** 1–2 canonical sentences to say out loud. */
  sayThis: string[];
  related: string[];
}

/**
 * Build-mode capstones (docs/12 part B). A capstone is not an Exercise: it has
 * its own frame, its own progress and its own entry point, so it gets its own
 * collection rather than an eighth exercise type.
 *
 * The graph half of each shape (the predicate, the moves, the tray) lives in
 * engine/archgraph.ts, which knows how to grade it. What is added here is the
 * prose an author writes around it.
 */

export interface CapstoneCheck extends CheckSpec {
  /** Plain words, at most 8, shown in the check row. */
  label: string;
  /** Level 1: a question, never the answer. */
  hintNudge: string;
  /** Level 2: where to look. */
  hintPoint: { highlight: PartKind[]; text: string };
  /** The interviewer-approved sentence, shown once the check passes. */
  sayIt?: string;
}

export interface CapstoneStage extends StageSpec {
  /** The interviewer's ask for this stage, 1-2 sentences. */
  requirement: string;
  checks: CapstoneCheck[];
  /** Shown on stage clear, interviewer voice. */
  clearLine: string;
  /**
   * The reference build explained: why this shape is the usual answer and
   * what each part of it buys, in 1-3 plain sentences. Read only after the
   * stage has been cleared (docs/12 part F2).
   */
  debrief: string;
}

export interface Capstone extends CapstoneSpec {
  /** "c5-01", stable, progress keys off it. */
  id: string;
  trackId: TrackId;
  title: string;
  /** 2-3 sentences of setup, interviewer voice. */
  scenario: string;
  /** How hard the build is, on the same 1-3 scale exercises use (docs/12 part H). */
  difficulty: Difficulty;
  icon: IconName;
  /** Cards linked from the summary. */
  conceptIds: string[];
  stages: CapstoneStage[];
}
