import { afterEach, describe, expect, it, vi } from 'vitest';
import { playTone, resetAudioForTests, vibrate } from './feedback';

const withVibrate = (impl?: (p: number | number[]) => boolean) => {
  const spy = vi.fn(impl ?? (() => true));
  vi.stubGlobal('navigator', { vibrate: spy });
  return spy;
};

afterEach(() => {
  vi.unstubAllGlobals();
  resetAudioForTests();
});

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

  it('is a no-op where the platform has no vibrate. IOS has none at all', () => {
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

describe('playTone', () => {
  const stubAudio = () => {
    const started: number[] = [];
    const osc = () => ({
      type: '',
      frequency: { value: 0 },
      connect: (n: unknown) => n,
      start: (t: number) => started.push(t),
      stop: () => {},
    });
    const gain = () => ({
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => ({}),
    });
    const ctx = {
      state: 'running',
      currentTime: 0,
      resume: vi.fn(),
      destination: {},
      createOscillator: vi.fn(osc),
      createGain: vi.fn(gain),
    };
    vi.stubGlobal('AudioContext', function () {
      return ctx;
    });
    resetAudioForTests();
    return ctx;
  };

  it('stays silent when the sound setting is off', () => {
    const ctx = stubAudio();
    playTone('right', false);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('plays when the setting is on', () => {
    const ctx = stubAudio();
    playTone('right', true);
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it('uses a different number of notes per outcome', () => {
    const a = stubAudio();
    playTone('right', true);
    const rightNotes = a.createOscillator.mock.calls.length;
    const b = stubAudio();
    playTone('wrong', true);
    expect(b.createOscillator.mock.calls.length).not.toBe(rightNotes);
  });

  it('resumes a context suspended by the autoplay policy', () => {
    const ctx = stubAudio();
    ctx.state = 'suspended';
    playTone('right', true);
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('is a no-op where the platform has no audio', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    resetAudioForTests();
    expect(() => playTone('right', true)).not.toThrow();
  });

  it('survives a constructor that throws', () => {
    vi.stubGlobal('AudioContext', function () {
      throw new Error('blocked');
    });
    resetAudioForTests();
    expect(() => playTone('wrong', true)).not.toThrow();
  });
});
