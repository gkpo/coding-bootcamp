import { afterEach, describe, expect, it, vi } from 'vitest';
import { vibrate } from './feedback';

const withVibrate = (impl?: (p: number | number[]) => boolean) => {
  const spy = vi.fn(impl ?? (() => true));
  vi.stubGlobal('navigator', { vibrate: spy });
  return spy;
};

afterEach(() => vi.unstubAllGlobals());

describe('vibrate', () => {
  it('does nothing when haptics are switched off', () => {
    const spy = withVibrate();
    vibrate('right', false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('vibrates when enabled', () => {
    const spy = withVibrate();
    vibrate('right', true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('uses a distinct pattern per outcome', () => {
    const spy = withVibrate();
    vibrate('right', true);
    vibrate('wrong', true);
    vibrate('complete', true);
    const [a, b, c] = spy.mock.calls.map((call) => JSON.stringify(call[0]));
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('is a no-op where the platform has no vibrate — iOS has none at all', () => {
    vi.stubGlobal('navigator', {});
    expect(() => vibrate('right', true)).not.toThrow();
  });

  it('survives a browser that throws when the page is hidden', () => {
    withVibrate(() => {
      throw new Error('not allowed');
    });
    expect(() => vibrate('wrong', true)).not.toThrow();
  });
});
