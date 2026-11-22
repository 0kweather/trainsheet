// c2c's cars (scripts/railroads/gb.py, "c2c"): the London, Tilbury and
// Southend line out of Fenchurch Street has two fleets, both drawn here. The
// Class 357 Electrostar (Adtranz/Bombardier, four cars), which has worked
// nearly every train since 2000-2002; and the Class 720/6 Aventra
// (Bombardier/Alstom, five cars), twelve units added in 2023. The timetable
// names no unit, so a train is drawn as the model that usually runs it,
// labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in c2c's white with its
// magenta name, lettered here (no logo files). The toolkit from
// avanti.cars.js; the Electrostar is drawn again here in its first form,
// with a closed cab front (Great Western's 387 has a gangway, and its copy
// is not exported), and the Aventra likewise (Greater Anglia's is not
// exported).

import { rect, path, pantograph } from "../carart.js?v=dev";
import { bands, boxes, ft, spread, yellowEnd, fairing, unit, letters, hvac, hvLine } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// c2c today, drawn from memory and not checked against photographs: white
// sides, a gray roof and a charcoal skirt, the windows set in the white
// with no band; "c2c" lower-case and heavy in magenta (the railroad's
// color, #b7007c) under the windows mid-car; a yellow panel on the cab
// front under a black windshield mask. The 357 has deep blue doors (left
// from its National Express years); the 720 magenta doors and a charcoal
// cab end.
const CC = { white: "#f4f4f2", magenta: "#b7007c", blue: "#1f3a6e", band: "#1f2126", skirt: "#33363b", roof: "#8f959b", trim: "#b9bec4", end: "#3a3d43", silver: "#c9cdd2" };

// c2c's name, h ft tall, centered on x; reads left to right on a mirrored
// car too.
const c2c = (c, x, y, h, fill = CC.magenta) => letters(c, x, y, h, "c2c", fill, { weight: 800, spacing: "-0.02em" });
// The class number, small on the skirt at the inner end of a driving car.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, CC.silver, { weight: 600, spacing: "0.06em" });
// The side: white, gray roof, charcoal skirt; more(g) for the cab end.
const sidePaint = (o, more = "") => (c, g) => bands(g.L, [[0, 20, CC.white], [o.roof - 0.6, 3, CC.roof], [0, o.sill, CC.skirt]]) + more;
// A double-leaf sliding plug door.
const door2 = (x, o, w, fill) => ({ x, w, y0: o.sill, y1: 10.8, leaves: 2, glassY: 0.48, glassH: 0.36, grabs: false, fill });

