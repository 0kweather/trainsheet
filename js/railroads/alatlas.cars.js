// Al Atlas's cars (scripts/railroads/morocco.py): ONCF's long-distance
// trains on the classic lines (Marrakech, Casablanca, Rabat, Fez, Oujda,
// Nador, Tangier), hauled by an Alstom Prima II electric locomotive (ONCF's
// E 1400 class) with Corail-type coaches; the night trains add couchette
// cars. The timetable names no locomotive or coach, so a train is drawn as
// the usual make-up, labeled as typical. Trainsheet's own side views from
// published dimensions, at the shared scale (js/carart.js), in ONCF's white,
// gray and orange, lettered here (no logo files). Bodies and parts from
// czechia.cars.js.
//
// The paint is drawn from memory of the fleet, not checked against
// photographs: the white body, the gray window band and roof and ONCF's
// orange are sure; the orange's exact course over the locomotive's cabs,
// the doors' color and where the lettering sits are Trainsheet's reading.
// So are the number and order of the coaches in a train.

import { C, rect, path, underframe } from "../carart.js?v=dev";
import { unit, euroLoco, letters, hvac, buffers } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");

// ---------- Paint ----------
// ONCF's long-distance stock today: white sides under a gray roof, the
// windows in a dark gray band, a line of ONCF's orange under it, orange
// doors, a gray skirt. The locomotive wears the same white, its cabs
// orange, the orange sweeping down and back from the roof to a line along
// a charcoal lower side. "ONCF" in charcoal on the white; the class figure
// by each coach door.
const AT = { white: "#f2f2ee", roof: "#aeb3b9", band: "#3d4148", skirt: "#8b9097", orange: "#f87820", deep: "#d9620f", ink: "#34373c", coal: "#454950",
  door: "#f87820", night: "#27345c" };
const AT_FONT = "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const AR_FONT = "'Geeza Pro', 'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, Arial, sans-serif";
const oncf = (c, x, y, h, fill = AT.ink) => letters(c, x, y, h, "ONCF", fill, { weight: 800, spacing: "0.05em", family: AT_FONT });
// "Al Atlas" and its Arabic, الأطلس, small in orange on a coach's side.
const atlas = (c, x, y, h = 0.8) => letters(c, x - 2.6, y, h, "Al Atlas", AT.orange, { weight: 700, style: "italic", family: AT_FONT }) +
  letters(c, x + 2.9, y, h, "الأطلس", AT.orange, { weight: 700, family: AR_FONT });

// ---------- Alstom Prima II (ONCF E 1400) ----------
// Alstom's Prima II, built at Belfort for ONCF (E 1401-1420, delivered
// 2009-2011): Bo'Bo', 19.1 m over the buffers, about 90 t, 1,150 mm wheels,
// for 3 kV dc (and 25 kV); a cab at each end with a tall, nearly upright
// front, rounded at the brow, and a deep windshield. Truck centers drawn at
// about 10.4 m.
const NOSE_PRIMA = [[1.05, 4.1], [0.8, 6.7], ["q", 0.85, 8.3, 1.8, 9.2], [2.9, 12.2], ["q", 3.4, 12.9, 4.7, 12.9]];
function primaPaint(c, L) {
  let s = rect(0, 0, L, 20, AT.white) + bands(L, [[11.75, 3, AT.roof], [0, 5.6, AT.coal], [5.6, 0.32, AT.orange], [0, 4.45, "#2c2f34"]]);
  // The cab: orange from the roof down, swept back to the line along the
  // lower side; a deeper orange under the windshield.
  s += path("M-1 4.45L-1 13L8.6 13Q10.4 8.6 15.2 5.92L15.2 5.6L7.4 5.6Q6.6 4.9 5.6 4.45Z", AT.orange) +
    path("M-1 4.45L-1 8.1Q1.6 8.2 2.9 7.0Q4.2 5.7 6.4 5.6Q5.9 4.9 5.2 4.45Z", AT.deep);
  return s;
}
const primaOver = (c, L) => oncf(c, L / 2, 8.55, 1.7) +
  letters(c, 13.4, 4.95, 0.6, "E 1400", "#ffffff", { weight: 600, spacing: "0.04em", family: AT_FONT }) +
  letters(c, L - 13.4, 4.95, 0.6, "E 1400", "#ffffff", { weight: 600, spacing: "0.04em", family: AT_FONT });
const prima = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_PRIMA, rake: [[1.8, 9.2], [2.9, 12.2]], centers: 34.1, door: 5.9, wheel: 45,
  surround: "#1d2026", paint: primaPaint, over: primaOver, grilles: [[-15.0, 8.6, 9.2, 11.3], [6.4, 8.6, 9.2, 11.3]] });

