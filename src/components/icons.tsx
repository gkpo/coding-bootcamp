/**
 * Hand-picked inline SVGs (Lucide-derived shapes, copied in) — no icon package.
 * All icons render at 24px on a 24px grid and inherit `currentColor`.
 */
type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false as const,
});

export function HomeIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 10.5 12 3.5l9 7" />
      <path d="M5 9.6V20h14V9.6" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

export function TracksIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6h10" />
      <path d="M4 12h16" />
      <path d="M4 18h7" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="15" cy="18" r="2" />
    </svg>
  );
}

export function ReviewIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 4.5V10H15" />
    </svg>
  );
}

export function SheetsIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 4.5h9.5L19 9v10.5H5z" />
      <path d="M14 4.5V9h5" />
      <path d="M8.5 13h7" />
      <path d="M8.5 16.5h4.5" />
    </svg>
  );
}

export function MeIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </svg>
  );
}

/** The one playful element in the app (design system §Core components). */
export function FlameIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable={false}>
      <path
        d="M12 2.5c.6 3 2.2 4.2 3.8 5.8A7.6 7.6 0 0 1 18.4 14a6.4 6.4 0 1 1-12.8 0c0-2.1.9-3.6 2-4.9.3 1 .9 1.7 1.8 2 .1-3.4 1.3-6.4 2.6-8.6Z"
        fill="currentColor"
      />
      <path
        d="M12 20.2a3.1 3.1 0 0 1-3.1-3.1c0-1.6 1.2-2.5 1.8-3.6.7 1 1.3 1.4 2.1 1.9 1 .6 2.3 1.1 2.3 2.6a3.1 3.1 0 0 1-3.1 2.2Z"
        fill="var(--bg)"
      />
    </svg>
  );
}
