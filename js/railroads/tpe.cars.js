// TransPennine Express's cars (scripts/railroads/gb.py, "tpe"): the Class
// 802/2 Nova 1 (Hitachi, five cars, bi-mode) on the North TransPennine
// route from Liverpool and Manchester to York, Newcastle and Edinburgh; the
// Class 185 Desiro (Siemens, three cars, diesel) across the Pennines to
// Hull, Scarborough, Saltburn and Cleethorpes; and the Class 397 Nova 2
// (CAF Civity, five cars, electric) from Manchester Airport and Liverpool up
// the West Coast Main Line to Glasgow and Edinburgh. The timetable names no
// unit, so a train is drawn as the model that usually runs it, labeled as
// typical. Trainsheet's own side views from published dimensions, at the
// shared scale (js/carart.js), in TransPennine Express's silver and blues,
// lettered here (no logo files). The toolkit and the Hitachi AT300 body
// from avanti.cars.js; the diesel Desiro and the Civity are new here.

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { n, seq, bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust, AT300, at300Cab, at300Mid } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// TransPennine Express since 2016 (FirstGroup's franchise, the state's
// operator since May 2023; its blue on the map is #09a4ec), drawn from
// memory of the trains, not checked against photographs: silver-gray
// sides, the roof a darker gray; a charcoal skirt; the windows in a
// near-black band; each cab end deep indigo, its trailing edge a sweeping
// curve followed by a stripe of purple and one of light blue; doors in the
// light blue, to stand out from the side as the accessibility rules ask; a
// yellow panel on each cab front under a black windshield. "TransPennine
// Express" on the side under the windows in indigo, the first word heavy.
const TP = { silver: "#c8ccd2", roof: "#70767e", band: "#16171f", skirt: "#2a2c33", indigo: "#1c1b58", purple: "#7b2d8e", blue: "#09a4ec", trim: "#8a9098",
  white: "#f5f6f8" };
// TransPennine Express's name, the two words run together, the first heavy
// and the second light; centered on x, h ft tall.
const tpe = (c, x, y, h, fill = TP.indigo) => letters(c, x, y, h, 'TransPennine<tspan font-weight="400">Express</tspan>', fill, { weight: 800, spacing: "-0.01em" });
// A car's class over its windows: "FIRST" in purple (Standard goes unmarked).
const classMark = (c, x, y, cls) => (cls === "first" ? letters(c, x, y, 0.6, "FIRST", TP.purple, { weight: 700, spacing: "0.14em" }) : "");
// A unit's class number, small in gray near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, TP.roof, { weight: 600, spacing: "0.06em" });
// A stripe following the cab end's curve: w ft wide, its leading edge
// leaving the roof at x and reaching the skirt 9 ft further back.
const curve = (x, w, sill, fill) => path(`M${n(x)} 13Q${n(x + 3)} ${n(sill + 3.2)} ${n(x + 9)} ${sill}L${n(x + 9 + w)} ${sill}Q${n(x + 3 + w)} ${n(sill + 3.2)} ${n(x + w)} 13Z`, fill);
// The cab end: indigo back to the curve that starts at x on the roof, then
// the purple and the light blue stripes.
const cabEnd = (x, sill) => path(`M-1 ${sill}L-1 13L${n(x)} 13Q${n(x + 3)} ${n(sill + 3.2)} ${n(x + 9)} ${sill}Z`, TP.indigo) +
  curve(x, 2.3, sill, TP.purple) + curve(x + 2.3, 1.5, sill, TP.blue);
