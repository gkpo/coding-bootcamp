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

type Fn = ReturnType<typeof vi.fn>;

/** Only the slice of an AudioContext this module actually reaches for. */
interface StubCtx {
  state: string;
  currentTime: number;
  sampleRate: number;
  destination: object;
  resume: Fn;
  createOscillator: Fn;
  createGain: Fn;
  createStereoPanner?: Fn;
  createConvolver?: Fn;
  createDynamicsCompressor?: Fn;
  createBuffer?: Fn;
}

describe('playTone', () => {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });

  /**
   * A fake with the whole modern graph. `minimal` drops everything WebKit was
   * late to ship, which is the path old Safari takes.
   */
  const stubAudio = (minimal = false): StubCtx => {
    const node = <T extends object>(extra: T) => ({
      ...extra,
      connect: vi.fn((next: unknown) => next),
    });
    const osc = () =>
      node({
        type: '',
        frequency: param(),
        detune: { value: 0 },
        start: vi.fn(),
        stop: vi.fn(),
      });
    const gain = () => node({ gain: param() });
    const ctx: Record<string, unknown> = {
      state: 'running',
      currentTime: 0,
      sampleRate: 48000,
      resume: vi.fn(),
      destination: {},
      createOscillator: vi.fn(osc),
      createGain: vi.fn(gain),
    };
    if (!minimal) {
      ctx.createStereoPanner = vi.fn(() => node({ pan: { value: 0 } }));
      ctx.createConvolver = vi.fn(() => node({ buffer: null }));
      ctx.createDynamicsCompressor = vi.fn(() =>
        node({
          threshold: { value: 0 },
          knee: { value: 0 },
          ratio: { value: 0 },
          attack: { value: 0 },
          release: { value: 0 },
        }),
      );
      ctx.createBuffer = vi.fn((channels: number, length: number) => ({
        getChannelData: () => new Float32Array(length),
        numberOfChannels: channels,
      }));
    }
    vi.stubGlobal('AudioContext', function () {
      return ctx;
    });
    resetAudioForTests();
    return ctx as unknown as StubCtx;
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

  it('spreads the correct cue across the stereo field', () => {
    const ctx = stubAudio();
    playTone('right', true);
    const made = ctx.createStereoPanner!.mock.results as { value: { pan: { value: number } } }[];
    const pans = made.map((r) => r.value.pan.value);
    expect(pans.some((p: number) => p < 0)).toBe(true);
    expect(pans.some((p: number) => p > 0)).toBe(true);
  });

  it('sends more of the correct cue to the tail than it does a miss', () => {
    // Sends are the only gains set by value, alongside the two fixed bus
    // gains that both cues share, so the totals compare cleanly.
    const total = (ctx: StubCtx) => {
      const made = ctx.createGain.mock.results as { value: { gain: { value: number } } }[];
      return made.reduce((sum, r) => sum + r.value.gain.value, 0);
    };
    const right = stubAudio();
    playTone('right', true);
    expect(right.createConvolver).toHaveBeenCalled();
    const wrong = stubAudio();
    playTone('wrong', true);
    expect(total(right)).toBeGreaterThan(total(wrong));
  });

  it('reuses one bus rather than rebuilding it per answer', () => {
    const ctx = stubAudio();
    playTone('right', true);
    const first = ctx.createConvolver!.mock.calls.length;
    playTone('right', true);
    expect(ctx.createConvolver!.mock.calls.length).toBe(first);
  });

  it('still plays where there is no panning or convolution. Older WebKit', () => {
    const ctx = stubAudio(true);
    expect(() => playTone('right', true)).not.toThrow();
    expect(ctx.createOscillator).toHaveBeenCalled();
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
