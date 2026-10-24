// The Netherlands (scripts/railroads/nl.py): the Worker twin of the module's
// relay_fetch, giving the same bytes.
//
// /feed/nl: OVapi's GTFS-Realtime trainUpdates (gtfs.ovapi.nl, no key; every
// train's departures from NS's InfoPlus, 1.5 MB, sent with no CORS headers),
// asked for once a minute (ttl 60, within OVapi's usage policy: a named
// User-Agent, gzip) and compacted for the page:
//   { at, trips: [[service date "20261024", train number "4974", cancelled 0/1,
//     [[station code, arrival delay s, departure delay s, skipped 0/1], ...]], ...] }
// a stop listed only where it differs from the one before or is skipped (a
// skipped stop with no times carries the delay before it); added trains left out.

const TRAIN_UPDATES = "https://gtfs.ovapi.nl/nl/trainUpdates.pb";
const UA = "Trainsheet/1.0 (+https://trainsheet.com)";

// ---------- Protobuf, read by hand ----------
function varint(b, i) {
  let v = 0, mul = 1, x;
  do { x = b[i++]; v += (x & 0x7f) * mul; mul *= 128; } while (x & 0x80);
  return [v, i];
}
// An int32 (a negative one is ten bytes, two's complement): its low 32 bits.
function int32(b, i) {
  let v = 0, shift = 0, x;
  do { x = b[i++]; if (shift < 32) v |= (x & 0x7f) << shift; shift += 7; } while (x & 0x80);
  return v | 0;
}
function* fieldsOf(b, start = 0, end = b.length) {
  let i = start;
  while (i < end) {
    let key; [key, i] = varint(b, i);
    const f = Math.floor(key / 8), w = key & 7;
    let vs = i, ve;
    if (w === 0) { [, i] = varint(b, i); ve = i; }
    else if (w === 1) { i += 8; ve = i; }
    else if (w === 5) { i += 4; ve = i; }
    else if (w === 2) { let len; [len, vs] = varint(b, i); i = ve = vs + len; }
    else return;
    yield { f, w, vs, ve };
  }
}
const dec = new TextDecoder();
const str = (b, x) => dec.decode(b.subarray(x.vs, x.ve));

// Lists compared as Python compares them, element by element.
function cmp(a, b) {
  if (Array.isArray(a)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = cmp(a[i], b[i]); if (c) return c; }
    return a.length - b.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compact(b) {
  let at = 0;
  const trips = [];
  for (const x of fieldsOf(b)) {
    if (x.f === 1 && x.w === 2) {
      for (const h of fieldsOf(b, x.vs, x.ve)) if (h.f === 3 && h.w === 0) { at = varint(b, h.vs)[0]; break; }
    }
    if (x.f !== 2 || x.w !== 2) continue;
    let tu = null;
    for (const e of fieldsOf(b, x.vs, x.ve)) if (e.f === 3 && e.w === 2) { tu = e; break; }
    if (!tu) continue;
    const desc = {}, updates = [];
    let number = null;
    for (const u of fieldsOf(b, tu.vs, tu.ve)) {
      if (u.f === 1 && u.w === 2) {
        for (const d of fieldsOf(b, u.vs, u.ve)) {
          if (d.f === 1003 && d.w === 2) {
            for (const y of fieldsOf(b, d.vs, d.ve)) if (y.f === 2 && y.w === 2) { number = str(b, y); break; }
          } else desc[d.f] = d.w === 2 ? str(b, d) : varint(b, d.vs)[0];
        }
      } else if (u.f === 2 && u.w === 2) {
        const s = {};
        for (const y of fieldsOf(b, u.vs, u.ve)) {
          if ((y.f === 2 || y.f === 3) && y.w === 2) {
            s[y.f] = null;
            for (const z of fieldsOf(b, y.vs, y.ve)) if (z.f === 1 && z.w === 0) { s[y.f] = int32(b, z.vs); break; }
          } else if (y.f === 5 && y.w === 0) s[5] = varint(b, y.vs)[0];
          else if (y.f === 1003 && y.w === 2) {
            s[4] = null;
            for (const z of fieldsOf(b, y.vs, y.ve)) if (z.f === 4 && z.w === 2) { s[4] = str(b, z); break; }
          }
        }
        updates.push(s);
      }
    }
    if (desc[4] === 1 || !desc[3] || !/^\d+$/.test(number || "")) continue;
    const stops = [];
    let last = null;
    for (const u of updates) {
      const skipped = u[5] === 1 ? 1 : 0;
      let arr = u[2] ?? null, dep = u[3] ?? null;
      if (!u[4] || (arr === null && dep === null && !skipped)) continue;
      [arr, dep] = [arr ?? dep, dep ?? arr];
      if (arr === null) arr = dep = last ? last[2] : 0; // skipped, with no times: the delay it carries on with
      const row = [u[4], arr || 0, dep || 0, skipped];
      if (!last || skipped || cmp(row.slice(1), last.slice(1))) stops.push(row);
      last = row;
    }
    const cancelled = desc[4] === 3 ? 1 : 0;
    if (stops.length || cancelled) trips.push([desc[3], number, cancelled, stops]);
  }
  trips.sort(cmp);
  return { at, trips };
}

export async function fetchFeed(env, name, ctx, query) {
  const res = await fetch(TRAIN_UPDATES, { headers: { "User-Agent": UA, "Accept-Encoding": "gzip" } });
  if (!res.ok) return res;
  return new Response(JSON.stringify(compact(new Uint8Array(await res.arrayBuffer()))), { headers: { "Content-Type": "application/json" } });
}
