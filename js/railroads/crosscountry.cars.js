// CrossCountry's cars (scripts/railroads/gb.py, "crosscountry"): the
// diesel trains of Britain's cross-country network, the Class 220 Voyager
// and Class 221 Super Voyager (Bombardier, four and five cars) on the long
// routes through Birmingham, and the Class 170 Turbostar (two and three
// cars) on the Cardiff-Nottingham and Birmingham-Stansted lines. The
// timetable names no unit, so a train is drawn as the model that usually
// runs it, labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in CrossCountry's silver,
// maroon and pink, lettered here (no logo files). The toolkit from
// avanti.cars.js.

import { rect, path, lines, poly } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters, hvac, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// CrossCountry since November 2007 (Arriva's franchise; its maroon is
// #660f21), drawn from memory of the trains, not checked against
// photographs: silver sides below the windows; the windows in a deep maroon
// band that runs up to a dark gray roof; a charcoal skirt; doors in bright
// pink. On each driving car the maroon comes down over the whole cab end in
// a long curve, round a black windshield, with a yellow panel on the front;
// "CrossCountry" in white on the maroon behind the cab, and small in maroon
// on the silver mid-car.
const XC = { maroon: "#660f21", deep: "#4c0b18", silver: "#c5c8cc", pale: "#dadcdf", pink: "#c8246c", band: "#1f2125", skirt: "#2a2d31", roof: "#43474d",
  white: "#f6f4f2", gold: "#c8a45a" };
// CrossCountry's name: one word, "Cross" light and "Country" heavy; h ft
// tall, centered on x.
const xcName = (c, x, y, h, fill) => letters(c, x, y, h, "Cross<tspan font-weight=\"800\">Country</tspan>", fill, { weight: 400, spacing: "0.01em" });
// A car's class over its windows: "FIRST" in gold (Standard goes unmarked).
const classMark = (c, x, y, cls) => (cls === "first" ? letters(c, x, y, 0.6, "FIRST", XC.gold, { weight: 700, spacing: "0.14em" }) : "");
// The side: silver, the maroon window band up to the roof, the skirt; on a
// cab end the maroon falls to the skirt in a curve ending at x = sweep.
const xcPaint = (o) => (c, g) => bands(g.L, [[0, 20, XC.silver], [o.band, 20, XC.maroon], [o.roof - 0.65, 3, XC.roof], [o.band - 0.22, 0.22, XC.pale], [0, o.sill, XC.skirt]]) +
  (o.sweep ? path(`M-1 ${o.sill - 0.8}L-1 ${o.band}L${o.sweep} ${o.band}Q${o.sweep - 5} ${o.band - 0.4} ${o.sweep - 9} ${o.sill}L-1 ${o.sill}Z`, XC.maroon) + (o.mask || "") + o.yellow : "");
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- Voyager (Classes 220 and 221) ----------
// Bombardier's 125 mph diesel-electric train for Virgin CrossCountry, built
// at Bruges and Wakefield in 2000-2002: steel cars on two trucks each, a
// Cummins QSK19 of 559 kW under every one. Driving cars 23.85 m with a
// raked, rounded nose; the 220's intermediate cars 22.82 m, the 221's
// 23.67 m; 2.73 m wide, 3.75 m tall; 780 mm wheels; one single-leaf swing
// plug door a side at each end of a car, the driving car's forward one
// behind the cab. The 221 Super Voyager was built to tilt (CrossCountry
// has it locked out) and rides on heavier, outside-framed trucks; four or
// five cars. (Wikipedia, "British Rail Class 220", "British Rail Class
// 221".)
const VOY = { roof: 12.3, sill: 3.7, band: 6.45, cab: ft(23.85), mid220: ft(22.82), mid221: ft(23.67) };
const NOSE_VOY = [[0.9, 3.0], [0.6, 4.7], ["q", 0.7, 6.2, 2.4, 7.3], [8.0, 11.2], ["q", 9.4, 12.3, 12.2, 12.3]];
const voyPaint = (cab) => xcPaint({ ...VOY, sweep: cab ? 30 : 0, yellow: yellowEnd(6.4, 3.0, 6.9),
  mask: path("M2.4 7.4Q5.4 9.4 8.0 11.2L13.6 11.2L13.6 7.3L8.4 7.2Q5.0 7.2 2.4 7.4Z", XC.band) });
