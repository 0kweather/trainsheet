// DSB Vores Tog's cars (scripts/railroads/denmark.py): the former Arriva
// Denmark's, then GoCollective's, trains on routes 030, 031 and RX, DSB's
// since September 1, 2026. Two fleets: the Alstom Coradia Lint 41, a
// two-section diesel unit, on most lines (Aarhus-Herning-Skjern, Aarhus-
// Viborg-Struer, Struer-Thisted, Esbjerg-Skjern, Esbjerg-Tønder-Niebüll,
// Varde-Nørre Nebel), and 16 Siemens Desiro Classic two-car diesel units
// taken over from DSB in December 2020, on Odense-Svendborg and
// Struer-Vejle. Trainsheet's own side views from published dimensions, at
// the shared scale (js/carart.js). Bodies and parts from czechia.cars.js;
// the Desiro's geometry as in nordjyske.cars.js.
//
// The paint is checked against two photographs: no. 1002 at Struer with
// "GoCollective" on its destination display, and the same class at a level
// crossing in Arriva's lettering. Arriva's successor kept its paint and took
// the lettering off, and DSB Vores Tog took the units over as they were, so
// the sides here carry none: the teal body, the cream
// front arching up behind the windshield to the roof, the black round the
// cab's glass, the gray roof, the thin yellow line low along the side and
// the dark panel above it ahead of the door. How many windows sit behind
// the door (four) is Trainsheet's reading of photographs taken at an angle.
//
// The Desiro's paint is checked against one photograph: AR 3069 at Struer
// on August 8, 2024, before DSB Vores Tog, showing "Thisted" (Wikimedia
// Commons, "GoCollective AR 3069 at Struer Station"). It is still in the
// paint DSB gave it, without a name or a logo on the side: white sides, a
// dark navy band through the windows that begins behind the cab with a
// curved edge, low at the front and sweeping up to the roof; the front
// white round a black windshield and destination panel, a gray roof coming
// down as a cap over the cab, a dark gray strip under the panel (the
// unit's number is on it, on the front only), a gray skirt and bumper, and
// red doors. The photograph is a three-quarter view from the front: the
// windows' spacing, the roof equipment and what hangs under the floor are
// Trainsheet's reading of the type, not of this photograph.

import { rect, path, slats, underframe } from "../carart.js?v=dev";
import { unit, hvac, exhaust, tank } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Paint ----------
// Teal from the floor to the roof's edge, the roof gray. At the cab a cream
// band: the whole front under the windshield (the lamps are in it), then a
// narrow arch up the side behind the windshield to the roof; under it, low
// on the nose, the teal again. A thin yellow line low along the side from
// behind the cab to the train's other end. Doors in a lighter teal.
const GC = { teal: "#149fb3", light: "#3fb9c9", cream: "#efe9cf", roof: "#a4abb0", yellow: "#f2c400", black: "#14161a", panel: "#3c3a36" };
const LINE = { y: 4.25, h: 0.24, from: 13.6 };
function paint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, GC.teal]]) +
    // The cream front and its arch, back edge sweeping from the bumper's
    // foot up to the roof behind the windshield.
    path("M-1 3.9L3.4 3.9Q6.6 4.5 7.4 7.6L10.1 13.6L-1 13.6Z", GC.cream) +
    bands(L, [[12.55, 3, GC.roof]]) +
    rect(LINE.from, LINE.y, L + 1 - LINE.from, LINE.h, GC.yellow);
}