// The side: silver, a darker roof, the near-black window band from o.band
// up to o.bandTop, the skirt; on a cab car the indigo end from o.end.
const tpPaint = (o, cab, cabArt = "") => (c, g) => bands(g.L, [[0, 20, TP.silver], [o.roof - 0.6, 3, TP.roof], [o.band, o.bandTop - o.band, TP.band], [0, o.sill, TP.skirt]]) +
  (cab ? cabEnd(o.end, o.sill) + cabArt : "");
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- Class 802/2 Nova 1 ----------
// Hitachi's AT300, built at Pistoia and Kasado in 2017-2020: five aluminium
// cars, the driving cars 25.7 m and the intermediates 26 m, 129.4 m a set;
// 25 kV overhead and three MTU 12V 1600 R80L diesel engines of 700 kW, one
// under each intermediate car; 125 mph. 342 seats, 24 First in one driving
// car, 318 Standard. Two single-leaf pocket sliding doors a side on each
// car. (Wikipedia, "British Rail Class 802".) The body is the shared AT300
// (avanti.cars.js).
const N1 = { cab: ft(25.7), mid: AT300.mid };
const NOVA1 = {
  door: TP.blue, surround: TP.band, roofTrim: TP.trim,
  paint: (cab) => tpPaint({ roof: AT300.roof, sill: AT300.sill, band: 6.4, bandTop: 9.85, end: 27.5 }, cab,
    // The windshield's black mask and the yellow panel under it.
    path("M3.0 7.1Q7.4 8.9 11.6 10.7L21.8 10.7L21.8 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", TP.band) + yellowEnd(7.2, 2.9, 6.7)),
  over: (c, g, cab) => (cab ? tpe(c, 60, 4.75, 1.3) + classNo(c, g.L - 9, 4.2, "802") : tpe(c, g.L / 2, 4.75, 1.3)) +
    classMark(c, cab ? 60 : g.L / 2, 10.55, c.cls),
};

// ---------- Class 185 Desiro ----------
// Siemens's Desiro UK diesel train, built at Krefeld in 2005-2006 for the
// TransPennine routes: three aluminium cars of 23.763 m on two trucks each,
// 71.276 m a set, 2.673 m wide, 3.710 m tall, the floor 1.247 m over the
// rail; a Cummins QSK19-R of 561 kW under every car, driving through a
// hydraulic transmission; 100 mph. Formation DMOSB-MOSL-DMOCLW: 169 seats,
// 15 First in one driving car, 154 Standard. Two bi-parting sliding plug
// doors a side, a third of the way in from each end; a full-width rounded
// cab with no gangway through it. (Wikipedia, "British Rail Class 185".)
const DES = { roof: 12.17, sill: 4.1, band: 6.9, bandTop: 10.1, end: 8.5, car: ft(23.763) };
const NOSE_185 = [[0.5, 3.2], [0.35, 6.0], ["q", 0.4, 7.2, 1.3, 8.1], [4.4, 11.3], ["q", 5.0, 12.17, 7.0, 12.17]];
const desPaint = (cab) => tpPaint(DES, cab, path("M1.2 8.0L4.4 11.3L8.6 11.3L8.6 8.0Z", TP.band) + yellowEnd(3.4, 3.2, 7.6));
const desDoor = (x) => ({ x, w: 4.3, y0: DES.sill, y1: 10.7, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: TP.blue });
// The windows: panes in three bays, one each side of the doors and a longer
// one between them.
const desRows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.5, 5.4), ...spread(d1 + 5.1, d2 - 0.8, 4.5, 5.4), ...spread(d2 + 5.1, b, 4.5, 5.4)], y: 7.15, w: 4.5, h: 2.7, r: 0.4 }];
// Under every car: the engine's raft, then the fuel tank and the rest.
const desUnder = (g, a) => raft(a, a + 16) + boxes(a + 18, g.L - 14, DES.sill, 2, 1.4);
function desCab(c) {
  const L = c.L, d1 = 21.6, d2 = L - 24.4;
  return unit(c, { roof: DES.roof, sill: DES.sill, nose: NOSE_185, rake: [[1.5, 8.3], [4.2, 11.0]], depth: 2.8, cabLen: 9, lampY: 5.0, low: 4.3,
    rows: desRows(11.4, d1, d2, L - 1.6), doors: [desDoor(d1), desDoor(d2)], trucks: [10.8, L - 9.6], wheel: 33, diaphragm: [4.3, 11.0],
    paint: desPaint(true), surround: TP.band,
    extra: (cc, g) => fairing(7.0, g.L - 1.0, DES.roof, TP.trim) + hvac(30, DES.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, DES.roof + 0.27) + desUnder(g, 17) +
      // The cab's side window and door.
      rect(5.4, 8.1, 2.0, 2.2, "#1d2026", 0.4) + rect(8.0, 4.3, 2.0, 6.5, "rgba(0,0,0,0.2)", 0.5) +
      tpe(cc, (d1 + 4.3 + d2) / 2, 5.3, 1.25) + classNo(cc, g.L - 9, 4.6, "185") + classMark(cc, (d1 + 4.3 + d2) / 2, 10.75, cc.cls) });
}
function desMid(c) {
  const L = c.L, d1 = 19.6, d2 = L - 23.9;
  return unit(c, { roof: DES.roof, sill: DES.sill,
    rows: desRows(1.6, d1, d2, L - 1.6), doors: [desDoor(d1), desDoor(d2)], trucks: [9.6, L - 9.6], wheel: 33, diaphragm: [4.3, 11.0],
    paint: desPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, DES.roof, TP.trim) + hvac(g.L / 2 - 6, DES.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, DES.roof + 0.27) + desUnder(g, 15) +
      tpe(cc, g.L / 2, 5.3, 1.25) });
}

