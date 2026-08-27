import { create } from 'zustand';
import {
  applyResult,
  dueExercises,
  newProgress,
  trackTally,
  type ExerciseProgress,
  type Result,
  type TrackTally,
} from '../engine/leitner';
import { completeSession as advanceStreak, decayStreak } from '../engine/streak';
import { xpForResult, xpForStreak, XP_SESSION_COMPLETE } from '../engine/xp';
import { todayKey } from '../engine/dates';
import { trackExerciseIds } from '../content';
import type { TrackId } from '../content/types';
import { debounce, load, save, type Persisted, type Settings } from './persistence';

/**
 * The single app store. Persisted state mirrors the `Persisted` document; the
 * rest is derived on demand (docs/04. Track mastery, due lists and session
 * composition are never written to disk).
 */

interface StoreState extends Persisted {
  lastOpenedTrackId?: TrackId;

  recordAnswer: (exerciseId: string, result: Result) => void;
  finishSession: (results: Result[]) => { xpEarned: number; streakDays: number };
  openConceptCard: (cardId: string) => void;
  setLastOpenedTrack: (trackId: TrackId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: () => void;
  resetProgress: () => void;

  progressFor: (exerciseId: string) => ExerciseProgress | undefined;
  dueCount: () => number;
  trackTally: (trackId: TrackId) => TrackTally;
}

const persist = debounce((state: Persisted) => save(state), 500);

function persistable(state: StoreState): Persisted {
  return {
    schemaVersion: state.schemaVersion,
    onboarded: state.onboarded,
    xp: state.xp,
    streak: state.streak,
    exercises: state.exercises,
    conceptCardsOpened: state.conceptCardsOpened,
    settings: state.settings,
  };
}

export const useStore = create<StoreState>((set, get) => {
  const initial = load();
  // A streak can lapse while the app is closed; show the truth on open.
  const streak = decayStreak(initial.streak, todayKey());

  const commit = (patch: Partial<Persisted>) => {
    set(patch as Partial<StoreState>);
    persist(persistable(get()));
  };

  return {
    ...initial,
    streak,

    recordAnswer: (exerciseId, result) => {
      const today = todayKey();
      const state = get();
      const before = state.exercises[exerciseId] ?? newProgress(today);
      const after = applyResult(before, result, today);

      // Called once per exercise per session, on its *first* attempt, the
      // session player owns the re-queue loop and does not re-record retries.
      const earned = xpForResult(result);

      commit({
        exercises: { ...state.exercises, [exerciseId]: after },
        xp: {
          lifetime: state.xp.lifetime + earned,
          byDay: { ...state.xp.byDay, [today]: (state.xp.byDay[today] ?? 0) + earned },
        },
      });
    },

    finishSession: (results) => {
      const today = todayKey();
      const state = get();
      if (results.length === 0) return { xpEarned: 0, streakDays: state.streak.current };

      const nextStreak = advanceStreak(state.streak, today);
      const bonus = XP_SESSION_COMPLETE + xpForStreak(nextStreak.current);

      commit({
        streak: nextStreak,
        xp: {
          lifetime: state.xp.lifetime + bonus,
          byDay: { ...state.xp.byDay, [today]: (state.xp.byDay[today] ?? 0) + bonus },
        },
      });
      return { xpEarned: bonus, streakDays: nextStreak.current };
    },

    openConceptCard: (cardId) => {
      const state = get();
      if (state.conceptCardsOpened.includes(cardId)) return;
      commit({ conceptCardsOpened: [...state.conceptCardsOpened, cardId] });
    },

    setLastOpenedTrack: (trackId) => set({ lastOpenedTrackId: trackId }),

    updateSettings: (patch) => commit({ settings: { ...get().settings, ...patch } }),

    completeOnboarding: () => commit({ onboarded: true }),

    resetProgress: () => {
      const cleared: Persisted = {
        schemaVersion: get().schemaVersion,
        onboarded: true, // resetting progress should not replay the intro
        xp: { lifetime: 0, byDay: {} },
        streak: { current: 0, best: 0, lastActiveDay: null, freezes: 0 },
        exercises: {},
        conceptCardsOpened: [],
        settings: get().settings,
      };
      commit(cleared);
    },

    progressFor: (exerciseId) => get().exercises[exerciseId],
    dueCount: () => dueExercises(get().exercises, todayKey()).length,
    trackTally: (trackId) => trackTally(trackExerciseIds(trackId), get().exercises),
  };
});
