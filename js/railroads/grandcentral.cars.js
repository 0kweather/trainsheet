// Grand Central's cars (scripts/railroads/gb.py, "grandcentral"): the
// open-access trains from London King's Cross to Sunderland and to
// Bradford, the Class 180 Adelante (Alstom, five cars) and the Class 221
// Super Voyager (Bombardier, five cars) taken on beside it. The timetable
// names no unit, so a train is drawn as the model that usually runs it,
// labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in Grand Central's black
// and orange, lettered here (no logo files). The toolkit from
// avanti.cars.js; the Voyager body is redrawn here in Grand Central's paint,
// since crosscountry.cars.js does not export it.

import { rect, path, lines, poly } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, leaf, yellowEnd, fairing, unit, letters, hvac, exhaust } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Grand Central (Arriva's, on the East Coast since December 2007; its black
// is #1d1d1b), drawn from memory of the trains, not checked against
// photographs: black all over, the roof and skirt a shade off it; one
// orange stripe along the side under the windows, which on each driving
// car climbs over the cab in a curve to the roof; doors in orange; a yellow
// panel on the front; "GRAND CENTRAL" in white capitals, wide-spaced, on
// the black behind the cab and mid-car.
const GC = { black: "#1d1d1b", deep: "#111110", orange: "#f08a1c", amber: "#f5a640", band: "#0d0e10", skirt: "#2a2b2c", roof: "#2f3133",
  white: "#f6f4f2", gold: "#c8a45a" };
// Grand Central's name: capitals, wide-spaced; h ft tall, centered on x.
const gcName = (c, x, y, h, fill = GC.white) => letters(c, x, y, h, "GRAND CENTRAL", fill, { weight: 500, spacing: "0.16em", family: "Georgia, 'Times New Roman', serif" });
// A car's class over its windows: "FIRST" in gold (Standard goes unmarked).
const classMark = (c, x, y, cls) => (cls === "first" ? letters(c, x, y, 0.6, "FIRST", GC.gold, { weight: 700, spacing: "0.14em" }) : "");
// The side: black, the roof, the skirt, the orange stripe at y = o.stripe;
// on a cab end the stripe turns up at x = o.sweep and climbs forward over
// the cab to the roof, with the yellow panel on the front.
const gcPaint = (o) => (c, g) => bands(g.L, [[0, 20, GC.black], [o.roof - 0.65, 3, GC.roof], [0, o.sill, GC.skirt]]) +
  (o.sweep
    ? rect(o.sweep, o.stripe, g.L + 1 - o.sweep, 0.42, GC.orange) +
      path(`M${o.sweep + 0.1} ${o.stripe}Q${o.sweep - 6} ${o.stripe} ${o.sweep - 10} ${o.roof - 2.4}L${o.sweep - 11.6} ${o.roof + 0.4}L${o.sweep - 10.4} ${o.roof + 0.4}L${o.sweep - 9.0} ${o.roof - 2.2}Q${o.sweep - 5.6} ${o.stripe + 0.42} ${o.sweep + 0.1} ${o.stripe + 0.42}Z`, GC.orange) +
      o.yellow
    : rect(-1, o.stripe, g.L + 2, 0.42, GC.orange));
// A diesel engine's raft under the floor, with its radiator's louvers.
const raft = (a, b) => rect(a, 1.5, b - a, 2.25, "#3a3c3e", 0, 'rx="0.3"') +
  lines(seq(a + 1.2, 1.1, Math.floor((b - a - 2) / 1.1)).map((x) => [x, 1.8, x, 3.4]), "rgba(255,255,255,0.16)", 0.4);

// ---------- Class 180 Adelante ----------
// Alstom's 125 mph diesel-hydraulic train of the Coradia family, built at
// Washwood Heath in 2000-2001 for First Great Western: five steel cars on
// two trucks each (Alstom MB2), a Cummins QSK19-R of 559 kW under every
// one, driving through a Voith hydraulic transmission. Driving cars 23.71 m
// with a long, pointed nose; intermediate cars 23.03 m; the set 116.52 m;
// 2.73 m wide; one single-leaf plug door a side at each end of a car, the
// driving car's forward one behind the cab. Formation DMSL(A)-MFL-MSL-
// MSLRB-DMSL(B): First in the second car, a buffet counter in the fourth.
// (Wikipedia, "British Rail Class 180"; the height, about 3.85 m, the
// 23.03 m intermediate car and the window count are from memory.)
const ADE = { roof: 12.6, sill: 3.7, stripe: 5.7, cab: ft(23.71), mid: ft(23.03) };
const NOSE_ADE = [[0.9, 2.9], [0.6, 4.3], ["q", 0.7, 5.7, 3.0, 6.9], [10.6, 11.2], ["q", 12.6, 12.6, 15.8, 12.6]];
const adePaint = (cab) => gcPaint({ ...ADE, sweep: cab ? 26 : 0, yellow: yellowEnd(7.2, 2.9, 6.6) });
// The windows: long panes close together in a gloss-black band.
const adeRows = (a, b) => [{ xs: spread(a, b, 4.7, 5.7), y: 6.95, w: 4.7, h: 2.8, r: 0.45 }];
const adeGlass = (a, b) => rect(a, 6.7, b - a, 3.3, GC.band, 0, 'rx="0.4"');
const adeDoor = (x) => leaf(x, ADE.sill, 10.7, 2.8, GC.orange);
// Roof: a low fairing, the air conditioning, the engine's exhaust at one end.
const adeRoof = (g, a) => fairing(a, g.L - 1.0, ADE.roof, "#4a4e52") + hvac(g.L / 2 - 4, ADE.roof + 0.27, 13, 0.55) + exhaust(g.L - 9, ADE.roof + 0.27);
function adeCab(c) {
  const L = c.L;
  return unit(c, { roof: ADE.roof, sill: ADE.sill, nose: NOSE_ADE, rake: [[3.8, 7.4], [9.8, 10.9]], depth: 3.3, cabLen: 18, lampY: 4.7, low: 4.0,
    rows: adeRows(26.6, L - 6.4), doors: [adeDoor(22.0), adeDoor(L - 4.6)], trucks: [13.2, L - 9.6], wheel: 33, diaphragm: [4.0, 11.2],
    paint: (cc, g) => adePaint(true)(cc, g) + adeGlass(25.8, g.L - 5.6), surround: GC.band,
    extra: (cc, g) => adeRoof(g, 15.8) + raft(21, g.L - 17) + boxes(g.L - 16, g.L - 11, ADE.sill, 1, 1.3) +
      // The cab's side window and door; the name in white under the windows.
      path(poly([[12.4, 7.6], [15.8, 7.6], [15.8, 10.0], [14.2, 10.0]]), "#1d2026", 0.4) + rect(17.6, 3.9, 2.0, 6.7, "rgba(255,255,255,0.07)", 0.5) +
      gcName(cc, 46, 4.35, 0.95) + letters(cc, g.L - 12, 11.1, 0.36, "180", GC.white, { weight: 600, spacing: "0.06em" }) });
}
function adeMid(c) {
  const L = c.L;
  return unit(c, { roof: ADE.roof, sill: ADE.sill,
    rows: adeRows(6.4, L - 6.4), doors: [adeDoor(1.8), adeDoor(L - 4.6)], trucks: [9.6, L - 9.6], wheel: 33, diaphragm: [4.0, 11.2],
    paint: (cc, g) => adePaint(false)(cc, g) + adeGlass(5.6, g.L - 5.6),
    extra: (cc, g) => adeRoof(g, 1.0) + raft(17, g.L - 17) + gcName(cc, g.L / 2, 4.35, 0.95) + classMark(cc, g.L / 2, 11.1, cc.cls) });
}

// ---------- Class 221 Super Voyager ----------
// Bombardier's 125 mph diesel-electric train, built at Bruges and Wakefield
// in 2001-2002 for Virgin: steel cars on two trucks each, a Cummins QSK19
// of 559 kW under every one. Driving cars 23.85 m with a raked, rounded
// nose; intermediate cars 23.67 m; 2.73 m wide, 3.75 m tall; 780 mm wheels;
// one single-leaf swing plug door a side at each end of a car. Built to
// tilt, on heavy outside-framed trucks; Grand Central's, taken on from
// Avanti West Coast's fleet, run with the tilt out of use. (Wikipedia,
// "British Rail Class 221"; the body as drawn in crosscountry.cars.js.)
const VOY = { roof: 12.3, sill: 3.7, stripe: 5.6, cab: ft(23.85), mid: ft(23.67) };
const NOSE_VOY = [[0.9, 3.0], [0.6, 4.7], ["q", 0.7, 6.2, 2.4, 7.3], [8.0, 11.2], ["q", 9.4, 12.3, 12.2, 12.3]];
const voyPaint = (cab) => gcPaint({ ...VOY, sweep: cab ? 22 : 0, yellow: yellowEnd(6.4, 3.0, 6.9) });
// The windows: long panes close together, ten or eleven a car.
const voyRows = (a, b) => [{ xs: spread(a, b, 4.5, 5.6), y: 6.95, w: 4.5, h: 2.75, r: 0.4 }];
const voyGlass = (a, b) => rect(a, 6.7, b - a, 3.25, GC.band, 0, 'rx="0.4"');
const voyDoor = (x) => leaf(x, VOY.sill, 10.6, 2.8, GC.orange);
const voyRoof = (g, a) => fairing(a, g.L - 1.0, VOY.roof, "#4a4e52") + hvac(g.L / 2 - 4, VOY.roof + 0.27, 13, 0.55) + exhaust(g.L - 9, VOY.roof + 0.27);
function voyCab(c) {
  const L = c.L;
  return unit(c, { roof: VOY.roof, sill: VOY.sill, nose: NOSE_VOY, rake: [[3.0, 7.7], [7.4, 10.9]], depth: 3.2, cabLen: 14, lampY: 4.9, low: 4.0,
    rows: voyRows(22.4, L - 6.4), doors: [voyDoor(17.8), voyDoor(L - 4.6)], trucks: [11.6, L - 9.6], wheel: 31, diaphragm: [4.0, 11.0],
    paint: (cc, g) => voyPaint(true)(cc, g) + voyGlass(21.6, g.L - 5.6), surround: GC.band,
    extra: (cc, g) => voyRoof(g, 12.2) + raft(19, g.L - 17) +
      // The cab's side window and door; the name in white under the windows.
      path(poly([[9.8, 7.7], [12.8, 7.7], [12.8, 9.9], [11.2, 9.9]]), "#1d2026", 0.4) + rect(14.2, 3.9, 2.0, 6.6, "rgba(255,255,255,0.07)", 0.5) +
      gcName(cc, 44, 4.3, 0.95) + classMark(cc, 46, 11.0, cc.cls) +
      letters(cc, g.L - 12, 11.0, 0.36, "221", GC.white, { weight: 600, spacing: "0.06em" }) });
}
function voyMid(c) {
  const L = c.L;
  return unit(c, { roof: VOY.roof, sill: VOY.sill,
    rows: voyRows(6.4, L - 6.4), doors: [voyDoor(1.8), voyDoor(L - 4.6)], trucks: [9.6, L - 9.6], wheel: 31, diaphragm: [4.0, 11.0],
    paint: (cc, g) => voyPaint(false)(cc, g) + voyGlass(5.6, g.L - 5.6),
    extra: (cc, g) => voyRoof(g, 1.0) + raft(17, g.L - 17) + gcName(cc, g.L / 2, 4.3, 0.95) });
}

// ---------- Tables ----------

// Grand Central's classes: First (2+1) and Standard (2+2). An Adelante has
// First in its second car and Standard in the rest, with a buffet counter
// in the fourth; a Super Voyager has First in one driving car. Each class
// is its own type, placed in the formation, with its own fact sheet. Diesel
// multiple units are kind "emu" (self-propelled, a cab at each end of the
// set) with no pantograph.
export const TYPES = {
  gc180Cab: { name: "Class 180 Adelante Standard end car", kind: "emu" },
  gc180First: { name: "Class 180 Adelante First car", kind: "emu", amenities: ["first"] },
  gc180Mid: { name: "Class 180 Adelante Standard car", kind: "emu" },
  gc180Buffet: { name: "Class 180 Adelante Standard and buffet car", kind: "emu", amenities: ["cafe"] },
  gc221First: { name: "Class 221 Super Voyager First end car", kind: "emu", amenities: ["first"] },
  gc221Mid: { name: "Class 221 Super Voyager Standard car", kind: "emu" },
  gc221Cab: { name: "Class 221 Super Voyager Standard end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  gc180Cab: M(adeCab, ADE.cab, true),
  gc180First: M((c) => adeMid({ ...c, cls: "first" }), ADE.mid),
  gc180Mid: M(adeMid, ADE.mid),
  gc180Buffet: M(adeMid, ADE.mid),
  gc221First: M((c) => voyCab({ ...c, cls: "first" }), VOY.cab, true),
  gc221Mid: M(voyMid, VOY.mid),
  gc221Cab: M(voyCab, VOY.cab, true),
};

// Units by number: the Adelantes within 180 101-114 (Grand Central has had
// most of the class at one time or another) and its Super Voyagers, 221
// 142-143 (from memory). The timetable names no unit; these are for the
// fleet pages.
export const FLEETS = {
  grandcentral: [[180101, 180114, "gc180Cab"], [221142, 221143, "gc221First"]],
};

const set = (label, ...units) => ({ label, units });
const A180 = set("Class 180 Adelante: five cars, diesel; First in the second car, a buffet counter in the fourth",
  ["gc180Cab", 1], ["gc180First", 1], ["gc180Mid", 1], ["gc180Buffet", 1], ["gc180Cab", 1]);
const V221 = set("Class 221 Super Voyager: five cars, diesel; First in the leading car",
  ["gc221First", 1], ["gc221Mid", 3], ["gc221Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("gc221") ? V221 : A180;

// By the reported unit; else the Adelante, which runs most of Grand
// Central's trains on both its routes (King's Cross to Sunderland by York
// and Hartlepool, and to Bradford Interchange by Doncaster and Halifax),
// sometimes two sets coupled; the Super Voyagers work beside it. The
// timetable does not say which train is which, so the label says "usually".
export const TYPICAL = {
  grandcentral: (t, reported) => BY_MODEL[reported] || A180,
};

const W180 = "https://en.wikipedia.org/wiki/British_Rail_Class_180";
const W221 = "https://en.wikipedia.org/wiki/British_Rail_Class_221";
const a180 = { model: "Alstom Class 180 Adelante", type: "Diesel-hydraulic multiple unit", builder: "Alstom (Washwood Heath, Birmingham)", built: "2000–2001",
  fleet: "14 five-car units built", topSpeedMph: 125, powerHp: 3750, seats: 287, source: W180 };
const v221 = { model: "Bombardier Class 221 Super Voyager", type: "Diesel-electric multiple unit", builder: "Bombardier Transportation (Bruges and Wakefield)", built: "2001–2002",
  fleet: "44 built, of four or five cars", topSpeedMph: 125, powerHp: 3750, source: W221 };
export const FACTS = {
  gc180Cab: { ...a180, lengthFt: 382.3,
    about: "The Adelante's Standard class driving car. Built for First Great Western's expresses out of Paddington and Grand Central's since 2009: a five-car set is 116.5 m long, with a 750 hp Cummins engine under every car driving through a hydraulic transmission, at up to 125 mph." },
  gc180First: { ...a180,
    about: "The Adelante's second car: First class, seated 2+1." },
  gc180Mid: { ...a180,
    about: "Standard class, seated 2+2. Every car of an Adelante is powered." },
  gc180Buffet: { ...a180,
    about: "The fourth car: Standard class, with the buffet counter at one end." },
  gc221First: { ...v221, lengthFt: 389.5,
    about: "The Super Voyager's First class driving car, seated 2+1. Built to tilt on the West Coast Main Line for Virgin and later Avanti West Coast; Grand Central took a few on to run beside its Adelantes, with the tilt out of use. A five-car set is 118.7 m long." },
  gc221Mid: { ...v221,
    about: "Standard class, seated 2+2. Each car has its own 750 hp Cummins engine and generator, feeding electric motors on the trucks." },
  gc221Cab: { ...v221,
    about: "The Standard class driving car." },
};
