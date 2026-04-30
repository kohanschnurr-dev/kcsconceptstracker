/**
 * Lane-packing for week-row event bars (Google Calendar style).
 *
 * Given a list of events with [startDate, endDate] (inclusive) and a week's
 * [weekStart, weekEnd] (inclusive, 7 days), assigns each overlapping event
 * a clipped column range [startCol..endCol] (0..6) and a lane index.
 * Lanes are packed greedily — earliest start first, shortest event as
 * tie-breaker — into the lowest available lane.
 *
 * Returns:
 *   - placed: events visible up to maxLanes (lane < maxLanes)
 *   - overflow: events that didn't fit, grouped by day for "+N more"
 */
import { startOfDay, differenceInDays, isWithinInterval } from "date-fns";

export interface LaneEvent<T> {
  event: T;
  startDate: Date;
  endDate: Date;
}

export interface PlacedBar<T> {
  event: T;
  lane: number;
  startCol: number; // 0..6 within the week
  endCol: number;   // 0..6 within the week, inclusive
  continuesLeft: boolean;  // true if event extends before this week
  continuesRight: boolean; // true if event extends after this week
}

export interface LaneLayoutResult<T> {
  placed: PlacedBar<T>[];
  /** For each column 0..6, ids/events that overflowed (lane >= maxLanes). */
  overflowByCol: T[][];
}

export function computeWeekLaneLayout<T>(
  items: LaneEvent<T>[],
  weekStart: Date,
  weekEnd: Date,
  maxLanes = 3,
): LaneLayoutResult<T> {
  const wStart = startOfDay(weekStart);
  const wEnd = startOfDay(weekEnd);

  // Filter to events that overlap the week and clip to week boundaries
  const clipped = items
    .map((it) => {
      const s = startOfDay(it.startDate);
      const e = startOfDay(it.endDate);
      if (e < wStart || s > wEnd) return null;
      const cs = s < wStart ? wStart : s;
      const ce = e > wEnd ? wEnd : e;
      const startCol = differenceInDays(cs, wStart);
      const endCol = differenceInDays(ce, wStart);
      return {
        event: it.event,
        origStart: s,
        origEnd: e,
        startCol,
        endCol,
        continuesLeft: s < wStart,
        continuesRight: e > wEnd,
      };
    })
    .filter(Boolean) as Array<{
    event: T;
    origStart: Date;
    origEnd: Date;
    startCol: number;
    endCol: number;
    continuesLeft: boolean;
    continuesRight: boolean;
  }>;

  // Sort: longer (earlier-starting, latest-ending) first so multi-day bars
  // claim the top lanes; single-day events fill remaining slots predictably.
  clipped.sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    const aLen = a.endCol - a.startCol;
    const bLen = b.endCol - b.startCol;
    return bLen - aLen;
  });

  // Lane occupancy: lanes[laneIdx][col] = true if taken.
  const lanes: boolean[][] = [];
  const placed: PlacedBar<T>[] = [];
  const overflowByCol: T[][] = Array.from({ length: 7 }, () => []);

  for (const c of clipped) {
    let assigned = -1;
    for (let l = 0; l < lanes.length; l++) {
      let free = true;
      for (let col = c.startCol; col <= c.endCol; col++) {
        if (lanes[l][col]) { free = false; break; }
      }
      if (free) { assigned = l; break; }
    }
    if (assigned === -1) {
      assigned = lanes.length;
      lanes.push(Array(7).fill(false));
    }
    for (let col = c.startCol; col <= c.endCol; col++) lanes[assigned][col] = true;

    if (assigned < maxLanes) {
      placed.push({
        event: c.event,
        lane: assigned,
        startCol: c.startCol,
        endCol: c.endCol,
        continuesLeft: c.continuesLeft,
        continuesRight: c.continuesRight,
      });
    } else {
      for (let col = c.startCol; col <= c.endCol; col++) overflowByCol[col].push(c.event);
    }
  }

  return { placed, overflowByCol };
}

export function eventOverlapsDay<T extends { startDate: Date; endDate: Date }>(
  ev: T, day: Date,
): boolean {
  const d = startOfDay(day);
  const s = startOfDay(ev.startDate);
  const e = startOfDay(ev.endDate);
  return isWithinInterval(d, { start: s, end: e });
}
