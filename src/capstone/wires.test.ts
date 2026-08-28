import { describe, expect, it } from 'vitest';
import { planWires, wireKey } from './wires';

const CHIP = 62;

describe('planWires', () => {
  it('meets each chip at its edge rather than at its middle', () => {
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 100, y: 150 } };
    const [wire] = planWires([[1, 2]], centres, CHIP);
    expect(wire.from).toEqual({ x: 100, y: 81 });
    expect(wire.to).toEqual({ x: 100, y: 119 });
  });

  it('fans several connections across the edge they share', () => {
    // Three lines leaving one chip downward: stacked on one point they read as
    // a single stroke, so they spread in the order of where they land.
    const centres = {
      1: { x: 100, y: 50 },
      2: { x: 40, y: 150 },
      3: { x: 100, y: 150 },
      4: { x: 160, y: 150 },
    };
    const plans = planWires(
      [
        [1, 3],
        [1, 4],
        [1, 2],
      ],
      centres,
      CHIP,
    );
    const exits = plans.map((p) => p.from.x).sort((a, b) => a - b);
    expect(new Set(exits).size).toBe(3);
    expect(exits[0]).toBeLessThan(100);
    expect(exits[2]).toBeGreaterThan(100);
    // Never wider than the chip it leaves.
    expect(exits[0]).toBeGreaterThanOrEqual(100 - CHIP / 2);
    expect(exits[2]).toBeLessThanOrEqual(100 + CHIP / 2);
  });

  it('orders the fan by where each line is going, so they do not cross at birth', () => {
    const centres = {
      1: { x: 100, y: 50 },
      2: { x: 40, y: 150 },
      3: { x: 160, y: 150 },
    };
    const plans = planWires(
      [
        [1, 3],
        [1, 2],
      ],
      centres,
      CHIP,
    );
    const toLeft = plans.find((p) => p.b === 2);
    const toRight = plans.find((p) => p.b === 3);
    expect(toLeft?.from.x).toBeLessThan(toRight?.from.x ?? 0);
  });

  it('leaves sideways for a connection within one row', () => {
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 220, y: 50 } };
    const [wire] = planWires([[1, 2]], centres, CHIP);
    expect(wire.from).toEqual({ x: 131, y: 50 });
    expect(wire.to).toEqual({ x: 189, y: 50 });
  });

  it('puts every anchor exactly on the border, however far along the edge it fanned', () => {
    // Half in and half out is what makes a dot read as plugged in. Nudging it
    // toward the chip centre instead pulled the fanned ones inward as well.
    const centres = {
      1: { x: 100, y: 50 },
      2: { x: 40, y: 150 },
      3: { x: 160, y: 150 },
    };
    const plans = planWires(
      [
        [1, 2],
        [1, 3],
      ],
      centres,
      CHIP,
    );
    for (const wire of plans) expect(wire.from.y).toBe(81);
  });

  it('runs straight between two chips in the same row', () => {
    // Nothing to curve around, and a bend there looks like a machine drew it.
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 220, y: 50 } };
    const [wire] = planWires([[1, 2]], centres, CHIP);
    expect(wire.d).toBe('M 131 50 L 189 50');
  });

  it('draws a curve between rows that starts and ends on its anchors', () => {
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 200, y: 150 } };
    const [wire] = planWires([[1, 2]], centres, CHIP);
    expect(wire.d.startsWith(`M ${wire.from.x} ${wire.from.y} C`)).toBe(true);
    expect(wire.d.endsWith(`${wire.to.x} ${wire.to.y}`)).toBe(true);
  });

  it('skips an edge whose parts have not been measured yet', () => {
    expect(planWires([[1, 9]], { 1: { x: 0, y: 0 } }, CHIP)).toEqual([]);
  });

  it('keys a pair the same way round either way', () => {
    expect(wireKey(7, 2)).toBe(wireKey(2, 7));
  });
});
