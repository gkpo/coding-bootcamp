import { describe, expect, it } from 'vitest';
import {
  FADE_MS,
  FADE_PX,
  GAP,
  PACKETS,
  REST_MS,
  SPEED,
  STALL_MS,
  opacityOf,
  planPackets,
  progressOf,
  timeFor,
  type PacketWindow,
} from './packets';
import { planRun, type FlowStep, type RunPlan } from './flowRun';
import { runMoves } from '../engine/archgraph';
import { capstones } from '../content';
import type { CapstoneCheck } from '../content/types';
import type { PartKind } from '../engine/archgraph';

const step = (over: Partial<FlowStep> = {}): FlowStep => ({
  checkId: 'c',
  pass: true,
  route: [],
  stopsAt: null,
  ...over,
});

const route = (...kinds: PartKind[]) => step({ route: kinds });
const plan = (...steps: FlowStep[]): RunPlan => ({ steps, halted: false });

/** A hop of this length takes a round 500ms at the speed traffic moves. */
const LEG = SPEED / 2;

const flying = {
  leg: 0,
  place: 0,
  depart: 0,
  arrive: timeFor(LEG),
  length: LEG,
  stalls: false,
} satisfies PacketWindow;

describe('the run timeline (docs/12 part D)', () => {
  it('gives a check the time its route actually takes to cross', () => {
    const timeline = planPackets(plan(route('client', 'server')), [LEG], true);

    expect(timeline.resolveAt).toEqual([500]);
    expect(timeline.packets[0].arrive).toBe(500);
  });

  it('moves every check at the same speed, however long its route', () => {
    const timeline = planPackets(
      plan(route('client', 'server'), route('client', 'server', 'db')),
      [100, 400],
      true,
    );
    const legMs = [timeline.resolveAt[0], timeline.resolveAt[1] - timeline.resolveAt[0]];

    expect(100 / (legMs[0] / 1000)).toBeCloseTo(SPEED, 6);
    expect(400 / (legMs[1] / 1000)).toBeCloseTo(SPEED, 6);
  });

  it('sends a convoy down every route it walks', () => {
    const timeline = planPackets(plan(route('client', 'server')), [LEG], true);

    expect(timeline.packets).toHaveLength(PACKETS);
    expect(timeline.packets.map((p) => p.depart)).toEqual([0, timeFor(GAP), timeFor(2 * GAP)]);
  });

  it('leaves the checks that have nothing to walk alone', () => {
    const timeline = planPackets(plan(step(), step()), [0, 0], true);

    expect(timeline.packets).toEqual([]);
    expect(timeline.resolveAt).toEqual([REST_MS, 2 * REST_MS]);
  });

  it('has one check still in the air when the next one starts', () => {
    const timeline = planPackets(
      plan(route('client', 'server'), route('server', 'db')),
      [LEG, LEG],
      true,
    );
    const next = timeline.packets.find((p) => p.leg === 1 && p.place === 0);
    const tail = timeline.packets.filter((p) => p.leg === 0).at(-1);

    expect(next?.depart).toBe(500);
    expect(tail?.arrive).toBeGreaterThan(next?.depart ?? 0);
  });

  it('holds a stopped convoy at the break rather than landing it', () => {
    const clean = planPackets(plan(route('client', 'server')), [LEG], true);
    const halted = planPackets(
      plan(step({ route: ['client', 'server'], pass: false, stopsAt: 'server' })),
      [LEG],
      true,
    );

    expect(clean.packets.every((p) => !p.stalls)).toBe(true);
    expect(halted.packets.every((p) => p.stalls)).toBe(true);
    expect(halted.duration).toBe(clean.duration + STALL_MS + FADE_MS);
  });

  it('parks a one-part route where it stands, and sends only one packet there', () => {
    const timeline = planPackets(
      plan(step({ route: ['db'], pass: false, stopsAt: 'db' })),
      [0],
      true,
    );

    expect(timeline.packets).toHaveLength(1);
    expect(timeline.packets[0].arrive).toBe(timeline.packets[0].depart);
  });

  it('flies nothing under reduced motion but keeps the order and the pace', () => {
    const steps = plan(route('client', 'server', 'db'), step(), route('server', 'cache'));
    const timeline = planPackets(steps, [400, 0, 120], false);

    expect(timeline.packets).toEqual([]);
    expect(timeline.resolveAt).toEqual([REST_MS, 2 * REST_MS, 3 * REST_MS]);
    expect(timeline.duration).toBe(timeline.decidedAt);
  });

  it('spends the time its distances cost and not a millisecond more', () => {
    const steps = plan(route('client', 'server'), step(), route('client', 'server', 'db'));
    const lengths = [140, 0, 260];
    const timeline = planPackets(steps, lengths, true);

    expect(timeline.decidedAt).toBeCloseTo(timeFor(140) + REST_MS + timeFor(260), 6);
  });

  it('keeps the longest run the app can deal inside its budget', () => {
    // Every check of the longest capstone, which is the most the app ever
    // plays at once. A hop of 130px is the median connection measured on a
    // real 350px board; the longest one measured there is 277.
    const photo = capstones[0];
    const checks: CapstoneCheck[] = photo.stages.flatMap((s) => s.checks);
    const full = planRun(runMoves(photo).stageBuilds[2], checks);
    const hops = full.steps.map((s) => Math.max(0, s.route.length - 1));
    const typical = planPackets(
      full,
      hops.map((n) => n * 130),
      true,
    );
    const longest = planPackets(
      full,
      hops.map((n) => n * 277),
      true,
    );

    expect(full.steps.every((s) => s.pass)).toBe(true);
    expect(typical.decidedAt).toBeLessThan(6000);
    expect(longest.decidedAt).toBeLessThan(12000);
  });
});

