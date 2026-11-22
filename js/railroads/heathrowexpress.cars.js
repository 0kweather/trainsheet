// Heathrow Express's cars (scripts/railroads/gb.py, "heathrowexpress"): the
// airport trains between London Paddington and Heathrow's terminals, every
// fifteen minutes, nonstop to the airport. One fleet: the Bombardier Class
// 387/1 Electrostar, four cars, usually two units coupled. The timetable
// names no unit, so a train is drawn as that fleet, labeled as typical.
// Trainsheet's own side views from published dimensions, at the shared scale
// (js/carart.js), in Heathrow Express's purple, lettered here (no logo
// files). The toolkit from avanti.cars.js; the Electrostar is redrawn here
// in Heathrow Express paint (gwr.cars.js, greatnorthern.cars.js and
// gatwickexpress.cars.js do not export theirs).

import { rect, path, pantograph } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Heathrow Express since 2020, drawn from memory and not checked against
// photographs: deep purple all over (the railroad's #532e63), with no
// window band; a gray roof and a charcoal skirt; a paler violet sweep
// rising behind each cab; doors in silver gray; "Heathrow Express" in white
// under the windows mid-car, "Heathrow" heavy and "Express" light; the flat
// gangwayed front yellow round a black windshield mask. A pale line over
// the windows marks Business First.
const HX = { purple: "#532e63", sweep: "#7a4f8f", door: "#b9bbc2", white: "#f6f4f2", band: "#1f2126", skirt: "#2f2c35", roof: "#8a9096", trim: "#aeb3b9", silver: "#d6cedc", edge: "#6d7078" };

// The name, mixed case, h ft tall, centered on x; reads left to right on a
// mirrored car too.
const name = (c, x, y, h = 1.25) => letters(c, x, y, h, "Heathrow<tspan font-weight=\"300\" dx=\"0.22em\">Express</tspan>", HX.white, { weight: 700, spacing: "0.01em" });
// The class, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, HX.silver, { weight: 600, spacing: "0.06em" });
const side = (roof, sill, more = "") => (c, g) => bands(g.L, [[0, 20, HX.purple], [roof - 0.6, 3, HX.roof], [0, sill, HX.skirt]]) + more;

// ---------- Bombardier Electrostar: Class 387/1 ----------
// Bombardier's (Derby) last Electrostar. Heathrow Express's twelve units
// (387 130-141) were built in 2016-2017 for Great Western and refitted in
// 2019-2020 for the airport trains, in place of the Class 332s, with
// Business First, luggage stacks and ETCS: four cars of 20.39 m
// (DMSO-MSO-PTSO-DMSO), 2.80 m wide, 3.77 m tall, 110 mph, 1.68 MW; run
// here on 25 kV overhead wire, the pantograph on the third car (the
// trailer); a flat cab front with a gangway door, so that coupled units can
// be walked through; two double-leaf sliding plug doors a side at the
// thirds of each car; the motors under the two driving cars and the second
// car. (Wikipedia, "British Rail Class 387". The range 130-141 and the
// Business First saloon's place in one driving car are from memory.)
const ES = { roof: ft(3.77), sill: 3.7, car: ft(20.39) };
const NOSE_387 = [[0.4, 3.2], [0.3, 6.5], ["q", 0.3, 7.4, 0.7, 8.1], [1.8, ES.roof - 0.77], ["q", 2.2, ES.roof, 3.6, ES.roof]];
const ES_DOOR = 4.4;
const plug = (x) => ({ x, w: ES_DOOR, y0: ES.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: HX.door });
// The dark lines down a door's edges.
const doorEdge = (x) => rect(x + 0.12, ES.sill + 0.2, 0.14, 6.7, HX.edge) + rect(x + ES_DOOR - 0.26, ES.sill + 0.2, 0.14, 6.7, HX.edge);
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.4, 5.2), ...spread(d1 + ES_DOOR + 0.8, d2 - 0.8, 4.4, 5.2), ...spread(d2 + ES_DOOR + 0.8, b, 4.4, 5.2)], y: 6.95, w: 4.4, h: 2.85, r: 0.4 }];
// The paler violet sweep behind the cab, rising from the skirt to the roof.
const sweep = () => path(`M7.9 ${ES.sill}Q11.6 5.6 13.2 ${ES.roof - 0.6}L15.6 ${ES.roof - 0.6}Q14.2 5.4 10.9 ${ES.sill}Z`, HX.sweep);
// The line over the windows that marks Business First.
const firstLine = (a, b) => rect(a, 10.25, b - a, 0.2, HX.silver);

