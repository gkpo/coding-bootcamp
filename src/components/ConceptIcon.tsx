import type { ReactNode } from 'react';
import { type IconName } from './iconNames';
import './ConceptIcon.css';

/**
 * The icon vocabulary for tracks, concept cards and onboarding.
 *
 * Hand-drawn inline SVG on a 24x24 grid, 1.8 stroke, round caps and joins, to
 * match the tab bar (docs/05: inline SVG copied in, no icon font, no package).
 *
 * Deliberately reused across cards rather than one bespoke glyph per card. A
 * shared vocabulary reads as a system; forty-nine unrelated pictures read as
 * decoration, which is the thing being avoided.
 */

const P: Record<IconName, ReactNode> = {
  growth: <path d="M3 17.5 9.5 11l4 4L21 7.5M15 7.5h6v6" />,
  halve: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <path d="M20 4 8.6 15.4M14.9 14.3 20 20M8.6 8.6 12 12" />
    </>
  ),
  sort: <path d="M4 6.5h16M4 12h10M4 17.5h5" />,
  loop: (
    <path d="M17 2.5 21 6.5l-4 4M3 11.5v-1a4 4 0 0 1 4-4h14M7 21.5l-4-4 4-4M21 12.5v1a4 4 0 0 1-4 4H3" />
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="M10.2 13 20 3.5M16.5 7l2.5 2.5M13.8 9.7l2.5 2.5" />
    </>
  ),
  balance: (
    <>
      <path d="M12 4v16M7.5 20h9M4 8h16" />
      <path d="M4 8 1.8 13a3 3 0 0 0 4.4 0zM20 8l2.2 5a3 3 0 0 1-4.4 0z" />
    </>
  ),
  note: <path d="M6.5 3h8L18 6.5V21H6.5zM14.5 3v3.5H18" />,
  speech: <path d="M4 5.5h16v9.5H9.5L5.5 19v-4H4z" />,
  coins: (
    <>
      <path d="M3.5 6.5c0-1.6 3.2-2.9 7-2.9s7 1.3 7 2.9-3.2 2.9-7 2.9-7-1.3-7-2.9z" />
      <path d="M3.5 6.5v4.3c0 1.6 3.2 2.9 7 2.9M17.5 6.5v4.3" />
      <path d="M6.5 17.5c0-1.6 3.2-2.9 7-2.9s7 1.3 7 2.9-3.2 2.9-7 2.9-7-1.3-7-2.9z" />
    </>
  ),
  window: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9.5h18" />
    </>
  ),
  pointers: <path d="M3 12h7M14 12h7M7 9l3 3-3 3M17 9l-3 3 3 3" />,
  graph: (
    <>
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="18" cy="6.5" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M8.5 6.5h7M7.4 8.7l3.3 7.1M16.6 8.7l-3.3 7.1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M15.8 8.2 13.4 14l-5.8 2.4L10 10.6z" />
    </>
  ),
  warning: <path d="M12 4.2 21 20H3zM12 10v4.2M12 17.2h.01" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7v5.3l3.2 2" />
    </>
  ),
  cursor: <path d="M5.5 3.2 19 10.4l-5.7 1.9-2 5.9z" />,
  link: (
    <path d="M9.6 14.4 14.4 9.6M11.2 6.4 13 4.6a4.2 4.2 0 0 1 5.9 5.9l-1.8 1.8M12.8 17.6 11 19.4a4.2 4.2 0 0 1-5.9-5.9l1.8-1.8" />
  ),
  braces: (
    <path d="M8.5 3.5c-2 0-2.2 2-2.2 4s-.3 3.2-2.3 4.5c2 1.3 2.3 2.5 2.3 4.5s.2 4 2.2 4M15.5 3.5c2 0 2.2 2 2.2 4s.3 3.2 2.3 4.5c-2 1.3-2.3 2.5-2.3 4.5s-.2 4-2.2 4" />
  ),
  ladder: <path d="M7 3v18M17 3v18M7 8h10M7 12.5h10M7 17h10" />,
  door: (
    <>
      <path d="M6 3h12v18H6z" />
      <circle cx="14.8" cy="12" r="1.1" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5 14 9.2l5.7 2-5.7 2-2 5.7-2-5.7-5.7-2 5.7-2zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  ),
  blocks: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  database: (
    <>
      <path d="M4 6c0-1.6 3.6-2.9 8-2.9s8 1.3 8 2.9-3.6 2.9-8 2.9S4 7.6 4 6z" />
      <path d="M4 6v6c0 1.6 3.6 2.9 8 2.9s8-1.3 8-2.9V6" />
      <path d="M4 12v6c0 1.6 3.6 2.9 8 2.9s8-1.3 8-2.9v-6" />
    </>
  ),
  inbox: <path d="M3.5 13.5h4.8l1.7 2.8h4l1.7-2.8h4.8M6 4.5h12l2.5 9v6h-17v-6z" />,
  gauge: (
    <>
      <path d="M3.6 17.5a9 9 0 1 1 16.8 0" />
      <path d="M12 17.5 16 11.5" />
    </>
  ),
  shield: <path d="M12 3.2 20 6v6.2c0 4.9-3.4 7.9-8 8.8-4.6-.9-8-3.9-8-8.8V6z" />,
};

export type { IconName };

export function ConceptIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      {P[name]}
    </svg>
  );
}