// ---------- Lint 41 ----------
// Two sections, 41.8 m over the couplers, each on a truck of its own under
// the cab end and a Jakobs truck shared at the joint; a long raked nose and
// windshield; one double plug door a side in the middle of each section,
// three windows ahead of it and four behind; the cab's side window a dark
// quadrilateral raked like the arch in front of it. The power pack hangs
// under each section's floor; the cooling and air-conditioning housings and
// the exhaust are on the roof.
const LINT = { roof: 13.4, sill: 2.8, win: { y: 6.4, h: 3.8 } };
const NOSE = [[1.0, 2.8], [1.0, 5.6], ["q", 1.1, 7.0, 2.0, 8.0], [4.6, 12.4], ["q", 5.4, 13.4, 7.2, 13.4]];
const lintCar = (c) => unit(c, { roof: LINT.roof, sill: LINT.sill, nose: NOSE, rake: [[2.0, 8.0], [4.6, 12.4]], cabLen: 8, lampY: 4.9,
  rows: [{ xs: seq(14.6, 5.7, 3), y: LINT.win.y, w: 4.8, h: LINT.win.h, r: 0.4 }, { xs: seq(38.4, 6.0, 4), y: LINT.win.y, w: 5.0, h: LINT.win.h, r: 0.4 }],
  doors: [{ x: 32.3, w: 4.4, y0: LINT.sill, y1: 10.5, leaves: 2, glassY: 0.3, glassH: 0.58, grabs: false, fill: GC.light }],
  trucks: [10.5, "end"], paint, surround: GC.black,
  // The cab's side window.
  cab: () => path("M8.1 6.5L13.0 6.5L13.0 10.2L9.7 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) =>
    // The dark panel on the side just over the yellow line, ahead of the door.
    rect(24.6, LINE.y + LINE.h + 0.12, 4.6, 0.95, GC.panel, 0.4, 'rx="0.1"') + slats(24.8, LINE.y + LINE.h + 0.17, 4.2, 0.85, 0.45, "rgba(0,0,0,0.3)") +
    // Roof: the housing behind the cab, the exhaust, a second housing aft.
    hvac(11.5, LINT.roof, 13, 0.9) + exhaust(29, LINT.roof) + hvac(41, LINT.roof, 12, 0.7) +
    // Under the floor: the power pack's boxes and the fuel tank.
    boxes(17, 31, LINT.sill, 2, 1.0) + tank(41, 48, LINT.sill, 1.2) + boxes(50, g.L - 7, LINT.sill, 1, 0.9) });

// ---------- Desiro Classic ----------
// 41.7 m over the couplers as two articulated cars on a shared Jakobs
// truck, a motor truck under each cab; a rounded nose under a big raked
// windshield, one double plug door a side in each car, the floor low
// between the trucks, tall windows in the navy band.
const VT = { white: "#f1f3f4", navy: "#1b2238", roof: "#a4a9ae", skirt: "#8a9097", strip: "#4a4f55", black: "#15171b", red: "#c8202a" };
const D = { roof: 13.8, sill: 3.4, len: 68.4 };
const DNOSE = [[1.2, 2.6], [0.9, 4.4], ["q", 0.8, 6.4, 1.6, 7.6], [4.6, 12.4], ["q", 5.6, 13.8, 7.6, 13.8]];
function desiroPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, VT.white], [13.1, 3, VT.roof]]) +
    // The navy window band: its front edge low behind the cab, curving up
    // and back to the roof's edge, then straight to the car's other end.
    path(`M7.0 7.3Q8.2 11.4 12.6 12.3L${L + 1} 12.3L${L + 1} 7.3Z`, VT.navy) +
    // The gray cap: the roof coming down over the cab to the top of the
    // windshield, its edge curving back up to the roof line.
    path("M-1 20L-1 11.6L4.2 11.6Q8.4 11.9 12.4 13.1L12.4 20Z", VT.roof) +
    // The black of the windshield's wrap and the destination panel below it.
    path("M-1 6.3L-1 11.6L4.2 11.6Q5.6 11.4 6.2 10.4L3.6 6.3Z", VT.black) +
    // The dark gray strip under the panel, at the front's corner.
    path("M-1 5.3L-1 6.3L3.6 6.3L3.2 5.3Z", VT.strip) +
    // The gray skirt, and the bumper round the bottom of the nose.
    bands(L, [[0, 4.3, VT.skirt]]);
}
function desiroCar(c) {
  const L = c.L;
  return unit(c, { roof: D.roof, sill: D.sill, drop: { a: 18, b: L - 2, y: 2.6 }, nose: DNOSE, rake: [[1.6, 7.6], [4.6, 12.4]], depth: 3.6, cabLen: 9, lampY: 4.6,
    rows: [{ xs: [11.2], y: 7.6, w: 2.0, h: 4.0, r: 0.3 }, { xs: seq(14.0, 5.0, 3), y: 7.6, w: 4.2, h: 4.4, r: 0.35 },
      { xs: [29.0], y: 7.6, w: 2.6, h: 4.4, r: 0.3 }, { xs: seq(42.0, 5.0, 4), y: 7.6, w: 4.2, h: 4.4, r: 0.35 }, { xs: [62.2], y: 7.6, w: 2.4, h: 4.4, r: 0.3 }],
    doors: [{ x: 35.6, w: 4.3, y0: 2.6, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.5, grabs: false, fill: VT.red }],
    trucks: [10.8, "end"], paint: desiroPaint, surround: VT.black,
    // The cab's side window, in the band's rising front corner.
    cab: () => path("M8.4 7.7L10.4 7.7L10.4 11.0Q9.0 10.0 8.4 7.7Z", "#1d2026", 0.4),
    extra: () => exhaust(24, D.roof) + hvac(14, D.roof, 8, 0.6) + hvac(45, D.roof, 10, 0.6) +
      tank(20, 30, D.sill, 1.6) + underframe(42, 60, 2.6, { depth: 0.4, boxes: 2, tanks: false }) });
}

