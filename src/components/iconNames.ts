/**
 * The icon vocabulary, as plain data.
 *
 * Split from the drawing code so `content/` can name an icon without pulling
 * React into the content module graph, which the engine tests also load.
 * ConceptIcon types its path table as Record<IconName, ReactNode>, so adding a
 * name here without drawing it is a compile error.
 */
export const ICON_NAMES = [
  'growth',
  'halve',
  'sort',
  'loop',
  'key',
  'balance',
  'note',
  'speech',
  'coins',
  'window',
  'pointers',
  'graph',
  'compass',
  'warning',
  'clock',
  'cursor',
  'link',
  'braces',
  'ladder',
  'door',
  'target',
  'sparkle',
  'blocks',
  'database',
  'inbox',
  'gauge',
  'shield',
  'component',
  'globe',
  'cookie',
  'rows',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
