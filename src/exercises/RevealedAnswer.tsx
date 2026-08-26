import { CodeBlock } from '../components/CodeBlock';
import { RichText } from '../components/RichText';
import type { Exercise } from '../content/types';
import './RevealedAnswer.css';

/**
 * Shows the correct answer once attempts are exhausted.
 *
 * Required by docs/02 ("feedback on reveal shows the correct solution as real
 * formatted code"), and load-bearing: a session will not finish until every
 * item has been answered right once, so an ordered exercise the user cannot
 * solve is a dead end unless the answer is shown.
 *
 * The types that already reveal in place: mcq and complexity highlight the
 * correct option, spot-bug highlights the line, match cannot finish unpaired: * render nothing here.
 */
export function RevealedAnswer({ exercise }: { exercise: Exercise }) {
  switch (exercise.type) {
    case 'parsons':
      return (
        <div className="reveal">
          <p className="reveal__label">The solution</p>
          <CodeBlock
            code={{
              lang: exercise.code?.lang ?? 'js',
              source: exercise.lines
                .filter((l) => l.distractor !== true)
                .map((l) => '  '.repeat(l.indent) + l.code)
                .join('\n'),
            }}
          />
        </div>
      );

    case 'steps':
      return (
        <div className="reveal">
          <p className="reveal__label">The order</p>
          <ol className="reveal__steps">
            {exercise.steps.map((step) => (
              <li key={step}>
                <RichText text={step} />
              </li>
            ))}
          </ol>
        </div>
      );

    case 'blank': {
      let filled = exercise.template;
      for (const answer of exercise.gaps) filled = filled.replace('____', answer);
      return (
        <div className="reveal">
          <p className="reveal__label">Filled in</p>
          <CodeBlock code={{ lang: 'js', source: filled }} />
        </div>
      );
    }

    default:
      return null;
  }
}
