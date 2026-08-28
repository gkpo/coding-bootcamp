import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  canPlace,
  countOfKind,
  LANE_IDS,
  PART_LANES,
  type Build,
  type PartKind,
} from '../engine/archgraph';
import { PartGlyph } from '../components/PartGlyph';
import { EASE, MICRO, motionOff } from './motion';
import { LANE_LABEL, PART_LABEL, PART_NAME } from './parts';
import { planWires, type WirePlan } from './wires';
import './Board.css';

export interface Point {
  x: number;
  y: number;
}
export type Centers = Record<number, Point>;

/**
 * Matches .part in Board.css. The wire geometry works from the chip's real
 * size and corner radius, so a dot lands on the border rather than near it.
 */
const CHIP = 62;
const CHIP_RADIUS = 14;

interface Props {
  build: Build;
  /** The placed part waiting for a second tap, if any. */
  armedPartId: number | null;
  /** The tray part waiting for a lane, if any. */
  placing: PartKind | null;
  /** Kinds a level-2 hint is pointing at. */
  highlight: PartKind[];
  /** The part a failed run stopped on. */
  hitPartId: number | null;
  /** The flow dot, moved by the run driver rather than by React. */
  dotRef: RefObject<HTMLSpanElement | null>;
  /** Called when the chips move, so the run driver knows where they are. */
  onGeometry: (centers: Centers) => void;
  /** The drawn wires, so the run driver can follow one rather than cut across it. */
  onWires: (paths: Map<string, SVGPathElement>) => void;
  onPlace: (kind: PartKind) => void;
  onTapPart: (id: number) => void;
}

/**
 * The board: five lanes, the parts standing in them, and the connections
 * between (docs/12 part C).
 *
 * The lanes are the second of the three fences. A part can only enter its own
 * lane, so the layout is doing grading work: a build that looks wrong usually
 * is wrong, and the user never has to invent a diagram convention.
 *
 * Chip positions are measured from the DOM rather than computed. The engine
 * knows which parts are joined and nothing about pixels, and the lanes space
 * their parts themselves, so the only honest source for where a connection
 * starts is where the chip actually landed. Everything from there (anchors,
 * fanning, the curve) is wires.ts.
 */
