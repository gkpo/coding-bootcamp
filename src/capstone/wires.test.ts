import { describe, expect, it } from 'vitest';
import { boundaryPoint, planWires, wireKey } from './wires';

const CHIP = 62;
const RADIUS = 14;

describe('planWires', () => {
  it('meets each chip at its edge rather than at its middle', () => {
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 100, y: 150 } };
    const [wire] = planWires([[1, 2]], centres, CHIP, RADIUS);
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
      RADIUS,
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
      RADIUS,
    );
    const toLeft = plans.find((p) => p.b === 2);
    const toRight = plans.find((p) => p.b === 3);
    expect(toLeft?.from.x).toBeLessThan(toRight?.from.x ?? 0);
  });

  it('leaves sideways for a connection within one row', () => {
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 220, y: 50 } };
    const [wire] = planWires([[1, 2]], centres, CHIP, RADIUS);
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
      RADIUS,
    );
    for (const wire of plans) expect(wire.from.y).toBe(81);
  });

  it('runs straight between two chips in the same row', () => {
    // Nothing to curve around, and a bend there looks like a machine drew it.
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 220, y: 50 } };
    const [wire] = planWires([[1, 2]], centres, CHIP, RADIUS);
    expect(wire.d).toBe('M 131 50 L 189 50');
  });

  it('draws a curve between rows that starts and ends on its anchors', () => {
    const centres = { 1: { x: 100, y: 50 }, 2: { x: 200, y: 150 } };
    const [wire] = planWires([[1, 2]], centres, CHIP, RADIUS);
    expect(wire.d.startsWith(`M ${wire.from.x} ${wire.from.y} C`)).toBe(true);
    expect(wire.d.endsWith(`${wire.to.x} ${wire.to.y}`)).toBe(true);
  });

  it('skips an edge whose parts have not been measured yet', () => {
    expect(planWires([[1, 9]], { 1: { x: 0, y: 0 } }, CHIP, RADIUS)).toEqual([]);
  });

  it('keys a pair the same way round either way', () => {
    expect(wireKey(7, 2)).toBe(wireKey(2, 7));
  });

  it('spreads anchors only across the straight run of an edge', () => {
    // Past the flat part the border is curving away, and edge arithmetic
    // alone would put a dot in mid air beside the corner.
    const centres = {
      1: { x: 100, y: 50 },
      2: { x: 0, y: 150 },
      3: { x: 100, y: 150 },
      4: { x: 200, y: 150 },
    };
    const plans = planWires(
      [
        [1, 2],
        [1, 3],
        [1, 4],
      ],
      centres,
      CHIP,
      RADIUS,
    );
    const flat = CHIP / 2 - RADIUS;
    for (const wire of plans) {
      expect(Math.abs(wire.from.x - 100)).toBeLessThanOrEqual(flat);
      expect(wire.from.y).toBe(81);
    }
  });
});

describe('boundaryPoint', () => {
  const HALF = 31;

  it('meets the flat run of an edge where the square does', () => {
    expect(boundaryPoint(HALF, RADIUS, 0, 1)).toEqual({ x: 0, y: HALF });
    expect(boundaryPoint(HALF, RADIUS, -1, 0)).toEqual({ x: -HALF, y: 0 });
  });

  it('meets the corner circle, not the square, on a diagonal', () => {
    const at = boundaryPoint(HALF, RADIUS, 1, 1);
    const flat = HALF - RADIUS;
    // On the corner's arc: exactly one radius from the centre of that circle.
    expect(Math.hypot(at.x - flat, at.y - flat)).toBeCloseTo(RADIUS, 6);
    // And therefore inside the square it is rounding off.
    expect(at.x).toBeLessThan(HALF);
    expect(at.y).toBeLessThan(HALF);
  });

  it('lands on the border for every direction around the chip', () => {
    const flat = HALF - RADIUS;
    for (let deg = 0; deg < 360; deg += 7) {
      const rad = (deg * Math.PI) / 180;
      const at = boundaryPoint(HALF, RADIUS, Math.cos(rad), Math.sin(rad));
      const outX = Math.max(Math.abs(at.x) - flat, 0);
      const outY = Math.max(Math.abs(at.y) - flat, 0);
      // Either on a flat edge, or one radius from the nearest corner centre.
      const onFlat =
        Math.abs(Math.abs(at.x) - HALF) < 1e-6 || Math.abs(Math.abs(at.y) - HALF) < 1e-6;
      const onArc = Math.abs(Math.hypot(outX, outY) - RADIUS) < 1e-6;
      expect(onFlat || onArc, `${deg} degrees`).toBe(true);
    }
  });

  it('has nowhere to go for a ray of no length', () => {
    expect(boundaryPoint(HALF, RADIUS, 0, 0)).toEqual({ x: 0, y: 0 });
  });
});
