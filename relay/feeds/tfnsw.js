// Sydney Trains and NSW TrainLink: Transport for NSW's four GTFS-realtime
// feeds (NSW Trains' positions and trip updates, then Sydney Trains'), back
// to back as one feed: concatenated protobuf messages read as one, with
// every entity. NSW Trains' come first because its diesel trains are in
// both, and the parser keeps the first copy of a run (TfNSW asks for NSW
// Trains'). The Worker twin of relay_fetch in scripts/railroads/tfnsw.py; it
// gives the same bytes. Off until the TFNSW_API_KEY secret is set.

const API = "https://api.transport.nsw.gov.au";
const FEEDS = [`${API}/v1/gtfs/vehiclepos/nswtrains`, `${API}/v1/gtfs/realtime/nswtrains`,
  `${API}/v2/gtfs/vehiclepos/sydneytrains`, `${API}/v2/gtfs/realtime/sydneytrains`];

export async function fetchFeed(env) {
  const headers = { Authorization: `apikey ${env.TFNSW_API_KEY}`, Accept: "application/x-google-protobuf" };
  // The key allows five requests a second: these four go out together.
  const got = await Promise.all(FEEDS.map((url) => fetch(url, { headers })
    .then(async (res) => (res.ok ? new Uint8Array(await res.arrayBuffer()) : res))
    .catch((err) => new Response(`Upstream error: ${err.message}`, { status: 502 }))));
  // A feed that fails is left out; with no positions at all, the refusal
  // goes back (and the relay serves its last good copy).
  if (!(got[0] instanceof Uint8Array) && !(got[2] instanceof Uint8Array)) return got[2];
  return new Response(new Blob(got.filter((b) => b instanceof Uint8Array)), { headers: { "Content-Type": "application/x-protobuf" } });
}
