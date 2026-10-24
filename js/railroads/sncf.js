// France's trains (scripts/railroads/sncf.py): placed from their timetables
// (data/schedules/<railroad>.json) and moved by the live trip updates the
// relay compacts (relay/feeds/sncf.js):
//   { at, trips: { number: [[start date "20261024" ("" for Île-de-France's),
//                            cancelled 0/1, kind, [[key, arrival, departure, skipped 0/1], ...]], ...] } }
// kind 0: key a station (UIC number, the timetable's stop id), arrival and
//   departure delays (s), each holding until the next row (SNCF, Eurostar);
// kind 1: key a station, arrival and departure predicted times (unix s;
//   ZOU!'s, which give no delays);
// kind 2: key the stop's timetabled time (unix s), delays (Île-de-France's
//   PRIM feed, whose stop ids are platforms).
// A run's trip is the one with its number, set out on its day, that names
// its stations (or, kind 2, its timetabled times).

import { timetableTrains } from "../sources.js?v=dev";

const NATIONAL = ["tgv", "ouigo", "intercites", "frintl", "ter"];
const TZ = "Europe/Paris";
const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// A run's stops matched to a trip's rows: [[stop index, row], ...] in order.
function matched(stops, trip) {
  const out = [];
  let from = 0;
  for (const row of trip.stops) {
    const at = trip.kind === 2
      ? stops.findIndex((s, i) => i >= from && (Math.abs(s.scheduled - row[0]) <= 60 || Math.abs(s.arrival.time - row[0]) <= 60))
      : stops.findIndex((s, i) => i >= from && s.stopId === String(row[0]));
    if (at >= 0) { out.push([at, row]); from = at; }
  }
  return out;
}

// The trip for a run: of those with its number that set out on its day, the
// one that names most of its stops (a cancelled one alone may name none).
function tripFor(trips, run, number, stops) {
  const list = trips[number.replace(/~.*$/, "")];
  if (!list) return null;
  const date = dayOf.format((run.day + 7200) * 1000).replaceAll("-", "");
  let best = null, score = 0;
  for (const [day, cancelled, kind, rows] of list) {
    if (day && day !== date) continue;
    const t = { cancelled: Boolean(cancelled), kind, stops: rows || [] };
    const n = matched(stops, t).length;
    if (n > score || (!best && cancelled && !t.stops.length && day)) [best, score] = [t, n];
  }
  return best;
}

// The run's stops moved by the trip's rows: each row holds from its stop on
// (until the next), the first also for the stops before it; predicted times
// (kind 1) become delays at their stops.
export function shifted(stops, trip, now) {
  const ups = matched(stops, trip).map(([at, row]) => {
    if (trip.kind !== 1) return [at, row];
    const s = stops[at];
    return [at, [row[0], row[1] ? row[1] - s.arrival.time : 0, row[2] ? row[2] - s.departure.time : 0, row[3]]];
  });
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

function placed(agencies) {
  return async (json) => {
    const trips = json?.trips || {};
    const now = Date.now() / 1000;
    const live = (run, stops, number) => {
      const trip = tripFor(trips, run, String(number), stops);
      if (!trip) return null;
      if (trip.cancelled) return { cancelled: true };
      return shifted(stops, trip, now);
    };
    return (await Promise.all(agencies.map((a) => timetableTrains(a, live)))).flat();
  };
}

export const parse = { sncf: placed(NATIONAL), idfm: placed(["transilien"]) };
