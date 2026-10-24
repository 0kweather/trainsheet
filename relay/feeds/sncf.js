// France (scripts/railroads/sncf.py): the Worker twin of the module's
// relay_fetch, giving the same bytes.
//
// /feed/sncf: SNCF's, Eurostar's and ZOU!'s GTFS-Realtime trip updates (no
// key; asked once a minute), compacted into one answer for the page:
//   { at, trips: { number: [[start date, cancelled 0/1, absolute 0/1,
//                            [[uic, arrival, departure, skipped 0/1], ...]], ...] } }
// arrival and departure are delays (s), or with absolute 1 predicted times
// (unix s, ZOU!'s, which give no delays); a delay is listed only where it
// changes. A feed that fails leaves the others' trips (the page places the
// rest from the timetable).
//
// /feed/idfm: Île-de-France Mobilités' PRIM SIRI Lite estimated-timetable
// for the RER and Transilien lines (key IDFM_PRIM_KEY, header "apikey"; one
// request a line, every two minutes), compacted the same way, each stop
// named by its timetabled time (absolute 2).

const UA = "Trainsheet/1.0 (+https://trainsheet.com)";
const LIVE_FEEDS = [
  "https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates",
  "https://integration-storage.dm.eurostar.com/gtfs-prod/gtfs_rt_v2.bin",
  "https://qommutef8e7.blob.core.windows.net/out-gtfs-rt-trip-update/gtfs-rt-trip-updates.pb?sp=r" +
    "&st=2025-06-23T14%3A10%3A00Z&se=2125-06-24T21%3A59%3A00Z&spr=https&sv=2024-11-04&sr=b" +
    "&sig=tSjVPNeqolsiRwU%2FxmeF6mlzgxVHfieggx%2FWYnwqSoM%3D",
];
const EUROSTAR_UIC = {
  aachen_hbf: "8015345", aime_la_plagne_batiment_voyageurs: "8774176", albertville: "8774164",
  amsterdam_centraal: "8400058", antwerpen_centraal: "8821006", bourg_st_maurice: "8774179",
  bruxelles_midi: "8814001", chambery_challes_les_eaux: "8774100", dortmund_hbf: "8010053",
  duisburg_hbf: "8010316", dusseldorf_hbf: "8008094", essen_hbf: "8010184", koln_hbf: "8015458",
  landry: "8774177", liege_guillemins: "8841004", lille_europe: "8722326", marne_la_vallee_chessy: "8711184",
  moutiers_salins_brides_les_bai: "8774172", paris_nord: "8727100", roissy_airport_cdg_2: "8727149",
  rotterdam_centraal: "8400530", schiphol_airport: "8400561", st_pancras_international: "7015400",
};
const PRIM_ET = "https://prim.iledefrance-mobilites.fr/marketplace/estimated-timetable";
const IDF_LINES = ["C01742", "C01743", "C01727", "C01728", "C01729", "C01737", "C01739", "C01738", "C01740",
  "C01736", "C01730", "C01731", "C01741", "C02711"];

