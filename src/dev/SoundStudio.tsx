/**
 * Sound studio: pick the success cue by ear, on the device it will be heard on.
 *
 * Temporary, and deliberately part of the production build rather than gated
 * behind `import.meta.env.DEV`: the whole point is to hear these through a
 * phone speaker on the deployed site, which a dev-only route cannot do. It is
 * lazily imported and linked from nowhere, so it costs the app nothing until
 * someone types the route. Delete this file, `soundVariants.ts` and the
 * `/sound` route once a cue is chosen.
 */

import { useCallback, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { DEFAULT_TUNING, playNotes, VOICES, type Tuning } from '../engine/feedback';
import { VARIANTS } from './soundVariants';
import './SoundStudio.css';

interface Knob {
  key: keyof Tuning;
  label: string;
  /** What moving it actually does, in listening terms. */
  hint: string;
  min: number;
  max: number;
  step: number;
  /** Rendered value, so seconds read as seconds. */
  format: (n: number) => string;
}

const KNOBS: Knob[] = [
  {
    key: 'level',
    label: 'Level',
    hint: 'Loudness of the whole cue',
    min: 0.2,
    max: 1.6,
    step: 0.05,
    format: (n) => `${Math.round(n * 100)}%`,
  },
  {
    key: 'width',
    label: 'Width',
    hint: 'How far the notes spread left and right. Headphones to judge this',
    min: 0,
    max: 1,
    step: 0.02,
    format: (n) => (n === 0 ? 'centred' : `${Math.round(n * 100)}%`),
  },
  {
    key: 'tail',
    label: 'Room',
    hint: 'How much of the cue reaches the reverb',
    min: 0,
    max: 0.8,
    step: 0.02,
    format: (n) => (n === 0 ? 'dry' : `${Math.round(n * 100)}%`),
  },
  {
    key: 'tailSeconds',
    label: 'Room length',
    hint: 'How long the space rings on after the note',
    min: 0.2,
    max: 2.4,
    step: 0.1,
    format: (n) => `${n.toFixed(1)}s`,
  },
  {
    key: 'sparkle',
    label: 'Sparkle',
    hint: 'The bright note on top. Zero removes it',
    min: 0,
    max: 2.5,
    step: 0.05,
    format: (n) => (n === 0 ? 'off' : `${n.toFixed(2)}x`),
  },
];

export function SoundStudio() {
  const [tuning, setTuning] = useState<Tuning>(DEFAULT_TUNING);
  const [chosen, setChosen] = useState(VARIANTS[0].id);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  const variant = VARIANTS.find((v) => v.id === chosen) ?? VARIANTS[0];

  const play = useCallback(
    (id: string) => {
      const next = VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
      setChosen(id);
      // Always audible here regardless of the Sound setting: this screen is
      // the setting.
      playNotes(next.notes, true, tuning);
    },
    [tuning],
  );

  const set = useCallback((key: keyof Tuning, value: number) => {
    setTuning((t) => ({ ...t, [key]: value }));
  }, []);

  // Nudging a slider replays the current pick, so you hear the change instead
  // of having to reach for play after every move.
  const commit = useCallback(() => {
    playNotes(variant.notes, true, tuning);
  }, [variant, tuning]);

  const recipe = [
    `Variant: ${variant.name}`,
    `level ${tuning.level.toFixed(2)}`,
    `width ${tuning.width.toFixed(2)}`,
    `room ${tuning.tail.toFixed(2)} at ${tuning.tailSeconds.toFixed(1)}s`,
    `sparkle ${tuning.sparkle.toFixed(2)}`,
  ].join(', ');

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(recipe).then(
      () => {
        setCopied(true);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
      },
      () => {
        // No clipboard permission. The line is on screen to read out anyway.
      },
    );
  }, [recipe]);

  return (
    <main className="studio">
      <header className="studio__head">
        <h1 className="studio__title">Sound studio</h1>
        <p className="studio__lede">
          Tap a cue to hear it. The sliders apply to whichever one is selected, and every change
          replays it. Judge on the phone speaker first, then headphones for width.
        </p>
      </header>

      <section className="studio__section">
        <h2 className="studio__label">Correct answer</h2>
        <ul className="studio__list">
          {VARIANTS.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className={`cue${v.id === chosen ? ' cue--on' : ''}`}
                onClick={() => play(v.id)}
                aria-pressed={v.id === chosen}
              >
                <span className="cue__name">{v.name}</span>
                <span className="cue__blurb">{v.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="studio__section">
        <h2 className="studio__label">Shape</h2>
        <div className="studio__knobs">
          {KNOBS.map((knob) => (
            <div className="knob" key={knob.key}>
              <label className="knob__top" htmlFor={`knob-${knob.key}`}>
                <span className="knob__name">{knob.label}</span>
                <span className="knob__value">{knob.format(tuning[knob.key])}</span>
              </label>
              <input
                id={`knob-${knob.key}`}
                className="knob__range"
                type="range"
                min={knob.min}
                max={knob.max}
                step={knob.step}
                value={tuning[knob.key]}
                onChange={(e) => set(knob.key, Number(e.target.value))}
                onPointerUp={commit}
                onKeyUp={commit}
              />
              <p className="knob__hint">{knob.hint}</p>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={() => setTuning(DEFAULT_TUNING)}>
          Reset the sliders
        </Button>
      </section>

      <section className="studio__section">
        <h2 className="studio__label">In context</h2>
        <p className="studio__note">
          The other two cues, so you can hear how the pick sits next to them. These use the sliders
          too.
        </p>
        <div className="studio__row">
          <Button variant="secondary" onClick={() => playNotes(VOICES.wrong, true, tuning)}>
            Wrong answer
          </Button>
          <Button variant="secondary" onClick={() => playNotes(VOICES.complete, true, tuning)}>
            Session complete
          </Button>
        </div>
      </section>

      <section className="studio__section">
        <h2 className="studio__label">Your pick</h2>
        <p className="studio__recipe">{recipe}</p>
        <Button onClick={copy}>{copied ? 'Copied' : 'Copy this line'}</Button>
        <p className="studio__note">Send me that line and I will make it the default.</p>
      </section>
    </main>
  );
}
