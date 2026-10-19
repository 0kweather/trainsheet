// Metlink's GTFS-realtime positions and trip updates for Wellington's trains
// (scripts/railroads/metlink.py; the relay passes on the trains' entities
// alone), with each train's stops from its run in the timetable
// (data/schedules/metlink.json), shifted by the delays its trip update gives.

import { decodeFeed } from "../gtfsrt.js?v=dev";
import { train, valid, mps2mph, iso, delayText, loadSchedule, localMinutes } from "../sources.js?v=dev";

// A trip's train number, its id's third part: "KPL__0__6470__RAIL__..." is 6470.
export const numberOf = (tripId) => /^[A-Z]+__\d+__(\d+)__/.exec(tripId || "")?.[1] || null;
// Lines by the code a trip id starts with, or the route id, as the .py names
// them, for a train the timetable doesn't have.
const LINES = { KPL: "Kāpiti Line", HVL: "Hutt Valley Line", MEL: "Melling Line", JVL: "Johnsonville Line", WRL: "Wairarapa Line" };
const ROUTES = { 2: "KPL", 3: "MEL", 4: "WRL", 5: "HVL", 6: "JVL" };
const lineOf = (trip) => LINES[/^([A-Z]+)__/.exec(trip?.tripId || "")?.[1] || ROUTES[trip?.routeId]] || null;
// A platform's station: "WELL1" is Wellington's platform 1 ("WELL").
const stationOf = (stopId) => String(stopId || "").replace(/\d+$/, "");

// A position older than this is a train no longer reporting.
const STALE_SECONDS = 10 * 60;
// How long before its first departure and after its last arrival a run is
// still its train's (the feed names each train's trip: this tells today's
// run from yesterday's after midnight, and allows for a late train).
const SLACK = 2 * 3600;
const MAX_DELAY = 6 * 3600;

// The run of a train number running now, as js/sources.js runNow finds it,
// with two differences. Each day is found in the timetable by its date in
// New Zealand: runNow counts days from UTC midnight, which in summer (UTC+13)
// rounds a New Zealand day to the one before it. And each of the number's
// patterns that day is weighed: Metlink's timetable gives the Johnsonville
// Line's 9323 to an up and a down train, back to back, at weekends, and the
// one whose times are nearest now is the train's.
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" });
function runOf(tt, number, now, slack) {
  const midnight = Math.round(now - localMinutes(now, tt.tz) * 60);
  const start = Date.parse(`${tt.start}T00:00:00Z`) / 1000;
  let best = null, bestOff = Infinity;
  for (const day of [midnight, midnight - 86400]) {
    const idx = Math.round((Date.parse(`${ymd.format((day + 7200) * 1000)}T00:00:00Z`) / 1000 - start) / 86400);
    const bit = idx >= 0 && idx < 14 ? idx : 7 + ((((idx - 7) % 7) + 7) % 7);
    for (const p of (tt.trips[number] || []).filter(([mask]) => (mask >> bit) & 1)) {
      const off = Math.max(0, day + p[2][0][2] * 60 - now, now - (day + p[2][p[2].length - 1][1] * 60));
      if (off <= slack && off < bestOff) [best, bestOff] = [{ day, line: p[1], pat: p[2] }, off];
    }
  }
  return best;
}

// The run's stop times (epoch seconds: a arrival, l leaving), each shifted by
// its trip update's prediction. An update names a stop by its platform
// ("WELL1"), which says which of the run's stations it is (the first after
// the one before it), or else by its place in the trip (stop_sequence, from
// 0 as in Metlink's timetable). Its delay holds until the next stop it
// names; the stops before the first it names are behind the train (gone).
function runTimes(run, u) {
  const known = new Array(run.pat.length).fill(null);
  let from = 0;
  for (const s of u?.stops || []) {
    if (s.skipped) continue;
    let i = run.pat.findIndex(([id], k) => k >= from && id === stationOf(s.stopId));
    if (i < 0 && s.seq != null && s.seq < run.pat.length && s.seq >= from) i = s.seq;
    if (i < 0) continue;
    from = i;
    const [, arr, dep] = run.pat[i];
    // A predicted time against the timetable's (the delay beside it, where there's none).
    const late = (e, min) => (e?.time ? e.time - (run.day + min * 60) : e?.delay ?? null);
    const a = late(s.arrival, arr), l = late(s.departure, dep);
    const d = a ?? l;
    if (d != null && Math.abs(d) < MAX_DELAY) known[i] = { a: d, l: l != null && Math.abs(l) < MAX_DELAY ? l : d };
  }
  // With no stop named, the trip's own delay, for all of it.
  const whole = u?.delay != null && Math.abs(u.delay) < MAX_DELAY ? { a: u.delay, l: u.delay } : null;
  const first = known.findIndex(Boolean);
  let carry = known.find(Boolean) || whole;
  return run.pat.map(([id, arr, dep], i) => {
    if (known[i]) carry = known[i];
    const a = run.day + arr * 60 + Math.max(0, carry?.a ?? 0);
    const l = Math.max(a, run.day + dep * 60 + Math.max(0, carry?.l ?? 0));
    return { id, a, l, scheduled: run.day + dep * 60, delay: carry ? Math.max(0, carry.a) : null, gone: first > 0 && i < first };
  });
}

