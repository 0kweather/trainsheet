// Tri-Rail's GTFS-realtime positions (scripts/railroads/trirail.py).

import { gtfsVehicles } from "../sources.js?v=dev";

export const parse = {
  trirail: (buf) => gtfsVehicles("trirail", buf, {
    route: () => "Tri-Rail",
    zeroHeading: true,
    number: (v) => (v.vehicle?.label || "").replace(/^P/, "") || null, // "P625" is train 625
  }),
};
