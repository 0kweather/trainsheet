// China Railway Suburban's cars (scripts/railroads/china.py, "crsuburban":
// the S trains, the suburban and short intercity services of Beijing,
// Shanghai's Jinshan line, Ningbo, Shaoxing and others): the CRH6 family,
// CRRC Qingdao Sifang's regional train built by CRRC Nanjing Puzhen and its
// Guangdong Jiangmen works. Three are drawn: the eight-car CRH6A, the
// eight-car CRH6F with its wide doors, and the four-car CRH6A-A in the
// newer silver and red. 12306's timetable names no unit, so a train is
// drawn as a model that usually runs its kind, labeled as typical.
// Trainsheet's own side views from published dimensions and photographs, at
// the shared scale (js/carart.js), in China Railway's paint, lettered here
// (no logo files). Bodies and parts from czechia.cars.js.

import { C, rect, path, line, lines, poly, truck, slats, underframe } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine } from "./czechia.cars.js?v=dev";
import { pantograph } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// The trains' names are brushed on in a kai (regular script) hand.
const KAI = "'Kaiti SC', STKaiti, KaiTi, 'Noto Serif CJK SC', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', serif";

// ---------- Paint ----------
// From photographs (Wikimedia Commons, fetched November 2026).
// CRH6A and CRH6F, as on Beijing's Sub-Central line: white, the roof pale
// gray; the windows in a black band broken by the white doors, each with
// its own tall window; a blue line under the band that turns up behind the
// cab as a slanted blue bar closing the band's end; the driver's door white
// ahead of it, and ahead of that the cab's side window, a black wedge; a
// black mask over the windshield up to the roof, the headlights in a strip
// under it; the train's name brushed in black on the cab's side and small
// over the first windows (京通号, "Jingtong", on the Beijing units; other
// cities' units carry their own names in the same place); gray skirts.
// CRH6A-A: a pale silver; the same black band and mask; an orange-red line
// under the band that ends at the cab in an arrowhead round the band's
// point, a finer line running on down the nose.
const CR = { white: "#f2f3f2", silver: "#e3e6e8", roof: "#b4b9be", roofSilver: "#a9aeb4", band: "#17181b", glass: "#2a2f37",
  blue: "#1f4fa3", red: "#e0452c", under: "#2a2c30", ink: "#2b2d31", skirt: "#c9cdd1", skirtSilver: "#b9bec4" };

// A plug door, flush with the side and body-colored, with a tall window:
// one leaf on the CRH6A (1.1 m), two on the CRH6F (1.3 m).
const plugDoor = (x, sill, top, w, leaves = 1) => ({ x, w, y0: sill, y1: top, leaves, glassY: 0.5, glassH: 0.36, grabs: false, fill: "rgba(0,0,0,0.03)" });
// The door's outline, as the seam shows on the real side.
const doorSeam = (x, w, y0, y1) => rect(x, y0, w, y1 - y0, "none", 0, 'stroke="rgba(0,0,0,0.4)" stroke-width="0.7" vector-effect="non-scaling-stroke" rx="0.25"');
// The driver's own door, narrow, with a small window.
const crewDoor = (x, sill, top, y) => doorSeam(x, 2.0, sill, top) + rect(x + 0.45, y, 1.1, 1.5, CR.glass, 0.4, 'rx="0.2"');

// "CRH" (China Railway High-speed) with its swept stroke.
const crhMark = (c, x, y, h = 1.0, fill = CR.blue) => mark(c, x, y,
  `<text x="0" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="middle" font-weight="800" letter-spacing="0.02em" font-family="${SANS}" fill="${fill}">CRH</text>` +
  `<path d="M${n(h * 1.33)} ${n(h * 0.34)}Q${n(h * 1.85)} ${n(h * 0.3)} ${n(h * 2.25)} ${n(-h * 0.36)}Q${n(h * 1.77)} ${n(h * 0.02)} ${n(h * 1.33)} ${n(h * 0.34)}Z" fill="${fill}"/>`);
