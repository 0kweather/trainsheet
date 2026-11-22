// Chiltern Railways' cars (scripts/railroads/gb.py, "chiltern"): the Class
// 168 Clubman, the diesel train of the main line from London Marylebone to
// Birmingham and Oxford, and the Class 165 Turbo of the stopping trains to
// Aylesbury, High Wycombe and Banbury. The timetable names no unit, so a
// train is drawn as the model that usually runs it, labeled as typical.
// Trainsheet's own side views from published dimensions, at the shared
// scale (js/carart.js), in Chiltern's white and blue, lettered here (no
// logo files). The toolkit is avanti.cars.js's; the Turbostar and Turbo
// bodies are redrawn here in Chiltern's paint (emr.cars.js and gwr.cars.js
// do not export theirs).

import { rect, path, lines } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Chiltern's multiple units: white sides, the windows in a deep blue band
// that runs the length of the car and into the cab's side; a pale gray
// roof, a charcoal skirt; blue doors; "Chiltern Railways" in blue under
// the windows; a yellow panel on every cab front. (The railroad's blue on
// the map is #00bfff; the trains' is the darker one.) Drawn from memory of
// the trains, not checked against photographs.
const CH = { white: "#f3f5f6", blue: "#1b3f8f", deep: "#15306e", sky: "#00a7e1", roof: "#c3c8cd", skirt: "#2a2e34", trim: "#9aa1a8", door: "#2452b0" };
// Chiltern's name, two words, the first heavy; h ft tall, centered on x.
const chiltern = (c, x, y, h) => letters(c, x, y, h, 'Chiltern<tspan font-weight="400" dx="0.28em">Railways</tspan>', CH.blue, { weight: 700 });
// A class number, small, by the end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text || "", CH.blue, { weight: 600, spacing: "0.06em" });
// The side: white, the blue window band with a fine light-blue line under
// it; on a cab car the band's mask round the windshield and the yellow end.
const sidePaint = (S, cab, yellowX, mask) => (c, g) => bands(g.L, [[0, 20, CH.white], [S.roof - 0.6, 3, CH.roof], [6.6, 3.55, CH.blue], [6.42, 0.18, CH.sky], [0, S.sill, CH.skirt]]) +
  (cab ? path(mask, CH.deep) + yellowEnd(yellowX, 3.2, 8.0) : "");
