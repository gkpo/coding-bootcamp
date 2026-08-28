import { PartGlyph } from '../components/PartGlyph';
import { LANE_IDS, PART_LANES, type Build, type LaneId } from '../engine/archgraph';
import { PART_NAME } from './parts';
import { planWires } from './wires';
import './BuildRender.css';

interface Props {
  build: Build;
  /** What the drawing is of, for a reader who cannot see it. */
  label?: string;
}

const LANE_HEIGHT = 32;
const CHIP = 22;
const CHIP_RADIUS = 6;
const WIDTH = 280;

/**
 * The finished system, drawn small and still (docs/12 part D).
 *
 * The reward for a capstone is the architecture itself, so the summary shows
 * it rather than another figure. It borrows the board's own geometry, down to
 * the fanned anchors and the dot on each connection, so the memento looks like
 * the thing that was built rather than like a different drawing of it.
 *
 * Positions are arithmetic here rather than measured: nothing on this drawing
 * moves, and it has to render the same on a screen the user never scrolled.
 *
 * The debrief sheet draws the reference build with the same component and its
 * own label (docs/12 part F2), so the two pictures are the same picture.
 */
export function BuildRender({ build, label = 'The system you built' }: Props) {
  const height = LANE_IDS.length * LANE_HEIGHT;
  const centres: Record<number, { x: number; y: number }> = {};

  LANE_IDS.forEach((lane: LaneId, row) => {
    const parts = build.parts.filter((part) => PART_LANES[part.kind] === lane);
    parts.forEach((part, index) => {
      centres[part.id] = {
        x: (WIDTH * (index + 1)) / (parts.length + 1),
        y: row * LANE_HEIGHT + LANE_HEIGHT / 2,
      };
    });
  });

  const wires = planWires(build.edges, centres, CHIP, CHIP_RADIUS);
  const named = build.parts.map((part) => PART_NAME[part.kind]).join(', ');

  return (
    <svg
      className="mini"
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={`${label}: ${named}`}
    >
      {wires.map((wire) => (
        <path key={wire.key} className="mini__edge" d={wire.d} />
      ))}
      {build.parts.map((part) => {
        const at = centres[part.id];
        if (!at) return null;
        return (
          <g key={part.id} transform={`translate(${at.x - CHIP / 2}, ${at.y - CHIP / 2})`}>
            <rect className="mini__chip" width={CHIP} height={CHIP} rx={CHIP_RADIUS} />
            <g transform={`translate(${(CHIP - 14) / 2}, ${(CHIP - 14) / 2})`}>
              <PartGlyph kind={part.kind} size={14} />
            </g>
          </g>
        );
      })}
      {wires.map((wire) => (
        <g key={wire.key}>
          <circle className="mini__port" cx={wire.from.x} cy={wire.from.y} r={1.8} />
          <circle className="mini__port" cx={wire.to.x} cy={wire.to.y} r={1.8} />
        </g>
      ))}
    </svg>
  );
}
