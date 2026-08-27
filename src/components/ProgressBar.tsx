import type { TrackTally } from '../engine/leitner';
import type { TrackId } from '../content/types';
import { seenFill } from './progressFill';
import './ProgressBar.css';

type Props = {
  tally: TrackTally;
  /** Layout class from the host screen (placement, not appearance). */
  className?: string;
} & (
  | { trackId: TrackId; colour?: undefined }
  /**
   * A bar that is not about one track takes an explicit colour instead. The
   * journey header's whole-bank bar is the only one: track colours belong to
   * tracks, so it uses the app accent (docs/11 part B).
   */
  | { colour: string; trackId?: undefined }
);

/**
 * A track's progress in two layers: a faint fill for exercises seen at least
 * once, a solid fill for the ones mastered.
 *
 * One layer is not enough. Mastery needs box 4, which is eleven days away at
 * the very best, so a mastery-only bar reads empty through the whole first
 * fortnight and the app looks like it forgot the work. The faint layer moves
 * on the first session; the solid layer keeps its strict meaning.
 *
 * Decorative: every caller prints the same counts as text next to it.
 */
export function ProgressBar({ tally, trackId, colour, className }: Props) {
  const pct = (n: number) => (tally.total === 0 ? 0 : (n / tally.total) * 100);
  const fill = colour ?? `var(--track-${trackId})`;

  return (
    <span className={className ? `progress-bar ${className}` : 'progress-bar'} aria-hidden>
      <span
        className="progress-bar__seen"
        style={{
          width: `${pct(tally.seen)}%`,
          background: seenFill(fill),
        }}
      />
      <span
        className="progress-bar__mastered"
        style={{ width: `${pct(tally.mastered)}%`, background: fill }}
      />
    </span>
  );
}