// ---------- Class 357 Electrostar ----------
// The first Electrostar, built at Derby (Litchurch Lane) by Adtranz and
// then Bombardier in 1999-2002: 74 units of four steel-ended aluminium cars
// (DMSO-MSO-PTSO-DMSO), driving cars 20.40 m and the others 19.99 m,
// 2.80 m wide, 3.78 m tall; 100 mph, 2,011 hp from six motors, 25 kV 50 Hz
// overhead, the pantograph on the third car (the trailer). A closed,
// rounded cab front with no gangway (unlike the later Electrostars); two
// double-leaf sliding plug doors a side at the thirds of each car; 282
// seats (222 in the 357/3 "metro" sets, with more standing room).
// (Wikipedia, "British Rail Class 357".)
const ES = { roof: ft(3.78), sill: 3.7, cab: ft(20.40), mid: ft(19.99) };
const NOSE_357 = [[0.5, 3.2], [0.3, 6.2], ["q", 0.35, 7.6, 1.2, 8.5], [3.0, ES.roof - 0.9], ["q", 3.5, ES.roof, 5.2, ES.roof]];
const esDoor = (x) => door2(x, ES, 4.4, CC.blue);
// The windows: three bays, one each side of the doors and a long one
// between them.
const esRows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 4.4, 5.2)), y: 6.95, w: 4.4, h: 2.85, r: 0.4 }];
function esCab(c) {
  const L = c.L, d1 = 17.4, d2 = L - 19.6;
  return unit(c, { roof: ES.roof, sill: ES.sill, nose: NOSE_357, rake: [[1.3, 8.5], [2.9, ES.roof - 1.2]], depth: 2.2, cabLen: 8, lampY: 5.0, low: 4.1,
    rows: esRows([[10.4, d1 - 0.8], [d1 + 5.2, d2 - 0.8], [d2 + 5.2, L - 1.6]]), doors: [esDoor(d1), esDoor(d2)], trucks: [10.2, L - 9.2], wheel: 33,
    diaphragm: [4.1, ES.roof - 1.1],
    // The cab end: the windshield's black mask and the yellow panel under it.
    paint: sidePaint(ES, path(`M1.0 8.3L3.0 ${ES.roof - 0.9}L6.6 ${ES.roof - 0.9}L6.6 8.3Z`, CC.band) + yellowEnd(2.6, 3.2, 8.0)), surround: CC.band,
    extra: (cc, g) => fairing(5.4, g.L - 1.0, ES.roof, CC.trim) + hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55) + boxes(16, g.L - 14, ES.sill, 3, 1.3) +
      // The cab's side window and door.
      rect(4.6, 8.4, 1.9, 2.1, "#1d2026", 0.4) + rect(7.4, 4.0, 1.9, 6.9, "rgba(0,0,0,0.12)", 0.5) +
      c2c(cc, (d1 + 4.4 + d2) / 2, 5.0, 1.7) + classNo(cc, g.L - 8, 3.05, "357") });
}
function esMid(c) {
  const L = c.L, d1 = 14.4, d2 = L - 18.8;
  // The pantograph rides on the third car, a trailer, with the transformer
  // under its floor.
  const pan = c.index === 2;
  return unit(c, { roof: ES.roof, sill: ES.sill,
    rows: esRows([[1.6, d1 - 0.8], [d1 + 5.2, d2 - 0.8], [d2 + 5.2, L - 1.6]]), doors: [esDoor(d1), esDoor(d2)], trucks: [9.2, L - 9.2], wheel: 33,
    diaphragm: [4.1, ES.roof - 1.1], paint: sidePaint(ES),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, ES.roof, CC.trim) +
      (pan ? pantograph(13, ES.roof + 0.29, { up: true, facing: -1 }) + hvLine(16, 24, ES.roof + 0.29) + hvac(g.L - 24, ES.roof + 0.27, 12, 0.55)
        : hvac(g.L / 2 - 6, ES.roof + 0.27, 12, 0.55)) +
      boxes(15, g.L - 15, ES.sill, pan ? 2 : 3, pan ? 1.6 : 1.3) + c2c(cc, (d1 + 4.4 + d2) / 2, 5.0, 1.7) });
}

// ---------- Bombardier Aventra: Class 720/6 ----------
// The Aventra, built at Derby (Litchurch Lane) by Bombardier and, from
// 2021, Alstom: c2c's twelve units, 720 601-612, are five aluminium cars
// (DMS-PMSL-MS-MS-DTS) of 24.2 m, 122 m over all, 2.77 m wide; two
// double-leaf sliding plug doors a side on each car; 443 seats and 236
// standing; 100 mph, 2,300 kW, 25 kV 50 Hz overhead, the pantograph on the
// second car. In service since September 2023. (Wikipedia, "British Rail
// Class 720". The driving cars' 24.47 m against 24.21 m, and the height,
// about 3.87 m, are from memory, as in greateranglia.cars.js.)
const AVT = { roof: ft(3.87), sill: 3.8, cab: ft(24.47), mid: ft(24.21) };
// The closed front, raked back over the windshield.
const NOSE_AVT = [[0.6, 3.1], [0.35, 5.6], ["q", 0.4, 7.4, 1.6, 8.6], [4.0, AVT.roof - 1.0], ["q", 4.7, AVT.roof, 6.8, AVT.roof]];
const avDoor = (x) => door2(x, AVT, 4.6, CC.magenta);
const avRows = (bays) => [{ xs: bays.flatMap(([a, b]) => spread(a, b, 5.0, 5.7)), y: 7.0, w: 5.0, h: 2.9, r: 0.4 }];
// The charcoal cab end, its edge slanting back toward the roof, and a
// magenta line along that edge.
const avEnd = (x0, x1) => path(`M-1 ${AVT.sill}L${x0} ${AVT.sill}L${x1} 13.5L-1 13.5Z`, CC.end) +
  path(`M${x0} ${AVT.sill}L${x0 + 0.7} ${AVT.sill}L${x1 + 0.7} 13.5L${x1} 13.5Z`, CC.magenta);
