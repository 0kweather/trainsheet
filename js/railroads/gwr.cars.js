// Great Western Railway's cars (scripts/railroads/gb.py, "gwr"): the
// Intercity Express Train (Hitachi Classes 800 and 802, five and nine
// cars) on the main lines out of Paddington, the Class 387 Electrostar on
// the Thames Valley's electric services and the Class 165 and 166 Turbo
// diesels on the branches and around Bristol. The timetable names no unit,
// so a train is drawn as the model that usually runs it, labeled as
// typical. Trainsheet's own side views from published dimensions, at the
// shared scale (js/carart.js), in GWR's dark green, lettered here (no logo
// files). The toolkit and the Hitachi AT300 body from avanti.cars.js.

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust, AT300, at300Cab, at300Mid } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// GWR since September 2015 (its green is #0a493e): dark green all over, the
// roof and the skirt too, the windows in a near-black band; "GWR" in silver
// capitals on the side; a yellow panel on every cab front. First class is
// marked by a silver line over its windows. The doors are drawn in a paler
// gray-green, to stand out from the side as the accessibility rules ask.
// Drawn from memory of the trains, not checked against photographs.
const GW = { green: "#0a493e", deep: "#073a31", roof: "#0b3f36", band: "#131a19", skirt: "#1c2422", silver: "#c9cfd1", door: "#6f8a81", trim: "#3f5f57" };
// GWR's name: three heavy capitals, wide-set, in silver; h ft tall,
// centered on x.
const gwr = (c, x, y, h) => letters(c, x, y, h, "GWR", GW.silver, { weight: 800, spacing: "0.08em" });
// First class: a silver line over the windows from a to b, lettered.
const firstLine = (c, a, b, y) => rect(a, y, b - a, 0.14, GW.silver) + letters(c, (a + b) / 2, y + 0.38, 0.55, "FIRST CLASS", GW.silver, { weight: 700, spacing: "0.14em" });
// A class number, small, by the end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text || "", GW.silver, { weight: 600, spacing: "0.06em" });

// ---------- Intercity Express Train (Hitachi AT300, Classes 800 and 802) ----------
// Body and dimensions in avanti.cars.js: 26.0 m cars, driving cars 25.85 m
// (the 802's 25.7 m; drawn alike), 2.7 m wide; five cars 129.7 m, nine
// 233.7 m. All of GWR's are bi-mode, an MTU 12V 1600 diesel of 700 kW under
// each motor car (three of a five-car set's cars, five of a nine-car's);
// the 802s, for Devon and Cornwall, carry bigger fuel tanks and brake
// resistors. (Wikipedia, "British Rail Class 800", "British Rail Class
// 802".)
const IET = {
  door: GW.door, surround: GW.band, roofTrim: GW.trim,
  paint: (cab) => (c, g) => bands(g.L, [[0, 20, GW.green], [11.3, 3, GW.roof], [6.4, 3.45, GW.band], [0, 3.7, GW.skirt]]) +
    // The cab end: the windshield's black mask and the yellow panel under it.
    (cab ? path("M3.0 7.1Q7.4 8.9 11.6 10.7L18.6 10.7L18.6 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", GW.band) + yellowEnd(8.4, 2.9, 6.7) : ""),
  over: (c, g, cab) => gwr(c, cab ? 46 : g.L / 2, 5.0, 1.7) + (cab ? classNo(c, g.L - 12, 4.5, c.cls80x) : "") +
    (c.cls === "first" ? firstLine(c, cab ? 29 : 6, g.L - 6, 10.2) : c.cls === "comp" ? firstLine(c, 6, g.L * 0.45, 10.2) : ""),
};

