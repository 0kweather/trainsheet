// Great Northern's cars (scripts/railroads/gb.py, "greatnorthern"): the
// trains out of King's Cross and Moorgate. Two fleets: the Siemens Class
// 717 Desiro City, six cars, on the inner-suburban trains through the
// tunnels to Moorgate, and the Bombardier Class 387 Electrostar, four cars
// (usually two units coupled), on the expresses to Cambridge, Ely and
// King's Lynn. The timetable names no unit, so a train is drawn as the
// fleet that usually runs it, labeled as typical. Trainsheet's own side
// views from published dimensions, at the shared scale (js/carart.js), in
// Great Northern's white with blue doors, lettered here (no logo files).
// The toolkit from avanti.cars.js; the Desiro City is redrawn here with the
// 717's end door (thameslink.cars.js does not export its 700) and the
// Electrostar in Great Northern paint (gwr.cars.js does not export its 387).

import { rect, path, pantograph } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Great Northern since 2018-2019, drawn from memory and not checked against
// photographs: white sides with no window band, a gray roof and a charcoal
// skirt; doors in the railroad's blue (#0099ff, toned down a little); "Great
// Northern" in dark navy under the windows mid-car. The 717's cab end is
// charcoal, its edge slanting back toward the roof, with a yellow panel on
// the front under the windshield; the 387's flat gangwayed front is yellow
// round a black windshield mask, the side white right up to it.
const GN = { white: "#f4f5f4", blue: "#1f93e0", navy: "#1b2a4a", cab: "#3a3e45", band: "#1f2126", skirt: "#33363b", roof: "#8a9096", trim: "#aeb3b9", silver: "#c9cdd2" };

// Great Northern's name, mixed case, h ft tall, centered on x; reads left
// to right on a mirrored car too.
const name = (c, x, y, h = 1.2) => letters(c, x, y, h, "Great Northern", GN.navy, { weight: 700, spacing: "0.01em" });
// The class, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, GN.silver, { weight: 600, spacing: "0.06em" });
const side = (roof, sill, more = "") => (c, g) => bands(g.L, [[0, 20, GN.white], [roof - 0.6, 3, GN.roof], [0, sill, GN.skirt]]) + more;

// ---------- Siemens Desiro City: Class 717 ----------
// Built at Krefeld by Siemens in 2018 for the Northern City Line: 25
// six-car units (717 001-025, 121.7 m, DMOS-TOS-TOS-MOS-PTOS-DMOS),
// aluminium cars of about 20.2 m, 2.80 m wide, floor at 1.10 m, on SF7000
// trucks with 820 mm wheels; two double-leaf pocket sliding doors a side on
// each car, each 1.5 m wide; 85 mph; 1,200 kW at the wheels; 25 kV 50 Hz
// overhead as far as Drayton Park and 750 V third rail through the tunnels
// from there to Moorgate; 362 seats, all Standard, and no lavatory. The
// Thameslink 700's body with a door in the middle of the cab front, the
// way out along the single-bore tunnels. (Wikipedia, "British Rail Class
// 717". The driving cars' 20.52 m against 20.16 m for the others are the
// 700's, which fit the 717's train length too; the height, about 3.79 m,
// and the pantograph's place on the fifth car are from memory.)
const DC = { roof: ft(3.79), sill: 3.7, cab: ft(20.52), mid: ft(20.16) };
// The front: more upright than the 700's, round its end door.
const NOSE_717 = [[0.6, 3.1], [0.35, 5.6], ["q", 0.4, 7.4, 1.3, 8.6], [3.2, DC.roof - 0.9], ["q", 3.8, DC.roof, 5.8, DC.roof]];
// A double-leaf sliding door, 1.5 m wide.
const DOOR_W = 4.9;
const door = (x) => ({ x, w: DOOR_W, y0: DC.sill, y1: 10.9, leaves: 2, glassY: 0.46, glassH: 0.38, grabs: false, fill: GN.blue });
// The windows: wide panes in the bays each side of the doors and between
// them.
const rows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 4.6, 5.3)), y: 6.9, w: 4.6, h: 2.9, r: 0.35 }];
// The charcoal cab end, its edge slanting back toward the roof.
const darkEnd = (x0, x1) => path(`M-1 ${DC.sill}L${x0} ${DC.sill}L${x1} 13.5L-1 13.5Z`, GN.cab);

