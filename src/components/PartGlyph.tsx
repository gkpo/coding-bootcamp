import type { ReactNode } from 'react';
import type { PartKind } from '../engine/archgraph';
import './ConceptIcon.css';

/**
 * The parts a build-mode board is made of (docs/12 part C).
 *
 * Same hand: inline SVG on a 24x24 grid, 1.8 stroke, round caps, drawn to
 * match ConceptIcon rather than imported from anywhere. The fixed vocabulary
 * is the point of the mode: the cache is the same shape every time, which is
 * how a whiteboard shape becomes a reflex.
 */
const P: Record<PartKind, ReactNode> = {
  client: (
    <>
      <rect x="6.8" y="2.8" width="10.4" height="18.4" rx="2.2" />
      <path d="M10.4 18.6h3.2" />
    </>
  ),
  cdn: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M5.4 7.4a11 11 0 0 0 0 9.2M18.6 7.4a11 11 0 0 1 0 9.2" />
    </>
  ),
  lb: (
    <>
      <path d="M2.8 12h4" />
      <circle cx="9.2" cy="12" r="2.3" />
      <path d="M11.5 12h3M14.5 12l3.4-4.6M14.5 12h6.7M14.5 12l3.4 4.6" />
    </>
  ),
  server: (
    <>
      <rect x="3.2" y="4" width="17.6" height="6.6" rx="1.8" />
      <rect x="3.2" y="13.4" width="17.6" height="6.6" rx="1.8" />
      <path d="M6.6 7.3h.01M6.6 16.7h.01" strokeWidth={2.6} />
    </>
  ),
  queue: (
    <>
      <rect x="2.8" y="8" width="18.4" height="8" rx="1.8" />
      <path d="M8.9 8v8M15.1 8v8" />
    </>
  ),
  worker: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3.4v2.8M12 17.8v2.8M20.6 12h-2.8M6.2 12H3.4M18.1 5.9l-2 2M7.9 16.1l-2 2M18.1 18.1l-2-2M7.9 7.9l-2-2" />
    </>
  ),
  cache: (
    <>
      <rect x="3" y="4.6" width="18" height="14.8" rx="2.4" />
      <path d="M13.4 7.8 9.7 12.6h3.2L10.6 16.2" />
    </>
  ),
  db: (
    <>
      <path d="M4 6c0-1.6 3.6-2.9 8-2.9s8 1.3 8 2.9-3.6 2.9-8 2.9S4 7.6 4 6z" />
      <path d="M4 6v6c0 1.6 3.6 2.9 8 2.9s8-1.3 8-2.9V6" />
      <path d="M4 12v6c0 1.6 3.6 2.9 8 2.9s8-1.3 8-2.9v-6" />
    </>
  ),
  replica: (
    <>
      <path d="M7.4 8.2c0-1.4 2.9-2.6 6.3-2.6s6.3 1.2 6.3 2.6-2.8 2.6-6.3 2.6-6.3-1.2-6.3-2.6z" />
      <path d="M7.4 8.2v8.6c0 1.4 2.9 2.6 6.3 2.6s6.3-1.2 6.3-2.6V8.2" />
      <path d="M4.2 16.4V6.6c0-.9.9-1.7 2.4-2.2" />
    </>
  ),
  blob: (
    <>
      <path d="M9 3.6h5.9L19 7.8v12.6H9z" />
      <path d="M14.9 3.6v4.2H19" />
      <path d="M5.6 6.8v13.6h10.2" />
    </>
  ),
  'ext-api': (
    <>
      <path d="M13.6 4.4h6v6M19.6 4.4 12.2 11.8" />
      <path d="M17.8 14.2v4.4a1.6 1.6 0 0 1-1.6 1.6H5.8a1.6 1.6 0 0 1-1.6-1.6V8.2a1.6 1.6 0 0 1 1.6-1.6h4.4" />
    </>
  ),
};

export function PartGlyph({ kind, size = 24 }: { kind: PartKind; size?: number }) {
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
      {P[kind]}
    </svg>
  );
}