// ---------- Class 397 Nova 2 ----------
// CAF's Civity intercity electric train, built at Beasain in 2017-2019:
// five aluminium cars on two trucks each, the driving cars 24.026 m and the
// intermediates 23.35 m, 118 m a set; 25 kV overhead; 125 mph; 780 mm
// wheels. Formation DMF-PTS-MS-PTS-DMS, a pantograph on each of the two
// trailers: 288 seats, 24 First in one driving car, 264 Standard. Two
// single-leaf sliding plug doors a side, one near each end of a car.
// (Wikipedia, "British Rail Class 397".) The height, about 3.85 m, and the
// shape of the tapered nose are from memory of the train.
const CIV = { roof: 12.6, sill: 3.8, band: 6.6, bandTop: 10.0, end: 21.5, cab: ft(24.026), mid: ft(23.35) };
const NOSE_397 = [[0.8, 3.0], [0.55, 4.6], ["q", 0.6, 6.2, 2.4, 7.5], [8.6, 11.3], ["q", 10.4, 12.6, 13.2, 12.6]];
const civPaint = (cab) => tpPaint(CIV, cab, path("M2.6 7.5Q5.8 9.2 8.6 11.3L16.4 11.3L16.4 7.6L8.0 7.4Q5.0 7.4 2.6 7.5Z", TP.band) + yellowEnd(6.0, 3.0, 7.0));
const civDoor = (x) => leaf(x, CIV.sill, 10.6, 2.9, TP.blue);
const civRows = (a, b) => [{ xs: spread(a, b, 4.8, 6.1), y: 6.9, w: 4.8, h: 2.8, r: 0.4 }];
function civCab(c) {
  const L = c.L;
  return unit(c, { roof: CIV.roof, sill: CIV.sill, nose: NOSE_397, rake: [[3.2, 7.9], [8.0, 11.0]], depth: 3.2, cabLen: 15, lampY: 4.8, low: 4.0,
    rows: civRows(23.8, L - 6.4), doors: [civDoor(18.9), civDoor(L - 4.6)], trucks: [12.4, L - 9.4], wheel: 31, diaphragm: [4.0, 11.2],
    paint: civPaint(true), surround: TP.band,
    extra: (cc, g) => fairing(13.2, g.L - 1.0, CIV.roof, TP.trim) + hvac(30, CIV.roof + 0.27, 13, 0.6) +
      // The traction gear under the motor car's floor.
      boxes(18, g.L - 15, CIV.sill, 4, 1.4) +
      // The cab's side window and door.
      path("M11.2 7.8L14.2 7.8L14.2 9.9L12.8 9.9Z", "#1d2026", 0.4) + rect(15.2, 4.0, 2.0, 6.4, "rgba(0,0,0,0.2)", 0.5) +
      tpe(cc, 52, 4.9, 1.3) + classNo(cc, g.L - 9, 4.3, "397") + classMark(cc, 52, 11.0, cc.cls) });
}
function civMid(c) {
  const L = c.L, pan = !!c.panCar;
  return unit(c, { roof: CIV.roof, sill: CIV.sill,
    rows: civRows(6.4, L - 6.4), doors: [civDoor(1.7), civDoor(L - 4.6)], trucks: [9.4, L - 9.4], wheel: 31, diaphragm: [4.0, 11.2],
    paint: civPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, CIV.roof, TP.trim) +
      // A trailer: the pantograph over one truck (the forward trailer's
      // raised), the transformer under the floor. The motor car: traction
      // gear under the floor.
      (pan ? pantograph(11, CIV.roof + 0.29, { up: !!cc.panUp, facing: -1 }) + hvLine(14, 23, CIV.roof + 0.29) + hvac(g.L - 27, CIV.roof + 0.27, 13, 0.6) + boxes(16, g.L - 16, CIV.sill, 2, 1.6)
        : hvac(9, CIV.roof + 0.27, 13, 0.6) + hvac(g.L - 24, CIV.roof + 0.27, 13, 0.6) + boxes(15, g.L - 15, CIV.sill, 4, 1.4)) +
      tpe(cc, g.L / 2, 4.9, 1.3) });
}