// ---------- Corail-type coaches ----------
// ONCF's long-distance coaches follow SNCF's Corail design (the first
// built in the 1980s, with cars of the same family since): 26.4 m over the
// buffers, 4.05 m tall, on two Y32 trucks (2.56 m wheelbase, 920 mm
// wheels) 18.37 m apart; air-conditioned, with fixed windows. Compartment
// cars have a door at each end of the side; open cars have theirs set in
// over the trucks, with a short bay beyond each.
const CO = { roof: 13.3, sill: 3.9, L: 86.6, trucks: [13.17, 73.43] };
const coDoor = (x) => ({ x, w: 2.6, y0: CO.sill + 0.15, y1: 11.2, leaves: 1, glassY: 0.55, glassH: 0.3, grabs: true, fill: AT.door });
// The side: white, the windows' gray band from a to b, the orange line
// under it, gray roof and skirt.
const coPaint = (a, b, band = AT.band) => (c, g) => bands(g.L, [[0, 20, AT.white], [12.3, 3, AT.roof], [0, 4.4, AT.skirt], [4.4, 0.12, "#6f747b"]]) +
  rect(a, 6.95, b - a, 3.7, band, 0, 'rx="0.45"') + rect(-1, 6.2, g.L + 2, 0.38, AT.orange);
