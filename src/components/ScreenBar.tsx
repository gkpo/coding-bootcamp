import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { BackIcon } from './icons';
import './ScreenBar.css';

/** Kept in step with the height in ScreenBar.css: the observer has to know
    how much of the screen the bar is covering. */
const BAR_HEIGHT = 52;

type Props = {
  /** Where the chevron goes. */
  to: string;
  /** The parent, named. The same word as the tab it returns to. */
  label: string;
  /** The screen title the bar stands in for once that title scrolls away. */
  watch: RefObject<HTMLElement | null>;
  /** What to show in its place. Decorative: it repeats the title verbatim. */
  children?: ReactNode;
};

/**
 * The top bar on a detail screen: the way back, and, once you have scrolled
 * past the title, the name of the thing you are reading.
 *
 * A back link on its own is furniture. The bar earns the 52px it costs by
 * carrying the title through a long path or a long cheat sheet, where the
 * question "which track is this again" is the one actually being asked.
 */
export function ScreenBar({ to, label, watch, children }: Props) {
  const past = useScrolledPast(watch);

  return (
    <div className={past ? 'screen-bar is-past' : 'screen-bar'}>
      <Link to={to} className="screen-bar__back">
        <BackIcon size={20} />
        <span>{label}</span>
      </Link>
      {children !== undefined && (
        <div className="screen-bar__context" aria-hidden>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * True once the watched element has left through the top of the screen, the
 * bar's own height counted as part of the top edge.
 *
 * An observer rather than a scroll handler: the browser does the geometry off
 * the main thread, and there is no listener firing on every frame of a flick.
 */
function useScrolledPast(ref: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `-${BAR_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return past;
}
