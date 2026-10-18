// Renfe's GTFS-realtime positions, with its predicted stop times appended by
// the relay (scripts/railroads/renfe.py); numbers, lines and stops come from
// its timetables (data/schedules/renfe.json and cercanias.json).

import { train, valid, mps2mph, delayText, loadSchedule, runNow, runStops } from "../sources.js?v=dev";

const TZ = "Europe/Madrid";
const STALE_SECONDS = 20 * 60;

// ---------- GTFS-realtime, just the fields these feeds fill ----------

// A varint as [low 32 bits, the bits above them]: an int32 (a delay) is the
// low half read signed, a uint64 (a time) the two halves added.
function varint(b, p) {
  let lo = 0, hi = 0, x;
  for (let shift = 0; shift < 28; shift += 7) {
    x = b[p.i++];
    lo |= (x & 0x7f) << shift;
    if (!(x & 0x80)) return [lo >>> 0, 0];
  }
  x = b[p.i++]; // bits 28-34: four low, three high
  lo |= (x & 0x0f) << 28;
  hi = (x & 0x7f) >> 4;
  for (let shift = 3; x & 0x80 && shift < 32; shift += 7) {
    x = b[p.i++];
    hi |= (x & 0x7f) << shift;
  }
  return [lo >>> 0, hi >>> 0];
}
const int = (b, p) => varint(b, p)[0] | 0;
const time = (b, p) => { const [lo, hi] = varint(b, p); return hi * 2 ** 32 + lo; };

// Each field of a message as [field number, wire type, value or [start, end]].
function* fields(b, start, end) {
  const p = { i: start };
  while (p.i < end) {
    const key = varint(b, p)[0], f = key >>> 3, w = key & 7;
    if (w === 0) yield [f, w, p.i, (varint(b, p), p.i)];
    else if (w === 1) { yield [f, w, p.i, p.i + 8]; p.i += 8; }
    else if (w === 5) { yield [f, w, p.i, p.i + 4]; p.i += 4; }
    else if (w === 2) { const n = varint(b, p)[0]; yield [f, w, p.i, p.i + n]; p.i += n; }
    else return;
  }
}
const text = (b, s, e) => new TextDecoder().decode(b.subarray(s, e));
const float = (b, s) => new DataView(b.buffer, b.byteOffset + s, 4).getFloat32(0, true);

function trip(b, s, e) {
  const out = {};
  for (const [f, w, fs, fe] of fields(b, s, e)) {
    if (f === 1 && w === 2) out.tripId = text(b, fs, fe);
    else if (f === 4 && w === 0) out.relationship = int(b, { i: fs });
  }
  return out;
}

function stopEvent(b, s, e) {
  const out = {};
  for (const [f, w, fs] of fields(b, s, e)) {
    if (f === 1 && w === 0) out.delay = int(b, { i: fs });
    else if (f === 2 && w === 0) out.time = time(b, { i: fs });
  }
  return out;
}

function tripUpdate(b, s, e) {
  const out = { stops: [] };
  for (const [f, w, fs, fe] of fields(b, s, e)) {
    if (f === 1 && w === 2) out.trip = trip(b, fs, fe);
    else if (f === 5 && w === 0) out.delay = int(b, { i: fs });
    else if (f === 2 && w === 2) {
      const st = {};
      for (const [g, gw, gs, ge] of fields(b, fs, fe)) {
        if ((g === 2 || g === 3) && gw === 2) st[g === 2 ? "arrival" : "departure"] = stopEvent(b, gs, ge);
        else if (g === 4 && gw === 2) st.stopId = text(b, gs, ge);
        else if (g === 5 && gw === 0) st.skipped = int(b, { i: gs }) === 1;
      }
      out.stops.push(st);
    }
  }
  return out;
}

function vehicle(b, s, e) {
  const out = {};
  for (const [f, w, fs, fe] of fields(b, s, e)) {
    if (f === 1 && w === 2) out.trip = trip(b, fs, fe);
    else if (f === 2 && w === 2) {
      for (const [g, gw, gs] of fields(b, fs, fe)) {
        if (gw !== 5) continue;
        if (g === 1) out.lat = float(b, gs);
        else if (g === 2) out.lon = float(b, gs);
        else if (g === 3) out.bearing = float(b, gs);
        else if (g === 5) out.speed = float(b, gs);
      }
    } else if (f === 4 && w === 0) out.status = int(b, { i: fs });
    else if (f === 5 && w === 0) out.timestamp = time(b, { i: fs });
    else if (f === 7 && w === 2) out.stopId = text(b, fs, fe);
    else if (f === 8 && w === 2) {
      for (const [g, gw, gs, ge] of fields(b, fs, fe)) {
        if (g === 1 && gw === 2) out.id = text(b, gs, ge);
        else if (g === 2 && gw === 2) out.label = text(b, gs, ge);
      }
    }
  }
  return out;
}