// ---------- Tables ----------

export const TYPES = {
  dkGcLint: { name: "Coradia Lint 41 section", kind: "emu" },
  dkVtDesiro: { name: "Desiro Classic car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet over the coupler (or the joint's center): half of 41.8 m (Lint),
// half of 41.7 m (Desiro).
export const MODELS = {
  dkGcLint: M(lintCar, 68.7, true),
  dkVtDesiro: M(desiroCar, D.len, true),
};

const set = (label, ...units) => ({ label, units });
const LINT41 = set("Typical: a Coradia Lint 41 two-section diesel unit", ["dkGcLint", 2]);
const DESIRO = set("Typical: a Siemens Desiro two-car diesel unit", ["dkVtDesiro", 2]);

// The timetable (Rejseplanen's) names no unit, and doesn't say where two
// run coupled. The Desiros work Odense-Svendborg (its Odense-Ringe short
// workings too) and Struer-Herning-Vejle; the Lints everything else. Those
// two lines' trains are the only ones that begin or end at Odense, Ringe,
// Svendborg or Vejle (Struer-Vejle, and the Herning-Vejle short workings),
// so a train with one of those at either end is drawn as a Desiro and every
// other train, or one whose endpoints aren't known, as a Lint 41.
const DESIRO_ENDS = /Odense|Ringe|Svendborg|Vejle|Thisted/;
export const TYPICAL = {
  vorestog: (t = {}) => {
    const ends = `${t.origin || ""} ${t.destination || t.dest || ""}`;
    return DESIRO_ENDS.test(ends) ? DESIRO : LINT41;
  },
};

const LINT_SRC = "https://en.wikipedia.org/wiki/Alstom_Coradia_LINT";
export const FACTS = {
  dkGcLint: { model: "Alstom Coradia Lint 41", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", lengthFt: 137.4, source: LINT_SRC,
    about: "Two articulated sections on a shared truck, a diesel power pack under each. The fleet passed from Arriva to GoCollective and, on September 1, 2026, to DSB Vores Tog with the regional lines of western and central Jutland, still in Arriva's teal and cream paint; the unit photographed at Struer is no. 1002." },
  dkVtDesiro: { model: "Siemens Desiro Classic", type: "Diesel multiple unit", builder: "Siemens", fleet: 16, lengthFt: 136.8,
    source: "https://commons.wikimedia.org/wiki/File:GoCollective_AR_3069_at_Struer_Station.jpg",
    about: "A two-car diesel unit, its two cars sharing a truck at the joint, low-floor between the trucks with one double door a side in each car. Sixteen came over from DSB in December 2020 for Odense-Svendborg and Struer-Vejle, and kept DSB's white sides, navy window band and red doors; the unit photographed at Struer in 2024 is AR 3069." },
};
