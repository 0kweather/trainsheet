// Southern's cars (scripts/railroads/gb.py, "southern"): the trains out of
// Victoria and London Bridge to Surrey, Sussex and the coast. Two fleets:
// the Bombardier Class 377 Electrostar, the third-rail train of nearly
// every Southern service, in three, four and five cars (usually two or
// three units coupled), and the Class 171 Turbostar, the diesel of the two
// lines without a third rail, to Uckfield and across the Marsh from
// Ashford to Hastings. The timetable names no unit, so a train is drawn as
// the fleet that usually runs it, labeled as typical. Trainsheet's own side
// views from published dimensions, at the shared scale (js/carart.js), in
// Southern's white and green, lettered here (no logo files). The toolkit
// from avanti.cars.js; the Electrostar is redrawn here in Southern paint
// (gwr.cars.js and greatnorthern.cars.js do not export their 387s) and the
// Turbostar too (crosscountry.cars.js does not export its 170).

import { rect, path } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Southern since 2003-2004, drawn from memory and not checked against
// photographs: white sides with no window band, a gray roof and a charcoal
// skirt; a dark green band along the foot of the side with a fine light
// green line over it; doors dark green; behind each cab two green arcs
// rising from the band, a light green one and a dark one inside it; the
// name in white capitals on a dark green lozenge under the windows; the
// flat front yellow round a black windshield mask. The light green is the
// railroad's color (#8cc63e).
const SN = { white: "#f5f6f3", green: "#00573f", deep: "#00432f", lime: "#8cc63e", band: "#1f2126", skirt: "#33363b", roof: "#8d9398", trim: "#aeb3b9", silver: "#c9cdd2" };

// Southern's name on its lozenge, centered on x; reads left to right on a
// mirrored car too.
const name = (c, x, y) => rect(x - 4.3, y - 0.68, 8.6, 1.36, SN.green, 0, 'rx="0.68"') +
  letters(c, x, y, 0.8, "SOUTHERN", SN.white, { weight: 700, spacing: "0.08em" });
// The class, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, SN.silver, { weight: 600, spacing: "0.06em" });
// The side: white, the green band and its light line along the foot.
const side = (roof, sill, more = "") => (c, g) => bands(g.L, [[0, 20, SN.white], [roof - 0.6, 3, SN.roof], [sill, 0.95, SN.green], [sill + 0.95, 0.22, SN.lime], [0, sill, SN.skirt]]) + more;
// The two arcs behind a cab, rising from the band between x0 and x1.
const arcs = (x0, x1, sill) => { const y = sill + 0.95, m = (x0 + x1) / 2;
  return path(`M${x0} ${y}Q${m} ${y + 4.0} ${x1} ${y}Z`, SN.lime) + path(`M${x0 + 1.1} ${y}Q${m - 0.6} ${y + 2.5} ${x1 - 2.6} ${y}Z`, SN.green); };

// ---------- Bombardier Electrostar: Class 377 ----------
// Built at Derby by Bombardier, 2001-2014: steel-framed aluminium cars of
// 20.4 m, 2.80 m wide, 3.78 m tall, 100 mph; a flat cab front with a
// gangway door, so that coupled units can be walked through; two
// double-leaf sliding plug doors a side at the thirds of each car. Four
// cars in the 377/1, /2 and /4 (DMOS-MOSL-PTOSL-DMOS, 1,200 kW), three in
// the 377/3 (DMOS-PTOSL-DMOS, 800 kW), five in the 377/6 and /7
// (DMOS-MOSL-PTOSL-MOS-DMOS, 1,400 kW). 750 V DC from the third rail, the
// shoes on the driving cars' trucks; the trailer's roof has a well for a
// pantograph, fitted only on the dual-voltage 377/2 and /7, so it is drawn
// empty. (Wikipedia, "British Rail Class 377". The unit ranges are from
// memory.)
const ES = { roof: ft(3.78), sill: 3.7, car: ft(20.4) };
const NOSE_377 = [[0.4, 3.2], [0.3, 6.5], ["q", 0.3, 7.4, 0.7, 8.1], [1.8, ES.roof - 0.77], ["q", 2.2, ES.roof, 3.6, ES.roof]];
const ES_DOOR = 4.4;
const plug = (x, sill = ES.sill) => ({ x, w: ES_DOOR, y0: sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: SN.green });
// The windows: three bays, one each side of the doors and a long one
// between them.
const bays = (a, d1, d2, b, w = 4.4, pitch = 5.2) => [{ xs: [...spread(a, d1 - 0.8, w, pitch), ...spread(d1 + ES_DOOR + 0.8, d2 - 0.8, w, pitch), ...spread(d2 + ES_DOOR + 0.8, b, w, pitch)], y: 6.95, w, h: 2.85, r: 0.4 }];
// A third-rail shoe beam, hung between a truck's axleboxes.
const shoe = (x) => rect(x - 2.3, 0.95, 4.6, 0.3, "#3b3f45", 0.3) + rect(x - 0.7, 0.5, 1.4, 0.45, "#6a4a2a", 0.3);

