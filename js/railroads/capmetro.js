// CapMetro Rail's GTFS-realtime positions and predicted stop times
// (scripts/railroads/capmetro.py), with stops from its timetable
// (data/trips.json).

import { gtfsVehicles, loadTrips } from "../sources.js?v=dev";

export const parse = {
  capmetro: async (buf) => gtfsVehicles("capmetro", buf, {
    keep: (v) => v.trip?.routeId === "550",
    route: () => "Red Line",
    number: () => null,
    west: (await loadTrips()).capmetro,
  }),
};
