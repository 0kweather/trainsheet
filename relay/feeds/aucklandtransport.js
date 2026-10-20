// Auckland Transport's GTFS-realtime, its trains alone: AT's combined feed
// (vehicle positions and trip updates in one answer, one request of the
// key's 35,000 a week) covers its buses and ferries too, so only the
// entities of trains go on: a vehicle or trip update on a train route
// ("E-W-201", "HUIA-404"), a train unit with no trip (a unit coupled behind
// the one carrying the trip: ids 59xxx, labels "AMP        123"), and the
// trip update of any train unit's trip. The Worker twin of relay_fetch in
// scripts/railroads/aucklandtransport.py; it gives the same bytes. Off until
// the AT_API_KEY secret is set.

const FEED = "https://api.at.govt.nz/realtime/legacy";
const TRAIN_ROUTE = /^(E-W|O-W|S-C|HUIA|WEST|EAST|STH|ONE|PUK)-/;
const TRAIN_ID = /^59\d{3}$/;
const TRAIN_LABEL = /^AM/;

function varint(b, i) {
  let v = 0, mul = 1, x;
  do { x = b[i++]; v += (x & 0x7f) * mul; mul *= 128; } while (x & 0x80);
  return [v, i];
}
// Each field of b[start, end) as { f, w, vs, ve, s, e }: its value's bytes
// and the whole field's.
function* fieldsOf(b, start, end) {
  let i = start;
  while (i < end) {
    const s = i;
    let key, vs, ve;
    [key, i] = varint(b, i);
    const f = Math.floor(key / 8), w = key & 7;
    if (w === 0) { vs = i; [, i] = varint(b, i); ve = i; }
    else if (w === 1) { vs = i; i += 8; ve = i; }
    else if (w === 5) { vs = i; i += 4; ve = i; }
    else if (w === 2) { let n; [n, vs] = varint(b, i); i = ve = vs + n; }
    else return;
    yield { f, w, vs, ve, s, e: i };
  }
}
const child = (b, x, f) => {
  if (!x) return null;
  for (const y of fieldsOf(b, x.vs, x.ve)) if (y.f === f && y.w === 2) return y;
  return null;
};
const decoder = new TextDecoder();
const text = (b, x, f) => {
  const y = child(b, x, f);
  return y ? decoder.decode(b.subarray(y.vs, y.ve)) : "";
};

export function keepTrains(b) {
  const parts = [], ents = [], trips = new Set();
  for (const x of fieldsOf(b, 0, b.length)) {
    if (x.f !== 2 || x.w !== 2) { parts.push(b.subarray(x.s, x.e)); continue; }
    const tu = child(b, x, 3), vp = child(b, x, 4);
    const trip = child(b, vp, 1) || child(b, tu, 1);
    const desc = child(b, vp, 8);
    const unit = !!desc && (TRAIN_ID.test(text(b, desc, 1)) || TRAIN_LABEL.test(text(b, desc, 2)));
    const tripId = text(b, trip, 1);
    if (unit && tripId) trips.add(tripId);
    ents.push({ x, tu, train: unit || TRAIN_ROUTE.test(text(b, trip, 5)), tripId });
  }
  // In the feed's order, after the header.
  for (const { x, tu, train, tripId } of ents) if (train || (tu && trips.has(tripId))) parts.push(b.subarray(x.s, x.e));
  return new Blob(parts);
}

export async function fetchFeed(env) {
  const res = await fetch(FEED, { headers: { "Ocp-Apim-Subscription-Key": env.AT_API_KEY, Accept: "application/x-protobuf", "User-Agent": "Trainsheet relay" } });
  // Refused or failing: the relay serves its last good copy.
  if (!res.ok) return res;
  return new Response(keepTrains(new Uint8Array(await res.arrayBuffer())), { headers: { "Content-Type": "application/x-protobuf" } });
}
