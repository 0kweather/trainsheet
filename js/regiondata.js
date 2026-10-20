// Station and timetable data outside the US and Canada, one folder per
// region (scripts/build_*.py write data/regions/<region>/stations.json,
// departures.json, firsts.json, linecolors.json and trips.json, each shaped
// as data/'s own; the registry lists them as DATA_REGIONS). A region's loads
// the first time the map shows it, by the rule js/railregions.js loads its
// track by (zoomed in a little, or centered inside it), or when a search,
// a shared link or an open railroad needs it, so a viewer in North America
// fetches none of it.

import { DATA_REGIONS } from "./railroads/index.js?v=dev";

const MIN_ZOOM = 4.5;
const files = new Map(); // "region/kind" -> promise of the file (null: none)
let track = (p) => p; // handed each fetch while it's out (see watchData)
const loaded = new Map(); // region -> promise of its data, handed to add() once

// Does [west, south, east, north] meet the view's? The view's longitudes can
// run past ±180 when the map wraps around the world.
function meets(b, v) {
  if (b[1] > v[3] || b[3] < v[1]) return false;
  return [-360, 0, 360].some((k) => b[0] + k <= v[2] && b[2] + k >= v[0]);
}

function contains(b, lon, lat) {
  lon = ((lon + 540) % 360) - 180;
  return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];
}

// One of a region's files, fetched once; a region without it, or one that
// fails, gives null (a failure is asked for again next time).
function file(r, kind) {
  const k = `${r.region}/${kind}`;
  if (!files.has(k)) {
    files.set(k, !r.files.includes(kind) ? Promise.resolve(null)
      : track(fetch(`data/regions/${r.region}/${kind}.json?v=dev`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))))
        .catch((err) => {
          console.warn(`region ${r.region} ${kind}`, err);
          files.delete(k);
          return null;
        }));
  }
  return files.get(k);
}

// The region a railroad's data is in, or none (the US and Canada's).
export const regionOf = (agency) => DATA_REGIONS.find((r) => r.agencies.includes(agency)) || null;

// A plug-in railroad's stop and trip lookups (its region's trips.json, as
// sources.js's loadTrips() gives the others'), for its parser.
export const tripsOf = async (agency) => {
  const r = regionOf(agency);
  return (r && (await file(r, "trips"))?.[agency]) || null;
};

let add = () => {};
// Loads a region's stations, departures, first trains and line colors, and
// hands them to add({ region, stations, departures, firsts, linecolors })
// once, when all are in; the promise settles when add's own does.
export function loadRegion(r) {
  if (!r) return Promise.resolve();
  if (!loaded.has(r.region)) {
    const kinds = ["stations", "departures", "firsts", "linecolors"];
    loaded.set(r.region, Promise.all(kinds.map((k) => file(r, k))).then((parts) => {
      const d = Object.fromEntries(kinds.map((k, i) => [k, parts[i]]));
      if (!d.stations) {
        loaded.delete(r.region); // try again on the next move
        return;
      }
      return add({ region: r, ...d });
    }));
  }
  return loaded.get(r.region);
}
// Every region (a search may be for any railroad), or the one a railroad's in.
export const loadAll = () => Promise.all(DATA_REGIONS.map(loadRegion));
export const loadFor = (agency) => loadRegion(regionOf(agency));

// Watch the map, and load each region's data the first time it shows;
// tracking(promise) is handed each file's fetch while it's out.
export function watchData(map, onRegion, tracking) {
  add = onRegion;
  if (tracking) track = tracking;
  const check = () => {
    const bounds = map.getBounds(), center = map.getCenter();
    const view = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const near = map.getZoom() >= MIN_ZOOM;
    for (const r of DATA_REGIONS) {
      if (loaded.has(r.region) || !meets(r.bbox, view) || !(near || contains(r.bbox, center.lng, center.lat))) continue;
      loadRegion(r);
    }
  };
  map.on("moveend", check);
  check();
}
