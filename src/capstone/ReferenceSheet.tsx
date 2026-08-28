import { BottomSheet } from '../components/BottomSheet';
import { BuildRender } from './BuildRender';
import { canonicalBuild } from '../engine/archgraph';
import type { Capstone } from '../content/types';
import './ReferenceSheet.css';

interface Props {
  capstone: Capstone;
  /** The stage to debrief. Always one the user has already cleared. */
  stageIndex: number;
  open: boolean;
  onClose: () => void;
}

/**
 * The debrief: the reference build, after solving only (docs/12 part F2).
 *
 * Grading never diffs a build against this one, and nothing on the screen can
 * reach it until the user's own build has passed. It is shown for the reason a
 * good interviewer talks after the whiteboard is full: two shapes can both be
 * right, and it still helps to see the one the room usually draws and to hear
 * what each region of it buys.
 */
export function ReferenceSheet({ capstone, stageIndex, open, onClose }: Props) {
  const stage = capstone.stages[stageIndex];
  if (!stage) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="The reference build">
      <article className="reference">
        <h2 className="reference__title">The reference build</h2>
        <p className="reference__frame">
          Yours passed, so yours works. This is the shape most interviewers draw for this ask, and
          what each part of it is doing.
        </p>

        <div className="reference__board">
          <BuildRender build={canonicalBuild(capstone, stageIndex)} label="The reference build" />
        </div>

        <p className="reference__prose">{stage.debrief}</p>

        <section className="reference__section">
          <h3 className="reference__label">What it satisfies</h3>
          <ul className="reference__checks">
            {stage.checks.map((check) => (
              <li className="reference__check" key={check.id}>
                <p className="reference__check-label">{check.label}</p>
                {check.sayIt && <p className="reference__say">{check.sayIt}</p>}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </BottomSheet>
  );
}
