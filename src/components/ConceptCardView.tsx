import type { ConceptCard } from '../content/types';
import { CodeBlock } from './CodeBlock';
import { RichText } from './RichText';
import './ConceptCardView.css';

/**
 * The reading surface. Generous type, because these get read on a phone in a
 * queue (docs/01 §Cheat sheets). Order is fixed: plain words, analogy, what
 * the interviewer says, example, what to say back.
 */
export function ConceptCardView({ card }: { card: ConceptCard }) {
  return (
    <article className="concept">
      <h2 className="concept__title">
        <span aria-hidden>{card.emoji}</span> {card.title}
      </h2>

      <section className="concept__section">
        <h3 className="concept__label">In plain words</h3>
        <p className="concept__prose">
          <RichText text={card.plainWords} />
        </p>
      </section>

      <section className="concept__section">
        <h3 className="concept__label">The analogy</h3>
        <p className="concept__prose">
          <RichText text={card.analogy} />
        </p>
      </section>

      {card.interviewerSays.length > 0 && (
        <section className="concept__section">
          <h3 className="concept__label">Interviewer says…</h3>
          <ul className="concept__phrases">
            {card.interviewerSays.map((phrase) => (
              <li className="concept__phrase" key={phrase}>
                “<RichText text={phrase} />”
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.example && (
        <section className="concept__section">
          <h3 className="concept__label">Tiny example</h3>
          <CodeBlock code={card.example} />
          {card.exampleCaption && (
            <p className="concept__caption">
              <RichText text={card.exampleCaption} />
            </p>
          )}
        </section>
      )}

      <section className="concept__section">
        <h3 className="concept__label">Say this in the interview</h3>
        <ul className="concept__say">
          {card.sayThis.map((line) => (
            <li className="concept__say-line" key={line}>
              <RichText text={line} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
