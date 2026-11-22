// Gatwick Express's cars (scripts/railroads/gb.py, "gatwickexpress"): the
// airport trains between London Victoria, Gatwick Airport and Brighton. One
// fleet: the Bombardier Class 387/2 Electrostar, four cars, usually two or
// three units coupled. The timetable names no unit, so a train is drawn as
// that fleet, labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in Gatwick Express's red,
// lettered here (no logo files). The toolkit from avanti.cars.js; the
// Electrostar is redrawn here in Gatwick Express paint (gwr.cars.js,
// greatnorthern.cars.js and southern.cars.js do not export theirs).

import { rect, path, pantograph } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Gatwick Express since 2016, drawn from memory and not checked against
// photographs: red all over (the railroad's #eb1e2d, toned down a little),
// with no window band; a gray roof and a charcoal skirt; a darker red sweep
// rising behind each cab; doors in a deeper red with a pale line down their
// edges; "Gatwick Express" in white under the windows mid-car, "Gatwick"
// heavy and "Express" light; the flat gangwayed front yellow round a black
// windshield mask. A pale line over the windows marks First.
const GX = { red: "#d81f2c", deep: "#a3141f", door: "#b81824", white: "#f6f4f2", band: "#1f2126", skirt: "#33363b", roof: "#8a9096", trim: "#aeb3b9", silver: "#d9c9cb" };

// The name, mixed case, h ft tall, centered on x; reads left to right on a
// mirrored car too.
const name = (c, x, y, h = 1.25) => letters(c, x, y, h, "Gatwick<tspan font-weight=\"300\" dx=\"0.22em\">Express</tspan>", GX.white, { weight: 700, spacing: "0.01em" });
// The class, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, GX.silver, { weight: 600, spacing: "0.06em" });
const side = (roof, sill, more = "") => (c, g) => bands(g.L, [[0, 20, GX.red], [roof - 0.6, 3, GX.roof], [0, sill, GX.skirt]]) + more;

// ---------- Bombardier Electrostar: Class 387/2 ----------
// Bombardier's (Derby) last Electrostar; the 387/2s were built in 2015-2016
// for Gatwick Express, 27 units (387 201-227) in place of the Class 442s:
// four cars of 20.39 m (DMCO-MSO-PTSO-DMSO), 2.80 m wide, 3.77 m tall,
// 110 mph, 1.68 MW; built for 25 kV overhead and 750 V third rail, and run
// here on the third rail alone, the pantograph on the third car (the
// trailer) kept down; a flat cab front with a gangway door, so that coupled
// units can be walked through; two double-leaf sliding plug doors a side at
// the thirds of each car; the motors under the two driving cars and the
// second car; luggage stacks by the doors. (Wikipedia, "British Rail Class
// 387". The range 201-227 and the First saloon's place in one driving car
// are from memory.)
const ES = { roof: ft(3.77), sill: 3.7, car: ft(20.39) };
const NOSE_387 = [[0.4, 3.2], [0.3, 6.5], ["q", 0.3, 7.4, 0.7, 8.1], [1.8, ES.roof - 0.77], ["q", 2.2, ES.roof, 3.6, ES.roof]];
const ES_DOOR = 4.4;
const plug = (x) => ({ x, w: ES_DOOR, y0: ES.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: GX.door });
// The pale lines down a door's edges.
const doorEdge = (x) => rect(x + 0.12, ES.sill + 0.2, 0.14, 6.7, GX.silver) + rect(x + ES_DOOR - 0.26, ES.sill + 0.2, 0.14, 6.7, GX.silver);
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.4, 5.2), ...spread(d1 + ES_DOOR + 0.8, d2 - 0.8, 4.4, 5.2), ...spread(d2 + ES_DOOR + 0.8, b, 4.4, 5.2)], y: 6.95, w: 4.4, h: 2.85, r: 0.4 }];
// The darker red sweep behind the cab, rising from the skirt to the roof.
const sweep = () => path(`M7.9 ${ES.sill}Q11.6 5.6 13.2 ${ES.roof - 0.6}L15.6 ${ES.roof - 0.6}Q14.2 5.4 10.9 ${ES.sill}Z`, GX.deep);
// The third rail's shoe beam, between a truck's axles.
const shoe = (x) => rect(x - 2.3, 0.95, 4.6, 0.34, "#5a5d62", 0.4) + rect(x - 0.7, 0.55, 1.4, 0.4, "#3a3c40", 0.4);
// The line over the windows that marks First.
const firstLine = (a, b) => rect(a, 10.25, b - a, 0.2, GX.silver);