function dcCab(c) {
  const L = c.L, d1 = 18.6, d2 = L - 18.9;
  return unit(c, { roof: DC.roof, sill: DC.sill, nose: NOSE_717, rake: [[1.5, 8.6], [3.0, DC.roof - 1.2]], depth: 2.0, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: rows([[11.6, d1 - 0.8], [d1 + DOOR_W + 0.8, d2 - 0.8], [d2 + DOOR_W + 0.8, L - 1.6]]), doors: [door(d1), door(d2)], trucks: [10.6, L - 9.4], wheel: 32,
    diaphragm: [4.1, DC.roof - 1.1],
    paint: side(DC.roof, DC.sill, darkEnd(8.4, 12.2) + path(`M1.2 8.4L3.2 ${DC.roof - 0.9}L7.2 ${DC.roof - 0.9}L7.2 8.4Z`, GN.band) + yellowEnd(2.6, 3.1, 8.0)), surround: GN.band,
    extra: (cc, g) => fairing(6.0, g.L - 1.0, DC.roof, GN.trim) + hvac(g.L / 2 - 4, DC.roof + 0.27, 12, 0.55) + boxes(16, g.L - 14, DC.sill, 4, 1.4) +
      // The cab's side window and door.
      rect(4.9, 8.4, 2.0, 2.1, "#1d2026", 0.4) + rect(7.4, 4.0, 1.9, 6.9, "rgba(0,0,0,0.22)", 0.5) +
      name(cc, (d1 + DOOR_W + d2) / 2, 5.0) + classNo(cc, g.L - 8, 3.05, "717") });
}
// o.pan: the pantograph and its transformer (the fifth car; the pantograph
// over the truck nearer the driving car beside it). o.motor: traction gear
// under the floor.
function dcMid(c, o = {}) {
  const L = c.L, d1 = 13.6, d2 = L - 13.6 - DOOR_W, px = L - 10.5;
  return unit(c, { roof: DC.roof, sill: DC.sill,
    rows: rows([[1.6, d1 - 0.8], [d1 + DOOR_W + 0.8, d2 - 0.8], [d2 + DOOR_W + 0.8, L - 1.6]]), doors: [door(d1), door(d2)], trucks: [9.4, L - 9.4], wheel: 32,
    diaphragm: [4.1, DC.roof - 1.1], paint: side(DC.roof, DC.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, DC.roof, GN.trim) +
      (o.pan ? pantograph(px, DC.roof + 0.29, { up: true, facing: 1 }) + hvLine(px - 11, px - 3, DC.roof + 0.29) + hvac(12, DC.roof + 0.27, 12, 0.55) + boxes(15, g.L - 15, DC.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, DC.roof + 0.27, 12, 0.55) + boxes(15, g.L - 15, DC.sill, o.motor ? 4 : 2, o.motor ? 1.4 : 1.1)) +
      name(cc, (d1 + DOOR_W + d2) / 2, 5.0) });
}

// ---------- Bombardier Electrostar: Class 387 ----------
// Bombardier's (Derby) last Electrostar, built 2014-2017: four cars of
// 20.39 m (DMSO-MSO-PTSO-DMSO), 2.80 m wide, 3.77 m tall, 110 mph, 1.68 MW;
// 25 kV overhead and 750 V third rail; a flat cab front with a gangway
// door, so that coupled units can be walked through; two double-leaf
// sliding plug doors a side at the thirds of each car; the pantograph on
// the third car (the trailer), the motors under the two driving cars and
// the second car. (Wikipedia, "British Rail Class 387". Great Northern's
// are the 387/1s, 387 101-129, first built for Thameslink; the range, and
// the First saloon in one driving car, not drawn, are from memory.)
const ES = { roof: ft(3.77), sill: 3.7, car: ft(20.39) };
const NOSE_387 = [[0.4, 3.2], [0.3, 6.5], ["q", 0.3, 7.4, 0.7, 8.1], [1.8, ES.roof - 0.77], ["q", 2.2, ES.roof, 3.6, ES.roof]];
const ES_DOOR = 4.4;
const plug = (x) => ({ x, w: ES_DOOR, y0: ES.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: GN.blue });
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.4, 5.2), ...spread(d1 + ES_DOOR + 0.8, d2 - 0.8, 4.4, 5.2), ...spread(d2 + ES_DOOR + 0.8, b, 4.4, 5.2)], y: 6.95, w: 4.4, h: 2.85, r: 0.4 }];
function esCab(c) {
  const L = c.L, d1 = 17.0, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_387, rake: [[0.8, 8.3], [1.7, ES.roof - 1.07]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: bays(8.8, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(ES.roof, ES.sill, yellowEnd(2.6, 3.2, ES.roof - 0.6) + path(`M0.6 8.1L1.8 ${ES.roof - 0.77}L4.4 ${ES.roof - 0.77}L4.4 8.1Z`, GN.band)), surround: GN.band,
    extra: (cc, g) => fairing(3.6, g.L - 1.0, ES.roof, GN.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, ES.sill, 3, 1.3) +
      // The cab's side window and door.
      rect(3.4, 8.2, 1.7, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.12)", 0.5) +
      name(cc, (d1 + ES_DOOR + d2) / 2, 5.05) + classNo(cc, g.L - 8, 3.05, "387") });
}
// o.pan: the pantograph and transformer (the third car). o.motor: traction
// gear under the floor (the second).
function esMid(c, o = {}) {
  const L = c.L, d1 = 14.6, d2 = L - 19.0;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: bays(1.6, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(ES.roof, ES.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, ES.roof, GN.trim) +
      (o.pan ? pantograph(13, ES.roof + 0.29, { up: true, facing: -1 }) + hvLine(16, 24, ES.roof + 0.29) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, o.pan ? 2 : 3, 1.3) + name(cc, (d1 + ES_DOOR + d2) / 2, 5.05) });
}

