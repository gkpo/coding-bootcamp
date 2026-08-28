import { PartGlyph } from '../components/PartGlyph';
import { LANE_IDS, PART_LANES, type Build, type LaneId } from '../engine/archgraph';
import { PART_NAME } from './parts';
import './BuildRender.css';

const LANE_HEIGHT = 34;
const CHIP = 26;
const WIDTH = 260;
const LABEL_COLUMN = 6;

/**
 * The finished system, drawn small and still (docs/12 part D).
 *
 * The reward for a capstone is the architecture itself, so the summary shows
 * it rather than another figure. Positions are arithmetic here rather than
 * measured: nothing on this drawing moves, and it has to render the same on a
 * screen the user never scrolled.
 */
export function BuildRender({ build }: { build: Build }) {
  const height = LANE_IDS.length * LANE_HEIGHT;
  const spots = new Map<number, { x: number; y: number }>();

  LANE_IDS.forEach((lane: LaneId, row) => {
    const parts = build.parts.filter((part) => PART_LANES[part.kind] === lane);
    const span = WIDTH - LABEL_COLUMN * 2;
    parts.forEach((part, index) => {
      spots.set(part.id, {
        x: LABEL_COLUMN + (span * (index + 1)) / (parts.length + 1),
        y: row * LANE_HEIGHT + LANE_HEIGHT / 2,
      });
    });
  });

  const named = build.parts.map((part) => PART_NAME[part.kind]).join(', ');

  return (
    <svg
      className="mini"
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={`The system you built: ${named}`}
    >
      {build.edges.map(([a, b]) => {
        const from = spots.get(a);
        const to = spots.get(b);
        if (!from || !to) return null;
        return (
          <line
            key={`${a}-${b}`}
            className="mini__edge"
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
          />
        );
      })}
      {build.parts.map((part) => {
        const at = spots.get(part.id);
        if (!at) return null;
        return (
          <g key={part.id} transform={`translate(${at.x - CHIP / 2}, ${at.y - CHIP / 2})`}>
            <rect className="mini__chip" width={CHIP} height={CHIP} rx="7" />
            <g transform={`translate(${(CHIP - 16) / 2}, ${(CHIP - 16) / 2})`}>
              <PartGlyph kind={part.kind} size={16} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
