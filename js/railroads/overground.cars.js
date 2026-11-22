// London Overground's cars (scripts/railroads/gb.py, "overground"):
// Transport for London's orbital and suburban railway runs two fleets, both
// built by Bombardier at Derby and both drawn here. The Class 378
// Capitalstar (five cars, 2008-2011 and lengthened in 2015), an Electrostar
// with seats along the sides, on the Windrush and Mildmay lines; and the
// Class 710 Aventra (four cars, or five as the 710/3), since 2019 on the
// Weaver, Suffragette, Liberty and Lioness lines. The timetable names no
// unit, so a train is drawn as the model that usually runs its line,
// labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in the Overground's
// white, blue and orange, lettered here with its roundel (no logo files).
// The toolkit from avanti.cars.js; the Electrostar is drawn again here in
// its Capitalstar form, with a flat front and an emergency door in it, and
// the Aventra in its short suburban form (c2c's and Greater Anglia's 720s
// are longer and not exported).

import { rect, path, pantograph } from "../carart.js?v=dev";
import { n, bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// The Overground since 2007, drawn from memory and not checked against
// photographs: white sides and a gray roof, the windows set in the white
// with no band; a deep blue band along the foot of the side (Transport for
// London's blue) with a fine orange line over it; orange doors (the
// Overground's color, #fa7b05); the roundel, an orange ring crossed by a
// blue bar reading OVERGROUND, on the side of each car. The 378 has a
// yellow cab front under a black windshield mask; the 710 a charcoal cab
// end edged in orange, its front orange under the windshield.
const OV = { white: "#f4f4f2", orange: "#fa7b05", blue: "#0019a8", band: "#1f2126", skirt: "#2c2f36", roof: "#8f959b", trim: "#b9bec4", end: "#2b2d33", silver: "#c9cdd2" };

// The roundel, r ft in radius, centered on (x, y): the ring, its white
// middle, the blue bar and the name on it (which reads left to right on a
// mirrored car too).
const disc = (x, y, r, fill) => path(`M${n(x - r)} ${y}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0Z`, fill);
const roundel = (c, x, y, r = 1.0) => disc(x, y, r, OV.orange) + disc(x, y, n(r * 0.7), OV.white) +
  rect(n(x - r * 1.45), n(y - r * 0.25), n(r * 2.9), n(r * 0.5), OV.blue) +
  letters(c, x, n(y - r * 0.13), n(r * 0.3), "OVERGROUND", "#ffffff", { weight: 700, spacing: "0.04em" });
// The class number, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, OV.silver, { weight: 600, spacing: "0.06em" });
// The side: white, gray roof, the blue band along the foot with its orange
// line, a dark skirt; more for the cab end.
const sidePaint = (o, more = "") => (c, g) => bands(g.L, [[0, 20, OV.white], [o.roof - 0.6, 3, OV.roof], [0, o.sill + 1.0, OV.blue], [o.sill + 1.0, 0.16, OV.orange], [0, o.sill - 0.5, OV.skirt]]) + more;
// A double-leaf sliding door, orange.
const door2 = (x, o, w) => ({ x, w, y0: o.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill: OV.orange });
// A third-rail shoe beam, hung between a truck's axleboxes.
const shoe = (x) => rect(x - 2.3, 0.95, 4.6, 0.3, "#3b3f45", 0.3) + rect(x - 0.7, 0.5, 1.4, 0.45, "#6a4a2a", 0.3);

// ---------- Class 378 Capitalstar ----------
// An Electrostar for the Overground, built at Derby (Litchurch Lane) by
// Bombardier in 2008-2011 as three- and four-car sets and lengthened to
// five cars in 2015: 57 units, welded aluminium bodies with steel cab ends,
// driving cars 19.995 m and the others 19.660 m, 101.35 m over all, 2.80 m
// wide, 3.774 m tall, the floor 1.151 m over the rail, 840 mm wheels;
// 75 mph, 2,400 kW. Two double-leaf pocket sliding doors a side on each
// car, each 1.5 m wide; seats along the sides, 186 fixed and 86 tip-up,
// and room for some 900 standing. The 378/1s (378 135-154, DMS-MS-TS-MS-DMS)
// are third rail only, for the East London line; the 378/2s (378 201-234
// and 255-257, DMS-MS-PTS-MS-DMS) dual voltage, with a pantograph on the
// middle car. The cab front is flat, with an emergency door in it for the
// Thames Tunnel. (Wikipedia, "British Rail Class 378".)
const CS = { roof: ft(3.774), sill: ft(1.151), cab: ft(19.995), mid: ft(19.66) };
const NOSE_378 = [[0.45, 3.2], [0.3, 6.4], ["q", 0.32, 8.0, 0.95, 9.0], [2.1, CS.roof - 0.8], ["q", 2.5, CS.roof, 4.0, CS.roof]];
const csDoor = (x) => door2(x, CS, 4.9);
// The windows: wide panes, one bay each side of the doors and a long one
// between them.
const csRows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 4.6, 5.3)), y: 6.9, w: 4.6, h: 2.9, r: 0.35 }];
// o.shoes: third-rail shoe beams on the trucks (every set has them).
function csCab(c, o = {}) {
  const L = c.L, d1 = 16.4, d2 = L - 19.4;
  return unit(c, { roof: CS.roof, sill: CS.sill, nose: NOSE_378, rake: [[1.0, 8.9], [2.0, CS.roof - 1.1]], depth: 1.8, cabLen: 7, lampY: 4.9, low: 4.1,
    rows: csRows([[9.6, d1 - 0.7], [d1 + 5.6, d2 - 0.7], [d2 + 5.6, L - 1.4]]), doors: [csDoor(d1), csDoor(d2)], trucks: [9.6, L - 9.0], wheel: 33,
    diaphragm: [4.1, CS.roof - 1.1],
    // The cab end: the windshield's black mask and the yellow front under it.
    paint: sidePaint(CS, path(`M0.6 8.7L2.0 ${CS.roof - 0.8}L5.6 ${CS.roof - 0.8}L5.6 8.7Z`, OV.band) + yellowEnd(2.4, 3.2, 8.4)), surround: OV.band,
    extra: (cc, g) => fairing(4.2, g.L - 1.0, CS.roof, OV.trim) + hvac(g.L / 2 - 5, CS.roof + 0.27, 12, 0.55) + boxes(15.5, g.L - 14, CS.sill, 3, 1.3) +
      shoe(9.6) + shoe(g.L - 9.0) +
      // The cab's side window and door.
      rect(3.6, 8.6, 1.8, 2.0, "#1d2026", 0.4) + rect(6.4, 4.0, 1.9, 6.9, "rgba(0,0,0,0.12)", 0.5) +
      roundel(cc, (d1 + 4.9 + d2) / 2, 5.75) + classNo(cc, g.L - 8, 3.0, o.cls || "378") });
}
// o.pan: the pantograph and its well (the 378/2's trailer); o.trailer: no
// motors, less under the floor; otherwise a motor car.
function csMid(c, o = {}) {
  const L = c.L, d1 = 14.2, d2 = L - 19.1;
  return unit(c, { roof: CS.roof, sill: CS.sill,
    rows: csRows([[1.4, d1 - 0.7], [d1 + 5.6, d2 - 0.7], [d2 + 5.6, L - 1.4]]), doors: [csDoor(d1), csDoor(d2)], trucks: [9.0, L - 9.0], wheel: 33,
    diaphragm: [4.1, CS.roof - 1.1], paint: sidePaint(CS),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, CS.roof, OV.trim) +
      (o.pan ? pantograph(12.5, CS.roof + 0.29, { up: true, facing: -1 }) + hvLine(15.5, 23, CS.roof + 0.29) + hvac(g.L - 23, CS.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, CS.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, CS.sill, o.pan || o.trailer ? 2 : 3, o.pan ? 1.6 : 1.3) + (o.pan || o.trailer ? "" : shoe(9.0) + shoe(g.L - 9.0)) +
      roundel(cc, (d1 + 4.9 + d2) / 2, 5.75) });
}