// The train's name, brushed.
const named = (c, x, y, text, h = 1.2) => letters(c, x, y, h, text, CR.ink, { weight: 600, spacing: "0.25em", family: KAI });
// Low on the side: the car's type code and, on the end cars, the unit's
// class.
const small = (c, x, y, text, h = 0.5) => letters(c, x, y, h, text, CR.ink, { weight: 600, spacing: "0.05em", family: SANS });
// The car's number on a plate beside its door.
const carNo = (c, x, y, k) => mark(c, x, y, `<rect x="-0.62" y="-0.62" width="1.24" height="1.24" rx="0.16" fill="${CR.band}"/>`) + letters(c, x, y, 0.85, String(k), "#f4d77a", { weight: 700, family: SANS });

// The skirt over the underfloor equipment, between the trucks, with its
// hatches' seams.
const skirt = (a, b, fill, top = 3.25) => rect(a, 1.5, b - a, top - 1.5, fill, 0.4, 'rx="0.2"') +
  lines(seq(a + 3.2, 3.6, Math.max(0, Math.floor((b - a - 3.4) / 3.6))).map((x) => [x, 1.7, x, top - 0.15]), "rgba(0,0,0,0.2)", 0.4);
// A low roof fairing the length of the car.
const fairing = (a, b, roof, fill) => rect(a, roof - 0.05, b - a, 0.34, fill, 0.4, 'rx="0.17"');
// Windows in a row from a to b, centered.
function rowOf(a, b, y, w, h, pitch, r = 0.3) {
  const k = Math.max(1, Math.floor((b - a - w) / pitch) + 1), x0 = a + (b - a - ((k - 1) * pitch + w)) / 2;
  return [{ xs: seq(x0, pitch, k), y, w, h, r }];
}

// ---------- CRH6 ----------
// The CRH6 of 2012, in service since 2014: an aluminum body 3.3 m wide and
// 3.86 m tall for 1.25 m platforms, 25 kV overhead, 860 mm wheels, trucks
// about 17.5 m apart. The eight-car trains (CRH6A, 200 km/h, and CRH6F,
// 160 km/h) are 199.5 m, four cars motored (Tc-M-M-Tp-T-Mp-M-Tc), the
// pantographs on cars 4 and 6; drawn with end cars of 26.25 m and
// intermediates of 24.5 m. The four-car CRH6A-A (Tc-Mp-Mp-Tc) is drawn
// from the same cars. A short, blunt nose under a deep windshield; unlike
// the long-distance trains, two doors a side on every car, at the quarter
// points, with standing room between: single leaves on the CRH6A, wider
// double leaves on the CRH6F, whose seats are fewer and windows shorter
// rows for it. Every car is second class (ZE).
const H6 = { roof: 12.65, sill: 4.1, band: [7.45, 3.0], line: [6.95, 0.34], top: 10.75, winY: 7.8, winH: 2.3 };
const NOSE_6 = [[1.3, 2.5], [0.5, 3.7], ["q", 0.3, 5.9, 2.6, 7.1], [9.6, 11.3], ["q", 12.4, 12.65, 16.8, 12.65]];
// The two liveries: the body, roof, line and skirt colors, the art on the
// cab, and where the band begins on an end car.
const BLUE = { body: CR.white, roof: CR.roof, line: CR.blue, skirt: CR.skirt, band0: 21.4,
  // The band's end closed by a slanted blue bar rising from the line; the
  // mask; the cab's side window.
  cab: rect(-1, 6.6, 22.4, 4.2, CR.white) +
    path(poly([[19.6, 6.95], [21.4, 6.95], [23.2, 10.45], [21.4, 10.45]]), CR.blue) +
    path("M2.9 8.0Q7.0 7.8 10.6 8.7Q11.8 10.9 15.4 12.65L11.2 12.65Q6.6 10.6 2.9 8.0Z", CR.band) +
    path(poly([[11.8, 8.7], [15.6, 8.45], [15.6, 10.7], [13.9, 10.7]]), CR.glass, 0.4) +
    rect(4.2, 7.25, 3.4, 0.36, "#f7f3e2", 0.4, 'rx="0.18"') };
