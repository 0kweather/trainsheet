// Auckland Transport's GTFS-realtime for AT Metro and Te Huia
// (scripts/railroads/aucklandtransport.py): the relay passes on the trains'
// positions and trip updates alone, from AT's combined feed. Each train's
// stops come from its run in the timetable (data/schedules/atmetro.json and
// tehuia.json), shifted by the delay its trip update gives.

import { decodeFeed } from "../gtfsrt.js?v=dev";
import { train, valid, mps2mph, iso, delayText, loadSchedule, localMinutes } from "../sources.js?v=dev";

// A trip's train, as the .py's number() names it from the same trip id: the
// fifth part's first train descriptor ("258-880001-24480-2-W022490-d3db1efa":
// W022; "A004B007140": A004; "1W86552": 1W86), or Te Huia's trip number
// before its "99" ("199": 1).
const DESCRIPTORS = /^((?:\d[A-Z]\d{2}|[A-Z]\d{3})+)\d+$/;
export function numberOf(tripId) {
  const parts = String(tripId || "").split("-");
  const part = parts.length >= 6 ? parts[4] : String(tripId || "");
  const m = DESCRIPTORS.exec(part);
  if (m) return /\d?[A-Z]\d{2,3}/.exec(m[1])[0];
  return part.endsWith("99") && part.length > 2 ? part.slice(0, -2) : part || null;
}

// Lines by route id ("E-W-201"), as the .py names them, for a train the
// timetable doesn't have (a trip added on the day); the lines' names before
// the City Rail Link opened map to the lines that replaced them.
const LINES = {
  "E-W": "East-West Line", "O-W": "Onehunga-West Line", "S-C": "South-City Line", HUIA: "Te Huia",
  WEST: "East-West Line", EAST: "East-West Line", STH: "South-City Line", ONE: "Onehunga-West Line", PUK: "South-City Line",
};
const routeKey = (routeId) => /^(E-W|O-W|S-C|[A-Z]+)-/.exec(routeId || "")?.[1] || null;
const agencyOf = (routeId) => (routeKey(routeId) === "HUIA" ? "tehuia" : "atmetro");

// A train unit, by its vehicle id (59xxx) or label ("AMP        123", AT
// pads it): its class and number, "AMP" and "123".
const isUnit = (v) => /^59\d{3}$/.test(v?.vehicle?.id || "") || /^AM/.test(v?.vehicle?.label || "");
function unitOf(v) {
  const m = /^([A-Z]+)\s*(\d+)$/.exec((v?.vehicle?.label || "").trim());
  return m ? { code: m[1], number: m[2] } : null;
}
const label = (v) => (v?.vehicle?.label || "").replace(/\s+/g, " ").trim() || v?.vehicle?.id || null;

