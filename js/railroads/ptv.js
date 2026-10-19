// Transport Victoria's GTFS-realtime positions and trip updates for Metro
// Trains Melbourne and V/Line (scripts/railroads/ptv.py), with each train's
// stops from its run in the timetable (data/schedules/<railroad>.json),
// shifted by the delays its trip update predicts.

import { decodeFeed } from "../gtfsrt.js?v=dev";
import { train, valid, mps2mph, iso, delayText, loadSchedule, runNow } from "../sources.js?v=dev";

// A trip's run, as the timetable numbers it: the end of its id
// ("02-FKN--1-T2-2302": 2302; Metro's "C123", "Z123" and "X123" on the
// Cranbourne/Pakenham, Sunbury and Sandringham lines). A trip added on the
// day carries its run between underscores ("..._C123_20261019").
const runOf = (tripId) => /_([A-Z]?\d{3,4})_\d*$/.exec(tripId || "")?.[1] || /-([A-Z]?\d{3,4})$/.exec(tripId || "")?.[1] || null;
const added = (tripId) => /_[A-Z]?\d{3,4}_\d*$/.test(tripId || "");

// Lines by the code in a trip or route id ("02-FKN--...", "aus:vic:vic-02-FKN:",
// V/Line's "1-TRN-mjp-5"), as the .py names them, for a train the timetable
// doesn't have (an extra run on the day).
const LINES = {
  ALM: "Alamein", BEG: "Belgrave", CBE: "Cranbourne", CGB: "Craigieburn", FKN: "Frankston", GWY: "Glen Waverley",
  HBE: "Hurstbridge", LIL: "Lilydale", MDD: "Mernda", PKM: "Pakenham", RCE: "Flemington Racecourse", SHM: "Sandringham",
  STY: "Stony Point", SUY: "Sunbury", UFD: "Upfield", WER: "Werribee", WIL: "Williamstown",
  ABY: "Albury", ART: "Ararat", BAT: "Ballarat", BDE: "Bairnsdale", BGO: "Bendigo", ECH: "Echuca", GEL: "Geelong",
  MBY: "Maryborough", SER: "Seymour", SNH: "Shepparton", SWL: "Swan Hill", TRN: "Traralgon", WBL: "Warrnambool",
};
function lineOf(trip) {
  for (const id of [trip?.tripId, trip?.routeId]) {
    const code = /(?:^|-)([A-Z]{3})(?=[-:]|$)/.exec(id || "")?.[1];
    if (LINES[code]) return `${LINES[code]} line`;
  }
  return null;
}

// Metro's vehicle id lists the train's cars, M motor and T trailer, sorted
// as text ("107M-108M-1354T-1424T-247M-248M": two three-car units), or only
// the end cars of its newer trains (an HCMT's "9002M-9902M", an X'Trapolis
// 2.0's "8101M-8201T-8601M"). The HCMT's seven cars (sets 1-70, 90ss-93ss
// and 97ss-99ss) and the X'Trapolis 2.0's six (81ss-86ss) follow from one
// number; the older trains' three-car units (Comeng, Siemens Nexas,
// X'Trapolis 100) go back together as motor, trailer, motor: each odd motor
// car with the next, and the trailer numbered for them where there is one
// (X'Trapolis 1M-1301T-2M and 851M-1626T-852M, Siemens 701M-2501T-702M,
// Comeng 301M-1001T-302M: 1300, 1200, 2150 or 850 plus half the second
// motor's number). Units run in the order of their numbers; which of them
// leads, the feed doesn't say.
const HCMT = [90, 91, 92, 93, 97, 98, 99];
const XT2 = [81, 82, 83, 84, 85, 86];
const TRAILER = [1300, 1200, 2150, 850];
function metroCars(id) {
  const listed = String(id || "").split("-").map((c) => /^(\d+)([MT])$/.exec(c.trim())).filter(Boolean)
    .map((m) => ({ n: +m[1], motor: m[2] === "M" }));
  if (!listed.length) {
    // Anything else (the Stony Point line's Sprinters): its numbers as sent.
    const nums = String(id || "").split("-").map((c) => /^\D*(\d+)\D*$/.exec(c.trim())?.[1]).filter(Boolean);
    return nums.length ? { numbers: nums, complete: false } : null;
  }
  const set = (series, n) => ({ numbers: series.map((h) => String(h * 100 + (n % 100))), complete: true });
  const hcmt = listed.find((c) => c.n >= 9001 && c.n <= 9999);
  if (hcmt) return set(HCMT, hcmt.n);
  const xt2 = listed.find((c) => c.n >= 8101 && c.n <= 8699);
  if (xt2) return set(XT2, xt2.n);
  const motors = listed.filter((c) => c.motor).map((c) => c.n).sort((a, b) => a - b);
  const trailers = listed.filter((c) => !c.motor).map((c) => c.n);
  const used = new Set(), units = [];
  for (const m of motors) {
    if (m % 2 !== 1 || used.has(m) || !motors.includes(m + 1)) continue;
    used.add(m).add(m + 1);
    const t = trailers.find((x) => !used.has(x) && TRAILER.includes(x - (m + 1) / 2));
    if (t != null) used.add(t);
    units.push([m, t, m + 1]);
  }
  // Units re-formed from two others (Comeng 642M-1171T-673M): the motor
  // cars left over pair up in order.
  const odd = motors.filter((m) => !used.has(m));
  for (let i = 0; i + 1 < odd.length; i += 2) {
    used.add(odd[i]).add(odd[i + 1]);
    units.push([odd[i], null, odd[i + 1]]);
  }
  for (const u of units) {
    if (u[1] != null) continue;
    u[1] = trailers.find((x) => !used.has(x));
    if (u[1] != null) used.add(u[1]);
  }
  const rest = listed.map((c) => c.n).filter((n) => !used.has(n));
  return { numbers: [...units.flat().filter((n) => n != null), ...rest].map(String), complete: true };
}

