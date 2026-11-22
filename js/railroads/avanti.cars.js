// Avanti West Coast's cars (scripts/railroads/gb.py): the West Coast Main
// Line's intercity trains, the Class 390 Pendolino and Hitachi's Class 805
// and 807 "Evero". The timetable names no unit, so a train is drawn as the
// model that usually runs it, labeled as typical. Trainsheet's own side
// views from published dimensions and photographs, at the shared scale
// (js/carart.js), in Avanti's white, charcoal and dark teal, lettered here
// (no logo files). Bodies and parts from czechia.cars.js.
//
// This is the first of Great Britain's cars files, so it also holds what
// the later ones share: the small toolkit below and the Hitachi AT300 body
// (LNER's Azuma, GWR's IET, TransPennine's Nova 1, Hull Trains' Paragon and
// Lumo's Class 803 are the same train in other paint).

import { C, rect, path, lines, poly, underframe, pantograph } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine, exhaust } from "./czechia.cars.js?v=dev";

// ---------- Toolkit (shared by Great Britain's cars files) ----------
export const n = (v) => Math.round(v * 100) / 100;
export const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
// Bands of paint the length of a car: [y, height, fill].
export const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
// Equipment boxes under a floor, from a to b.
export const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
export const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Feet from meters, to a hundredth.
export const ft = (m) => n(m / 0.3048);
// k windows of width w at a pitch, centered between a and b.
export const spread = (a, b, w, pitch) => {
  const k = Math.max(1, Math.floor((b - a - w) / pitch) + 1);
  return seq(a + (b - a - ((k - 1) * pitch + w)) / 2, pitch, k);
};
// A single-leaf door flush with the side (sliding plug or pocket).
export const leaf = (x, sill, top, w, fill) => ({ x, w, y0: sill, y1: top, leaves: 1, glassY: 0.5, glassH: 0.34, grabs: false, fill });
// The yellow warning panel on the front of a British train, from the
// coupler up to y.
export const YELLOW = "#f6d000";
export const yellowEnd = (x1, y0, y1) => path(`M-1 ${y0}L${n(x1)} ${y0}Q${n(x1 * 0.8)} ${n((y0 + y1) / 2)} ${n(x1 * 0.45)} ${y1}L-1 ${y1}Z`, YELLOW);
// A low fairing along the roof.
export const fairing = (a, b, roof, fill = "#b9bec4") => rect(a, roof - 0.05, b - a, 0.34, fill, 0.4, 'rx="0.17"');
export { unit, letters, mark, hvac, hvLine, exhaust };

// ---------- Paint ----------
// Avanti West Coast since December 2019, from photographs (Wikimedia
// Commons, 2023-2026): white sides with the windows in a charcoal band; the
// roof, the doors and the cab ends in a very dark teal (Avanti's own color,
// #004354); a charcoal skirt. On each cab end the teal sweeps back along
// the side and breaks into Avanti's triangles, orange, teal and pale green;
// "AVANTI" over "WEST COAST" in white on the teal behind the cab, and small
// in teal mid-car under the windows. The Pendolino keeps a yellow panel on
// its nose; the Hitachi trains, new enough not to need one, have none.
export const AV = { teal: "#004354", deep: "#00303d", sea: "#0f6f80", white: "#f4f5f4", band: "#23262b", skirt: "#2a2d31", roof: "#3a4046",
  orange: "#f0562b", amber: "#f7941d", lime: "#b8d87a", aqua: "#5bc2c5" };

// Avanti's name: "AVANTI" wide-spaced and bold, "WEST COAST" small under it,
// h ft tall in all, centered on x.
const avanti = (c, x, y, h, fill) => letters(c, x, y + h * 0.22, h * 0.62, "AVANTI", fill, { weight: 800, spacing: "0.12em" }) +
  letters(c, x, y - h * 0.34, h * 0.27, "WEST COAST", fill, { weight: 500, spacing: "0.34em" });
