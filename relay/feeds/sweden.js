// Sweden's passenger trains (scripts/railroads/sweden.py): Trafikverket's
// open API, asked in one request for every train's last GPS fix
// (TrainPosition) and the advertised departures made in the last 20 minutes
// (TrainAnnouncement), joined by advertised train number into one compact
// answer, {"at": unix seconds, "trains": [{n, pos, heading, speed, ts,
// product, owner, operator, to, last, lastTs, delay}]}: the Worker twin of
// the module's relay_fetch, giving the same answer. The stations' names
// (TrainStation, by signature) are asked once a day and kept by this
// instance. Off until the TRAFIKVERKET_API_KEY secret is set.

const API = "https://api.trafikinfo.trafikverket.se/v2/data.json";
const UA = "Trainsheet/1.0 (+https://trainsheet.com)";
const include = (...fields) => fields.map((f) => `<INCLUDE>${f}</INCLUDE>`).join("");
// Trains with a fix in the last ten minutes and an advertised number (freight has only an operational one).
const POSITIONS = '<QUERY objecttype="TrainPosition" namespace="järnväg.trafikinfo" schemaversion="1.1">'
  + '<FILTER><AND><GT name="TimeStamp" value="$dateadd(-0.00:10:00)"/>'
  + '<EXISTS name="Train.AdvertisedTrainNumber" value="true"/></AND></FILTER>'
  + include("Train.AdvertisedTrainNumber", "Position.WGS84", "Bearing", "Speed", "TimeStamp") + "</QUERY>";
// Advertised departures in the last 20 minutes: delay, product, owner, destination.
const DEPARTURES = '<QUERY objecttype="TrainAnnouncement" schemaversion="1.9" orderby="TimeAtLocation">'
  + '<FILTER><AND><EQ name="Advertised" value="true"/><EQ name="ActivityType" value="Avgang"/>'
  + '<GT name="TimeAtLocation" value="$dateadd(-0.00:20:00)"/></AND></FILTER>'
  + include("AdvertisedTrainIdent", "LocationSignature", "AdvertisedTimeAtLocation", "TimeAtLocation", "ProductInformation",
    "InformationOwner", "Operator", "ToLocation", "Canceled") + "</QUERY>";
const STATIONS = '<QUERY objecttype="TrainStation" namespace="rail.infrastructure" schemaversion="1.4">'
  + '<FILTER><EQ name="Advertised" value="true"/></FILTER>' + include("LocationSignature", "AdvertisedLocationName") + "</QUERY>";
const STATION_MS = 24 * 3600 * 1000;
let stationNames = { at: 0, names: {} };

const xml = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const request = (key, ...queries) => `<REQUEST><LOGIN authenticationkey="${xml(key)}"/>${queries.join("")}</REQUEST>`;

async function post(body) {
  const res = await fetch(API, { method: "POST", body, headers: { "Content-Type": "text/xml; charset=utf-8", "User-Agent": UA } });
  if (!res.ok) throw new Error(`Trafikverket: HTTP ${res.status}`);
  const results = (await res.json()).RESPONSE.RESULT;
  const error = results.find((r) => r.ERROR);
  if (error) throw new Error(`Trafikverket: ${error.ERROR.MESSAGE || JSON.stringify(error.ERROR)}`);
  return results;
}

const seconds = (iso) => (iso ? Math.floor(Date.parse(iso) / 1000) : null);
const round5 = (x) => Math.round(x * 1e5) / 1e5;

function point(wkt) {
  const m = /^POINT \(([-\d.]+) ([-\d.]+)\)/.exec(wkt || "");
  return m ? [round5(Number(m[2])), round5(Number(m[1]))] : null;
}

// As compact() in sweden.py: one entry a positioned train, with its latest departure's facts.
export function compact(positions, departures, names, now = Date.now()) {
  const latest = new Map();
  for (const d of departures) {
    const n = d.AdvertisedTrainIdent;
    if (!n || !d.TimeAtLocation || d.Canceled) continue;
    if (!latest.has(n) || d.TimeAtLocation >= latest.get(n).TimeAtLocation) latest.set(n, d);
  }
  const trains = [];
  for (const p of positions) {
    const n = p.Train?.AdvertisedTrainNumber;
    const pos = point(p.Position?.WGS84);
    if (!n || !pos) continue;
    const t = { n, pos, heading: p.Bearing, speed: p.Speed, ts: seconds(p.TimeStamp) };
    const d = latest.get(n);
    if (d) {
      // The destination: the last of its "to" stations, by their order.
      const to = (d.ToLocation || []).reduce((a, b) => (!a || (b.Order || 0) > (a.Order || 0) ? b : a), null)?.LocationName;
      const actual = seconds(d.TimeAtLocation), planned = seconds(d.AdvertisedTimeAtLocation);
      Object.assign(t, {
        product: (d.ProductInformation || []).find((x) => x.Description)?.Description, owner: d.InformationOwner,
        operator: d.Operator, to: names[to] ?? to, last: names[d.LocationSignature] ?? d.LocationSignature, lastTs: actual,
        delay: actual && planned ? Math.round((actual - planned) / 60) : null,
      });
    }
    trains.push(Object.fromEntries(Object.entries(t).filter(([, v]) => v !== null && v !== undefined)));
  }
  trains.sort((a, b) => (a.n < b.n ? -1 : a.n > b.n ? 1 : 0));
  return { at: Math.floor(now / 1000), trains };
}

export async function fetchFeed(env) {
  const key = env.TRAFIKVERKET_API_KEY;
  if (Date.now() - stationNames.at > STATION_MS) {
    try {
      const rows = (await post(request(key, STATIONS)))[0].TrainStation || [];
      stationNames = { at: Date.now(), names: Object.fromEntries(rows.filter((r) => r.LocationSignature && r.AdvertisedLocationName)
        .map((r) => [r.LocationSignature, r.AdvertisedLocationName])) };
    } catch { /* the signatures stand in */ }
  }
  const results = await post(request(key, POSITIONS, DEPARTURES));
  const out = compact(results[0].TrainPosition || [], results[1].TrainAnnouncement || [], stationNames.names);
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}