// Roof and underfloor: the air-conditioning unit and vents; the battery
// and brake gear between the trucks, the water tank; buffers and screw
// couplings at the ends.
const coGear = (L) => hvac(L / 2 - 7, CO.roof, 14, 0.7) +
  [11, 23, L - 23, L - 11].map((x) => path(`M${x - 1.1} ${CO.roof - 0.05}Q${x} ${CO.roof + 0.7} ${x + 1.1} ${CO.roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
  underframe(24, L - 24, CO.sill, { depth: 1.3, boxes: 3, tanks: false }) + rect(L / 2 - 3.5, CO.sill - 2.0, 7, 0.75, C.steelDark, 0.4, 'rx="0.37"') +
  buffers(0, -1, { sill: CO.sill }) + buffers(L, 1, { sill: CO.sill });
// The class figure beside a door, on the white over the orange line.
const cls = (c, x, k) => letters(c, x, 11.45, 1.1, k, AT.ink, { weight: 700, family: AT_FONT });
// o: rows, doors (x of each), band ([a, b]), figure (the class, lettered by
// the doors; null for none), over(c, L) for more lettering.
function corail(c, o) {
  const L = c.L;
  return unit(c, { roof: CO.roof, sill: CO.sill, rows: o.rows, doors: o.doors.map(coDoor), trucks: CO.trucks, wheel: 36, diaphragm: [4.25, 11.8],
    paint: coPaint(o.band[0], o.band[1], o.bandFill),
    extra: (cc, g) => coGear(g.L) + oncf(cc, L * 0.3, 5.3, 0.95) + atlas(cc, L * 0.66, 5.3) +
      (o.figure ? o.doors.map((x) => cls(cc, x < L / 2 ? x + 4.1 : x - 1.5, o.figure)).join("") : "") + (o.over ? o.over(cc, g.L) : "") });
}
// First class: nine six-seat compartments off a side corridor, a wide
// window to each; a door and a lavatory at each end.
const first = (c) => corail(c, { doors: [2.0, c.L - 4.6], band: [11.6, c.L - 11.6], figure: "1",
  rows: [{ xs: seq(12.5, 7.0, 9), y: 7.3, w: 5.6, h: 3.0, r: 0.45 }, { xs: [6.6, c.L - 8.2], y: 8.2, w: 1.6, h: 1.7, r: 0.3 }] });
// Second class: an open saloon, eleven windows between the doors and one
// in the short bay beyond each.
const second = (c) => corail(c, { doors: [10.9, c.L - 13.5], band: [3.6, c.L - 3.6], figure: "2",
  rows: [{ xs: seq(15.85, 5.1, 11), y: 7.3, w: 3.9, h: 3.0, r: 0.45 }, { xs: [5.2, c.L - 8.6], y: 7.3, w: 3.4, h: 3.0, r: 0.45 }] });
// Couchettes: ten compartments of four berths, narrower windows; the band
// in night blue, a crescent and "Couchettes" over it.
const moon = (x, y, r = 0.55) => path(`M${x} ${y + r}A${r} ${r} 0 1 1 ${x} ${y - r}A${r * 0.72} ${r * 0.72} 0 1 0 ${x} ${y + r}Z`, AT.orange);
const couchette = (c) => corail(c, { doors: [2.0, c.L - 4.6], band: [11.6, c.L - 11.6], bandFill: AT.night, figure: null,
  rows: [{ xs: seq(12.75, 6.3, 10), y: 7.4, w: 4.4, h: 2.8, r: 0.45 }, { xs: [6.6, c.L - 8.2], y: 8.2, w: 1.6, h: 1.7, r: 0.3 }],
  over: (cc, L) => moon(L / 2 - 5.6, 11.45) + letters(cc, L / 2 + 0.6, 11.45, 0.85, "Couchettes", AT.night, { weight: 700, family: AT_FONT }) +
"" });

// ---------- Tables ----------

// First class carries Trainsheet's gold band; the couchette cars its
// sleeper mark.
export const TYPES = {
  maE1400: { name: "Alstom Prima II electric locomotive (E 1400)", kind: "electric", pan: true },
  maFirst: { name: "First class compartment coach", kind: "coach", amenities: ["first"] },
  maSecond: { name: "Second class coach", kind: "coach" },
  maCouchette: { name: "Couchette car", kind: "coach", amenities: ["sleepers"] },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet over the buffers: 19.11 m and 26.4 m.
export const MODELS = {
  maE1400: M(prima, 62.7),
  maFirst: M(first, CO.L),
  maSecond: M(second, CO.L),
  maCouchette: M(couchette, CO.L),
};

// Locomotives by number: E 1401-1420. ONCF's feed names none; these are
// for the fleet pages.
export const FLEETS = {
  alatlas: [[1401, 1420, "maE1400"]],
};

const set = (label, ...units) => ({ label, units });
const DAY = set("Typical Al Atlas train: an E 1400 locomotive, two first class coaches and six second class",
  ["maE1400", 1], ["maFirst", 2], ["maSecond", 6]);
const NIGHT = set("Typical Al Atlas night train: an E 1400 locomotive, two couchette cars, a first class coach and five second class",
  ["maE1400", 1], ["maCouchette", 2], ["maFirst", 1], ["maSecond", 5]);

// ONCF publishes no make-up, so every train is drawn as the usual day
// train; one that sets out late in the evening on a run long enough to
// last the night (Marrakech-Tangier, Casablanca-Oujda or Nador,
// Tangier-Oujda) is drawn with couchette cars. The hour is read from the
// first stop's time (local, Morocco is UTC+1 all year); with no time to
// read, the day train stands.
const FAR = /Marrakech|Tanger|Tangier|Oujda|Nador/i;
function startHour(t) {
  const s = (t.stops || [])[0] || {};
  const v = s.dep ?? s.scheduled ?? s.time ?? s.arr;
  if (v == null) return null;
  if (typeof v === "number") {
    if (v > 1e9) return (new Date(v > 1e11 ? v : v * 1000).getUTCHours() + 1) % 24;   // an epoch
    return Math.floor((v > 1440 ? v / 3600 : v / 60) % 24);                            // seconds or minutes after midnight
  }
  const str = String(v);
  if (/T.*(Z|[+-]\d\d:?\d\d)$/.test(str)) { const d = new Date(str); return Number.isNaN(+d) ? null : (d.getUTCHours() + 1) % 24; }
  const m = /(\d{1,2}):\d{2}/.exec(str);
  return m ? Number(m[1]) % 24 : null;
}
export const TYPICAL = {
  alatlas: (t) => {
    const h = startHour(t);
    const far = FAR.test(t.origin || "") && FAR.test(t.destination || "") || (/Casa/i.test(`${t.origin} ${t.destination}`) && /Oujda|Nador/i.test(`${t.origin} ${t.destination}`));
    return far && h != null && (h >= 20 || h < 3) ? NIGHT : DAY;
  },
};

const ONCF = "https://en.wikipedia.org/wiki/ONCF";
const PRIMA = "https://en.wikipedia.org/wiki/Alstom_Prima_II";
const CORAIL = "https://fr.wikipedia.org/wiki/Voiture_Corail";
const coach = { type: "Locomotive-hauled passenger coach", lengthFt: 86.6, topSpeedMph: 99 };
export const FACTS = {
  maE1400: { model: "Alstom Prima II (ONCF E 1400)", type: "Electric locomotive", builder: "Alstom (Belfort)", built: "2009–2011", fleet: "20 locomotives",
    lengthFt: 62.7, source: PRIMA,
    about: "ONCF's E 1400 class, the first Prima II locomotives Alstom built: four axles, about 90 tonnes, drawing 3 kV dc from the wire on Morocco's classic lines. They head the Al Atlas trains at up to 160 km/h." },
  maFirst: { ...coach, model: "Corail-type first class coach", source: CORAIL,
    about: "First class on an Al Atlas train: air-conditioned compartments of six seats off a side corridor, in a coach of the French Corail family that ONCF has run since the 1980s." },
  maSecond: { ...coach, model: "Corail-type second class coach", source: CORAIL,
    about: "Second class, air-conditioned, the greater part of every Al Atlas train. Seats on these trains are reserved with the ticket." },
  maCouchette: { ...coach, model: "Corail-type couchette car", source: ONCF,
    about: "On the night trains: compartments of four berths, booked as a whole or by the berth, with seated coaches behind. ONCF's night trains run the length of the country, between Marrakech and Tangier and from Casablanca and Tangier to Oujda and Nador." },
};
