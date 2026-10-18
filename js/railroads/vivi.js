// Vivi's positions and predicted stop times from the Pieturas app's Baltic
// GTFS-realtime feed (scripts/railroads/vivi.py), with stops from Vivi's
// timetable (data/regions/lv/trips.json and data/schedules/vivi.json).

import { gtfsVehicles, loadSchedule, runNow, runStops, delayText } from "../sources.js?v=dev";
import { tripsOf } from "../regiondata.js?v=dev";

// The feed's trip and stop ids are the timetable's with "pv-" in front; a
// trip's id is its train number ("pv-811" is train 811).
const bare = (id) => String(id).replace(/^pv-/, "");

// Lines by the far end of the route, as vivi.py names them.
const LINES = {
  "Tukums I": "Tukums", "Tukums II": "Tukums", Sloka: "Tukums", "Ķemeri": "Tukums", Dubulti: "Tukums",
  Jelgava: "Jelgava", "Liepāja": "Liepāja",
  Skulte: "Skulte", Saulkrasti: "Skulte", Carnikava: "Skulte",
  Valga: "Valga", Valmiera: "Valga", "Cēsis": "Valga", Sigulda: "Valga",
  Aizkraukle: "Aizkraukle", "Lielvārde": "Aizkraukle", Ogre: "Aizkraukle",
  Daugavpils: "Daugavpils", "Krāslava": "Daugavpils", Indra: "Daugavpils",
  Zilupe: "Zilupe", Ludza: "Zilupe",
  Gulbene: "Gulbene", Madona: "Gulbene",
};

export const parse = {
  vivi: async (buf) => {
    const [west, tt] = await Promise.all([tripsOf("vivi"), loadSchedule("vivi").catch(() => null)]);
    const now = Date.now() / 1000;
    const runs = new Map();
    const runOf = (number) => (runs.has(number) ? runs.get(number)
      : (runs.set(number, tt && runNow(tt, number, now, 3 * 3600)), runs.get(number)));
    // Headsigns are "Zilupe - Rīga": the destination is the second end.
    const ends = (number) => (west?.trips[number]?.[1] || "").split(" - ");
    // The feed's stop times name stops only by their place in the trip: the
    // timetable's run of that train gives each place's stop.
    const lookup = west && {
      stops: new Proxy(west.stops, { get: (o, k) => o[bare(k)] }),
      trips: new Proxy(west.trips, {
        get: (o, k) => {
          const number = bare(k), run = runOf(number);
          if (!o[number]) return undefined;
          return [number, ends(number).pop() || null, run ? Object.fromEntries(run.pat.map(([id], i) => [i + 1, id])) : null];
        },
      }),
    };
    const trains = gtfsVehicles("vivi", buf, {
      keep: (v) => /^pv-/.test(v.trip?.tripId || "") || /^pv-/.test(v.vehicle?.id || ""),
      number: (v) => (v.trip?.tripId ? bare(v.trip.tripId) : v.vehicle?.label || null),
      route: (v) => {
        const [a, b] = ends(bare(v.trip?.tripId || ""));
        const end = a === "Rīga" ? b : a;
        return end ? `Rīga–${LINES[end] || end}` : runOf(bare(v.trip?.tripId || ""))?.line || "Vivi";
      },
      idOf: (v) => (v.trip?.tripId ? bare(v.trip.tripId) : null),
      west: lookup,
    });
    // The feed predicts only the next few stops, and gives times, not delays:
    // the whole run comes from the timetable, shifted by the next stop's
    // predicted time against its scheduled one, with the predictions kept.
    const iso = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);
    for (const t of trains) {
      const run = runOf(t.number);
      if (!run) continue;
      const live = {};
      for (const s of t.stops || []) live[s.key.slice(5)] = Date.parse(s.arr || s.time) / 1000;
      const nextId = t.stops?.find((s) => s.status === "next")?.key.slice(5);
      const at = run.pat.findIndex(([id]) => id === nextId);
      const delay = at >= 0 && live[nextId] ? live[nextId] - (run.day + run.pat[at][1] * 60) : null;
      const stops = runStops(run, delay || 0, live);
      let next = at >= 0 ? at : stops.findIndex((s) => s.departure.time >= now - 30);
      if (next < 0) next = stops.length;
      t.stops = stops.map((s, i) => ({
        key: `vivi:${s.stopId}`, name: tt.stops[s.stopId][0], tz: tt.tz,
        time: iso(i ? s.arrival.time : s.departure.time), arr: iso(s.arrival.time), dep: iso(s.departure.time),
        scheduled: iso(s.scheduled),
        status: i < next ? "past" : i === next ? "next" : "future",
        here: i === next && s.arrival.time <= now,
      }));
      t.origin = tt.stops[run.pat[0][0]][0];
      t.destination = tt.stops[run.pat[run.pat.length - 1][0]][0];
      t.nextStop = stops[next] ? tt.stops[stops[next].stopId][0] : null;
      if (delay != null) {
        t.delayMin = Math.round(delay / 60);
        t.statusText = t.stops[next]?.here ? `At ${t.nextStop}` : delayText(t.delayMin);
      }
    }
    return trains;
  },
};