// text: the class as lettered on the skirt.
function esCab(c, text = "377") {
  const L = c.L, d1 = 17.0, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_377, rake: [[0.8, 8.3], [1.7, ES.roof - 1.07]], depth: 2.0, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: bays(8.8, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.8, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    // The front yellow from the skirt to the roof, round the windshield's mask.
    paint: side(ES.roof, ES.sill, arcs(7.8, d1 - 0.4, ES.sill) + yellowEnd(2.6, 3.2, ES.roof - 0.6) + path(`M0.6 8.1L1.8 ${ES.roof - 0.77}L4.4 ${ES.roof - 0.77}L4.4 8.1Z`, SN.band)), surround: SN.band,
    extra: (cc, g) => fairing(3.6, g.L - 1.0, ES.roof, SN.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, ES.sill, 3, 1.3) +
      shoe(9.8) + shoe(g.L - 9.2) +
      // The cab's side window and door.
      rect(3.4, 8.2, 1.7, 2.2, "#1d2026", 0.4) + rect(5.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.12)", 0.5) +
      name(cc, (d1 + ES_DOOR + d2) / 2, 5.85) + classNo(cc, g.L - 8, 3.05, text) });
}
// o.well: the trailer, its roof cut down at one end for a pantograph (none
// fitted) and the lavatory's blank panel in place of a window. o.motor:
// traction gear under the floor.
function esMid(c, o = {}) {
  const L = c.L, d1 = 14.6, d2 = L - 19.0;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: bays(1.6, d1, d2, L - 1.6), doors: [plug(d1), plug(d2)], trucks: [9.2, L - 9.2], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(ES.roof, ES.sill),
    extra: (cc, g) => (o.well ? fairing(21, g.L - 1.0, ES.roof, SN.trim) + rect(3.0, ES.roof - 0.42, 17.0, 0.45, "#6f757b", 0.4) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
      : fairing(1.0, g.L - 1.0, ES.roof, SN.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, o.motor ? 3 : 2, o.motor ? 1.3 : 1.5) + name(cc, (d1 + ES_DOOR + d2) / 2, 5.85) });
}

// ---------- Bombardier Turbostar: Class 171 ----------
// Built at Derby by Bombardier in 2003-2004, the Class 170 with Dellner
// couplers in place of BSI ones, so that an Electrostar can rescue it:
// cars of 23.62 m, 2.69 m wide, 3.77 m tall, an MTU 6R 183TD13H engine of
// 422 hp under each, driving through a hydraulic transmission; 100 mph;
// two double-leaf sliding plug doors a side, a third of the way in from
// each end; a short, upright cab with a raked windshield and no gangway
// through it; two or three cars. (Wikipedia, "British Rail Class 171".)
const TS = { roof: ft(3.77), sill: 3.8, car: ft(23.62) };
const NOSE_171 = [[0.5, 3.2], [0.35, 6.4], ["q", 0.4, 7.4, 1.1, 8.2], [3.6, 11.5], ["q", 4.2, TS.roof, 6.0, TS.roof]];
const tsRows = (a, d1, d2, b) => bays(a, d1, d2, b, 4.6, 5.5);
// The engine and its transmission on their raft, the fuel tank and the
// battery box behind.
const tsUnder = (g, a) => rect(a, 2.05, 15, 1.75, "#2b2e33", 0.4, 'rx="0.25"') + rect(a + 1.2, 2.4, 5.2, 1.0, "#44484e", 0.3) + rect(a + 7.6, 2.4, 6.0, 1.0, "#3a3d43", 0.3) +
  boxes(a + 17, g.L - 14, TS.sill, 2, 1.3);
