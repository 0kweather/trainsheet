// Midtjyske Jernbaner's cars (scripts/railroads/denmark.py): the trains of
// routes 92 and 93, Holstebro to Skjern and Vemb through Lemvig to
// Thyborøn. Two fleets: the Siemens Mireo Plus B two-car battery unit, in
// service on both routes since December 2025, and the Siemens Desiro
// Classic two-car diesel unit (ex-DSB), kept as the reserve. The timetable
// names no unit, so each train is drawn as one Mireo, labeled as typical.
// Trainsheet's own side views from published dimensions, at the shared
// scale (js/carart.js), lettered here (no logo files). Bodies and parts
// from czechia.cars.js; the Mireo's geometry as in deprivat.cars.js, the
// Desiro's as in nordjyske.cars.js.
//
// The Mireo's paint is checked against two photographs on Wikimedia
// Commons: unit 563 002 "Vinden" (MJB 20B) charging at Lemvig on December
// 19, 2025 ("Siemens Mireo Plus B Lemvig.jpg", Pfefferdose, CC BY 4.0), a
// three-quarter view from the front, and MJB 10B near Klinkby on March 26,
// 2026 ("MJB 10B nær Klinkby.jpg", Svein Julton, CC BY 4.0), nearly a side
// view of the whole unit. A white nose and a white strip under the roof; a
// black mask round the windshield running back over the cab door; the nose
// black below the lamps and the skirt black along the whole side. The side
// is one long panel from the skirt to just over the windows, pale coral at
// the top deepening to red at the bottom, ending ahead of the cab door in a
// blunt point toward the nose; along its foot a white band with a rolling
// top edge, like dunes, with small white landmarks standing on it (drawn
// here as a lighthouse and a church tower; they are too small to copy).
// The doors and the window band are black. "Midtjyske Jernbaner" and its
// two-stroke mark in white between the cab door and the first windows (each
// unit also carries its own name above them and its number on the skirt,
// left off here, where one drawing stands for all seven). The roof carries black housings almost end
// to end, and a pantograph by the joint on the one-door car, raised only at
// a charging station and drawn folded here. The two cars differ: one has
// one double door a side, the other two (the Klinkby photograph). The red
// panel on the front, with "midttrafik" and the MJB number, does not show
// in a side view.
//
// The Desiro's paint is checked against two photographs of one unit (4113
// and 4913 on its two ends) at Ringkøbing on August 7, 2021 ("Desiro train
// of Midtjyske Jernbaner at Ringkøbing Station 01/02.jpg", Leif Jørgensen,
// CC BY-SA 4.0, Wikimedia Commons): bright red from the skirt to the roof,
// warming to orange along the middle of each car; white stripes fanning
// from a point at the roof behind the cab, widening as they fall toward
// the joint; a gray cap over the cab down to the top of the windshield,
// the windshield and the destination panel under it black, a dark gray
// bumper and skirt; dark doors; a white bicycle on the dark glass beside
// the door; "Midtjyske Jernbaner" and its mark in white low on the side
// behind the cab. Both are three-quarter views from the front: the
// stripes' exact course, the windows' spacing and the roof equipment are
// Trainsheet's reading. "midttrafik" on the front does not show in a side
// view.

import { rect, path, line, pantograph, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac, exhaust, tank } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 1, depth = 0.8) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Paint ----------
const MJ = { red: "#e01b22", deep: "#b81d22", mid: "#d93a2c", warm: "#e4604a", coral: "#ec8a74", orange: "#f04e23",
  white: "#f4f5f6", black: "#18191d", roof: "#9aa0a8", cap: "#8b929b", skirt: "#4a4b4f" };
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// The name in two lines and the two strokes of the mark under it, white.
const name = (c, x, y, h) => letters(c, x, y, h, "Midtjyske", MJ.white, { weight: 600, family: SANS }) +
  letters(c, x, y - h * 1.15, h, "Jernbaner", MJ.white, { weight: 600, family: SANS }) +
  path(`M${x - h * 1.6} ${y - h * 2.0}L${x + h * 1.9} ${y - h * 2.0}L${x + h * 1.2} ${y - h * 2.25}Z`, MJ.white) +
  path(`M${x - h * 1.0} ${y - h * 2.4}L${x + h * 1.5} ${y - h * 2.4}L${x + h * 0.9} ${y - h * 2.62}Z`, MJ.white);

