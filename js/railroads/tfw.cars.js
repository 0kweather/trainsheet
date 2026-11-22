// Transport for Wales' cars (scripts/railroads/gb.py, "tfw"): the Class 197
// (CAF Civity, two and three cars, diesel), the new train of nearly every
// line in Wales and the Marches, and the Class 231 (Stadler FLIRT, four
// articulated cars round a power pack, diesel-electric) of the South Wales
// Metro out of Cardiff. The timetable names no unit, so a train is drawn as
// the model that usually runs it, labeled as typical. Trainsheet's own side
// views from published dimensions, at the shared scale (js/carart.js), in
// Transport for Wales' pale gray and red, lettered here in Welsh and
// English (no logo files). The toolkit from avanti.cars.js; the Civity is
// drawn again here with the 197's gangwayed cab and in TfW's paint
// (Northern's copy is not exported), and the FLIRT is new here.

import { rect, path, lines } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Transport for Wales' livery since 2018 (the map's red is #e60000), drawn
// from memory of the trains, not checked against photographs: pale gray
// sides under a darker gray roof, the windows in a near-black band, a
// charcoal skirt; each cab end red, the red ending in a slant that leans
// back toward the roof; red doors; a yellow panel on each cab front under a
// black windshield. On the side the name in both languages, Welsh over
// English: "Trafnidiaeth Cymru", "Transport for Wales".
const TW = { gray: "#e4e6e8", red: "#e60000", deep: "#b80000", roof: "#7d838b", band: "#1b1c21", skirt: "#2a2c33", trim: "#b4b9c0", ink: "#2b2d33",
  note: "#6c7280", grille: "#3a3d45" };
// The name, two lines centered on x: Welsh above, English below; each h ft tall.
const tfwName = (c, x, y, h) => letters(c, x, y + h * 1.25, h, "Trafnidiaeth Cymru", TW.ink, { weight: 700, spacing: "-0.01em" }) +
  letters(c, x, y, h, "Transport for Wales", TW.red, { weight: 700, spacing: "-0.01em" });
// A unit's class number, small in gray near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, TW.note, { weight: 600, spacing: "0.06em" });
// The red cab end: solid from the front back to x = a at the skirt, its
// edge slanting back to x = b at the roof, a darker red line along it.
const redEnd = (a, b, sill, roof) => path(`M-1 ${sill}L${a} ${sill}L${b} ${roof + 1}L-1 ${roof + 1}Z`, TW.red) +
  path(`M${a} ${sill}L${b} ${roof + 1}L${b + 0.8} ${roof + 1}L${a + 0.8} ${sill}Z`, TW.deep);