// o.first: the First saloon, behind the cab as far as the first doors.
function esCab(c, o = {}) {
  const L = c.L, d1 = 17.0, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_387, rake: [[0.8, 8.3], [1.7, ES.roof - 1.07]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: bays(8.8, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(ES.roof, ES.sill, sweep() + yellowEnd(2.6, 3.2, ES.roof - 0.6) + path(`M0.6 8.1L1.8 ${ES.roof - 0.77}L4.4 ${ES.roof - 0.77}L4.4 8.1Z`, GX.band)), surround: GX.band,
    extra: (cc, g) => fairing(3.6, g.L - 1.0, ES.roof, GX.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, ES.sill, 3, 1.3) +
      shoe(9.8) + shoe(g.L - 9.2) + doorEdge(d1) + doorEdge(d2) +
      // The cab's side window and door.
      rect(3.4, 8.2, 1.7, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.14)", 0.5) +
      (o.first ? firstLine(8.4, d1 - 0.5) : "") +
      name(cc, (d1 + ES_DOOR + d2) / 2, 5.05) + classNo(cc, g.L - 8, 3.05, "387") });
}
// o.pan: the pantograph, down, and the transformer (the third car).
// o.motor: traction gear under the floor (the second).
function esMid(c, o = {}) {
  const L = c.L, d1 = 14.6, d2 = L - 19.0;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: bays(1.6, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(ES.roof, ES.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, ES.roof, GX.trim) +
      (o.pan ? pantograph(13, ES.roof + 0.29, { up: false, facing: -1 }) + hvLine(16, 24, ES.roof + 0.29) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, o.pan ? 2 : 3, 1.3) + doorEdge(d1) + doorEdge(d2) + name(cc, (d1 + ES_DOOR + d2) / 2, 5.05) });
}

// ---------- Tables ----------

// Each car kind is its own type, placed in the formation, with its own fact
// sheet. First is a small saloon in one driving car.
export const TYPES = {
  gx387First: { name: "Class 387 Electrostar driving car, First and Standard", kind: "emu", amenities: ["first"] },
  gx387Motor: { name: "Class 387 Electrostar motor car", kind: "emu" },
  gx387Pan: { name: "Class 387 Electrostar pantograph car", kind: "emu" },
  gx387Cab: { name: "Class 387 Electrostar driving car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  gx387First: M((c) => esCab(c, { first: true }), ES.car, true),
  gx387Motor: M((c) => esMid(c, { motor: true }), ES.car),
  gx387Pan: M((c) => esMid(c, { pan: true }), ES.car),
  gx387Cab: M((c) => esCab(c), ES.car, true),
};

// Units by number (class and serial run together): 387 201-227. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  gatwickexpress: [[387201, 387227, "gx387First"]],
};

const set = (label, ...units) => ({ label, units });
const E387 = set("Class 387/2 Electrostar: four cars, electric, on the third rail; usually two or three units coupled",
  ["gx387First", 1], ["gx387Motor", 1], ["gx387Pan", 1], ["gx387Cab", 1]);

// The only fleet: every Gatwick Express train is a 387/2.
export const TYPICAL = {
  gatwickexpress: () => E387,
};

const W387 = "https://en.wikipedia.org/wiki/British_Rail_Class_387";
const f387 = { model: "Bombardier Class 387/2 Electrostar", type: "Electric multiple unit", builder: "Bombardier Transportation (Derby)", built: "2015–2016",
  fleet: "27 four-car units (387/2)", topSpeedMph: 110, powerHp: 2253, source: W387 };
export const FACTS = {
  gx387First: { ...f387, lengthFt: 267.6,
    about: "A driving motor car of the Gatwick Express Electrostar, with the small First saloon behind its cab. The 387/2s took over the Victoria to Gatwick Airport and Brighton trains in 2016 from the Class 442s. Its flat front carries a gangway door, so that coupled units can be walked through from end to end." },
  gx387Motor: { ...f387,
    about: "The second car, a motor car, with traction gear under its floor. Two double plug doors a side at the thirds of the car, with luggage stacks beside them for the airport's passengers." },
  gx387Pan: { ...f387,
    about: "The third car, a trailer, carries a pantograph and a transformer for 25 kV overhead wire. Gatwick Express runs wholly on the 750 V third rail, so the pantograph stays down." },
  gx387Cab: { ...f387,
    about: "The driving motor car at the other end of the unit, all Standard. Trains are usually eight or twelve cars: two or three units coupled." },
};
