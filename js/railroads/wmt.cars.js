// West Midlands Trains' cars (scripts/railroads/gb.py, "wmt"), one operator
// under two names: West Midlands Railway, the local trains round Birmingham,
// and London Northwestern Railway, the longer runs along the West Coast
// Main Line between London Euston, Birmingham, Crewe and Liverpool. Drawn
// here: the Class 730 Aventra (three cars for West Midlands Railway's
// Cross-City line, five for London Northwestern's trains from Euston), the
// Class 196 Civity (two and four cars, diesel, West Midlands Railway's
// trains to Shrewsbury and Hereford) and the Class 350 Desiro (four cars,
// London Northwestern's fleet since 2005).
// The timetable names no unit, so a train is drawn as the model that
// usually runs it, labeled as typical. Trainsheet's own side views from
// published dimensions, at the shared scale (js/carart.js), in each name's
// paint, lettered here (no logo files). The toolkit from avanti.cars.js;
// the Civity and the Desiro are drawn again here with these fleets'
// gangwayed cabs (earlier copies are not exported), and the Aventra is new
// here.

import { rect, path, lines, pantograph } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Both liveries date from the franchise's start in December 2017 and are
// drawn from memory of the trains, not checked against photographs.
//   West Midlands Railway: purple all over under a gray roof, each cab end
//   orange (the map's #ff8300) with a slanted edge and a gold line along
//   it; orange doors; "West Midlands Railway" in white.
//   London Northwestern Railway: pale gray sides, each cab end dark green
//   with a bright green line along its slanted edge; bright green doors;
//   "London Northwestern Railway" in dark green.
// Both: a charcoal skirt, a yellow panel on each cab front under a black
// windshield, and a gangway through the cab front.
const SHARED = { roof: "#8b9098", band: "#17181d", skirt: "#2a2c33", trim: "#b4b9c0" };
const WMR = { ...SHARED, side: "#3f1a5b", end: "#ff8300", edge: "#ffc45a", door: "#ff8300", ink: "#f6f4f8", small: "#b9a6cc", name: "West Midlands Railway" };
const LNR = { ...SHARED, side: "#dcdfe0", end: "#0b4a3c", edge: "#1fc27a", door: "#1fb573", ink: "#0b4a3c", small: "#6c7280", name: "London Northwestern Railway" };
// The railway's name, centered on x, h ft tall.
const name = (c, lv, x, y, h = 1.25) => letters(c, x, y, h, lv.name, lv.ink, { weight: 600, spacing: "0.01em" });
// A unit's class number, small near the skirt.
const classNo = (c, lv, x, y, text) => letters(c, x, y, 0.36, text, lv.small, { weight: 600, spacing: "0.06em" });
// The colored cab end: solid from the front back to x = a at the skirt, its
// edge slanting back to x = b at the roof, a lighter line along it.
const cabEnd = (lv, a, b, sill, roof) => path(`M-1 ${sill}L${a} ${sill}L${b} ${roof + 1}L-1 ${roof + 1}Z`, lv.end) +
  path(`M${a} ${sill}L${b} ${roof + 1}L${b + 1.0} ${roof + 1}L${a + 1.0} ${sill}Z`, lv.edge);
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- The three bodies ----------
// All three are 100-110 mph outer-suburban cars of the same plan: two
// trucks a car, two double-leaf sliding plug doors a side a third of the
// way in from each end, and an upright cab with a gangway through its
// front, so that coupled sets are open from end to end. They differ in
// length, height, windows and what hangs under the floor.
//
// Class 730 Aventra: Bombardier's (from 2021 Alstom's) Aventra, built at
// Derby in 2020-2024, 25 kV overhead; every car 24 m. 48 three-car units
// (730/0, DM1-PMLW-DM2, 90 mph, 201 seats) and 36 five-car (730/2, 110
// mph, 406 seats). The windows read as one dark band along the side. The
// height (about 3.8 m) and the five-car set's pantograph car (the third)
// are from memory; the infobox gives neither. (Wikipedia, "British Rail
// Class 730".)
//
// Class 196 Civity: CAF's Civity UK, built in 2019-2022, the Class 195's
// body with a gangwayed cab: an MTU 6H 1800 R85L of 390 kW under every
// car; 100 mph. 12 two-car units (196/0, DMSL-DMS, 141 seats) and 14
// four-car (196/1, 311 seats). The infobox gives no dimensions; the cars
// are taken as the Class 195's, 24.026 m driving and 23.350 m
// intermediate, 3.850 m tall. (Wikipedia, "British Rail Class 196" and
// "British Rail Class 195".)
//
// Class 350 Desiro: Siemens' Desiro UK, built at Krefeld and Uerdingen in
// 2004-2014: four cars of 20.34 m, 81.36 m a set, 2.80 m wide, eight
// motors of 250 kW (2,000 kW) in the two driving cars, the pantograph and
// transformer on the third car, a trailer; 110 mph. The height (3.78 m)
// and the first class's place in the second car, the composite trailer,
// are from memory. (Wikipedia, "British Rail Class 350".)
const AVT = { no: "730", roof: ft(3.8), sill: 3.8, cab: ft(24), mid: ft(24), win: { w: 5.0, pitch: 5.7, y: 7.0, h: 2.9 }, doorW: 4.6, cabD: [19.6, 23.4], midD: [20.6, 25.2],
  trucks: 10.2, wheel: 33, band: true };