function tsCab(c) {
  const L = c.L, d1 = 19.6, d2 = L - 23.0;
  return unit(c, { roof: TS.roof, sill: TS.sill, nose: NOSE_171, rake: [[1.3, 8.3], [3.4, 11.2]], depth: 2.6, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: tsRows(9.4, d1, d2, L - 1.6), doors: [plug(d1, TS.sill), plug(d2, TS.sill)], trucks: [10.4, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(TS.roof, TS.sill, arcs(9.2, d1 - 0.4, TS.sill) + yellowEnd(3.0, 3.2, 7.6) + path("M1.0 8.0L3.6 11.5L7.4 11.5L7.4 8.0Z", SN.band)), surround: SN.band,
    extra: (cc, g) => fairing(6.0, g.L - 1.0, TS.roof, SN.trim) + hvac(30, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 17) +
      // The cab's side window and door.
      rect(4.6, 8.1, 1.9, 2.3, "#1d2026", 0.4) + rect(7.0, 4.0, 1.9, 6.9, "rgba(0,0,0,0.14)", 0.5) +
      name(cc, (d1 + ES_DOOR + d2) / 2, 5.9) + classNo(cc, g.L - 8, 3.1, "171") });
}
function tsMid(c) {
  const L = c.L, d1 = 21.6, d2 = L - 26.0;
  return unit(c, { roof: TS.roof, sill: TS.sill,
    rows: tsRows(1.6, d1, d2, L - 1.6), doors: [plug(d1, TS.sill), plug(d2, TS.sill)], trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: side(TS.roof, TS.sill),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, TS.roof, SN.trim) + hvac(g.L / 2 - 6, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 15) +
      name(cc, (d1 + ES_DOOR + d2) / 2, 5.9) });
}

// ---------- Tables ----------

