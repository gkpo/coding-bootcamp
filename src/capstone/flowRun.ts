import { evaluate, trace, type Build, type CheckSpec, type PartKind } from '../engine/archgraph';

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
  /** Kinds the packets walk. Empty for a check with nothing to walk. */
  route: PartKind[];
  /** Where the packets stop on a failure, if anything is there to stop on. */
  stopsAt: PartKind | null;
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
    steps.push({ checkId: check.id, pass, route, stopsAt });
    // A bonus never halts a run: it is not what the stage is waiting on.
    if (!pass && check.bonus !== true) return { steps, halted: true };
  }
  return { steps, halted: false };
}
