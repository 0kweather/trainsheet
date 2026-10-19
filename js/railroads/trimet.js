// TriMet's GTFS-realtime positions and predicted stop times for WES
// (scripts/railroads/trimet.py), with stops from its timetable
// (data/trips.json). The relay keeps only route 203's entities.

import { gtfsVehicles, loadTrips } from "../sources.js?v=dev";

// The cars WES runs (js/railroads/trimet.cars.js): the vehicle id is the
// lead car's number, which picks its drawing.
const FLEET = /^(100[1-3]|2001|1702|1711)$/;
const ids = new Map(); // train id -> the car the feed names

export const parse = {
  trimet: async (buf) => gtfsVehicles("wes", buf, {
    // A WES car with no trip, or on another route, is out of service.
    keep: (v) => v.trip?.routeId === "203",
    route: () => "WES",
    // TriMet doesn't number WES's trains; the ids are cars.
    number: () => null,
    idOf: (v) => {
      const car = String(v.vehicle?.id || v.vehicle?.label || "").replace(/^\D+/, "");
      const key = v.vehicle?.id || v.trip?.tripId;
      if (key) ids.set(`wes:${key}`, FLEET.test(car) ? car : null);
      return key;
    },
    west: (await loadTrips()).wes,
  }).map((t) => {
    const car = ids.get(t.id);
    if (car) t.cars = { numbers: [car], complete: false };
    return t;
  }),
};
