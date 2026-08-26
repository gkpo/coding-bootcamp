import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cards, exercises, tracks } from '../content';
import { searchCards } from '../engine/search';
import { isMastered } from '../engine/leitner';
import { useStore } from '../store/useStore';
import './SheetsScreen.css';

export function SheetsScreen() {
  const [query, setQuery] = useState('');
  const progress = useStore((s) => s.exercises);

  const results = useMemo(() => searchCards(cards, query), [query]);

  /** A card is "known" when every exercise linked to it is mastered. */
  const known = useMemo(() => {
    const set = new Set<string>();
    for (const card of cards) {
      const linked = exercises.filter((e) => e.conceptId === card.id);
      if (linked.length === 0) continue;
      if (
        linked.every((e) => {
          const p = progress[e.id];
          return p !== undefined && isMastered(p);
        })
      ) {
        set.add(card.id);
      }
    }
    return set;
  }, [progress]);

  const searching = query.trim() !== '';

  return (
    <div className="stack">
      <div>
        <h1 className="screen-title">Cheat sheets</h1>
        <p className="screen-lede">Search what the interviewer said, not what it is called.</p>
      </div>

      <input
        className="sheets__search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. a function that remembers"
        aria-label="Search concept cards"
      />

      {searching ? (
        results.length === 0 ? (
          <p className="sheets__empty">Nothing matches “{query}”.</p>
        ) : (
          <div className="sheets__grid">
            {results.map((card) => (
              <CardChip key={card.id} card={card} known={known.has(card.id)} />
            ))}
          </div>
        )
      ) : (
        tracks.map((track) => {
          const inTrack = cards.filter((c) => c.trackIds.includes(track.id));
          if (inTrack.length === 0) return null;
          return (
            <section key={track.id}>
              <h2 className="sheets__group">
                <span aria-hidden>{track.emoji}</span> {track.title}
              </h2>
              <div className="sheets__grid">
                {inTrack.map((card) => (
                  <CardChip key={card.id} card={card} known={known.has(card.id)} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function CardChip({
  card,
  known,
}: {
  card: { id: string; title: string; emoji: string; plainWords: string };
  known: boolean;
}) {
  return (
    <Link to={`/sheets/${card.id}`} className="sheets__card">
      <span className="sheets__card-emoji" aria-hidden>
        {card.emoji}
      </span>
      <span className="sheets__card-body">
        <span className="sheets__card-title">
          {card.title}
          {known && (
            <span className="sheets__known" aria-label="known">
              ✓
            </span>
          )}
        </span>
        <span className="sheets__card-plain">{card.plainWords}</span>
      </span>
    </Link>
  );
}