// ---------- Tables ----------

// TransPennine Express's classes: First (2+1) and Standard (2+2); every
// fleet has its First in one driving car. Each class is its own type,
// placed in the formation, with its own fact sheet. Diesel multiple units
// are kind "emu" (self-propelled, a cab at each end of the set) with no
// pantograph.
export const TYPES = {
  tp802First: { name: "Class 802 Nova 1 First end car", kind: "emu", pan: true, amenities: ["first"] },
  tp802Mid: { name: "Class 802 Nova 1 Standard car", kind: "emu" },
  tp802Cab: { name: "Class 802 Nova 1 Standard end car", kind: "emu", pan: true },
  tp185First: { name: "Class 185 Desiro First and Standard end car", kind: "emu", amenities: ["first"] },
  tp185Mid: { name: "Class 185 Desiro Standard car", kind: "emu" },
  tp185Cab: { name: "Class 185 Desiro Standard end car", kind: "emu" },
  tp397First: { name: "Class 397 Nova 2 First end car", kind: "emu", amenities: ["first"] },
  tp397Pan: { name: "Class 397 Nova 2 pantograph car", kind: "emu", pan: true },
  tp397Mid: { name: "Class 397 Nova 2 Standard car", kind: "emu" },
  tp397Cab: { name: "Class 397 Nova 2 Standard end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  // One pantograph up, on the First end; the other end's is down.
  tp802First: M((c) => at300Cab({ ...c, cls: "first", pan: true }, NOVA1), N1.cab, true),
  tp802Mid: M((c) => at300Mid({ ...c, engine: true }, NOVA1), N1.mid),
  tp802Cab: M((c) => at300Cab({ ...c, pan: false }, NOVA1), N1.cab, true),
  tp185First: M((c) => desCab({ ...c, cls: "first" }), DES.car, true),
  tp185Mid: M(desMid, DES.car),
  tp185Cab: M(desCab, DES.car, true),
  tp397First: M((c) => civCab({ ...c, cls: "first" }), CIV.cab, true),
  // The pantograph of the trailer next to the First end (car 2) is raised.
  tp397Pan: M((c) => civMid({ ...c, panCar: true, panUp: c.index === 1 }), CIV.mid, false, byIndex),
  tp397Mid: M(civMid, CIV.mid),
  tp397Cab: M(civCab, CIV.cab, true),
};

// Units by number: 802 201-219, 185 101-151 and 397 001-012 (Wikipedia).
// The timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  tpe: [[802201, 802219, "tp802First"], [185101, 185151, "tp185First"], [397001, 397012, "tp397First"]],
};

const set = (label, ...units) => ({ label, units });
const NOVA_1 = set("Class 802 Nova 1: five cars, electric and diesel; First at one end",
  ["tp802First", 1], ["tp802Mid", 3], ["tp802Cab", 1]);
const D185 = set("Class 185 Desiro: three cars, diesel; First in one end car",
  ["tp185First", 1], ["tp185Mid", 1], ["tp185Cab", 1]);