const SILVER = { body: CR.silver, roof: CR.roofSilver, line: CR.red, skirt: CR.skirtSilver, band0: 19.5,
  // The band drawn to a point behind the cab; the line turning up round
  // it as an arrowhead, and a finer line running down the nose; the mask.
  cab: rect(-1, 6.6, 20.5, 4.2, CR.silver) +
    path("M19.5 7.45L17.6 7.45Q15.6 7.6 14.4 8.6Q15.8 9.9 17.8 10.45L19.5 10.45Z", CR.band) +
    path("M19.5 6.95L16.6 6.95Q14.0 7.3 12.6 8.6Q14.2 10.2 16.6 10.9L17.4 10.6Q15.2 9.8 13.9 8.6Q15.0 7.5 16.8 7.29L19.5 7.29Z", CR.red) +
    path("M16.6 6.95Q9.0 6.5 3.2 4.9Q9.0 6.1 16.6 6.72Z", CR.red) +
    path("M2.9 8.0Q7.0 7.8 10.6 8.7Q11.8 10.9 15.4 12.65L11.2 12.65Q6.6 10.6 2.9 8.0Z", CR.band) +
    rect(4.2, 7.25, 3.4, 0.36, "#f7f3e2", 0.4, 'rx="0.18"') };
// The side: the band from x0 on, the doors' leaves left in the body color.
function h6Paint(lv, x0, doors, cab = false) {
  return (c, g) => bands(g.L, [[0, 20, lv.body], [12.15, 3, lv.roof], [H6.line[0], H6.line[1], lv.line], [0, 1.6, CR.under]]) +
    rect(x0, H6.band[0], g.L + 1 - x0, H6.band[1], CR.band) +
    doors.map(([x, w]) => rect(x, H6.line[0] - 0.05, w, H6.top - H6.line[0] + 0.05, lv.body)).join("") + (cab ? lv.cab : "");
}
// The windows between the doors and the cars' ends: wide panes, one to two
// rows of seats.
const h6Rows = (a, b) => (b - a < 4.6 ? [] : rowOf(a, b, H6.winY, 4.2, H6.winH, 5.2, 0.3));
const h6RoofGear = (L, a) => hvac(a, H6.roof + 0.29, 12, 0.55) + hvac(L - 23, H6.roof + 0.29, 11, 0.55);
// c.lv: the livery; c.wide: the CRH6F's double doors; c.model: the class
// lettered on the end cars; c.name: the train's name, if it carries one.
function h6Cab(c) {
  const L = c.L, k = c.index + 1, lv = c.lv, w = c.wide ? 4.3 : 3.6, leaves = c.wide ? 2 : 1;
  const crew = 17.0, d1 = 37.0, d2 = L - 10.5 - w;
  const doors = [[d1, w], [d2, w]];
  return unit(c, { roof: H6.roof, sill: H6.sill, nose: NOSE_6, rake: [[4.2, 8.6], [10.0, 11.6]], depth: 3.3, cabLen: 17, lampY: 5.3, low: 4.0,
    rows: [...h6Rows(lv.band0 + 2.6, d1 - 1.0), ...h6Rows(d1 + w + 1.0, d2 - 1.0), ...rowOf(d2 + w + 1.2, L - 2.6, H6.winY, 3.0, H6.winH, 5, 0.3)],
    doors: doors.map(([x]) => plugDoor(x, H6.sill, H6.top, w, leaves)), trucks: [L - 68.6, L - 11.2], wheel: 34,
    diaphragm: [4.3, 11.4], paint: h6Paint(lv, lv.band0, doors, true), surround: CR.band,
    extra: (cc, g) => fairing(16.8, g.L - 1.0, H6.roof, lv.roof) + h6RoofGear(g.L, 30) +
      skirt(L - 62.5, L - 17.5, lv.skirt) + boxes(L - 60, L - 20, 3.25, 3, 1.3) +
      crewDoor(crew, H6.sill, H6.top - 0.3, 8.4) + doors.map(([x]) => doorSeam(x, w, H6.sill, H6.top)).join("") +
      // The name on the cab's side and small over the first windows; "CRH"
      // and the unit's class under the line; the car's kind and number.
      (c.name ? named(cc, 10.6, 6.0, c.name, 1.15) + named(cc, lv.band0 + 8.5, 11.5, c.name, 0.8) : "") +
      crhMark(cc, lv.band0 + 4.5, 5.6, 0.85, lv.line) + small(cc, lv.band0 + 12.5, 5.5, c.model, 0.56) +
      small(cc, d2 - 9, 5.5, "ZE") + carNo(cc, d2 - 1.5, 5.9, k) });
}
function h6Mid(c) {
  const L = c.L, k = c.index + 1, lv = c.lv, w = c.wide ? 4.3 : 3.6, leaves = c.wide ? 2 : 1;
  const d1 = 13.5, d2 = L - 13.5 - w;
  const doors = [[d1, w], [d2, w]];
  // The pantographs: cars 4 and 6 of eight (car 4's drawn raised), cars 2
  // and 3 of four (car 2's raised).
  const pan = c.count <= 4 ? k === 2 || k === 3 : k === 4 || k === 6, up = k === (c.count <= 4 ? 2 : 4);
  return unit(c, { roof: H6.roof, sill: H6.sill,
    rows: [...rowOf(2.6, d1 - 1.2, H6.winY, 3.0, H6.winH, 5, 0.3), ...h6Rows(d1 + w + 1.0, d2 - 1.0), ...rowOf(d2 + w + 1.2, L - 2.6, H6.winY, 3.0, H6.winH, 5, 0.3)],
    doors: doors.map(([x]) => plugDoor(x, H6.sill, H6.top, w, leaves)), trucks: [11.5, L - 11.5], wheel: 34,
    diaphragm: [4.3, 11.4], paint: h6Paint(lv, -1, doors),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, H6.roof, lv.roof) +
      (pan ? pantograph(g.L * 0.3, H6.roof + 0.29, { up, facing: -1 }) + hvLine(g.L * 0.3 + 3.0, g.L * 0.3 + 10.5, H6.roof + 0.29) + hvac(g.L - 27, H6.roof + 0.29, 12, 0.55)
        : h6RoofGear(g.L, 10)) +
      skirt(18, L - 18, lv.skirt) + boxes(20, L - 20, 3.25, 4, 1.3) +
      doors.map(([x]) => doorSeam(x, w, H6.sill, H6.top)).join("") +
      small(cc, L * 0.5, 5.5, "ZE") + carNo(cc, d2 - 1.5, 5.9, k) });
}