// The windows: long panes close together, ten or eleven a car.
const voyRows = (a, b) => [{ xs: spread(a, b, 4.5, 5.6), y: 6.95, w: 4.5, h: 2.75, r: 0.4 }];
const voyDoor = (x) => leaf(x, VOY.sill, 10.6, 2.8, XC.pink);
// Roof: a low fairing, the air conditioning, the engine's exhaust at one end.
const voyRoof = (g, a) => fairing(a, g.L - 1.0, VOY.roof, "#565d64") + hvac(g.L / 2 - 4, VOY.roof + 0.27, 13, 0.55) + exhaust(g.L - 9, VOY.roof + 0.27);
function voyCab(c) {
  const L = c.L;
  return unit(c, { roof: VOY.roof, sill: VOY.sill, nose: NOSE_VOY, rake: [[3.0, 7.7], [7.4, 10.9]], depth: 3.2, cabLen: 14, lampY: 4.9, low: 4.0,
    rows: voyRows(22.4, L - 6.4), doors: [voyDoor(17.8), voyDoor(L - 4.6)], trucks: [11.6, L - 9.6], wheel: 31, diaphragm: [4.0, 11.0],
    paint: voyPaint(true), surround: XC.band,
    extra: (cc, g) => voyRoof(g, 12.2) + raft(19, g.L - 17) +
      // The cab's side window and door; the name in white on the maroon.
      path(poly([[9.8, 7.7], [12.8, 7.7], [12.8, 9.9], [11.2, 9.9]]), "#1d2026", 0.4) + rect(14.2, 3.9, 2.0, 6.6, "rgba(0,0,0,0.14)", 0.5) +
      xcName(cc, 13.2, 4.75, 1.15, XC.white) + classMark(cc, 46, 11.0, cc.cls) +
      letters(cc, g.L - 12, 4.4, 0.36, cc.cls22x || "", XC.maroon, { weight: 600, spacing: "0.06em" }) });
}
function voyMid(c) {
  const L = c.L;
  return unit(c, { roof: VOY.roof, sill: VOY.sill,
    rows: voyRows(6.4, L - 6.4), doors: [voyDoor(1.8), voyDoor(L - 4.6)], trucks: [9.6, L - 9.6], wheel: 31, diaphragm: [4.0, 11.0],
    paint: voyPaint(false),
    extra: (cc, g) => voyRoof(g, 1.0) + raft(17, g.L - 17) + xcName(cc, g.L / 2, 4.8, 1.05, XC.maroon) });
}

// ---------- Class 170 Turbostar ----------
// Adtranz's (later Bombardier's) regional diesel train, built at Derby in
// 1998-2005: welded aluminium cars of 23.62 m on two trucks each, 2.69 m
// wide, 3.77 m tall, an MTU 6R 183 of 315 kW under every car driving
// through a hydraulic transmission; 100 mph. Two double-leaf sliding plug
// doors a side, a third of the way in from each end; a short, upright cab
// with a raked windshield and no gangway through it; two or three cars.
// (Wikipedia, "British Rail Class 170".)
const TS = { roof: 12.37, sill: 3.8, band: 6.5, car: ft(23.62) };
const NOSE_170 = [[0.5, 3.2], [0.35, 6.4], ["q", 0.4, 7.4, 1.1, 8.2], [3.6, 11.5], ["q", 4.2, 12.37, 6.0, 12.37]];
const tsPaint = (cab) => xcPaint({ ...TS, sweep: cab ? 17.5 : 0, yellow: yellowEnd(3.0, 3.2, 7.6),
  mask: path("M1.0 8.0L3.6 11.5L7.4 11.5L7.4 8.0Z", XC.band) });
