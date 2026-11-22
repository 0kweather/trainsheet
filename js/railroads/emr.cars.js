// East Midlands Railway's cars (scripts/railroads/gb.py, "emr"): the Class
// 810 Aurora (Hitachi, five cars, bi-mode) on the Midland Main Line from
// London St Pancras to Nottingham and Sheffield; the Class 360 Desiro
// (Siemens, four cars, electric) of EMR Connect, London to Corby; and the
// Class 170 Turbostar (two and three cars, diesel) of EMR Regional. The
// timetable names no unit, so a train is drawn as the model that usually
// runs it, labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in EMR's aubergine,
// lettered here (no logo files). The toolkit and the Hitachi AT300 body
// from avanti.cars.js; the Desiro is new here, and the Turbostar is drawn
// again here in EMR's paint (CrossCountry's copy is not exported).

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust, AT300, at300Cab, at300Mid } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// East Midlands Railway since August 2019 (Abellio's franchise; its purple
// on the map is #703e69), drawn from memory of the trains, not checked
// against photographs: a deep aubergine purple all over, the roof darker; a
// charcoal skirt; the windows of the Aurora and the Desiro in a near-black
// band; doors in a pale lilac, to stand out from the side as the
// accessibility rules ask; a yellow panel on each cab front under a black
// windshield. "EMR" in heavy white capitals on the side, the service's name
// small beside it: "INTERCITY", "CONNECT" or "REGIONAL".
const EM = { purple: "#532a4d", deep: "#3f1f3a", roof: "#33202f", band: "#17141a", skirt: "#27242a", door: "#bfaec0", trim: "#5a4a58", white: "#f6f4f5",
  lilac: "#a98fa6", gold: "#c8a45a" };
// EMR's name: three heavy capitals in white, the service small after them;
// the pair centered on x, the capitals h ft tall.
const emr = (c, x, y, h, service = "") => letters(c, x, y, h,
  `EMR${service ? `<tspan font-size="0.42em" font-weight="500" dx="0.5em" letter-spacing="0.12em">${service}</tspan>` : ""}`, EM.white, { weight: 800, spacing: "0.04em" });
// A car's class over its windows: "FIRST" in gold (Standard goes unmarked).
const classMark = (c, x, y, cls) => (cls === "first" || cls === "comp" ? letters(c, x, y, 0.6, "FIRST", EM.gold, { weight: 700, spacing: "0.14em" }) : "");
// A unit's class number, small in lilac near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, EM.lilac, { weight: 600, spacing: "0.06em" });
// The side: purple, a darker roof, the skirt, and (o.band) a near-black
// window band from o.band up to o.bandTop.
const emPaint = (o, cabArt = "") => (c, g) => bands(g.L, [[0, 20, EM.purple], [o.roof - 0.6, 3, EM.roof],
  ...(o.band ? [[o.band, o.bandTop - o.band, EM.band]] : []), [0, o.sill, EM.skirt]]) + cabArt;
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- Class 810 Aurora ----------
// Hitachi's AT300 for the Midland Main Line, built at Newton Aycliffe from
// 2021: five aluminium cars of 24 m (2 m shorter than the other AT300s', to
// fit two sets in St Pancras's platforms), 120 m a set; 25 kV overhead and
// four MTU diesel engines of 735 kW under the floor; 125 mph. Formation
// DPTS-MS-TS-MC-DPTF: 301 seats, 47 First at one end, 254 Standard.
// (Wikipedia, "British Rail Class 810".) The body is the shared AT300
// (avanti.cars.js) at the 810's length; the engines are drawn under the
// three intermediate cars (which cars carry the four is not drawn from a
// source).
const AUR = { car: ft(24.0) };
const AURORA = {
  door: EM.door, surround: EM.band, roofTrim: EM.trim,
  paint: (cab) => emPaint({ roof: AT300.roof, sill: AT300.sill, band: 6.4, bandTop: 9.85 },
    // The cab end: the windshield's black mask and the yellow panel under it.
    cab ? path("M3.0 7.1Q7.4 8.9 11.6 10.7L21.8 10.7L21.8 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", EM.band) + yellowEnd(7.2, 2.9, 6.7) : ""),
  over: (c, g, cab) => (cab ? emr(c, 44, 5.1, 1.7, "INTERCITY") + classNo(c, g.L - 12, 4.5, "810") : emr(c, g.L / 2, 5.1, 1.7, "INTERCITY")) +
    classMark(c, cab ? 50 : g.L / 2, 10.55, c.cls),
};