// ---------- Tables ----------

// Every car is second class, so each train has two types: its end car and
// its intermediate, the pantograph cars drawn by their place in the train.
export const TYPES = {
  cr6aCab: { name: "CRH6A end car", kind: "emu" },
  cr6aMid: { name: "CRH6A car", kind: "emu", pan: true },
  cr6fCab: { name: "CRH6F end car", kind: "emu" },
  cr6fMid: { name: "CRH6F car", kind: "emu", pan: true },
  cr6aaCab: { name: "CRH6A-A end car", kind: "emu" },
  cr6aaMid: { name: "CRH6A-A car", kind: "emu", pan: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
const A = { lv: BLUE, wide: false, model: "CRH6A", name: "京通号" };
const F = { lv: BLUE, wide: true, model: "CRH6F", name: "京通号" };
const AA = { lv: SILVER, wide: false, model: "CRH6A-A", name: "" };
// Lengths in feet: end cars 26.25 m, intermediates 24.5 m.
export const MODELS = {
  cr6aCab: M((c) => h6Cab({ ...c, ...A }), 86.1, true),
  cr6aMid: M((c) => h6Mid({ ...c, ...A }), 80.4, false, byIndex),
  cr6fCab: M((c) => h6Cab({ ...c, ...F }), 86.1, true),
  cr6fMid: M((c) => h6Mid({ ...c, ...F }), 80.4, false, byIndex),
  cr6aaCab: M((c) => h6Cab({ ...c, ...AA }), 86.1, true),
  cr6aaMid: M((c) => h6Mid({ ...c, ...AA }), 80.4, false, byIndex),
};

// 12306 names no unit, so no units are listed by number.
export const FLEETS = {
  crsuburban: [],
};

const set = (label, ...units) => ({ label, units });
const CRH6A = set("CRH6A: eight cars, all second class", ["cr6aCab", 1], ["cr6aMid", 6], ["cr6aCab", 1]);
const CRH6F = set("CRH6F: eight cars, all second class, with wide doors", ["cr6fCab", 1], ["cr6fMid", 6], ["cr6fCab", 1]);
const CRH6AA = set("CRH6A-A: four cars, all second class", ["cr6aaCab", 1], ["cr6aaMid", 2], ["cr6aaCab", 1]);
const BY_MODEL = { cr6aCab: CRH6A, cr6aMid: CRH6A, cr6fCab: CRH6F, cr6fMid: CRH6F, cr6aaCab: CRH6AA, cr6aaMid: CRH6AA };

// By the reported unit; else by train number. China Railway publishes no
// rosters by train: the S trains are worked by CRH6As and CRH6Fs of eight
// and four cars, with other stock not drawn here on some lines (diesel
// NDJ3 sets on Beijing's S2, CRH2As among the Jinshan line's trains). A
// train's number tells none of that, so as a rough guide only the three
// are shared out by the number's hundreds; the label says "usually" and
// any of them may appear.
export const TYPICAL = {
  crsuburban: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const k = Number(String(t.number || "").replace(/\D/g, "")) || 0;
    return [CRH6A, CRH6F, CRH6AA][Math.floor(k / 100) % 3];
  },
};

const CRH6 = "https://en.wikipedia.org/wiki/China_Railway_CRH6";
const h6 = { type: "Regional electric multiple unit", builder: "CRRC Qingdao Sifang (design), CRRC Nanjing Puzhen and CRRC Guangdong Jiangmen", built: "Since 2012", source: CRH6 };
const a = { ...h6, model: "CRH6A", fleet: "Eight-car units", topSpeedMph: 124 };
const f = { ...h6, model: "CRH6F", fleet: "Eight-car units", topSpeedMph: 99 };
const aa = { ...h6, model: "CRH6A-A", fleet: "Four-car units", topSpeedMph: 124, seats: 252 };
export const FACTS = {
  cr6aCab: { ...a, lengthFt: 655,
    about: "An end car; both end cars trail. The CRH6A is China Railway's regional express train, in service since 2014: 200 km/h, all second class in reversible seats 2+2, with two doors a side on every car and room to stand between them. Unlike other CRH trains, most CRH6s carry a name of their own rather than Hexie; Beijing's Sub-Central line units are 京通号 (Jingtong)." },
  cr6aMid: { ...a, about: "Second class, seated 2+2, 62 to 64 seats a car. Four of the eight cars are motored (cars 2, 3, 6 and 7); the pantographs ride on cars 4 and 6, and there are toilets in cars 1, 3, 5 and 7." },
  cr6fCab: { ...f, lengthFt: 655,
    about: "An end car; both end cars trail. The CRH6F is the CRH6A's commuter sister: 160 km/h, wider doors, fixed seats and more standing room, about 1,500 passengers to a train at its standard load." },
  cr6fMid: { ...f, about: "Second class, with wide doors and standing room. Four of the eight cars are motored; there are toilets in cars 3 and 6." },
  cr6aaCab: { ...aa, lengthFt: 333,
    about: "An end car, 50 seats. The CRH6A-A is the four-car CRH6A, for lighter lines, seating 252; shown in the newer pale silver with an orange-red line." },
  cr6aaMid: { ...aa, about: "A motored car carrying a pantograph (cars 2 and 3), seating 78 or 74." },
};
