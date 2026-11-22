// The Elizabeth line's cars (scripts/railroads/gb.py, "elizabeth"):
// Transport for London's railway under central London, from Reading and
// Heathrow to Shenfield and Abbey Wood, runs one fleet, the Class 345
// Aventra: nine cars, 205 m, built by Bombardier at Derby for Crossrail.
// The timetable names no unit, and every train is a 345, drawn as typical.
// Trainsheet's own side views from published dimensions, at the shared
// scale (js/carart.js), in the Elizabeth line's white, black and blue,
// lettered here with its purple roundel (no logo files). The toolkit from
// avanti.cars.js; the Aventra is drawn again here in its long three-door
// form (the Overground's 710 and the 720s are other lengths, with two
// doors a side, and are not exported).

import { rect, path, pantograph } from "../carart.js?v=dev";
import { n, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// The Elizabeth line since 2017, drawn from memory and not checked against
// photographs: white sides and a gray roof; the windows set in a
// near-black band that runs the length of the car; a deep blue band along
// the foot of the side (Transport for London's blue); charcoal doors; the
// roundel, a purple ring (the line's color, #60399e) crossed by a blue bar
// reading ELIZABETH LINE, on the side of each car; a black cab end round
// the windshield with a yellow front under it.
const EL = { white: "#f4f4f2", purple: "#60399e", blue: "#0019a8", band: "#1f2126", door: "#33363d", skirt: "#2c2f36", roof: "#8f959b", trim: "#b9bec4", silver: "#c9cdd2" };

// The roundel, r ft in radius, centered on (x, y): the ring, its white
// middle, the blue bar and the name on it (which reads left to right on a
// mirrored car too).
const disc = (x, y, r, fill) => path(`M${n(x - r)} ${y}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0Z`, fill);
const roundel = (c, x, y, r = 1.0) => disc(x, y, r, EL.purple) + disc(x, y, n(r * 0.7), EL.white) +
  rect(n(x - r * 1.75), n(y - r * 0.25), n(r * 3.5), n(r * 0.5), EL.blue) +
  letters(c, x, n(y - r * 0.13), n(r * 0.29), "ELIZABETH LINE", "#ffffff", { weight: 700, spacing: "0.04em" });
// The class number, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, EL.silver, { weight: 600, spacing: "0.06em" });

// ---------- Bombardier Aventra: Class 345 ----------
// Built at Derby (Litchurch Lane) by Bombardier in 2015-2019 for
// Crossrail: 70 units (345 001-070) of nine aluminium cars with steel
// cabs, driving cars 23.615 m and the others 22.500 m, 204.73 m over all,
// 2.772 m wide, 3.760 m tall, the floor 1.145 m over the rail, 825 mm
// wheels; 90 mph, 4,400 kW at the rail, 25 kV overhead. Three double-leaf
// sliding plug doors a side on each car, each 1.45 m wide; 454 seats,
// along the sides and across, and room for 1,046 standing. The formation
// is DMS-PMS-MS-MS-TS-MS-MS-PMS-DMS, a pantograph on the second car from
// each end and a trailer in the middle. (Wikipedia, "British Rail Class
// 345".)
const AVT = { roof: ft(3.76), sill: ft(1.145), cab: ft(23.615), mid: ft(22.5) };
// The closed front, raked back over the windshield.
const NOSE = [[0.6, 3.1], [0.35, 5.6], ["q", 0.4, 7.4, 1.6, 8.6], [4.0, AVT.roof - 1.0], ["q", 4.7, AVT.roof, 6.8, AVT.roof]];
const DOOR_W = ft(1.45);
const door = (x) => ({ x, w: DOOR_W, y0: AVT.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: EL.door });
// The windows: wide panes between the doors, in the black band.
const rows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 4.6, 5.3)), y: 6.95, w: 4.6, h: 2.9, r: 0.4 }];
// The bays left between the doors (xs: their left edges) from a to b.
const bays = (a, xs, b) => [a, ...xs.map((x) => x + DOOR_W + 0.7)].map((x0, i) => [x0, (xs[i] ?? b + 0.7) - 0.7]);
// The side: white, gray roof, the black window band from x0 on, the blue
// band along the foot, a dark skirt; more for the cab end.
const sidePaint = (x0, more = "") => (c, g) => bands(g.L, [[0, 20, EL.white], [AVT.roof - 0.6, 3, EL.roof], [0, AVT.sill + 0.9, EL.blue], [0, AVT.sill - 0.5, EL.skirt]]) +
  rect(x0, 6.6, g.L + 1 - x0, 3.6, EL.band) + more;
// A roundel under the windows in each bay between two doors.
const roundels = (c, xs) => xs.slice(0, -1).map((x, i) => roundel(c, (x + DOOR_W + xs[i + 1]) / 2, 5.65, 0.85)).join("");