// ---------- Bombardier Aventra: Class 710 ----------
// The Overground's Aventra, built at Derby (Litchurch Lane) by Bombardier
// in 2017-2020: 54 units of aluminium cars, driving cars 21.446 m and the
// others 19.990 m, 2.772 m wide, 3.760 m tall; two double-leaf sliding
// plug doors a side on each car; 75 mph. Four cars (DMS-PMS-MS-DMS,
// 82.87 m, 189 seats and 489 standing) as the 710/1 (710 101-130, 25 kV
// overhead only, seats along the sides and across) and the 710/2
// (710 256-273, with third-rail shoes too, seats along the sides); five
// cars (102.86 m, 241 seats and 614 standing) as the 710/3 (710 374-379,
// dual voltage). The pantograph rides on the second car. In service since
// May 2019. (Wikipedia, "British Rail Class 710"; the floor height, about
// 1.15 m, from memory.)
const AVT = { roof: ft(3.76), sill: 3.8, cab: ft(21.446), mid: ft(19.99) };
// The closed front, raked back over the windshield.
const NOSE_AVT = [[0.6, 3.1], [0.35, 5.6], ["q", 0.4, 7.4, 1.6, 8.6], [4.0, AVT.roof - 1.0], ["q", 4.7, AVT.roof, 6.8, AVT.roof]];
const avDoor = (x) => door2(x, AVT, 4.8);
const avRows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 4.8, 5.5)), y: 6.95, w: 4.8, h: 2.9, r: 0.4 }];
// The charcoal cab end, its edge slanting back toward the roof, an orange
// line along that edge; the front orange under the windshield.
const avEnd = (x0, x1) => path(`M-1 0L${x0} 0L${x1} 13.5L-1 13.5Z`, OV.end) +
  path(`M${x0} 0L${x0 + 0.7} 0L${x1 + 0.7} 13.5L${x1} 13.5Z`, OV.orange) +
  path(`M-1 3.1L3.0 3.1Q2.4 5.6 1.4 8.0L-1 8.0Z`, OV.orange);
