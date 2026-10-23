// Switzerland (scripts/railroads/switzerland.py): the Worker twin of the
// module's relay_fetch, giving the same bytes.
//
// /feed/switzerland: opentransportdata.swiss's GTFS-Realtime trip updates
// (every operator's, for the next three hours; key CH_GTFSRT_KEY, sent as a
// Bearer token; 2 requests a minute per key, so the relay asks once a minute)
// cut to the rail trips and compacted for the page:
//   { at, v, trips: [[start date, "HH:MM", cancelled 0/1, [[uic, arrival
//     delay s, departure delay s, skipped 0/1], ...]], ...] }
// a stop listed only where its update differs from the one before.
//
// /feed/chfo<evu>?train=&date=&from=: one train's formation from the Train
// Formation Service (key CH_FORMATION_KEY; 50 requests a minute per key, this
// copy of the relay asks at most 30), in the detail shape documented in the
// module.

const GTFS_RT = "https://api.opentransportdata.swiss/la/gtfs-rt";
const FORMATION = "https://api.opentransportdata.swiss/formation/v2/formations_full";
const UA = "Trainsheet/1.0 (+https://trainsheet.com)";
const EVUS = { chfosbb: "SBBP", chfobls: "BLSP", chfosob: "SOB", chfothurbo: "THURBO", chfotpf: "TPF", chforhb: "RhB", chfozb: "ZB", chfoother: null };
const OTHER_EVUS = { oensingen: "OeBB", balsthal: "OeBB", neuchatel: "TRN", buttes: "TRN", fleurier: "TRN", travers: "TRN",
  lachauxdefonds: "TRN", lespontsdemartel: "TRN", lelocle: "TRN", lesbrenets: "TRN",
  morges: "MBC", biere: "MBC", apples: "MBC", lisle: "MBC", lislemontlapierre: "MBC" };
const FORMATIONS_PER_MINUTE = 30;
let asked = []; // the times this copy went upstream for a formation, in the last minute

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

// "ch:1:sloid:3000:10:18" -> 8503000 (Zürich HB); a foreign stop's id is its number.
function stationOf(id) {
  let m = /^ch:1:sloid:(\d+)/.exec(id || "");
  if (m) return Number("85" + m[1].padStart(5, "0"));
  m = /^(\d{7})/.exec(id || "");
  return m ? Number(m[1]) : null;
}