// Both fleets are drawn all Standard (Southern withdrew First Class).
// Each car kind is its own type, placed in the formation, with its own
// fact sheet; each formation has its own driving car, so that a unit's
// number picks its length. The Electrostars are drawn without a
// pantograph, the Turbostars are diesel: kind "emu" without pan.
export const TYPES = {
  sn377Cab: { name: "Class 377 Electrostar driving car", kind: "emu" },
  sn3773Cab: { name: "Class 377/3 Electrostar driving car", kind: "emu" },
  sn3776Cab: { name: "Class 377/6 Electrostar driving car", kind: "emu" },
  sn377Motor: { name: "Class 377 Electrostar motor car", kind: "emu" },
  sn377Trailer: { name: "Class 377 Electrostar trailer car", kind: "emu" },
  sn171Cab: { name: "Class 171 Turbostar driving car", kind: "emu" },
  sn1718Cab: { name: "Class 171/8 Turbostar driving car", kind: "emu" },
  sn171Mid: { name: "Class 171/8 Turbostar intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  sn377Cab: M((c) => esCab(c), ES.car, true),
  sn3773Cab: M((c) => esCab(c, "377/3"), ES.car, true),
  sn3776Cab: M((c) => esCab(c, "377/6"), ES.car, true),
  sn377Motor: M((c) => esMid(c, { motor: true }), ES.car),
  sn377Trailer: M((c) => esMid(c, { well: true }), ES.car),
  sn171Cab: M(tsCab, TS.car, true),
  sn1718Cab: M(tsCab, TS.car, true),
  sn171Mid: M(tsMid, TS.car),
};

// Units by number (class and serial run together), from memory: 377
// 101-164, 201-215 and 401-475 of four cars, 301-328 of three, 601-626 and
// 701-708 of five; 171 201 and 727-730 of two cars, 801-812 of three
// (Wikipedia's fleet numbers). The timetable names no unit; these are for
// the fleet pages.
export const FLEETS = {
  southern: [[377101, 377164, "sn377Cab"], [377201, 377215, "sn377Cab"], [377301, 377328, "sn3773Cab"], [377401, 377475, "sn377Cab"],
    [377601, 377626, "sn3776Cab"], [377701, 377708, "sn3776Cab"],
    [171201, 171201, "sn171Cab"], [171727, 171730, "sn171Cab"], [171801, 171812, "sn1718Cab"]],
};

const set = (label, ...units) => ({ label, units });
const E377 = set("Class 377 Electrostar: four cars, third-rail electric; usually two or three units coupled",
  ["sn377Cab", 1], ["sn377Motor", 1], ["sn377Trailer", 1], ["sn377Cab", 1]);
const E3773 = set("Class 377/3 Electrostar: three cars, third-rail electric; usually coupled to other units",
  ["sn3773Cab", 1], ["sn377Trailer", 1], ["sn3773Cab", 1]);
const E3776 = set("Class 377/6 Electrostar: five cars, third-rail electric; often two units coupled",
  ["sn3776Cab", 1], ["sn377Motor", 1], ["sn377Trailer", 1], ["sn377Motor", 1], ["sn3776Cab", 1]);
const T171 = set("Class 171 Turbostar: two cars, diesel", ["sn171Cab", 2]);
const T1718 = set("Class 171/8 Turbostar: three cars, diesel", ["sn1718Cab", 1], ["sn171Mid", 1], ["sn1718Cab", 1]);
const BY_MODEL = { sn377Cab: E377, sn377Motor: E377, sn377Trailer: E377, sn3773Cab: E3773, sn3776Cab: E3776, sn171Cab: T171, sn1718Cab: T1718, sn171Mid: T1718 };

// By the reported unit; else the four-car 377, which runs the most trains:
// the main line to Brighton, the Coastway lines each side of it, the Arun
// Valley, and much of the South London suburban service (the five-car
// 377/6s and /7s mostly there, the /7s on to Milton Keynes under the
// wires). The 171s run only London Bridge to Uckfield and Ashford to
// Eastbourne. The timetable does not say which train is which, so the
// label says "usually".
export const TYPICAL = {
  southern: (t, reported) => BY_MODEL[reported] || E377,
};

const W377 = "https://en.wikipedia.org/wiki/British_Rail_Class_377";
const W171 = "https://en.wikipedia.org/wiki/British_Rail_Class_171";
const f377 = { model: "Bombardier Class 377 Electrostar", type: "Electric multiple unit", builder: "Bombardier Transportation (Derby)", built: "2001–2014",
  topSpeedMph: 100, source: W377 };
const f171 = { model: "Bombardier Class 171 Turbostar", type: "Diesel multiple unit", builder: "Bombardier Transportation (Derby)", built: "2003–2004",
  topSpeedMph: 100, source: W171 };
export const FACTS = {
  sn377Cab: { ...f377, powerHp: 1609, lengthFt: 267.7,
    about: "A driving motor car of Southern's four-car Electrostar, the train of the Brighton Main Line and the Sussex coast since the slam-door stock went in 2005. Its flat front carries a gangway door, so that two or three coupled units can be walked through; trains split and join on the way, at Haywards Heath and Horsham among others." },
  sn3773Cab: { ...f377, model: "Bombardier Class 377/3 Electrostar", fleet: "28 three-car units", powerHp: 1073, lengthFt: 200.8,
    about: "A driving motor car of the three-car 377/3, built as the Class 375/3 and renumbered when its couplers were changed. With no motor car between them, the two driving cars do all the work; the units make up seven- and eleven-car trains with the four-car sets, and run the Coastway locals on their own." },
  sn3776Cab: { ...f377, model: "Bombardier Class 377/6 and 377/7 Electrostar", built: "2012–2014", fleet: "34 five-car units", powerHp: 1877, lengthFt: 334.6,
    about: "A driving motor car of the five-car Electrostars built for the South London suburban lines, where two make a ten-car train. The 377/7s also take 25 kV from overhead wires, for the trains from Croydon through Kensington Olympia to Watford and Milton Keynes." },
  sn377Motor: { ...f377,
    about: "A motor car, with traction gear under its floor and a lavatory at one end. Two double plug doors a side at the thirds of the car, as on every Electrostar." },
  sn377Trailer: { ...f377,
    about: "The trailer: no motors, and one end of its roof cut down into a well where a pantograph and its transformer can go. Most of Southern's Electrostars have never carried one, taking 750 V from the third rail through shoes on the driving cars' trucks." },
  sn171Cab: { ...f171, fleet: "5 two-car units", powerHp: 844, seats: 107, lengthFt: 155,
    about: "A driving car of Southern's diesel Turbostar, for the two lines its third rail never reached: Hurst Green to Uckfield, and the Marshlink between Ashford and Ore. A Class 170 with the Electrostars' Dellner coupler, an engine under every car." },
  sn1718Cab: { ...f171, fleet: "12 three-car units", powerHp: 1266, lengthFt: 232.5,
    about: "A driving car of the three-car 171/8, mostly on the London Bridge to Uckfield trains, where units run coupled in the peaks." },
  sn171Mid: { ...f171, fleet: "12 three-car units", powerHp: 1266,
    about: "The middle car of a three-car Turbostar: no cab, its own engine under the floor, and two double plug doors a side." },
};