describe('the gap between packets', () => {
  /** Where each packet on a leg has got to, in pixels, at one moment. */
  const spread = (timeline: ReturnType<typeof planPackets>, now: number) =>
    timeline.packets
      .map((p) => {
        const at = progressOf(p, now);
        return at === null ? null : at * p.length;
      })
      .filter((d): d is number => d !== null && d > 0 && d < LEG);

  it('is exactly the designed gap at every moment of a run', () => {
    const timeline = planPackets(plan(route('client', 'server')), [LEG], true);
    let compared = 0;

    for (let now = 0; now <= 900; now += 3) {
      const on = spread(timeline, now);
      for (let i = 1; i < on.length; i += 1) {
        expect(on[i - 1] - on[i]).toBeCloseTo(GAP, 6);
        compared += 1;
      }
    }
    // Guard against the assertions above passing because nothing was ever on
    // the route to compare in the first place.
    expect(compared).toBeGreaterThan(100);
  });

  it('is the same gap on a short route as on a long one', () => {
    const short = planPackets(plan(route('client', 'server')), [80], true);
    const long = planPackets(plan(route('client', 'server')), [600], true);
    const gapAt = (timeline: ReturnType<typeof planPackets>, now: number, length: number) => {
      const on = timeline.packets
        .map((p) => (progressOf(p, now) ?? 0) * p.length)
        .filter((d) => d > 0 && d < length);
      return on.length >= 2 ? on[0] - on[1] : null;
    };

    expect(gapAt(short, 200, 80)).toBeCloseTo(GAP, 6);
    expect(gapAt(long, 900, 600)).toBeCloseTo(GAP, 6);
  });
});

describe('a packet in flight', () => {
  it('is nowhere before it sets off', () => {
    expect(progressOf({ ...flying, depart: 100 }, 0)).toBeNull();
    expect(opacityOf({ ...flying, depart: 100 }, 0)).toBe(0);
  });

  it('starts at the source and ends at the target', () => {
    expect(progressOf(flying, 0)).toBe(0);
    expect(progressOf(flying, 500)).toBe(1);
    expect(progressOf(flying, 5000)).toBe(1);
  });

  it('holds one speed the whole way, with no ramp at either end', () => {
    const steps = [];
    for (let now = 0; now < 500; now += 25) {
      const here = (progressOf(flying, now) ?? 0) * LEG;
      const next = (progressOf(flying, now + 25) ?? 0) * LEG;
      steps.push(next - here);
    }

    for (const covered of steps) expect(covered).toBeCloseTo(steps[0], 6);
    expect(steps[0] / 0.025).toBeCloseTo(SPEED, 6);
  });

  it('comes out of one part and goes into the next over a fixed distance', () => {
    const at = (px: number) => opacityOf(flying, timeFor(px));

    expect(at(0)).toBe(0);
    expect(at(FADE_PX)).toBe(1);
    expect(at(LEG / 2)).toBe(1);
    expect(at(LEG - FADE_PX)).toBe(1);
    expect(at(LEG - FADE_PX / 2)).toBeCloseTo(0.5, 6);
    expect(opacityOf(flying, timeFor(LEG) + 1)).toBe(0);
  });

  it('sits at the break for a beat before it goes', () => {
    const stalled = { ...flying, stalls: true };
    const landed = timeFor(LEG);

    // No fade out on the way in: traffic that stops somewhere has to be
    // visible sitting on the thing it stopped at.
    expect(opacityOf(stalled, timeFor(LEG - 1))).toBe(1);
    expect(opacityOf(stalled, landed + STALL_MS / 2)).toBe(1);
    expect(opacityOf(stalled, landed + STALL_MS + FADE_MS)).toBe(0);
  });

  it('lights every packet the same, wherever it is in the convoy', () => {
    const at = (place: number) => opacityOf({ ...flying, place }, timeFor(LEG / 2));

    expect(at(0)).toBe(1);
    expect(at(1)).toBe(1);
    expect(at(2)).toBe(1);
  });
});