// Lists compared as Python compares them, element by element.
function cmp(a, b) {
  if (Array.isArray(a)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = cmp(a[i], b[i]); if (c) return c; }
    return a.length - b.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compact(b) {
  let at = 0, version = "";
  const trips = [];
  for (const x of fieldsOf(b)) {
    if (x.f === 1 && x.w === 2) {
      for (const h of fieldsOf(b, x.vs, x.ve)) {
        if (h.f === 3 && h.w === 0) at = varint(b, h.vs)[0];
        else if (h.f === 4 && h.w === 2) version = str(b, h);
      }
    }
    if (x.f !== 2 || x.w !== 2) continue;
    let tu = null;
    for (const e of fieldsOf(b, x.vs, x.ve)) if (e.f === 3 && e.w === 2) { tu = e; break; }
    if (!tu) continue;
    const desc = {}, updates = [];
    for (const u of fieldsOf(b, tu.vs, tu.ve)) {
      if (u.f === 1 && u.w === 2) {
        for (const d of fieldsOf(b, u.vs, u.ve)) desc[d.f] = d.w === 2 ? str(b, d) : varint(b, d.vs)[0];
      } else if (u.f === 2 && u.w === 2) {
        const s = {};
        for (const y of fieldsOf(b, u.vs, u.ve)) {
          if ((y.f === 2 || y.f === 3) && y.w === 2) {
            s[y.f] = null;
            for (const z of fieldsOf(b, y.vs, y.ve)) if (z.f === 1 && z.w === 0) { s[y.f] = int32(b, z.vs); break; }
          } else if (y.f === 4 && y.w === 2) s[4] = str(b, y);
          else if ((y.f === 1 || y.f === 5) && y.w === 0) s[y.f] = varint(b, y.vs)[0];
        }
        updates.push(s);
      }
    }
    const route = desc[5] || "", trip = desc[1] || "";
    if (!(["91-", "93-"].includes(route.slice(0, 3)) || [".ojp-91-", ".ojp-93-"].includes(trip.slice(0, 8))) || desc[4] === 1) continue;
    if (!desc[3] || !desc[2]) continue;
    const stops = [];
    let last = null;
    updates.sort((p, q) => (p[1] || 0) - (q[1] || 0));
    for (const u of updates) {
      const uic = stationOf(u[4]);
      if (!uic) continue;
      let arr = u[2] ?? null, dep = u[3] ?? null;
      [arr, dep] = [arr ?? dep, dep ?? arr];
      const row = [uic, arr || 0, dep || 0, u[5] === 1 ? 1 : 0];
      if (!last || cmp(row.slice(1), last.slice(1))) stops.push(row);
      last = row;
    }
    const cancelled = desc[4] === 3 ? 1 : 0;
    if (stops.length || cancelled) trips.push([desc[3], desc[2].slice(0, 5), cancelled, stops]);
  }
  trips.sort(cmp);
  return { at, v: version, trips };
}

// ---------- Formations ----------
const isoSec = (t) => (t ? Math.floor(Date.parse(t) / 1000) : null);

function evnOf(v) {
  const ident = v.vehicleIdentifier || {};
  const own = String(ident.evn || "").replace(/\D/g, ""), parent = String(ident.parentEvn || "").replace(/\D/g, "");
  return parent.length === 12 ? parent : own || null;
}
function klass(v) {
  const p = v.vehicleProperties || {};
  const first = p.number1class || 0, second = p.number2class || 0;
  if (first && second) return "12";
  if (first || second) return first ? "1" : "2";
  if (p.numberRestaurantSpace) return "WR";
  if (p.numberBeds) return "WL";
  const name = (v.vehicleIdentifier || {}).typeCodeName || "";
  return /^(Re|Ae|Ee|Em|Am|Aem|Bm|Ge|HGe|Tm|Hcm|Br|Bh|Eem|Ge)\s*\d/.test(name) ? "LK" : "K";
}

export function formation(answer, number, date, evu) {
  const forms = answer.formations || [];
  const vehicles = (forms.length ? forms[0].formationVehicles || [] : []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
  if (!vehicles.length) return { found: false };
  const cars = {
    numbers: vehicles.map((v) => evnOf(v) || ""), classes: vehicles.map(klass),
    models: vehicles.map((v) => (v.vehicleIdentifier || {}).typeCodeName || ""), orders: vehicles.map((v) => v.number || 0), complete: true,
  };
  const stops = [];
  for (const f of answer.formationsAtScheduledStops || []) {
    const st = f.scheduledStop || {}, pt = st.stopPoint || {}, tm = st.stopTime || {};
    if (["D", "+D", "-H"].includes(st.stopType)) continue;
    const short = (f.formationShort || {}).formationShortString || "";
    const sectors = [...new Set([...short.matchAll(/@([A-Z])/g)].map((m) => m[1]))].sort().join("");
    const track = st.track;
    stops.push({ name: pt.name ?? null, uic: pt.uic ?? null, arr: isoSec(tm.arrivalTime), dep: isoSec(tm.departureTime),
      platform: track == null || track === "" || track === "N/A" ? null : String(track), sectors: sectors || null });
  }
  return { found: true, formation: true, number: String(number), date, evu, cars, stops };
}

const json = (out) => new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });

export async function fetchFeed(env, name, ctx, query) {
  if (name === "switzerland") {
    const res = await fetch(GTFS_RT, { headers: { Authorization: `Bearer ${env.CH_GTFSRT_KEY}`, "User-Agent": UA,
      "Content-Type": "application/octet-stream", "Accept-Encoding": "br, gzip, deflate" } });
    if (!res.ok) return res;
    return json(compact(new Uint8Array(await res.arrayBuffer())));
  }
  // One train's formation; the key is checked first (the relay lists a
  // detail source whatever its keys).
  if (!env.CH_FORMATION_KEY) return new Response("Not configured", { status: 503 });
  const evu = EVUS[name] || OTHER_EVUS[query?.from || ""];
  const now = Date.now();
  asked = asked.filter((t) => now - t < 60 * 1000);
  if (!evu || asked.length >= FORMATIONS_PER_MINUTE) return json({ found: false });
  asked.push(now);
  const q = new URLSearchParams({ evu, operationDate: query.date, trainNumber: query.train });
  const res = await fetch(`${FORMATION}?${q}`, { headers: { Authorization: `Bearer ${env.CH_FORMATION_KEY}`, "User-Agent": UA, Accept: "application/json" } });
  // 404: no formation for it; 400: no such train for this railway that day.
  if (res.status === 404 || res.status === 400) return json({ found: false });
  if (!res.ok) return res;
  return json(formation(await res.json(), query.train, query.date, evu));
}