function avCab(c, o = {}) {
  const L = c.L, d1 = 19.6, d2 = L - 20.4;
  return unit(c, { roof: AVT.roof, sill: AVT.sill, nose: NOSE_AVT, rake: [[1.8, 8.6], [3.8, AVT.roof - 1.3]], depth: 2.4, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: avRows([[d1 + 5.6, d2 - 0.7], [d2 + 5.6, L - 1.4]]), doors: [avDoor(d1), avDoor(d2)], trucks: [11.0, L - 9.4], wheel: 33,
    diaphragm: [4.1, AVT.roof - 1.1],
    paint: sidePaint(AVT, avEnd(10.6, 15.0) + path(`M1.4 8.4L4.0 ${AVT.roof - 1.0}L8.4 ${AVT.roof - 1.0}L8.4 8.4Z`, OV.band)), surround: OV.band,
    extra: (cc, g) => fairing(7.0, g.L - 1.0, AVT.roof, OV.trim) + hvac(g.L / 2 - 3, AVT.roof + 0.27, 12, 0.55) + boxes(17, g.L - 14, AVT.sill, 3, 1.4) +
      // The cab's side window and door.
      rect(5.6, 8.5, 2.2, 2.2, "#1d2026", 0.4) + rect(8.8, 4.0, 1.9, 6.9, "rgba(255,255,255,0.14)", 0.5) +
      roundel(cc, (d1 + 4.8 + d2) / 2, 5.8) + classNo(cc, g.L - 8, 3.0, "710") });
}
// o.pan: the pantograph over one truck, the transformer under the floor.
function avMid(c, o = {}) {
  const L = c.L, d1 = 14.6, d2 = L - 19.4;
  return unit(c, { roof: AVT.roof, sill: AVT.sill,
    rows: avRows([[1.4, d1 - 0.7], [d1 + 5.6, d2 - 0.7], [d2 + 5.6, L - 1.4]]), doors: [avDoor(d1), avDoor(d2)],
    trucks: [9.4, L - 9.4], wheel: 33, diaphragm: [4.1, AVT.roof - 1.1], paint: sidePaint(AVT),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, AVT.roof, OV.trim) +
      (o.pan ? pantograph(11, AVT.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, AVT.roof + 0.29) + hvac(g.L - 24, AVT.roof + 0.27, 12, 0.55) + boxes(15, g.L - 15, AVT.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, AVT.roof + 0.27, 12, 0.55) + boxes(15, g.L - 14, AVT.sill, 3, 1.4)) +
      roundel(cc, (d1 + 4.8 + d2) / 2, 5.8) });
}