// V/Line's names the train's lead unit or locomotive: "V1142" a VLocity
// (its car 1142, unit VL42), "S7001" a Sprinter, "N452" or "A62" a
// locomotive. The units coupled behind it, or a locomotive's carriages,
// aren't in the feed.
function vlineCars(id) {
  const m = /^([A-Z]+)(\d+)$/.exec(String(id || "").trim());
  return m ? { numbers: [m[2]], complete: false } : null;
}
const CARS = { metrotrains: metroCars, vline: vlineCars };

// A position older than this is a train no longer reporting.
const STALE_SECONDS = 10 * 60;
// Minutes before its first departure and after its last arrival a train
// still counts as running its trip; outside them it's parked or shunting.
const SLACK = 15 * 60;
// A predicted time further than this from the timetable's is another day's.
const MAX_DELAY = 6 * 3600;

async function parsePtv(agency, buf) {
  const feed = decodeFeed(buf);
  const tt = await loadSchedule(agency).catch(() => null);
  const now = Date.now() / 1000;
  const updates = new Map();
  for (const u of feed.tripUpdates) {
    if (u.trip?.tripId) updates.set(u.trip.tripId, u);
    const n = runOf(u.trip?.tripId);
    if (n && !updates.has(n)) updates.set(n, u);
  }
  const out = [], seen = new Set();
  for (const v of feed.vehicles) {
    const p = v.position;
    if (!p || !valid(p.lat, p.lon) || (v.timestamp && now - v.timestamp > STALE_SECONDS)) continue;
    // Only trains running a trip: one without is out of service.
    const number = runOf(v.trip?.tripId);
    if (!number || seen.has(number)) continue;
    const run = tt ? runNow(tt, number, now, SLACK) : null;
    // A timetabled run that isn't running now: a trip over, or tomorrow's.
    if (!run && !added(v.trip.tripId)) continue;
    seen.add(number);
    const fields = {
      id: `${agency}:${number}`, agency, number, route: run?.line || lineOf(v.trip),
      lat: p.lat, lon: p.lon, bearing: p.bearing || null, speedMph: mps2mph(p.speed),
      updated: Math.min((v.timestamp || feed.timestamp || now) * 1000, Date.now()),
      set: v.vehicle?.id || null, cars: CARS[agency](v.vehicle?.id),
    };
    const u = updates.get(v.trip.tripId) || updates.get(number);
    out.push(train(run ? { ...fields, ...runFields(agency, tt, runTimes(run, u), now) } : { ...fields, ...extraFields(u, now) }));
  }
  return out;
}

// The run's stop times (epoch seconds: a arrival, l leaving), each shifted
// by its trip update's prediction. An update names a stop by its place in
// the trip (stop_sequence 1, 2, ...), which is the timetable's order: every
// stop of Victoria's trips is a station (checked on the October 2026
// timetable). Its predicted time against the timetable's gives the delay
// (Metro's updates send a delay of 0 beside a later time); stops it doesn't
// name keep the delay of the last one before them that it does (the first
// one, before it starts). Updates leave out the stops a train has left, so
// those before the first it names are behind it (gone).
function runTimes(run, u) {
  const known = new Array(run.pat.length).fill(null);
  for (const s of u?.stops || []) {
    const i = (s.seq ?? 0) - 1;
    if (i < 0 || i >= run.pat.length || s.skipped) continue;
    const [, arr, dep] = run.pat[i];
    const late = (e, min) => (e?.time ? e.time - (run.day + min * 60) : e?.delay ?? null);
    const a = late(s.arrival, arr), l = late(s.departure, dep);
    const d = a ?? l;
    if (d != null && Math.abs(d) < MAX_DELAY) known[i] = { a: d, l: l != null && Math.abs(l) < MAX_DELAY ? l : d };
  }
  let carry = known.find(Boolean) || null;
  const first = known.findIndex(Boolean);
  return run.pat.map(([id, arr, dep], i) => {
    if (known[i]) carry = known[i];
    const a = run.day + arr * 60 + Math.max(0, carry?.a ?? 0);
    const l = Math.max(a, run.day + dep * 60 + Math.max(0, carry?.l ?? 0));
    return { id, a, l, scheduled: run.day + dep * 60, delay: carry ? Math.max(0, carry.a) : null, gone: i < first };
  });
}

// A run's origin, destination, next stop, delay and stops.
function runFields(agency, tt, list, now) {
  const tz = tt.tz || "Australia/Melbourne";
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

// A run added on the day isn't in the timetable: its delay at the next stop
// its update names, if any, and nothing more.
function extraFields(u, now) {
  const next = (u?.stops || []).find((s) => !s.skipped && (s.departure?.time || s.arrival?.time || 0) >= now - 30);
  const delay = next?.arrival?.delay ?? next?.departure?.delay;
  return delay != null ? { delayMin: Math.max(0, delay) / 60, statusText: delayText(Math.max(0, delay) / 60) } : {};
}

export const parse = {
  metrotrains: (buf) => parsePtv("metrotrains", buf),
  vline: (buf) => parsePtv("vline", buf),
};
