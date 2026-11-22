// Thameslink's cars (scripts/railroads/gb.py, "thameslink"): the trains
// through the middle of London between Bedford, Peterborough and Cambridge
// and Brighton, Horsham, Sutton and Kent are all one fleet, the Siemens
// Class 700 Desiro City, in two lengths: the eight-car 700/0 and the
// twelve-car 700/1. The timetable names no unit, so a train is drawn as the
// length that usually runs it, labeled as typical. Trainsheet's own side
// views from published dimensions, at the shared scale (js/carart.js), in
// Thameslink's pale gray with light-blue doors, lettered here (no logo
// files). The toolkit from avanti.cars.js; the body is new here.

import { rect, path, pantograph } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// Thameslink since 2016, drawn from memory and not checked against
// photographs: pale gray sides with no window band, a darker gray roof and
// a charcoal skirt; light-blue doors; the cab end white, its edge slanting
// back toward the roof, round a black windshield mask, with a yellow panel
// on the front under it; "THAMESLINK" in dark gray capitals under the
// windows mid-car; a pink line (the railroad's color, #ff5aa4) over the
// windows of First.
const TL = { gray: "#dfe2e5", white: "#f6f6f4", blue: "#8fc8ea", pink: "#ff5aa4", ink: "#3d4249", band: "#1f2126", skirt: "#33363b", roof: "#7f858b", trim: "#aeb3b9",
  silver: "#c9cdd2" };

// Thameslink's name, h ft tall, centered on x; reads left to right on a
// mirrored car too.
const name = (c, x, y, h = 1.15) => letters(c, x, y, h, "THAMESLINK", TL.ink, { weight: 700, spacing: "0.05em" });
// The subclass, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, TL.silver, { weight: 600, spacing: "0.06em" });

// ---------- Siemens Desiro City: Class 700 ----------
// Built at Krefeld by Siemens in 2014-2018 for the Thameslink Programme:
// 60 eight-car units (700/0, 162.0 m, DMCO-PTSO-MSO-TSO-TSO-MSO-PTSO-DMCO)
// and 55 twelve-car (700/1, 242.6 m, with two more motor cars and two more
// trailers), aluminium cars of about 20.2 m, 2.80 m wide, floor at 1.10 m,
// on SF7000 trucks with 820 mm wheels; two double-leaf pocket sliding doors
// a side on each car; 100 mph; 3,300 kW (700/0) or 5,000 kW (700/1); 25 kV
// 50 Hz overhead north of the Thames and 750 V third rail south of it, a
// pantograph on the second car from each end. 427 seats (52 First) in
// eight cars, 666 (52 First) in twelve. (Wikipedia, "British Rail Class
// 700". The driving cars' 20.52 m against 20.16 m for the others are
// apportioned from the two train lengths, which they both fit; the height,
// about 3.79 m, is from memory.)
const DC = { roof: ft(3.79), sill: 3.7, cab: ft(20.52), mid: ft(20.16) };
// The closed front, raked back over a deep windshield.
const NOSE_DC = [[0.6, 3.1], [0.35, 5.4], ["q", 0.4, 7.2, 1.7, 8.5], [4.2, DC.roof - 1.0], ["q", 4.9, DC.roof, 7.0, DC.roof]];
const side = (more = "") => (c, g) => bands(g.L, [[0, 20, TL.gray], [DC.roof - 0.6, 3, TL.roof], [0, DC.sill, TL.skirt]]) + more;
// A double-leaf sliding door, 1.5 m wide.
const DOOR_W = 4.9;
const door = (x) => ({ x, w: DOOR_W, y0: DC.sill, y1: 10.9, leaves: 2, glassY: 0.46, glassH: 0.38, grabs: false, fill: TL.blue });
// The windows: wide panes in the bays each side of the doors and between
// them.
const rows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 4.6, 5.3)), y: 6.9, w: 4.6, h: 2.9, r: 0.35 }];
// The white cab end, its edge slanting back toward the roof.
const whiteEnd = (x0, x1) => path(`M-1 ${DC.sill}L${x0} ${DC.sill}L${x1} 13.5L-1 13.5Z`, TL.white);
// First's pink line over the windows, from a to b.
const firstLine = (a, b) => rect(a, 10.25, b - a, 0.28, TL.pink);

