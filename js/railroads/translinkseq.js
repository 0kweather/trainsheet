// Translink's GTFS-realtime positions and trip updates for Queensland Rail's
// City network (scripts/railroads/translinkseq.py), with each run's stops from
// its timetable (data/schedules/translinkseq.json) shifted by its delay.

import { gtfsVehicles, loadSchedule, runNow, runStops, delayText, iso } from "../sources.js?v=dev";

// The trip updates name platforms ("600240"), which the timetable file
// doesn't list: any stop id passes here, so gtfsVehicles reads each train's
// delay at its next stop; its stops are then the run's own.
const ANY_STOP = { stops: new Proxy({}, { get: (_, id) => [String(id), 0, 0, String(id)] }), trips: {} };

// A route ("BNFG-5203") by its ends' codes, as the .py's line() names it,
// for a run the timetable file doesn't have.
const ENDS = { BD: "Airport", BN: "Beenleigh", BR: "Brisbane City", CA: "Caboolture", CL: "Cleveland", DB: "Doomben",
  FG: "Ferny Grove", GY: "Sunshine Coast", IP: "Ipswich", NA: "Sunshine Coast", RP: "Redcliffe Peninsula",
  RW: "Rosewood", SH: "Shorncliffe", SP: "Springfield", VL: "Gold Coast" };
function lineOf(routeId) {
  const code = /^([A-Z]{2})([A-Z]{2})-/.exec(routeId || "");
  if (!code || !ENDS[code[1]] || !ENDS[code[2]]) return null;
  const ends = [...new Set([ENDS[code[1]], ENDS[code[2]]])].filter((e) => e !== "Brisbane City").sort();
  return ends.length > 1 ? ends.join(" - ") : ends.length ? `${ends[0]} line` : "Brisbane City";
}

export const parse = {
  translinkseq: async (buf) => {
    const tt = await loadSchedule("translinkseq").catch(() => null);
    const now = Date.now() / 1000;
    // Only trains running a trip: a run without one is out of service. Each
    // is keyed by its run, which is unique on the day, so ?train= links work.
    const runOf = (v) => v.vehicle?.label || v.trip.tripId.split("-").pop(); // "...-44454-1E25": run 1E25
    const trains = gtfsVehicles("translinkseq", buf, {
      keep: (v) => !!v.trip?.tripId,
      route: (v) => lineOf(v.trip.routeId),
      number: runOf,
      idOf: runOf,
      west: ANY_STOP,
    });
    for (const t of trains) {
      const delay = Math.round((t.delayMin || 0) * 60);
      const run = tt && t.number ? runNow(tt, t.number, now, 1800) : null;
      Object.assign(t, { stops: null, destination: null, nextStop: null, statusText: delayText(t.delayMin) });
      if (!run) continue;
      const list = runStops(run, delay);
      const next = list.findIndex((s) => s.departure.time >= now - 20);
      const name = (s) => tt.stops[s.stopId][0];
      t.route = run.line || t.route;
      t.origin = name(list[0]);
      t.destination = name(list[list.length - 1]);
      if (next >= 0) {
        t.nextStop = name(list[next]);
        if (list[next].arrival.time <= now) t.statusText = `At ${t.nextStop}`;
      }
      t.stops = list.map((s, i) => ({
        key: `translinkseq:${s.stopId}`, name: name(s), tz: tt.tz,
        time: iso(s.departure.time * 1000), arr: iso(s.arrival.time * 1000), dep: iso(s.departure.time * 1000),
        scheduled: iso(s.scheduled * 1000), track: null,
        status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
        here: i === next && s.arrival.time <= now,
      }));
    }
    return trains;
  },
};
