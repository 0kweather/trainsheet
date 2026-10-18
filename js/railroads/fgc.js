// FGC's Geotren positions (scripts/railroads/fgc.py), each train's run and
// stop times found in its timetable (data/schedules/fgc.json).

import { train, valid, delayText, loadSchedule, runNow, runStops } from "../sources.js?v=dev";

const STALE_MS = 10 * 60 * 1000;
const SLACK = 30 * 60; // a run's window, either side of its timetable
const AT_STATION_M = 250;

// The timetable's runs by first and last station ("PC>NA"), built once.
let byEnds = null;
function runsBetween(tt, from, to) {
  if (!byEnds) {
    byEnds = new Map();
    for (const [key, pats] of Object.entries(tt.trips)) {
      for (const [, , pat] of pats) {
        const k = `${pat[0][0]}>${pat[pat.length - 1][0]}`;
        if (!byEnds.has(k)) byEnds.set(k, new Set());
        byEnds.get(k).add(key);
      }
    }
  }
  return byEnds.get(`${from}>${to}`) || [];
}

const meters = (a, b) => Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180));

// Where a train is on a run's stops, from its position: the stop it's at or
// heading to (the nearest, or the one after it once past it), and whether
// it's at it.
function placeOn(tt, pat, at) {
  const pos = pat.map(([id]) => tt.stops[id].slice(1, 3));
  let i = 0;
  pos.forEach((p, k) => { if (meters(at, p) < meters(at, pos[i])) i = k; });
  if (meters(at, pos[i]) < AT_STATION_M) return { next: i, here: true };
  const past = i + 1 < pos.length && meters(at, pos[i + 1]) < meters(pos[i], pos[i + 1]);
  return { next: past ? i + 1 : i, here: false };
}

// Geotren names no run, so the train's is the one between the same stations
// due where the train is nearest now, on its line if one is.
function findRun(tt, g, at, now) {
  let best = null, bestScore = Infinity;
  const places = new Map(); // runs share their stops: each placed once
  for (const key of runsBetween(tt, g.origen, g.desti)) {
    const run = runNow(tt, key, now, SLACK);
    if (!run) continue;
    const k = run.pat.map(([id]) => id).join();
    if (!places.has(k)) places.set(k, placeOn(tt, run.pat, at));
    const place = places.get(k);
    const score = Math.abs(run.day + run.pat[place.next][1] * 60 - now) + (run.line === g.lin ? 0 : 600);
    if (score < bestScore) [best, bestScore] = [{ run, ...place }, score];
  }
  return bestScore <= SLACK ? best : null;
}

// "{"parada": "NO"};{"parada": "PN"}": the coming stations' codes.
const coming = (s) => (s || "").split(";").map((p) => { try { return JSON.parse(p).parada; } catch { return null; } }).filter(Boolean);
const iso = (sec) => new Date(sec * 1000).toISOString();

export const parse = {
  fgc: async ({ processed, trains }) => {
    const updated = Date.parse(processed);
    // The portal stopped taking Geotren's positions: they're of trains long gone.
    if (!(Date.now() - updated < STALE_MS)) return [];
    const tt = await loadSchedule("fgc").catch(() => null);
    const name = (id) => tt?.stops[id]?.[0] || id;
    const lines = new Set(Object.keys(tt?.colors || {}));
    const now = Math.floor(Date.now() / 1000);
    const out = [], seen = new Set();
    for (const g of trains || []) {
      const p = g.geo_point_2d;
      // Revenue trains only: a line, and a destination that's a station.
      if (!p || !valid(p.lat, p.lon) || !/^[A-Z]+\d+$/.test(g.lin || "") || !g.desti || (tt && !tt.stops[g.desti])) continue;
      const key = g.ut || g.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const found = tt && findRun(tt, g, [p.lat, p.lon], now);
      // Geotren's coming stops sometimes skip to the last: its run's say where it is.
      let nextId = g.estacionat_a || coming(g.properes_parades)[0] || g.desti, here = Boolean(g.estacionat_a), stops = null;
      if (found) {
        const { run, next } = found;
        nextId = run.pat[next][0];
        here = found.here || g.estacionat_a === nextId;
        stops = runStops(run, 0).map((s, i) => ({
          key: `fgc:${s.stopId}`, name: name(s.stopId), tz: tt.tz,
          time: iso(s.departure.time), arr: iso(s.arrival.time), dep: iso(s.departure.time), scheduled: iso(s.scheduled),
          status: i < next ? "past" : i === next ? "next" : "future", here: i === next && here,
        }));
      }
      // Geotren's own line names, but for its variants ("L66" for an L6).
      const route = lines.has(g.lin) || !found ? g.lin : found.run.line;
      const onTime = g.en_hora === "True" ? true : g.en_hora === "False" ? false : null;
      out.push(train({
        id: `fgc:${key}`, agency: "fgc", number: null, route,
        lat: p.lat, lon: p.lon,
        origin: name(g.origen), destination: name(g.desti), nextStop: name(nextId),
        // Geotren says only whether a train is on time.
        delayMin: onTime ? 0 : null,
        statusText: here ? `At ${name(nextId)}` : onTime ? delayText(0) : onTime === false ? "Running late" : null,
        stops, updated,
        // The unit's series ("112", "113", "213"...), which fgc.cars.js draws.
        series: g.tipus_unitat || null,
      }));
    }
    return out;
  },
};
