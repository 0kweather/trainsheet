// SNCB (scripts/railroads/sncb.py): the Worker twin of the module's
// relay_fetch, giving the same bytes.
//
// /feed/irail?train=&date=&from=: one train's run (its delays, platforms,
// stop times as they happened) and, on its day, its composition, from iRail
// (api.irail.be: no key; 3 requests a second per address, a User-Agent
// naming the app; this copy of the relay goes upstream at most 60 times a
// minute), in the detail shape documented in the module.

const IRAIL = "https://api.irail.be/v1";
const UA = "Trainsheet/1.0 (+https://trainsheet.com; relay)";
const IRAIL_PER_MINUTE = 60;
let asked = []; // the times this copy went upstream, in the last minute

const int = (v) => {
  const n = typeof v === "number" ? v : /^-?\d+$/.test(String(v ?? "").trim()) ? Number(String(v).trim()) : NaN;
  return Number.isInteger(n) ? n : null;
};

// iRail's local name as the map writes it: Brussels' "Brussel-Zuid/Bruxelles-Midi"
// French first, "Bruxelles-Midi / Brussel-Zuid".
export function irailName(standard) {
  const s = String(standard ?? "").trim();
  if (s === "Lëtzebuerg") return "Luxembourg"; // iRail's name for Luxembourg; CFL's signs say Luxembourg
  if (s.includes("/") && !s.includes(" / ")) {
    const at = s.indexOf("/");
    return `${s.slice(at + 1).trim()} / ${s.slice(0, at).trim()}`;
  }
  return s;
}

function klass(u) {
  const first = int(u.seatsFirstClass) || 0, second = int(u.seatsSecondClass) || 0;
  if (first && second) return "12";
  if (first || second) return first ? "1" : "2";
  return /^HL/.test(u.materialType?.parent_type || "") ? "LK" : "K";
}

export function irailCars(comp) {
  const segs = comp?.composition?.segments?.segment || [];
  if (!segs.length) return null;
  const units = segs[0].composition?.units?.unit || [];
  if (!units.length) return null;
  return {
    numbers: units.map((u) => String(u.materialNumber || "")),
    models: units.map((u) => u.materialSubTypeName || [u.materialType?.parent_type, u.materialType?.sub_type].filter(Boolean).join("_")),
    classes: units.map(klass), orders: units.map(() => 0),
    units: units.map((u) => int(u.tractionPosition) || 0),
    sides: units.map((u) => u.materialType?.orientation || ""),
    complete: segs.length === 1,
  };
}

export function irailDetail(vehicle, comp, number, date) {
  const raw = vehicle?.stops?.stop || [];
  if (!raw.length) return { found: false };
  const stops = [], n = raw.length;
  let last = null;
  raw.forEach((s, i) => {
    const nm = irailName(s.stationinfo?.standardname || s.station);
    const sa = int(s.scheduledArrivalTime), sd = int(s.scheduledDepartureTime);
    const da = int(s.arrivalDelay) || 0, dd = int(s.departureDelay) || 0;
    const arr = i > 0 ? sa : null, dep = i < n - 1 ? sd : null;
    const actArr = arr != null && s.arrived === "1" ? arr + da : null;
    const actDep = dep != null && s.left === "1" ? dep + dd : null;
    const plat = String(s.platforminfo?.name || s.platform || "").trim();
    const cancelled = s.canceled === "1" || (s.arrivalCanceled === "1" && s.departureCanceled === "1");
    stops.push({ name: nm, arr, dep, actualArr: actArr, actualDep: actDep, platform: plat === "" || plat === "?" ? null : plat, cancelled });
    if (actDep != null || actArr != null) last = [i, nm, actDep != null ? actDep : actArr, actDep != null ? dd : da];
  });
  const first = raw[0], end = raw[n - 1];
  const delay = last ? last[3] : int(first.departureDelay) || 0;
  const out = {
    found: true, number: String(number), date, name: vehicle?.vehicleinfo?.shortname || null,
    origin: stops[0].name, destination: stops[n - 1].name,
    delay: Math.floor(delay / 60 + 0.5), cancelled: stops.every((s) => s.cancelled),
    departed: first.left === "1", arrived: end.arrived === "1",
    last: last ? { station: last[1], at: last[2] } : null, stops,
  };
  const cars = irailCars(comp);
  if (cars) out.cars = cars;
  return out;
}

async function irailGet(path, params) {
  const res = await fetch(`${IRAIL}/${path}/?${new URLSearchParams(params)}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (res.status === 400 || res.status === 404) return null; // no such train that day, or no composition for it
  if (!res.ok) throw new Error(`iRail ${path}: HTTP ${res.status}`);
  return res.json();
}

const brusselsDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" });

// query: { train, date, from }, checked and normalised by the relay.
export async function fetchFeed(env, name, ctx, query) {
  const { train: number, date } = query;
  const now = Date.now();
  asked = asked.filter((t) => now - t < 60 * 1000);
  let out = { found: false };
  if (asked.length < IRAIL_PER_MINUTE) {
    asked.push(now);
    const [y, m, d] = date.split("-");
    const vehicle = await irailGet("vehicle", { id: `BE.NMBS.${number}`, date: `${d}${m}${y.slice(2)}`, format: "json", lang: "en" });
    let comp = null;
    // The composition is today's (iRail takes no date): asked for only for a train of today in Belgium.
    if (vehicle && date === brusselsDay.format(new Date()) && asked.length < IRAIL_PER_MINUTE) {
      asked.push(now);
      comp = await irailGet("composition", { id: number, format: "json" });
    }
    out = vehicle ? irailDetail(vehicle, comp, number, date) : { found: false };
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}