// A run's origin, destination, next stop, delay and stops.
function runFields(tt, list, now) {
  const tz = tt.tz || "Pacific/Auckland";
  const next = list.findIndex((s, i) => !s.gone && (i === list.length - 1 ? s.a : s.l) >= now - 30);
  const name = (s) => tt.stops[s.id]?.[0] || s.id;
  const at = list[next];
  const fields = {
    origin: name(list[0]), destination: name(list[list.length - 1]), nextStop: at ? name(at) : null,
    statusText: null,
    stops: list.map((s, i) => ({
      key: `metlink:${s.id}`, name: name(s), tz,
      time: iso((i === list.length - 1 ? s.a : s.l) * 1000), arr: iso(s.a * 1000), dep: iso(s.l * 1000),
      status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
      track: null, scheduled: iso(s.scheduled * 1000), here: i === next && s.a <= now,
    })),
  };
  if (at?.delay != null) {
    fields.delayMin = at.delay / 60;
    fields.statusText = delayText(fields.delayMin);
  }
  if (at && at.a <= now) fields.statusText = `At ${fields.nextStop}`;
  return fields;
}

// A trip added on the day isn't in the timetable: its delay, if any.
function extraFields(u) {
  const s = u?.stops?.find((x) => !x.skipped);
  const delay = s?.arrival?.delay ?? s?.departure?.delay ?? u?.delay;
  return delay != null && Math.abs(delay) < MAX_DELAY ? { delayMin: Math.max(0, delay) / 60, statusText: delayText(Math.max(0, delay) / 60) } : {};
}

// ---------- Heading ----------
// The feed's heading, else the way the train moved since its last fix that far away.
const MOVED_M = 40;
const lastFix = new Map(); // number -> { lat, lon, bearing, at }
function heading(number, lat, lon, given, now) {
  const prev = lastFix.get(number);
  let bearing = given ?? prev?.bearing ?? null;
  if (prev && given == null) {
    const toRad = Math.PI / 180;
    const dy = (lat - prev.lat) * 111320, dx = (lon - prev.lon) * 111320 * Math.cos(lat * toRad);
    if (Math.hypot(dx, dy) < MOVED_M) {
      prev.at = now;
      return bearing;
    }
    const y = Math.sin((lon - prev.lon) * toRad) * Math.cos(lat * toRad);
    const x = Math.cos(prev.lat * toRad) * Math.sin(lat * toRad) - Math.sin(prev.lat * toRad) * Math.cos(lat * toRad) * Math.cos((lon - prev.lon) * toRad);
    bearing = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  }
  lastFix.set(number, { lat, lon, bearing, at: now });
  return bearing;
}

// The train's vehicle as the feed names it (its label, else its id), and
// the car or locomotive that makes: "FP4123" or "4123" a Matangi car, a
// letter code and number apart.
function carsOf(v) {
  const m = /^([A-Z]*)\s*(\d+)$/.exec(String(v?.vehicle?.label || v?.vehicle?.id || "").trim());
  return m ? { numbers: [m[2]], codes: [m[1] || null], complete: false } : null;
}

export const parse = {
  metlink: async (buf) => {
    const feed = decodeFeed(buf);
    const tt = await loadSchedule("metlink").catch(() => null);
    const now = Date.now() / 1000;
    const updates = new Map(feed.tripUpdates.filter((u) => u.trip?.tripId).map((u) => [u.trip.tripId, u]));
    const out = [], seen = new Set();
    for (const v of feed.vehicles) {
      const p = v.position;
      if (!p || !valid(p.lat, p.lon) || (v.timestamp && now - v.timestamp > STALE_SECONDS)) continue;
      // Only trains running a trip: one without is out of service.
      const number = numberOf(v.trip?.tripId);
      if (!number || seen.has(number) || !lineOf(v.trip)) continue;
      const run = tt ? runOf(tt, number, now, SLACK) : null;
      // A timetabled train that isn't running now: a trip over, or tomorrow's.
      if (!run && tt?.trips?.[number]) continue;
      seen.add(number);
      const u = updates.get(v.trip.tripId);
      out.push(train({
        id: `metlink:${number}`, agency: "metlink", number, route: run?.line || lineOf(v.trip),
        lat: p.lat, lon: p.lon, bearing: heading(number, p.lat, p.lon, p.bearing || null, now), speedMph: mps2mph(p.speed),
        updated: Math.min((v.timestamp || feed.timestamp || now) * 1000, Date.now()),
        set: (v.vehicle?.label || "").trim() || v.vehicle?.id || null, cars: carsOf(v),
        ...(run ? runFields(tt, runTimes(run, u), now) : extraFields(u)),
      }));
    }
    for (const [n, f] of lastFix) if (now - f.at > 30 * 60) lastFix.delete(n);
    return out;
  },
};
