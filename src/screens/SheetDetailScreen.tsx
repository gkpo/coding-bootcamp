import { Link, useParams } from 'react-router-dom';
import { getCard } from '../content';
import { ConceptCardView } from '../components/ConceptCardView';
import { ConceptIcon } from '../components/ConceptIcon';
import { RichText } from '../components/RichText';
import { BackIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import { useEffect } from 'react';
import './SheetsScreen.css';

export function SheetDetailScreen() {
  const { cardId } = useParams<{ cardId: string }>();
  const card = cardId ? getCard(cardId) : undefined;
  const openConceptCard = useStore((s) => s.openConceptCard);

  useEffect(() => {
    if (cardId) openConceptCard(cardId);
  }, [cardId, openConceptCard]);

  if (!card) {
    return (
      <div className="stack">
        <h1 className="screen-title">Not found</h1>
        <Link to="/sheets" className="track-detail__back">
          <BackIcon size={20} />
          <span>All sheets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <Link to="/sheets" className="track-detail__back">
        <BackIcon size={20} />
        <span>All sheets</span>
      </Link>
      <ConceptCardView card={card} />
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