const CIV = { no: "196", roof: ft(3.85), sill: 3.8, cab: ft(24.026), mid: ft(23.35), win: { w: 4.6, pitch: 5.5, y: 7.0, h: 2.9 }, doorW: 4.4, cabD: [20.4, 23.0], midD: [21.4, 25.8],
  trucks: 9.8, wheel: 31, diesel: true };
const DES = { no: "350", roof: ft(3.78), sill: 3.9, cab: ft(20.34), mid: ft(20.34), win: { w: 4.4, pitch: 5.3, y: 7.0, h: 2.85 }, doorW: 4.3, cabD: [16.2, 21.6], midD: [17.2, 21.5],
  trucks: 9.4, wheel: 33 };
// The upright, gangwayed front.
const nose = (r) => [[0.5, 3.2], [0.3, 6.4], ["q", 0.3, 8.0, 0.6, 8.8], [1.7, r - 1.0], ["q", 2.0, r, 3.8, r]];
// The side: the body color, a gray roof, the skirt; on a cab car the
// colored end, the black windshield and the yellow panel; the Aventra's
// dark window band behind its panes.
const paint = (o, lv, cab) => (c, g) => bands(g.L, [[0, 20, lv.side], [o.roof - 0.6, 3, lv.roof], [0, o.sill, lv.skirt]]) +
  (cab ? cabEnd(lv, 9.6, 14.4, o.sill, o.roof) + path(`M0.5 8.3L1.7 ${o.roof - 1.0}L5.6 ${o.roof - 1.0}L5.6 8.3Z`, lv.band) + yellowEnd(2.3, 3.2, 7.9) : "") +
  (o.band ? rect(cab ? 16.4 : -1, o.win.y - 0.3, g.L + 2 - (cab ? 17.4 : 0), o.win.h + 0.6, lv.band) : "");
const door = (o, lv, x) => ({ x, w: o.doorW, y0: o.sill, y1: 10.9, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: lv.door });
// The windows, in bays between the doors and the car's ends.
const bay = (o, a, b) => spread(a, b, o.win.w, o.win.pitch);
const row = (o, xs) => [{ xs, y: o.win.y, w: o.win.w, h: o.win.h, r: 0.4 }];
// Under the floor: the Civity's engine raft and tanks, or an electric car's
// traction gear (a transformer, deeper, on a pantograph car).
const under = (o, g, a, pan) => (o.diesel ? raft(a, a + 15) + boxes(a + 17, g.L - 14, o.sill, 2, 1.3)
  : pan ? boxes(a, g.L - a, o.sill, 2, 1.6) : boxes(a, g.L - 14, o.sill, 4, 1.4));
function cabCar(c, o, lv) {
  const L = c.L, d1 = o.cabD[0], d2 = L - o.cabD[1], w = o.doorW;
  return unit(c, { roof: o.roof, sill: o.sill, nose: nose(o.roof), rake: [[0.8, 8.4], [1.6, o.roof - 1.3]], depth: 1.8, cabLen: 7, lampY: 5.0, low: 4.1,
    rows: row(o, [...bay(o, d1 + w + 0.8, d2 - 0.8), ...bay(o, d2 + w + 0.8, L - 1.6)]), doors: [door(o, lv, d1), door(o, lv, d2)],
    trucks: [o.trucks + 0.8, L - o.trucks], wheel: o.wheel, diaphragm: [4.1, o.roof - 1.1],
    paint: paint(o, lv, true), surround: lv.band,
    extra: (cc, g) => fairing(4.0, g.L - 1.0, o.roof, lv.trim) + hvac(28, o.roof + 0.27, 12, 0.55) + (o.diesel ? exhaust(g.L - 8, o.roof + 0.27) : "") + under(o, g, 17, false) +
      // The cab's side window and door.
      rect(3.0, 8.4, 1.9, 2.2, "#1d2026", 0.4) + rect(6.0, 4.0, 1.9, 6.9, "rgba(0,0,0,0.22)", 0.5) +
      name(cc, lv, (d1 + w + d2) / 2, 5.0) + classNo(cc, lv, g.L - 8.5, 4.35, o.no) });
}
function midCar(c, o, lv) {
  const L = c.L, d1 = o.midD[0], d2 = L - o.midD[1], w = o.doorW, pan = !!c.panCar;
  return unit(c, { roof: o.roof, sill: o.sill,
    rows: row(o, [...bay(o, 1.6, d1 - 0.8), ...bay(o, d1 + w + 0.8, d2 - 0.8), ...bay(o, d2 + w + 0.8, L - 1.6)]), doors: [door(o, lv, d1), door(o, lv, d2)],
    trucks: [o.trucks, L - o.trucks], wheel: o.wheel, diaphragm: [4.1, o.roof - 1.1],
    paint: paint(o, lv, false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, o.roof, lv.trim) +
      // A pantograph car: the pantograph over one truck, the transformer under the floor.
      (pan ? pantograph(11, o.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, o.roof + 0.29) + hvac(g.L - 27, o.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, o.roof + 0.27, 12, 0.55) + (o.diesel ? exhaust(g.L - 8, o.roof + 0.27) : "")) +
      under(o, g, o.diesel ? 15 : 16, pan) + name(cc, lv, (d1 + w + d2) / 2, 5.0) });
}