// The triangles the cab end's teal breaks into, pointing back along the
// train from x; y0..y1 is the height they span.
const tri = (x, y, w, h, fill, opacity = 1) => path(poly([[x, y], [x + w, y + h / 2], [x, y + h]]), fill, 0, `opacity="${opacity}"`);
const feathers = (x, y0, y1) => {
  const h = y1 - y0;
  return tri(x, y0, h * 1.5, h, AV.teal) + tri(x + h * 0.55, y0 + h * 0.5, h * 0.95, h * 0.5, AV.sea) +
    tri(x + h * 0.55, y0, h * 0.8, h * 0.5, AV.orange) + tri(x + h * 1.2, y0 + h * 0.25, h * 0.6, h * 0.4, AV.amber) +
    tri(x + h * 1.45, y0 + h * 0.62, h * 0.42, h * 0.3, AV.lime) + tri(x + h * 1.7, y0 + h * 0.1, h * 0.36, h * 0.26, AV.aqua, 0.9);
};
// A car's letter by its door (Avanti letters coaches from the country end)
// and its class in the window band.
const coach = (c, x, y, letter) => (letter ? letters(c, x, y, 1.15, letter, AV.white, { weight: 700 }) : "");
const classMark = (c, x, y, cls) => (cls === "first" ? letters(c, x, y, 0.62, "FIRST", AV.amber, { weight: 700, spacing: "0.14em" })
  : cls === "premium" ? letters(c, x, y, 0.62, "STANDARD PREMIUM", AV.lime, { weight: 700, spacing: "0.1em" }) : "");

// ---------- Class 390 Pendolino ----------
// Alstom's (Fiat Ferroviaria's) tilting train for the West Coast Main Line,
// built 2001-2005 and 2010-2012: nine or eleven cars (217.5 m and 265.3 m),
// each on two trucks; driving cars 25.1 m with a long, rounded nose, the
// others 23.9 m. 2.73 m wide and only 3.56 m tall, the sides leaning in to
// stay in gauge when tilted; 920 mm wheels; one plug door a side at each
// end of a car; small windows, deep-set in their band. Pantographs on the
// third car from each end. (Wikipedia, "British Rail Class 390".)
const P390 = { roof: 11.7, sill: 3.55 };
const NOSE_390 = [[0.9, 3.0], [0.6, 4.6], ["q", 0.7, 6.3, 2.8, 7.5], [9.4, 10.6], ["q", 11.6, 11.7, 14.6, 11.7]];
function paint390(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, AV.white], [11.1, 3, AV.roof], [6.55, 2.95, AV.band], [0, 3.55, AV.skirt]]);
    // The cab end: teal from the nose back past the first door, the roof
    // line running into it; the yellow panel below the windshield.
    if (cab) s += path("M-1 3.0L-1 13L27.5 13L27.5 9.5L24.0 3.55Z", AV.teal) + feathers(24.0, 3.55, 6.55) +
      path("M2.6 7.5Q6.0 9.2 9.4 10.6L17.6 10.6L17.6 7.2L9.0 7.2Q5.4 7.3 2.6 7.5Z", AV.band) + yellowEnd(7.6, 3.0, 6.9);
    return s;
  };
}
// The windows: small, 14 a car, well rounded.
const rows390 = (a, b) => [{ xs: spread(a, b, 3.1, 4.65), y: 6.95, w: 3.1, h: 2.15, r: 0.5 }];
const door390 = (x) => leaf(x, P390.sill, 10.3, 2.7, AV.teal);
function pendoCab(c) {
  const L = c.L;
  return unit(c, { roof: P390.roof, sill: P390.sill, nose: NOSE_390, rake: [[3.0, 7.7], [8.8, 10.4]], depth: 3.3, cabLen: 17, lampY: 4.9, low: 3.9,
    rows: rows390(30.6, L - 6.2), doors: [door390(20.6), door390(L - 4.4)], trucks: [11.8, L - 9.4], wheel: 36, diaphragm: [3.9, 10.6],
    paint: paint390(true), surround: AV.band,
    extra: (cc, g) => fairing(14.6, g.L - 1.0, P390.roof) + hvac(30, P390.roof + 0.27, 13, 0.55) + boxes(18, g.L - 16, 3.55, 3, 1.25) +
      // A slanted cab side window; the name in white on the teal.
      path(poly([[11.6, 7.6], [15.0, 7.6], [15.0, 9.7], [13.0, 9.7]]), "#1d2026", 0.4) +
      avanti(cc, 16.2, 5.15, 1.9, AV.white) + coach(cc, 24.9, 8.0, cc.letter) + classMark(cc, 50, 10.35, cc.cls) +
      letters(cc, g.L - 12, 4.35, 0.36, "390", AV.teal, { weight: 600, spacing: "0.06em" }) });
}
function pendoMid(c) {
  const L = c.L, k = c.index, count = c.count ?? 11;
  // Pantographs on the third car from each end (one raised).
  const pan = k === 2 || k === count - 3;
  return unit(c, { roof: P390.roof, sill: P390.sill,
    rows: rows390(6.4, L - 6.4), doors: [door390(1.7), door390(L - 4.4)], trucks: [9.4, L - 9.4], wheel: 36, diaphragm: [3.9, 10.6],
    paint: paint390(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, P390.roof) +
      (pan ? pantograph(g.L * 0.3, P390.roof + 0.29, { up: k === 2, facing: -1 }) + hvLine(g.L * 0.3 + 3.0, g.L * 0.3 + 10.0, P390.roof + 0.29) + hvac(g.L - 22, P390.roof + 0.27, 11, 0.55)
        : hvac(9, P390.roof + 0.27, 12, 0.55) + hvac(g.L - 21, P390.roof + 0.27, 11, 0.55)) +
      boxes(15, g.L - 15, 3.55, 3, 1.25) + avanti(cc, g.L / 2, 5.1, 1.5, AV.teal) + classMark(cc, g.L / 2, 10.35, cc.cls) });
}