// ---------- Class 387 Electrostar ----------
// Bombardier's (Derby) last Electrostar, built 2014-2017: four cars of
// 20.39 m, 2.80 m wide, 3.77 m tall, 110 mph; a flat cab front with a
// gangway door, so that coupled units can be walked through; two
// double-leaf sliding plug doors a side at the thirds of each car; the
// pantograph on the third car (the trailer), the motors under the two
// driving cars and the second car. (Wikipedia, "British Rail Class 387".)
const ES = { roof: 12.37, sill: 3.7, car: ft(20.39) };
const NOSE_387 = [[0.4, 3.2], [0.3, 6.5], ["q", 0.3, 7.4, 0.7, 8.1], [1.8, 11.6], ["q", 2.2, 12.37, 3.6, 12.37]];
const sidePaint = (roof, sill, cab, yellowX, mask) => (c, g) => bands(g.L, [[0, 20, GW.green], [roof - 0.6, 3, GW.roof], [6.6, 3.55, GW.band], [0, sill, GW.skirt]]) +
  (cab ? path(mask, GW.band) + yellowEnd(yellowX, 3.2, 8.0) : "");
const door2 = (x, sill) => ({ x, w: 4.4, y0: sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: GW.door });
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b, w, pitch) => [{ xs: [...spread(a, d1 - 0.8, w, pitch), ...spread(d1 + 5.2, d2 - 0.8, w, pitch), ...spread(d2 + 5.2, b, w, pitch)], y: 6.95, w, h: 2.85, r: 0.4 }];
function esCab(c) {
  const L = c.L, d1 = 17.0, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_387, rake: [[0.8, 8.3], [1.7, 11.3]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: bays(8.8, d1, d2, L - 1.6, 4.4, 5.2), doors: [door2(d1, ES.sill), door2(d2, ES.sill)], trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(ES.roof, ES.sill, true, 2.4, "M0.6 8.1L1.8 11.6L4.4 11.6L4.4 8.1Z"), surround: GW.band,
    extra: (cc, g) => fairing(3.6, g.L - 1.0, ES.roof, GW.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, ES.sill, 3, 1.3) +
      // The cab's side window and door.
      rect(3.4, 8.2, 1.7, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      gwr(cc, (d1 + 4.4 + d2) / 2, 5.05, 1.6) + classNo(cc, g.L - 8, 4.5, "387") });
}
function esMid(c) {
  const L = c.L, d1 = 14.6, d2 = L - 19.0;
  // The pantograph rides on the third car, a trailer.
  const pan = c.index === 2;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: bays(1.6, d1, d2, L - 1.6, 4.4, 5.2), doors: [door2(d1, ES.sill), door2(d2, ES.sill)], trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(ES.roof, ES.sill, false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, ES.roof, GW.trim) +
      (pan ? pantograph(13, ES.roof + 0.29, { up: true, facing: -1 }) + hvLine(16, 24, ES.roof + 0.29) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, pan ? 2 : 3, 1.3) + gwr(cc, (d1 + 4.4 + d2) / 2, 5.05, 1.6) });
}