// ---------- Class 360 Desiro ----------
// Siemens's Desiro UK electric train, built at Krefeld in 2002-2003 for
// First Great Eastern and EMR's since 2021: four aluminium cars of 20.34 m
// on two trucks each, 2.80 m wide, 3.95 m tall; 25 kV overhead, 1,550 kW
// at the wheels; 110 mph since EMR's regearing. Formation DMSO-PTSO-TSO-
// DMSO, the pantograph on the second car. Two bi-parting sliding plug doors
// a side, a third of the way in from each end; a full-width rounded cab
// with no gangway through it. (Wikipedia, "British Rail Class 360".)
const DES = { roof: 12.96, sill: 3.9, band: 6.7, bandTop: 10.25, car: ft(20.34) };
const NOSE_360 = [[0.5, 3.2], [0.35, 6.0], ["q", 0.4, 7.3, 1.3, 8.3], [4.6, 12.0], ["q", 5.2, 12.96, 7.2, 12.96]];
const desPaint = (cab) => emPaint(DES, cab ? path("M1.2 8.2L4.6 12.0L9.0 12.0L9.0 8.2Z", EM.band) + yellowEnd(3.4, 3.2, 7.7) : "");
const desDoor = (x) => ({ x, w: 4.3, y0: DES.sill, y1: 10.9, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: EM.door });
// The windows: panes in three bays, one each side of the doors and a longer
// one between them.
const desRows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.4, 5.3), ...spread(d1 + 5.1, d2 - 0.8, 4.4, 5.3), ...spread(d2 + 5.1, b, 4.4, 5.3)], y: 7.0, w: 4.4, h: 2.95, r: 0.4 }];
function desCab(c) {
  const L = c.L, d1 = 18.6, d2 = L - 21.6;
  return unit(c, { roof: DES.roof, sill: DES.sill, nose: NOSE_360, rake: [[1.5, 8.5], [4.4, 11.7]], depth: 2.8, cabLen: 9, lampY: 5.0, low: 4.2,
    rows: desRows(11.4, d1, d2, L - 1.6), doors: [desDoor(d1), desDoor(d2)], trucks: [10.6, L - 9.4], wheel: 33, diaphragm: [4.2, 11.6],
    paint: desPaint(true), surround: EM.band,
    extra: (cc, g) => fairing(7.2, g.L - 1.0, DES.roof, EM.trim) + hvac(27, DES.roof + 0.27, 12, 0.55) +
      // The traction gear under the motor car's floor.
      boxes(17, g.L - 15, DES.sill, 4, 1.4) +
      // The cab's side window and door.
      rect(5.6, 8.3, 2.0, 2.2, "#1d2026", 0.4) + rect(8.2, 4.1, 2.0, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      emr(cc, (d1 + 4.3 + d2) / 2, 5.25, 1.6, "CONNECT") + classNo(cc, g.L - 8, 4.6, "360") });
}
function desMid(c) {
  const L = c.L, d1 = 17.2, d2 = L - 21.5, pan = !!c.panCar;
  return unit(c, { roof: DES.roof, sill: DES.sill,
    rows: desRows(1.6, d1, d2, L - 1.6), doors: [desDoor(d1), desDoor(d2)], trucks: [9.4, L - 9.4], wheel: 33, diaphragm: [4.2, 11.6],
    paint: desPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, DES.roof, EM.trim) +
      // The pantograph car: the pantograph over one truck, the transformer under the floor.
      (pan ? pantograph(11, DES.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, DES.roof + 0.29) + hvac(g.L - 27, DES.roof + 0.27, 12, 0.55) + boxes(16, g.L - 16, DES.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, DES.roof + 0.27, 12, 0.55) + boxes(18, g.L - 18, DES.sill, 2, 1.2)) +
      emr(cc, (d1 + 4.3 + d2) / 2, 5.25, 1.6, "CONNECT") });
}