// ---------- Tables ----------

// Each car of each formation is its own type, with its own fact sheet. The
// Class 350's second car holds its first class; the others are Standard
// only. Diesel multiple units are kind "emu" (self-propelled, a cab at each
// end of the set) with no pantograph.
export const TYPES = {
  wm730Cab: { name: "Class 730 end car", kind: "emu" },
  wm730Pan: { name: "Class 730 pantograph car", kind: "emu", pan: true },
  ln730Cab: { name: "Class 730 end car", kind: "emu" },
  ln730Mid: { name: "Class 730 middle car", kind: "emu" },
  ln730Pan: { name: "Class 730 pantograph car", kind: "emu", pan: true },
  wm196Cab: { name: "Class 196 end car", kind: "emu" },
  wm1964Cab: { name: "Class 196 end car", kind: "emu" },
  wm1964Mid: { name: "Class 196 middle car", kind: "emu" },
  ln350Cab: { name: "Class 350 end car", kind: "emu" },
  ln350First: { name: "Class 350 First and Standard car", kind: "emu", amenities: ["first"] },
  ln350Pan: { name: "Class 350 pantograph car", kind: "emu", pan: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const cabOf = (o, lv) => M((c) => cabCar(c, o, lv), o.cab, true);
const midOf = (o, lv, panCar = false) => M((c) => midCar({ ...c, panCar }, o, lv), o.mid);
export const MODELS = {
  wm730Cab: cabOf(AVT, WMR),
  wm730Pan: midOf(AVT, WMR, true),
  ln730Cab: cabOf(AVT, LNR),
  ln730Mid: midOf(AVT, LNR),
  ln730Pan: midOf(AVT, LNR, true),
  wm196Cab: cabOf(CIV, WMR),
  wm1964Cab: cabOf(CIV, WMR),
  wm1964Mid: midOf(CIV, WMR),
  ln350Cab: cabOf(DES, LNR),
  ln350First: midOf(DES, LNR),
  ln350Pan: midOf(DES, LNR, true),
};

// Units by number, from Wikipedia: 730 001-048 (three cars) and 730 201-236
// (five); 196 001-012 (two cars) and 196 101-114 (four); 350 101-130, 350
// 368-377 and 350 401-410 (the 350/2s, 350 231-267, are leaving for the
// Class 730s and are left out). The timetable names no unit; these are for
// the fleet pages.
export const FLEETS = {
  wmt: [[730001, 730048, "wm730Cab"], [730201, 730236, "ln730Cab"], [196001, 196012, "wm196Cab"], [196101, 196114, "wm1964Cab"],
    [350101, 350130, "ln350Cab"], [350368, 350377, "ln350Cab"], [350401, 350410, "ln350Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C7303 = set("Class 730 Aventra: three cars, electric, West Midlands Railway; Standard only",
  ["wm730Cab", 1], ["wm730Pan", 1], ["wm730Cab", 1]);
const C7305 = set("Class 730 Aventra: five cars, electric, London Northwestern Railway",
  ["ln730Cab", 1], ["ln730Mid", 1], ["ln730Pan", 1], ["ln730Mid", 1], ["ln730Cab", 1]);
const C1962 = set("Class 196 Civity: two cars, diesel, West Midlands Railway; Standard only",
  ["wm196Cab", 2]);
const C1964 = set("Class 196 Civity: four cars, diesel, West Midlands Railway; Standard only",
  ["wm1964Cab", 1], ["wm1964Mid", 2], ["wm1964Cab", 1]);
const C350 = set("Class 350 Desiro: four cars, electric, London Northwestern Railway; First in the second car",
  ["ln350Cab", 1], ["ln350First", 1], ["ln350Pan", 1], ["ln350Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("wm730") ? C7303 : k.startsWith("ln730") ? C7305 : k.startsWith("wm1964") ? C1964 : k.startsWith("wm196") ? C1962 : C350;

// By the reported unit; else the three-car Class 730, the largest fleet,
// which works the Cross-City line (Lichfield to Redditch and Bromsgrove)
// and the Wolverhampton and Walsall locals, usually two sets coupled. The
// five-car Class 730s and the Class 350s work London Northwestern's trains
// from Euston to Northampton, Birmingham and Crewe and from Birmingham to
// Liverpool; the Class 196s the diesel lines from Birmingham to Shrewsbury,
// Worcester and Hereford. The Class 172 (the Snow Hill lines), the Class
// 139 (Stourbridge Town) and the Class 150 (the Marston Vale line) are not
// drawn. The timetable does not say which train is which, or under which
// of the two names it runs, so the label says "usually".
export const TYPICAL = {
  wmt: (t, reported) => BY_MODEL[reported] || C7303,
};

const W730 = "https://en.wikipedia.org/wiki/British_Rail_Class_730";
const W196 = "https://en.wikipedia.org/wiki/British_Rail_Class_196";
const W350 = "https://en.wikipedia.org/wiki/British_Rail_Class_350";
const e730 = { model: "Alstom Class 730 Aventra", type: "Electric multiple unit", builder: "Bombardier, later Alstom (Derby)", built: "2020–2024", source: W730 };
const e3 = { ...e730, fleet: "48 three-car units", topSpeedMph: 90, seats: 201 };
const e5 = { ...e730, fleet: "36 five-car units", topSpeedMph: 110, seats: 406 };
const d196 = { model: "CAF Class 196 Civity", type: "Diesel-mechanical multiple unit", builder: "CAF", built: "2019–2022", topSpeedMph: 100, source: W196 };
const d2 = { ...d196, fleet: "12 two-car units", powerHp: 1046, seats: 141 };
const d4 = { ...d196, fleet: "14 four-car units", powerHp: 2092, seats: 311 };
const e350 = { model: "Siemens Class 350 Desiro", type: "Electric multiple unit", builder: "Siemens Mobility", built: "2004–2014",
  fleet: "87 four-car units built", topSpeedMph: 110, powerHp: 2682, source: W350 };
export const FACTS = {
  wm730Cab: { ...e3, lengthFt: 236.2,
    about: "A driving motor car of the three-car Class 730, West Midlands Railway's train for the Cross-City line through Birmingham New Street, in service since 2024 in place of the Class 323. Every car is 24 m long; a gangway through each cab front lets coupled sets run open from end to end. A set seats 201." },
  wm730Pan: { ...e3,
    about: "The middle car carries the set's pantograph, a lavatory and the wheelchair spaces." },
  ln730Cab: { ...e5, lengthFt: 393.7,
    about: "A driving motor car of the five-car Class 730, London Northwestern Railway's 110 mph train for the West Coast Main Line out of London Euston. Five cars of 24 m seat 406, and sets run coupled on the busiest trains." },
  ln730Mid: { ...e5,
    about: "A motor car of the five-car Class 730, with wide double doors a third of the way in from each end." },
  ln730Pan: { ...e5,
    about: "The five-car Class 730's pantograph car, drawn as the middle car of the set." },
  wm196Cab: { ...d2, lengthFt: 157.6,
    about: "A Class 196 driving car. CAF built the class for West Midlands Railway, which put it in service in 2022 on the diesel lines from Birmingham to Shrewsbury, Worcester and Hereford; each car rides on its own MTU diesel engine, at up to 100 mph. A two-car set seats 141." },
  wm1964Cab: { ...d4, lengthFt: 310.9,
    about: "A driving car of the four-car Class 196, which seats 311. A gangway through each cab front lets coupled sets run open from end to end." },
  wm1964Mid: { ...d4,
    about: "A middle car of the four-car Class 196, with wide double doors a third of the way in from each end and an engine of its own under the floor." },
  ln350Cab: { ...e350, lengthFt: 266.9,
    about: "A Class 350 driving motor car. Siemens' Desiro has worked the West Coast Main Line's outer-suburban trains since 2005, at up to 110 mph; London Northwestern Railway runs them from Euston to Northampton, Birmingham and Crewe, in sets coupled up to twelve cars. A four-car set is 81.36 m long, with four 250 kW motors under each driving car." },
  ln350First: { ...e350,
    about: "The second car, a trailer, holds the set's 24 first class seats along with Standard seating." },
  ln350Pan: { ...e350,
    about: "The third car, a trailer, carries the set's pantograph and, under its floor, the transformer." },
};