const tsDoor = (x) => ({ x, w: 4.4, y0: TS.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: XC.pink });
// The windows: big panes in three bays, one each side of the doors and a
// long one between them.
const tsRows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.6, 5.5), ...spread(d1 + 5.2, d2 - 0.8, 4.6, 5.5), ...spread(d2 + 5.2, b, 4.6, 5.5)], y: 6.95, w: 4.6, h: 2.9, r: 0.4 }];
const tsUnder = (g, a) => raft(a, a + 15) + boxes(a + 17, g.L - 14, TS.sill, 2, 1.3);
function tsCab(c) {
  const L = c.L, d1 = 19.6, d2 = L - 23.0;
  return unit(c, { roof: TS.roof, sill: TS.sill, nose: NOSE_170, rake: [[1.3, 8.3], [3.4, 11.2]], depth: 2.6, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: tsRows(9.4, d1, d2, L - 1.6), doors: [tsDoor(d1), tsDoor(d2)], trucks: [10.4, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: tsPaint(true), surround: XC.band,
    extra: (cc, g) => fairing(6.0, g.L - 1.0, TS.roof, "#565d64") + hvac(30, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 17) +
      // The cab's side window and door.
      rect(4.6, 8.1, 1.9, 2.3, "#1d2026", 0.4) + rect(7.0, 4.0, 1.9, 6.9, "rgba(0,0,0,0.14)", 0.5) +
      xcName(cc, (d1 + 4.4 + d2) / 2, 4.85, 1.1, XC.maroon) + classMark(cc, 13.6, 11.1, cc.cls) +
      letters(cc, g.L - 9, 4.45, 0.36, "170", XC.maroon, { weight: 600, spacing: "0.06em" }) });
}
function tsMid(c) {
  const L = c.L, d1 = 21.6, d2 = L - 26.0;
  return unit(c, { roof: TS.roof, sill: TS.sill,
    rows: tsRows(1.6, d1, d2, L - 1.6), doors: [tsDoor(d1), tsDoor(d2)], trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: tsPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, TS.roof, "#565d64") + hvac(g.L / 2 - 6, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 15) +
      xcName(cc, g.L / 2, 4.85, 1.1, XC.maroon) });
}

// ---------- Tables ----------

// CrossCountry's classes: First (2+1) and Standard (2+2). A Voyager has
// First in one driving car (coach A) and Standard in the rest; a Turbostar
// has a few First seats behind one cab. Each class is its own type, placed
// in the formation, with its own fact sheet. Diesel multiple units are
// kind "emu" (self-propelled, a cab at each end of the set) with no
// pantograph.
export const TYPES = {
  xc220First: { name: "Class 220 Voyager First end car", kind: "emu", amenities: ["first"] },
  xc220Mid: { name: "Class 220 Voyager Standard car", kind: "emu" },
  xc220Cab: { name: "Class 220 Voyager Standard end car", kind: "emu" },
  xc221First: { name: "Class 221 Super Voyager First end car", kind: "emu", amenities: ["first"] },
  xc221Mid: { name: "Class 221 Super Voyager Standard car", kind: "emu" },
  xc221Cab: { name: "Class 221 Super Voyager Standard end car", kind: "emu" },
  xc170First: { name: "Class 170 Turbostar First and Standard end car", kind: "emu", amenities: ["first"] },
  xc170Mid: { name: "Class 170 Turbostar Standard car", kind: "emu" },
  xc170Cab: { name: "Class 170 Turbostar Standard end car", kind: "emu" },
  xc1702First: { name: "Class 170 Turbostar First and Standard end car", kind: "emu", amenities: ["first"] },
  xc1702Cab: { name: "Class 170 Turbostar Standard end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  xc220First: M((c) => voyCab({ ...c, cls22x: "220", cls: "first" }), VOY.cab, true),
  xc220Mid: M(voyMid, VOY.mid220),
  xc220Cab: M((c) => voyCab({ ...c, cls22x: "220" }), VOY.cab, true),
  xc221First: M((c) => voyCab({ ...c, cls22x: "221", cls: "first" }), VOY.cab, true),
  xc221Mid: M(voyMid, VOY.mid221),
  xc221Cab: M((c) => voyCab({ ...c, cls22x: "221" }), VOY.cab, true),
  xc170First: M((c) => tsCab({ ...c, cls: "first" }), TS.car, true),
  xc170Mid: M(tsMid, TS.car),
  xc170Cab: M(tsCab, TS.car, true),
  xc1702First: M((c) => tsCab({ ...c, cls: "first" }), TS.car, true),
  xc1702Cab: M(tsCab, TS.car, true),
};

// Units by number: 220 001-034 (all four cars); the 221s within 221 101-144
// (CrossCountry's own 221 119-141, mostly five cars, and those it has taken
// over from Avanti West Coast since 2023; a few of the class are with other
// operators); the Turbostars 170 101-110 (three cars), 170 111-117 (two),
// 170 397-398 (three), 170 518-523 (two) and 170 636-639 (three). The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  crosscountry: [[220001, 220034, "xc220First"], [221101, 221144, "xc221First"],
    [170101, 170110, "xc170First"], [170111, 170117, "xc1702First"], [170397, 170398, "xc170First"], [170518, 170523, "xc1702First"], [170636, 170639, "xc170First"]],
};

const set = (label, ...units) => ({ label, units });
const V220 = set("Class 220 Voyager: four cars, diesel; First in the leading car",
  ["xc220First", 1], ["xc220Mid", 2], ["xc220Cab", 1]);
