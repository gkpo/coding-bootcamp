import {
  evaluate,
  trace,
  unwiredInstances,
  type Build,
  type CheckSpec,
  type PartKind,
  type Predicate,
} from '../engine/archgraph';

/**
 * A run, planned before a pixel moves (docs/12 part D).
 *
 * The run halts at the first ordinary check that comes back red, because that
 * is the moment the story stops making sense. Checks after it are never
 * reached and keep their empty rings, which is the honest thing to show: the
 * board was not judged on them.
 */
export interface FlowStep {
  checkId: string;
  pass: boolean;
  /** Kinds the dot walks. Empty for a check with nothing to walk. */
  route: PartKind[];
  /** Where the dot stops on a failure, if anything is there to stop on. */
  stopsAt: PartKind | null;
  /**
   * Which instance of that kind takes the failure, by part id.
   *
   * Usually the first one of its kind, because a check that names a kind is
   * happy with any of them. A check about every clone is the exception: the
   * one worth marking is the clone that is missing its connection, not
   * whichever server happens to sit on the left (docs/12 part F1).
   */
  stopsAtPart: number | null;
}

export interface RunPlan {
  steps: FlowStep[];
  /** True when the run stopped early on a red check. */
  halted: boolean;
}

export function planRun(build: Build, checks: CheckSpec[]): RunPlan {
  const results = evaluate(build, checks);
  const steps: FlowStep[] = [];

  for (const check of checks) {
    const pass = results.find((r) => r.id === check.id)?.pass === true;
    const { route, stopsAt } = trace(build, check.when);
    steps.push({
      checkId: check.id,
      pass,
      route,
      stopsAt,
      stopsAtPart: instanceOf(build, check.when, stopsAt),
    });
    // A bonus never halts a run: it is not what the stage is waiting on.
    if (!pass && check.bonus !== true) return { steps, halted: true };
  }
  return { steps, halted: false };
}

/** The part id the board marks when a check stops on a kind. */
function instanceOf(build: Build, predicate: Predicate, stopsAt: PartKind | null): number | null {
  if (stopsAt === null) return null;
  if (predicate.op === 'eachConnected' && stopsAt === predicate.each) {
    const unwired = unwiredInstances(build, predicate.each, predicate.to);
    if (unwired.length > 0) return unwired[0];
  }
  return build.parts.find((part) => part.kind === stopsAt)?.id ?? null;
}

/**
 * What one step costs: the dot's hops, or a flat rest for a check with
 * nothing to walk.
 *
 * The ring fills as the dot arrives rather than after it, so a travelled
 * check costs its hops and nothing more.
 */
export function stepDuration(step: FlowStep, hopMs: number, restMs: number): number {
  return step.route.length > 1 ? (step.route.length - 1) * hopMs : restMs;
}

/** What the whole run is going to cost, in milliseconds. */
export function runDuration(plan: RunPlan, hopMs: number, restMs: number): number {
  return plan.steps.reduce((total, step) => total + stepDuration(step, hopMs, restMs), 0);
}
