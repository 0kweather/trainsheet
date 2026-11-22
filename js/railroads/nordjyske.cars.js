// Nordjyske Jernbaner's cars (scripts/railroads/denmark.py): the trains of
// routes 75 and 76, Skagen and Hirtshals through Aalborg to Hobro and
// Skørping. Two fleets: the Siemens Desiro Classic two-car diesel unit (the
// type DSB calls Litra MQ), on the Skagen and Hirtshals branches since
// 2004-05, and the Alstom Coradia Lint 41, delivered in 2017 for the main
// line through Aalborg to Frederikshavn that Nordjyske took over from DSB.
// The timetable names no unit, so each train is drawn as one set of the
// fleet its route points to, labeled as typical. Trainsheet's own side
// views from published dimensions, at the shared scale (js/carart.js),
// lettered here (no logo files). Bodies and parts from czechia.cars.js; the
// Desiro's geometry as in romania.cars.js, the Lint's as in
// gocollective.cars.js.
//
// The Desiro's paint is checked against one photograph, a unit at Frederikshavn
// showing "Skagen": the sides deep blue, the roof silver-gray and coming
// down as a gray cap over the cab to the top of the windshield, the
// windshield and the destination panel under it black, the nose blue below
// that, a silver-gray bumper and skirt along the bottom, and "Nordjyske
// Jernbaner" in white low on the side behind the cab. The photograph is a
// three-quarter view from the front with the side in shadow: the doors'
// color, the windows' spacing and the roof equipment are Trainsheet's
// reading of the type, not of this photograph. The "NT" on the front does
// not show in a side view.
//
// The Lint's paint is checked against photographs of Lm 676-646 at
// Frederikshavn on August 3, 2018 (bahnbilder.de nos. 1104387 and 1104178,
// both also on Wikimedia Commons): a brighter blue than the Desiro's from
// the skirt to the roof, the front blue too under a black windshield and
// destination panel, a gray cap over the cab and gray roof housings, a gray
// bumper and skirt. White ribbons sweep off the nose's corner just above the
// bumper and run down into the skirt under the cab; behind the cab's side
// window a white ribbon climbs the side and fans into three stripes at the
// roof. Low behind the cab an orange disc (a slogan in it, too small to
// letter here), then a small white mark and "velkommen videre" ahead of the
// door, whose leaves are framed white. The photographs are three-quarter
// views from the front: the windows' count behind the door, the roof
// equipment and the other end of each section are Trainsheet's reading of
// the type. The wing mark and "NJ" on the front do not show in a side view.

import { rect, path, circle, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac, exhaust, tank } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 1, depth = 0.8) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Paint ----------
const NJ = { blue: "#1c3fa8", deep: "#16308a", silver: "#aeb3b9", roof: "#9a9fa6", skirt: "#8d9299", black: "#17191d", white: "#f4f6f8" };
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";