// ---------- Hitachi AT300 (shared) ----------
// Hitachi's intercity train for Britain (Classes 800-803, 805, 807, 810):
// aluminium cars of 26.0 m on two trucks each, the driving cars 25.85 m
// with a long tapered nose; 2.7 m wide, about 3.6 m tall; two single-leaf
// pocket sliding doors a side, one near each end of a car, the driving
// car's forward one behind the cab; the pantograph on the driving cars'
// roofs, behind the cab. Bi-mode units carry an MTU diesel under some of
// the motor cars; all-electric ones do not. (Wikipedia, "British Rail
// Class 800", "Class 805", "Class 807".)
//
// lv, the operator's livery: { paint(cab)(c, g), door (fill), surround (the
// windshield's), over(c, g, cab) for lettering }. c.engine: a diesel under
// this car; c.pan on a driving car: its pantograph raised.
export const AT300 = { roof: 11.9, sill: 3.7, cab: ft(25.85), mid: ft(26.0) };
export const NOSE_AT300 = [[0.9, 2.9], [0.6, 4.3], ["q", 0.7, 5.8, 3.0, 7.1], [11.6, 10.7], ["q", 14.2, 11.9, 17.6, 11.9]];
// The windows: wide panes, eight or nine a car.
const atRows = (a, b) => [{ xs: spread(a, b, 5.2, 6.75), y: 6.75, w: 5.2, h: 2.75, r: 0.4 }];
const atDoor = (x, lv) => leaf(x, AT300.sill, 10.4, 2.9, lv.door);
// The engine raft under a bi-mode's motor car, with its exhaust on the roof.
const atEngine = (a, b) => rect(a, 1.5, b - a, 2.25, "currentColor", 0, 'rx="0.3" opacity="0.85"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);
export function at300Cab(c, lv) {
  const L = c.L;
  return unit(c, { roof: AT300.roof, sill: AT300.sill, nose: NOSE_AT300, rake: [[4.2, 7.6], [10.8, 10.4]], depth: 3.3, cabLen: 20, lampY: 4.7, low: 4.0,
    rows: atRows(29.6, L - 6.6), doors: [atDoor(24.6, lv), atDoor(L - 4.7, lv)], trucks: [14.2, L - 9.8], wheel: 33, diaphragm: [4.0, 10.8],
    paint: lv.paint(true), surround: lv.surround,
    extra: (cc, g) => fairing(17.6, g.L - 1.0, AT300.roof, lv.roofTrim) +
      pantograph(38, AT300.roof + 0.29, { up: !!cc.pan, facing: -1 }) + hvLine(41, 50, AT300.roof + 0.29) + hvac(g.L - 26, AT300.roof + 0.27, 13, 0.6) +
      boxes(21, g.L - 16, 3.7, 3, 1.3) +
      // The cab's side window and door.
      path(poly([[14.6, 7.5], [18.2, 7.5], [18.2, 9.6], [16.4, 9.6]]), "#1d2026", 0.4) + rect(19.6, 3.9, 2.1, 6.3, "rgba(0,0,0,0.1)", 0.5) +
      (lv.over ? lv.over(cc, g, true) : "") });
}
export function at300Mid(c, lv) {
  const L = c.L;
  return unit(c, { roof: AT300.roof, sill: AT300.sill,
    rows: atRows(6.6, L - 6.6), doors: [atDoor(1.8, lv), atDoor(L - 4.7, lv)], trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.0, 10.8],
    paint: lv.paint(false),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, AT300.roof, lv.roofTrim) + hvac(9, AT300.roof + 0.27, 13, 0.6) + hvac(g.L - 24, AT300.roof + 0.27, 13, 0.6) +
      (cc.engine ? atEngine(17, g.L - 17) + exhaust(g.L / 2 - 1.2, AT300.roof + 0.27) : boxes(16, g.L - 16, 3.7, 3, 1.3)) +
      (lv.over ? lv.over(cc, g, false) : "") });
}

