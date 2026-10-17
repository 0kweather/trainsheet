// Track outside North America, one file per region (scripts/build_rail.py
// writes data/rail/<region>.geojson; the registry lists them with their
// extents as RAIL_REGIONS). A region's file loads the first time the map
// shows part of it, close enough to matter: zoomed in a little, or with the
// view centered inside it. So the opening view of North America, which can
// reach well past the US border on a wide screen, asks for none.

import { RAIL_REGIONS } from "./railroads/index.js?v=dev";

const MIN_ZOOM = 4.5;
const asked = new Set(); // regions fetched or being fetched

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

// Watch the map, and call add(geojson, region) once for each region's track
// as it arrives.
export function watchRegions(map, add) {
  const check = () => {
    const bounds = map.getBounds(), center = map.getCenter();
    const view = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const near = map.getZoom() >= MIN_ZOOM;
    for (const r of RAIL_REGIONS) {
      if (asked.has(r.region) || !meets(r.bbox, view) || !(near || contains(r.bbox, center.lng, center.lat))) continue;
      asked.add(r.region);
      fetch(`${r.file}?v=dev`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((geojson) => add(geojson, r))
        .catch((err) => {
          console.warn(`rail region ${r.region}`, err);
          asked.delete(r.region); // try again on the next move
        });
    }
  };
  map.on("moveend", check);
  check();
}
