// Finland's trains from Digitraffic (scripts/railroads/digitraffic.py): each
// train's last GPS fix by number, its run from the timetable
// (data/schedules/vr.json or hsl.json), and the GTFS-realtime trip updates'
// delays, which hold for the stops after each one until the next.

import { train, valid, delayText, loadSchedule, runNow } from "../sources.js?v=dev";
import { decodeFeed } from "../gtfsrt.js?v=dev";

const STALE = 10 * 60; // a fix older than this is a train standing switched off, or gone
const SLACK = 15 * 60;
const last = new Map(); // train id -> [lat, lon, bearing], for the heading between polls

const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }); // "2026-10-17"

function bearingTo(a, b) {
  const r = Math.PI / 180;
  const y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r);
  const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}
// Metres between two points, near enough for a few hundred.
const metres = (a, b) => Math.hypot((b[0] - a[0]) * 111320, (b[1] - a[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180));

function base64Buffer(text) {
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// Each stop's delay in seconds: an update's own, else the one before it's.
function delays(pat, update) {
  const out = new Array(pat.length).fill(null);
  for (const u of update?.stops || []) {
    // stop_sequence counts the passenger stops from 1, as the timetable lists them;
    // a loop (the I and P trains) passes Helsinki twice, so the sequence goes first.
    let i = u.seq != null && pat[u.seq - 1] && (!u.stopId || pat[u.seq - 1][0] === u.stopId.split("_")[0]) ? u.seq - 1 : -1;
    if (i < 0 && u.stopId) i = pat.findIndex(([id]) => id === u.stopId.split("_")[0]);
    if (i >= 0) out[i] = { arr: u.arrival?.delay ?? u.departure?.delay ?? 0, dep: u.departure?.delay ?? u.arrival?.delay ?? 0 };
  }
  let carry = null;
  return out.map((d) => (carry = d ? d : carry && { arr: carry.dep, dep: carry.dep }));
}

export const parse = {
  digitraffic: async (body) => {
    const [vr, hsl] = await Promise.all([loadSchedule("vr").catch(() => null), loadSchedule("hsl").catch(() => null)]);
    let updates = [];
    try {
      if (body.updates) updates = decodeFeed(base64Buffer(body.updates)).tripUpdates;
    } catch { /* positions without delays */ }
    // Trip ids are "<number>_<timetable version>", their start dates the train's departure date.
    const updateOf = new Map(updates.map((u) => [`${String(u.trip?.tripId).split("_")[0]}|${u.trip?.startDate}`, u]));
    const now = Date.now() / 1000;
    const out = [];
    for (const loc of body.locations || []) {
      const [lon, lat] = loc.location?.coordinates || [];
      const at = Date.parse(loc.timestamp) / 1000;
      if (!valid(lat, lon) || !(now - at < STALE)) continue;
      const number = String(loc.trainNumber);
      const update = updateOf.get(`${number}|${String(loc.departureDate).replaceAll("-", "")}`);
      const lateSec = Math.max(0, ...(update?.stops || []).map((u) => u.arrival?.delay ?? u.departure?.delay ?? 0));
      // A number with no passenger run on its day (freight, shunting, empty
      // stock) isn't shown; a late train's run is looked up at its own time.
      let agency = null, tt = null, run = null;
      for (const [a, t] of [["hsl", hsl], ["vr", vr]]) {
        const r = t && runNow(t, number, now - lateSec, SLACK);
        if (r && day.format(new Date((r.day + 43200) * 1000)) === loc.departureDate) {
          [agency, tt, run] = [a, t, r];
          break;
        }
      }
      if (!run) continue;
      const id = `${agency}:${number}`;
      const shift = delays(run.pat, update);
      const stops = run.pat.map(([sid, arr, dep], i) => {
        const a = run.day + arr * 60 + (shift[i]?.arr ?? 0), d = Math.max(a, run.day + dep * 60 + (shift[i]?.dep ?? 0));
        return { sid, a, d, scheduled: run.day + dep * 60 };
      });
      const next = stops.findIndex((s) => s.d >= now - 30);
      // In at its last stop five minutes ago: its run is over, whatever it does next.
      if (next < 0 && now - stops[stops.length - 1].a > 300) continue;
      const delaySec = update ? (shift[next >= 0 ? next : shift.length - 1]?.arr ?? 0) : null;
      // The heading from its last fix, once it has moved; else app.js points it at its next stop.
      const prev = last.get(id), here = [lat, lon];
      const bearing = prev && metres(prev, here) > 30 ? bearingTo(prev, here) : prev?.[2] ?? null;
      last.set(id, prev && metres(prev, here) <= 30 ? prev : [lat, lon, bearing]);
      const name = (s) => tt.stops[s.sid]?.[0] || s.sid;
      const iso = (sec) => new Date(sec * 1000).toISOString();
      out.push(train({
        id, agency, number, route: run.line, lat, lon, bearing,
        speedMph: loc.speed != null ? loc.speed / 1.609344 : null,
        origin: name(stops[0]), destination: name(stops[stops.length - 1]),
        nextStop: next >= 0 ? name(stops[next]) : null,
        delayMin: delaySec != null ? delaySec / 60 : null,
        statusText: delaySec != null ? delayText(delaySec / 60) : null,
        updated: at * 1000,
        stops: stops.map((s, i) => ({
          key: `${agency}:${s.sid}`, name: name(s), tz: tt.tz, time: iso(s.d), arr: iso(s.a), dep: iso(s.d),
          scheduled: iso(s.scheduled), status: i === next ? "next" : next < 0 || i < next ? "past" : "future",
        })),
      }));
    }
    return out;
  },
};
