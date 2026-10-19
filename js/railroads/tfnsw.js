// Transport for NSW's GTFS-realtime for Sydney Trains and NSW TrainLink
// (scripts/railroads/tfnsw.py): NSW Trains' positions and trip updates, then
// Sydney Trains', back to back as one feed. Each train's stops come from its
// run in the timetables (data/schedules/sydneytrains.json and
// nswtrainlink.json), with the trip update's delays.

import { decodeFeed } from "../gtfsrt.js?v=dev";
import { train, valid, iso, delayText, loadSchedule, runNow } from "../sources.js?v=dev";

// A position older than this is a train no longer reporting.
const STALE_SECONDS = 10 * 60;
// How long before its first departure and after its last arrival a run is
// still its train's: the feed names each train's trip, so this only has to
// tell today's run of a number from yesterday's after midnight.
const SLACK = 2 * 3600;

// Runs TfNSW asks apps not to show: charters (880A-899Z suburban, HH, NH,
// WH and CH intercity), and its non-revenue routes (RTTA_REV, RTTA_DEF).
const CHARTER = /^(8[89]\d[A-Z]|[HNWC]H\d\d)$/;
const NON_REVENUE = /^RTTA_/;

// The live feeds' route ids are Sydney Trains' own ("WST_2c", "T3_2a",
// "SCO_1b"), not the timetable's: a line by its route id, for a train whose
// run the timetable file doesn't have. The T lines' numbers and the
// intercity lines' codes are certain; the older ids' letters name the lines
// TfNSW renumbered in 2024 (Western, North Shore, Northern, Eastern Suburbs
// and Illawarra, Cumberland, Olympic Park, Airport and South).
const T_LINES = {
  T1: "T1 North Shore and Western Line", T2: "T2 Leppington and Inner West Line", T3: "T3 Liverpool and Inner West Line",
  T4: "T4 Eastern Suburbs and Illawarra Line", T5: "T5 Cumberland Line", T6: "T6 Lidcombe and Bankstown Line",
  T7: "T7 Olympic Park Line", T8: "T8 Airport and South Line", T9: "T9 Northern Line",
};
const ROUTE_LINES = {
  ...T_LINES, WST: T_LINES.T1, NSN: T_LINES.T1, NTH: T_LINES.T9, ESI: T_LINES.T4, CMB: T_LINES.T5, OLY: T_LINES.T7, APS: T_LINES.T8,
  BMT: "Blue Mountains Line", CCN: "Central Coast and Newcastle Line", SCO: "South Coast Line", HUN: "Hunter Line",
  SHL: "Southern Highlands Line",
};
const routeLine = (routeId) => ROUTE_LINES[/^(T\d|[A-Z]+)/.exec(routeId || "")?.[0]] || null;
const INTERCITY_ROUTE = /^(BMT|CCN|SCO|HUN|SHL)/;
// NSW TrainLink's own runs are lettered ("NT31", "SN20", "V603"), and its
// fleets are the Mariyung, Hunter, Endeavour, Xplorer and XPT trains.
const INTERCITY_RUN = /^([A-Z]{2}\d\d|V\d{3})$/;
const INTERCITY_FLEET = new Set(["D", "J", "N", "P", "X"]);

// The set type and cars a trip id carries: "159B.1697.101.32.A.8.68334035"
// is an 8-car Waratah (A), "WN11.010127.16.N.2.0331" a 2-car Endeavour (N):
// a single letter, then the count (Real Time Train Technical Document v3.5,
// 2.2.1 and 2.2.2).
function setOf(tripId) {
  const parts = tripId.split(".");
  for (let i = 2; i < parts.length - 1; i++) {
    if (/^[A-Z]$/.test(parts[i]) && /^\d{1,2}$/.test(parts[i + 1])) return { fleet: parts[i], cars: +parts[i + 1] };
  }
  return { fleet: null, cars: null };
}

