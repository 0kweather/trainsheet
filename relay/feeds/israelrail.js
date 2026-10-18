// Israel Railways' positions from Hasadna's Open Bus Stride API: the last few
// loaded minute snapshots of the SIRI feed, Israel Railways' rows alone, cut
// to the fields js/railroads/israelrail.js reads. The Worker twin of
// relay_fetch in scripts/railroads/israelrail.py; it gives the same bytes.

const STRIDE = "https://open-bus-stride-api.hasadna.org.il";
const IDENTIFYING_UA = "Trainsheet/1.0 (+https://trainsheet.com)";
const SNAPSHOTS = 5; // minutes of history, to tell a frozen GPS position from a train standing still

async function get(path) {
  const res = await fetch(STRIDE + path, { headers: { "User-Agent": IDENTIFYING_UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`Stride HTTP ${res.status}`);
  return res.json();
}

export async function fetchFeed() {
  // Stride's time-range queries over its positions are slow; its snapshot ids are indexed.
  const snaps = (await get(`/siri_snapshots/list?limit=${SNAPSHOTS + 2}&order_by=id%20desc`))
    .filter((s) => s.etl_status === "loaded").slice(0, SNAPSHOTS).map((s) => s.id);
  const rows = snaps.length
    ? await get(`/siri_vehicle_locations/list?siri_snapshot_ids=${snaps.join(",")}&siri_routes__operator_ref=2&limit=5000`)
    : [];
  const trains = rows.map((r) => [r.siri_snapshot_id, r.siri_ride__vehicle_ref, r.siri_route__line_ref, r.recorded_at_time,
                                  r.lat, r.lon, r.bearing, r.velocity]);
  return new Response(JSON.stringify({ trains }), { headers: { "Content-Type": "application/json" } });
}
