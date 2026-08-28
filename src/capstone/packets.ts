import { stepDuration, type RunPlan } from './flowRun';

/**
 * The schedule a run's packets fly to (docs/12 part D).
 *
 * Pure: no React, no DOM, no clock. The driver in playRun.ts turns these
 * windows into pixels, and the numbers here are what the tests can hold on
 * to. Everything is milliseconds from the moment the run starts.
 */

/** How many packets ride one route. Enough to read as traffic, few enough to count. */
export const PACKETS = 3;

/**
 * How far behind the one in front each packet sets off.
 *
 * The leader arrives exactly when the check resolves, so the run keeps the
 * cadence docs/12 asks for; the ones behind it are still in the air when the
 * next check starts, which is what puts several packets on the board at once
 * without slowing anything down.
 */
export const LEAD_MS = 90;

/** How long a stopped packet sits at the break before it fades. */
export const STALL_MS = 140;

/** Fade in on departure, fade out on arrival. Nothing pops in or out. */
export const FADE_MS = 90;

export interface PacketWindow {
  /** Index into the plan's steps: whose route this packet is flying. */
  leg: number;
  /** Its place in the convoy, 0 for the leader. Followers ride a shade dimmer. */
  place: number;
  depart: number;
  arrive: number;
  /**
   * True when the route it is flying ends at a break rather than a
   * destination, so it holds there and fades instead of simply arriving.
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

export interface PacketOptions {
  hopMs: number;
  restMs: number;
  /**
   * False under reduced motion: every check takes the same flat rest and no
   * packet flies, but the order and the pace of the rings are untouched, so
   * the run still reads as a sequence of results (docs/12 part D).
   */
  packets: boolean;
}

export function planPackets(plan: RunPlan, options: PacketOptions): RunTimeline {
  const { hopMs, restMs, packets } = options;
  const resolveAt: number[] = [];
  const windows: PacketWindow[] = [];
  let at = 0;

  plan.steps.forEach((step, leg) => {
    const legMs = packets ? stepDuration(step, hopMs, restMs) : restMs;
    // A check that stops on a part rather than reaching one. Its traffic holds
    // at the break instead of landing, which is what makes a failure visible
    // as something not flowing rather than as something simply absent.
    const stalls = step.stopsAt !== null;

    // A route with nowhere to travel gets one packet, not a convoy: three of
    // them on the same pixel are not three packets, they are one brighter dot.
    const convoy = step.route.length > 1 ? PACKETS : 1;

    if (packets && step.route.length > 0) {
      for (let place = 0; place < convoy; place += 1) {
        const shift = place * LEAD_MS;
        windows.push({
          leg,
          place,
          depart: at + shift,
          // A route with one part on it has nowhere to travel, so its packets
          // hold where they are for as long as a hop would have taken.
          arrive: at + (step.route.length > 1 ? legMs : 0) + shift,
          stalls,
        });
      }
    }

    at += legMs;
    resolveAt.push(at);
  });

  const tails = windows.map((w) => w.arrive + (w.stalls ? STALL_MS : 0) + FADE_MS);
  return {
    resolveAt,
    packets: windows,
    decidedAt: at,
    duration: Math.max(at, ...tails, 0),
  };
}

/**
 * Where a packet is on its route, 0 to 1, or null when it is not in the air.
 *
 * Distance along the route rather than time through the hop list: the drawn
 * connections are not all the same length, and a packet given a flat 150ms
 * per hop lurches every time it crosses a part. Constant speed in distance is
 * what makes it read as one continuous movement.
 */
export function progressOf(window: PacketWindow, now: number): number | null {
  if (now < window.depart) return null;
  if (now >= window.arrive) return 1;
  const span = window.arrive - window.depart;
  return span <= 0 ? 1 : sail((now - window.depart) / span);
}

/**
 * How visible a packet is at a given moment, 0 to 1.
 *
 * Followers ride dimmer than the leader, which is what gives the convoy a
 * front and a back rather than three identical dots in a row.
 */
export function opacityOf(window: PacketWindow, now: number): number {
  if (now < window.depart) return 0;
  const depth = 1 - window.place * 0.22;
  const held = window.arrive + (window.stalls ? STALL_MS : 0);
  if (now >= held) return depth * Math.max(0, 1 - (now - held) / FADE_MS);
  return depth * Math.min(1, (now - window.depart) / FADE_MS);
}

/** The share of the route spent easing away and easing in. */
const RAMP = 0.22;

/**
 * The speed profile of something that sails: it pulls away, it cruises, it
 * glides in. Linear travel starts and stops dead, which is the difference
 * between a packet and a cursor being dragged.
 *
 * Constant speed through the middle matters as much as the eased ends: with
 * every packet leaving a fixed interval behind the one in front, a constant
 * cruise holds the gaps even, and the convoy reads as a stream rather than as
 * three dots breathing in and out together.
 */
export function sail(u: number): number {
  const t = Math.min(Math.max(u, 0), 1);
  // Area under the speed profile: a full-speed run of (1 - 2r), plus half of
  // each ramp. Dividing by it is what makes sail(1) land exactly on 1.
  const area = 1 - RAMP;
  if (t < RAMP) return (RAMP * ramp(t / RAMP)) / area;
  if (t > 1 - RAMP) return 1 - (RAMP * ramp((1 - t) / RAMP)) / area;
  return (RAMP / 2 + (t - RAMP)) / area;
}

/** Distance covered over a smoothstep ramp, as a share of the ramp's length. */
function ramp(x: number): number {
  // The integral of smoothstep 3x^2 - 2x^3, which is x^3 - x^4 / 2.
  return x * x * x - (x * x * x * x) / 2;
}
