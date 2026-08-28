import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Board, type Centers } from '../capstone/Board';
import { wireKey } from '../capstone/wires';
import { CheckStrip, type CheckState } from '../capstone/CheckStrip';
import { ReferencePanel } from '../capstone/ReferencePanel';
import { Tray } from '../capstone/Tray';
import { planRun, type RunPlan } from '../capstone/flowRun';
import { playRun } from '../capstone/playRun';
import { replayFrom, slide, snapshotRects, type Rects } from '../capstone/flip';
import { motionOff, STAGGER, STANDARD } from '../capstone/motion';
import { LANE_LABEL, PART_NAME } from '../capstone/parts';
import { addStage, give, take, trayFor, type TrayCounts } from '../capstone/tray';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CloseIcon } from '../components/icons';
import { getCapstone } from '../content';
import type { Capstone } from '../content/types';
import {
  canPlace,
  evaluate,
  firstFailing,
  PART_LANES,
  place,
  removePart,
  runMoves,
  startingBuild,
  toggleEdge,
  type Build,
  type CheckResult,
  type PartKind,
} from '../engine/archgraph';
import { climbNote, landingCue, playNotes, playTone, vibrate } from '../engine/feedback';
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
  // Subscribed to as well as read from the document, because the offer to
  // watch the run again is decided at render: motionOff() alone would still
  // be reading the old attribute on the render that flips the in-app toggle.
  const reduceMotionSetting = useStore((s) => s.settings.reduceMotion);

  // Resolved once, on mount. The store moves as stages clear, and re-reading
  // it would restart the run under the user's hands.
  const [opening] = useState(() => resumePoint(capstone, saved));
  const [stageIndex, setStageIndex] = useState(opening.stageIndex);
  const [build, setBuild] = useState<Build>(opening.build);
  const [tray, setTray] = useState<TrayCounts>(opening.tray);

  /**
   * One step back, as far as the stage's own beginning. The board is the only
   * place in the app where a tap destroys something the user made, so every
   * tap that changes it leaves a way back.
   */
  const [history, setHistory] = useState<{ build: Build; tray: TrayCounts }[]>([]);
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
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [outcomes, setOutcomes] = useState<Result[]>([]);
  const [earned, setEarned] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);

  const bodyRef = useRef<HTMLElement>(null);
  const flowRef = useRef<HTMLSpanElement>(null);
  const geometry = useRef<Centers>({});
  const wires = useRef(new Map<string, SVGPathElement>());
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
  // Nothing to watch when motion is off: the rings resolve by fade and no
  // packet ever leaves a part, so the offer is not made at all (docs/12 G).
  const canWatchAgain = cleared && !reduceMotionSetting && !motionOff();
  const highlight = hintLevel >= 2 ? hintedKinds(checksSoFar, hintTarget) : [];

  const linksOf = (id: number | null) => {
    if (id === null) return [];
    return build.edges
      .filter(([a, b]) => a === id || b === id)
      .map(([a, b]) => (a === id ? b : a))
      .map((other) => build.parts.find((part) => part.id === other))
      .filter((part) => part !== undefined);
  };

  const rememberGeometry = useCallback((centers: Centers) => {
    geometry.current = centers;
  }, []);

  const rememberWires = useCallback((paths: Map<string, SVGPathElement>) => {
    wires.current = paths;
  }, []);

  /** The first part of a kind: the one packets visit when a kind has two. */
  const partOf = useCallback(
    (kind: PartKind) => build.parts.find((part) => part.kind === kind),
    [build.parts],
  );

  /** The drawn connection between two kinds, to be flown along and measured. */
  const wireBetween = useCallback(
    (from: PartKind, to: PartKind) => {
      const a = partOf(from);
      const b = partOf(to);
      if (!a || !b) return null;
      return wires.current.get(wireKey(a.id, b.id)) ?? null;
    },
    [partOf],
  );

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

  /** Called before anything that changes the board, never after. */
  const remember = () => setHistory((past) => [...past, { build, tray }]);

  const undo = () => {
    const last = history.at(-1);
    if (!last || running) return;
    setHistory((past) => past.slice(0, -1));
    setBuild(last.build);
    setTray(last.tray);
    setArmedPart(null);
    setPlacing(null);
  };

  const tapTray = (kind: PartKind) => {
    if (running) return;
    setArmedPart(null);
    setPlacing((current) => (current === kind ? null : kind));
  };

  const placeIn = (kind: PartKind) => {
    if (running) return;
    const next = place(build, kind);
    if (next === null) return;
    remember();
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
    remember();
    setBuild(toggleEdge(build, armedPart, id));
    setArmedPart(null);
  };

  /** A tap that landed on a connection: take it off the board. */
  const unlink = (a: number, b: number) => {
    if (running) return;
    remember();
    setBuild(toggleEdge(build, a, b));
    setArmedPart(null);
  };

  const returnPart = () => {
    const part = build.parts.find((p) => p.id === armedPart);
    if (!part || running) return;
    remember();
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
   * The climb happens during the run itself, one note per ring as it turns
   * green, so the strip and the sound are the same event. What lands here is
   * the landing: the run's full stop, once the last ring has confirmed.
   *
   * A replay keeps the sound, and keeps nothing else: it is theatre on demand,
   * so everything that banks or records belongs to a real run (docs/12
   * part G).
   */
  const finish = (plan: RunPlan, replay: boolean) => {
    setRunning(false);
    stopRun.current = null;

    if (!plan.halted) {
      const landing = landingCue();
      playNotes(landing.notes, sound, landing.tuning);
    }
    if (replay) return;

    if (plan.halted) {
      setHitPartId(plan.steps.at(-1)?.stopsAtPart ?? null);
      playTone('wrong', sound);
      vibrate('wrong', haptics);
      return;
    }
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

  /**
   * The visual run over the board as it stands (docs/12 parts D and G).
   *
   * A replay takes the same path with the grading taken out. Re-planning the
   * run from the build is pure, so the packets walk every authored check
   * again, but nothing is written to the outcome the strip is judged on and
   * nothing is banked when it ends.
   */
  const startRun = (replay: boolean) => {
    if (running) return;
    const plan = planRun(build, checksSoFar);
    const greens = plan.steps.filter((step) => step.pass).length;
    let ring = 0;
    if (!replay) {
      setOutcome(evaluate(build, checksSoFar));
      setHitPartId(null);
      setHintLevel(0);
      setArmedPart(null);
      setPlacing(null);
    }
    setResolved({});
    setRunning(true);

    stopRun.current?.();
    stopRun.current = playRun({
      plan,
      positionOf: (kind) => {
        const part = partOf(kind);
        return part ? (geometry.current[part.id] ?? null) : null;
      },
      // Walk the connection the user actually drew, curve and all.
      along: (from, to, t) => {
        const path = wireBetween(from, to);
        if (!path) return null;
        const at = path.getPointAtLength(path.getTotalLength() * t);
        return { x: at.x, y: at.y };
      },
      lengthOf: (from, to) => wireBetween(from, to)?.getTotalLength() ?? null,
      dots: Array.from(flowRef.current?.children ?? []) as HTMLElement[],
      reduceMotion: motionOff(),
      // The climb is played live, one note per ring as it turns green, which
      // is what the tick experiment proved out: per-step sound reads as the
      // run confirming itself rather than as a jingle bolted on the end.
      onResolve: (step) => {
        setResolved((current) => ({ ...current, [step.checkId]: step.pass }));
        if (step.pass) {
          const cue = climbNote(ring, greens);
          ring += 1;
          playNotes(cue.notes, sound, cue.tuning);
        }
      },
      onFinish: () => finish(plan, replay),
    });
  };

  const runIt = () => startRun(false);
  const watchAgain = () => startRun(true);

  const goOn = () => {
    if (isFinalStage) {
      navigate('/session/summary', {
        replace: true,
        state: {
          results: outcomes,
          xpEarned: 0,
          streakDays: 0,
          conceptIds: capstone.conceptIds,
          capstone: { id: capstone.id, title: capstone.title, build },
          totalXp: earned,
        },
      });
      return;
    }
    const next = stageIndex + 1;
    setStageIndex(next);
    setHistory([]);
    setTray((counts) => addStage(counts, capstone.stages[next]));
    setArriving(capstone.stages[next].tray.map((part) => part.kind));
    setHintTaken(false);
    setHintLevel(0);
    setCleared(false);
    setDebriefOpen(false);
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
          {/* Only ever rendered once the stage is behind the user, which is
              what keeps the worked solution out of reach while it would be an
              answer key rather than a debrief (docs/12 part F2). */}
          {cleared && (
            <div className="capstone__cleared-tools">
              <Button
                variant="ghost"
                className="capstone__cleared-tool"
                aria-expanded={debriefOpen}
                onClick={() => setDebriefOpen((open) => !open)}
              >
                {debriefOpen ? 'Hide the reference build' : 'See the reference build'}
              </Button>
            </div>
          )}
        </section>

        <Board
          build={build}
          armedPartId={armedPart}
          placing={placing}
          highlight={highlight}
          hitPartId={hitPartId}
          flowRef={flowRef}
          onGeometry={rememberGeometry}
          onWires={rememberWires}
          onPlace={placeIn}
          onTapPart={tapPart}
          onTapWire={unlink}
        />

        {/* Directly under the board it is being compared with, so both
            drawings are on screen together and the user scrolls between them
            instead of switching (docs/12 part F2). */}
        {cleared && debriefOpen && <ReferencePanel capstone={capstone} stageIndex={stageIndex} />}

        {/* The parts sit against the board they are going onto, so the hand
            travels the shortest distance between picking one up and putting
            it down, and both ends of a placement are in one glance. */}
        <Tray counts={tray} armed={placing} arriving={arriving} onTap={tapTray} />

        <div className="capstone__tools">
          {history.length > 0 && (
            <Button variant="ghost" className="capstone__tool" onClick={undo}>
              Undo
            </Button>
          )}
          {armedPart !== null && (
            <Button variant="ghost" className="capstone__tool" onClick={returnPart}>
              Return to tray
            </Button>
          )}
        </div>

        {/* The guaranteed way to take a connection off. Tapping the line works
            and is quicker, but on a full board some connections have nowhere
            left to tap; naming them turns aiming into choosing. */}
        {armedPart !== null && linksOf(armedPart).length > 0 && (
          <div className="capstone__links">
            <p className="capstone__links-label">Remove a link</p>
            <div className="capstone__links-row">
              {linksOf(armedPart).map((part) => (
                <button
                  type="button"
                  key={part.id}
                  className="capstone__link"
                  onClick={() => unlink(armedPart, part.id)}
                >
                  {PART_NAME[part.kind]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* A lane at capacity is a dead end unless it says so. This is also
            where a decoy earns its keep: the only way to fit one is to take
            out something the checks already asked for. */}
        {placing !== null && !canPlace(build, placing) && (
          <p className="capstone__blocked">
            The {LANE_LABEL[PART_LANES[placing]].toLowerCase()} lane is full. Take a part back to
            the tray if you want to make room.
          </p>
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
      </main>

      <footer className="capstone__cta">
        {/* The run again, for the pleasure of it, beside the way on rather
            than above it: nothing is graded, banked or saved by it, so it
            takes the quieter half of the bar and none of the board's room. */}
        {canWatchAgain && (
          <Button variant="secondary" onClick={watchAgain} disabled={running}>
            Watch it run
          </Button>
        )}
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