// The side: pale gray, the window band from x = a to b, a gray roof, the skirt.
const twPaint = (o, a, b, cabArt = "") => (c, g) => bands(g.L, [[0, 20, TW.gray], [o.roof - 0.6, 3, TW.roof], [0, o.sill, TW.skirt]]) +
  rect(a, o.win - 0.3, (b < 0 ? g.L + b : b) - a, o.winH + 0.6, TW.band) + cabArt;
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- CAF Civity: Class 197 ----------
// CAF's Civity UK for Wales, built at Newport (Llanwern) in 2020-2026, the
// diesel sister of Northern's Class 195: aluminium cars, the driving cars
// 24.03 m and the intermediate one 23.35 m, on two trucks each; an MTU 6H
// 1800 R85L of 375 kW under every car, driving through a mechanical
// transmission; 100 mph. Two double-leaf sliding plug doors a side, a third
// of the way in from each end. Unlike the 195 its cab front is upright with
// a gangway through it, so that coupled sets are open from end to end.
// 51 two-car units (197/0, 48.05 m, 116 seats) and 26 three-car (197/1,
// 71.40 m, 188 seats, or 174 in those with a 2+1 Standard Plus saloon).
// (Wikipedia, "British Rail Class 197"; its infobox gives no height or
// width: 3.85 m tall, as the Class 195.)
const CIV = { sill: 3.8, roof: ft(3.85), win: 7.0, winH: 2.9, cab: ft(24.03), mid: ft(23.35) };
// The upright, gangwayed front.
const NOSE_197 = [[0.5, 3.2], [0.3, 6.4], ["q", 0.3, 8.0, 0.6, 8.8], [1.7, CIV.roof - 1.0], ["q", 2.0, CIV.roof, 3.8, CIV.roof]];
const civDoor = (x) => ({ x, w: 4.4, y0: CIV.sill, y1: 10.9, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: TW.red });
// The windows: panes in bays between and outside the doors.
const civBay = (a, b) => spread(a, b, 4.6, 5.5);
const civRow = (xs) => [{ xs, y: CIV.win, w: 4.6, h: CIV.winH, r: 0.4 }];
function civCab(c) {
  const L = c.L, d1 = 20.4, d2 = L - 23.0;
  return unit(c, { roof: CIV.roof, sill: CIV.sill, nose: NOSE_197, rake: [[0.8, 8.4], [1.6, CIV.roof - 1.3]], depth: 1.8, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: civRow([...civBay(d1 + 5.2, d2 - 0.8), ...civBay(d2 + 5.2, L - 1.6)]), doors: [civDoor(d1), civDoor(d2)], trucks: [10.6, L - 9.8], wheel: 33,
    diaphragm: [4.1, CIV.roof - 1.1],
    paint: twPaint(CIV, d1 + 4.4, -1, redEnd(11.0, 15.0, CIV.sill, CIV.roof) + path(`M0.5 8.2L1.7 ${CIV.roof - 1.0}L5.6 ${CIV.roof - 1.0}L5.6 8.2Z`, TW.band) + yellowEnd(2.4, 3.2, 7.8)),
    surround: TW.band,
    extra: (cc, g) => fairing(4.0, g.L - 1.0, CIV.roof, TW.trim) + hvac(30, CIV.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, CIV.roof + 0.27) +
      raft(17, 32) + boxes(34, g.L - 14, CIV.sill, 2, 1.3) +
      // The cab's side window and door.
      rect(3.0, 8.2, 2.0, 2.3, "#1d2026", 0.4) + rect(6.2, 4.0, 2.0, 7.0, "rgba(0,0,0,0.22)", 0.5) +
      tfwName(cc, (d1 + 4.4 + d2) / 2, 4.3, 0.95) + classNo(cc, g.L - 9, 4.45, "197") });
}
function civMid(c) {
  const L = c.L, d1 = 21.4, d2 = L - 25.8;
  return unit(c, { roof: CIV.roof, sill: CIV.sill,
    rows: civRow([...civBay(1.6, d1 - 0.8), ...civBay(d1 + 5.2, d2 - 0.8), ...civBay(d2 + 5.2, L - 1.6)]), doors: [civDoor(d1), civDoor(d2)],
    trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, CIV.roof - 1.1],
    paint: twPaint(CIV, 1.0, -1),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, CIV.roof, TW.trim) + hvac(g.L / 2 - 6, CIV.roof + 0.27, 12, 0.55) + exhaust(g.L - 8, CIV.roof + 0.27) +
      raft(15, 30) + boxes(32, g.L - 14, CIV.sill, 2, 1.3) + tfwName(cc, g.L / 2, 4.3, 0.95) });
}