// o.sub: the subclass lettered on the skirt. The driving cars hold First
// in the saloon behind the cab, as far as the first doors and a bay past
// them.
function dcCab(c, o = {}) {
  const L = c.L, d1 = 18.6, d2 = L - 18.9;
  return unit(c, { roof: DC.roof, sill: DC.sill, nose: NOSE_DC, rake: [[1.9, 8.5], [4.0, DC.roof - 1.3]], depth: 2.4, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: rows([[11.6, d1 - 0.8], [d1 + DOOR_W + 0.8, d2 - 0.8], [d2 + DOOR_W + 0.8, L - 1.6]]), doors: [door(d1), door(d2)], trucks: [10.6, L - 9.4], wheel: 32,
    diaphragm: [4.1, DC.roof - 1.1],
    paint: side(whiteEnd(9.6, 13.4) + path(`M1.5 8.3L4.2 ${DC.roof - 1.0}L8.2 ${DC.roof - 1.0}L8.2 8.3Z`, TL.band) + yellowEnd(2.8, 3.1, 7.9)), surround: TL.band,
    extra: (cc, g) => fairing(7.2, g.L - 1.0, DC.roof, TL.trim) + hvac(g.L / 2 - 4, DC.roof + 0.27, 12, 0.55) + boxes(16, g.L - 14, DC.sill, 3, 1.4) +
      // The cab's side window and door.
      rect(5.6, 8.4, 2.0, 2.1, "#1d2026", 0.4) + rect(8.6, 4.0, 1.9, 6.9, "rgba(0,0,0,0.14)", 0.5) +
      firstLine(11.4, d1 - 0.6) + firstLine(d1 + DOOR_W + 0.6, d1 + DOOR_W + 11.6) +
      name(cc, (d1 + DOOR_W + d2) / 2, 5.0) + classNo(cc, g.L - 8, 3.05, o.sub || "700") });
}
// o.pan: the pantograph and its transformer (the second car from each end;
// the pantograph over the truck nearer the driving car). o.motor: traction
// gear under the floor.
function dcMid(c, o = {}) {
  const L = c.L, d1 = 13.6, d2 = L - 13.6 - DOOR_W;
  const outer = c.index < (c.count || 8) / 2, px = outer ? 10.5 : L - 10.5;
  return unit(c, { roof: DC.roof, sill: DC.sill,
    rows: rows([[1.6, d1 - 0.8], [d1 + DOOR_W + 0.8, d2 - 0.8], [d2 + DOOR_W + 0.8, L - 1.6]]), doors: [door(d1), door(d2)], trucks: [9.4, L - 9.4], wheel: 32,
    diaphragm: [4.1, DC.roof - 1.1], paint: side(),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, DC.roof, TL.trim) +
      (o.pan ? pantograph(px, DC.roof + 0.29, { up: true, facing: outer ? -1 : 1 }) + (outer ? hvLine(px + 3, px + 11, DC.roof + 0.29) : hvLine(px - 11, px - 3, DC.roof + 0.29)) +
          hvac(outer ? g.L - 24 : 12, DC.roof + 0.27, 12, 0.55) + boxes(15, g.L - 15, DC.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, DC.roof + 0.27, 12, 0.55) + boxes(15, g.L - 15, DC.sill, o.motor ? 4 : 2, o.motor ? 1.4 : 1.1)) +
      name(cc, (d1 + DOOR_W + d2) / 2, 5.0) });
}

// ---------- Tables ----------

