import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  climbNote,
  CUES,
  DEFAULT_TUNING,
  landingCue,
  matchRung,
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

  it('schedules every note with a lead so no envelope starts in the past', () => {
    const ctx = stubAudio();
    playTone('tap', true);
    const first = ctx.createOscillator.mock.results[0].value as { start: Fn };
    expect(first.start.mock.calls[0][0] as number).toBeGreaterThanOrEqual(0.03);
  });

  it('resumes a context suspended by the autoplay policy, and waits for the clock', async () => {
    const ctx = stubAudio();
    ctx.resume = vi.fn(() => Promise.resolve());
    ctx.state = 'suspended';
    playTone('right', true);
    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it('stays silent without throwing when resume is refused', async () => {
    const ctx = stubAudio();
    ctx.resume = vi.fn(() => Promise.reject(new Error('no gesture')));
    ctx.state = 'suspended';
    expect(() => playTone('right', true)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(ctx.createOscillator).not.toHaveBeenCalled();
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

describe('climb and landing', () => {
  /** The rung a ring turns green on, without the sparkle stacked on top of it. */
  const note = (ring: number, rings: number) =>
    climbNote(ring, rings).notes.filter((n) => !n.sparkle)[0];
  /** The held note the climb resolves onto: the loudest of the landing's three. */
  const landing = () => landingCue().notes.reduce((top, n) => (n.level > top.level ? n : top));

  it('rings a rung and its octave per green ring, from the moment it resolves', () => {
    expect(climbNote(0, 5).notes).toHaveLength(2);
    expect(note(3, 5).at).toBe(0);
    const sparkle = climbNote(3, 5).notes.filter((n) => n.sparkle);
    expect(sparkle).toHaveLength(1);
    expect(sparkle[0].freq).toBe(note(3, 5).freq * 2);
  });

  it('climbs, every ring higher than the one before', () => {
    const freqs = [0, 1, 2, 3, 4, 5].map((ring) => note(ring, 6).freq);
    freqs.forEach((f, i) => {
      if (i > 0) expect(f).toBeGreaterThan(freqs[i - 1]);
    });
  });

  it('tops out on the same note however long the strip, just under the landing', () => {
    expect(note(1, 2).freq).toBe(note(7, 8).freq);
    expect(landing().freq).toBeGreaterThan(note(7, 8).freq);
  });

  it('clamps rings past the ladder rather than throwing or descending', () => {
    expect(note(15, 20).freq).toBeGreaterThanOrEqual(note(9, 20).freq);
    expect(note(15, 20).freq).toBe(note(19, 20).freq);
  });

  it('holds the landing, the run coming to a full stop', () => {
    expect(landing().dur).toBeGreaterThan(1);
  });

  it('reuses a room length the app already generates', () => {
    const lengths = Object.values(CUES).map((c) => c.tuning.tailSeconds);
    expect(lengths).toContain(landingCue().tuning.tailSeconds);
    expect(lengths).toContain(climbNote(0, 4).tuning.tailSeconds);
  });

  it('stays quieter than the session-complete fanfare', () => {
    const loudest = (notes: Note[]) =>
      notes.reduce((max, n) => Math.max(max, n.sparkle ? 0 : n.level), 0);
    const ceiling = loudest(CUES.complete.notes) * CUES.complete.tuning.level;
    const climb = climbNote(4, 5);
    expect(loudest(climb.notes) * climb.tuning.level).toBeLessThanOrEqual(ceiling);
    const land = landingCue();
    expect(loudest(land.notes) * land.tuning.level).toBeLessThanOrEqual(ceiling);
  });

  it('is played through playNotes like any other cue', () => {
    const ctx = stubAudio();
    const climb = climbNote(1, 3);
    playNotes(climb.notes, true, climb.tuning);
    const land = landingCue();
    playNotes(land.notes, true, land.tuning);
    expect(ctx.createOscillator).toHaveBeenCalled();

    const silent = stubAudio();
    playNotes(climb.notes, false, climb.tuning);
    playNotes(land.notes, false, land.tuning);
    expect(silent.createOscillator).not.toHaveBeenCalled();
  });
});

describe('match climb', () => {
  /**
   * The rung a pair locks on: the loudest note that is not the sparkle, since
   * the grace notes rolling into it are quieter than it by construction.
   */
  const note = (pair: number, pairs: number) =>
    matchRung(pair, pairs)
      .notes.filter((n) => !n.sparkle)
      .reduce((top, n) => (n.level > top.level ? n : top));

  it('rings a rung and its octave per locked pair, from the moment it locks', () => {
    expect(matchRung(0, 4).notes).toHaveLength(4);
    expect(note(2, 4).at).toBe(0.08);
    const sparkle = matchRung(2, 4).notes.filter((n) => n.sparkle);
    expect(sparkle).toHaveLength(1);
    expect(sparkle[0].freq).toBe(note(2, 4).freq * 2);
  });

  it('climbs, every pair higher than the one before', () => {
    [4, 5].forEach((pairs) => {
      const freqs = Array.from({ length: pairs }, (_, pair) => note(pair, pairs).freq);
      freqs.forEach((f, i) => {
        if (i > 0) expect(f).toBeGreaterThan(freqs[i - 1]);
      });
    });
  });

  it('tops out on the note the correct cue holds, however many pairs', () => {
    expect(note(3, 4).freq).toBe(659.25);
    expect(note(4, 5).freq).toBe(659.25);
    // The cue that ends a clean board arrives already holding the note the
    // climb ended on, so the board resolves rather than restarting elsewhere.
    const peak = CUES.right.notes
      .filter((n) => !n.sparkle)
      .reduce((top, n) => Math.max(top, n.freq), 0);
    expect(peak).toBe(659.25);
  });

  it('clamps pair indexes past the ladder rather than throwing or descending', () => {
    expect(note(12, 20).freq).toBeGreaterThanOrEqual(note(5, 20).freq);
    expect(note(12, 20).freq).toBe(note(19, 20).freq);
  });

  it('reuses a room length the app already generates', () => {
    const lengths = Object.values(CUES).map((c) => c.tuning.tailSeconds);
    expect(lengths).toContain(matchRung(0, 4).tuning.tailSeconds);
    expect(matchRung(0, 4).tuning.tailSeconds).toBe(CUES.right.tuning.tailSeconds);
  });

  it('stays quieter than the session-complete fanfare', () => {
    const loudest = (notes: Note[]) =>
      notes.reduce((max, n) => Math.max(max, n.sparkle ? 0 : n.level), 0);
    const ceiling = loudest(CUES.complete.notes) * CUES.complete.tuning.level;
    const rung = matchRung(3, 4);
    expect(loudest(rung.notes) * rung.tuning.level).toBeLessThanOrEqual(ceiling);
  });

  /** The two grace notes rolling into a rung: everything under it in level. */
  const graces = (pair: number, pairs: number) =>
    matchRung(pair, pairs).notes.filter((n) => !n.sparkle && n.level < note(pair, pairs).level);

  it('strums upward into the rung, the rung landing last', () => {
    const rung = note(2, 4);
    const roll = matchRung(2, 4).notes.filter((n) => !n.sparkle && n.level < rung.level);
    expect(roll).toHaveLength(2);
    roll.forEach((n) => expect(n.freq).toBeLessThan(rung.freq));
    expect(roll[1].freq).toBeGreaterThan(roll[0].freq);
    expect(roll[1].at).toBeGreaterThan(roll[0].at);
    expect(rung.at).toBeGreaterThan(roll[1].at);
  });

  it('keeps the graces under the rung, so the climb is still heard on the rung', () => {
    const rung = note(2, 4);
    graces(2, 4).forEach((n) => expect(n.level).toBeLessThan(rung.level));
  });

  it('rolls inside the same pentatonic the ladder is cut from', () => {
    const scale = [246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25];
    [4, 5].forEach((pairs) => {
      Array.from({ length: pairs }, (_, pair) => pair).forEach((pair) => {
        matchRung(pair, pairs)
          .notes.filter((n) => !n.sparkle)
          .forEach((n) => expect(scale).toContain(n.freq));
      });
    });
  });

  it('leaves the graces narrow, so the roll blooms out into the wide rung', () => {
    graces(2, 4).forEach((n) => expect(n.spread).toBeUndefined());
  });

  it('voices the graces as triangles, like the cue they hand over to', () => {
    const moving = graces(2, 4);
    expect(moving).toHaveLength(2);
    moving.forEach((n) => expect(n.type).toBe('triangle'));
  });

  it('rings a brighter octave than the capstone rung, matching the cue on top', () => {
    const sparkle = (notes: Note[]) => notes.filter((n) => n.sparkle)[0];
    expect(sparkle(matchRung(2, 4).notes).level).toBe(0.013);
    expect(sparkle(matchRung(2, 4).notes).level).toBeGreaterThan(
      sparkle(climbNote(2, 4).notes).level,
    );
  });
});
