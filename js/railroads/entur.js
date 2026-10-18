// Entur's GTFS-realtime positions and trip updates for Vy, Go-Ahead Norge and
// Flytoget, and Bane NOR's trip updates for SJ Nord (scripts/railroads/entur.py),
// with each train's stops from its timetable (data/schedules/<railroad>.json):
// the trip updates give delays only, stop by stop, in the timetable's order.

import { decodeFeed } from "../gtfsrt.js?v=dev";
import { train, valid, mps2mph, iso, delayText, loadSchedule, runNow } from "../sources.js?v=dev";

// "VYG:ServiceJourney:139_443138-R" is train 139 (and its position's vehicle
// "139-2026-10-18"); Flytoget's "FLT:ServiceJourney:1-2614-3703-20261017" is
// 3703 (its vehicles are its units, "78-02"). Replacement buses ("BUS-1004_",
// "B42-A2_") have none.
const NUMBER = {
  vy: (v) => /:ServiceJourney:(\d+)[-_]/.exec(v.trip?.tripId || "")?.[1] || /^(\d+)-\d{4}-\d\d-\d\d$/.exec(v.vehicle?.id || "")?.[1],
  goaheadnorge: (v) => /:ServiceJourney:(\d+)[-_]/.exec(v.trip?.tripId || "")?.[1],
  flytoget: (v) => /:ServiceJourney:\d+-\d+-(\d+)-\d{8}/.exec(v.trip?.tripId || "")?.[1],
};
// Flytoget's positions name the unit ("71-14", "78-02"), which says its
// model (js/railroads/entur.cars.js); Vy's and Go-Ahead's name the trip.
const UNIT_TYPES = { 71: "noType71", 78: "noType78" };
function unitOf(agency, v) {
  const m = agency === "flytoget" && /^(7[18])-\d+/.exec(v.vehicle?.id || "");
  return m ? { numbers: [m[0]], types: [UNIT_TYPES[m[1]]], complete: false } : null;
}
// A position older than this is a train no longer reporting.
const STALE_SECONDS = 10 * 60;
// Minutes before its first departure and after its last arrival a train
// still counts as running its trip; outside them it's parked or shunting.
const SLACK = 15 * 60;

async function parseEntur(agency, buf) {
  const feed = decodeFeed(buf);
  const tt = await loadSchedule(agency).catch(() => null);
  const now = Date.now() / 1000;
  const numberOf = NUMBER[agency];
  // The relay keeps only the reporting trains' trip updates; a train's
  // number finds its own where its position names another day's trip
  // (after midnight).
  const updates = new Map();
  for (const u of feed.tripUpdates) {
    if (u.trip?.tripId) updates.set(u.trip.tripId, u);
    const n = numberOf({ trip: u.trip, vehicle: u.vehicle });
    if (n && !updates.has(n)) updates.set(n, u);
  }
  const out = [], seen = new Set();
  for (const v of feed.vehicles) {
    const p = v.position;
    if (!p || !valid(p.lat, p.lon) || (v.timestamp && now - v.timestamp > STALE_SECONDS)) continue;
    const number = numberOf(v);
    const run = number && tt && runNow(tt, number, now, SLACK);
    // No numbered trip running now: a yard move, a parked unit, a trip over.
    if (!run || seen.has(number)) continue;
    seen.add(number);
    const u = updates.get(v.trip?.tripId) || updates.get(number);
    out.push(train({
      id: `${agency}:${number}`, agency, number, route: run.line,
      lat: p.lat, lon: p.lon, bearing: p.bearing || null, speedMph: mps2mph(p.speed),
      updated: (v.timestamp || feed.timestamp || now) * 1000, cars: unitOf(agency, v),
      ...runFields(agency, tt, runTimes(run, u), now),
    }));
  }
  return out;
}

// SJ Nord sends no positions: each train running now is placed from its
// timetable, between the stations it left and is heading to, its times
// shifted by its trip update's delays where Bane NOR's feed has one (the
// relay keeps SJ Nord's routes).
async function parseSjNord(buf) {
  const feed = decodeFeed(buf);
  const tt = await loadSchedule("sjnord");
  const now = Date.now() / 1000;
  const updates = new Map();
  for (const u of feed.tripUpdates) {
    const n = /^(?:\w+:ServiceJourney:)?(\d+)\D/.exec(`${u.trip?.tripId || ""} `)?.[1] || /^\d+$/.exec(u.vehicle?.label || u.vehicle?.id || "")?.[0];
    if (n) updates.set(n, u);
  }
  const out = [];
  for (const number of Object.keys(tt.trips)) {
    const run = runNow(tt, number, now, 120);
    if (!run) continue;
    const list = runTimes(run, updates.get(number));
    const at = place(list, tt, now);
    if (!at) continue;
    const fields = runFields("sjnord", tt, list, now);
    out.push(train({
      id: `sjnord:${number}`, agency: "sjnord", number, route: run.line, ...at,
      updated: now * 1000, estimated: true, ...fields, statusText: fields.statusText || "Scheduled",
    }));
  }
  return out;
}

// Where a run is by its times: at a station, or part-way along the straight
// line to the next one (the map puts it on the track).
function place(list, tt, now) {
  const pos = (s) => tt.stops[s.id] && { lat: tt.stops[s.id][1], lon: tt.stops[s.id][2] };
  const i = list.findIndex((s) => s.l >= now);
  if (i < 0) return pos(list[list.length - 1]);
  if (i === 0 || list[i].a <= now) return pos(list[i]);
  const a = pos(list[i - 1]), b = pos(list[i]);
  if (!a || !b) return a || b;
  const f = Math.min(1, Math.max(0, (now - list[i - 1].l) / Math.max(1, list[i].a - list[i - 1].l)));
  return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
}

// The run's stop times (epoch seconds: a arrival, l leaving). A trip update
// lists every stop of the trip by its sequence (1, 2, ...), which is the
// timetable's order when it has as many stops; otherwise its delays can't
// be placed and the times are the timetable's, with no delay shown.
function runTimes(run, u) {
  const delays = u && u.stops.length === run.pat.length ? run.pat.map((_, i) => u.stops.find((s) => (s.seq ?? 0) === i + 1) || u.stops[i]) : null;
  return run.pat.map(([id, arr, dep], i) => {
    const d = delays?.[i];
    const a = run.day + arr * 60 + (d?.arrival?.delay ?? d?.departure?.delay ?? 0);
    const l = Math.max(a, run.day + dep * 60 + (d?.departure?.delay ?? d?.arrival?.delay ?? 0));
    return { id, a, l, scheduled: run.day + dep * 60, delay: d ? (d.arrival?.delay ?? d.departure?.delay ?? 0) : null };
  });
}

// A run's origin, destination, next stop, delay and stops.
function runFields(agency, tt, list, now) {
  const tz = tt.tz || "Europe/Oslo";
  const next = list.findIndex((s, i) => (i === list.length - 1 ? s.a : s.l) >= now - 30);
  const name = (s) => tt.stops[s.id]?.[0] || s.id;
  const at = list[next];
  const fields = {
    origin: name(list[0]), destination: name(list[list.length - 1]), nextStop: at ? name(at) : null,
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

export const parse = {
  vy: (buf) => parseEntur("vy", buf),
  goaheadnorge: (buf) => parseEntur("goaheadnorge", buf),
  flytoget: (buf) => parseEntur("flytoget", buf),
  sjnord: parseSjNord,
};
