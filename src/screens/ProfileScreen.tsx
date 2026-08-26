import { useState } from 'react';
import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import { tracks, trackExerciseIds } from '../content';
import { ConceptIcon } from '../components/ConceptIcon';
import { addDays, todayKey } from '../engine/dates';
import { useStore } from '../store/useStore';
import './ProfileScreen.css';

const WEEKS = 5;

export function ProfileScreen() {
  const today = todayKey();
  const streak = useStore((s) => s.streak);
  const xp = useStore((s) => s.xp);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetProgress = useStore((s) => s.resetProgress);
  const trackMastery = useStore((s) => s.trackMastery);

  const [confirmingReset, setConfirmingReset] = useState(0);

  // Trailing 35 days, oldest first, so the calendar reads left to right.
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(today, i - (WEEKS * 7 - 1)));
  const weekXp = days.slice(-7).map((d) => xp.byDay[d] ?? 0);
  const weekMax = Math.max(10, ...weekXp);

  const onReset = () => {
    if (confirmingReset === 0) {
      setConfirmingReset(1);
      return;
    }
    if (confirmingReset === 1) {
      setConfirmingReset(2);
      return;
    }
    resetProgress();
    setConfirmingReset(0);
  };

  return (
    <div className="stack">
      <div>
        <h1 className="screen-title">Me</h1>
        <p className="screen-lede">Everything is stored on this device only.</p>
      </div>

      <section className="card profile__hero">
        <div className="profile__stat">
          {/* Inline, so all three stats share one baseline. */}
          <span className="profile__number">
            <span className={`profile__flame ${streak.current > 0 ? 'is-lit' : ''}`}>
              <FlameIcon size={20} />
            </span>
            {streak.current}
          </span>
          <span className="profile__label">day streak</span>
        </div>
        <div className="profile__stat">
          <span className="profile__number">{xp.lifetime}</span>
          <span className="profile__label">total XP</span>
        </div>
        <div className="profile__stat">
          <span className="profile__number">{streak.best}</span>
          <span className="profile__label">best streak</span>
        </div>
      </section>

      <section className="card">
        <h2 className="profile__section">This week</h2>
        <div className="profile__bars">
          {weekXp.map((value, i) => (
            <span className="profile__bar" key={i}>
              <span
                className="profile__bar-fill"
                style={{ height: `${Math.max(3, (value / weekMax) * 100)}%` }}
              />
            </span>
          ))}
        </div>
        <p className="profile__hint">{weekXp.reduce((a, b) => a + b, 0)} XP in the last 7 days</p>
      </section>

      <section className="card">
        <h2 className="profile__section">Last 5 weeks</h2>
        <div className="profile__calendar" aria-label="Practice calendar">
          {days.map((day) => (
            <span
              key={day}
              className={`profile__day ${(xp.byDay[day] ?? 0) > 0 ? 'is-on' : ''} ${day === today ? 'is-today' : ''}`}
              title={day}
            />
          ))}
        </div>
        {streak.freezes > 0 && (
          <p className="profile__hint">
            {streak.freezes} streak {streak.freezes === 1 ? 'freeze' : 'freezes'} banked, a missed
            day spends one automatically.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="profile__section">Mastery</h2>
        <div className="profile__mastery">
          {tracks.map((track) => {
            const mastery = trackMastery(track.id);
            return (
              <div className="profile__track" key={track.id}>
                <span className="profile__track-name">
                  <span style={{ color: `var(--track-${track.id})` }}>
                    <ConceptIcon name={track.icon} size={18} />
                  </span>
                  {track.title}
                </span>
                <span className="profile__track-bar">
                  <span
                    className="profile__track-fill"
                    style={{ width: `${mastery * 100}%`, background: `var(--track-${track.id})` }}
                  />
                </span>
                <span className="profile__track-pct">
                  {Math.round(mastery * trackExerciseIds(track.id).length)}/
                  {trackExerciseIds(track.id).length}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2 className="profile__section">Settings</h2>
        <Toggle
          label="Sound"
          checked={settings.sound}
          onChange={(sound) => updateSettings({ sound })}
        />
        <Toggle
          label="Haptics"
          checked={settings.haptics}
          onChange={(haptics) => updateSettings({ haptics })}
        />
        <Toggle
          label="Reduce motion"
          checked={settings.reduceMotion}
          onChange={(reduceMotion) => updateSettings({ reduceMotion })}
        />
      </section>

      <section className="card">
        <h2 className="profile__section">Reset</h2>
        <p className="profile__hint">
          {confirmingReset === 0 && 'Clears every streak, all XP and all review progress.'}
          {confirmingReset === 1 && 'This cannot be undone. Tap again to confirm.'}
          {confirmingReset === 2 && 'Last chance. Tap once more to erase everything.'}
        </p>
        <div className="profile__reset">
          <Button variant="secondary" onClick={onReset}>
            {confirmingReset === 0 ? 'Reset progress' : 'Yes, reset everything'}
          </Button>
          {confirmingReset > 0 && (
            <button type="button" className="profile__cancel" onClick={() => setConfirmingReset(0)}>
              Cancel
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle">
      <span className="toggle__label">{label}</span>
      <input
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}
