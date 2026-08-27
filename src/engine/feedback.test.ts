import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CUES,
  DEFAULT_TUNING,
  playNotes,
  playTone,
  resetAudioForTests,
  vibrate,
  type Note,
} from './feedback';

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

describe('playTone', () => {
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

describe('playNotes tuning', () => {
  const stub = () => stubAudio();

  it('collapses a spread note to one oscillator at zero width', () => {
    const wide = stub();
    playNotes(CUES.right.notes, true, { width: 0.34 });
    const narrow = stub();
    playNotes(CUES.right.notes, true, { width: 0 });
    expect(narrow.createOscillator.mock.calls.length).toBeLessThan(
      wide.createOscillator.mock.calls.length,
    );
    expect(narrow.createStereoPanner).not.toHaveBeenCalled();
  });

  it('scales the sparkle note and leaves the spine of the cue alone', () => {
    // The ramp target is the note's peak, so reading the ramps back off the
    // gain nodes is reading the levels the cue was actually played at.
    const peaks = (ctx: StubCtx) =>
      ctx.createGain.mock.results
        .flatMap(
          (r) =>
            (r.value as { gain: { exponentialRampToValueAtTime: Fn } }).gain
              .exponentialRampToValueAtTime.mock.calls,
        )
        .map((call) => call[0] as number);

    const sparkle = CUES.right.notes.filter((n: Note) => n.sparkle);
    const spine = CUES.right.notes.filter((n: Note) => !n.sparkle);
    expect(sparkle.length).toBeGreaterThan(0);
    expect(spine.length).toBeGreaterThan(0);

    const plain = stub();
    playNotes(sparkle, true, { sparkle: 1 });
    const loud = stub();
    playNotes(sparkle, true, { sparkle: 2 });
    expect(Math.max(...peaks(loud))).toBeCloseTo(Math.max(...peaks(plain)) * 2, 5);

    const spineQuiet = stub();
    playNotes(spine, true, { sparkle: 0 });
    const spineLoud = stub();
    playNotes(spine, true, { sparkle: 2 });
    expect(Math.max(...peaks(spineQuiet))).toBeCloseTo(Math.max(...peaks(spineLoud)), 5);
  });

  it('never ramps to a true zero, however far the sparkle is pulled down', () => {
    const ctx = stub();
    playNotes(
      CUES.right.notes.filter((n: Note) => n.sparkle),
      true,
      { sparkle: 0 },
    );
    const targets = ctx.createGain.mock.results
      .flatMap(
        (r) =>
          (r.value as { gain: { exponentialRampToValueAtTime: Fn } }).gain
            .exponentialRampToValueAtTime.mock.calls,
      )
      .map((call) => call[0] as number);
    // An exponential ramp cannot reach or leave zero: a silenced note still
    // has to be ramped to something above it or the whole cue throws.
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every((t) => t > 0)).toBe(true);
  });

  it('builds one convolver per room length and never re-points it', () => {
    const ctx = stub();
    // A convolver resets when its buffer is replaced, which would cut off a
    // tail still ringing. Cues overlap in normal use, so each room length gets
    // its own convolver and keeps the buffer it was built with.
    playNotes(CUES.right.notes, true, { tailSeconds: 1.1 });
    playNotes(CUES.right.notes, true, { tailSeconds: 2.2 });
    playNotes(CUES.right.notes, true, { tailSeconds: 1.1 });
    expect(ctx.createConvolver!.mock.calls.length).toBe(2);
    expect(ctx.createBuffer!.mock.calls.length).toBe(2);
  });

  it('stays silent when sound is off, whatever the tuning', () => {
    const ctx = stub();
    playNotes(CUES.right.notes, false, { level: 1.6 });
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('generates a room once per length, however often cues alternate', () => {
    const ctx = stub();
    // Answers alternate between cues, and regenerating a multi-second stereo
    // impulse each time would be a quarter of a million random samples on the
    // thread trying to play the cue.
    playTone('right', true);
    playTone('wrong', true);
    playTone('right', true);
    playTone('tap', true);
    playTone('wrong', true);
    const lengths = new Set(Object.values(CUES).map((c) => c.tuning.tailSeconds));
    expect(ctx.createBuffer!.mock.calls.length).toBeLessThanOrEqual(lengths.size);
  });

  it('keeps level on the note, not on anything shared', () => {
    const ctx = stub();
    // Otherwise starting a cue would move the loudness of one still ringing.
    playNotes(CUES.right.notes, true, { level: 2 });
    const shared = ctx.createGain.mock.results
      .map((r) => (r.value as { gain: { value: number } }).gain.value)
      .filter((v) => v === 2);
    expect(shared).toHaveLength(0);
  });

  it('gives every cue its own treatment rather than one global one', () => {
    const tunings = Object.values(CUES).map((c) => JSON.stringify(c.tuning));
    expect(new Set(tunings).size).toBeGreaterThan(1);
  });

  it('keeps the tap far below the answer cues, since it is heard constantly', () => {
    const loudest = (notes: Note[]) => notes.reduce((max, n) => Math.max(max, n.level), 0);
    const tap = loudest(CUES.tap.notes) * CUES.tap.tuning.level;
    const miss = loudest(CUES.wrong.notes) * CUES.wrong.tuning.level;
    expect(tap).toBeLessThan(miss / 2);
    // And it has to be over almost before it registers.
    expect(Math.max(...CUES.tap.notes.map((n) => n.at + n.dur))).toBeLessThan(0.1);
  });

  it('never lets a swell outlast the note it belongs to', () => {
    const ctx = stub();
    // An attack longer than the note would schedule the peak after the decay
    // has already been asked for, which throws the whole cue away.
    playNotes([{ freq: 440, at: 0, dur: 0.2, level: 0.05, attack: 5 }], true);
    // The bus gains come first and are set by value, so the envelope is the
    // first gain node that was actually ramped.
    const ramps =
      ctx.createGain.mock.results
        .map(
          (r) =>
            (r.value as { gain: { exponentialRampToValueAtTime: Fn } }).gain
              .exponentialRampToValueAtTime.mock.calls,
        )
        .find((calls) => calls.length === 2) ?? [];
    expect(ramps.length).toBe(2);
    const [, peakAt] = ramps[0] as unknown as number[];
    const [, endAt] = ramps[1] as unknown as number[];
    expect(peakAt).toBeLessThan(endAt);
  });

  it('leaves the shipped cues on the shipped tuning', () => {
    expect(DEFAULT_TUNING).toEqual({
      level: 0.9,
      width: 0.34,
      tail: 0.3,
      tailSeconds: 1.1,
      sparkle: 1,
    });
  });
});