// ---------- Stadler FLIRT: Class 231 ----------
// Stadler's FLIRT for the South Wales Metro, built at Bussnang in
// 2021-2022: four articulated aluminium passenger cars with a short power
// pack in the middle (DMS-TS-PP-TSW-DMS), 80.7 m over all, on six trucks: a
// motor truck (870 mm wheels) under each cab and four carrying trucks
// (760 mm) shared at the joints. 3.915 m tall, the cars 2.720 m wide and
// the power pack 2.822 m; the floor low, 960 mm over the rail; six
// double-leaf sliding plug doors a side, each 1.3 m wide. The power pack
// holds four Deutz 16-liter V8 diesel engines whose generators feed the
// motors, 1,500 kW at the wheel, with a passage through its middle; 90 mph.
// Eleven units, 231 001-011, 170 seats. (Wikipedia, "British Rail Class
// 231". The infobox gives no car lengths: 21.2 m end cars, 15.8 m
// intermediates and a 6.7 m power pack are apportioned from the 80.7 m,
// from memory of the like Class 755; two doors on each end car and one on
// each intermediate likewise.)
const FL = { sill: 3.15, roof: ft(3.915), win: 6.5, winH: 3.3, cab: ft(21.2), mid: ft(15.8), pp: ft(6.7) };
const NOSE_FL = [[0.8, 2.6], [0.45, 4.6], ["q", 0.5, 6.4, 2.2, 7.8], [6.2, FL.roof - 1.0], ["q", 7.2, FL.roof, 9.6, FL.roof]];
const flDoor = (x) => ({ x, w: 4.3, y0: FL.sill, y1: 10.5, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false, fill: TW.red });
const flRow = (xs) => [{ xs, y: FL.win, w: 5.2, h: FL.winH, r: 0.45 }];
const flBay = (a, b) => spread(a, b, 5.2, 6.1);
// The roof: a long equipment fairing between the car's ends.
const flRoof = (a, b) => fairing(a, b, FL.roof, TW.trim) + rect(a + 1.5, FL.roof + 0.27, b - a - 3, 0.6, TW.roof, 0.4, 'rx="0.2"');
function flCab(c) {
  const L = c.L, d1 = 18.6, d2 = L - 15.4;
  return unit(c, { roof: FL.roof, sill: FL.sill, nose: NOSE_FL, rake: [[2.4, 8.0], [5.8, FL.roof - 1.3]], depth: 3.0, cabLen: 11, lampY: 4.6, low: 3.6,
    rows: flRow([...flBay(d1 + 5.1, d2 - 0.8), ...flBay(d2 + 5.1, L - 1.4)]), doors: [flDoor(d1), flDoor(d2)], trucks: [9.6, "end"], wheel: 34,
    diaphragm: [3.6, FL.roof - 1.1],
    paint: twPaint(FL, d1 + 4.3, -1, redEnd(12.0, 16.4, FL.sill, FL.roof) + path(`M2.0 7.7L6.2 ${FL.roof - 1.0}L10.4 ${FL.roof - 1.0}L10.4 7.7Z`, TW.band) + yellowEnd(3.4, 2.8, 7.3)),
    surround: TW.band,
    extra: (cc, g) => flRoof(9.8, g.L - 0.8) + boxes(26, g.L - 8, FL.sill, 2, 1.1) +
      // The cab's side window.
      rect(7.4, 7.9, 2.4, 2.5, "#1d2026", 0.4) +
      tfwName(cc, (d1 + 4.3 + d2) / 2, 3.75, 0.85) + classNo(cc, g.L - 7, 3.6, "231") });
}
function flMid(c) {
  const L = c.L, d = L / 2 - 2.15;
  return unit(c, { roof: FL.roof, sill: FL.sill,
    rows: flRow([...flBay(1.4, d - 0.8), ...flBay(d + 5.1, L - 1.4)]), doors: [flDoor(d)], trucks: ["start", "end"], wheel: 30, diaphragm: [3.6, FL.roof - 1.1],
    paint: twPaint(FL, 0.8, -0.8),
    extra: (cc, g) => flRoof(0.8, g.L - 0.8) + boxes(8, g.L - 8, FL.sill, 2, 1.1) + tfwName(cc, g.L * 0.27, 3.75, 0.7) });
}
// The power pack: no seats, a passage through the middle; behind the
// louvers on each side two of the four engines, their exhausts on the roof.
function flPack(c) {
  return unit(c, { roof: FL.roof, sill: FL.sill, rows: [], doors: [], trucks: ["start", "end"], wheel: 30, diaphragm: [3.6, FL.roof - 1.1],
    paint: (cc, g) => bands(g.L, [[0, 20, TW.gray], [FL.roof - 0.6, 3, TW.roof], [0, FL.sill, TW.skirt]]),
    extra: (cc, g) => fairing(0.8, g.L - 0.8, FL.roof, TW.trim) + exhaust(g.L * 0.3, FL.roof + 0.27) + exhaust(g.L * 0.7, FL.roof + 0.27) +
      [2.2, g.L / 2 + 0.6].map((x) => rect(x, 4.4, g.L / 2 - 2.8, 6.6, TW.grille, 0.4, 'rx="0.25"') +
        lines(seq(4.9, 0.55, 11).map((y) => [x + 0.4, y, x + g.L / 2 - 3.2, y]), "rgba(255,255,255,0.2)", 0.4)).join("") +
      classNo(cc, g.L / 2, 3.6, "PP") });
}

// ---------- Tables ----------

