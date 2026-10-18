// Adelaide Metro's GTFS-realtime train positions and predicted stop times
// (scripts/railroads/adelaidemetro.py), with stops from its timetable
// (data/regions/au/trips.json).

import { gtfsVehicles } from "../sources.js?v=dev";
import { tripsOf } from "../regiondata.js?v=dev";

// Its routes are patterns of seven lines ("GAWC" Gawler Central, "SALIS" Salisbury).
const LINES = {
  BEL: "Belair Line", FLNDRS: "Flinders Line", GAW: "Gawler Line", GAWC: "Gawler Line", SALIS: "Gawler Line",
  GRNG: "Grange Line", NOAR: "Seaford Line", SEAFRD: "Seaford Line", OSBORN: "Outer Harbor Line",
  OUTHA: "Outer Harbor Line", PTDOCK: "Port Dock Line",
};
// The timetable files its stops as "Belair Railway Station".
const plain = (name) => name?.replace(/\s+Railway Station$/, "") ?? name;

// The vehicle label is the lead railcar's or set's number (3013, 4002),
// which picks its class's drawing (js/railroads/adelaidemetro.cars.js).
const labels = new Map(); // vehicle id -> label

export const parse = {
  adelaidemetro: async (buf) => gtfsVehicles("adelaidemetro", buf, {
    // The relay keeps only train routes; a railcar with no trip is shunting.
    keep: (v) => (labels.set(v.vehicle?.id, v.vehicle?.label), LINES[v.trip?.routeId] !== undefined),
    route: (v) => LINES[v.trip.routeId],
    number: () => null, // no public train numbers; the label is a railcar's
    west: await tripsOf("adelaidemetro"),
  }).map((t) => {
    t.destination = plain(t.destination);
    t.nextStop = plain(t.nextStop);
    if (t.statusText?.startsWith("At ")) t.statusText = `At ${t.nextStop}`;
    for (const s of t.stops || []) s.name = plain(s.name);
    const car = labels.get(t.id.slice("adelaidemetro:".length));
    if (car) t.cars = { numbers: [car], complete: false };
    return t;
  }),
};
