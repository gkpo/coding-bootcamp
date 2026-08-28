import { Button } from '../components/Button';
import { STAGGER } from './motion';
import type { CapstoneCheck } from '../content/types';
import { hintWords } from './hintWords';
import './CheckStrip.css';

export type CheckState = 'open' | 'pass' | 'fail';

interface Props {
  checks: CapstoneCheck[];
  state: (check: CapstoneCheck) => CheckState;
  /** The check the hint button belongs to: the first one that came back red. */
  hintTargetId: string | null;
  /** 0 for no hint taken, up to 3. */
  hintLevel: number;
  onHint: () => void;
  /**
   * Checks whose say-it line is worth showing: this stage's. Every cleared
   * check keeping its sentence would bury the board under the strip by stage
   * three, and the sentence is a reward for the moment a check turns green.
   */
  sayItFor: string[];
  /** The stage just cleared: the rings confirm it top to bottom. */
  cascade: boolean;
}

/**
 * The acceptance criteria, visible from the first second (docs/12 part C).
 *
 * They are not a score sheet revealed at the end: they are what the user is
 * building against, which is the difference between a puzzle and a brief.
 */
export function CheckStrip({
  checks,
  state,
  hintTargetId,
  hintLevel,
  onHint,
  sayItFor,
  cascade,
}: Props) {
  return (
    <ul className={cascade ? 'checks is-cleared' : 'checks'}>
      {checks.map((check, index) => {
        const status = state(check);
        const isTarget = check.id === hintTargetId;
        return (
          <li key={check.id} className={`check is-${status}`}>
            <div className="check__row">
              <span
                className="check__ring"
                // The summary's dot cascade, turned on its side: the delays
                // come off the elements so the strip confirms top to bottom.
                style={cascade ? { animationDelay: `${index * STAGGER}ms` } : undefined}
                aria-hidden
              />
              <span className="check__label">{check.label}</span>
              <span className="visually-hidden">
                {status === 'pass' ? 'passing' : status === 'fail' ? 'not yet' : 'not run yet'}
              </span>
              {isTarget && hintLevel < 3 && (
                <Button variant="ghost" className="check__hint" onClick={onHint}>
                  Hint
                </Button>
              )}
            </div>

            {isTarget && hintLevel >= 1 && <p className="check__hint-text">{check.hintNudge}</p>}
            {isTarget && hintLevel >= 2 && (
              <p className="check__hint-text">{check.hintPoint.text}</p>
            )}
            {isTarget && hintLevel >= 3 && (
              <p className="check__hint-text check__hint-text--moves">
                {hintWords(check.hintMoves) || check.hintPoint.text}
              </p>
            )}
            {status === 'pass' && check.sayIt && sayItFor.includes(check.id) && (
              <p className="check__say">{check.sayIt}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
