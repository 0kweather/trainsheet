// Switzerland's trains (scripts/railroads/switzerland.py): placed from the
// national timetable (data/schedules/<railroad>.json) and moved by
// opentransportdata.swiss's GTFS-Realtime trip updates, which the relay
// passes on compacted:
//   { at, v, trips: [[start date "20261023", first departure "12:41",
//                     cancelled 0/1, [[uic, arrival delay s, departure delay s, skipped 0/1], ...]], ...] }
// a stop listed only where its update differs from the one before. The
// feed's trip ids change with each timetable version, so a trip is found
// by its service day, its first departure and the stations its updates name
// (each run of the timetable starts at one minute of one day; trains coupled
// together, which share both, take the same delays).

import { timetableTrains } from "../sources.js?v=dev";

const IDS = ["sbb", "sbbregio", "bls", "sob", "thurbo", "regionalps", "tpf", "chstdother", "rhb", "mgb", "zb", "mob",
  "chnarrowother", "chintl"];
const TZ = "Europe/Zurich";
const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// The feed's trips by "<service day>|<minutes of their first departure>".
function index(json) {
  const out = new Map();
  for (const [date, hhmm, cancelled, stops] of json?.trips || []) {
    const key = `${date}|${+hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5)}`;
    if (!out.has(key)) out.set(key, []);
    out.get(key).push({ cancelled: Boolean(cancelled), stops: stops || [] });
  }
  return out;
}

// The feed's trip for a run of the timetable: of those that set out on its
// day at its minute, the one naming most of its stations (one at least).
function tripFor(trips, run) {
  const date = dayOf.format((run.day + 7200) * 1000).replaceAll("-", "");
  const list = trips.get(`${date}|${run.pat[0][2]}`);
  if (!list) return null;
  const mine = new Set(run.pat.map(([id]) => id));
  let best = null, score = 0;
  for (const t of list) {
    const n = t.stops.filter(([uic]) => mine.has(String(uic))).length;
    if (n > score || (!best && !t.stops.length && t.cancelled && list.length === 1)) [best, score] = [t, n];
  }
  return best;
}

// The run's stops shifted by the trip's updates: each update holds from its
// stop on (until the next), the first one also for the stops before it.
export function shifted(stops, trip, now) {
  const ups = [];
  let from = 0;
  for (const u of trip.stops) {
    const at = stops.findIndex((s, i) => i >= from && s.stopId === String(u[0]));
    if (at >= 0) { ups.push([at, u]); from = at; }
  }
  if (!ups.length) return null;
  let k = -1;
  const out = stops.map((s, i) => {
    while (k + 1 < ups.length && ups[k + 1][0] <= i) k++;
    const [, arr, dep, skip] = k >= 0 ? ups[k][1] : [0, ups[0][1][1], ups[0][1][2], 0];
    const a = s.arrival.time + arr;
    return { ...s, arrival: { time: a }, departure: { time: Math.max(a, s.departure.time + dep) }, skipped: Boolean(skip) && k >= 0 };
  });
  // Its delay: at the next stop it hasn't left.
  const next = out.find((s) => !s.skipped && s.departure.time >= now - 30) || out[out.length - 1];
  const i = out.indexOf(next);
  const late = (next.arrival.time - stops[i].arrival.time) / 60;
  return { stops: out, delay: Math.round(late * 10) / 10 };
}

export const parse = {
  switzerland: async (json) => {
    const trips = index(json);
    const now = Date.now() / 1000;
    const live = (run, stops) => {
      const trip = tripFor(trips, run);
      if (!trip) return null;
      if (trip.cancelled) return { cancelled: true };
      return shifted(stops, trip, now);
    };
    return (await Promise.all(IDS.map((a) => timetableTrains(a, live)))).flat();
  },
};