// ---------- Class 165 and 166 Turbo ----------
// British Rail's Networker Turbo for the Thames and Chiltern lines (BREL
// and ABB, York, 1990-1993): welded aluminium cars, driving cars 23.50 m
// and the middle car 23.25 m, 2.81 m wide, 3.79 m tall; a flat cab with no
// gangway; two double-leaf sliding plug doors a side; a Perkins 2006 TW-H
// diesel of 350 hp under every car. The 165s are two or three cars, the
// 166s (air-conditioned, 90 mph) three. (Wikipedia, "British Rail Class
// 165", "British Rail Class 166".)
const TB = { roof: 12.43, sill: 3.75, cab: ft(23.5), mid: ft(23.25) };
const NOSE_165 = [[0.5, 3.2], [0.35, 6.6], ["q", 0.4, 7.6, 1.0, 8.4], [2.6, 11.7], ["q", 3.0, 12.43, 4.6, 12.43]];
// The engine and its transmission under the floor.
const raft = (a, b) => rect(a, 1.5, b - a, 2.3, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);
function turboCab(c) {
  const L = c.L, d1 = 17.6, d2 = L - 21.6;
  return unit(c, { roof: TB.roof, sill: TB.sill, nose: NOSE_165, rake: [[1.1, 8.6], [2.5, 11.4]], depth: 2.4, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: bays(9.0, d1, d2, L - 1.6, 4.6, 5.4), doors: [door2(d1, TB.sill), door2(d2, TB.sill)], trucks: [10.2, L - 9.6], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(TB.roof, TB.sill, true, 3.0, "M0.9 8.4L2.6 11.7L5.6 11.7L5.6 8.4Z"), surround: GW.band,
    extra: (cc, g) => fairing(4.6, g.L - 1.0, TB.roof, GW.trim) + hvac(g.L / 2 - 6, TB.roof + 0.27, 12, 0.5) + exhaust(g.L - 7, TB.roof + 0.27) +
      raft(24, 39) + boxes(41, g.L - 14, TB.sill, 2, 1.3) +
      // The cab's side window and door.
      rect(4.4, 8.4, 1.9, 2.2, "#1d2026", 0.4) + rect(6.8, 4.0, 1.9, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      gwr(cc, (d1 + 4.4 + d2) / 2, 5.05, 1.6) + classNo(cc, g.L - 8, 4.5, cc.cls16x) });
}
function turboMid(c) {
  const L = c.L, d1 = 17.0, d2 = L - 21.4;
  return unit(c, { roof: TB.roof, sill: TB.sill,
    rows: bays(1.6, d1, d2, L - 1.6, 4.6, 5.4), doors: [door2(d1, TB.sill), door2(d2, TB.sill)], trucks: [9.6, L - 9.6], wheel: 33, diaphragm: [4.1, 11.2],
    paint: sidePaint(TB.roof, TB.sill, false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, TB.roof, GW.trim) + hvac(g.L / 2 - 6, TB.roof + 0.27, 12, 0.5) + exhaust(g.L - 7, TB.roof + 0.27) +
      raft(22, 37) + boxes(39, g.L - 14, TB.sill, 2, 1.3) + gwr(cc, (d1 + 4.4 + d2) / 2, 5.05, 1.6) });
}

// ---------- Tables ----------

// GWR's classes: First (2+1) and Standard (2+2), First on the Intercity
// Express Trains only, at the London end: one driving car and part of the
// next car in a five-car set, the driving car, the next and part of the
// third in a nine-car one. The Electrostars and Turbos are Standard
// throughout. Each IET fleet is its own set of types, so that a reported
// unit draws at its own length.
const IETS = {
  gw8003: { cls: "800", cars: 9, engines: [1, 2, 4, 6, 7], fleet: 21, seats: 650 },
  gw8000: { cls: "800", cars: 5, engines: [1, 2, 3], fleet: 36, seats: 326 },
  gw8021: { cls: "802", cars: 9, engines: [1, 2, 4, 6, 7], fleet: 14, seats: 647 },
  gw8020: { cls: "802", cars: 5, engines: [1, 2, 3], fleet: 22, seats: 326 },
};
export const TYPES = {
  gw387Cab: { name: "Class 387 Electrostar end car", kind: "emu" },
  gw387Mid: { name: "Class 387 Electrostar car", kind: "emu", pan: true },
  gw166Cab: { name: "Class 166 Turbo end car", kind: "emu" },
  gw166Mid: { name: "Class 166 Turbo car", kind: "emu" },
  gw165Cab: { name: "Class 165 Turbo end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => `${ctx.index}/${ctx.count}`;
export const MODELS = {
  gw387Cab: M(esCab, ES.car, true),
  gw387Mid: M(esMid, ES.car, false, byIndex),
  gw166Cab: M((c) => turboCab({ ...c, cls16x: "166" }), TB.cab, true),
  gw166Mid: M(turboMid, TB.mid),
  gw165Cab: M((c) => turboCab({ ...c, cls16x: "165" }), TB.cab, true),
};
for (const [k, f] of Object.entries(IETS)) {
  const name = `Class ${f.cls} Intercity Express Train`;
  const iet = (c, more) => ({ ...c, cls80x: f.cls, engine: f.engines.includes(c.index), ...more });
  TYPES[`${k}First`] = { name: `${name} First end car`, kind: "emu", pan: true, amenities: ["first"] };
  TYPES[`${k}FirstMid`] = { name: `${name} First car`, kind: "emu", amenities: ["first"] };
  TYPES[`${k}Comp`] = { name: `${name} First and Standard car`, kind: "emu", amenities: ["first"] };
  TYPES[`${k}Mid`] = { name: `${name} Standard car`, kind: "emu" };
  TYPES[`${k}Cab`] = { name: `${name} Standard end car`, kind: "emu", pan: true };
  MODELS[`${k}First`] = M((c) => at300Cab(iet(c, { cls: "first", pan: true, engine: false }), IET), AT300.cab, true);
  MODELS[`${k}FirstMid`] = M((c) => at300Mid(iet(c, { cls: "first" }), IET), AT300.mid, false, byIndex);
  MODELS[`${k}Comp`] = M((c) => at300Mid(iet(c, { cls: "comp" }), IET), AT300.mid, false, byIndex);
  MODELS[`${k}Mid`] = M((c) => at300Mid(iet(c), IET), AT300.mid, false, byIndex);
  MODELS[`${k}Cab`] = M((c) => at300Cab(iet(c, { pan: false, engine: false }), IET), AT300.cab, true);
}

// Units by number: 800 001-036 (five cars) and 800 301-321 (nine); 802
// 001-022 (five) and 802 101-114 (nine); 387 130-174, of which the first
// twelve wear Heathrow Express's paint and are that railroad's; 165 101-117
// (three cars) and 118-137 (two); 166 201-221. The timetable names no
// unit; these are for the fleet pages.
export const FLEETS = {
  gwr: [[800001, 800036, "gw8000First"], [800301, 800321, "gw8003First"], [802001, 802022, "gw8020First"], [802101, 802114, "gw8021First"],
    [387142, 387174, "gw387Cab"], [165101, 165117, "gw166Mid"], [165118, 165137, "gw165Cab"], [166201, 166221, "gw166Cab"]],
};

const set = (label, ...units) => ({ label, units });
const ietSet = (k) => {
  const f = IETS[k], label = `Class ${f.cls} Intercity Express Train: ${f.cars === 9 ? "nine" : "five"} cars, electric and diesel; First in the leading ${f.cars === 9 ? "two cars and part of the third" : "car and part of the second"}`;
  return f.cars === 9 ? set(label, [`${k}First`, 1], [`${k}FirstMid`, 1], [`${k}Comp`, 1], [`${k}Mid`, 5], [`${k}Cab`, 1])
    : set(label, [`${k}First`, 1], [`${k}Comp`, 1], [`${k}Mid`, 2], [`${k}Cab`, 1]);
};
const SETS = Object.fromEntries(Object.keys(IETS).map((k) => [k, ietSet(k)]));
const E387 = set("Class 387 Electrostar: four cars, electric; often two units coupled", ["gw387Cab", 1], ["gw387Mid", 2], ["gw387Cab", 1]);
const T166 = set("Class 165 or 166 Turbo: three cars, diesel", ["gw166Cab", 1], ["gw166Mid", 1], ["gw166Cab", 1]);
const T165 = set("Class 165 Turbo: two cars, diesel", ["gw165Cab", 2]);
const BY_MODEL = { gw387Cab: E387, gw387Mid: E387, gw166Cab: T166, gw166Mid: T166, gw165Cab: T165 };
for (const k of Object.keys(TYPES)) BY_MODEL[k] = BY_MODEL[k] || SETS[k.slice(0, 6)];

// By the reported unit; else the nine-car Class 800, the usual train
// between London, Bristol and South Wales. The five-car sets run in pairs
// on the same routes and singly to the Cotswolds; the 802s work to Devon
// and Cornwall; the Electrostars run the stopping trains from Paddington to
// Didcot and Newbury, and the Turbos the Thames Valley branches and the
// lines around Bristol. GWR's other trains (Classes 150, 158 and 175, the
// short Castle HSTs and the Night Riviera sleeper) are not drawn. The
// timetable does not say which train is which, so the label says "usually".
export const TYPICAL = {
  gwr: (t, reported) => BY_MODEL[reported] || SETS.gw8003,
};

const W800 = "https://en.wikipedia.org/wiki/British_Rail_Class_800";
const W802 = "https://en.wikipedia.org/wiki/British_Rail_Class_802";
const W387 = "https://en.wikipedia.org/wiki/British_Rail_Class_387";
const W165 = "https://en.wikipedia.org/wiki/British_Rail_Class_165";
const W166 = "https://en.wikipedia.org/wiki/British_Rail_Class_166";
const e387 = { model: "Bombardier Class 387 Electrostar", type: "Electric multiple unit", builder: "Bombardier Transportation (Derby)", built: "2014–2017",
  fleet: "33 four-car units", topSpeedMph: 110, powerHp: 2253, source: W387 };
const t166 = { model: "Class 166 Turbo", type: "Diesel multiple unit", builder: "ABB Transportation (York)", built: "1992–1993",
  fleet: "21 three-car units", topSpeedMph: 90, powerHp: 1050, source: W166 };
export const FACTS = {
  gw387Cab: { ...e387, lengthFt: 267.6,
    about: "A driving motor car of GWR's Electrostar, the electric train of the Thames Valley's stopping services since 2016. Its flat front carries a gangway door, so that two or three coupled units can be walked through from end to end." },
  gw387Mid: { ...e387,
    about: "A middle car, Standard class like the whole train. The second car is a motor car; the third, a trailer, carries the pantograph and the transformer." },
  gw166Cab: { ...t166, lengthFt: 230.5,
    about: "A driving car of the Turbo, British Rail's Networker diesel for the lines out of Paddington, with a Perkins engine under every car. Since the Thames Valley was electrified most have moved west, to the lines around Bristol; the three-car Class 165s are the same train without the 166's air conditioning." },
  gw166Mid: { ...t166,
    about: "The Turbo's middle car, a motor car like the other two. At 2.81 m the Turbos are wider than most British trains, and are kept to the lines cleared for them." },
  gw165Cab: { model: "Class 165 Turbo", type: "Diesel multiple unit", builder: "BREL (York)", built: "1990–1992", fleet: "20 two-car and 17 three-car units",
    topSpeedMph: 90, powerHp: 700, lengthFt: 154.2, source: W165,
    about: "The two-car Turbo: two driving cars, an engine under each, on the Thames Valley's branches (Marlow, Henley, Windsor, Greenford), the North Downs line to Gatwick and local trains around Bristol." },
};
for (const [k, f] of Object.entries(IETS)) {
  const nine = f.cars === 9, w = f.cls === "802";
  const base = { model: `Hitachi Class ${f.cls} Intercity Express Train (AT300)`, type: "Bi-mode multiple unit (electric and diesel)",
    builder: w ? "Hitachi Rail (Kasado and Pistoia)" : "Hitachi Rail (Newton Aycliffe and Kasado)", built: w ? "2017–2020" : "2014–2018",
    fleet: `${f.fleet} ${nine ? "nine" : "five"}-car units`, topSpeedMph: 125, seats: f.seats, source: w ? W802 : W800 };
  FACTS[`${k}First`] = { ...base, lengthFt: nine ? 766.7 : 425.5,
    about: `The Intercity Express Train's First class driving car, seated 2+1, at the London end. ${nine ? `A nine-car set is 233.7 m long and seats ${f.seats}` : `A five-car set is 129.7 m long and seats ${f.seats}; two usually run coupled`}. ` +
      "A bi-mode train: it runs on the wires from Paddington as far as they go and on its diesel engines beyond them. " +
      (w ? "The 802s, with bigger fuel tanks and brake resistors on the roof for the Devon banks, took over the West of England trains from the High Speed Train in 2018." : "GWR's 800s entered service in October 2017, replacing the High Speed Train to Bristol and South Wales.") };
  FACTS[`${k}FirstMid`] = { ...base, about: "The nine-car train's second First class car, seated 2+1." };
  FACTS[`${k}Comp`] = { ...base, about: "First class in part of the car, Standard in the rest." };
  FACTS[`${k}Mid`] = { ...base,
    about: `Standard class, seated 2+2. ${nine ? "Five of the nine" : "Three of the five"} cars carry an MTU diesel engine of 700 kW under the floor.` };
  FACTS[`${k}Cab`] = { ...base, about: "The Standard class driving car at the country end of the train. Both driving cars carry a pantograph." };
}
