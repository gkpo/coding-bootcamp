import { useEffect, useRef } from 'react';

const COLOURS = [
  'var(--accent)',
  'var(--track-t2)',
  'var(--track-t4)',
  'var(--track-t5)',
  'var(--track-t6)',
];

/**
 * Confetti-lite: a dozen CSS particles, no library (docs/06 caps this at ~2KB).
 * Honours reduced motion by simply not rendering.
 */
export function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const reduced =
      document.documentElement.dataset.reduceMotion === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    ref.current.classList.add('is-firing');
  }, [active]);

  if (!active) return null;

  return (
    <div className="confetti" ref={ref} aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="confetti__bit"
          style={{
            left: `${8 + i * 6.4}%`,
            background: COLOURS[i % COLOURS.length],
            animationDelay: `${(i % 5) * 40}ms`,
            transform: `rotate(${i * 37}deg)`,
          }}
        />
      ))}
    </div>
  );
}
