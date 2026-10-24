// The Netherlands' trains (scripts/railroads/nl.py): placed from OVapi's
// national timetable (data/schedules/<railroad>.json) and moved by OVapi's
// GTFS-Realtime trainUpdates (NS's InfoPlus), which the relay passes on
// compacted:
//   { at, trips: [[service date "20261024", train number "4974", cancelled 0/1,
//                  [[station code, arrival delay s, departure delay s, skipped 0/1], ...]], ...] }
// a stop listed only where it differs from the one before or is skipped. A train of the
// timetable is found by its number and its service day (a number is one
// train's on its day; where a train that splits or joins has two runs of
// it, by the stations they share).

import { timetableTrains } from "../sources.js?v=dev";

const IDS = ["ns", "nlregio", "nlintl"];
const TZ = "Europe/Amsterdam";
const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// The feed's trips by "<service day>|<train number>".
function index(json) {
  const out = new Map();
  for (const [date, number, cancelled, stops] of json?.trips || []) {
    const key = `${date}|${number}`;
    if (!out.has(key)) out.set(key, []);
    out.get(key).push({ cancelled: Boolean(cancelled), stops: stops || [] });
  }
  return out;
}

// The feed's trip for a run of the timetable: of those of its number on its
// day, the one naming most of its stations (a cancelled train may name none).
function tripFor(trips, run, number) {
  const date = dayOf.format((run.day + 7200) * 1000).replaceAll("-", "");
  const list = trips.get(`${date}|${number.replace(/~.*$/, "")}`);
  if (!list) return null;
  if (list.length === 1) return list[0];
  const mine = new Set(run.pat.map(([id]) => id));
  let best = null, score = 0;
  for (const t of list) {
    const n = t.stops.filter(([code]) => mine.has(code)).length;
    if (n > score) [best, score] = [t, n];
  }
  return best;
}

// The run's stops shifted by the trip's updates: each update's delays hold
// from its stop on (until the next), the first one's also for the stops
// before it; a stop is skipped only where its own update says so (the relay
// lists every skipped stop).
export function shifted(stops, trip, now) {
  const ups = [];
  let from = 0;
  for (const u of trip.stops) {
    const at = stops.findIndex((s, i) => i >= from && s.stopId === u[0]);
    if (at >= 0) { ups.push([at, u]); from = at; }
  }
  if (!ups.length) return null;
  let k = -1;
  const out = stops.map((s, i) => {
    while (k + 1 < ups.length && ups[k + 1][0] <= i) k++;
    const [, arr, dep, skip] = k >= 0 ? ups[k][1] : [0, ups[0][1][1], ups[0][1][2], 0];
    const a = s.arrival.time + arr;
    return { ...s, arrival: { time: a }, departure: { time: Math.max(a, s.departure.time + dep) }, skipped: Boolean(skip) && k >= 0 && ups[k][0] === i };
  });
  // Its delay: at the next stop it hasn't left.
  const next = out.find((s) => !s.skipped && s.departure.time >= now - 30) || out[out.length - 1];
  const i = out.indexOf(next);
  const late = (next.arrival.time - stops[i].arrival.time) / 60;
  return { stops: out, delay: Math.round(late * 10) / 10 };
}

export const parse = {
  nl: async (json) => {
    const trips = index(json);
    const now = Date.now() / 1000;
    const live = (run, stops, number) => {
      const trip = tripFor(trips, run, number);
      if (!trip) return null;
      if (trip.cancelled) return { cancelled: true };
      return shifted(stops, trip, now);
    };
    return (await Promise.all(IDS.map((a) => timetableTrains(a, live)))).flat();
  },
};