function avCab(c) {
  const L = c.L, d1 = 21.0, d2 = L - 23.4;
  return unit(c, { roof: AVT.roof, sill: AVT.sill, nose: NOSE_AVT, rake: [[1.8, 8.6], [3.8, AVT.roof - 1.3]], depth: 2.4, cabLen: 9, lampY: 5.0, low: 4.1,
    rows: avRows([[d1 + 5.4, d2 - 0.8], [d2 + 5.4, L - 1.6]]), doors: [avDoor(d1), avDoor(d2)], trucks: [11.2, L - 9.8], wheel: 33,
    diaphragm: [4.1, AVT.roof - 1.1],
    paint: sidePaint(AVT, avEnd(11.6, 15.2) + path(`M1.4 8.4L4.0 ${AVT.roof - 1.0}L8.4 ${AVT.roof - 1.0}L8.4 8.4Z`, CC.band) + yellowEnd(2.8, 3.1, 8.0)), surround: CC.band,
    extra: (cc, g) => fairing(7.0, g.L - 1.0, AVT.roof, CC.trim) + hvac(30, AVT.roof + 0.27, 12, 0.55) + boxes(17, g.L - 14, AVT.sill, 4, 1.4) +
      // The cab's side window and door.
      rect(5.6, 8.5, 2.2, 2.2, "#1d2026", 0.4) + rect(8.8, 4.0, 1.9, 6.9, "rgba(0,0,0,0.22)", 0.5) +
      c2c(cc, (d1 + 4.6 + d2) / 2, 5.05, 1.7) + classNo(cc, g.L - 8.5, 3.1, "720") });
}
// o.pan: the pantograph over one truck, the transformer under the floor.
function avMid(c, o = {}) {
  const L = c.L, d1 = 20.6, d2 = L - 25.2;
  return unit(c, { roof: AVT.roof, sill: AVT.sill,
    rows: avRows([[1.6, d1 - 0.8], [d1 + 5.4, d2 - 0.8], [d2 + 5.4, L - 1.6]]), doors: [avDoor(d1), avDoor(d2)],
    trucks: [9.8, L - 9.8], wheel: 33, diaphragm: [4.1, AVT.roof - 1.1], paint: sidePaint(AVT),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, AVT.roof, CC.trim) +
      (o.pan ? pantograph(11, AVT.roof + 0.29, { up: true, facing: -1 }) + hvLine(14, 22, AVT.roof + 0.29) + hvac(g.L - 27, AVT.roof + 0.27, 12, 0.55) + boxes(16, g.L - 16, AVT.sill, 2, 1.6)
        : hvac(g.L / 2 - 6, AVT.roof + 0.27, 12, 0.55) + boxes(16, g.L - 14, AVT.sill, 4, 1.4)) +
      c2c(cc, (d1 + 4.6 + d2) / 2, 5.05, 1.7) });
}

// ---------- Tables ----------

