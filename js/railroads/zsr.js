// Slovakia's trains from the community GTFS-realtime feed (scripts/railroads/zsr.py),
// with stops and lines from ŽSR's timetable (data/schedules/<agency>.json).

import { train, valid, delayText, loadSchedule, runNow, runStops } from "../sources.js?v=dev";
import { decodeFeed } from "../gtfsrt.js?v=dev";

const TZ = "Europe/Bratislava";
const AGENCIES = ["zssk", "regiojetsk", "leoexpresssk"];
const iso = (sec) => new Date(sec * 1000).toISOString();
// The timetable's categories, as zsr.py names its lines; anything else in the
// feed (a works train) isn't a passenger train.
const CATEGORIES = {
  Os: "Osobný vlak", Zr: "Zrýchlený vlak", REX: "Regionálny expres", RRR: "Regionálny rýchlik", R: "Rýchlik",
  Ex: "Expres", IC: "InterCity", EC: "EuroCity", SC: "SuperCity", EN: "EuroNight", rj: "railjet",
  rjx: "railjet xpress", RJ: "RegioJet", LE: "Leo Express",
};

const km = (a, b) => Math.hypot((b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180), b[0] - a[0]) * 111.2;
// Distance from p to the segment a-b, flat over a few tens of km.
function toSegment(p, a, b) {
  const c = Math.cos((p[0] * Math.PI) / 180);
  const ax = (a[1] - p[1]) * c, ay = a[0] - p[0], bx = (b[1] - p[1]) * c, by = b[0] - p[0];
  const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
  return Math.hypot(ax + t * dx, ay + t * dy) * 111.2;
}
function bearing(a, b) {
  const r = Math.PI / 180, dl = (b[1] - a[1]) * r;
  const y = Math.sin(dl) * Math.cos(b[0] * r);
  const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos(dl);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

// "R 680 ZEMPLÍN", "RJ 1021 REGIOJET Praha-Malešice -> Košice".
function label(v) {
  const m = /^(\S+)\s+(\d+)\s*(.*?)(?:\s*->\s*(.+))?$/.exec(v.vehicle?.label || "");
  return { kind: m?.[1] || null, number: m?.[2] || v.vehicle?.id || null, destination: m?.[4]?.trim() || null };
}

// The feed places a train at the last station that reported it (a station
// in the timetable, or one it passes without stopping). Returns the index of
// the timetabled stop it is at, or of the last one behind it, and whether it
// is at that stop.
function placeOnRun(pos, list, stops, now) {
  const at = list.map((s) => stops[s.stopId]).map((p) => (p ? [p[1], p[2]] : null));
  let best = -1, bestKm = Infinity;
  at.forEach((p, i) => {
    if (!p) return;
    // A station passed twice (a reversal) counts where the clock says.
    const d = km(pos, p) + Math.abs(list[i].arrival.time - now) / 36000;
    if (d < bestKm) [best, bestKm] = [i, d];
  });
  if (best >= 0 && km(pos, at[best]) < 0.8) return { index: best, atStop: true };
  let seg = -1, segKm = Infinity;
  for (let i = 0; i + 1 < at.length; i++) {
    if (!at[i] || !at[i + 1]) continue;
    const d = toSegment(pos, at[i], at[i + 1]) + Math.abs(list[i].departure.time - now) / 36000;
    if (d < segKm) [seg, segKm] = [i, d];
  }
  return seg >= 0 ? { index: seg, atStop: false } : null;
}

export const parse = {
  zsr: async (buf) => {
    const feed = decodeFeed(buf);
    const tables = await Promise.all(AGENCIES.map((a) => loadSchedule(a).catch(() => null)));
    const updates = new Map(feed.tripUpdates.map((u) => [u.vehicle?.id || u.trip?.tripId, u]));
    const now = Date.now() / 1000, out = [], seen = new Set();
    for (const v of feed.vehicles) {
      const p = v.position, l = label(v);
      if (!p || !valid(p.lat, p.lon) || !l.number || seen.has(l.number)) continue;
      // Each train's own timetable: the operator whose timetable has it.
      const k = tables.findIndex((tt) => tt?.trips[l.number]);
      if (k < 0 && !CATEGORIES[l.kind]) continue;
      seen.add(l.number);
      const agency = k >= 0 ? AGENCIES[k] : /REGIOJET/i.test(v.vehicle?.label) ? "regiojetsk" : /LEO EXPRESS/i.test(v.vehicle?.label) ? "leoexpresssk" : "zssk";
      const tt = k >= 0 ? tables[k] : null;
      const run = tt ? runNow(tt, l.number, now, 3 * 3600) : null;
      const pos = [p.lat, p.lon];
      const name = (s) => tt.stops[s.stopId]?.[0] || s.stopId;
      // Delays are given at the stations already reported (by their place in
      // the trip), with nothing ahead of the last one but a zero.
      const reported = (updates.get(v.vehicle?.id || v.trip?.tripId)?.stops || []).filter((s) => s.seq != null)
        .map((s) => [s.seq, s.arrival?.delay ?? s.departure?.delay]).filter(([, d]) => d != null).sort((a, b) => a[0] - b[0]);
      let list = run ? runStops(run) : [];
      const place = list.length ? placeOnRun(pos, list, tt.stops, now) : null;
      const upTo = place ? place.index : Infinity;
      const behind = reported.filter(([seq]) => seq <= upTo);
      const delaySec = behind.length ? behind[behind.length - 1][1] : reported.length ? reported[0][1] : null;
      list = run ? runStops(run, delaySec || 0) : [];
      // At a station until its (delayed) departure; after that, on toward the next.
      let next = -1, here = -1;
      if (place) {
        next = place.atStop && now <= list[place.index].departure.time + 60 ? place.index : place.index + 1;
        if (next === place.index) here = next;
      }
      // Still reported a quarter hour after its last arrival: the run is over.
      if (list.length && next >= list.length && list[list.length - 1].arrival.time < now - 900) continue;
      const delayMin = delaySec != null ? delaySec / 60 : null;
      // The feed's heading is toward the station after the one reported
      // (-41 is 319); without one, toward the next stop.
      const ahead = list.slice(Math.max(next, 0)).map((s) => tt.stops[s.stopId]).find((s) => s && km(pos, [s[1], s[2]]) > 0.3);
      const head = Number.isFinite(p.bearing) && p.bearing !== 0 ? (p.bearing + 360) % 360 : ahead ? bearing(pos, [ahead[1], ahead[2]]) : null;
      out.push(train({
        id: `${agency}:${l.number}`, agency, number: l.number,
        route: run?.line || CATEGORIES[l.kind] || null,
        lat: p.lat, lon: p.lon, bearing: head,
        origin: list.length ? name(list[0]) : null,
        destination: list.length ? name(list[list.length - 1]) : l.destination,
        nextStop: next >= 0 && next < list.length ? name(list[next]) : null,
        delayMin, statusText: delayText(delayMin),
        stops: list.length ? list.map((s, i) => ({
          key: `${agency}:${s.stopId}`, name: name(s), tz: TZ,
          time: iso(i < next ? s.departure.time : s.arrival.time),
          arr: iso(s.arrival.time), dep: iso(s.departure.time),
          status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
          track: null, scheduled: iso(s.scheduled), here: i === here,
        })) : null,
        updated: (v.timestamp || feed.timestamp || now) * 1000,
      }));
    }
    return out;
  },
};