// Positions and trip updates; the relay sends two messages back to back,
// which read as one (their entities follow each other).
function decode(buf) {
  const b = new Uint8Array(buf), vehicles = [], updates = [];
  for (const [f, w, s, e] of fields(b, 0, b.length)) {
    if (f !== 2 || w !== 2) continue;
    for (const [g, gw, gs, ge] of fields(b, s, e)) {
      if (g === 3 && gw === 2) updates.push(tripUpdate(b, gs, ge));
      else if (g === 4 && gw === 2) vehicles.push(vehicle(b, gs, ge));
    }
  }
  return { vehicles, updates };
}

// ---------- Trains ----------

// A long-distance trip id is the train's number, a variant and the date its
// timetable starts ("0019012026-10-18": train 00190); a Cercanías one is its
// service day, number and line ("1089D27203C4a": train 27203 on the C4a).
const IDS = {
  renfe: (id) => ((m) => m && [m[1], null])(/^(\d{5})\d/.exec(id)),
  cercanias: (id) => ((m) => m && [m[1], m[2]])(/^\d{4}[A-Z](\d+)(\w*)$/.exec(id)),
};
// A trip's delay: the trip's own, else the first its stops give.
const delayOf = (u) => u?.delay ?? u?.stops.map((s) => s.arrival?.delay ?? s.departure?.delay).find((d) => d != null) ?? null;

// The feeds list some trains sitting at their first station hours before
// they leave, as that many hours early (-9540 s at 2:20 am): not running yet.
const EARLY = -15 * 60;

async function parseFeed(agency, buf) {
  const feed = decode(buf);
  const tt = await loadSchedule(agency).catch(() => null);
  const now = Date.now() / 1000;
  const updates = new Map(feed.updates.filter((u) => u.trip?.tripId).map((u) => [u.trip.tripId, u]));
  const name = (id) => tt?.stops[id]?.[0] || null;
  const out = [], seen = new Set();
  for (const v of feed.vehicles) {
    const tripId = v.trip?.tripId;
    // No trip: an empty move, not a train in service.
    if (!tripId || !valid(v.lat, v.lon) || (v.timestamp && now - v.timestamp > STALE_SECONDS)) continue;
    const [number, short] = IDS[agency](tripId) || [];
    if (!number || seen.has(number)) continue;
    const u = updates.get(tripId);
    if (u?.trip?.relationship === 3) continue; // cancelled
    const delay = delayOf(u);
    if (delay != null && delay < EARLY) continue;
    seen.add(number);
    // Its run in the timetable: a Cercanías number on its own line, since
    // two cities' networks can share one, and of a long-distance train's
    // variants (Lugo-Madrid, Ourense-Madrid) one through the stop it names.
    let pats = tt?.trips[number]?.filter(([, line]) => !short || line.split(" ")[0] === short) || [];
    if (pats.some(([, , pat]) => pat.some(([id]) => id === v.stopId))) pats = pats.filter(([, , pat]) => pat.some(([id]) => id === v.stopId));
    const run = pats.length ? runNow({ ...tt, trips: { [number]: pats } }, number, now, 3 * 3600) : null;
    // Only the delay: the predicted times beside it can disagree with it
    // (04114's at Sarria gave its departure from Lugo, with a delay of 0).
    const stops = run ? runStops(run, Math.max(0, delay || 0)) : [];
    // The stop it's at or heading to, by the feed; else the first still ahead.
    let next = stops.findIndex((s) => s.stopId === v.stopId);
    if (next < 0) next = stops.findIndex((s) => s.departure.time >= now - 30);
    // "Stopped at" its next stop while still on the way there, too: at it
    // only when it's there.
    const near = (id) => tt?.stops[id] && Math.hypot((tt.stops[id][2] - v.lon) * Math.cos((v.lat * Math.PI) / 180), tt.stops[id][1] - v.lat) * 111195 < 800;
    const at = v.status === 1 && next >= 0 && near(stops[next].stopId);
    const iso = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);
    const delayMin = delay != null ? Math.max(0, delay / 60) : null;
    const nextStop = next >= 0 ? name(stops[next].stopId) : name(v.stopId);
    const line = run?.line || (short ? short : null);
    out.push(train({
      id: `${agency}:${number}`, agency, number, route: line,
      lat: v.lat, lon: v.lon,
      bearing: v.bearing || null,
      speedMph: v.speed ? mps2mph(v.speed) : null,
      origin: stops.length ? name(stops[0].stopId) : null,
      destination: stops.length ? name(stops[stops.length - 1].stopId) : null,
      nextStop,
      delayMin,
      statusText: at && nextStop ? `At ${nextStop}` : delayText(delayMin),
      routeColor: agency === "cercanias" ? tt?.colors?.[line] || null : null,
      updated: Math.min((v.timestamp || now) * 1000, Date.now()),
      stops: stops.length ? stops.map((s, i) => ({
        key: `${agency}:${s.stopId}`, name: name(s.stopId), tz: TZ,
        time: iso(i === stops.length - 1 ? s.arrival.time : s.departure.time),
        arr: iso(s.arrival.time), dep: iso(s.departure.time),
        status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
        here: i === next && at, track: null, scheduled: iso(s.scheduled),
      })) : null,
    }));
  }
  return out;
}

export const parse = {
  renfe: (buf) => parseFeed("renfe", buf),
  cercanias: (buf) => parseFeed("cercanias", buf),
};