// o.first: the Business First saloon, behind the cab as far as the first doors.
function esCab(c, o = {}) {
  const L = c.L, d1 = 17.0, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_387, rake: [[0.8, 8.3], [1.7, ES.roof - 1.07]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: bays(8.8, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(ES.roof, ES.sill, sweep() + yellowEnd(2.6, 3.2, ES.roof - 0.6) + path(`M0.6 8.1L1.8 ${ES.roof - 0.77}L4.4 ${ES.roof - 0.77}L4.4 8.1Z`, HX.band)), surround: HX.band,
    extra: (cc, g) => fairing(3.6, g.L - 1.0, ES.roof, HX.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, ES.sill, 3, 1.3) +
      doorEdge(d1) + doorEdge(d2) +
      // The cab's side window and door.
      rect(3.4, 8.2, 1.7, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.14)", 0.5) +
      (o.first ? firstLine(8.4, d1 - 0.5) : "") +
      name(cc, (d1 + ES_DOOR + d2) / 2, 5.05) + classNo(cc, g.L - 8, 3.05, "387") });
}
// o.pan: the pantograph, raised, and the transformer (the third car).
// o.motor: traction gear under the floor (the second).
function esMid(c, o = {}) {
  const L = c.L, d1 = 14.6, d2 = L - 19.0;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: bays(1.6, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(ES.roof, ES.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, ES.roof, HX.trim) +
      (o.pan ? pantograph(13, ES.roof + 0.29, { up: true, facing: -1 }) + hvLine(16, 24, ES.roof + 0.29) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, o.pan ? 2 : 3, 1.3) + doorEdge(d1) + doorEdge(d2) + name(cc, (d1 + ES_DOOR + d2) / 2, 5.05) });
}

// ---------- Tables ----------

// Each car kind is its own type, placed in the formation, with its own fact
// sheet. Business First is the saloon of one driving car.
export const TYPES = {
  hx387First: { name: "Class 387 Electrostar driving car, Business First", kind: "emu", amenities: ["first"] },
  hx387Motor: { name: "Class 387 Electrostar motor car", kind: "emu" },
  hx387Pan: { name: "Class 387 Electrostar pantograph car", kind: "emu", pan: true },
  hx387Cab: { name: "Class 387 Electrostar driving car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  hx387First: M((c) => esCab(c, { first: true }), ES.car, true),
  hx387Motor: M((c) => esMid(c, { motor: true }), ES.car),
  hx387Pan: M((c) => esMid(c, { pan: true }), ES.car),
  hx387Cab: M((c) => esCab(c), ES.car, true),
};

// Units by number (class and serial run together): 387 130-141. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  heathrowexpress: [[387130, 387141, "hx387First"]],
};

const set = (label, ...units) => ({ label, units });
const E387 = set("Class 387/1 Electrostar: four cars, electric; usually two units coupled",
  ["hx387First", 1], ["hx387Motor", 1], ["hx387Pan", 1], ["hx387Cab", 1]);

// The only fleet: every Heathrow Express train is a 387/1.
export const TYPICAL = {
  heathrowexpress: () => E387,
};

const W387 = "https://en.wikipedia.org/wiki/British_Rail_Class_387";
const f387 = { model: "Bombardier Class 387/1 Electrostar", type: "Electric multiple unit", builder: "Bombardier Transportation (Derby)", built: "2016–2017",
  fleet: "12 four-car units (387 130–141)", topSpeedMph: 110, powerHp: 2253, source: W387 };
export const FACTS = {
  hx387First: { ...f387, lengthFt: 267.6,
    about: "A driving motor car of the Heathrow Express Electrostar, with the Business First saloon behind its cab. The units were built for Great Western and refitted for the airport trains, which they took over from the Class 332s in December 2020. Its flat front carries a gangway door, so that coupled units can be walked through from end to end." },
  hx387Motor: { ...f387,
    about: "The second car, a motor car, with traction gear under its floor. Two double plug doors a side at the thirds of the car, with luggage stacks beside them for the airport's passengers." },
  hx387Pan: { ...f387,
    about: "The third car, a trailer, carries the pantograph and the transformer for the 25 kV overhead wire the trains run under from Paddington to the airport's tunnels." },
  hx387Cab: { ...f387,
    about: "The driving motor car at the other end of the unit, all Standard. Trains are usually eight cars, two units coupled; Great Western Railway runs them for Heathrow Airport." },
};
