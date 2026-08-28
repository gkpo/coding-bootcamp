import type { RunPlan } from './flowRun';

/**
 * The schedule a run's packets fly to (docs/12 part D).
 *
 * Pure: no React, no DOM, no clock. The driver in playRun.ts turns these
 * windows into pixels, and the numbers here are what the tests can hold on
 * to. Everything is milliseconds from the moment the run starts.
 */

/**
 * How fast traffic moves, in pixels per second.
 *
 * A speed rather than a duration per hop. Given a flat time per hop, a two
 * hop route travels faster than a one hop route on the same board and every
 * check moves at its own pace; given a speed, a longer route simply takes
 * longer, which is both truer and the only way the whole run reads as one
 * system rather than a set of unrelated animations.
 */
export const SPEED = 320;

/** How many packets ride one route at once. */
export const PACKETS = 3;

/**
 * The distance from one packet to the one in front, in pixels.
 *
 * A distance, not an interval. At a single constant speed the two are the
 * same thing, which is exactly why the gap cannot drift: nothing on the board
 * ever changes pace, so nothing can close up or stretch out.
 */
export const GAP = 34;

/** What a check with nothing to walk costs. The docs/06 standard duration. */
export const REST_MS = 250;

/** How long a stopped packet sits at the break before it fades. */
export const STALL_MS = 140;

/** How far from each end of a route a packet fades, in pixels. */
export const FADE_PX = 12;

/** How long a packet with nowhere to travel takes to fade, in milliseconds. */
export const FADE_MS = 90;

/** What it costs traffic to cover a distance, in milliseconds. */
export function timeFor(px: number): number {
  return (px / SPEED) * 1000;
}

export interface PacketWindow {
  /** Index into the plan's steps: whose route this packet is flying. */
  leg: number;
  /** Its place in the convoy, 0 for the one in front. */
  place: number;
  depart: number;
  arrive: number;
  /** The route's drawn length in pixels. Zero when there is nowhere to go. */
  length: number;
  /**
   * True when the route it is flying ends at a break rather than a
   * destination, so it holds there and fades instead of entering a part.
   */
  stalls: boolean;
}

export interface RunTimeline {
  /** When each check's ring fills, by step index. */
  resolveAt: number[];
  packets: PacketWindow[];
  /** When the last check resolves: the run is decided here. */
  decidedAt: number;
  /** When the last packet has finished fading: the driver can stop here. */
  duration: number;
}

/**
 * @param lengths the drawn length of each step's route in pixels, in step
 * order. A step with nowhere to travel can pass zero.
 * @param moving false under reduced motion: every check takes the same flat
 * rest and no packet flies, but the order and the pace of the rings are
 * untouched, so the run still reads as a sequence of results (docs/12).
 */
export function planPackets(plan: RunPlan, lengths: number[], moving: boolean): RunTimeline {
  const resolveAt: number[] = [];
  const windows: PacketWindow[] = [];
  let at = 0;

  plan.steps.forEach((step, leg) => {
    const travels = moving && step.route.length > 1;
    const length = travels ? Math.max(0, lengths[leg] ?? 0) : 0;
    const legMs = length > 0 ? timeFor(length) : REST_MS;
    // A check that stops on a part rather than reaching one. Its traffic holds
    // at the break instead of landing, which is what makes a failure visible
    // as something not flowing rather than as something simply absent.
    const stalls = step.stopsAt !== null;
    // A route with nowhere to travel gets one packet, not a convoy: three of
    // them on the same pixel are not three packets, they are one brighter dot.
    const convoy = length > 0 ? PACKETS : 1;

    if (moving && step.route.length > 0) {
      for (let place = 0; place < convoy; place += 1) {
        const behind = timeFor(place * GAP);
        windows.push({
          leg,
          place,
          length,
          depart: at + behind,
          arrive: at + (length > 0 ? legMs : 0) + behind,
          stalls,
        });
      }
    }

    at += legMs;
    resolveAt.push(at);
  });

  const tails = windows.map((w) => w.arrive + (w.stalls ? STALL_MS + FADE_MS : 0));
  return {
    resolveAt,
    packets: windows,
    decidedAt: at,
    duration: Math.max(at, ...tails, 0),
  };
}

/**
 * How far along its route a packet is, 0 to 1, or null before it sets off.
 *
 * Linear, and deliberately so. Distance is what is held constant here, and an
 * eased packet is at a different speed from the one behind it every time it is
 * ramping up or down, which is precisely what opens and closes the gap.
 */
export function progressOf(window: PacketWindow, now: number): number | null {
  if (now < window.depart) return null;
  if (window.length <= 0) return 0;
  const span = window.arrive - window.depart;
  return span <= 0 ? 1 : Math.min((now - window.depart) / span, 1);
}

/**
 * How visible a packet is at a given moment, 0 to 1.
 *
 * Every packet is lit the same: the convoy is a stream, not a leader with an
 * escort, and grading them would put a front and a back on something whose
 * whole character is that each one is the same as the last.
 */
export function opacityOf(window: PacketWindow, now: number): number {
  if (now < window.depart) return 0;

  const held = window.arrive + (window.stalls ? STALL_MS : 0);
  // A packet that arrived somewhere has already faded into the part it
  // reached; one that stopped short holds on the break and then goes.
  if (now >= held) return window.stalls ? Math.max(0, 1 - (now - held) / FADE_MS) : 0;
  if (now >= window.arrive) return 1;
  if (window.length <= 0) return Math.min(1, (now - window.depart) / FADE_MS);

  // Fading over a fixed distance rather than a fixed time is what makes a
  // packet look like it is coming out of one box and going into the next,
  // whatever the length of the connection between them.
  const travelled = (progressOf(window, now) ?? 0) * window.length;
  const edge = Math.min(FADE_PX, window.length / 2);
  const entering = travelled / edge;
  const leaving = window.stalls ? 1 : (window.length - travelled) / edge;
  return Math.max(0, Math.min(1, entering, leaving));
}
