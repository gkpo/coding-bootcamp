import type { LaneId, PartKind } from '../engine/archgraph';

/**
 * What the parts are called on screen (docs/12 part C).
 *
 * Two names each, for two jobs. The chip face has about 50px to work with, so
 * it takes the short one; everything that speaks in sentences (hints, screen
 * reader labels) takes the full one. Splitting them is what lets the board
 * stay a board without the copy turning into abbreviations.
 */
export const PART_LABEL: Record<PartKind, string> = {
  client: 'Client',
  cdn: 'CDN',
  lb: 'Balancer',
  server: 'Server',
  queue: 'Queue',
  worker: 'Worker',
  cache: 'Cache',
  db: 'Database',
  replica: 'Replica',
  blob: 'Files',
  'ext-api': 'Service',
};

/** The full name, used mid-sentence, so it is lower case except for names. */
export const PART_NAME: Record<PartKind, string> = {
  client: 'client',
  cdn: 'CDN',
  lb: 'load balancer',
  server: 'API server',
  queue: 'queue',
  worker: 'worker',
  cache: 'cache',
  db: 'database',
  replica: 'read replica',
  blob: 'file storage',
  'ext-api': 'outside service',
};

/** The lane rail, top to bottom. Where a kind of part is allowed to sit. */
export const LANE_LABEL: Record<LaneId, string> = {
  edge: 'Edge',
  entry: 'Entry',
  compute: 'Compute',
  async: 'Async',
  data: 'Data',
};