// ---------- Protobuf, read by hand ----------
function varint(b, i) {
  let v = 0, mul = 1, x;
  do { x = b[i++]; v += (x & 0x7f) * mul; mul *= 128; } while (x & 0x80);
  return [v, i];
}
// An int64 varint as a number (a negative one is ten bytes, two's complement).
function signed(b, i) {
  let v = 0n, shift = 0n, x;
  do { x = b[i++]; v |= BigInt(x & 0x7f) << shift; shift += 7n; } while (x & 0x80);
  return Number(BigInt.asIntN(64, v));
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

export function stationOf(id) {
  id = id || "";
  const m = /(\d{7})\d?$/.exec(id);
  if (m) return Number(m[1]);
  const uic = EUROSTAR_UIC[id.replace(/_\d+$/, "")] || EUROSTAR_UIC[id];
  return uic ? Number(uic) : null;
}
export function trainNumber(tripId) {
  const m = /^(?:OCESN)?0*(\d+)/.exec(tripId || "");
  return m ? m[1] : null;
}

// Lists compared as Python compares them, element by element.
function cmp(a, b) {
  if (Array.isArray(a)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) { const c = cmp(a[i], b[i]); if (c) return c; }
    return a.length - b.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function tidy(out) {
  const at = out.at || Math.floor(Date.now() / 1000);
  const ymd = (t) => new Date(t * 1000).toISOString().slice(0, 10).replaceAll("-", "");
  const days = new Set([-1, 0, 1].map((d) => ymd(at + d * 86400)));
  const trips = {};
  for (const number of Object.keys(out.trips).sort()) {
    const runs = out.trips[number].filter((r) => days.has(r[0]) || !r[0]).sort(cmp);
    if (runs.length) trips[number] = runs;
  }
  return { at: out.at, trips };
}

export function compact(feeds, out = { at: 0, trips: {} }) {
  for (const b of feeds) {
    for (const x of fieldsOf(b)) {
      if (x.f === 1 && x.w === 2) {
        for (const h of fieldsOf(b, x.vs, x.ve)) if (h.f === 3 && h.w === 0) out.at = Math.max(out.at, varint(b, h.vs)[0]);
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
              const ev = {};
              for (const z of fieldsOf(b, y.vs, y.ve)) if (z.w === 0) ev[z.f] = signed(b, z.vs);
              s[y.f] = ev;
            } else if (y.f === 4 && y.w === 2) s[4] = str(b, y);
            else if ((y.f === 1 || y.f === 5) && y.w === 0) s[y.f] = varint(b, y.vs)[0];
          }
          updates.push(s);
        }
      }
      const number = trainNumber(desc[1]), date = desc[3];
      if (!number || !date || desc[4] === 1) continue;
      const cancelled = desc[4] === 3 ? 1 : 0;
      const timed = updates.filter((u) => u[5] !== 2 && (u[2] || u[3]));
      const absolute = timed.length && !timed.some((u) => (u[2] && 1 in u[2]) || (u[3] && 1 in u[3])) ? 1 : 0;
      const stops = [];
      let last = null;
      updates.sort((p, q) => (p[1] || 0) - (q[1] || 0));
      for (const u of updates) {
        const uic = stationOf(u[4]);
        if (!uic || u[5] === 2) continue;
        const key = absolute ? 2 : 1;
        let arr = u[2]?.[key] ?? null, dep = u[3]?.[key] ?? null;
        [arr, dep] = [arr ?? dep, dep ?? arr];
        if (arr == null && u[5] !== 1) continue;
        const row = [uic, arr || 0, dep || 0, u[5] === 1 ? 1 : 0];
        if (absolute || !last || !same(row.slice(1), last.slice(1))) stops.push(row);
        last = row;
      }
      if (stops.length || cancelled) (out.trips[number] ||= []).push([date, cancelled, absolute, stops]);
    }
  }
  return tidy(out);
}

// ---------- Île-de-France: PRIM's SIRI Lite ----------
const iso = (t) => (t ? Math.floor(Date.parse(t) / 1000) : null);
const value = (x) => (x && typeof x === "object" ? x.value : x);

export function compactSiri(answers, out = { at: 0, trips: {} }) {
  for (const ans of answers) {
    const delivery = ans?.Siri?.ServiceDelivery || {};
    out.at = Math.max(out.at, iso(delivery.ResponseTimestamp) || 0);
    for (const et of delivery.EstimatedTimetableDelivery || []) {
      for (const frame of et.EstimatedJourneyVersionFrame || []) {
        for (const j of frame.EstimatedVehicleJourney || []) {
          const numbers = (j.TrainNumbers?.TrainNumberRef || []).map(value);
          let number = numbers.find((n) => n && /^\d+$/.test(String(n))) ?? null;
          if (!number) {
            const m = /(\d{5,6})/.exec(String(value(j.DatedVehicleJourneyRef) || ""));
            number = m ? m[1] : null;
          }
          if (!number) continue;
          const stops = [];
          let last = null;
          const cancelled = j.Cancellation ? 1 : 0;
          for (const c of j.EstimatedCalls?.EstimatedCall || []) {
            const aimedA = iso(c.AimedArrivalTime), aimedD = iso(c.AimedDepartureTime);
            const expA = iso(c.ExpectedArrivalTime), expD = iso(c.ExpectedDepartureTime);
            const aimed = aimedD || aimedA;
            if (!aimed) continue;
            let arr = expA && aimedA ? expA - aimedA : null, dep = expD && aimedD ? expD - aimedD : null;
            [arr, dep] = [arr ?? dep, dep ?? arr];
            const skipped = [String(c.ArrivalStatus), String(c.DepartureStatus)].includes("cancelled") ? 1 : 0;
            const row = [aimed, arr || 0, dep || 0, skipped];
            if (!last || !same(row.slice(1), last.slice(1))) stops.push(row);
            last = row;
          }
          if (stops.length || cancelled) (out.trips[String(number)] ||= []).push(["", cancelled, 2, stops]);
        }
      }
    }
  }
  return tidy(out);
}

const json = (out) => new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });

export async function fetchFeed(env, name) {
  if (name === "sncf") {
    const feeds = await Promise.all(LIVE_FEEDS.map(async (url) => {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
      } catch {
        return null;
      }
    }));
    return json(compact(feeds.filter(Boolean)));
  }
  const answers = await Promise.all(IDF_LINES.map(async (code) => {
    const q = new URLSearchParams({ LineRef: `STIF:Line::${code}:` });
    const res = await fetch(`${PRIM_ET}?${q}`, { headers: { apikey: env.IDFM_PRIM_KEY, Accept: "application/json", "User-Agent": UA } });
    return res.ok ? res.json() : null;
  }));
  return json(compactSiri(answers.filter(Boolean)));
}