function avCab(c) {
  const L = c.L, ds = [17.6, L / 2 + 2.6, L - 12.6];
  return unit(c, { roof: AVT.roof, sill: AVT.sill, nose: NOSE, rake: [[1.8, 8.6], [3.8, AVT.roof - 1.3]], depth: 2.4, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: rows(bays(ds[0] + DOOR_W + 0.7, ds.slice(1), L - 1.4)), doors: ds.map(door), trucks: [11.0, L - 9.4], wheel: 32.5,
    diaphragm: [4.1, AVT.roof - 1.1],
    // The cab end: black from the windshield back to the cab door, its edge
    // slanting toward the roof, and the yellow front under the windshield.
    paint: sidePaint(11.0, path(`M-1 8.2L1.4 8.2L4.0 ${AVT.roof - 1.0}L12.4 ${AVT.roof - 1.0}L11.0 6.6L8.6 3.1L-1 3.1Z`, EL.band) + yellowEnd(2.6, 3.1, 8.0)), surround: EL.band,
    extra: (cc, g) => fairing(7.0, g.L - 1.0, AVT.roof, EL.trim) + hvac(g.L / 2 - 3, AVT.roof + 0.27, 12, 0.55) + boxes(17, g.L - 14, AVT.sill, 3, 1.4) +
      // The cab's side window and door.
      rect(5.6, 8.5, 2.2, 2.2, "#14161a", 0.4) + rect(8.8, 4.0, 1.9, 6.9, "rgba(255,255,255,0.14)", 0.5) +
      roundels(cc, ds) + classNo(cc, g.L - 6, 3.0, "345") });
}
// o.pan: the pantograph over one truck, the transformer under the floor;
// o.trailer: no motors, less under the floor.
function avMid(c, o = {}) {
  const L = c.L, ds = [8.6, (L - DOOR_W) / 2, L - 8.6 - DOOR_W];
  return unit(c, { roof: AVT.roof, sill: AVT.sill,
    rows: rows(bays(1.4, ds, L - 1.4)), doors: ds.map(door), trucks: [9.4, L - 9.4], wheel: 32.5,
    diaphragm: [4.1, AVT.roof - 1.1], paint: sidePaint(-1),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, AVT.roof, EL.trim) +
      (o.pan ? pantograph(11, AVT.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, AVT.roof + 0.29) + hvac(g.L - 26, AVT.roof + 0.27, 12, 0.55) + boxes(15, g.L - 15, AVT.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, AVT.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, AVT.sill, o.trailer ? 2 : 3, 1.4)) +
      roundels(cc, ds) });
}

// ---------- Tables ----------

// The Elizabeth line is Standard class only. Each car kind is its own
// type, placed in the formation, with its own fact sheet.
export const TYPES = {
  el345Cab: { name: "Class 345 Aventra end car", kind: "emu" },
  el345Pan: { name: "Class 345 Aventra pantograph car", kind: "emu", pan: true },
  el345Motor: { name: "Class 345 Aventra motor car", kind: "emu" },
  el345Trailer: { name: "Class 345 Aventra trailer car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  el345Cab: M((c) => avCab(c), AVT.cab, true),
  el345Pan: M((c) => avMid(c, { pan: true }), AVT.mid),
  el345Motor: M((c) => avMid(c), AVT.mid),
  el345Trailer: M((c) => avMid(c, { trailer: true }), AVT.mid),
};

// Units by number (class and serial run together): 345 001-070. The
// timetable names no unit; these are for the fleet pages.
export const FLEETS = {
  elizabeth: [[345001, 345070, "el345Cab"]],
};

const set = (label, ...units) => ({ label, units });
const A345 = set("Class 345 Aventra: nine cars, electric; Standard only",
  ["el345Cab", 1], ["el345Pan", 1], ["el345Motor", 2], ["el345Trailer", 1], ["el345Motor", 2], ["el345Pan", 1], ["el345Cab", 1]);

// Every Elizabeth line train is a nine-car 345.
export const TYPICAL = {
  elizabeth: () => A345,
};

const W345 = "https://en.wikipedia.org/wiki/British_Rail_Class_345";
const f345 = { model: "Bombardier Class 345 Aventra", type: "Electric multiple unit", builder: "Bombardier (Derby)", built: "2015–2019",
  fleet: "70 nine-car units", topSpeedMph: 90, powerHp: 5900, seats: 454, source: W345 };
export const FACTS = {
  el345Cab: { ...f345, lengthFt: 671.7,
    about: "A Class 345 driving car. The Aventras were built for Crossrail and entered service in June 2017 out of Liverpool Street, five years before the tunnels under central London opened as the Elizabeth line. A set is nine cars and 205 m long, walk-through from end to end, with 454 seats and room for some 1,050 standing, and runs at up to 90 mph on 25 kV from the overhead wire." },
  el345Pan: { ...f345,
    about: "The second car from each end carries a pantograph and, under its floor, a transformer." },
  el345Motor: { ...f345,
    about: "A middle motor car: three wide double doors a side, each 1.45 m across, with seats along the sides by the doors and across the car between them." },
  el345Trailer: { ...f345,
    about: "The middle car of the nine, the set's one trailer, with the wheelchair spaces." },
};
