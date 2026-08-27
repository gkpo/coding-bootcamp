import { useEffect, useState } from 'react';

function prefersReduced() {
  return (
    document.documentElement.dataset.reduceMotion === 'true' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Ticks a number up from zero on mount. A figure that climbs to its total
 * reads as earned in a way the same figure printed instantly does not, which
 * is the whole of the celebration on the summary screen (docs/06 §Motion).
 *
 * Returns the target immediately under reduced motion, by either route.
 */
export function useCountUp(target: number, duration = 700) {
  // Seeded rather than assigned in the effect: starting at the target and
  // dropping to zero would flash the full figure for a frame.
  const [value, setValue] = useState(() => (prefersReduced() ? target : 0));

  useEffect(() => {
    if (prefersReduced()) {
      setValue(target);
      return;
    }
    let frame = requestAnimationFrame(step);
    let start: number | null = null;

    function step(now: number) {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      // Quadratic ease out. Cubic put nine tenths of the total on screen in
      // the first third of the time, which read as a jump followed by a stall.
      setValue(Math.round(target * (1 - Math.pow(1 - t, 2))));
      if (t < 1) frame = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
