// Israel Railways' positions from Hasadna's Open Bus Stride API, through the
// relay (scripts/railroads/israelrail.py): a few minutes of rows per train
// number, whose stops come from the timetable (data/schedules/israelrail.json).

import { train, valid, loadSchedule, runNow, runStops } from "../sources.js?v=dev";

const STALE = 10 * 60; // behind the newest row in the answer: the train has left the feed
const LAG = 30 * 60; // behind now: Stride itself has stopped loading (it often runs 10-20 minutes late)
const FROZEN = 3 * 60; // moving, by its speed, but at one spot this long: a GPS that stopped updating
const AT_STATION = 400; // metres

// Metres from p to the segment a-b (each [lat, lon]), flat at this scale.
function toSegment(p, a, b) {
  const k = Math.cos((p[0] * Math.PI) / 180) * 111320;
  const [px, py, ax, ay, bx, by] = [p[1] * k, p[0] * 110540, a[1] * k, a[0] * 110540, b[1] * k, b[0] * 110540];
  const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
  const f = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - ax - f * dx, py - ay - f * dy);
}

// The stop a train is at or heading to, from where it is: the stretch
// between two stops it's nearest (of those about as near, the one it should
// be on by the timetable), and whether it stands at that stretch's first stop.
function placeOn(stops, lookup, p, kmh, now) {
  const at = (s) => lookup[s.stopId].slice(1, 3);
  if (stops.length < 2) return { next: 0, here: false };
  const legs = stops.slice(1).map((s, i) => ({ i, d: toSegment(p, at(stops[i]), at(s)) }));
  const best = Math.min(...legs.map((l) => l.d));
  const off = (l) => Math.max(0, stops[l.i].departure.time - now, now - stops[l.i + 1].arrival.time);
  const leg = legs.filter((l) => l.d <= best + 1000).sort((x, y) => off(x) - off(y))[0];
  const from = toSegment(p, at(stops[leg.i]), at(stops[leg.i]));
  if (from < AT_STATION && kmh < 5) return { next: leg.i, here: true };
  const to = toSegment(p, at(stops[leg.i + 1]), at(stops[leg.i + 1]));
  return { next: leg.i + 1, here: to < AT_STATION && kmh < 5 };
}

export const parse = {
  israelrail: async (body) => {
    const tt = await loadSchedule("israelrail");
    const now = Date.now() / 1000;
    const rows = new Map(); // train number -> its rows, oldest first
    for (const [snapshot, number, , time, lat, lon, bearing, kmh] of body?.trains || []) {
      if (!number || !valid(lat, lon)) continue;
      if (!rows.has(number)) rows.set(number, []);
      rows.get(number).push({ snapshot, at: Date.parse(time) / 1000, lat, lon, bearing, kmh: kmh || 0 });
    }
    // Stride lags by a varying 2-20 minutes, so a row's age counts from the
    // newest row it sent, not from now.
    const newest = Math.max(0, ...[...rows.values()].flat().map((r) => r.at || 0));
    const out = [];
    for (const [number, list] of rows) {
      list.sort((a, b) => a.snapshot - b.snapshot);
      const last = list[list.length - 1];
      if (!last.at || newest - last.at > STALE || now - last.at > LAG) continue;
      // Since when it's been at this exact spot: a moving train that hasn't
      // moved is a frozen position, not a train.
      let since = last.at;
      for (let i = list.length - 2; i >= 0 && list[i].lat === last.lat && list[i].lon === last.lon; i--) since = list[i].at;
      if (last.kmh > 0 && last.at - since >= FROZEN) continue;
      // Only timetabled trains: an empty run or a yard move has no run.
      const run = runNow(tt, number, now, 3600);
      if (!run) continue;
      const stops = runStops(run).filter((s) => tt.stops[s.stopId]);
      if (!stops.length) continue;
      const { next, here } = placeOn(stops, tt.stops, [last.lat, last.lon], last.kmh, now);
      const name = (s) => tt.stops[s.stopId][0];
      const iso = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);
      out.push(train({
        id: `israelrail:${number}`, agency: "israelrail", number, route: run.line,
        lat: last.lat, lon: last.lon,
        // A heading of 0 is what the feed gives when it has none.
        bearing: last.bearing && last.kmh > 0 ? last.bearing : null,
        speedMph: last.kmh / 1.609344,
        origin: name(stops[0]), destination: name(stops[stops.length - 1]), nextStop: name(stops[next]),
        statusText: here ? `At ${name(stops[next])}` : null,
        updated: last.at * 1000,
        stops: stops.map((s, i) => ({
          key: `israelrail:${s.stopId}`, name: name(s), tz: tt.tz,
          time: iso(i ? s.arrival.time : s.departure.time), arr: iso(s.arrival.time), dep: iso(s.departure.time),
          status: i < next ? "past" : i === next ? "next" : "future", track: null, scheduled: iso(s.scheduled), here: here && i === next,
        })),
      }));
    }
    return out;
  },
};