// ---------- Mireo Plus B ----------
// Two cars on a shared Jakobs truck, a motor truck under each cab; a long
// raked nose, a cab door behind it, wide window bands. Car A has one double
// door a side and the pantograph, car B two double doors.
const MR = { roof: 13.3, sill: 2.6, len: 76.6, win: { y: 5.6, h: 4.6 }, skirt: 3.5, top: 11.6 };
const MNOSE = [[1.4, 2.3], [0.7, 3.8], ["q", 0.5, 6.4, 1.6, 8.6], [4.6, 12.4], ["q", 5.6, 13.3, 8.0, 13.3]];
// The white band's rolling top edge along the foot of the red, from x = a.
function dunes(a, L) {
  let d = `M${a} ${MR.skirt}L${a} 4.3`;
  for (let x = a, k = 0; x < L + 1; x += 9, k++) d += `Q${x + 4.5} ${k % 2 ? 4.0 : 5.6} ${x + 9} ${k % 2 ? 4.3 : 4.5}`;
  return path(`${d}L${L + 1} ${MR.skirt}Z`, MJ.white);
}
function mireoPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, MJ.white]]) +
    // The panel: coral at the top deepening to red, from behind the cab to
    // the joint.
    bands(L, [[MR.skirt, 2.6, MJ.deep], [6.0, 1.9, MJ.red], [7.8, 1.4, MJ.mid], [9.1, 1.3, MJ.warm], [10.3, MR.top - 10.3, MJ.coral]]) +
    // White again ahead of the panel's blunt point, which reaches toward the
    // nose at lamp height.
    path(`M-1 ${MR.skirt}L-1 ${MR.top}L8.6 ${MR.top}L8.6 9.4Q7.6 6.4 4.6 5.4Q7.4 4.6 8.6 ${MR.skirt}Z`, MJ.white) +
    dunes(8.6, L) +
    // The black mask: round the windshield and back over the cab door.
    path("M0.9 8.4L4.4 12.6Q5.4 13.3 7.6 13.3L12.6 13.3L12.6 11.4L8.4 11.4Q7.0 9.6 5.2 8.4Z", MJ.black) +
    // The black of the lower nose and the skirt.
    path(`M-1 0L-1 4.2Q2.6 4.2 4.4 ${MR.skirt}L${L + 1} ${MR.skirt}L${L + 1} 0Z`, MJ.black);
}
// A lighthouse and a church tower, white, standing on the dunes.
const lighthouse = (x) => path(`M${x - 0.28} 4.6L${x + 0.28} 4.6L${x + 0.16} 6.6L${x - 0.16} 6.6Z`, MJ.white) + rect(x - 0.26, 6.6, 0.52, 0.16, MJ.white) + rect(x - 0.14, 6.76, 0.28, 0.34, MJ.white);
const tower = (x) => rect(x - 0.7, 4.5, 1.4, 0.7, MJ.white) + rect(x - 0.32, 5.2, 0.64, 0.9, MJ.white) + path(`M${x - 0.38} 6.1L${x + 0.38} 6.1L${x} 6.75Z`, MJ.white);
const mDoor = (x, w = 4.8) => ({ x, w, y0: 2.3, y1: 10.5, leaves: 2, glassY: 0.38, glassH: 0.5, grabs: false, fill: MJ.black });
const cabDoor = { x: 9.6, w: 2.5, y0: 2.6, y1: 11.2, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: true, fill: MJ.black };
// A black housing on the roof.
const housing = (a, b) => rect(a, MR.roof - 0.05, b - a, 0.95, "#1e2024", 0.4, 'rx="0.3"') + line(a + 0.6, MR.roof + 0.5, b - 0.6, MR.roof + 0.5, "rgba(255,255,255,0.14)", 0.5);
// A window band: its panes side by side in one black surround.
const band = (a, b, k) => ({ xs: seq(a + 0.25, (b - a - 0.25) / k, k), y: MR.win.y, w: (b - a - 0.25) / k - 0.25, h: MR.win.h, r: 0.3 });
const strip = (a, b) => rect(a, MR.win.y - 0.25, b - a, MR.win.h + 0.5, MJ.black, 0, 'rx="0.4"');
function mireo(c, two) {
  const L = c.L;
  // [from, to, panes] of each window band, and the double doors.
  const wins = two ? [[13.8, 37.6, 4], [45.8, 58.2, 2], [68.6, 74.4, 1]] : [[15.9, 39.4, 4], [48.6, 66.2, 3], [70.0, 75.2, 1]];
  const doors = two ? [mDoor(39.1), mDoor(61.2)] : [mDoor(41.4)];
  return unit(c, { roof: MR.roof, sill: MR.sill, nose: MNOSE, rake: [[1.6, 8.6], [4.6, 12.4]], depth: 3.4, cabLen: 9, lampY: 5.3, bare: true,
    rows: wins.map(([a, b, k]) => band(a, b, k)), doors: [cabDoor, ...doors], trucks: [10.0, "end"],
    paint: (cc, g) => mireoPaint(cc, g) + wins.map(([a, b]) => strip(a, b)).join("") + (two ? lighthouse(60.0) + tower(42.6) : lighthouse(47.4) + tower(68.4)),
    surround: MJ.black,
    extra: (cc, g) =>
      // The name between the cab door and the first windows (car A; on car
      // B the windows begin sooner, and it sits under them).
      (two ? name(cc, 17.6, 5.05, 0.34) : name(cc, 14.0, 7.6, 0.52)) +
      // Roof: black housings almost end to end; on car A they stop short of
      // the joint for the pantograph, folded.
      housing(12.5, 30) + housing(30.6, two ? 52 : 46) + (two ? housing(52.6, L - 2.5) : housing(46.6, 60) + pantograph(67.5, MR.roof, { up: false, facing: -1 })) +
      // Under the floor between the trucks.
      boxes(18, 36, MR.sill, 2, 1.0) + boxes(50, L - 8, MR.sill, 2, 0.9) });
}

