import { useEffect, useState } from 'react';

const COLOURS = [
  'var(--accent)',
  'var(--track-t2)',
  'var(--track-t3)',
  'var(--track-t4)',
  'var(--track-t5)',
  'var(--track-t6)',
];

const COUNT = 16;

/** Longest possible delay + fall, after which there is nothing left to show. */
const LIFETIME = 2400;

/**
 * Deterministic noise in 0..1. Every property of a bit is drawn from this
 * rather than from its index, so nothing lines up into a pattern, and a
 * re-render does not reshuffle a burst that is already in the air.
 */
function noise(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function bit(i: number) {
  const across = i / (COUNT - 1);
  const left = 9 + across * 82 + (noise(i, 1) - 0.5) * 7;
  // Drift outward from the middle, so the batch spreads as it falls the way a
  // burst does, instead of dropping in parallel columns like a curtain.
  const outward = (left - 50) / 50;
  const round = noise(i, 9) > 0.72;
  const width = 5 + noise(i, 10) * 4;

  return {
    round,
    left,
    width,
    height: round ? width : 8 + noise(i, 11) * 6,
    drift: outward * 26 + (noise(i, 2) - 0.5) * 26,
    fall: 58 + noise(i, 3) * 38,
    spin: (noise(i, 4) < 0.5 ? -1 : 1) * (200 + noise(i, 5) * 520),
    // Turning about the horizontal axis foreshortens the piece, which is what
    // reads as a scrap of paper flipping over as it falls.
    flip: 180 + noise(i, 6) * 720,
    duration: 1150 + noise(i, 7) * 800,
    delay: noise(i, 8) * 280,
    colour: COLOURS[Math.floor(noise(i, 12) * COLOURS.length)],
  };
}

/**
 * Confetti-lite: a handful of CSS particles, no library (docs/06 caps this at
 * ~2KB). Renders nothing under reduced motion, and takes itself down once the
 * last piece has faded rather than leaving an overlay on the screen.
 */
export function Confetti({ active }: { active: boolean }) {
  const [spent, setSpent] = useState(false);

  const reduced =
    typeof window !== 'undefined' &&
    (document.documentElement.dataset.reduceMotion === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (!active || reduced) return;
    const timer = window.setTimeout(() => setSpent(true), LIFETIME);
    return () => window.clearTimeout(timer);
  }, [active, reduced]);

  if (!active || reduced || spent) return null;

  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: COUNT }, (_, i) => {
        const b = bit(i);
        return (
          <span
            key={i}
            className={`confetti__bit${b.round ? ' confetti__bit--round' : ''}`}
            style={
              {
                left: `${b.left}%`,
                width: `${b.width}px`,
                height: `${b.height}px`,
                background: b.colour,
                animationDuration: `${b.duration}ms`,
                animationDelay: `${b.delay}ms`,
                '--drift': `${b.drift}px`,
                '--fall': `${b.fall}dvh`,
                '--spin': `${b.spin}deg`,
                '--flip': `${b.flip}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