// ---------- TfNSW's extension (field 1007) ----------
// js/gtfsrt.js reads the standard fields; Sydney Trains' positions also
// carry the set type live (VehicleDescriptor 1007, TfnswVehicleDescriptor's
// vehicle_model, "A") and one CarriageDescriptor per car (VehiclePosition
// 1007, repeated), from TfNSW's gtfs-realtime_1007_extension.proto. The car
// entries carry no names: the vehicle id is a list of masked carriage
// numbers (the technical document, 3.3), so no car numbers come from here.
const text = new TextDecoder();
function varint(b, i) {
  let v = 0, mul = 1, x;
  do { x = b[i++]; v += (x & 0x7f) * mul; mul *= 128; } while (x & 0x80);
  return [v, i];
}
// Each field of b[start, end) as { f, w, s, e } (its value's bytes, for
// length-delimited ones; e alone for the others).
function fields(b, start, end) {
  const out = [];
  let i = start;
  while (i < end) {
    let key, len;
    [key, i] = varint(b, i);
    const f = Math.floor(key / 8), w = key & 7, s = i;
    if (w === 0) [, i] = varint(b, i);
    else if (w === 1) i += 8;
    else if (w === 5) i += 4;
    else if (w === 2) { [len, i] = varint(b, i); out.push({ f, w, s: i, e: i + len }); i += len; continue; }
    else break;
    out.push({ f, w, s, e: i });
  }
  return out;
}
// For each vehicle position in the feed, in decodeFeed's order: { model, cars }.
function extensions(buf) {
  const b = new Uint8Array(buf);
  const out = [];
  for (const ent of fields(b, 0, b.length)) {
    if (ent.f !== 2 || ent.w !== 2) continue;
    const vp = fields(b, ent.s, ent.e).filter((x) => x.f === 4 && x.w === 2).pop();
    if (!vp) continue;
    let model = null, cars = 0;
    for (const x of fields(b, vp.s, vp.e)) {
      if (x.f === 1007 && x.w === 2) {
        // A car: its place from the front (position_in_consist, field 2).
        const at = fields(b, x.s, x.e).find((y) => y.f === 2 && y.w === 0);
        cars = Math.max(cars + 1, at ? varint(b, at.s)[0] : 0);
      } else if (x.f === 8 && x.w === 2) {
        const ext = fields(b, x.s, x.e).find((y) => y.f === 1007 && y.w === 2);
        const m = ext && fields(b, ext.s, ext.e).find((y) => y.f === 3 && y.w === 2);
        if (m) model = text.decode(b.subarray(m.s, m.e)).trim() || null;
      }
    }
    out.push({ model, cars: cars || null });
  }
  return out;
}

// ---------- Runs and their delays ----------

// The run's stop times (epoch seconds: a arrival, l leaving), with the trip
// update's delays. TfNSW's updates name each stop's platform (which the
// timetable file folds into its station) and no stop sequence, and list the
// trip's stops in order, the ones still ahead at least: so the update's
// last stop is the run's, and its stops line up with the run's from the
// end. Where an update gives a stop's time as well as its delay, the
// scheduled time (the one less the other) says exactly where it lines up.
// A stop the update skips is left out; one past the update's reach keeps
// its timetabled time, and one after the last stop the update gives a
// delay for takes that delay.
// TfNSW's example updates carry delays a day out ("delay: 86337", 63 s
// early): a delay is read to the nearest day.
const dayless = (d) => (d == null ? null : d - Math.round(d / 86400) * 86400);
function runTimes(run, u) {
  const pat = run.pat;
  const read = (e) => e && { time: e.time || null, delay: dayless(e.delay) };
  const ups = (u?.stops || []).map((s) => ({ ...s, arrival: read(s.arrival), departure: read(s.departure) }));
  let off = ups.length && ups.length <= pat.length ? pat.length - ups.length : null;
  for (const [i, s] of ups.entries()) {
    const [ev, col] = s.arrival?.time && s.arrival.delay != null ? [s.arrival, 1] : s.departure?.time && s.departure.delay != null ? [s.departure, 2] : [];
    if (!ev) continue;
    const k = pat.findIndex((x) => Math.abs(run.day + x[col] * 60 - (ev.time - ev.delay)) <= 60);
    if (k >= i) { off = k - i; break; }
  }
  let last = null;
  const out = [];
  pat.forEach(([id, arr, dep], k) => {
    const s = off != null && k >= off ? ups[k - off] : null;
    if (s?.skipped) return;
    const da = s?.arrival?.delay ?? s?.departure?.delay ?? null, dd = s?.departure?.delay ?? s?.arrival?.delay ?? null;
    if (dd != null) last = dd;
    const delayA = da ?? (off != null && k >= off ? last : null), delayD = dd ?? delayA;
    const a = s?.arrival?.time || run.day + arr * 60 + (delayA || 0);
    const l = Math.max(a, s?.departure?.time || run.day + dep * 60 + (delayD || 0));
    out.push({ id, a, l, scheduled: run.day + dep * 60, delay: delayA });
  });
  return out;
}