// ---------- Tables ----------

// Both fleets are drawn all Standard. Each car kind is its own type, placed
// in the formation, with its own fact sheet.
export const TYPES = {
  gn717Cab: { name: "Class 717 driving car", kind: "emu" },
  gn717Mid: { name: "Class 717 trailer car", kind: "emu" },
  gn717Motor: { name: "Class 717 motor car", kind: "emu" },
  gn717Pan: { name: "Class 717 pantograph car", kind: "emu", pan: true },
  gn387Cab: { name: "Class 387 Electrostar driving car", kind: "emu" },
  gn387Motor: { name: "Class 387 Electrostar motor car", kind: "emu" },
  gn387Pan: { name: "Class 387 Electrostar pantograph car", kind: "emu", pan: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  gn717Cab: M(dcCab, DC.cab, true),
  gn717Mid: M((c) => dcMid(c), DC.mid),
  gn717Motor: M((c) => dcMid(c, { motor: true }), DC.mid),
  gn717Pan: M((c) => dcMid(c, { pan: true }), DC.mid),
  gn387Cab: M(esCab, ES.car, true),
  gn387Motor: M((c) => esMid(c, { motor: true }), ES.car),
  gn387Pan: M((c) => esMid(c, { pan: true }), ES.car),
};

// Units by number (class and serial run together): 717 001-025; 387
// 101-129. The timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  greatnorthern: [[717001, 717025, "gn717Cab"], [387101, 387129, "gn387Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C717 = set("Class 717 Desiro City: six cars, electric, all Standard",
  ["gn717Cab", 1], ["gn717Mid", 2], ["gn717Motor", 1], ["gn717Pan", 1], ["gn717Cab", 1]);
const E387 = set("Class 387 Electrostar: four cars, electric; often two units coupled",
  ["gn387Cab", 1], ["gn387Motor", 1], ["gn387Pan", 1], ["gn387Cab", 1]);
const BY_MODEL = { gn717Cab: C717, gn717Mid: C717, gn717Motor: C717, gn717Pan: C717, gn387Cab: E387, gn387Motor: E387, gn387Pan: E387 };

// By the reported unit; else the 717, which runs the most trains: every
// service on the Northern City Line between Moorgate and Welwyn Garden
// City, Hertford North and Stevenage. The 387s run King's Cross to
// Cambridge, Ely and King's Lynn (and some Peterborough and Letchworth
// trains). The timetable does not say which train is which, so the label
// says "usually".
export const TYPICAL = {
  greatnorthern: (t, reported) => BY_MODEL[reported] || C717,
};

const W717 = "https://en.wikipedia.org/wiki/British_Rail_Class_717";
const W387 = "https://en.wikipedia.org/wiki/British_Rail_Class_387";
const f717 = { model: "Siemens Class 717 Desiro City", type: "Electric multiple unit", builder: "Siemens (Krefeld)", built: "2018", fleet: "25 six-car units",
  topSpeedMph: 85, powerHp: 1609, seats: 362, source: W717 };
const f387 = { model: "Bombardier Class 387 Electrostar", type: "Electric multiple unit", builder: "Bombardier Transportation (Derby)", built: "2014–2017",
  fleet: "29 four-car units (387/1)", topSpeedMph: 110, powerHp: 2253, source: W387 };
export const FACTS = {
  gn717Cab: { ...f717, lengthFt: 399.3,
    about: "A Class 717 driving car. The six-car Desiro City built for the Northern City Line, in service since 2019 in place of the 1976 Class 313s: the door in the middle of its front is the way out in the single-bore tunnels under Finsbury Park and Old Street, where no one could step down beside the train." },
  gn717Mid: { ...f717,
    about: "A trailer car: two wide double doors a side, broad gangways to the cars each side, 2+2 seats and plenty of standing room for the short runs into Moorgate. The 717 has no lavatory." },
  gn717Motor: { ...f717,
    about: "The fourth car, a motor car with traction gear under its floor; the two driving cars are powered too." },
  gn717Pan: { ...f717,
    about: "The fifth car carries the pantograph and, under its floor, the transformer for the 25 kV overhead wire. At Drayton Park the train lowers it and takes 750 V from the third rail through the old tube-sized tunnels to Moorgate." },
  gn387Cab: { ...f387, lengthFt: 267.6,
    about: "A driving motor car of Great Northern's Electrostar, the 110 mph train of the King's Cross to Cambridge and King's Lynn expresses. Its flat front carries a gangway door, so that two or three coupled units can be walked through from end to end." },
  gn387Motor: { ...f387,
    about: "The second car, a motor car, with traction gear under its floor. Two double plug doors a side at the thirds of the car." },
  gn387Pan: { ...f387,
    about: "The third car, a trailer, carries the pantograph and the transformer under its floor. Trains split and join at Cambridge, where four cars often go on alone to Ely and King's Lynn." },
};