// ---------- Class 170 Turbostar ----------
// Adtranz's (later Bombardier's) regional diesel train, built at Derby in
// 1998-2005: welded aluminium cars of 23.62 m on two trucks each, 2.69 m
// wide, 3.77 m tall, an MTU 6R 183 of 315 kW under every car driving
// through a hydraulic transmission; 100 mph. Two double-leaf sliding plug
// doors a side, a third of the way in from each end; a short, upright cab
// with a raked windshield and no gangway through it; two or three cars.
// (Wikipedia, "British Rail Class 170".) The same body as CrossCountry's
// (crosscountry.cars.js), here all purple with no window band.
const TS = { roof: 12.37, sill: 3.8, car: ft(23.62) };
const NOSE_170 = [[0.5, 3.2], [0.35, 6.4], ["q", 0.4, 7.4, 1.1, 8.2], [3.6, 11.5], ["q", 4.2, 12.37, 6.0, 12.37]];
const tsPaint = (cab) => emPaint(TS, cab ? path("M1.0 8.0L3.6 11.5L7.4 11.5L7.4 8.0Z", EM.band) + yellowEnd(3.0, 3.2, 7.6) : "");
const tsDoor = (x) => ({ x, w: 4.4, y0: TS.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: EM.door });
const tsRows = (a, d1, d2, b) => [{ xs: [...spread(a, d1 - 0.8, 4.6, 5.5), ...spread(d1 + 5.2, d2 - 0.8, 4.6, 5.5), ...spread(d2 + 5.2, b, 4.6, 5.5)], y: 6.95, w: 4.6, h: 2.9, r: 0.4 }];
const tsUnder = (g, a) => raft(a, a + 15) + boxes(a + 17, g.L - 14, TS.sill, 2, 1.3);
function tsCab(c) {
  const L = c.L, d1 = 19.6, d2 = L - 23.0;
  return unit(c, { roof: TS.roof, sill: TS.sill, nose: NOSE_170, rake: [[1.3, 8.3], [3.4, 11.2]], depth: 2.6, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: tsRows(9.4, d1, d2, L - 1.6), doors: [tsDoor(d1), tsDoor(d2)], trucks: [10.4, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: tsPaint(true), surround: EM.band,
    extra: (cc, g) => fairing(6.0, g.L - 1.0, TS.roof, EM.trim) + hvac(30, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 17) +
      // The cab's side window and door.
      rect(4.6, 8.1, 1.9, 2.3, "#1d2026", 0.4) + rect(7.0, 4.0, 1.9, 6.9, "rgba(0,0,0,0.16)", 0.5) +
      emr(cc, (d1 + 4.4 + d2) / 2, 5.15, 1.6, "REGIONAL") + classNo(cc, g.L - 9, 4.45, "170") });
}
function tsMid(c) {
  const L = c.L, d1 = 21.6, d2 = L - 26.0;
  return unit(c, { roof: TS.roof, sill: TS.sill,
    rows: tsRows(1.6, d1, d2, L - 1.6), doors: [tsDoor(d1), tsDoor(d2)], trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, 11.2],
    paint: tsPaint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, TS.roof, EM.trim) + hvac(g.L / 2 - 6, TS.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, TS.roof + 0.27) + tsUnder(g, 15) +
      emr(cc, g.L / 2, 5.15, 1.6, "REGIONAL") });
}

