// Hellenic Train's positions from railway.gov.gr's train stream, one snapshot
// of it through the relay (scripts/railroads/hellenictrain.py), with stops from
// its timetable (data/schedules/hellenictrain.json).

import { train, valid, delayText, loadSchedule, runNow, runStops } from "../sources.js?v=dev";

const AGENCY = "hellenictrain";
const TZ = "Europe/Athens";
const STALE_SECONDS = 600;
// The tracker's service types, as the timetable's lines name them.
const LINES = { Suburban: "Proastiakos", Intercity: "Intercity" };
const iso = (sec) => new Date(sec * 1000).toISOString();
const OFF_ROUTE_KM = 25;
// Rough distance from a timetable stop ([name, lat, lon]) to a position.
const km = ([, lat, lon], p) => Math.hypot(lat - p.lat, (lon - p.lng) * Math.cos((lat * Math.PI) / 180)) * 111.2;

export const parse = {
  hellenictrain: async (json) => {
    const tt = await loadSchedule(AGENCY).catch(() => null);
    const now = Date.now() / 1000;
    const out = [], seen = new Set();
    for (const p of json?.positions || []) {
      // Only trains running a passenger schedule: not freight, and not the
      // units the tracker lists with no schedule (stabled, or moving empty).
      if (!p.scheduleId || p.trainType === "freight" || p.serviceType === "Freight") continue;
      if (!valid(p.lat, p.lng) || !p.trainNumber || seen.has(p.trainNumber)) continue;
      const at = Date.parse(p.timestamp) / 1000;
      if (!(now - at < STALE_SECONDS)) continue;
      seen.add(p.trainNumber);
      const number = String(p.trainNumber);
      const delayMin = Number.isFinite(p.delay) ? Math.max(0, p.delay) : null; // minutes
      const run = tt && runNow(tt, number, now, 3 * 3600);
      const stops = run ? runStops(run, (delayMin || 0) * 60) : [];
      // A schedule's unit is sometimes listed before it reaches its line
      // (3200, Tavros to the airport, sat in Kiato's sidings): off its route, skip it.
      if (stops.length && !stops.some((s) => km(tt.stops[s.stopId], p) < OFF_ROUTE_KM)) continue;
      let next = stops.findIndex((s) => s.stopId === p.nextStationId);
      if (next < 0 && stops.length) next = stops.findIndex((s) => s.arrival.time >= now - 30);
      out.push(train({
        id: `${AGENCY}:${number}`, agency: AGENCY, number,
        route: run?.line || LINES[p.serviceType] || "Regional",
        lat: p.lat, lon: p.lng,
        bearing: p.hasCourse && Number.isFinite(p.course) ? p.course : null,
        speedMph: Number.isFinite(p.speed) ? p.speed * 0.621371 : null, // km/h
        origin: p.origin || (stops[0] && tt.stops[stops[0].stopId][0]) || null,
        destination: p.destination || (stops.length && tt.stops[stops[stops.length - 1].stopId][0]) || null,
        nextStop: p.nextStation || null,
        delayMin, statusText: delayText(delayMin),
        // The unit or locomotive running it ("460110", a Desiro's cab car):
        // one car, which hellenictrain.cars.js draws as its model's train.
        cars: p.locomotiveNumber ? { numbers: [String(p.locomotiveNumber)], complete: false } : null,
        updated: at * 1000,
        stops: stops.length ? stops.map((s, i) => ({
          key: `${AGENCY}:${s.stopId}`, name: tt.stops[s.stopId][0], tz: TZ,
          time: iso(i === stops.length - 1 ? s.arrival.time : s.departure.time),
          arr: iso(s.arrival.time), dep: iso(s.departure.time), scheduled: iso(s.scheduled),
          status: next < 0 || i < next ? "past" : i === next ? "next" : "future",
        })) : null,
      }));
    }
    return out;
  },
};
