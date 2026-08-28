import { Link, useParams } from 'react-router-dom';
import { getCard } from '../content';
import { ConceptCardView } from '../components/ConceptCardView';
import { ConceptIcon } from '../components/ConceptIcon';
import { RichText } from '../components/RichText';
import { ScreenBar } from '../components/ScreenBar';
import { useStore } from '../store/useStore';
import { useEffect, useRef } from 'react';
import './SheetsScreen.css';

export function SheetDetailScreen() {
  const { cardId } = useParams<{ cardId: string }>();
  const card = cardId ? getCard(cardId) : undefined;
  const openConceptCard = useStore((s) => s.openConceptCard);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (cardId) openConceptCard(cardId);
  }, [cardId, openConceptCard]);

  if (!card) {
    return (
      <div className="stack">
        <ScreenBar to="/sheets" label="Sheets" watch={titleRef} />
        <h1 className="screen-title">Not found</h1>
      </div>
    );
  }

  return (
    <div className="stack">
      <ScreenBar to="/sheets" label="Sheets" watch={titleRef}>
        <span className="screen-bar__icon">
          <ConceptIcon name={card.icon} size={18} />
        </span>
        <span className="screen-bar__title">
          <RichText text={card.title} />
        </span>
      </ScreenBar>
      <ConceptCardView card={card} titleRef={titleRef} />
      {card.related.length > 0 && (
        <section>
          <h3 className="sheets__group">Related</h3>
          <div className="sheets__related">
            {card.related.map((id) => {
              const other = getCard(id);
              if (!other) return null;
              return (
                <Link key={id} to={`/sheets/${id}`} className="sheets__related-chip">
                  <ConceptIcon name={other.icon} size={16} />
                  <RichText text={other.title} />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