// Avanti's Evero: the Pendolino's paint without the yellow.
const EVERO = {
  door: AV.teal, surround: AV.band, roofTrim: "#565d64",
  paint: (cab) => (c, g) => bands(g.L, [[0, 20, AV.white], [11.3, 3, AV.roof], [6.4, 3.45, AV.band], [0, 3.7, AV.skirt]]) +
    (cab ? path("M-1 2.9L-1 13L31.5 13L31.5 9.85L28.0 3.7Z", AV.teal) + feathers(28.0, 3.7, 6.4) +
      path("M3.0 7.1Q7.4 8.9 11.6 10.7L21.8 10.7L21.8 7.2L10.0 7.0Q6.0 7.0 3.0 7.1Z", AV.band) : ""),
  over: (c, g, cab) => (cab ? avanti(c, 13.4, 5.1, 1.75, AV.white) + letters(c, g.L - 12, 4.5, 0.36, c.cls805 || "", AV.teal, { weight: 600, spacing: "0.06em" })
    : avanti(c, g.L / 2, 5.05, 1.5, AV.teal)) + classMark(c, cab ? 52 : g.L / 2, 10.55, c.cls),
};

// ---------- Tables ----------

// Avanti's classes: First (2+1, at the London end), Standard Premium (the
// same wide seats without the meal) and Standard (2+2). A Pendolino has
// First in its leading two cars and Standard Premium in the third, the shop
// further back; an Evero has First in its leading car and Standard Premium
// in part of the next. Each class is its own type, placed in the
// formation, with its own fact sheet.
export const TYPES = {
  av390First: { name: "Class 390 Pendolino First end car", kind: "emu", amenities: ["first"] },
  av390FirstMid: { name: "Class 390 Pendolino First car", kind: "emu", amenities: ["first"] },
  av390Premium: { name: "Class 390 Pendolino Standard Premium car", kind: "emu", pan: true },
  av390Mid: { name: "Class 390 Pendolino Standard car", kind: "emu", pan: true },
  av390Shop: { name: "Class 390 Pendolino Standard car with shop", kind: "emu", pan: true, amenities: ["cafe"] },
  av390Cab: { name: "Class 390 Pendolino Standard end car", kind: "emu" },
  av805First: { name: "Class 805 Evero First end car", kind: "emu", pan: true, amenities: ["first"] },
  av805Mid: { name: "Class 805 Evero Standard car", kind: "emu" },
  av805Cab: { name: "Class 805 Evero Standard end car", kind: "emu", pan: true },
  av807First: { name: "Class 807 Evero First end car", kind: "emu", pan: true, amenities: ["first"] },
  av807Mid: { name: "Class 807 Evero Standard car", kind: "emu" },
  av807Cab: { name: "Class 807 Evero Standard end car", kind: "emu", pan: true },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => `${ctx.index}/${ctx.count}`;
const P_CAB = ft(25.1), P_MID = ft(23.9);
// An 805's diesels are under its three middle cars.
const evero = (c, cls805, more = {}) => ({ ...c, cls805, ...more });
export const MODELS = {
  av390First: M((c) => pendoCab({ ...c, cls: "first" }), P_CAB, true),
  av390FirstMid: M((c) => pendoMid({ ...c, cls: "first" }), P_MID, false, byIndex),
  av390Premium: M((c) => pendoMid({ ...c, cls: "premium" }), P_MID, false, byIndex),
  av390Mid: M((c) => pendoMid(c), P_MID, false, byIndex),
  av390Shop: M((c) => pendoMid(c) + letters(c, c.L * 0.72, 10.35, 0.62, "SHOP", AV.white, { weight: 700, spacing: "0.14em" }), P_MID, false, byIndex),
  av390Cab: M((c) => pendoCab(c), P_CAB, true),
  av805First: M((c) => at300Cab(evero(c, "805", { cls: "first", pan: true }), EVERO), AT300.cab, true),
  av805Mid: M((c) => at300Mid(evero(c, "805", { engine: true, cls: c.index === 1 ? "premium" : null }), EVERO), AT300.mid, false, byIndex),
  av805Cab: M((c) => at300Cab(evero(c, "805", { pan: false }), EVERO), AT300.cab, true),
  av807First: M((c) => at300Cab(evero(c, "807", { cls: "first", pan: true }), EVERO), AT300.cab, true),
  av807Mid: M((c) => at300Mid(evero(c, "807", { cls: c.index === 1 ? "premium" : null }), EVERO), AT300.mid, false, byIndex),
  av807Cab: M((c) => at300Cab(evero(c, "807", { pan: false }), EVERO), AT300.cab, true),
};

// Units by number: 390 001-157 (390/0 nine cars, 390/1 eleven; 390 033 was
// written off after Grayrigg), 805 001-013, 807 001-010. The timetable
// names no unit; these are for the fleet pages.
export const FLEETS = {
  avanti: [[390001, 390057, "av390First"], [390103, 390157, "av390First"], [805001, 805013, "av805First"], [807001, 807010, "av807First"]],
};

const set = (label, ...units) => ({ label, units });
const P390_11 = set("Class 390 Pendolino: usually eleven cars (some nine); First in the leading two, Standard Premium in the third, the shop toward the back",
  ["av390First", 1], ["av390FirstMid", 1], ["av390Premium", 1], ["av390Mid", 5], ["av390Shop", 1], ["av390Mid", 1], ["av390Cab", 1]);
const E805 = set("Class 805 Evero: five cars, electric and diesel; First in the leading car",
  ["av805First", 1], ["av805Mid", 3], ["av805Cab", 1]);
const E807 = set("Class 807 Evero: seven cars, electric; First in the leading car",
  ["av807First", 1], ["av807Mid", 5], ["av807Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("av805") ? E805 : k.startsWith("av807") ? E807 : P390_11;

// By the reported unit; else the Pendolino, which runs most of Avanti's
// trains (London to Glasgow, Edinburgh, Manchester and Birmingham). The
// 805s work London to Chester and North Wales, beyond the wires, and the
// 807s London to Liverpool and Blackpool; the timetable does not say which
// train is which, so the label says "usually".
export const TYPICAL = {
  avanti: (t, reported) => BY_MODEL[reported] || P390_11,
};

const W390 = "https://en.wikipedia.org/wiki/British_Rail_Class_390";
const W805 = "https://en.wikipedia.org/wiki/British_Rail_Class_805";
const W807 = "https://en.wikipedia.org/wiki/British_Rail_Class_807";
const p390 = { model: "Alstom Class 390 Pendolino", type: "Tilting electric multiple unit", builder: "Alstom and Fiat Ferroviaria (Washwood Heath and Savigliano)", built: "2001–2005, 2010–2012",
  fleet: "56 units of nine or eleven cars", topSpeedMph: 125, powerHp: 8073, seats: 607, source: W390 };
const e805 = { model: "Hitachi Class 805 Evero (AT300)", type: "Bi-mode multiple unit (electric and diesel)", builder: "Hitachi Rail (Newton Aycliffe)", built: "2021–2024",
  fleet: "13 five-car units", topSpeedMph: 125, seats: 299, source: W805 };
const e807 = { model: "Hitachi Class 807 Evero (AT300)", type: "Electric multiple unit", builder: "Hitachi Rail (Newton Aycliffe)", built: "2021–2025",
  fleet: "10 seven-car units", topSpeedMph: 125, seats: 453, source: W807 };
export const FACTS = {
  av390First: { ...p390, lengthFt: 870.4,
    about: "The Pendolino's leading car at the London end: First class, seated 2+1, with the kitchen behind the cab. The train tilts up to 8 degrees to take the West Coast Main Line's curves at 125 mph; an eleven-car set is 265.3 m long and seats 607, a nine-car one 217.5 m and 469." },
  av390FirstMid: { ...p390,
    about: "The second First class car. The Pendolino's body is only 3.56 m tall and narrows toward the roof, so that it stays within Britain's small loading gauge when tilted; hence its small windows." },
  av390Premium: { ...p390,
    about: "Standard Premium: First class's wide 2+1 seats without the meal, in the third car, which also carries one of the train's two pantographs." },
  av390Mid: { ...p390,
    about: "Standard class, seated 2+2. Motor cars and trailers alternate along the train; the 2010–2012 build lengthened 31 of the original 53 nine-car sets to eleven cars and added four new ones." },
  av390Shop: { ...p390,
    about: "Standard class with the onboard shop at one end and the train's second pantograph on its roof." },
  av390Cab: { ...p390,
    about: "The Standard class driving car at the country end of the train." },
  av805First: { ...e805, lengthFt: 425.5,
    about: "The Class 805's First class driving car. A five-car bi-mode train that runs on the wires from London to Crewe and on its diesel engines beyond, to Chester, Holyhead and Wrexham; in service since June 2024, replacing the diesel Super Voyagers." },
  av805Mid: { ...e805,
    about: "Standard class, with Standard Premium in part of the car next to First. Each of the three middle cars carries an MTU diesel engine under its floor." },
  av805Cab: { ...e805,
    about: "The Standard class driving car. Both driving cars carry a pantograph; two five-car sets often run coupled." },
  av807First: { ...e807, lengthFt: 597.1,
    about: "The Class 807's First class driving car. A seven-car all-electric train, 182 m long, with no diesel engines under the floor, which makes it Avanti's lightest and quickest off the mark; in service since October 2024." },
  av807Mid: { ...e807,
    about: "Standard class, with Standard Premium in part of the car next to First. The 807 has no underfloor engines, only a battery to keep the train's services running if the wires fail." },
  av807Cab: { ...e807,
    about: "The Standard class driving car at the country end of the train." },
};