// ---------- Desiro Classic ----------
// 41.7 m over the couplers as two articulated cars on a shared Jakobs
// truck, a motor truck under each cab; a rounded nose under a big raked
// windshield, one double plug door a side in each car, the floor low
// between the trucks, tall windows.
const D = { roof: 13.8, sill: 3.4, len: 68.4 };
const DNOSE = [[1.2, 2.6], [0.9, 4.4], ["q", 0.8, 6.4, 1.6, 7.6], [4.6, 12.4], ["q", 5.6, 13.8, 7.6, 13.8]];
function desiroPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, MJ.red]]) +
    // The orange along the middle of the car, its edges soft.
    rect(17, 0, 5, 20, MJ.orange, 0, 'opacity="0.35"') + rect(22, 0, 20, 20, MJ.orange, 0, 'opacity="0.8"') + rect(42, 0, 6, 20, MJ.orange, 0, 'opacity="0.35"') +
    // The white stripes: from a point at the roof behind the cab, widening
    // as they fall toward the joint.
    path(`M13 13.1L${L + 1} 4.6L${L + 1} 8.2Z`, MJ.white) +
    path(`M24 13.1L${L + 1} 9.6L${L + 1} 11.6Z`, MJ.white) +
    path(`M30 9.0L${L + 1} 2.4L${L + 1} 3.6Z`, MJ.white) +
    bands(L, [[13.1, 3, MJ.roof], [0, 2.45, MJ.skirt]]) +
    // The gray cap: the roof coming down over the cab to the top of the
    // windshield, its edge curving back up to the roof line.
    path("M-1 20L-1 11.6L4.2 11.6Q8.4 11.9 12.4 13.1L12.4 20Z", MJ.cap) +
    // The black of the windshield's wrap and the destination panel below it.
    path("M-1 6.3L-1 11.6L4.2 11.6Q5.6 11.4 6.2 10.4L3.6 6.3Z", MJ.black) +
    // The dark gray bumper round the bottom of the nose.
    path("M-1 0L-1 3.5L4.4 3.5Q5.6 3.3 6.0 2.45L6.0 0Z", MJ.skirt);
}
// A bicycle, white, on the dark glass beside the door.
const bike = (x, y) => `<g fill="none" stroke="${MJ.white}" stroke-width="0.14"><circle cx="${x - 0.55}" cy="${y}" r="0.42"/><circle cx="${x + 0.55}" cy="${y}" r="0.42"/>` +
  `<path d="M${x - 0.55} ${y}L${x - 0.15} ${y + 0.6}L${x + 0.4} ${y + 0.6}L${x + 0.55} ${y}M${x - 0.15} ${y + 0.6}L${x + 0.05} ${y}L${x + 0.4} ${y + 0.6}"/></g>`;
