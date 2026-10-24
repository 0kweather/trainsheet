// BDZ's trains (scripts/railroads/bdz.py): placed from its timetable
// (data/schedules/bdz.json) on the drawn track and moved by the National
// Access Point's GTFS-realtime feeds, which the relay passes on as one
// message (the positions, the trip updates appended).
//
// The feed's positions aren't fixes: each is the timetable's place for the
// moment shifted by the train's delay (a train standing at a station sits
// on the station's own point, one that hasn't left yet at its first stop),
// so they're read for that delay, and the train drawn where the timetable
// and the delay put it, on the track, as Switzerland's are. A trip update,
// where there is one, gives every stop's time (its delays from BDZ's
// dispatchers' reports); a train with neither runs to its timetable.
//
// A trip id is the train's number, its category and its service day
// ("1611-BV-20261024"), as the timetable's trips are named.

import { timetableTrains, loadRuns } from "../sources.js?v=dev";
import { decodeFeed } from "../gtfsrt.js?v=dev";

const TZ = "Europe/Sofia";
const SLACK = 3 * 3600; // timetableTrains' with live delays: its runs come from the same file
const STALE = 10 * 60; // a feed older than this is no use
const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const keyOf = (tripId) => ((m) => m && `${m[1]}|${m[2]}`)(/^(\d+)-[A-Z]+-(\d{8})$/.exec(tripId || ""));

// The run's stops at the trip update's times: each stop it names takes its
// arrival and departure (a time missing, the other, or the stop before's
// delay); a stop it doesn't name keeps the delay of the one before.
export function fromUpdate(stops, u, now) {
  const at = new Map(u.stops.filter((s) => s.stopId).map((s) => [s.stopId, s]));
  if (!at.size) return null;
  let delay = 0, any = false;
  const out = stops.map((s) => {
    const x = at.get(s.stopId);
    if (!x) {
      return { ...s, arrival: { time: s.arrival.time + delay }, departure: { time: s.departure.time + delay } };
    }
    any = true;
    const arr = x.arrival?.time ?? (x.arrival?.delay != null ? s.arrival.time + x.arrival.delay : null);
    const dep = x.departure?.time ?? (x.departure?.delay != null ? s.departure.time + x.departure.delay : null);
    const a = arr ?? (dep != null ? Math.min(dep, s.arrival.time + (dep - s.departure.time)) : s.arrival.time + delay);
    const d = Math.max(a, dep ?? s.departure.time + (a - s.arrival.time));
    delay = d - s.departure.time;
    return { ...s, arrival: { time: a }, departure: { time: d }, skipped: Boolean(x.skipped) };
  });
  if (!any) return null;
  return { stops: out, delay: lateness(stops, out, now) };
}

// Minutes late at the next stop it hasn't left (to a tenth).
function lateness(stops, out, now) {
  let i = out.findIndex((s) => !s.skipped && s.departure.time >= now - 30);
  if (i < 0) i = out.length - 1;
  return Math.round(Math.max(0, out[i].arrival.time - stops[i].arrival.time) / 6) / 10;
}

// The delay a position stands for: where along its leg the timetable would
// have it, against where the feed has it. Standing at a stop it should have
// left, the time since it was due out; on the way to a stop, the time the
// timetable puts it at that point of the leg (its share of the straight
// line between the two stops; the feed's are along the line, near enough
// the same share). All as of the position's time, not now: the relay's copy
// can be half a minute old.
export function delayOf(stops, v, places, now) {
  const at = v.timestamp || now;
  const i = stops.findIndex((s) => s.stopId === v.stopId);
  if (i < 0) return null;
  const s = stops[i];
  if (v.status === 1 || i === 0) return Math.max(0, at - s.departure.time);
  const p = places[stops[i - 1].stopId], q = places[s.stopId], pos = v.position;
  if (!p || !q || !pos) return Math.max(0, at - s.arrival.time);
  const cos = Math.cos((pos.lat * Math.PI) / 180);
  const ax = p[2] * cos, ay = p[1], bx = q[2] * cos, by = q[1], px = pos.lon * cos, py = pos.lat;
  const len = (bx - ax) ** 2 + (by - ay) ** 2;
  const f = len ? Math.min(1, Math.max(0, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / len)) : 1;
  const t0 = stops[i - 1].departure.time, t1 = s.arrival.time;
  return Math.max(0, at - (t0 + f * (t1 - t0)));
}

// The run's stops shifted by a delay from the stop before the one it's
// heading to (the ones behind it as timetabled).
function shiftedFrom(stops, delay, from, now) {
  const out = stops.map((s, i) => (i < from ? s
    : { ...s, arrival: { time: s.arrival.time + delay }, departure: { time: s.departure.time + delay } }));
  return { stops: out, delay: lateness(stops, out, now) };
}

export const parse = {
  bdz: async (buf) => {
    const feed = decodeFeed(buf);
    const now = Date.now() / 1000;
    const fresh = !feed.timestamp || now - feed.timestamp < STALE;
    const updates = new Map(), positions = new Map();
    if (fresh) {
      for (const u of feed.tripUpdates) { const k = keyOf(u.trip?.tripId); if (k) updates.set(k, u); }
      for (const v of feed.vehicles) { const k = keyOf(v.trip?.tripId); if (k) positions.set(k, v); }
    }
    const tt = await loadRuns("bdz", SLACK).catch(() => null);
    const live = (run, stops, number) => {
      const key = `${number}|${dayOf.format((run.day + 7200) * 1000).replaceAll("-", "")}`;
      const u = updates.get(key);
      const byUpdate = u ? fromUpdate(stops, u, now) : null;
      if (byUpdate) return byUpdate;
      const v = positions.get(key);
      if (!v || !tt) return null;
      const d = delayOf(stops, v, tt.stops, now);
      if (d == null) return null;
      const i = stops.findIndex((s) => s.stopId === v.stopId);
      return shiftedFrom(stops, Math.round(d), Math.max(0, v.status === 1 ? i : i - 1), now);
    };
    return timetableTrains("bdz", live);
  },
};
