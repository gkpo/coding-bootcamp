import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Board } from '../capstone/Board';
import { CheckStrip, type CheckState } from '../capstone/CheckStrip';
import { Tray } from '../capstone/Tray';
import { addStage, give, take, trayFor, type TrayCounts } from '../capstone/tray';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CloseIcon } from '../components/icons';
import { getCapstone } from '../content';
import type { Capstone } from '../content/types';
import {
  evaluate,
  firstFailing,
  place,
  removePart,
  runMoves,
  startingBuild,
  toggleEdge,
  type Build,
  type CheckResult,
  type PartKind,
} from '../engine/archgraph';
import type { CapstoneProgress } from '../store/persistence';
import type { Result } from '../engine/leitner';
import { useStore } from '../store/useStore';
import './CapstoneScreen.css';

/**
 * The capstone board (docs/12 part C).
 *
 * The production-side twin of the design track: every other mechanic shows a
 * diagram and asks the user to judge it, and the interview asks them to draw
 * one. Grading is the check strip, which is visible from the first second, so
 * the user is building against a brief rather than guessing at an answer key.
 */
export function CapstoneScreen() {
  const { capstoneId } = useParams<{ capstoneId: string }>();
  const capstone = capstoneId ? getCapstone(capstoneId) : undefined;
  if (!capstone) return <Navigate to="/tracks" replace />;
  return <CapstoneRun capstone={capstone} />;
}