// A run's origin, destination, next stop, delay and stops.
function runFields(agency, tt, list, now) {
  const tz = tt.tz || "Australia/Sydney";
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

// ---------- Heading ----------
// Neither feed sends a heading: each train's is the way it moved since its
// last fix that far away.
const MOVED_M = 40;
const lastFix = new Map(); // number -> { lat, lon, bearing, at }
function heading(number, lat, lon, now) {
  const prev = lastFix.get(number);
  let bearing = prev?.bearing ?? null;
  if (prev) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dy = (lat - prev.lat) * 111320, dx = (lon - prev.lon) * 111320 * Math.cos(toRad(lat));
    if (Math.hypot(dx, dy) < MOVED_M) {
      prev.at = now;
      return bearing;
    }
    const y = Math.sin(toRad(lon - prev.lon)) * Math.cos(toRad(lat));
    const x = Math.cos(toRad(prev.lat)) * Math.sin(toRad(lat)) - Math.sin(toRad(prev.lat)) * Math.cos(toRad(lat)) * Math.cos(toRad(lon - prev.lon));
    bearing = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  }
  lastFix.set(number, { lat, lon, bearing, at: now });
  return bearing;
}

// "15:30 Penrith Station to Central Station " -> "Central"
const labelEnd = (label) => /\bto\s+(.+?)(?:\s+Station)?\s*$/.exec(label || "")?.[1] || null;

export const parse = {
  tfnsw: async (buf) => {
    const feed = decodeFeed(buf);
    const ext = extensions(buf);
    const [st, ntl] = await Promise.all([loadSchedule("sydneytrains").catch(() => null), loadSchedule("nswtrainlink").catch(() => null)]);
    const now = Date.now() / 1000;
    const updates = new Map(feed.tripUpdates.filter((u) => u.trip?.tripId).map((u) => [u.trip.tripId, u]));
    const out = [], seen = new Set();
    feed.vehicles.forEach((v, i) => {
      const p = v.position, tripId = v.trip?.tripId || "";
      if (!p || !valid(p.lat, p.lon) || (v.timestamp && now - v.timestamp > STALE_SECONDS)) return;
      // Out of service (no trip, or one TfNSW doesn't timetable), a charter or a non-revenue move.
      if (!tripId || tripId.startsWith("NonTimetabled.") || NON_REVENUE.test(v.trip.routeId || "")) return;
      const number = tripId.split(".")[0];
      // NSW Trains' copy of a diesel run came first; Sydney Trains' is the same train.
      if (!number || CHARTER.test(number) || seen.has(number)) return;
      seen.add(number);
      const set = setOf(tripId);
      const fleet = ext[i]?.model || set.fleet, carCount = ext[i]?.cars || set.cars;
      // The run, in whichever railroad's timetable has it.
      let agency = null, tt = null, run = null;
      for (const [a, file] of [["sydneytrains", st], ["nswtrainlink", ntl]]) {
        run = file && runNow(file, number, now, SLACK);
        if (run) { agency = a; tt = file; break; }
      }
      agency ||= INTERCITY_ROUTE.test(v.trip.routeId || "") || INTERCITY_RUN.test(number) || INTERCITY_FLEET.has(fleet) ? "nswtrainlink" : "sydneytrains";
      const fields = run ? runFields(agency, tt, runTimes(run, updates.get(tripId)), now)
        : { destination: labelEnd(v.vehicle?.label) };
      // An NSW Trains vehicle may be named by a car ("XP2009", an XPT power car).
      const car = /^([A-Z]{2})(\d{4})$/.exec(v.vehicle?.id || "");
      out.push(train({
        id: `${agency}:${number}`, agency, number, route: run?.line || routeLine(v.trip.routeId),
        lat: p.lat, lon: p.lon, bearing: heading(number, p.lat, p.lon, now),
        updated: (v.timestamp || feed.timestamp || now) * 1000,
        set: null, fleet, carCount, cars: car ? { numbers: [car[2]], codes: [car[0]], complete: false } : null,
        ...fields,
      }));
    });
    for (const [n, f] of lastFix) if (now - f.at > 30 * 60) lastFix.delete(n);
    return out;
  },
};
