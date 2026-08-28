import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  canPlace,
  countOfKind,
  LANE_IDS,
  PART_LANES,
  type Build,
  type PartKind,
} from '../engine/archgraph';
import { PartGlyph } from '../components/PartGlyph';
import { LANE_LABEL, PART_LABEL, PART_NAME } from './parts';
import './Board.css';

interface Props {
  build: Build;
  /** The placed part waiting for a second tap, if any. */
  armedPartId: number | null;
  /** The tray part waiting for a lane, if any. */
  placing: PartKind | null;
  /** Kinds a level-2 hint is pointing at. */
  highlight: PartKind[];
  onPlace: (kind: PartKind) => void;
  onTapPart: (id: number) => void;
}

type Centers = Record<number, { x: number; y: number }>;

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
export function Board({ build, armedPartId, placing, highlight, onPlace, onTapPart }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<number, HTMLButtonElement>());
  const [centers, setCenters] = useState<Centers>({});

  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const origin = board.getBoundingClientRect();
    const next: Centers = {};
    for (const part of build.parts) {
      const chip = chips.current.get(part.id);
      if (!chip) continue;
      const box = chip.getBoundingClientRect();
      next[part.id] = {
        x: Math.round(box.left - origin.left + box.width / 2),
        y: Math.round(box.top - origin.top + box.height / 2),
      };
    }
    // Same numbers, same object: a fresh one every layout pass would loop.
    setCenters((prev) => (same(prev, next) ? prev : next));
  }, [build.parts]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="board" ref={boardRef}>
      <svg className="board__edges" aria-hidden>
        {build.edges.map(([a, b]) => {
          const from = centers[a];
          const to = centers[b];
          if (!from || !to) return null;
          return (
            <line
              key={`${a}-${b}`}
              className="board__edge"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
      </svg>

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
                  ref={(el) => {
                    if (el) chips.current.set(part.id, el);
                    else chips.current.delete(part.id);
                  }}
                  className={[
                    'part',
                    part.id === armedPartId ? 'is-armed' : '',
                    highlight.includes(part.kind) ? 'is-pointed' : '',
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

function same(a: Centers, b: Centers): boolean {
  const keys = Object.keys(b);
  if (Object.keys(a).length !== keys.length) return false;
  return keys.every((key) => {
    const i = Number(key);
    return a[i]?.x === b[i].x && a[i]?.y === b[i].y;
  });
}