// ---------- Desiro Classic ----------
// 41.7 m over the couplers as two articulated cars on a shared Jakobs
// truck, a motor truck under each cab; a rounded nose under a big raked
// windshield, one double plug door a side in each car, the floor low
// between the trucks, tall windows.
const D = { roof: 13.8, sill: 3.4, len: 68.4 };
const NOSE = [[1.2, 2.6], [0.9, 4.4], ["q", 0.8, 6.4, 1.6, 7.6], [4.6, 12.4], ["q", 5.6, 13.8, 7.6, 13.8]];
function paint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, NJ.blue], [13.1, 3, NJ.roof], [0, 2.45, NJ.skirt]]) +
    // The silver-gray cap: the roof coming down over the cab to the top of
    // the windshield, its edge curving back up to the roof line.
    path("M-1 20L-1 11.6L4.2 11.6Q8.4 11.9 12.4 13.1L12.4 20Z", NJ.silver) +
    // The black of the windshield's wrap and the destination panel below it.
    path("M-1 6.3L-1 11.6L4.2 11.6Q5.6 11.4 6.2 10.4L3.6 6.3Z", NJ.black) +
    // The silver-gray bumper round the bottom of the nose.
    path("M-1 0L-1 3.5L4.4 3.5Q5.6 3.3 6.0 2.45L6.0 0Z", NJ.silver);
}
const door = (x) => ({ x, w: 4.3, y0: 2.6, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.5, grabs: false, fill: NJ.deep });
function desiro(c) {
  const L = c.L;
  return unit(c, { roof: D.roof, sill: D.sill, drop: { a: 18, b: L - 2, y: 2.6 }, nose: NOSE, rake: [[1.6, 7.6], [4.6, 12.4]], depth: 3.6, cabLen: 9, lampY: 4.6,
    rows: [{ xs: [7.0], y: 7.6, w: 1.8, h: 3.4, r: 0.3 }, { xs: [10.6], y: 7.6, w: 2.0, h: 4.4, r: 0.3 }, { xs: seq(14.0, 5.0, 3), y: 7.6, w: 4.2, h: 4.4, r: 0.35 },
      { xs: [29.0], y: 7.6, w: 2.6, h: 4.4, r: 0.3 }, { xs: seq(42.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }, { xs: [62.2], y: 7.6, w: 2.4, h: 4.4, r: 0.3 }],
    doors: [door(35.6)], trucks: [10.8, "end"], paint, surround: NJ.black,
    extra: (cc, g) => exhaust(24, D.roof) + hvac(14, D.roof, 8, 0.6) + hvac(45, D.roof, 10, 0.6) +
      tank(20, 30, D.sill, 1.6) + boxes(42, 60, 2.6, 2, 0.4) +
      // The name, white, low on the side behind the cab.
      letters(cc, 22.5, 5.9, 0.95, "Nordjyske", NJ.white, { weight: 700, style: "italic", family: SANS }) +
      letters(cc, 23.9, 4.8, 0.95, "Jernbaner", NJ.white, { weight: 700, style: "italic", family: SANS }) });
}

// ---------- Coradia Lint 41 ----------
// Two sections, 41.8 m over the couplers, a truck under each cab end and a
// Jakobs truck shared at the joint; one double plug door a side in each
// section, three windows ahead of it. Nordjyske's are the 2017 build, the
// front blunter and the windshield taller than on the older Lints.
const LB = { blue: "#1f4fd0", door: "#eef1f5", roof: "#8f959c", skirt: "#70767e", orange: "#f2a93b", black: "#14161a", white: "#f6f8fa" };
const LINT = { roof: 13.4, sill: 2.8, len: 68.7, win: { y: 6.4, h: 3.8 } };
const LNOSE = [[1.0, 2.8], [0.9, 5.4], ["q", 0.9, 6.6, 1.6, 7.6], [4.0, 12.5], ["q", 4.7, 13.4, 6.4, 13.4]];
function lintPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, LB.blue], [12.6, 3, LB.roof]]) +
    // The gray cap over the cab, down to the top of the windshield.
    path("M-1 20L-1 12.3L4.6 12.3Q6.6 12.3 7.6 12.6L7.6 20Z", LB.roof) +
    // The white ribbons off the nose's corner, sweeping down into the skirt
    // under the cab: a broad one low, a narrower one over it.
    path("M-1 3.3L-1 4.45Q4.6 4.4 8.6 3.3Z", LB.white) +
    path("M1.4 4.95Q7.2 4.9 11.6 3.3L10.2 3.3Q6.4 4.5 1.4 4.6Z", LB.white) +
    path("M4.6 5.45Q9.6 5.3 13.6 3.3L12.9 3.3Q9.2 4.95 4.6 5.2Z", LB.white) +
    // The ribbon up the side behind the cab's window, and its three stripes
    // at the roof, the foremost leaning toward the cab.
    path("M13.3 5.9L14.1 5.9L14.1 10.5L13.3 10.5Z", LB.white) +
    path("M13.5 10.5L14.1 10.5L14.1 12.6L13.5 12.6Z", LB.white) +
    path("M12.5 10.5L13.1 10.5L13.0 12.6L12.4 12.6Z", LB.white) +
    path("M11.5 10.5L12.1 10.5L10.5 12.6L9.7 12.6Z", LB.white) +
    // The gray bumper and skirt.
    bands(L, [[0, 3.3, LB.skirt]]);
}
const lintCar = (c) => unit(c, { roof: LINT.roof, sill: LINT.sill, nose: LNOSE, rake: [[1.6, 7.6], [4.0, 12.3]], depth: 3.2, cabLen: 8, lampY: 5.6,
  rows: [{ xs: seq(14.8, 5.7, 3), y: LINT.win.y, w: 4.8, h: LINT.win.h, r: 0.4 }, { xs: seq(38.4, 6.0, 4), y: LINT.win.y, w: 5.0, h: LINT.win.h, r: 0.4 }],
  doors: [{ x: 32.3, w: 4.4, y0: LINT.sill, y1: 10.5, leaves: 2, glassY: 0.2, glassH: 0.7, grabs: false, fill: LB.door }],
  trucks: [10.5, "end"], paint: lintPaint, surround: LB.black,
  // The cab's side window.
  cab: () => path("M7.8 6.5L12.9 6.5L12.9 10.2L9.4 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) =>
    // The orange disc low behind the cab.
    circle(15.4, 4.7, 1.05, LB.orange) +
    // The greeting, white, low on the side ahead of the door.
    letters(cc, 25.6, 5.0, 0.62, "velkommen videre", LB.white, { weight: 500, family: SANS }) +
    letters(cc, 22.4, 4.2, 0.6, "NJ", LB.white, { weight: 800, family: SANS }) +
    // Roof: the housing behind the cab, the exhaust, a second housing aft.
    hvac(11.5, LINT.roof, 13, 0.9) + exhaust(29, LINT.roof) + hvac(41, LINT.roof, 12, 0.7) +
    // Under the floor: the power pack's boxes and the fuel tank.
    boxes(17, 31, LINT.sill, 2, 1.0) + tank(41, 48, LINT.sill, 1.2) + boxes(50, g.L - 7, LINT.sill, 1, 0.9) });

// ---------- Tables ----------

export const TYPES = {
  njDesiro: { name: "Desiro Classic car", kind: "emu" },
  njLint: { name: "Coradia Lint 41 section", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet: half of 41.7 m (Desiro), half of 41.8 m (Lint).
export const MODELS = {
  njDesiro: M(desiro, D.len, true),
  njLint: M(lintCar, LINT.len, true),
};

const set = (label, ...units) => ({ label, units });
const DESIRO = set("Typical Nordjyske branch train: a Siemens Desiro two-car diesel unit", ["njDesiro", 2]);
const LINT41 = set("Typical Nordjyske main-line train: an Alstom Coradia Lint 41 two-section diesel unit", ["njLint", 2]);

// The timetable (Rejseplanen's) names no unit. The Lints work the main line,
// Skørping and Hobro through Aalborg to Frederikshavn; the Desiros the
// Skagen and Hirtshals branches. So a train that stays north of Aalborg and
// begins or ends at Skagen or Hirtshals (route 75's Skagen locals from
// Frederikshavn and Hjørring, route 76's Hjørring-Hirtshals shuttles) is
// drawn as a Desiro, and every train that touches Aalborg, Hobro or
// Skørping, the through trains to Skagen and Hirtshals among them, as a
// Lint. With no endpoints to go by, route 76 is a Desiro and route 75 a
// Lint.
const BRANCH = /Skagen|Hirtshals/, SOUTH = /Aalborg|Hobro|Skørping/;
export const TYPICAL = {
  nordjyske: (t = {}) => {
    const ends = `${t.origin || ""} ${t.destination || t.dest || ""}`.trim();
    if (!ends) return String(t.route || t.line || "").trim() === "76" ? DESIRO : LINT41;
    return BRANCH.test(ends) && !SOUTH.test(ends) ? DESIRO : LINT41;
  },
};

// Seats and fleet size are left out: not checked against a source here.
export const FACTS = {
  njDesiro: { model: "Siemens Desiro Classic", type: "Diesel multiple unit", builder: "Siemens", topSpeedMph: 74.6, lengthFt: 136.8,
    source: "https://en.wikipedia.org/wiki/Siemens_Desiro",
    about: "A two-car diesel unit, its two cars sharing a truck at the joint, low-floor between the trucks with one double door a side in each car. Nordjyske Jernbaner's wear deep blue under a silver-gray roof and work the Skagen and Hirtshals branches." },
  njLint: { model: "Alstom Coradia Lint 41", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", topSpeedMph: 87, lengthFt: 137.4,
    source: "https://en.wikipedia.org/wiki/Alstom_Coradia_LINT",
    about: "Two articulated sections on a shared truck, a diesel power pack under each. Nordjyske Jernbaner's were delivered in 2017, when it took over the trains between Skørping, Aalborg and Frederikshavn from DSB; they wear bright blue with white ribbons round the cab. The unit photographed at Frederikshavn is Lm 676-646." },
};
