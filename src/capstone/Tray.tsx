import type { PartKind } from '../engine/archgraph';
import { PartGlyph } from '../components/PartGlyph';
import { availableKinds, isEmpty, type TrayCounts } from './tray';
import { PART_LABEL, PART_NAME } from './parts';
import './Tray.css';

interface Props {
  counts: TrayCounts;
  armed: PartKind | null;
  onTap: (kind: PartKind) => void;
}

/**
 * The parts on offer (docs/12 part C).
 *
 * Deliberately finite, and deliberately not labelled by usefulness: a decoy
 * looks exactly like the part beside it, because on the day nobody tells you
 * which box was the one you did not need.
 */
export function Tray({ counts, armed, onTap }: Props) {
  if (isEmpty(counts)) {
    return <p className="tray__empty">Everything the stage gave you is on the board.</p>;
  }

  return (
    <div className="tray">
      {availableKinds(counts).map((kind) => {
        const left = counts[kind] ?? 0;
        return (
          <button
            type="button"
            key={kind}
            className={`part tray__part${kind === armed ? ' is-armed' : ''}`}
            aria-pressed={kind === armed}
            aria-label={
              kind === armed
                ? `${PART_NAME[kind]}, selected. Tap a lane to place it`
                : `${PART_NAME[kind]}${left > 1 ? `, ${left} left` : ''}`
            }
            onClick={() => onTap(kind)}
          >
            <PartGlyph kind={kind} />
            <span className="part__label">{PART_LABEL[kind]}</span>
            {left > 1 && (
              <span className="tray__count" aria-hidden>
                {left}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