// Each car of each formation is its own type, with its own fact sheet. The
// trains drawn are Standard class throughout (some three-car Class 197s
// carry a 2+1 Standard Plus saloon, not told apart here). Diesel multiple
// units are kind "emu" (self-propelled, a cab at each end of the set) with
// no pantograph.
export const TYPES = {
  tw197Cab: { name: "Class 197 end car", kind: "emu" },
  tw1973Cab: { name: "Class 197 end car", kind: "emu" },
  tw1973Mid: { name: "Class 197 middle car", kind: "emu" },
  tw231Cab: { name: "Class 231 FLIRT end car", kind: "emu" },
  tw231Mid: { name: "Class 231 FLIRT trailer car", kind: "emu" },
  tw231Pack: { name: "Class 231 FLIRT power pack", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  tw197Cab: M(civCab, CIV.cab, true),
  tw1973Cab: M(civCab, CIV.cab, true),
  tw1973Mid: M(civMid, CIV.mid),
  tw231Cab: M(flCab, FL.cab, true),
  tw231Mid: M(flMid, FL.mid),
  tw231Pack: M(flPack, FL.pp),
};

// Units by number: 197 001-051 (two cars) and 197 101-126 (three), the
// split of the 77 built from memory, not checked against a roster; 231
// 001-011 from Wikipedia. The timetable names no unit; these are for the
// fleet pages.
export const FLEETS = {
  tfw: [[197001, 197051, "tw197Cab"], [197101, 197126, "tw1973Cab"], [231001, 231011, "tw231Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C1972 = set("Class 197: two cars, diesel; Standard only",
  ["tw197Cab", 2]);
const C1973 = set("Class 197: three cars, diesel",
  ["tw1973Cab", 1], ["tw1973Mid", 1], ["tw1973Cab", 1]);
const F231 = set("Class 231 FLIRT: four cars round a power pack, diesel-electric; Standard only",
  ["tw231Cab", 1], ["tw231Mid", 1], ["tw231Pack", 1], ["tw231Mid", 1], ["tw231Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("tw1973") ? C1973 : k.startsWith("tw197") ? C1972 : F231;

// By the reported unit; else the two-car Class 197, the larger part of
// TfW's largest fleet, which works nearly everywhere the operator goes:
// the North Wales coast, the Cambrian, the Marches line to Manchester, West
// Wales and the Heart of Wales connections, alone or coupled. The Class
// 231s work the South Wales Metro out of Cardiff. The Class 756 (the
// FLIRT's tri-mode sister on the Valley lines), the Class 398 tram-trains,
// the Class 67 and Mark 4 Premier Service, and the Class 150, 153, 158 and
// 230 are not drawn. The timetable does not say which train is which, so
// the label says "usually".
export const TYPICAL = {
  tfw: (t, reported) => BY_MODEL[reported] || C1972,
};

const W197 = "https://en.wikipedia.org/wiki/British_Rail_Class_197";
const W231 = "https://en.wikipedia.org/wiki/British_Rail_Class_231";
const d197 = { model: "CAF Class 197 Civity", type: "Diesel-mechanical multiple unit", builder: "CAF (Newport)", built: "2020–2026",
  topSpeedMph: 100, source: W197 };
const d2 = { ...d197, fleet: "51 two-car units", powerHp: 1006, seats: 116 };
const d3 = { ...d197, fleet: "26 three-car units", powerHp: 1509, seats: 188 };
const f231 = { model: "Stadler Class 231 FLIRT", type: "Diesel-electric multiple unit", builder: "Stadler (Bussnang)", built: "2021–2022",
  fleet: "11 four-car units", topSpeedMph: 90, powerHp: 2011, seats: 170, source: W231 };
export const FACTS = {
  tw197Cab: { ...d2, lengthFt: 157.6,
    about: "A Class 197 driving car. CAF built the class in Wales for Transport for Wales, which put it in service in 2022 in place of the Class 158 and 175; each car rides on its own MTU diesel engine, at up to 100 mph. A gangway through each cab front lets coupled sets run open from end to end. A two-car set is 48.05 m long and seats 116." },
  tw1973Cab: { ...d3, lengthFt: 234.3,
    about: "A Class 197 driving car. CAF built the class in Wales for Transport for Wales, which put it in service in 2022; each car rides on its own MTU diesel engine, at up to 100 mph. A three-car set is 71.40 m long and seats 188, or 174 where one saloon is seated 2+1." },
  tw1973Mid: { ...d3,
    about: "The three-car Class 197's middle car, with wide double doors a third of the way in from each end and an engine of its own under the floor." },
  tw231Cab: { ...f231, lengthFt: 264.8,
    about: "A Class 231 driving motor car: its truck under the cab is one of the train's two driven ones, fed from the power pack in the middle. Stadler built the eleven units for the South Wales Metro, in service since 2023; the set is 80.7 m long, seats 170, and has a low floor level with the platform at every door." },
  tw231Mid: { ...f231,
    about: "A trailer car, sharing a truck with its neighbor at each end, with one wide double door a side; one of the two holds the wheelchair spaces and the accessible toilet." },
  tw231Pack: { ...f231,
    about: "The power pack, a short car with no seats: four Deutz V8 diesel engines and their generators, two on each side of a passage that passengers walk through between the halves of the train." },
};