// ---------- Coupled units ----------
// AT's trains are three-car units, alone or two or three coupled, and the
// feed puts the trip on one unit only: the others report a position with no
// trip. A unit with no trip belongs to a train when it moves with one of its
// units: within 150 m (110 m standing still: a parked unit can stand beside
// a stopped train), reported within a minute, at much the same speed and
// heading. The nearest pairs join first, one unit per train each round, so
// two trains passing can't share one.
const UNITS_MAX = 3;
const LINK_MOVING_M = 150, LINK_STILL_M = 110, STILL_MPS = 2, SPEED_GAP_MPS = 2, BEARING_GAP = 30, TIME_GAP_S = 60;
function metres(a, b) {
  const toRad = Math.PI / 180;
  const dy = (a.lat - b.lat) * 111320, dx = (a.lon - b.lon) * 111320 * Math.cos(a.lat * toRad);
  return Math.hypot(dx, dy);
}
function movesWith(a, b) {
  if (a.ts && b.ts && Math.abs(a.ts - b.ts) > TIME_GAP_S) return false;
  const d = metres(a, b);
  const aStill = (a.speed ?? 0) < STILL_MPS, bStill = (b.speed ?? 0) < STILL_MPS;
  if (aStill && bStill) return d <= LINK_STILL_M;
  if (aStill !== bStill || d > LINK_MOVING_M || Math.abs((a.speed ?? 0) - (b.speed ?? 0)) > SPEED_GAP_MPS) return false;
  if (a.bearing == null || b.bearing == null) return true;
  const turn = Math.abs(a.bearing - b.bearing) % 360;
  return Math.min(turn, 360 - turn) <= BEARING_GAP;
}
// leads: [{ key, lat, lon, speed, bearing, ts }]; free: the same, with
// unit. Returns key -> [the units coupled to it, nearest first].
function coupled(leads, free) {
  const members = new Map(leads.map((l) => [l.key, [l]]));
  const left = new Set(free);
  for (let round = 1; round < UNITS_MAX; round++) {
    const pairs = [];
    for (const [key, units] of members) {
      if (units.length >= UNITS_MAX) continue;
      for (const f of left) {
        const near = units.filter((u) => movesWith(u, f));
        if (near.length) pairs.push({ key, f, d: Math.min(...near.map((u) => metres(u, f))) });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const grew = new Set();
    for (const p of pairs) {
      if (!left.has(p.f) || grew.has(p.key)) continue;
      left.delete(p.f);
      members.get(p.key).push(p.f);
      grew.add(p.key);
    }
    if (!grew.size) break;
  }
  return new Map([...members].map(([key, units]) => [key, units.slice(1)]));
}

// ---------- Heading ----------
// A train's heading as the feed gives it, else the way it moved since its
// last fix that far away.
const MOVED_M = 40;
const lastFix = new Map(); // number -> { lat, lon, bearing, at }
function heading(number, lat, lon, given, now) {
  const prev = lastFix.get(number);
  let bearing = given ?? prev?.bearing ?? null;
  if (prev && given == null) {
    if (metres({ lat, lon }, prev) < MOVED_M) {
      prev.at = now;
      return bearing;
    }
    const toRad = Math.PI / 180;
    const y = Math.sin((lon - prev.lon) * toRad) * Math.cos(lat * toRad);
    const x = Math.cos(prev.lat * toRad) * Math.sin(lat * toRad) - Math.sin(prev.lat * toRad) * Math.cos(lat * toRad) * Math.cos((lon - prev.lon) * toRad);
    bearing = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  }
  lastFix.set(number, { lat, lon, bearing, at: now });
  return bearing;
}

// ---------- Runs and their delays ----------

// A position older than this is a train no longer reporting.
const STALE_SECONDS = 10 * 60;
// How long before its first departure and after its last arrival a run is
// still its train's: the feed names each train's trip, so this only has to
// tell today's run of a number from yesterday's after midnight, and allow
// for a late train.
const SLACK = 2 * 3600;
// A delay further than this from the timetable's is another day's.
const MAX_DELAY = 6 * 3600;

// The run of a train number running now, as js/sources.js runNow finds it,
// but with each day found in the timetable by its date in New Zealand:
// runNow counts days from UTC midnight, which in summer (UTC+13) rounds a
// New Zealand day to the one before it (Monday's trains would run to
// Sunday's timetable). Of the number's patterns that day (one, on every day
// of AT's timetable), the one whose times are nearest now.
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

// The run's stop times (epoch seconds: a arrival, l leaving), shifted by the
// trip update's delay. AT's updates name one stop, the train's next or the
// one it's at, by its place in the trip (stop_sequence 1, 2, ..., the
// timetable's order: every stop of AT's trains is a station), with its
// predicted delay; the trip's own delay stands in where it gives none. The
// stops before it are behind the train (gone); from it on, the delay holds.
function runTimes(run, u) {
  const n = run.pat.length;
  const s = (u?.stops || []).find((x) => !x.skipped && x.seq >= 1 && x.seq <= n);
  const pick = (e) => (e?.delay != null ? e.delay : null);
  let delay = pick(s?.arrival) ?? pick(s?.departure) ?? u?.delay ?? null;
  if (delay != null && Math.abs(delay) >= MAX_DELAY) delay = null;
  const at = s ? s.seq - 1 : 0;
  return run.pat.map(([id, arr, dep], i) => {
    const late = Math.max(0, delay ?? 0);
    const a = run.day + arr * 60 + late;
    const l = Math.max(a, run.day + dep * 60 + late);
    return { id, a, l, scheduled: run.day + dep * 60, delay: delay == null ? null : Math.max(0, delay), gone: !!s && i < at };
  });
}

// A run's origin, destination, next stop, delay and stops.
function runFields(agency, tt, list, now) {
  const tz = tt.tz || "Pacific/Auckland";
  const next = list.findIndex((s, i) => !s.gone && (i === list.length - 1 ? s.a : s.l) >= now - 30);
  const name = (s) => tt.stops[s.id]?.[0] || s.id;
  const at = list[next];
  const fields = {
    origin: name(list[0]), destination: name(list[list.length - 1]), nextStop: at ? name(at) : null,
    statusText: null,
    stops: list.map((s, i) => ({
      key: `${agency}:${s.id}`, name: name(s), tz,
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

// A trip added on the day isn't in the timetable: its delay, if any, and
// nothing more.
function extraFields(u) {
  const s = u?.stops?.find((x) => !x.skipped);
  const delay = s?.arrival?.delay ?? s?.departure?.delay ?? u?.delay;
  return delay != null && Math.abs(delay) < MAX_DELAY ? { delayMin: Math.max(0, delay) / 60, statusText: delayText(Math.max(0, delay) / 60) } : {};
}

export const parse = {
  aucklandtransport: async (buf) => {
    const feed = decodeFeed(buf);
    const files = { atmetro: null, tehuia: null };
    [files.atmetro, files.tehuia] = await Promise.all([loadSchedule("atmetro").catch(() => null), loadSchedule("tehuia").catch(() => null)]);
    const now = Date.now() / 1000;
    const updates = new Map(feed.tripUpdates.filter((u) => u.trip?.tripId).map((u) => [u.trip.tripId, u]));
    const fresh = feed.vehicles.filter((v) => v.position && valid(v.position.lat, v.position.lon) && !(v.timestamp && now - v.timestamp > STALE_SECONDS));
    const point = (v, key) => ({ key, v, lat: v.position.lat, lon: v.position.lon, speed: v.position.speed ?? null,
                                 bearing: v.position.bearing || null, ts: v.timestamp || null });
    const leads = fresh.filter((v) => v.trip?.tripId).map((v) => point(v, v.trip.tripId));
    const free = fresh.filter((v) => !v.trip?.tripId && isUnit(v)).map((v) => point(v, null));
    const withUnits = coupled(leads.filter((l) => isUnit(l.v)), free);
    const out = [], seen = new Set();
    for (const { v, key: tripId } of leads) {
      const p = v.position;
      const number = numberOf(tripId);
      if (!number || seen.has(number)) continue;
      // The run, in its railroad's timetable (or the other's, should its route say otherwise).
      let agency = agencyOf(v.trip.routeId);
      let run = files[agency] && runOf(files[agency], number, now, SLACK);
      const other = agency === "atmetro" ? "tehuia" : "atmetro";
      if (!run && files[other]?.trips?.[number]) {
        run = runOf(files[other], number, now, SLACK);
        if (run) agency = other;
      }
      // A timetabled train that isn't running now (a trip over, or tomorrow's): not shown.
      if (!run && files[agency]?.trips?.[number]) continue;
      // Neither a train route nor a train unit: not a train.
      if (!run && !LINES[routeKey(v.trip.routeId)]) continue;
      seen.add(number);
      const units = [v, ...(withUnits.get(tripId) || []).map((f) => f.v)].map(unitOf);
      const cars = units.every(Boolean) ? { numbers: units.map((x) => x.number), codes: units.map((x) => x.code), complete: false, units: units.length } : null;
      const u = updates.get(tripId);
      out.push(train({
        id: `${agency}:${number}`, agency, number, route: run?.line || LINES[routeKey(v.trip.routeId)] || null,
        lat: p.lat, lon: p.lon, bearing: heading(number, p.lat, p.lon, p.bearing || null, now), speedMph: mps2mph(p.speed),
        updated: Math.min((v.timestamp || feed.timestamp || now) * 1000, Date.now()),
        set: label(v), cars, carCount: cars && agency === "atmetro" ? 3 * cars.units : null,
        ...(run ? runFields(agency, files[agency], runTimes(run, u), now) : extraFields(u)),
      }));
    }
    for (const [n, f] of lastFix) if (now - f.at > 30 * 60) lastFix.delete(n);
    return out;
  },
};
