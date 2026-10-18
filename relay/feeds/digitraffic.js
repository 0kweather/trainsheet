// Finland's Digitraffic (scripts/railroads/digitraffic.py): the trains' last
// GPS fixes and the GTFS-realtime trip updates in one answer,
// {"locations": train-locations/latest as sent, "updates": the updates in
// base64}, the same bytes as the module's relay_fetch. Digitraffic answers
// 406 without gzip on offer and asks each client to name itself.

const API = "https://rata.digitraffic.fi/api/v1";
const HEADERS = { "Accept-Encoding": "gzip", "Digitraffic-User": "Trainsheet/1.0", "User-Agent": "Trainsheet/1.0 (+https://trainsheet.com)" };

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer()); // unpacked by the runtime
}

function base64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function fetchFeed(env, name, ctx) {
  const [locations, updates] = await Promise.all([get(`${API}/train-locations/latest/`),
    get(`${API}/trains/gtfs-rt-updates`).then(base64, () => "")]); // positions without delays rather than nothing
  const body = new Blob(['{"locations":', locations, `,"updates":"${updates}"}`]);
  return new Response(body, { headers: { "Content-Type": "application/json" } });
}