// ---------- Tables ----------

// The Overground is Standard class only. Each car kind is its own type,
// placed in the formation, with its own fact sheet; the second driving-car
// types (ov3781Cab, ov7103Cab) are the same drawings, there to tell the
// third-rail 378/1 and the five-car 710/3 apart by unit number.
export const TYPES = {
  ov378Cab: { name: "Class 378 Capitalstar end car", kind: "emu" },
  ov3781Cab: { name: "Class 378/1 Capitalstar end car", kind: "emu" },
  ov378Motor: { name: "Class 378 Capitalstar motor car", kind: "emu" },
  ov378Pan: { name: "Class 378/2 Capitalstar pantograph car", kind: "emu", pan: true },
  ov378Trailer: { name: "Class 378/1 Capitalstar trailer car", kind: "emu" },
  ov710Cab: { name: "Class 710 Aventra end car", kind: "emu" },
  ov7103Cab: { name: "Class 710/3 Aventra end car", kind: "emu" },
  ov710Pan: { name: "Class 710 Aventra pantograph car", kind: "emu", pan: true },
  ov710Mid: { name: "Class 710 Aventra middle car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ov378Cab: M((c) => csCab(c), CS.cab, true),
  ov3781Cab: M((c) => csCab(c), CS.cab, true),
  ov378Motor: M((c) => csMid(c), CS.mid),
  ov378Pan: M((c) => csMid(c, { pan: true }), CS.mid),
  ov378Trailer: M((c) => csMid(c, { trailer: true }), CS.mid),
  ov710Cab: M((c) => avCab(c), AVT.cab, true),
  ov7103Cab: M((c) => avCab(c), AVT.cab, true),
  ov710Pan: M((c) => avMid(c, { pan: true }), AVT.mid),
  ov710Mid: M((c) => avMid(c), AVT.mid),
};

// Units by number (class and serial run together): 378 135-154 (378/1),
// 378 201-234 and 255-257 (378/2); 710 101-130 (710/1), 710 256-273
// (710/2), 710 374-379 (710/3). The timetable names no unit; these are for
// the fleet pages.
export const FLEETS = {
  overground: [[378135, 378154, "ov3781Cab"], [378201, 378234, "ov378Cab"], [378255, 378257, "ov378Cab"],
    [710101, 710130, "ov710Cab"], [710256, 710273, "ov710Cab"], [710374, 710379, "ov7103Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C3782 = set("Class 378/2 Capitalstar: five cars, electric (overhead and third rail); Standard only",
  ["ov378Cab", 1], ["ov378Motor", 1], ["ov378Pan", 1], ["ov378Motor", 1], ["ov378Cab", 1]);
const C3781 = set("Class 378/1 Capitalstar: five cars, electric (third rail); Standard only",
  ["ov3781Cab", 1], ["ov378Motor", 1], ["ov378Trailer", 1], ["ov378Motor", 1], ["ov3781Cab", 1]);
const A710 = set("Class 710 Aventra: four cars, electric; Standard only",
  ["ov710Cab", 1], ["ov710Pan", 1], ["ov710Mid", 1], ["ov710Cab", 1]);
const A7103 = set("Class 710/3 Aventra: five cars, electric (overhead and third rail); Standard only",
  ["ov7103Cab", 1], ["ov710Pan", 1], ["ov710Mid", 2], ["ov7103Cab", 1]);
const BY_MODEL = { ov378Cab: C3782, ov378Motor: C3782, ov378Pan: C3782, ov3781Cab: C3781, ov378Trailer: C3781,
  ov710Cab: A710, ov710Pan: A710, ov710Mid: A710, ov7103Cab: A7103 };

// By the reported unit; else by the train's line (gb.py tells the six
// apart by the stations called at). Windrush (the East London line, third
// rail throughout) is the 378/1's, though 378/2s work it too; Mildmay (the
// North and West London lines, under the wires east of Acton) the 378/2's;
// Weaver (out of Liverpool Street), Liberty (Romford to Upminster) and
// Suffragette (Gospel Oak to Barking Riverside) the four-car 710's;
// Lioness (Euston to Watford Junction) the five-car 710/3's, with 710/2s
// and 378s beside them. The timetable does not say which train is which,
// so the label says "usually". A train whose line is not known is drawn as
// the 378/2, the most numerous.
const BY_LINE = [[/windrush/i, C3781], [/mildmay/i, C3782], [/lioness/i, A7103], [/weaver|liberty|suffragette/i, A710]];
export const TYPICAL = {
  overground: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = `${t.line || ""} ${t.route || ""}`;
    return BY_LINE.find(([re]) => re.test(r))?.[1] || C3782;
  },
};

const W378 = "https://en.wikipedia.org/wiki/British_Rail_Class_378";
const W710 = "https://en.wikipedia.org/wiki/British_Rail_Class_710";
const f378 = { model: "Bombardier Class 378 Capitalstar", type: "Electric multiple unit", builder: "Bombardier (Derby)", built: "2008–2011, 2015",
  fleet: "57 five-car units", topSpeedMph: 75, powerHp: 3218, seats: 186, source: W378 };
const f710 = { model: "Bombardier Class 710 Aventra", type: "Electric multiple unit", builder: "Bombardier (Derby)", built: "2017–2020",
  fleet: "48 four-car and 6 five-car units", topSpeedMph: 75, seats: 189, source: W710 };
export const FACTS = {
  ov378Cab: { ...f378, lengthFt: 332.5,
    about: "A Class 378 driving car. The Capitalstar is an Electrostar built for the Overground when it opened: seats along the sides like a Tube train, wide gangways the length of the set and room for some 900 standing beside 186 fixed seats. Delivered as three- and four-car sets from 2009, all were lengthened to five cars, 101 m, in 2015. The 378/2s take 25 kV from the overhead wire or 750 V from the third rail, and work the Mildmay line." },
  ov3781Cab: { ...f378, lengthFt: 332.5,
    about: "A Class 378/1 driving car. The twenty 378/1s take 750 V from the third rail only and work the Windrush line, through Brunel's Thames Tunnel; the door in the flat cab front is the way out of a train stopped there." },
  ov378Motor: { ...f378,
    about: "A motor car, with two double doors a side, each 1.5 m wide. Four of a set's five cars are motored." },
  ov378Pan: { ...f378,
    about: "The middle car of a 378/2, a trailer: it carries the set's pantograph and, under its floor, the transformer." },
  ov378Trailer: { ...f378,
    about: "The middle car of a 378/1, a trailer with no pantograph: these sets run on the third rail alone." },
  ov710Cab: { ...f710, lengthFt: 271.9,
    about: "A Class 710 driving car. The Overground's Aventras entered service in May 2019 on the Gospel Oak to Barking line, which had just been electrified, and then replaced the old trains out of Liverpool Street and on the Watford line: four cars, 82.9 m, with 189 seats and room for 489 standing, at up to 75 mph. The 710/1s run under the wires only; the 710/2s have third-rail shoes too." },
  ov7103Cab: { ...f710, lengthFt: 337.5, seats: 241,
    about: "A Class 710/3 driving car. Six sets were built with five cars, 102.9 m, with 241 seats and room for 614 standing, for the Lioness line between Euston and Watford Junction." },
  ov710Pan: { ...f710,
    about: "The second car carries the set's pantograph and, under its floor, the transformer; it has the wheelchair spaces." },
  ov710Mid: { ...f710,
    about: "A middle motor car: two wide double doors a side and walk-through gangways the length of the set." },
};