function CapstoneRun({ capstone }: { capstone: Capstone }) {
  const navigate = useNavigate();
  const saved = useStore((s) => s.capstones[capstone.id]);
  const noteHint = useStore((s) => s.noteCapstoneHint);
  const clearStage = useStore((s) => s.clearCapstoneStage);

  // Resolved once, on mount. The store moves as stages clear, and re-reading
  // it would restart the run under the user's hands.
  const [opening] = useState(() => resumePoint(capstone, saved));
  const [stageIndex, setStageIndex] = useState(opening.stageIndex);
  const [build, setBuild] = useState<Build>(opening.build);
  const [tray, setTray] = useState<TrayCounts>(opening.tray);

  const [armedPart, setArmedPart] = useState<number | null>(null);
  const [placing, setPlacing] = useState<PartKind | null>(null);

  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintTaken, setHintTaken] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [outcomes, setOutcomes] = useState<Result[]>([]);
  const [earned, setEarned] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);

  const stage = capstone.stages[stageIndex];
  const isFinalStage = stageIndex === capstone.stages.length - 1;

  // Every check authored so far, this stage's and all the earlier ones'. A
  // later stage can break an earlier guarantee, and the strip has to show it.
  const checksSoFar = useMemo(
    () => capstone.stages.slice(0, stageIndex + 1).flatMap((s) => s.checks),
    [capstone, stageIndex],
  );
  const passed = useMemo(() => new Map((results ?? []).map((r) => [r.id, r.pass])), [results]);
  const stateOf = (id: string): CheckState => {
    const pass = passed.get(id);
    return pass === undefined ? 'open' : pass ? 'pass' : 'fail';
  };
  // A bonus stays out of sight until it is earned: it must never read as one
  // more thing standing between the user and the stage.
  const visibleChecks = checksSoFar.filter((c) => c.bonus !== true || passed.get(c.id) === true);
  const hintTarget = cleared || results === null ? null : firstFailing(checksSoFar, results);
  const highlight = hintLevel >= 2 ? hintedKinds(checksSoFar, hintTarget) : [];

  const tapTray = (kind: PartKind) => {
    setArmedPart(null);
    setPlacing((current) => (current === kind ? null : kind));
  };

  const placeIn = (kind: PartKind) => {
    const next = place(build, kind);
    if (next === null) return;
    setBuild(next);
    setTray((counts) => take(counts, kind));
    setPlacing(null);
  };

  // One gesture for both jobs: the first tap arms a part, the second either
  // joins the two or, on the same part again, changes its mind.
  const tapPart = (id: number) => {
    setPlacing(null);
    if (armedPart === null || armedPart === id) {
      setArmedPart(armedPart === id ? null : id);
      return;
    }
    setBuild(toggleEdge(build, armedPart, id));
    setArmedPart(null);
  };

  const returnPart = () => {
    const part = build.parts.find((p) => p.id === armedPart);
    if (!part) return;
    setBuild(removePart(build, part.id));
    setTray((counts) => give(counts, part.kind));
    setArmedPart(null);
  };

  const takeHint = () => {
    setHintLevel((level) => Math.min(3, level + 1));
    if (hintTaken) return;
    setHintTaken(true);
    noteHint(capstone.id);
  };

  const runIt = () => {
    const outcome = evaluate(build, checksSoFar);
    setResults(outcome);
    setHintLevel(0);
    setArmedPart(null);
    setPlacing(null);
    if (firstFailing(checksSoFar, outcome) !== null) return;

    // Banked here rather than inside the state updater: an updater runs during
    // render, where writing to the store is both a React warning and, under
    // StrictMode's double invocation, a second helping of XP.
    const paid = clearStage(capstone.id, {
      index: stageIndex,
      total: capstone.stages.length,
      hintTaken,
    });
    setEarned((total) => total + paid);
    setOutcomes((list) => [...list, hintTaken ? 'unsure' : 'right']);
    setCleared(true);
  };

  const goOn = () => {
    if (isFinalStage) {
      navigate('/session/summary', {
        replace: true,
        state: {
          results: outcomes,
          xpEarned: 0,
          streakDays: 0,
          conceptIds: capstone.conceptIds,
          capstone: { title: capstone.title },
          totalXp: earned,
        },
      });
      return;
    }
    const next = stageIndex + 1;
    setStageIndex(next);
    setTray((counts) => addStage(counts, capstone.stages[next]));
    setHintTaken(false);
    setHintLevel(0);
    setCleared(false);
  };

  return (
    <div className="capstone">
      <header className="capstone__bar">
        <button
          type="button"
          className="capstone__close"
          aria-label="Leave this capstone"
          onClick={() => setConfirmExit(true)}
        >
          <CloseIcon />
        </button>
        <div
          className="capstone__stages"
          aria-label={`Stage ${stageIndex + 1} of ${capstone.stages.length}`}
        >
          {capstone.stages.map((s, i) => (
            <span
              key={s.requirement}
              className={`capstone__stage${i < stageIndex + (cleared ? 1 : 0) ? ' is-done' : ''}`}
            />
          ))}
        </div>
      </header>

      <main className="capstone__body">
        <section className="card capstone__brief">
          <p className="capstone__kicker">
            {cleared ? 'Stage cleared' : `Stage ${stageIndex + 1} of ${capstone.stages.length}`}
          </p>
          {stageIndex === 0 && !cleared && (
            <p className="capstone__scenario">{capstone.scenario}</p>
          )}
          <p className="capstone__requirement">{cleared ? stage.clearLine : stage.requirement}</p>
        </section>

        <Board
          build={build}
          armedPartId={armedPart}
          placing={placing}
          highlight={highlight}
          onPlace={placeIn}
          onTapPart={tapPart}
        />

        {armedPart !== null && (
          <Button variant="ghost" className="capstone__return" onClick={returnPart}>
            Return to tray
          </Button>
        )}

        <CheckStrip
          checks={visibleChecks}
          state={(check) => stateOf(check.id)}
          hintTargetId={hintTarget}
          hintLevel={hintLevel}
          onHint={takeHint}
          sayItFor={stage.checks.map((check) => check.id)}
        />

        <Tray counts={tray} armed={placing} onTap={tapTray} />
      </main>

      <footer className="capstone__cta">
        <Button onClick={cleared ? goOn : runIt} quiet>
          {cleared ? (isFinalStage ? 'Finish' : 'Next stage') : 'Run it'}
        </Button>
      </footer>

      {confirmExit && (
        <ConfirmDialog
          title="Leave this capstone?"
          body="The stages you have already cleared are kept. This one starts again from the brief."
          stayLabel="Keep building"
          leaveLabel="Leave"
          onStay={() => setConfirmExit(false)}
          onLeave={() => navigate(`/tracks/${capstone.trackId}`)}
        />
      )}
    </div>
  );
}

/**
 * Where a run picks up.
 *
 * Cleared stages persist but the board they were built on does not: progress
 * stores a stage count and nothing else (docs/12 part B). So a resumed run
 * opens on the worked solution's board for the stages already behind it, which
 * is the only board the app can honestly reconstruct. A finished capstone
 * opens from the top, because replaying it is why it stays on the path.
 */
function resumePoint(capstone: Capstone, saved: CapstoneProgress | undefined) {
  const done = saved?.stagesCleared ?? 0;
  const stageIndex = done >= capstone.stages.length ? 0 : done;
  const build =
    stageIndex === 0 ? startingBuild(capstone) : runMoves(capstone).stageBuilds[stageIndex - 1];
  return { stageIndex, build, tray: trayFor(capstone, stageIndex, build) };
}

/** The parts a level-2 hint points at, for the check currently being hinted. */
function hintedKinds(checks: Capstone['stages'][number]['checks'], targetId: string | null) {
  if (targetId === null) return [];
  return checks.find((check) => check.id === targetId)?.hintPoint.highlight ?? [];
}