const door2 = (x, sill) => ({ x, w: 4.4, y0: sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: CH.door });
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b, w, pitch) => [{ xs: [...spread(a, d1 - 0.8, w, pitch), ...spread(d1 + 5.2, d2 - 0.8, w, pitch), ...spread(d2 + 5.2, b, w, pitch)], y: 6.95, w, h: 2.85, r: 0.4 }];
// The engine and its transmission under the floor.
const raft = (a, b) => rect(a, 1.5, b - a, 2.3, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- Class 168 Clubman ----------
// Adtranz's (later Bombardier's) 100 mph diesel train for Chiltern, built
// at Derby in 1998-2004, the first of the Turbostar family: welded
// aluminium cars with steel ends, on two trucks each; driving cars 23.62 m
// (the first five units', 168/0, 24.10 m), intermediate cars 23.61 m;
// 2.69 m wide, 3.77 m tall; two double-leaf sliding plug doors a side, a
// third of the way in from each end; an MTU 6R 183 of 315 kW under every
// car. The 168/0s have their own cab, upright and flat like the Turbo's;
// the rest (168/1, 168/2, and the two-car 168/3s, once Class 170/3) the
// Turbostar's raked one. No gangway through either. (Wikipedia, "British
// Rail Class 168".)
const CL = { roof: 12.37, sill: 3.8, cab: ft(23.62), cab0: ft(24.1), mid: ft(23.61) };
const NOSE_168 = [[0.5, 3.2], [0.35, 6.4], ["q", 0.4, 7.4, 1.1, 8.2], [3.6, 11.5], ["q", 4.2, 12.37, 6.0, 12.37]];
const NOSE_1680 = [[0.5, 3.2], [0.35, 6.6], ["q", 0.4, 7.6, 1.0, 8.4], [2.7, 11.6], ["q", 3.1, 12.37, 4.8, 12.37]];
// c.early: a 168/0, with the first cab.
function clubCab(c) {
  const L = c.L, e = !!c.early, x0 = e ? 1.6 : 0, d1 = 19.6 + x0, d2 = L - 23.0;
  return unit(c, { roof: CL.roof, sill: CL.sill, nose: e ? NOSE_1680 : NOSE_168, rake: e ? [[1.1, 8.6], [2.6, 11.3]] : [[1.3, 8.3], [3.4, 11.2]], depth: e ? 2.4 : 2.6,
    cabLen: 8, lampY: 5.0, low: 4.1,
    rows: bays(9.4 + x0, d1, d2, L - 1.6, 4.6, 5.5), doors: [door2(d1, CL.sill), door2(d2, CL.sill)], trucks: [10.4 + x0, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(CL, true, 3.0, e ? "M0.9 8.4L2.7 11.6L5.8 11.6L5.8 8.4Z" : "M1.0 8.0L3.6 11.5L7.4 11.5L7.4 8.0Z"), surround: CH.deep,
    extra: (cc, g) => fairing(e ? 4.8 : 6.0, g.L - 1.0, CL.roof, CH.trim) + hvac(30, CL.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, CL.roof + 0.27) +
      raft(17 + x0, 32 + x0) + boxes(34 + x0, g.L - 14, CL.sill, 2, 1.3) +
      // The cab's side window and door.
      rect(4.6, 8.1, 1.9, 2.3, "#1d2026", 0.4) + rect(7.0, 4.0, 1.9, 6.9, "rgba(0,0,0,0.12)", 0.5) +
      chiltern(cc, (d1 + 4.4 + d2) / 2, 5.0, 1.25) + classNo(cc, g.L - 9, 4.45, "168") });
}
function clubMid(c) {
  const L = c.L, d1 = 21.6, d2 = L - 26.0;
  return unit(c, { roof: CL.roof, sill: CL.sill,
    rows: bays(1.6, d1, d2, L - 1.6, 4.6, 5.5), doors: [door2(d1, CL.sill), door2(d2, CL.sill)], trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(CL, false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, CL.roof, CH.trim) + hvac(g.L / 2 - 6, CL.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, CL.roof + 0.27) +
      raft(15, 30) + boxes(32, g.L - 14, CL.sill, 2, 1.3) + chiltern(cc, g.L / 2, 5.0, 1.25) });
}

// ---------- Class 165 Turbo ----------
// British Rail's Networker Turbo, the 165/0s built for the Chiltern lines
// (BREL, York, 1990-1992): welded aluminium cars, driving cars 23.50 m and
// the middle car 23.25 m, 2.81 m wide, 3.79 m tall; a flat cab with no
// gangway; two double-leaf sliding plug doors a side; a Perkins 2006 TW-H
// diesel of 350 hp under every car; 75 mph. Two or three cars. (Wikipedia,
// "British Rail Class 165".) The same body as GWR's (gwr.cars.js), here in
// Chiltern's paint.
const TB = { roof: 12.43, sill: 3.75, cab: ft(23.5), mid: ft(23.25) };
const NOSE_165 = [[0.5, 3.2], [0.35, 6.6], ["q", 0.4, 7.6, 1.0, 8.4], [2.6, 11.7], ["q", 3.0, 12.43, 4.6, 12.43]];
function turboCab(c) {
  const L = c.L, d1 = 17.6, d2 = L - 21.6;
  return unit(c, { roof: TB.roof, sill: TB.sill, nose: NOSE_165, rake: [[1.1, 8.6], [2.5, 11.4]], depth: 2.4, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: bays(9.0, d1, d2, L - 1.6, 4.6, 5.4), doors: [door2(d1, TB.sill), door2(d2, TB.sill)], trucks: [10.2, L - 9.6], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(TB, true, 3.0, "M0.9 8.4L2.6 11.7L5.6 11.7L5.6 8.4Z"), surround: CH.deep,
    extra: (cc, g) => fairing(4.6, g.L - 1.0, TB.roof, CH.trim) + hvac(g.L / 2 - 6, TB.roof + 0.27, 12, 0.5) + exhaust(g.L - 7, TB.roof + 0.27) +
      raft(24, 39) + boxes(41, g.L - 14, TB.sill, 2, 1.3) +
      // The cab's side window and door.
      rect(4.4, 8.4, 1.9, 2.2, "#1d2026", 0.4) + rect(6.8, 4.0, 1.9, 6.9, "rgba(0,0,0,0.12)", 0.5) +
      chiltern(cc, (d1 + 4.4 + d2) / 2, 5.0, 1.25) + classNo(cc, g.L - 8, 4.45, "165") });
}
function turboMid(c) {
  const L = c.L, d1 = 17.0, d2 = L - 21.4;
  return unit(c, { roof: TB.roof, sill: TB.sill,
    rows: bays(1.6, d1, d2, L - 1.6, 4.6, 5.4), doors: [door2(d1, TB.sill), door2(d2, TB.sill)], trucks: [9.6, L - 9.6], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(TB, false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, TB.roof, CH.trim) + hvac(g.L / 2 - 6, TB.roof + 0.27, 12, 0.5) + exhaust(g.L - 7, TB.roof + 0.27) +
      raft(22, 37) + boxes(39, g.L - 14, TB.sill, 2, 1.3) + chiltern(cc, (d1 + 4.4 + d2) / 2, 5.0, 1.25) });
}

// ---------- Tables ----------

// Chiltern's trains are Standard class throughout. Diesel units are kind
// "emu" (a cab at each end of the set) with no pantograph. Each length of
// set has its own driving-car type, so a reported unit finds its formation.
export const TYPES = {
  ch168Cab: { name: "Class 168 Clubman end car", kind: "emu" },
  ch168Mid: { name: "Class 168 Clubman car", kind: "emu" },
  ch1680Cab: { name: "Class 168/0 Clubman end car", kind: "emu" },
  ch1683Cab: { name: "Class 168/3 Clubman end car", kind: "emu" },
  ch165Cab: { name: "Class 165 Turbo end car", kind: "emu" },
  ch1653Cab: { name: "Class 165 Turbo end car (three-car unit)", kind: "emu" },
  ch165Mid: { name: "Class 165 Turbo car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ch168Cab: M(clubCab, CL.cab, true),
  ch168Mid: M(clubMid, CL.mid),
  ch1680Cab: M((c) => clubCab({ ...c, early: true }), CL.cab0, true),
  ch1683Cab: M(clubCab, CL.cab, true),
  ch165Cab: M(turboCab, TB.cab, true),
  ch1653Cab: M(turboCab, TB.cab, true),
  ch165Mid: M(turboMid, TB.mid),
};

// Units by number: 168 001-005 (168/0, four cars as built; some now run as
// three), 168 106-113 and 168 214-219 (three or four cars, drawn as three),
// 168 321-329 (two cars); 165 001-028 (two cars) and 165 029-039 (three).
// The split of the 165/0s between two and three cars is from memory. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  chiltern: [[168001, 168005, "ch1680Cab"], [168106, 168113, "ch168Cab"], [168214, 168219, "ch168Cab"], [168321, 168329, "ch1683Cab"],
    [165001, 165028, "ch165Cab"], [165029, 165039, "ch1653Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C168 = set("Class 168 Clubman: three cars, diesel; often two units coupled", ["ch168Cab", 1], ["ch168Mid", 1], ["ch168Cab", 1]);
const C1680 = set("Class 168/0 Clubman: four cars, diesel", ["ch1680Cab", 1], ["ch168Mid", 2], ["ch1680Cab", 1]);
const C1683 = set("Class 168/3 Clubman: two cars, diesel", ["ch1683Cab", 2]);
const T165 = set("Class 165 Turbo: two cars, diesel", ["ch165Cab", 2]);
const T1653 = set("Class 165 Turbo: three cars, diesel", ["ch1653Cab", 1], ["ch165Mid", 1], ["ch1653Cab", 1]);
const BY_MODEL = { ch168Cab: C168, ch168Mid: C168, ch1680Cab: C1680, ch1683Cab: C1683, ch165Cab: T165, ch1653Cab: T1653, ch165Mid: T1653 };

// By the reported unit; else the three-car Clubman, the usual train to
// Birmingham and Oxford. The Turbos work the Aylesbury lines and the
// stopping trains; Chiltern's locomotive-hauled trains (a Class 68 with
// Mark 3 coaches and a driving trailer, giving way to the Mark 5A sets)
// are not drawn. The timetable does not say which train is which, so the
// label says "usually".
export const TYPICAL = {
  chiltern: (t, reported) => BY_MODEL[reported] || C168,
};

const W168 = "https://en.wikipedia.org/wiki/British_Rail_Class_168";
const W165 = "https://en.wikipedia.org/wiki/British_Rail_Class_165";
const c168 = { model: "Class 168 Clubman", type: "Diesel multiple unit", builder: "Adtranz, later Bombardier Transportation (Derby)", built: "1998–2004",
  fleet: "28 units of two, three and four cars", topSpeedMph: 100, source: W168 };
const t165 = { model: "Class 165 Turbo", type: "Diesel multiple unit", builder: "BREL (York)", built: "1990–1992",
  fleet: "39 units of two and three cars", topSpeedMph: 75, source: W165 };
export const FACTS = {
  ch168Cab: { ...c168, lengthFt: 232.4, powerHp: 1267, seats: 204,
    about: "A driving car of the Clubman, the 100 mph diesel train built for Chiltern's main line between London Marylebone and Birmingham, with an MTU engine under every car. These units have the raked cab of the Turbostar family, which the Clubman began." },
  ch168Mid: { ...c168,
    about: "A middle car of the Clubman, a motor car like the rest, Standard class like the whole train. Units run as three or four cars, and often in pairs." },
  ch1680Cab: { ...c168, lengthFt: 313.1, powerHp: 1690, seats: 272,
    about: "A driving car of the first five Clubmans (168/0) of 1998, the first new trains ordered for Britain's privatised railway. Their cab is upright, like the Turbo's; the later units took the Turbostar's." },
  ch1683Cab: { ...c168, lengthFt: 155, powerHp: 845,
    about: "The two-car Clubman: nine units built as Class 170/3 Turbostars for other operators and converted to work with Chiltern's own." },
  ch165Cab: { ...t165, lengthFt: 154.2, powerHp: 700, seats: 186,
    about: "The two-car Turbo: British Rail's Networker diesel, built for the Chiltern lines' modernisation of 1991, an engine under each car. They work the Aylesbury lines and the stopping trains out of Marylebone." },
  ch1653Cab: { ...t165, lengthFt: 230.5, powerHp: 1050, seats: 288,
    about: "A driving car of the three-car Turbo. At 2.81 m the Turbos are wider than most British trains, and are kept to the lines cleared for them." },
  ch165Mid: { ...t165,
    about: "The Turbo's middle car, a motor car like the other two." },
};
