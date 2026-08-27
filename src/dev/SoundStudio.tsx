/**
 * Sound studio: pick cues by ear, on the device they will be heard on.
 *
 * Temporary, and deliberately part of the production build rather than gated
 * behind `import.meta.env.DEV`: the whole point is to hear these through a
 * phone speaker on the deployed site, which a dev-only route cannot do. It is
 * lazily imported and linked from nowhere, so it costs the app nothing until
 * someone types the route. Delete this file, `soundVariants.ts` and the
 * `/sound` route once both families are settled.
 */

import { useCallback, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { playNotes, type Tuning } from '../engine/feedback';
import { FAMILIES, type Family } from './soundVariants';
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

/**
 * The ranges are wider than the first round's. Three of the five were pinned
 * at their maximum by the winning pick, which is the studio saying its limits
 * were set too politely rather than the ear saying it had found the edge.
 */
const KNOBS: Knob[] = [
  {
    key: 'level',
    label: 'Level',
    hint: 'Loudness of the whole cue',
    min: 0.2,
    max: 2.4,
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
    max: 1.6,
    step: 0.02,
    format: (n) => (n === 0 ? 'dry' : `${Math.round(n * 100)}%`),
  },
  {
    key: 'tailSeconds',
    label: 'Room length',
    hint: 'How long the space rings on after the note',
    min: 0.2,
    max: 5,
    step: 0.1,
    format: (n) => `${n.toFixed(1)}s`,
  },
  {
    key: 'sparkle',
    label: 'Sparkle',
    hint: 'The bright notes on top. Zero removes them',
    min: 0,
    max: 6,
    step: 0.1,
    format: (n) => (n === 0 ? 'off' : `${n.toFixed(1)}x`),
  },
];

type Picks = Record<Family['id'], { variantId: string; tuning: Tuning }>;

const initialPicks = (): Picks =>
  FAMILIES.reduce((acc, family) => {
    acc[family.id] = { variantId: family.variants[0].id, tuning: family.tuning };
    return acc;
  }, {} as Picks);

export function SoundStudio() {
  const [picks, setPicks] = useState<Picks>(initialPicks);
  const [focus, setFocus] = useState<Family['id']>(FAMILIES[0].id);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  const family = FAMILIES.find((f) => f.id === focus) ?? FAMILIES[0];
  const pick = picks[family.id];
  const notesFor = (id: Family['id']) => {
    const f = FAMILIES.find((x) => x.id === id);
    return f?.variants.find((v) => v.id === picks[id].variantId)?.notes ?? [];
  };

  const play = useCallback(
    (familyId: Family['id'], variantId: string) => {
      const f = FAMILIES.find((x) => x.id === familyId);
      const notes = f?.variants.find((v) => v.id === variantId)?.notes;
      if (!notes) return;
      setFocus(familyId);
      setPicks((p) => ({ ...p, [familyId]: { ...p[familyId], variantId } }));
      // Always audible here regardless of the Sound setting: this screen is
      // the setting.
      playNotes(notes, true, picks[familyId].tuning);
    },
    [picks],
  );

  const set = useCallback(
    (key: keyof Tuning, value: number) => {
      setPicks((p) => ({
        ...p,
        [focus]: { ...p[focus], tuning: { ...p[focus].tuning, [key]: value } },
      }));
    },
    [focus],
  );

  // Letting go of a slider replays the focused cue, so you hear the change
  // instead of having to reach for play after every move.
  const commit = useCallback(() => {
    playNotes(notesFor(focus), true, picks[focus].tuning);
    // notesFor reads the same state this depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, picks]);

  const line = (f: Family) => {
    const p = picks[f.id];
    const name = f.variants.find((v) => v.id === p.variantId)?.name ?? p.variantId;
    return [
      `${f.label}: ${name}`,
      `level ${p.tuning.level.toFixed(2)}`,
      `width ${p.tuning.width.toFixed(2)}`,
      `room ${p.tuning.tail.toFixed(2)} at ${p.tuning.tailSeconds.toFixed(1)}s`,
      `sparkle ${p.tuning.sparkle.toFixed(1)}`,
    ].join(', ');
  };
  const recipe = FAMILIES.map(line).join('\n');

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(recipe).then(
      () => {
        setCopied(true);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
      },
      () => {
        // No clipboard permission. The lines are on screen to read out anyway.
      },
    );
  }, [recipe]);

  return (
    <main className="studio">
      <header className="studio__head">
        <h1 className="studio__title">Sound studio</h1>
        <p className="studio__lede">
          Tap a cue to hear it. The sliders below apply to whichever cue you last tapped, and every
          change replays it. Each family keeps its own settings. The two marked chosen are what the
          app plays today, kept here to judge the new ones against.
        </p>
      </header>

      {FAMILIES.map((f) => (
        <section className="studio__section" key={f.id}>
          <h2 className="studio__label">{f.label}</h2>
          <ul className="studio__list">
            {f.variants.map((v) => {
              const on = picks[f.id].variantId === v.id;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    className={`cue${on ? ' cue--on' : ''}`}
                    onClick={() => play(f.id, v.id)}
                    aria-pressed={on}
                  >
                    <span className="cue__name">{v.name}</span>
                    <span className="cue__blurb">{v.blurb}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="studio__section">
        <h2 className="studio__label">Shape</h2>
        <p className="studio__note">
          Editing <strong>{family.label.toLowerCase()}</strong>. Tap a cue above to switch.
        </p>
        <div className="studio__knobs">
          {KNOBS.map((knob) => (
            <div className="knob" key={knob.key}>
              <label className="knob__top" htmlFor={`knob-${knob.key}`}>
                <span className="knob__name">{knob.label}</span>
                <span className="knob__value">{knob.format(pick.tuning[knob.key])}</span>
              </label>
              <input
                id={`knob-${knob.key}`}
                className="knob__range"
                type="range"
                min={knob.min}
                max={knob.max}
                step={knob.step}
                value={pick.tuning[knob.key]}
                onChange={(e) => set(knob.key, Number(e.target.value))}
                onPointerUp={commit}
                onKeyUp={commit}
              />
              <p className="knob__hint">{knob.hint}</p>
            </div>
          ))}
        </div>
        <div className="studio__row">
          <Button
            variant="secondary"
            onClick={() =>
              setPicks((p) => ({ ...p, [family.id]: { ...p[family.id], tuning: family.tuning } }))
            }
          >
            Reset sliders
          </Button>
          <Button variant="secondary" onClick={commit}>
            Play again
          </Button>
        </div>
      </section>

      <section className="studio__section">
        <h2 className="studio__label">Your picks</h2>
        <p className="studio__recipe">{recipe}</p>
        <Button onClick={copy}>{copied ? 'Copied' : 'Copy these lines'}</Button>
        <p className="studio__note">Send me those and I will make them the defaults.</p>
      </section>
    </main>
  );
}