// First is in the driving cars only (the rear one is usually declassified).
// Each car kind is its own type, placed in the formation, with its own fact
// sheet; the two lengths have their own driving-car types, so a reported
// unit picks its formation.
export const TYPES = {
  tl7000Cab: { name: "Class 700/0 driving car", kind: "emu", amenities: ["first"] },
  tl7001Cab: { name: "Class 700/1 driving car", kind: "emu", amenities: ["first"] },
  tl700Pan: { name: "Class 700 pantograph car", kind: "emu", pan: true },
  tl700Motor: { name: "Class 700 motor car", kind: "emu" },
  tl700Mid: { name: "Class 700 trailer car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  tl7000Cab: M((c) => dcCab(c, { sub: "700/0" }), DC.cab, true),
  tl7001Cab: M((c) => dcCab(c, { sub: "700/1" }), DC.cab, true),
  tl700Pan: M((c) => dcMid(c, { pan: true }), DC.mid, false, byIndex),
  tl700Motor: M((c) => dcMid(c, { motor: true }), DC.mid),
  tl700Mid: M((c) => dcMid(c), DC.mid),
};

// Units by number (class and serial run together): 700 001-060 (eight
// cars), 700 101-155 (twelve). The timetable names no unit; these are for
// the fleet pages.
export const FLEETS = {
  thameslink: [[700001, 700060, "tl7000Cab"], [700101, 700155, "tl7001Cab"]],
};

const set = (label, ...units) => ({ label, units });
const RLU = set("Class 700/0 Desiro City: eight cars, electric; First in the driving cars",
  ["tl7000Cab", 1], ["tl700Pan", 1], ["tl700Motor", 1], ["tl700Mid", 2], ["tl700Motor", 1], ["tl700Pan", 1], ["tl7000Cab", 1]);
const FLU = set("Class 700/1 Desiro City: twelve cars, electric; First in the driving cars",
  ["tl7001Cab", 1], ["tl700Pan", 1], ["tl700Motor", 2], ["tl700Mid", 4], ["tl700Motor", 2], ["tl700Pan", 1], ["tl7001Cab", 1]);
const BY_MODEL = { tl7000Cab: RLU, tl7001Cab: FLU };

// By the reported unit; else the eight-car 700/0, the more numerous (60
// units against 55), which works the Sutton loop, the Kent routes and the
// stopping trains, where platforms are short; the twelve-car 700/1 runs
// the Bedford-Brighton and Peterborough-Horsham trunk. The units cannot
// couple in service, and the timetable does not say which train is which,
// so the label says "usually".
export const TYPICAL = {
  thameslink: (t, reported) => BY_MODEL[reported] || RLU,
};

const W700 = "https://en.wikipedia.org/wiki/British_Rail_Class_700";
const f700 = { model: "Siemens Class 700 Desiro City", type: "Electric multiple unit", builder: "Siemens (Krefeld)", built: "2014–2018", topSpeedMph: 100, source: W700 };
const f0 = { ...f700, fleet: "60 eight-car units", powerHp: 4425, seats: 427 };
const f1 = { ...f700, fleet: "55 twelve-car units", powerHp: 6705, seats: 666 };
export const FACTS = {
  tl7000Cab: { ...f0, lengthFt: 531.5,
    about: "A Class 700/0 driving car. The eight-car Desiro City, 162 m, with 427 seats (52 of them First, in the saloons behind each cab) and room for some 700 standing; it works on 25 kV overhead wire north of the Thames and 750 V third rail south of it, changing over at City Thameslink and Farringdon. In service since 2016." },
  tl7001Cab: { ...f1, lengthFt: 796,
    about: "A Class 700/1 driving car. The twelve-car Desiro City, 242.6 m in one fixed set with walk-through gangways, with 666 seats (52 of them First, behind each cab) and room for nearly 1,100 standing: built for the 24-trains-an-hour core between St Pancras and Blackfriars, where it can drive itself under automatic train operation." },
  tl700Pan: { ...f700, fleet: "115 units (60 eight-car, 55 twelve-car)",
    about: "The second car from each end, a trailer, carries a pantograph and, under its floor, a transformer for the 25 kV overhead wire north of London; south of the Thames the train lowers them and takes 750 V from the third rail." },
  tl700Motor: { ...f700, fleet: "115 units (60 eight-car, 55 twelve-car)",
    about: "A motor car, with traction gear under its floor: two in an eight-car set besides the driving cars, four in a twelve-car one. Two wide double doors a side." },
  tl700Mid: { ...f700, fleet: "115 units (60 eight-car, 55 twelve-car)",
    about: "A trailer car from the middle of the set: two wide double doors a side, broad gangways to the cars each side, and luggage and bicycle space." },
};