// c2c is Standard class only. Each car kind is its own type, placed in the
// formation, with its own fact sheet.
export const TYPES = {
  c2357Cab: { name: "Class 357 Electrostar end car", kind: "emu" },
  c2357Mid: { name: "Class 357 Electrostar middle car", kind: "emu", pan: true },
  c2720Cab: { name: "Class 720 Aventra end car", kind: "emu" },
  c2720Pan: { name: "Class 720 Aventra pantograph car", kind: "emu", pan: true },
  c2720Mid: { name: "Class 720 Aventra middle car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  c2357Cab: M(esCab, ES.cab, true),
  c2357Mid: M(esMid, ES.mid, false, byIndex),
  c2720Cab: M(avCab, AVT.cab, true),
  c2720Pan: M((c) => avMid(c, { pan: true }), AVT.mid),
  c2720Mid: M((c) => avMid(c), AVT.mid),
};

// Units by number (class and serial run together): 357 001-046 (357/0),
// 357 201-228 (357/2, of which seventeen were renumbered 357 312-328 as
// 357/3 metro sets; ranges from memory), 720 601-612. The timetable names
// no unit; these are for the fleet pages.
export const FLEETS = {
  c2c: [[357001, 357046, "c2357Cab"], [357201, 357228, "c2357Cab"], [357312, 357328, "c2357Cab"], [720601, 720612, "c2720Cab"]],
};

const set = (label, ...units) => ({ label, units });
const E357 = set("Class 357 Electrostar: four cars, electric; Standard only",
  ["c2357Cab", 1], ["c2357Mid", 2], ["c2357Cab", 1]);
const A720 = set("Class 720 Aventra: five cars, electric; Standard only",
  ["c2720Cab", 1], ["c2720Pan", 1], ["c2720Mid", 2], ["c2720Cab", 1]);
const BY_MODEL = {};
for (const k of Object.keys(TYPES)) BY_MODEL[k] = k.startsWith("c2720") ? A720 : E357;

// By the reported unit; else the Class 357, 74 of c2c's 86 units, which
// works every route (Fenchurch Street to Shoeburyness by Basildon, by
// Tilbury and by Ockendon) alone or coupled in twos and threes. The twelve
// 720s run as ten-car pairs, mostly at the peaks. The timetable does not
// say which train is which, so the label says "usually".
export const TYPICAL = {
  c2c: (t, reported) => BY_MODEL[reported] || E357,
};

const W357 = "https://en.wikipedia.org/wiki/British_Rail_Class_357";
const W720 = "https://en.wikipedia.org/wiki/British_Rail_Class_720";
const f357 = { model: "Bombardier Class 357 Electrostar", type: "Electric multiple unit", builder: "Adtranz, Bombardier (Derby)", built: "1999–2002",
  fleet: "74 four-car units", topSpeedMph: 100, powerHp: 2011, seats: 282, source: W357 };
const f720 = { model: "Alstom Class 720 Aventra", type: "Electric multiple unit", builder: "Bombardier, Alstom (Derby)", built: "2018–2024",
  fleet: "12 five-car units", topSpeedMph: 100, powerHp: 3084, seats: 443, source: W720 };
export const FACTS = {
  c2357Cab: { ...f357, lengthFt: 265,
    about: "A Class 357 driving car. The first of the Electrostar family, built at Derby for the London, Tilbury and Southend line, where it replaced the whole slam-door fleet between 2000 and 2002: four cars, 80.8 m, with 282 seats, at up to 100 mph. Unlike the later Electrostars its cab front is closed, with no gangway. Sets run alone or coupled as eight- and twelve-car trains." },
  c2357Mid: { ...f357,
    about: "A middle car, with two double doors a side. The second car is a motor car; the third, a trailer, carries the set's pantograph and its transformer. Seventeen sets (the 357/3s) have fewer seats, 222, and more room to stand." },
  c2720Cab: { ...f720, lengthFt: 400.3,
    about: "A Class 720 driving car. c2c's twelve Aventras, built at Derby, entered service in September 2023: five cars, about 122 m, with 443 seats and room for 236 standing, at up to 100 mph. They run coupled in pairs as ten-car trains." },
  c2720Pan: { ...f720,
    about: "The second car carries the set's pantograph and, under its floor, the transformer; it also has the lavatory." },
  c2720Mid: { ...f720,
    about: "A middle car: two wide double doors a side and walk-through gangways the length of the set." },
};
