import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExerciseFrame, type Outcome } from '../exercises/ExerciseFrame';
import { FeedbackPanel } from '../exercises/FeedbackPanel';
import { ExerciseRenderer } from '../exercises/ExerciseRenderer';
import { RevealedAnswer } from '../exercises/RevealedAnswer';
import { needsExplicitReveal } from '../engine/grading';
import { getExercise, tracks, trackExerciseIds } from '../content';
import { composeSession } from '../engine/sessionComposer';
import { dueExercises } from '../engine/leitner';
import {
  answer as answerSession,
  currentExerciseId,
  isComplete,
  resultsInOrder,
  startSession,
  toughestExerciseId,
  type SessionState,
} from '../engine/sessionRunner';
import { randomSeed } from '../engine/shuffle';
import { todayKey } from '../engine/dates';
import { useStore } from '../store/useStore';
import { playTone, vibrate } from '../engine/feedback';
import { CloseIcon } from '../components/icons';
import './SessionScreen.css';

type Answered = { outcome: Outcome; whyWrong?: string } | null;

const DECODER_TRACK = 't6';

export function SessionScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reviewOnly = params.get('mode') === 'review';
  const exercisesProgress = useStore((s) => s.exercises);
  const lastOpenedTrackId = useStore((s) => s.lastOpenedTrackId);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const haptics = useStore((s) => s.settings.haptics);
  const sound = useStore((s) => s.settings.sound);
  const finishSession = useStore((s) => s.finishSession);

  // Composed once per mount: the session must not reshuffle under the user
  // when the store updates after every answer.
  const [plan] = useState(() =>
    reviewOnly
      ? dueExercises(exercisesProgress, todayKey()).filter((id) => getExercise(id) !== undefined)
      : composeSession({
          tracks: tracks.map((t) => ({ id: t.id, exerciseIds: trackExerciseIds(t.id) })),
          decoderExerciseIds: trackExerciseIds(DECODER_TRACK),
          progress: exercisesProgress,
          today: todayKey(),
          seed: randomSeed(),
          lastOpenedTrackId,
        }),
  );
  const [seed] = useState(() => randomSeed());
  const [session, setSession] = useState<SessionState>(() => startSession(plan));
  const [answered, setAnswered] = useState<Answered>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const exerciseId = currentExerciseId(session);
  const exercise = exerciseId ? getExercise(exerciseId) : undefined;
  const cleared = session.cleared.length;
  const total = plan.length;

  // Total presentations so far. This is the only part of the session state
  // that always moves: `cleared` and `queue.length` both stay put when an
  // item is re-queued, which would hand a missed exercise back with its
  // options in exactly the same order (docs/04 forbids positionally learnable
  // answers, and it also made the queue impossible to drain).
  const presentations = useMemo(
    () => Object.values(session.attempts).reduce((sum, n) => sum + n, 0),
    [session.attempts],
  );

  const presentationSeed = useMemo(
    () => seed + presentations * 8191 + (exerciseId ? exerciseId.length * 7 : 0),
    [seed, presentations, exerciseId],
  );

  const resolve = useCallback(
    (outcome: Outcome, whyWrong?: string) => {
      if (!exerciseId) return;
      // Record only the first attempt; the runner keeps the first outcome.
      if (session.firstResults[exerciseId] === undefined) {
        recordAnswer(exerciseId, outcome);
      }
      const kind = outcome === 'right' ? 'right' : 'wrong';
      vibrate(kind, haptics);
      playTone(kind, sound);
      setAnswered({ outcome, whyWrong });
    },
    [exerciseId, recordAnswer, session.firstResults, haptics, sound],
  );

  const onContinue = useCallback(() => {
    if (!answered) return;
    const next = answerSession(session, answered.outcome);
    setAnswered(null);

    if (isComplete(next)) {
      const results = resultsInOrder(next, plan);
      const { xpEarned, streakDays } = finishSession(results);
      navigate('/session/summary', {
        replace: true,
        state: {
          results,
          xpEarned,
          streakDays,
          toughestId: toughestExerciseId(next),
          conceptIds: [...new Set(plan.map((id) => getExercise(id)?.conceptId))].filter(Boolean),
        },
      });
      return;
    }
    setSession(next);
  }, [answered, session, plan, finishSession, navigate]);

  if (!exercise) {
    return (
      <div className="session">
        <p className="screen-lede">No exercises available yet.</p>
      </div>
    );
  }

  const revealed = answered !== null;

  return (
    <div className="session">
      <header className="session__bar">
        <button
          type="button"
          className="session__close"
          aria-label="Abandon session"
          onClick={() => setConfirmExit(true)}
        >
          <CloseIcon />
        </button>
        <div className="session__segments" aria-label={`${cleared} of ${total} done`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`session__segment ${i < cleared ? 'is-done' : ''}`} />
          ))}
        </div>
      </header>

      <main className="session__body">
        <div className="session__slide" key={presentations}>
          <ExerciseFrame
            exercise={exercise}
            // spot-bug renders the snippet itself as tappable lines.
            suppressCode={exercise.type === 'spot-bug'}
            showUnsure={!revealed}
            onUnsure={() => resolve('unsure')}
            feedback={
              answered && (
                <FeedbackPanel
                  outcome={answered.outcome}
                  explanation={exercise.explanation}
                  whyWrong={answered.whyWrong}
                  sayIt={exercise.type === 'complexity' ? exercise.sayIt : undefined}
                  reveal={
                    answered.outcome !== 'right' && needsExplicitReveal(exercise.type) ? (
                      <RevealedAnswer exercise={exercise} />
                    ) : undefined
                  }
                  onContinue={onContinue}
                  seed={presentationSeed}
                  isLast={session.queue.length === 1 && answered.outcome === 'right'}
                />
              )
            }
          >
            <ExerciseRenderer
              key={`${exercise.id}-${presentations}`}
              exercise={exercise}
              seed={presentationSeed}
              revealed={revealed}
              onResolve={resolve}
            />
          </ExerciseFrame>
        </div>
      </main>

      {confirmExit && (
        <div className="confirm-layer">
          <div className="confirm" role="dialog" aria-modal="true">
            <p className="confirm__title">Leave this session?</p>
            <p className="confirm__body">
              The answers you have already given are kept. The rest of the session is discarded.
            </p>
            <div className="confirm__actions">
              <button type="button" className="confirm__stay" onClick={() => setConfirmExit(false)}>
                Keep going
              </button>
              <button type="button" className="confirm__leave" onClick={() => navigate('/')}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