export function Board({
  build,
  armedPartId,
  placing,
  highlight,
  hitPartId,
  dotRef,
  onGeometry,
  onWires,
  onPlace,
  onTapPart,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<number, HTMLButtonElement>());
  const centersRef = useRef<Centers>({});
  const [centers, setCenters] = useState<Centers>({});

  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const next: Centers = {};
    for (const part of build.parts) {
      const chip = chips.current.get(part.id);
      const at = chip ? centerWithin(chip, board) : null;
      if (at) next[part.id] = at;
    }
    // Same numbers, same object: a fresh one every layout pass would loop.
    if (same(centersRef.current, next)) return;
    centersRef.current = next;
    setCenters(next);
    onGeometry(next);
  }, [build.parts, onGeometry]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [measure]);

  const wires = planWires(build.edges, centers, CHIP, CHIP_RADIUS);
  const exiting = useExitingWires(build, wires);
  const paths = useRef(new Map<string, SVGPathElement>());
  useDrawnWires(paths, wires, exiting);

  useEffect(() => {
    onWires(paths.current);
  }, [onWires, wires, exiting]);

  const drawn = [...wires, ...exiting];

  return (
    <div className="board" ref={boardRef}>
      <svg className="board__edges" aria-hidden>
        {drawn.map((wire) => (
          <path
            key={wire.key}
            ref={(el) => {
              if (el) paths.current.set(wire.key, el);
              else paths.current.delete(wire.key);
            }}
            className="board__edge"
            d={wire.d}
          />
        ))}
      </svg>

      {/* The dots ride above the chips, overlapping the box they belong to:
          that overlap is what says a connection is plugged in, and a line
          crossing a chip without one is passing behind it. */}
      <svg className="board__ports" aria-hidden>
        {wires.map((wire) => (
          <g key={wire.key}>
            <circle className="board__port" cx={wire.from.x} cy={wire.from.y} r={2.5} />
            <circle className="board__port" cx={wire.to.x} cy={wire.to.y} r={2.5} />
          </g>
        ))}
      </svg>

      {/* The one new moving element in the app. A cursor, not a character. */}
      <span className="board__dot" ref={dotRef} aria-hidden />

      {LANE_IDS.map((lane) => {
        const parts = build.parts.filter((part) => PART_LANES[part.kind] === lane);
        const open = placing !== null && PART_LANES[placing] === lane && canPlace(build, placing);
        const pointed = highlight.some(
          (kind) => PART_LANES[kind] === lane && countOfKind(build, kind) === 0,
        );
        // The armed part's own lane, with no room left in it. Worth showing:
        // otherwise the chip arms and the board simply does not answer.
        const full = placing !== null && PART_LANES[placing] === lane && !open;
        return (
          <div
            className={['lane', pointed ? 'is-pointed' : '', full ? 'is-full' : '']
              .filter(Boolean)
              .join(' ')}
            key={lane}
          >
            <span className="lane__label">{LANE_LABEL[lane]}</span>
            <div className="lane__parts">
              {parts.map((part) => (
                <button
                  type="button"
                  key={part.id}
                  data-part={part.id}
                  ref={(el) => {
                    if (el) chips.current.set(part.id, el);
                    else chips.current.delete(part.id);
                  }}
                  className={[
                    'part',
                    part.id === armedPartId ? 'is-armed' : '',
                    highlight.includes(part.kind) ? 'is-pointed' : '',
                    part.id === hitPartId ? 'is-hit' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={part.id === armedPartId}
                  aria-label={
                    part.id === armedPartId
                      ? `${PART_NAME[part.kind]}, selected`
                      : PART_NAME[part.kind]
                  }
                  onClick={() => onTapPart(part.id)}
                >
                  <PartGlyph kind={part.kind} size={24} />
                  <span className="part__label">{PART_LABEL[part.kind]}</span>
                </button>
              ))}
            </div>
            {open && placing !== null && (
              <button
                type="button"
                className="lane__drop"
                aria-label={`Put the ${PART_NAME[placing]} in the ${LANE_LABEL[lane].toLowerCase()} lane`}
                onClick={() => onPlace(placing)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Wires on their way out, kept on screen long enough to be un-drawn.
 *
 * A line that vanishes the instant it is tapped leaves the user wondering
 * whether they hit the right chip; reversing the draw answers that.
 */
function useExitingWires(build: Build, wires: WirePlan[]): WirePlan[] {
  const [exiting, setExiting] = useState<WirePlan[]>([]);
  const previous = useRef<WirePlan[]>(wires);

  useEffect(() => {
    const present = new Set(wires.map((w) => w.key));
    const placed = new Set(build.parts.map((p) => p.id));
    const gone = previous.current.filter(
      // A wire whose part left the board goes with it, unmourned.
      (w) => !present.has(w.key) && placed.has(w.a) && placed.has(w.b),
    );
    previous.current = wires;
    if (gone.length === 0) return;

    setExiting((current) => [...current, ...gone]);
    const keys = new Set(gone.map((w) => w.key));
    const timer = setTimeout(
      () => setExiting((current) => current.filter((w) => !keys.has(w.key))),
      motionOff() ? 0 : MICRO,
    );
    return () => clearTimeout(timer);
  }, [build.parts, wires]);

  return exiting;
}

/** Draws a new wire on, and un-draws one on its way out. Stroke only. */
function useDrawnWires(
  paths: RefObject<Map<string, SVGPathElement>>,
  wires: WirePlan[],
  exiting: WirePlan[],
) {
  const drawn = useRef(new Set<string>());

  useLayoutEffect(() => {
    if (motionOff()) return;
    for (const wire of wires) {
      if (drawn.current.has(wire.key)) continue;
      const path = paths.current.get(wire.key);
      if (!path) continue;
      drawn.current.add(wire.key);
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      const drawing = path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
        duration: MICRO,
        easing: EASE,
      });
      // Clear the dash once it has been drawn on. Left behind, it is a pattern
      // measured against a path length that stops being true the moment a
      // chip moves, and the line comes back visibly cut.
      drawing.onfinish = () => {
        path.style.strokeDasharray = '';
      };
    }
    for (const wire of exiting) {
      const path = paths.current.get(wire.key);
      if (!path || !drawn.current.has(wire.key)) continue;
      drawn.current.delete(wire.key);
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: length }], {
        duration: MICRO,
        easing: EASE,
        fill: 'forwards',
      });
    }
    // Keys that left entirely (a removed part) must not block a redraw later.
    const live = new Set([...wires, ...exiting].map((w) => w.key));
    for (const key of drawn.current) if (!live.has(key)) drawn.current.delete(key);
  }, [paths, wires, exiting]);
}

/**
 * A chip's center in the board's own coordinates, read off layout rather than
 * off the painted box.
 *
 * Deliberately not getBoundingClientRect: a chip flying in from the tray is
 * mid-transform, and a rect taken then anchors its lines to where it was
 * passing through. Offsets are where the chip actually lives, which is where
 * a connection should meet it whatever is animating.
 */
function centerWithin(el: HTMLElement, root: HTMLElement): Point | null {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node !== null && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node !== root) return null;
  return { x: Math.round(x + el.offsetWidth / 2), y: Math.round(y + el.offsetHeight / 2) };
}

function same(a: Centers, b: Centers): boolean {
  const keys = Object.keys(b);
  if (Object.keys(a).length !== keys.length) return false;
  return keys.every((key) => {
    const i = Number(key);
    return a[i]?.x === b[i].x && a[i]?.y === b[i].y;
  });
}
