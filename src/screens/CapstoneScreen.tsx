import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Board, type Centers } from '../capstone/Board';
import { CheckStrip, type CheckState } from '../capstone/CheckStrip';
import { Tray } from '../capstone/Tray';
import { planRun } from '../capstone/flowRun';
import { playRun } from '../capstone/playRun';
import { replayFrom, slide, snapshotRects, type Rects } from '../capstone/flip';
import { motionOff, STAGGER, STANDARD } from '../capstone/motion';
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
import { playTone, vibrate } from '../engine/feedback';
import type { CapstoneProgress } from '../store/persistence';
import type { Result } from '../engine/leitner';
import { useStore } from '../store/useStore';
import './CapstoneScreen.css';

/**
 * The capstone board (docs/12 parts C and D).
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

/** What a placement has to walk back from once the layout has moved on. */
interface PendingFlip {
  partId: number;
  from: DOMRect | null;
  tray: Rects;
}

function CapstoneRun({ capstone }: { capstone: Capstone }) {
  const navigate = useNavigate();
  const saved = useStore((s) => s.capstones[capstone.id]);
  const noteHint = useStore((s) => s.noteCapstoneHint);
  const clearStage = useStore((s) => s.clearCapstoneStage);
  const sound = useStore((s) => s.settings.sound);
  const haptics = useStore((s) => s.settings.haptics);

  // Resolved once, on mount. The store moves as stages clear, and re-reading
  // it would restart the run under the user's hands.
  const [opening] = useState(() => resumePoint(capstone, saved));
  const [stageIndex, setStageIndex] = useState(opening.stageIndex);
  const [build, setBuild] = useState<Build>(opening.build);
  const [tray, setTray] = useState<TrayCounts>(opening.tray);

  const [armedPart, setArmedPart] = useState<number | null>(null);
  const [placing, setPlacing] = useState<PartKind | null>(null);
  const [arriving, setArriving] = useState<PartKind[]>([]);

  const [outcome, setOutcome] = useState<CheckResult[] | null>(null);
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [hitPartId, setHitPartId] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintTaken, setHintTaken] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [outcomes, setOutcomes] = useState<Result[]>([]);
  const [earned, setEarned] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);

  const bodyRef = useRef<HTMLElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const geometry = useRef<Centers>({});
  const pendingFlip = useRef<PendingFlip | null>(null);
  const stopRun = useRef<(() => void) | null>(null);

  const stage = capstone.stages[stageIndex];
  const isFinalStage = stageIndex === capstone.stages.length - 1;

  // Every check authored so far, this stage's and all the earlier ones'. A
  // later stage can break an earlier guarantee, and the strip has to show it.
  const checksSoFar = useMemo(
    () => capstone.stages.slice(0, stageIndex + 1).flatMap((s) => s.checks),
    [capstone, stageIndex],
  );
  const stateOf = (id: string): CheckState => {
    const pass = resolved[id];
    return pass === undefined ? 'open' : pass ? 'pass' : 'fail';
  };
  // A bonus stays out of sight until it is earned: it must never read as one
  // more thing standing between the user and the stage.
  const visibleChecks = checksSoFar.filter((c) => c.bonus !== true || resolved[c.id] === true);
  const hintTarget =
    cleared || running || outcome === null ? null : firstFailing(checksSoFar, outcome);
  const highlight = hintLevel >= 2 ? hintedKinds(checksSoFar, hintTarget) : [];

  const rememberGeometry = useCallback((centers: Centers) => {
    geometry.current = centers;
  }, []);

  useEffect(() => () => stopRun.current?.(), []);

  // The arrival is a one-off welcome, not a property of the chip: left on, it
  // would replay every time a part came back to the tray.
  useEffect(() => {
    if (arriving.length === 0) return;
    const timer = setTimeout(() => setArriving([]), STANDARD + arriving.length * STAGGER);
    return () => clearTimeout(timer);
  }, [arriving]);

  // The walk-back, after the browser has laid the new arrangement out: the
  // placed chip from where it sat in the tray, and the tray closing its gap.
  useLayoutEffect(() => {
    const pending = pendingFlip.current;
    if (!pending) return;
    pendingFlip.current = null;
    const chip = bodyRef.current?.querySelector<HTMLElement>(`[data-part="${pending.partId}"]`);
    if (chip && pending.from) slide(chip, pending.from, STANDARD);
    replayFrom(bodyRef.current, 'data-tray', pending.tray, STANDARD);
  });

  const tapTray = (kind: PartKind) => {
    if (running) return;
    setArmedPart(null);
    setPlacing((current) => (current === kind ? null : kind));
  };

  const placeIn = (kind: PartKind) => {
    if (running) return;
    const next = place(build, kind);
    if (next === null) return;
    pendingFlip.current = {
      partId: next.parts[next.parts.length - 1].id,
      from:
        bodyRef.current?.querySelector(`[data-tray="${kind}"]`)?.getBoundingClientRect() ?? null,
      tray: snapshotRects(bodyRef.current, 'data-tray'),
    };
    setBuild(next);
    setTray((counts) => take(counts, kind));
    setPlacing(null);
  };

  // One gesture for both jobs: the first tap arms a part, the second either
  // joins the two or, on the same part again, changes its mind.
  const tapPart = (id: number) => {
    if (running) return;
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
    if (!part || running) return;
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

  /**
   * One cue per run, never one per check: the run is the answer, and a sound
   * for every ring would turn a two-second beat into a slot machine.
   */
  const finish = (halted: boolean, stoppedAt: PartKind | null) => {
    setRunning(false);
    stopRun.current = null;

    if (halted) {
      const part = stoppedAt ? build.parts.find((p) => p.kind === stoppedAt) : undefined;
      setHitPartId(part?.id ?? null);
      playTone('wrong', sound);
      vibrate('wrong', haptics);
      return;
    }
    playTone('right', sound);
    vibrate('right', haptics);
    // Banked here rather than inside a state updater: an updater runs during
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

  const runIt = () => {
    if (running) return;
    const plan = planRun(build, checksSoFar);
    setOutcome(evaluate(build, checksSoFar));
    setResolved({});
    setHitPartId(null);
    setHintLevel(0);
    setArmedPart(null);
    setPlacing(null);
    setRunning(true);

    stopRun.current?.();
    stopRun.current = playRun({
      plan,
      positionOf: (kind) => {
        const part = build.parts.find((p) => p.kind === kind);
        return part ? (geometry.current[part.id] ?? null) : null;
      },
      dot: dotRef.current,
      reduceMotion: motionOff(),
      onResolve: (step) => setResolved((current) => ({ ...current, [step.checkId]: step.pass })),
      onFinish: () => finish(plan.halted, plan.steps.at(-1)?.stopsAt ?? null),
    });
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
          capstone: { title: capstone.title, build },
          totalXp: earned,
        },
      });
      return;
    }
    const next = stageIndex + 1;
    setStageIndex(next);
    setTray((counts) => addStage(counts, capstone.stages[next]));
    setArriving(capstone.stages[next].tray.map((part) => part.kind));
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

      <main className="capstone__body" ref={bodyRef}>
        <section className="card capstone__brief">
          <p className="capstone__kicker">
            {cleared ? 'Stage cleared' : `Stage ${stageIndex + 1} of ${capstone.stages.length}`}
          </p>
          {stageIndex === 0 && !cleared && (
            <p className="capstone__scenario">{capstone.scenario}</p>
          )}
          {/* Keyed so the clear line arrives on its own fade-slide rather than
              swapping the words underneath a paragraph that never moved. */}
          <p className="capstone__requirement" key={cleared ? 'cleared' : stageIndex}>
            {cleared ? stage.clearLine : stage.requirement}
          </p>
        </section>

        <Board
          build={build}
          armedPartId={armedPart}
          placing={placing}
          highlight={highlight}
          hitPartId={hitPartId}
          dotRef={dotRef}
          onGeometry={rememberGeometry}
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
          cascade={cleared}
        />

        <Tray counts={tray} armed={placing} arriving={arriving} onTap={tapTray} />
      </main>

      <footer className="capstone__cta">
        <Button onClick={cleared ? goOn : runIt} quiet disabled={running}>
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
