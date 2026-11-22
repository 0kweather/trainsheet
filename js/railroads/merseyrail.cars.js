// Merseyrail's cars (scripts/railroads/gb.py, agency "merseyrail"): the
// Class 777, Stadler's articulated third-rail train, the only fleet on the
// Northern and Wirral lines since the last Class 507s and 508s left in
// 2024. The timetable names no unit, so every train is drawn as a 777,
// labeled as typical. Trainsheet's own side views from published
// dimensions, at the shared scale (js/carart.js), in Merseyrail's yellow,
// lettered here (no logo files). The toolkit is avanti.cars.js's.

import { rect, path, lines } from "../carart.js?v=dev";
import { seq, bands, boxes, ft, spread, fairing, unit, letters } from "./avanti.cars.js?v=dev";

// ---------- Paint ----------
// The 777's livery, Merseytravel's own (the trains belong to the Liverpool
// City Region, not the operator), drawn from memory of the trains, not
// checked against photographs: yellow all over (the map's is #fff200), a
// near-black band through the windows that widens into a mask round the
// windshield, a gray roof and a charcoal skirt; doors in a pale silver-
// gray, to stand out from the side as the accessibility rules ask; the
// cab front yellow under the black windshield, so no separate warning
// panel. "Merseyrail" in charcoal low on the side, with the "M" in its
// disc beside it.
const ME = { yellow: "#f7df00", deep: "#e3c800", roof: "#8f959b", band: "#1b1d21", skirt: "#2a2c30", door: "#d5d8db", trim: "#a9aeb4",
  ink: "#2b2d31", pale: "#6b6a3a" };
// Merseyrail's name, charcoal, centered on x, the capital h ft tall; the
// "M" in yellow on a charcoal disc before it.
const merseyrail = (c, x, y, h) => letters(c, x + h * 0.9, y, h, "Merseyrail", ME.ink, { weight: 700, spacing: "0.01em" });
const disc = (c, x, y, h) => rect(x - h * 0.85, y - h * 0.35, h * 1.7, h * 1.7, ME.ink, 0, `rx="${h * 0.85}"`) +
  letters(c, x, y, h, "M", ME.yellow, { weight: 800 });
// The unit's class number, small near the skirt.
const classNo = (c, x, y, text) => letters(c, x, y, 0.36, text, ME.pale, { weight: 600, spacing: "0.06em" });

// ---------- Class 777 ----------
// Stadler's METRO for Merseyrail, built at Bussnang, Altenrhein and Siedlce
// in 2018-2023: four articulated aluminium cars (DMSO-MSO-MSO-DMSO as the
// infobox has it), 64.98 m over all, on five trucks: a truck under each cab
// and three shared at the joints, 760 mm wheels. 3.828 m tall and 2.820 m
// wide; the floor low, 960 mm over the rail, level with the platforms, with
// a sliding step at each door; six double-leaf sliding plug doors a side,
// each 1.3 m wide (two on each end car, one on each intermediate). 750 V DC
// from the third rail, 2,100 kW at the wheels; 120 km/h (75 mph). 53
// units, 182 seats; seven of them (777/1) carry batteries to run beyond
// the third rail, to Headbolt Lane. (Wikipedia, "British Rail Class 777".
// The infobox gives no car lengths: 19.0 m end cars and 13.49 m
// intermediates are apportioned from the 64.98 m, from memory.)
const S7 = { sill: 3.15, roof: ft(3.828), band: 6.2, bandTop: 10.3, win: 6.55, winH: 3.3, cab: ft(19.0), mid: ft(13.49) };
// The front: upright, rounded at the corners, a deep windshield.
const NOSE_777 = [[0.7, 2.6], [0.4, 4.8], ["q", 0.45, 6.6, 1.7, 7.9], [4.6, S7.roof - 1.0], ["q", 5.4, S7.roof, 7.6, S7.roof]];
const s7Door = (x) => ({ x, w: 4.3, y0: S7.sill, y1: 10.5, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false, fill: ME.door });
const s7Row = (xs) => [{ xs, y: S7.win, w: 5.0, h: S7.winH, r: 0.45 }];
const s7Bay = (a, b) => spread(a, b, 5.0, 5.8);
// The side: yellow, the window band, a gray roof, the skirt; a deeper
// yellow line under the band.
const s7Paint = (cabArt = "") => (c, g) => bands(g.L, [[0, 20, ME.yellow], [S7.roof - 0.6, 3, ME.roof], [S7.band, S7.bandTop - S7.band, ME.band],
  [S7.band - 0.22, 0.22, ME.deep], [0, S7.sill, ME.skirt]]) + cabArt;
// The roof: the equipment (brake resistors, air conditioning) behind a
// long fairing; no pantograph.
const s7Roof = (a, b) => fairing(a, b, S7.roof, ME.trim) + rect(a + 1.5, S7.roof + 0.27, b - a - 3, 0.6, ME.roof, 0.4, 'rx="0.2"') +
  lines(seq(a + 3, 2.4, Math.max(0, Math.floor((b - a - 6) / 2.4))).map((x) => [x, S7.roof + 0.35, x, S7.roof + 0.8]), "rgba(0,0,0,0.18)", 0.4);
