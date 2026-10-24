// Track, one file per region: North America's (data/rail.geojson) and each
// region's abroad (scripts/build_rail.py writes data/rail/<region>.geojson;
// the registry lists them with their extents as RAIL_REGIONS). A region's
// file loads the first time the map shows part of it, close enough to
// matter: zoomed in a little, or with the view centered inside it. So the
// opening view of North America, which can reach well past the US border on
// a wide screen, asks for none abroad, and a view of Europe none of North
// America's.

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
// as it arrives; track(promise, region) is handed each fetch while it's out.
// Gives { first: settles once the opening view's files are in (or failed),
// load(region): fetch one now, wherever the map is }.
export function watchRegions(map, regions, add, track = (p) => p) {
  const load = (r) => {
    if (asked.has(r.region)) return null;
    asked.add(r.region);
    return track(fetch(`${r.file}?v=dev`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))), r)
      .then((geojson) => add(geojson, r))
      .catch((err) => {
        console.warn(`rail region ${r.region}`, err);
        asked.delete(r.region); // try again on the next move
      });
  };
  const check = () => {
    const bounds = map.getBounds(), center = map.getCenter();
    const view = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const near = map.getZoom() >= MIN_ZOOM;
    return regions.filter((r) => !asked.has(r.region) && meets(r.bbox, view) && (near || contains(r.bbox, center.lng, center.lat))).map(load);
  };
  map.on("moveend", check);
  return { first: Promise.all(check()), load };
}
