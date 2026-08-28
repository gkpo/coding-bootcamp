import { describe, expect, it } from 'vitest';
import { planRun, runDuration } from './flowRun';
import { emptyBuild, place, runMoves, toggleEdge, type Build } from '../engine/archgraph';
import { capstones } from '../content';
import type { CapstoneCheck } from '../content/types';

const photo = capstones[0];
const checksThrough = (stageIndex: number): CapstoneCheck[] =>
  photo.stages.slice(0, stageIndex + 1).flatMap((s) => s.checks);

function buildOf(kinds: Parameters<typeof place>[1][], links: [number, number][] = []): Build {
  let build = emptyBuild();
  for (const kind of kinds) build = place(build, kind) as Build;
  for (const [a, b] of links) build = toggleEdge(build, a, b);
  return build;
}

describe('planRun', () => {
  it('plans one step per check when the board is right', () => {
    const finished = runMoves(photo).stageBuilds[2];
    const plan = planRun(finished, checksThrough(2));
    expect(plan.halted).toBe(false);
    expect(plan.steps).toHaveLength(checksThrough(2).length);
    expect(plan.steps.every((s) => s.pass)).toBe(true);
  });

  it('halts at the first red check, leaving the rest unreached', () => {
    // Stage 1 with the API wired but nothing behind it: the second check is
    // the first thing that cannot be true.
    const build = buildOf(['client', 'server'], [[1, 2]]);
    const plan = planRun(build, checksThrough(0));
    expect(plan.halted).toBe(true);
    expect(plan.steps.map((s) => s.checkId)).toEqual(['s1-api', 's1-data']);
    expect(plan.steps.map((s) => s.pass)).toEqual([true, false]);
  });

  it('gives the halting step somewhere for the dot to stop', () => {
    const build = buildOf(['client', 'server'], [[1, 2]]);
    const last = planRun(build, checksThrough(0)).steps.at(-1);
    expect(last?.stopsAt).toBe('client');
    expect(last?.stopsAtPart).toBe(1);
  });

  it('marks the server that is missing the cache, not the first one on the board', () => {
    // Stage 2 solved except that the second server never got its own line to
    // the cache. Marking server one would point at the half that works.
    const build = buildOf(
      ['client', 'lb', 'server', 'server', 'db', 'blob', 'cache'],
      [
        [1, 2],
        [2, 3],
        [2, 4],
        [3, 5],
        [4, 5],
        [3, 6],
        [4, 6],
        [3, 7],
      ],
    );
    const last = planRun(build, checksThrough(1)).steps.at(-1);
    expect(last?.checkId).toBe('s2-cache');
    expect(last?.pass).toBe(false);
    expect(last?.stopsAt).toBe('server');
    expect(last?.stopsAtPart).toBe(4);
  });

  it('walks a route on the checks that have one and none on the counting ones', () => {
    const finished = runMoves(photo).stageBuilds[2];
    const byId = new Map(planRun(finished, checksThrough(2)).steps.map((s) => [s.checkId, s]));
    expect(byId.get('s1-api')?.route).toEqual(['client', 'lb', 'server']);
    expect(byId.get('s1-files')?.route).toEqual(['server', 'blob']);
    expect(byId.get('s2-two')?.route).toEqual([]);
    expect(byId.get('s3-budget')?.route).toEqual([]);
  });

  it('lets a red bonus through without halting the run', () => {
    const build = buildOf(['server', 'db'], [[1, 2]]);
    const plan = planRun(build, [
      { id: 'ordinary', when: { op: 'edge', a: 'server', b: 'db' }, hintMoves: [] },
      { id: 'extra', when: { op: 'placed', kind: 'cache' }, hintMoves: [], bonus: true },
      { id: 'after', when: { op: 'placed', kind: 'server' }, hintMoves: [] },
    ]);
    expect(plan.halted).toBe(false);
    expect(plan.steps.map((s) => s.pass)).toEqual([true, false, true]);
  });

  it('keeps a full run inside the time budget docs/12 sets', () => {
    // The longest run the app can deal: every check of the longest capstone.
    const finished = runMoves(photo).stageBuilds[2];
    const plan = planRun(finished, checksThrough(2));
    expect(runDuration(plan, 150, 150)).toBeLessThan(2500);
  });
});
