// Trenes Argentinos' Buenos Aires trains, from SOFSE's station arrivals as the
// relay merges them (scripts/railroads/trenesba.py, relay/feeds/trenesba.js):
// each train's GPS position, line, unit and stops, actual times where passed
// and estimated ahead.

import { train, valid, iso, delayText } from "../sources.js?v=dev";

const TZ = "America/Argentina/Buenos_Aires";
// Under way, or at the platform it leaves from. A service still "Programado"
// or "Confirmado" carries its unit's position while that unit finishes the
// run before, or waits in the yard.
const RUNNING = new Set(["Partió", "En Andén"]);

export const parse = {
  trenesba: (json) => {
    const now = Date.now(), out = [];
    for (const g of json.trains || []) {
      if (!valid(g.lat, g.lon) || g.cancel || g.class !== "Pasajeros" || !RUNNING.has(g.state)) continue;
      // [id, name, scheduled arr, scheduled dep, arr, dep, platform, passed]
      const list = (g.stops || []).map(([sid, name, sArr, sDep, arr, dep, track, passed]) => ({ sid, name, sArr, sDep, arr, dep, track, passed }));
      if (!list.length) continue;
      const last = list[list.length - 1], end = last.arr ?? last.dep ?? last.sArr ?? last.sDep;
      // A run that should have ended long ago is a position left behind.
      if (end && end * 1000 < now - 20 * 60000) continue;
      let next = list.findIndex((s) => !s.passed);
      const atPlatform = g.state === "En Andén" && next >= 0;
      const stops = list.map((s, i) => {
        const at = s.arr ?? s.dep ?? s.sArr ?? s.sDep, sched = s.arr != null || s.dep == null ? s.sArr ?? s.sDep : s.sDep ?? s.sArr;
        return {
          key: `trenesba:${s.sid}`, name: s.name, tz: TZ,
          time: iso(at * 1000), arr: s.arr ? iso(s.arr * 1000) : null, dep: s.dep ? iso(s.dep * 1000) : null,
          scheduled: sched ? iso(sched * 1000) : null, track: s.track || null,
          status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
          here: atPlatform && i === next,
        };
      });
      // How late it is at its next stop (or was at its last).
      const ref = stops[next >= 0 ? next : stops.length - 1];
      const delayMin = ref.scheduled ? Math.round((Date.parse(ref.time) - Date.parse(ref.scheduled)) / 60000) : null;
      const number = String(g.n);
      out.push(train({
        id: `trenesba:${number}`, agency: "trenesba", number, route: g.line,
        lat: g.lat, lon: g.lon,
        origin: stops[0].name, destination: stops[stops.length - 1].name,
        nextStop: next >= 0 ? stops[next].name : null,
        delayMin,
        statusText: atPlatform ? `At ${stops[next].name}` : delayMin != null ? delayText(delayMin) : null,
        updated: Math.min((json.at || 0) * 1000 || now, now),
        stops,
      }));
    }
    return out;
  },
};