const NOVA_2 = set("Class 397 Nova 2: five cars, electric; First at one end",
  ["tp397First", 1], ["tp397Pan", 1], ["tp397Mid", 1], ["tp397Pan", 1], ["tp397Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("tp802") ? NOVA_1 : k.startsWith("tp397") ? NOVA_2 : D185;

// By the reported unit; else the Desiro, the largest fleet (51 sets), which
// works most trains across the Pennines, alone or two coupled. The Nova 1s
// run the long North route (Liverpool to Newcastle and Edinburgh, and
// Manchester Airport to Teesside), the Nova 2s the West Coast trains to
// Glasgow and Edinburgh. The timetable does not say which train is which,
// so the label says "usually".
export const TYPICAL = {
  tpe: (t, reported) => BY_MODEL[reported] || D185,
};

const W802 = "https://en.wikipedia.org/wiki/British_Rail_Class_802";
const W185 = "https://en.wikipedia.org/wiki/British_Rail_Class_185";
const W397 = "https://en.wikipedia.org/wiki/British_Rail_Class_397";
const nova1 = { model: "Hitachi Class 802/2 Nova 1 (AT300)", type: "Bi-mode multiple unit (electric and diesel)", builder: "Hitachi Rail (Pistoia and Kasado)", built: "2017–2020",
  fleet: "19 five-car units", topSpeedMph: 125, powerHp: 2816, seats: 342, source: W802 };
const d185 = { model: "Siemens Class 185 Desiro", type: "Diesel-hydraulic multiple unit", builder: "Siemens Transportation Systems (Krefeld)", built: "2005–2006",
  fleet: "51 three-car units", topSpeedMph: 100, powerHp: 2257, seats: 169, source: W185 };
const nova2 = { model: "CAF Class 397 Nova 2 (Civity)", type: "Electric multiple unit", builder: "CAF (Beasain)", built: "2017–2019",
  fleet: "12 five-car units", topSpeedMph: 125, seats: 288, source: W397 };
export const FACTS = {
  tp802First: { ...nova1, lengthFt: 424.5,
    about: "The Nova 1's First class driving car, seated 2+1. TransPennine Express's train for the North route: electric under the wires, diesel across the Pennines where there are none. A five-car set is 129.4 m long and seats 342 (24 First, 318 Standard). Each driving car carries a pantograph on its roof behind the cab." },
  tp802Mid: { ...nova1,
    about: "Standard class, seated 2+2, with a single sliding door a side at each end of the car. Each of the three intermediate cars has an MTU diesel engine of 700 kW under its floor." },
  tp802Cab: { ...nova1,
    about: "The Standard class driving car, at the other end of the set from First." },
  tp185First: { ...d185, lengthFt: 233.8,
    about: "The Desiro's driving car with First class (15 seats) behind the cab and Standard in the rest. Built for the TransPennine routes and at work on them since 2006; a three-car set is 71.3 m long and seats 169, and two often run coupled, with no way through between them." },
  tp185Mid: { ...d185,
    about: "The middle car, Standard class, with wide double doors a third of the way in from each end. Every car has its own Cummins diesel engine of 561 kW under the floor, power enough for the climbs over the Pennines." },
  tp185Cab: { ...d185,
    about: "The Standard class driving car, with the set's bicycle space." },
  tp397First: { ...nova2, lengthFt: 387.1,
    about: "The Nova 2's First class driving car, seated 2+1. An electric train for the West Coast Main Line, from Manchester Airport and Liverpool to Glasgow and Edinburgh, in service since November 2019; a five-car set is 118 m long and seats 288 (24 First, 264 Standard)." },
  tp397Pan: { ...nova2,
    about: "A trailer car, Standard class, carrying a pantograph on its roof and the transformer under its floor; the set has two." },
  tp397Mid: { ...nova2,
    about: "The motor car in the middle of the set, Standard class, seated 2+2, with a single plug door a side at each end of the car." },
  tp397Cab: { ...nova2,
    about: "The Standard class driving car, at the other end of the set from First." },
};
