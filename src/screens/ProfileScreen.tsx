import { useState } from 'react';
import { Button } from '../components/Button';
import { FlameIcon } from '../components/icons';
import { tracks } from '../content';
import { ConceptIcon } from '../components/ConceptIcon';
import { ProgressBar } from '../components/ProgressBar';
import { addDays, startOfWeek, todayKey, weekdayIndex } from '../engine/dates';
import { useStore } from '../store/useStore';
import './ProfileScreen.css';

const WEEKS = 5;

/** Both indexed by `weekdayIndex`, so Monday first. */
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Row labels for the calendar, oldest week first. */
function weekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'This week';
  if (weeksAgo === 1) return 'Last week';
  return `${weeksAgo} wks ago`;
}

export function ProfileScreen() {
  const today = todayKey();
  const streak = useStore((s) => s.streak);
  const xp = useStore((s) => s.xp);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetProgress = useStore((s) => s.resetProgress);
  const trackTally = useStore((s) => s.trackTally);

  const [confirmingReset, setConfirmingReset] = useState(0);

  // Five whole calendar weeks, the current one last, each row Monday to Sunday
  // and each column one weekday. A trailing 35-day window would put today in
  // the last cell whatever day it is, which shears every column off its
  // weekday and makes the grid read as if it ran backwards.
  const calendarStart = addDays(startOfWeek(today), -7 * (WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, w) => ({
    label: weekLabel(WEEKS - 1 - w),
    isCurrent: w === WEEKS - 1,
    days: Array.from({ length: 7 }, (_, d) => addDays(calendarStart, w * 7 + d)),
  }));

  // The bars are the trailing seven days, oldest first, ending on today.
  const recent = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const weekXp = recent.map((d) => xp.byDay[d] ?? 0);
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
        <h2 className="profile__section">Last 7 days</h2>
        <div className="profile__bars">
          {recent.map((day, i) => (
            <span className={`profile__bar-col ${day === today ? 'is-today' : ''}`} key={day}>
              <span className="profile__bar">
                <span
                  className="profile__bar-fill"
                  style={{ height: `${Math.max(3, (weekXp[i] / weekMax) * 100)}%` }}
                />
              </span>
              <span className="profile__bar-label" aria-hidden>
                {DAY_SHORT[weekdayIndex(day)]}
              </span>
            </span>
          ))}
        </div>
        <p className="profile__hint">{weekXp.reduce((a, b) => a + b, 0)} XP in the last 7 days</p>
      </section>

      <section className="card">
        <h2 className="profile__section">Last 5 weeks</h2>
        <div className="profile__calendar" aria-label="Practice calendar">
          {weeks.map((week) => (
            <div className={`profile__week ${week.isCurrent ? 'is-current' : ''}`} key={week.label}>
              <span className="profile__week-label">{week.label}</span>
              <div className="profile__week-days">
                {week.days.map((day) => {
                  // Days later this week have not happened yet, so they are
                  // drawn as holes rather than as missed days.
                  const future = day > today;
                  const practiced = (xp.byDay[day] ?? 0) > 0;
                  return (
                    <span
                      key={day}
                      className={`profile__day ${practiced ? 'is-on' : ''} ${day === today ? 'is-today' : ''} ${future ? 'is-future' : ''}`}
                      title={future ? undefined : day}
                    >
                      <span className="visually-hidden">
                        {DAY_NAMES[weekdayIndex(day)]}
                        {future ? ': still to come' : practiced ? ': practiced' : ': not practiced'}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
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
        <p className="profile__note">
          The solid bar is mastered: answered right four times, each time after a longer gap. The
          pale bar behind it is everything you have seen at least once.
        </p>
        <div className="profile__mastery">
          {tracks.map((track) => {
            const tally = trackTally(track.id);
            return (
              <div className="profile__track" key={track.id}>
                <span className="profile__track-name">
                  <span style={{ color: `var(--track-${track.id})` }}>
                    <ConceptIcon name={track.icon} size={18} />
                  </span>
                  {track.title}
                </span>
                <ProgressBar className="profile__track-bar" tally={tally} trackId={track.id} />
                <span className="profile__track-pct">
                  {tally.mastered} of {tally.total}
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