// A third-rail shoe and its beam, outside a truck at x.
const shoe = (x) => rect(x - 3.4, 1.05, 6.8, 0.34, "#3a3d42", 0, 'rx="0.12"') + rect(x - 0.7, 0.55, 1.4, 0.5, "#55595f", 0, 'rx="0.1"');
function s7Cab(c) {
  const L = c.L, d1 = 15.6, d2 = L - 13.2;
  return unit(c, { roof: S7.roof, sill: S7.sill, nose: NOSE_777, rake: [[1.8, 8.0], [4.4, S7.roof - 1.3]], depth: 2.8, cabLen: 9, lampY: 4.6, low: 3.6,
    rows: s7Row([...s7Bay(d1 + 5.1, d2 - 0.8), ...s7Bay(d2 + 5.1, L - 1.4)]), doors: [s7Door(d1), s7Door(d2)], trucks: [8.6, "end"], wheel: 30,
    diaphragm: [3.6, S7.roof - 1.1],
    // The black of the windshield sweeps back into the window band.
    paint: s7Paint(path(`M1.5 7.7L4.6 ${S7.roof - 1.0}L9.4 ${S7.roof - 1.0}Q11.4 ${S7.bandTop + 0.6} 13.6 ${S7.bandTop}L13.6 ${S7.band}Q8.0 ${S7.band + 0.3} 1.5 7.7Z`, ME.band)),
    surround: ME.band,
    extra: (cc, g) => s7Roof(7.8, g.L - 0.8) + boxes(21, g.L - 8, S7.sill, 2, 1.1) + shoe(8.6) +
      // The cab's side window.
      rect(6.4, 7.9, 2.4, 2.4, "#1d2026", 0.4) +
      disc(cc, d1 + 8.2, 4.35, 1.05) + merseyrail(cc, (d1 + 4.3 + d2) / 2 + 0.6, 4.35, 1.05) + classNo(cc, g.L - 6, 3.55, "777") });
}
function s7Mid(c) {
  const L = c.L, d = L / 2 - 2.15;
  return unit(c, { roof: S7.roof, sill: S7.sill,
    rows: s7Row([...s7Bay(1.4, d - 0.8), ...s7Bay(d + 5.1, L - 1.4)]), doors: [s7Door(d)], trucks: ["start", "end"], wheel: 30, diaphragm: [3.6, S7.roof - 1.1],
    paint: s7Paint(),
    extra: (cc, g) => s7Roof(0.8, g.L - 0.8) + boxes(8, g.L - 8, S7.sill, 2, 1.1) + merseyrail(cc, g.L * 0.25, 4.35, 0.8) });
}

// ---------- Tables ----------

// One class throughout (Merseyrail has no First). The end car and the
// intermediate car are each a type, placed in the formation, with its own
// fact sheet. Kind "emu" with no pantograph: the current comes from the
// third rail.
export const TYPES = {
  me777Cab: { name: "Class 777 end car", kind: "emu" },
  me777Mid: { name: "Class 777 car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  me777Cab: M(s7Cab, S7.cab, true),
  me777Mid: M(s7Mid, S7.mid),
};

// Units by number: 777 001-053 as built (Wikipedia); the seven fitted with
// batteries were renumbered into the 777/1 series (777 140-152, even
// numbers, from memory, not checked against a roster). The timetable names
// no unit; these are for the fleet pages.
export const FLEETS = {
  merseyrail: [[777001, 777053, "me777Cab"], [777140, 777152, "me777Cab"]],
};

const set = (label, ...units) => ({ label, units });
const C777 = set("Class 777: four articulated cars, third-rail electric; Standard only",
  ["me777Cab", 1], ["me777Mid", 2], ["me777Cab", 1]);

// Every Merseyrail train is a Class 777, one set or two coupled (eight
// cars at the peaks); the battery sets work the Headbolt Lane trains. The
// timetable does not say how many sets, so one is drawn and the label says
// "usually".
export const TYPICAL = {
  merseyrail: () => C777,
};

const W777 = "https://en.wikipedia.org/wiki/British_Rail_Class_777";
const c777 = { model: "Stadler Class 777 (METRO)", type: "Electric multiple unit", builder: "Stadler Rail (Bussnang, Altenrhein and Siedlce)", built: "2018–2023",
  fleet: "53 four-car units", topSpeedMph: 75, powerHp: 2816, seats: 182, source: W777 };
export const FACTS = {
  me777Cab: { ...c777, lengthFt: 213.2,
    about: "Merseyrail's only train since 2024, owned by the Liverpool City Region itself: four short articulated cars, open from end to end inside, on five trucks. The floor is level with the platforms and a step slides out at each door, so a wheelchair rolls aboard unaided. It takes 750 V DC from the third rail; seven sets also carry batteries, and run beyond the electrified line to Headbolt Lane." },
  me777Mid: { ...c777,
    about: "An intermediate car, about 13.5 m long, resting on a truck shared with its neighbor at each end, with one pair of doors a side. Standard class throughout; a set seats 182, with room to stand for about 300 more." },
};