function desiro(c) {
  const L = c.L;
  return unit(c, { roof: D.roof, sill: D.sill, drop: { a: 18, b: L - 2, y: 2.6 }, nose: DNOSE, rake: [[1.6, 7.6], [4.6, 12.4]], depth: 3.6, cabLen: 9, lampY: 4.6,
    rows: [{ xs: [7.0], y: 7.6, w: 1.8, h: 3.4, r: 0.3 }, { xs: [10.6], y: 7.6, w: 2.0, h: 4.4, r: 0.3 }, { xs: seq(14.0, 5.0, 3), y: 7.6, w: 4.2, h: 4.4, r: 0.35 },
      { xs: [29.0], y: 7.6, w: 2.6, h: 4.4, r: 0.3 }, { xs: seq(42.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }, { xs: [62.2], y: 7.6, w: 2.4, h: 4.4, r: 0.3 }],
    doors: [{ x: 35.6, w: 4.3, y0: 2.6, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.5, grabs: false, fill: "#2a2b30" }],
    trucks: [10.8, "end"], paint: desiroPaint, surround: MJ.black,
    extra: (cc, g) => exhaust(24, D.roof) + hvac(14, D.roof, 8, 0.6) + hvac(45, D.roof, 10, 0.6) +
      tank(20, 30, D.sill, 1.6) + boxes(42, 60, 2.6, 2, 0.4) + bike(44.1, 9.6) +
      // The name and its mark, white, low on the side behind the cab.
      name(cc, 12.6, 6.5, 0.8) });
}

// ---------- Tables ----------

export const TYPES = {
  mjMireoA: { name: "Mireo Plus B car (one door, pantograph)", kind: "emu" },
  mjMireoB: { name: "Mireo Plus B car (two doors)", kind: "emu" },
  mjDesiro: { name: "Desiro Classic car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet: half of 46.7 m (Mireo Plus B, two cars), half of 41.7 m (Desiro).
export const MODELS = {
  mjMireoA: M((c) => mireo(c, false), MR.len, true),
  mjMireoB: M((c) => mireo(c, true), MR.len, true),
  mjDesiro: M(desiro, D.len, true),
};

const set = (label, ...units) => ({ label, units });
const MIREO = set("Typical Midtjyske train: a Siemens Mireo Plus B two-car battery unit", ["mjMireoA", 1], ["mjMireoB", 1]);
// The reserve fleet: drawn for the fleet page, not put on any train.
export const RESERVE = set("Midtjyske's reserve: a Siemens Desiro two-car diesel unit", ["mjDesiro", 2]);

// The timetable (Rejseplanen's) names no unit. The Mireos have worked both
// routes, 92 (Holstebro-Skjern) and 93 (Vemb-Lemvig-Thyborøn), since
// December 2025; the Desiros stand in only when one is short, so no train
// is drawn as one.
export const TYPICAL = {
  midtjyske: () => MIREO,
};

// Seats, top speed and range are Siemens's figures for this order (its
// 2022 release gives 120 seats; a later one gives 127 for the two-car
// train, so the seats are left out). The Desiros' count and seats are left
// out: not checked against a source here.
const MIREO_FACTS = { model: "Siemens Mireo Plus B", type: "Battery multiple unit", builder: "Siemens Mobility", fleet: "7 two-car units", built: "2024–2025",
  topSpeedMph: 87, lengthFt: 153.2,
  source: "https://press.siemens.com/global/en/pressrelease/siemens-mobility-supply-first-battery-powered-mireo-plus-b-trains-denmark",
  about: "A two-car battery train, its cars sharing a truck at the joint. It runs on its batteries, about 80 km on a charge, and recharges under short lengths of overhead wire at stations such as Lemvig. Midtjyske Jernbaner's seven have worked both its routes, Holstebro to Skjern and Vemb through Lemvig to Thyborøn, since December 2025; each carries a name (the one photographed at Lemvig, 563 002, is \"Vinden\")." };
export const FACTS = {
  mjMireoA: MIREO_FACTS,
  mjMireoB: MIREO_FACTS,
  mjDesiro: { model: "Siemens Desiro Classic", type: "Diesel multiple unit", builder: "Siemens", topSpeedMph: 74.6, lengthFt: 136.8,
    source: "https://en.wikipedia.org/wiki/Siemens_Desiro",
    about: "A two-car diesel unit, its two cars sharing a truck at the joint, low-floor between the trucks with one double door a side in each car. Midtjyske Jernbaner's came from DSB and wear red warming to orange, with white stripes fanning down the side; since the battery trains arrived they are the reserve." },
};
