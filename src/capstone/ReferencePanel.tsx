import { BuildRender } from './BuildRender';
import { canonicalBuild } from '../engine/archgraph';
import type { Capstone } from '../content/types';
import './ReferencePanel.css';

interface Props {
  capstone: Capstone;
  /** The stage to debrief. Always one the user has already cleared. */
  stageIndex: number;
}

/**
 * The debrief: the reference build, after solving only (docs/12 part F2).
 *
 * Inline, under the user's own board, rather than in a sheet over it: the
 * whole point is to compare two drawings, and a sheet covers the one the user
 * made at the exact moment it should be next to the other. Scrolling between
 * them beats switching between them.
 *
 * Grading never diffs a build against this one, and nothing on the screen can
 * reach it until the user's own build has passed. It is shown for the reason a
 * good interviewer talks after the whiteboard is full: two shapes can both be
 * right, and it still helps to see the one the room usually draws and to hear
 * what each region of it buys.
 *
 * Mounting is the whole of the opening: the panel arrives at full size with
 * its content fading in, because part D bans animating layout, and closing it
 * unmounts it at once.
 */
export function ReferencePanel({ capstone, stageIndex }: Props) {
  const stage = capstone.stages[stageIndex];
  if (!stage) return null;

  return (
    <section className="reference" aria-label="The reference build">
      <p className="reference__frame">
        Yours passed, so yours works. This is the shape most interviewers draw for this ask, and
        what each part of it is doing.
      </p>

      <div className="reference__board">
        <BuildRender build={canonicalBuild(capstone, stageIndex)} label="The reference build" />
      </div>

      <p className="reference__prose">{stage.debrief}</p>

      <div className="reference__section">
        <h2 className="reference__label">What it satisfies</h2>
        <ul className="reference__checks">
          {stage.checks.map((check) => (
            <li className="reference__check" key={check.id}>
              <p className="reference__check-label">{check.label}</p>
              {check.sayIt && <p className="reference__say">{check.sayIt}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
