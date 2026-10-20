// KTMB's GTFS-realtime positions from data.gov.my (scripts/railroads/ktmb.py),
// with each train's stops from its timetable (data/schedules/ktmb.json and
// ktmkomuter.json): the feed gives positions only, no stop times or delays.

import { gtfsVehicles, loadSchedule, runNow, runStops, train } from "../sources.js?v=dev";

const TZ = "Asia/Kuala_Lumpur";
const AGENCY_IDS = ["ktmb", "ktmkomuter"];
const isoOf = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);
// Each answer carries only some of the running trains, a different few each
// time, so a train is kept at its last report for five minutes after the
// feed last named it.
const KEEP_MS = 5 * 60 * 1000;
const lastSeen = new Map(); // train id -> [its last report, when the feed last had it (ms)]

// The vehicle label names the train's set ("ETS202", "SCS21", "EMU23",
// "DMU06"): its class, which picks the drawing (js/railroads/ktmb.cars.js).
// EMU 19-40 are the Class 83s; EMU 01-18 the Class 81s.
function carsOf(set) {
  const m = /^(ETS|SCS|EMU|DMU)\s*0*(\d+)$/.exec(set || "");
  if (!m) return null;
  const n = Number(m[2]);
  const type = m[1] === "ETS" ? ({ 1: "ets91Car", 2: "ets93Car", 3: "ets94Car" })[Math.floor(n / 100)]
    : m[1] === "SCS" ? "scs92Car" : m[1] === "DMU" ? "dmu61Car" : n >= 19 ? "emu83Car" : "emu81Car";
  return { numbers: [set], types: [type || null], complete: false };
}

// Metres between two [lat, lon], flat (the stops are kilometres apart).
function dist(a, b) {
  const k = Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * k);
}

// Where the train is along its run's stops, by position: the stop it's at
// (within 300 m), else the stop ending the leg it's nearest to. The feed
// gives no stop progress, and the timetable alone would put a late train
// stops behind where it is.
function progress(pts, here) {
  let best = { d: Infinity, next: -1 };
  pts.forEach((p, i) => {
    if (p && dist(p, here) < 300 && dist(p, here) < best.d) best = { d: dist(p, here), next: i, at: true };
  });
  if (best.at) return best;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (!a || !b) continue;
    // Distance from the leg a-b, in a flat frame around a.
    const k = Math.cos((a[0] * Math.PI) / 180);
    const [bx, by, px, py] = [(b[1] - a[1]) * k, b[0] - a[0], (here[1] - a[1]) * k, here[0] - a[0]];
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by || 1)));
    const d = Math.hypot(px - t * bx, py - t * by) * 111320;
    if (d < best.d) best = { d, next: i + 1 };
  }
  return best;
}

export const parse = {
  ktmb: async (buf) => {
    const tts = await Promise.all(AGENCY_IDS.map((a) => loadSchedule(a).catch(() => null)));
    const now = Date.now() / 1000;
    // The trip id is the train's number; Komuter's carry their service ("weekday_2203").
    const numberOf = (v) => (v.trip?.tripId || v.vehicle?.id || "").split("_").pop() || null;
    const sets = new Map(); // number -> vehicle label
    const keep = (v) => (sets.set(numberOf(v), v.vehicle?.label), true);
    for (const g of gtfsVehicles("ktmb", buf, { keep, number: numberOf, idOf: numberOf, route: () => null })) {
      // Its speeds are in km/h, not the m/s GTFS-realtime asks for. Some sets
      // (ETS302-307 when recorded) report exactly 90 every time, standing at
      // a platform too: a placeholder, not a speed.
      const kmh = g.speedMph != null ? g.speedMph / 2.23694 : null;
      const old = lastSeen.get(g.id)?.[0];
      lastSeen.set(g.id, [!old || g.updated >= old.updated
        ? { ...g, speedMph: kmh != null && Math.round(kmh) !== 90 ? kmh / 1.609344 : null, cars: carsOf(sets.get(g.number)) || old?.cars || null } : old, now * 1000]);
    }
    for (const [id, [, at]] of lastSeen) if (at < now * 1000 - KEEP_MS) lastSeen.delete(id);
    return [...lastSeen.values()].map(([g]) => {
      const i = tts.findIndex((tt) => tt?.trips[g.number]);
      const agency = AGENCY_IDS[Math.max(0, i)], tt = tts[i];
      const run = tt && runNow(tt, g.number, now, 3 * 3600);
      // fixAt: the timetable's times are all it has, so the page works out
      // a late train's delay from where its fix puts it (js/delays.js).
      const fields = { ...g, id: `${agency}:${g.number}`, agency, route: run?.line || null, fixAt: g.updated };
      // Not a run of today's timetable (empty stock, a test run): left off.
      if (!run) return null;
      const stops = runStops(run);
      const pts = stops.map((s) => (tt.stops[s.stopId] ? [tt.stops[s.stopId][1], tt.stops[s.stopId][2]] : null));
      const at = progress(pts, [g.lat, g.lon]);
      const name = (s) => tt.stops[s.stopId]?.[0] || null;
      const next = stops[at.next];
      return train({
        ...fields,
        origin: name(stops[0]), destination: name(stops[stops.length - 1]),
        nextStop: next ? name(next) : null,
        statusText: at.at && next ? `At ${name(next)}` : null,
        stops: stops.map((s, j) => ({
          key: `${agency}:${s.stopId}`, name: name(s), tz: TZ,
          time: isoOf(j === at.next && at.at ? s.departure.time : s.arrival.time),
          arr: isoOf(s.arrival.time), dep: isoOf(s.departure.time), scheduled: isoOf(s.scheduled),
          status: j < at.next ? "past" : j === at.next ? "next" : "future",
          here: j === at.next && !!at.at, track: null,
        })),
      });
    }).filter(Boolean);
  },
};