// ---------- Tables ----------

// EMR's classes: First (2+1) and Standard (2+2) on the Aurora, whose First
// is at one end (the driving car and part of the car next to it); Connect
// and Regional trains are Standard only. Each class is its own type, placed
// in the formation, with its own fact sheet. Diesel multiple units are kind
// "emu" (self-propelled, a cab at each end of the set) with no pantograph.
export const TYPES = {
  em810First: { name: "Class 810 Aurora First end car", kind: "emu", pan: true, amenities: ["first"] },
  em810Comp: { name: "Class 810 Aurora First and Standard car", kind: "emu", amenities: ["first"] },
  em810Mid: { name: "Class 810 Aurora Standard car", kind: "emu" },
  em810Cab: { name: "Class 810 Aurora Standard end car", kind: "emu", pan: true },
  em360Cab: { name: "Class 360 Desiro end car", kind: "emu" },
  em360Pan: { name: "Class 360 Desiro pantograph car", kind: "emu", pan: true },
  em360Mid: { name: "Class 360 Desiro car", kind: "emu" },
  em170Cab: { name: "Class 170 Turbostar end car", kind: "emu" },
  em170Mid: { name: "Class 170 Turbostar car", kind: "emu" },
  em1702Cab: { name: "Class 170 Turbostar end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  // One pantograph up, on the First end; the other end's is down.
  em810First: M((c) => at300Cab({ ...c, cls: "first", pan: true }, AURORA), AUR.car, true),
  em810Comp: M((c) => at300Mid({ ...c, cls: "comp", engine: true }, AURORA), AUR.car),
  em810Mid: M((c) => at300Mid({ ...c, engine: true }, AURORA), AUR.car),
  em810Cab: M((c) => at300Cab({ ...c, pan: false }, AURORA), AUR.car, true),
  em360Cab: M(desCab, DES.car, true),
  em360Pan: M((c) => desMid({ ...c, panCar: true }), DES.car),
  em360Mid: M(desMid, DES.car),
  em170Cab: M(tsCab, TS.car, true),
  em170Mid: M(tsMid, TS.car),
  em1702Cab: M(tsCab, TS.car, true),
};

// Units by number: 810 001-033 and 360 101-121 (Wikipedia). The Turbostars
// came to EMR second-hand from several operators, of two and three cars;
// their ranges here are from memory, not checked against a roster: 170
// 201-208 and 170 416-420 (three cars), 170 270-273, 170 501-517 and 170
// 530-535 (two). The timetable names no unit; these are for the fleet
// pages.
export const FLEETS = {
  emr: [[810001, 810033, "em810First"], [360101, 360121, "em360Cab"],
    [170201, 170208, "em170Cab"], [170270, 170273, "em1702Cab"], [170416, 170420, "em170Cab"], [170501, 170517, "em1702Cab"], [170530, 170535, "em1702Cab"]],
};

const set = (label, ...units) => ({ label, units });
const A810 = set("Class 810 Aurora: five cars, electric and diesel; First at one end",
  ["em810First", 1], ["em810Comp", 1], ["em810Mid", 2], ["em810Cab", 1]);
const D360 = set("Class 360 Desiro (EMR Connect): four cars, electric; Standard only",
  ["em360Cab", 1], ["em360Pan", 1], ["em360Mid", 1], ["em360Cab", 1]);
const T170 = set("Class 170 Turbostar (EMR Regional): three cars, diesel; Standard only",
  ["em170Cab", 1], ["em170Mid", 1], ["em170Cab", 1]);
const T1702 = set("Class 170 Turbostar (EMR Regional): two cars, diesel; Standard only",
  ["em1702Cab", 2]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("em810") ? A810 : k.startsWith("em360") ? D360 : k.startsWith("em1702") ? T1702 : T170;

// By the reported unit; else the Aurora, which runs EMR's Intercity trains
// from London St Pancras to Nottingham and Sheffield, often two sets
// coupled. The Desiros work EMR Connect, London to Corby, in sets of up to
// twelve cars; the Turbostars (with Class 158s, not drawn) the Regional
// lines across the East Midlands to Liverpool, Norwich, Lincoln and
// Skegness. The timetable does not say which train is which, so the label
// says "usually".
export const TYPICAL = {
  emr: (t, reported) => BY_MODEL[reported] || A810,
};

const W810 = "https://en.wikipedia.org/wiki/British_Rail_Class_810";
const W360 = "https://en.wikipedia.org/wiki/British_Rail_Class_360";
const W170 = "https://en.wikipedia.org/wiki/British_Rail_Class_170";
const a810 = { model: "Hitachi Class 810 Aurora (AT300)", type: "Bi-mode multiple unit (electric and diesel)", builder: "Hitachi Rail (Newton Aycliffe)", built: "Since 2021",
  fleet: "33 five-car units", topSpeedMph: 125, powerHp: 3943, seats: 301, source: W810 };
const d360 = { model: "Siemens Class 360 Desiro", type: "Electric multiple unit", builder: "Siemens (Krefeld)", built: "2002–2003",
  fleet: "21 four-car units", topSpeedMph: 110, powerHp: 2079, source: W360 };
const t170 = { model: "Bombardier Class 170 Turbostar", type: "Diesel-hydraulic multiple unit", builder: "Adtranz, later Bombardier Transportation (Derby)", built: "1998–2005",
  fleet: "139 built for many operators; EMR's are of two or three cars", topSpeedMph: 100, source: W170 };
const t3 = { ...t170, powerHp: 1267 };
const t2 = { ...t170, powerHp: 845 };
export const FACTS = {
  em810First: { ...a810, lengthFt: 393.7,
    about: "The Aurora's First class driving car, seated 2+1. EMR's Intercity train for the Midland Main Line: electric under the wires out of London St Pancras, diesel beyond them to Nottingham and Sheffield. A five-car set is 120 m long and seats 301 (47 First, 254 Standard); its cars are 24 m, two meters shorter than other Hitachi intercity trains', so that two sets fit St Pancras's platforms." },
  em810Comp: { ...a810,
    about: "The car next to the First class end, part First and part Standard. Four MTU diesel engines of 735 kW each, under the floor, take over where the overhead wires end." },
  em810Mid: { ...a810,
    about: "Standard class, seated 2+2, with a single sliding door a side at each end of the car." },
  em810Cab: { ...a810,
    about: "The Standard class driving car. Each driving car carries a pantograph on its roof behind the cab." },
  em360Cab: { ...d360, lengthFt: 266.9,
    about: "A Desiro driving motor car. Built for the Great Eastern lines out of London Liverpool Street, the class moved to EMR in 2021 for EMR Connect, the electric service between London St Pancras and Corby, regeared for 110 mph. A four-car set is 81.4 m long; up to three run coupled, with no way through between them." },
  em360Pan: { ...d360,
    about: "The second car carries the set's pantograph and, under its floor, the transformer. Standard class, like the whole train." },
  em360Mid: { ...d360,
    about: "A trailer car, Standard class, with wide double doors a third of the way in from each end." },
  em170Cab: { ...t3, lengthFt: 232.5,
    about: "A Turbostar driving car. EMR Regional's Turbostars, taken over from other operators since 2020, work the lines across the East Midlands at up to 100 mph, each car on its own MTU diesel engine." },
  em170Mid: { ...t3,
    about: "The three-car Turbostar's middle car, with wide double doors a third of the way in from each end." },
  em1702Cab: { ...t2, lengthFt: 155.0,
    about: "A two-car Turbostar's driving car. Two- and three-car sets run alone or coupled." },
};
