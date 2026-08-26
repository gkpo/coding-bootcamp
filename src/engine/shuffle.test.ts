import { describe, expect, it } from 'vitest';
import { makeRng, shuffle } from './shuffle';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('differs across seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });

  it('stays in [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 500; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('keeps every element exactly once', () => {
    expect([...shuffle(items, 3)].sort()).toEqual([...items].sort());
  });

  it('does not mutate the input', () => {
    const original = [...items];
    shuffle(items, 3);
    expect(items).toEqual(original);
  });

  it('is deterministic for a given seed', () => {
    expect(shuffle(items, 99)).toEqual(shuffle(items, 99));
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffle([], 1)).toEqual([]);
    expect(shuffle(['only'], 1)).toEqual(['only']);
  });

  it('actually reorders across seeds — answers must not be learnable by position', () => {
    const orders = new Set(Array.from({ length: 40 }, (_, i) => shuffle(items, i).join('')));
    expect(orders.size).toBeGreaterThan(10);
  });

  it('spreads the correct answer across every position over many presentations', () => {
    // The real requirement: index 0 must not be disproportionately the answer.
    const positions = new Map<number, number>();
    for (let seed = 0; seed < 500; seed++) {
      const idx = shuffle(items, seed).indexOf('a');
      positions.set(idx, (positions.get(idx) ?? 0) + 1);
    }
    expect(positions.size).toBe(items.length);
    for (const count of positions.values()) {
      expect(count).toBeGreaterThan(500 / items.length / 2);
    }
  });
});
