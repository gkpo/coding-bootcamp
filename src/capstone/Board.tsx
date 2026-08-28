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
import './Board.css';

export interface Point {
  x: number;
  y: number;
}
export type Centers = Record<number, Point>;

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
  onPlace: (kind: PartKind) => void;
  onTapPart: (id: number) => void;
}

type Wire = { key: string; a: number; b: number };

/**
 * The board: five lanes, the parts standing in them, and the lines between
 * (docs/12 part C).
 *
 * The lanes are the second of the three fences. A part can only enter its own
 * lane, so the layout is doing grading work: a build that looks wrong usually
 * is wrong, and the user never has to invent a diagram convention.
 *
 * Edge geometry is measured from the DOM rather than computed. The engine
 * knows which parts are joined and nothing about pixels, and the lanes space
 * their parts themselves, so the only honest source for where a line starts
 * is where the chip actually landed.
 */
export function Board({
  build,
  armedPartId,
  placing,
  highlight,
  hitPartId,
  dotRef,
  onGeometry,
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

  const wires = build.edges.map(([a, b]) => ({ key: wireKey(a, b), a, b }));
  const exiting = useExitingWires(build, wires);
  const lines = useRef(new Map<string, SVGLineElement>());
  useDrawnLines(lines, wires, exiting, centers);

  return (
    <div className="board" ref={boardRef}>
      <svg className="board__edges" aria-hidden>
        {[...wires, ...exiting].map((wire) => {
          const from = centers[wire.a];
          const to = centers[wire.b];
          if (!from || !to) return null;
          return (
            <line
              key={wire.key}
              ref={(el) => {
                if (el) lines.current.set(wire.key, el);
                else lines.current.delete(wire.key);
              }}
              className="board__edge"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
      </svg>

      {/* The one new moving element in the app. A cursor, not a character. */}
      <span className="board__dot" ref={dotRef} aria-hidden />

      {LANE_IDS.map((lane) => {
        const parts = build.parts.filter((part) => PART_LANES[part.kind] === lane);
        const open = placing !== null && PART_LANES[placing] === lane && canPlace(build, placing);
        const pointed = highlight.some(
          (kind) => PART_LANES[kind] === lane && countOfKind(build, kind) === 0,
        );
        return (
          <div className={`lane${pointed ? ' is-pointed' : ''}`} key={lane}>
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
                  <PartGlyph kind={part.kind} />
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
 * A chip's center in the board's own coordinates, read off layout rather than
 * off the painted box.
 *
 * Deliberately not getBoundingClientRect: a chip flying in from the tray is
 * mid-transform, and a rect taken then anchors its lines to where it was
 * passing through. Offsets are where the chip actually lives, which is where
 * a line should meet it whatever is animating.
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

function wireKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Edges on their way out, kept on screen long enough to be un-drawn.
 *
 * A line that vanishes the instant it is tapped leaves the user wondering
 * whether they hit the right chip; reversing the draw answers that.
 */
function useExitingWires(build: Build, wires: Wire[]): Wire[] {
  const [exiting, setExiting] = useState<Wire[]>([]);
  const previous = useRef<Wire[]>(wires);

  useEffect(() => {
    const present = new Set(wires.map((w) => w.key));
    const placed = new Set(build.parts.map((p) => p.id));
    const gone = previous.current.filter(
      // A line whose part left the board goes with it, unmourned.
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

/** Draws a new line on, and un-draws one on its way out. Stroke only. */
function useDrawnLines(
  lines: RefObject<Map<string, SVGLineElement>>,
  wires: Wire[],
  exiting: Wire[],
  centers: Centers,
) {
  const drawn = useRef(new Set<string>());

  useLayoutEffect(() => {
    if (motionOff()) return;
    for (const wire of wires) {
      if (drawn.current.has(wire.key)) continue;
      const line = lines.current.get(wire.key);
      const from = centers[wire.a];
      const to = centers[wire.b];
      if (!line || !from || !to) continue;
      drawn.current.add(wire.key);
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      line.style.strokeDasharray = `${length}`;
      line.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
        duration: MICRO,
        easing: EASE,
      });
    }
    for (const wire of exiting) {
      const line = lines.current.get(wire.key);
      if (!line || !drawn.current.has(wire.key)) continue;
      drawn.current.delete(wire.key);
      const from = centers[wire.a];
      const to = centers[wire.b];
      if (!from || !to) continue;
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      line.style.strokeDasharray = `${length}`;
      line.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: length }], {
        duration: MICRO,
        easing: EASE,
        fill: 'forwards',
      });
    }
    // Keys that left entirely (a removed part) must not block a redraw later.
    const live = new Set([...wires, ...exiting].map((w) => w.key));
    for (const key of drawn.current) if (!live.has(key)) drawn.current.delete(key);
  }, [lines, wires, exiting, centers]);
}

function same(a: Centers, b: Centers): boolean {
  const keys = Object.keys(b);
  if (Object.keys(a).length !== keys.length) return false;
  return keys.every((key) => {
    const i = Number(key);
    return a[i]?.x === b[i].x && a[i]?.y === b[i].y;
  });
}
