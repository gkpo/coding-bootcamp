import { describe, expect, it } from 'vitest';
import { addStage, availableKinds, give, isEmpty, take, trayFor } from './tray';
import { runMoves, startingBuild, type CapstoneSpec } from '../engine/archgraph';
import { capstones } from '../content';

const photo = capstones[0];

describe('the tray', () => {
  it('opens stage 1 holding exactly what stage 1 offers', () => {
    const counts = trayFor(photo, 0, startingBuild(photo));
    expect(counts).toEqual({ server: 1, db: 1, blob: 1 });
    expect(availableKinds(counts)).toEqual(['server', 'db', 'blob']);
  });

  it('does not charge the tray for a part that started on the board', () => {
    // c9-01 pre-places the client and the load balancer; neither was ever a
    // tray part, so neither comes out of one.
    const flash = capstones[1];
    expect(trayFor(flash, 0, startingBuild(flash))).toEqual({
      server: 1,
      db: 1,
      queue: 1,
      worker: 1,
    });
  });

  it('hands a resumed run a tray that agrees with the board it resumes on', () => {
    // Cleared stage 1, so the board carries the stage 1 parts and the tray
    // holds only what stage 2 adds.
    const afterStageOne = runMoves(photo).stageBuilds[0];
    expect(trayFor(photo, 1, afterStageOne)).toEqual({ server: 1, lb: 1, cache: 1 });
  });

  it('counts a second server as a second server, not as a spare', () => {
    const afterStageTwo = runMoves(photo).stageBuilds[1];
    expect(trayFor(photo, 2, afterStageTwo).server).toBeUndefined();
    expect(availableKinds(trayFor(photo, 2, afterStageTwo))).toEqual([
      'queue',
      'worker',
      'replica',
    ]);
  });

  it('takes and gives one at a time', () => {
    const counts = { server: 1, db: 1 };
    expect(take(counts, 'server')).toEqual({ db: 1 });
    expect(give(take(counts, 'server'), 'server')).toEqual({ db: 1, server: 1 });
  });

  it('never goes negative when a part is taken twice', () => {
    expect(take(take({ server: 1 }, 'server'), 'server')).toEqual({});
  });

  it('accepts a part back that was never in it, which is how pre-placed parts return', () => {
    expect(give({}, 'client')).toEqual({ client: 1 });
  });

  it('adds the next stage on top of what is left', () => {
    const stage: CapstoneSpec['stages'][number] = {
      tray: [{ kind: 'cache', count: 2 }],
      checks: [],
    };
    expect(addStage({ cache: 1 }, stage)).toEqual({ cache: 3 });
  });

  it('knows when there is nothing left to place', () => {
    expect(isEmpty({ server: 0 })).toBe(true);
    expect(isEmpty({ db: 1 })).toBe(false);
    expect(isEmpty({})).toBe(true);
  });
});