const V221 = set("Class 221 Super Voyager: usually five cars (some four), diesel; First in the leading car",
  ["xc221First", 1], ["xc221Mid", 3], ["xc221Cab", 1]);
const T170 = set("Class 170 Turbostar: three cars, diesel; a few First seats in the leading car",
  ["xc170First", 1], ["xc170Mid", 1], ["xc170Cab", 1]);
const T1702 = set("Class 170 Turbostar: two cars, diesel; a few First seats in the leading car",
  ["xc1702First", 1], ["xc1702Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("xc220") ? V220 : k.startsWith("xc221") ? V221 : k.startsWith("xc1702") ? T1702 : T170;

// By the reported unit; else the four-car Voyager, which with the Super
// Voyager runs CrossCountry's long routes (Plymouth and Bournemouth through
// Birmingham to Manchester, Newcastle, Edinburgh and Aberdeen), often two
// sets coupled. The Turbostars work Cardiff-Birmingham-Nottingham and
// Birmingham-Leicester-Stansted Airport; the timetable does not say which
// train is which, so the label says "usually".
export const TYPICAL = {
  crosscountry: (t, reported) => BY_MODEL[reported] || V220,
};

const W220 = "https://en.wikipedia.org/wiki/British_Rail_Class_220";
const W221 = "https://en.wikipedia.org/wiki/British_Rail_Class_221";
const W170 = "https://en.wikipedia.org/wiki/British_Rail_Class_170";
const v220 = { model: "Bombardier Class 220 Voyager", type: "Diesel-electric multiple unit", builder: "Bombardier Transportation (Bruges and Wakefield)", built: "2000–2001",
  fleet: "34 four-car units", topSpeedMph: 125, powerHp: 3000, seats: 200, source: W220 };
const v221 = { model: "Bombardier Class 221 Super Voyager", type: "Diesel-electric multiple unit", builder: "Bombardier Transportation (Bruges and Wakefield)", built: "2001–2002",
  fleet: "44 built, of four or five cars", topSpeedMph: 125, powerHp: 3750, seats: 246, source: W221 };
const t170 = { model: "Bombardier Class 170 Turbostar", type: "Diesel-hydraulic multiple unit", builder: "Adtranz, later Bombardier Transportation (Derby)", built: "1998–2005",
  topSpeedMph: 100, source: W170 };
const t3 = { ...t170, fleet: "139 built for many operators; CrossCountry's are of two or three cars", powerHp: 1267 };
const t2 = { ...t3, powerHp: 845 };
export const FACTS = {
  xc220First: { ...v220, lengthFt: 306.2,
    about: "The Voyager's First class driving car, seated 2+1. Built for Virgin CrossCountry to replace its locomotive-hauled trains and High Speed Trains, and CrossCountry's since 2007: a four-car set is 93.3 m long, with a 750 hp Cummins engine and generator under every car driving electric motors on the trucks." },
  xc220Mid: { ...v220,
    about: "Standard class, seated 2+2. Every car of a Voyager is powered, so that a set can lose an engine and keep time." },
  xc220Cab: { ...v220,
    about: "The Standard class driving car. Two Voyagers often run coupled; there is no way through between them." },
  xc221First: { ...v221, lengthFt: 389.5,
    about: "The Super Voyager's First class driving car, seated 2+1. The Voyager's tilting sister, built to lean into the West Coast Main Line's curves; CrossCountry runs it with the tilt locked out. A five-car set is 118.7 m long and seated 246 as built (26 First, 220 Standard)." },
  xc221Mid: { ...v221,
    about: "Standard class, seated 2+2. The 221's intermediate cars are a little longer than the 220's, and its trucks heavier, their frames outside the wheels, to carry the tilting gear." },
  xc221Cab: { ...v221,
    about: "The Standard class driving car." },
  xc170First: { ...t3, lengthFt: 232.5,
    about: "A Turbostar driving car with a few First class seats behind the cab and Standard in the rest. CrossCountry's Turbostars work Cardiff to Nottingham and Birmingham to Stansted Airport at up to 100 mph, each car on its own MTU diesel engine." },
  xc170Mid: { ...t3,
    about: "The three-car Turbostar's middle car: Standard class, seated 2+2, with wide double doors a third of the way in from each end." },
  xc170Cab: { ...t3,
    about: "The Standard class driving car." },
  xc1702First: { ...t2, lengthFt: 155.0,
    about: "A two-car Turbostar's driving car with a few First class seats behind the cab and Standard in the rest. Two- and three-car sets run alone or coupled." },
  xc1702Cab: { ...t2,
    about: "The Standard class driving car of a two-car Turbostar." },
};
