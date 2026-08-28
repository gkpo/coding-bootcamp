import { describe, expect, it } from 'vitest';
import { HOP_MS, REST_MS } from './playRun';
import {
  FADE_MS,
  LEAD_MS,
  PACKETS,
  STALL_MS,
  opacityOf,
  planPackets,
  progressOf,
  sail,
  type PacketWindow,
} from './packets';
import type { FlowStep, RunPlan } from './flowRun';
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

const flying = { leg: 0, place: 0, depart: 0, arrive: 1000, stalls: false } satisfies PacketWindow;

const moving = { hopMs: HOP_MS, restMs: REST_MS, packets: true };
const still = { hopMs: HOP_MS, restMs: REST_MS, packets: false };

describe('the run timeline (docs/12 part D)', () => {
  it('resolves a check when its lead packet arrives', () => {
    const timeline = planPackets(plan(route('client', 'server', 'db')), moving);
    const lead = timeline.packets.find((p) => p.place === 0);

    expect(timeline.resolveAt).toEqual([2 * HOP_MS]);
    expect(lead?.arrive).toBe(2 * HOP_MS);
  });

  it('sends a convoy down every route it walks', () => {
    const timeline = planPackets(plan(route('client', 'server')), moving);

    expect(timeline.packets).toHaveLength(PACKETS);
    expect(timeline.packets.map((p) => p.depart)).toEqual([0, LEAD_MS, 2 * LEAD_MS]);
  });

  it('leaves the checks that have nothing to walk alone', () => {
    const timeline = planPackets(plan(step(), step()), moving);

    expect(timeline.packets).toEqual([]);
    expect(timeline.resolveAt).toEqual([REST_MS, 2 * REST_MS]);
  });

  it('keeps the run decided on the old schedule however long the tail flies', () => {
    // The whole point of the convoy: it costs the run nothing. A green run
    // over five checks still lands inside the two seconds docs/12 asks for.
    const five = plan(...Array.from({ length: 5 }, () => route('client', 'server')));
    const timeline = planPackets(five, moving);

    expect(timeline.decidedAt).toBe(5 * HOP_MS);
    expect(timeline.decidedAt).toBeLessThan(2000);
    expect(timeline.duration).toBeGreaterThan(timeline.decidedAt);
  });

  it('has one check still in the air when the next one starts', () => {
    const timeline = planPackets(plan(route('client', 'server'), route('server', 'db')), moving);
    const second = timeline.packets.find((p) => p.leg === 1 && p.place === 0);
    const tail = timeline.packets.filter((p) => p.leg === 0).at(-1);

    expect(second?.depart).toBe(HOP_MS);
    expect(tail?.arrive).toBeGreaterThan(second?.depart ?? 0);
  });

  it('holds a stopped convoy at the break rather than landing it', () => {
    const timeline = planPackets(plan(route('client', 'server')), moving);
    const halted = planPackets(
      plan(step({ route: ['client', 'server'], pass: false, stopsAt: 'server' })),
      moving,
    );

    expect(timeline.packets.every((p) => !p.stalls)).toBe(true);
    expect(halted.packets.every((p) => p.stalls)).toBe(true);
    expect(halted.duration).toBe(timeline.duration + STALL_MS);
  });

  it('parks a one-part route where it stands, and sends only one packet there', () => {
    const timeline = planPackets(plan(step({ route: ['db'], pass: false, stopsAt: 'db' })), moving);

    expect(timeline.packets).toHaveLength(1);
    expect(timeline.packets[0].arrive).toBe(timeline.packets[0].depart);
  });

  it('flies nothing under reduced motion but keeps the order and the pace', () => {
    const steps = plan(route('client', 'server', 'db'), step(), route('server', 'cache'));
    const timeline = planPackets(steps, still);

    expect(timeline.packets).toEqual([]);
    expect(timeline.resolveAt).toEqual([REST_MS, 2 * REST_MS, 3 * REST_MS]);
    expect(timeline.duration).toBe(timeline.decidedAt);
  });
});

describe('a packet in flight', () => {
  it('is nowhere before it sets off', () => {
    expect(progressOf({ ...flying, depart: 100 }, 0)).toBeNull();
    expect(opacityOf({ ...flying, depart: 100 }, 0)).toBe(0);
  });

  it('starts at the source and ends at the target', () => {
    expect(progressOf(flying, 0)).toBe(0);
    expect(progressOf(flying, 1000)).toBe(1);
    expect(progressOf(flying, 5000)).toBe(1);
  });

  it('fades in, holds, and fades out', () => {
    expect(opacityOf(flying, 0)).toBe(0);
    expect(opacityOf(flying, FADE_MS)).toBe(1);
    expect(opacityOf(flying, 500)).toBe(1);
    expect(opacityOf(flying, 1000 + FADE_MS / 2)).toBeCloseTo(0.5);
    expect(opacityOf(flying, 1000 + FADE_MS)).toBe(0);
  });

  it('sits at the break for a beat before it goes', () => {
    const stalled = { ...flying, stalls: true };

    expect(opacityOf(stalled, 1000 + STALL_MS / 2)).toBe(1);
    expect(opacityOf(stalled, 1000 + STALL_MS + FADE_MS)).toBe(0);
  });

  it('rides dimmer the further back in the convoy it is', () => {
    const at = (place: number) => opacityOf({ ...flying, place }, 500);

    expect(at(0)).toBeGreaterThan(at(1));
    expect(at(1)).toBeGreaterThan(at(2));
    expect(at(2)).toBeGreaterThan(0.5);
  });
});

describe('sailing', () => {
  it('covers the whole route and no more', () => {
    expect(sail(0)).toBe(0);
    expect(sail(1)).toBeCloseTo(1, 10);
    expect(sail(-1)).toBe(0);
    expect(sail(2)).toBeCloseTo(1, 10);
  });

  it('never goes backwards', () => {
    let last = -1;
    for (let i = 0; i <= 1000; i += 1) {
      const here = sail(i / 1000);
      expect(here).toBeGreaterThanOrEqual(last);
      last = here;
    }
  });

  it('pulls away and glides in rather than starting and stopping dead', () => {
    const speed = (t: number) => (sail(t + 0.005) - sail(t - 0.005)) / 0.01;

    expect(speed(0.02)).toBeLessThan(speed(0.5));
    expect(speed(0.98)).toBeLessThan(speed(0.5));
    // Linear travel would hold one speed the whole way; this one has a cruise
    // to be slower than at both ends.
    expect(speed(0.5)).toBeGreaterThan(1);
  });

  it('holds a steady speed through the middle, so the convoy keeps its gaps', () => {
    const speed = (t: number) => (sail(t + 0.005) - sail(t - 0.005)) / 0.01;

    expect(speed(0.35)).toBeCloseTo(speed(0.65), 6);
    expect(speed(0.5)).toBeCloseTo(speed(0.65), 6);
  });

  it('is symmetric: it leaves the way it arrives', () => {
    for (const t of [0.05, 0.1, 0.2, 0.4]) {
      expect(sail(t)).toBeCloseTo(1 - sail(1 - t), 10);
    }
  });
});
