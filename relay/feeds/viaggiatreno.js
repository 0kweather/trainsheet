// ViaggiaTreno (scripts/railroads/viaggiatreno.py): one train's delay, last
// report, platforms and stop-by-stop times, asked for when a viewer opens or
// tracks it, as the page's detail shape; the same bytes as the module's
// relay_fetch. ViaggiaTreno answers only browser-like User-Agents and refuses
// one holding a URL; its https address redirects to http.

const API = "http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; Trainsheet/1.0; +trainsheet.com)", Accept: "application/json, text/plain, */*" };
const ORIGIN_MS = 6 * 3600 * 1000; // how long a train's origin (and its day's key) is remembered
const origins = new Map(); // "number|date|from" -> { at, origin: [station id, midnight ms] }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// A station name compared loosely: no accents, case, spaces or dots.
const nameKey = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

// The train's origin station id and day key, from ViaggiaTreno's search by
// number: one line per run, "9611 - TORINO PORTA NUOVA - 19/10/26|
// 9611-S00219-1792360800000". Of that day's runs (a regional number can be
// used in two places), the one from `from` (a name key) or the only one.
async function findOrigin(number, date, from) {
  const [y, m, d] = date.split("-");
  const day = `${d}/${m}/${y.slice(2)}`;
  const runs = [];
  for (const line of (await get(`${API}/cercaNumeroTrenoTrenoAutocomplete/${number}`)).split(/\r?\n/)) {
    const bar = line.indexOf("|");
    const label = bar < 0 ? line : line.slice(0, bar), key = bar < 0 ? "" : line.slice(bar + 1);
    const parts = label.split(" - "), bits = key.trim().split("-");
    if (parts.length >= 3 && parts[parts.length - 1].trim() === day && bits.length === 3) {
      runs.push([nameKey(parts.slice(1, -1).join(" - ")), bits[1], parseInt(bits[2], 10)]);
    }
  }
  const pick = runs.filter((r) => from && r[0] === from);
  const run = pick.length ? pick[0] : runs.length === 1 ? runs[0] : null;
  return run ? [run[1], run[2]] : null;
}

const secs = (ms) => (typeof ms === "number" && ms > 0 ? Math.floor(ms / 1000) : null);

function platform(f) {
  for (const k of ["binarioEffettivoPartenzaDescrizione", "binarioEffettivoArrivoDescrizione",
    "binarioProgrammatoPartenzaDescrizione", "binarioProgrammatoArrivoDescrizione"]) {
    const v = (f[k] || "").trim();
    if (v) return v;
  }
  return null;
}

// The page's detail shape (js/sources.js applyDetail), from andamentoTreno.
// provvedimento 1 is a train cancelled outright; a stop whose
// actualFermataType is 3 is cancelled.
function compact(number, date, run) {
  const last = run.stazioneUltimoRilevamento;
  const stops = (run.fermate || []).map((f) => ({
    name: f.stazione ?? null, arr: secs(f.arrivo_teorico), dep: secs(f.partenza_teorica),
    actualArr: secs(f.arrivoReale), actualDep: secs(f.partenzaReale), platform: platform(f), cancelled: f.actualFermataType === 3,
  }));
  return {
    found: true, number, date, origin: run.origine ?? null, destination: run.destinazione ?? null,
    delay: Number.isInteger(run.ritardo) ? run.ritardo : null,
    cancelled: run.provvedimento === 1, departed: !run.nonPartito && Boolean(secs(run.oraUltimoRilevamento)),
    arrived: Boolean(run.arrivato),
    last: last && last !== "--" ? { station: last, at: secs(run.oraUltimoRilevamento) } : null,
    stops,
  };
}

// query: { train, date, from }, checked and normalised by the relay (from is
// a name key, maybe empty).
export async function fetchFeed(env, name, ctx, query) {
  const { train: number, date, from = "" } = query;
  const k = `${number}|${date}|${from}`;
  const hit = origins.get(k);
  const origin = hit && Date.now() - hit.at < ORIGIN_MS ? hit.origin : await findOrigin(number, date, from);
  if (origin && origin !== hit?.origin) { // a train not found is looked up again next time
    if (origins.size > 500) origins.clear();
    origins.set(k, { at: Date.now(), origin });
  }
  let run = null;
  if (origin) {
    const text = (await get(`${API}/andamentoTreno/${origin[0]}/${number}/${origin[1]}`)).trim();
    run = text ? JSON.parse(text) : null;
  }
  const out = run ? compact(number, date, run) : { found: false, number, date };
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}
