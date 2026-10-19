// TransLink's GTFS-realtime positions and trip updates for the West Coast
// Express (scripts/railroads/translinkbc.py), with stops from its timetable
// (data/trips.json). The relay keeps only route 6770's entities.
//
// TransLink says its West Coast Express times are scheduled, not live, and
// the feeds have been read to carry buses alone: when the feed has none of
// the trains, they are placed from the timetable (data/schedules/
// westcoastexpress.json), marked as estimated, as before the key was set.

import * as sources from "../sources.js?v=dev";

const { gtfsVehicles, loadTrips } = sources;
// The cars the West Coast Express runs (js/railroads/translinkbc.cars.js):
// locomotives 901-907, cab cars 101-109, coaches 201-220, 301-309, 401-406.
const FLEET = /^(90[1-7]|10[1-9]|2[01]\d|30[1-9]|40[1-6])$/;
const cars = new Map(); // train id -> the car the feed names
// "West Coast Express Train To Mission": the trip's last stop says it better.
const plain = (name) => name?.replace(/^.*\bTrain To\s+/i, "") ?? name;

export const parse = {
  translinkbc: async (buf) => {
    const trains = gtfsVehicles("westcoastexpress", buf, {
      keep: (v) => v.trip?.routeId === "6770",
      route: () => "West Coast Express",
      // No public train numbers; the vehicle is a locomotive or a cab car.
      number: () => null,
      idOf: (v) => {
        const key = v.vehicle?.id || v.trip?.tripId;
        const car = String(v.vehicle?.label || v.vehicle?.id || "").replace(/^\D+/, "");
        if (key) cars.set(`westcoastexpress:${key}`, FLEET.test(car) ? car : null);
        return key;
      },
      west: (await loadTrips()).westcoastexpress,
    }).map((t) => {
      t.destination = t.stops?.length ? t.stops[t.stops.length - 1].name : plain(t.destination);
      const car = cars.get(t.id);
      if (car) t.cars = { numbers: [car], complete: false };
      return t;
    });
    if (trains.length || typeof sources.timetableTrains !== "function") return trains;
    return sources.timetableTrains("westcoastexpress");
  },
};
