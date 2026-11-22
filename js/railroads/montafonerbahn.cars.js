// The Montafonerbahn's cars (scripts/railroads/austria.py): the private
// railroad from Bludenz up the Montafon to Schruns, in Vorarlberg.
// Trainsheet's own side view at the shared scale (js/carart.js), drawn
// from one photograph on Wikimedia Commons.
//
// THIS IS THE HISTORIC STOCK, NOT TODAY'S TRAIN. The one photograph to
// hand ("Montafonerbahn ET 10.103.jpg") shows ET 10.103, an old red and
// yellow electric railcar, in the snow. The trains that run Bludenz–
// Schruns today are newer low-floor electric units (Stadler FLIRTs, by the
// build's notes); a search found no usable photograph of one on Wikimedia
// Commons, so none is drawn, and every Montafonerbahn train is drawn as
// ET 10.103 with a label that says so. Replace this drawing when a
// photograph of the current stock is found.
//
// What is from the photograph (a three-quarter view from the front): the
// paint, the cab's three windshield panes, the cream wings and the crest
// on the nose, the twin lamps, the lamp on the roof's edge, the equipment
// box and pantograph over the leading end, and the side's order: the cab's
// window, a window, a door, eight windows, a door, a window. What is a
// reading: that the far end has a cab like the near one (the car is drawn
// as two mirrored halves), the trucks, what hangs under the floor, and the
// length, which Trainsheet does not know: it is drawn about 20 m long,
// from the windows counted, and no figure is given in its fact sheet. The
// file was verified after writing: node --check passes, the consist
// renders, and the drawing was looked at beside the photograph
// (22 Nov 2026).

import { C, rect, circle, path, line, lines, pantograph, underframe } from "../carart.js?v=dev";
import { unit, twinEnded, letters } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");

// ---------- ET 10.103 ----------
// One car on two trucks, a cab at each end: a rounded upright front, the
// windshields in the yellow band; red below the windows, yellow through
// them, a red line over them, a dark roof; a yellow line along the bottom;
// a cream line from under the cab's window sweeping down the nose (the
// wings that meet at the crest on the front); silver two-leaf doors; each
// window with a bar across.
const MB = { red: "#c5372c", yellow: "#e2b62f", cream: "#e8e2cf", roof: "#5b5e59", door: "#b8bcbf", frame: "#2a2d31" };
const MG = { roof: 12.3, sill: 3.7 };
const NOSE_ET = [[0.9, 3.7], [0.7, 4.6], [0.6, 7.0], ["q", 0.6, 7.7, 0.9, 8.3], [1.6, 11.2], ["q", 1.8, 12.3, 3.4, 12.3]];
const etPaint = (c, g) => bands(g.L, [[0, 20, MB.red], [7.2, 3.95, MB.yellow], [11.65, 3, MB.roof], [3.7, 0.55, MB.yellow]]) +
  path("M10.0 6.95L5.2 6.95Q1.6 6.8 0.4 4.5", "none", 0, `stroke="${MB.cream}" stroke-width="0.34" stroke-linecap="round"`) +
  path("M5.4 6.3Q2.6 6.2 1.6 4.6", "none", 0, `stroke="${MB.cream}" stroke-width="0.16" stroke-linecap="round"`);
const WIN = { y: 7.65, h: 3.1 };
const etHalf = (h) => unit(h, { ...MG, nose: NOSE_ET, rake: [[0.9, 8.3], [1.55, 11.0]], depth: 1.5, cabLen: 1.5, lampY: 5.6, coupler: "buffers",
  rows: [{ xs: [2.7], ...WIN, w: 2.2, r: 0.3 }, { xs: [6.1], ...WIN, w: 3.2, r: 0.3 }, { xs: seq(14.4, 4.85, 4), ...WIN, w: 3.7, r: 0.3 }],
  doors: [{ x: 10.5, w: 2.8, y0: MG.sill, y1: 11.2, leaves: 2, glassY: 0.5, glassH: 0.42, grabs: true, fill: MB.door }],
  trucks: [10.6], wheel: 36, diaphragm: [4.2, 10.8], surround: MB.frame, paint: etPaint,
  extra: () => lines([6.1, ...seq(14.4, 4.85, 4)].map((x, i) => [x + 0.1, 9.35, x + (i ? 3.6 : 3.1), 9.35]), "#8d8f8a", 1.1) +
    // The second of the twin lamps; the lamp on the roof's edge.
    circle(0.85, 5.0, 0.28, "#fff4cf", 0.35) + circle(1.9, 12.45, 0.42, "#fff4cf", 0.4) + rect(1.55, 11.75, 0.7, 0.35, "#d8262c", 0.3, 'rx="0.12"') });
function et10(c) {
  const L = c.L;
  return twinEnded(c, etHalf) +
    // Over the leading end: the equipment box with its louvers, and the
    // pantograph behind it.
    rect(3.2, MG.roof - 0.05, 9.2, 1.15, MB.roof, 0.4, 'rx="0.3"') + lines(seq(12.55, 0.2, 4).map((y) => [8.6, y, 11.8, y]), "rgba(0,0,0,0.4)", 0.5) +
    pantograph(17.5, MG.roof + 0.2, { up: true, facing: -1 }) +
    seq(26, 7, 4).map((x) => path(`M${x - 0.8} ${MG.roof - 0.05}Q${x} ${MG.roof + 0.5} ${x + 0.8} ${MG.roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
    underframe(18, L - 18, MG.sill, { depth: 1.4, boxes: 3, tanks: true }) +
    // M B S in yellow, the number small under it.
    letters(c, L * 0.6, 5.95, 1.15, "M B S", MB.yellow, { weight: 800, spacing: "0.12em" }) + letters(c, L * 0.6, 5.0, 0.42, "10.103", MB.yellow, { weight: 600 });
}

// ---------- Tables ----------

export const TYPES = {
  mbsEt10: { name: "ET 10.103 electric railcar (historic)", kind: "emu" },
};
// Drawn 20 m (65.6 ft) over the buffers: a reading of the photograph, not
// a published figure.
export const MODELS = {
  mbsEt10: { draw: et10, len: 65.6, oneEnd: false, variant: null },
};

// The timetable names no unit, and there is one drawing: every train, the
// S-Bahn trains that run through Bludenz to and from Bregenz and Lindau
// among them, is drawn as ET 10.103 and labeled as historic stock.
const HISTORIC = { label: "Drawn as ET 10.103, the Montafonerbahn's old red and yellow railcar: historic stock, not the newer electric units that run today, for which no photograph was to hand",
  units: [["mbsEt10", 1]] };
export const TYPICAL = {
  montafonerbahn: () => HISTORIC,
};

// Source: the photograph the drawing was made from (Wikimedia Commons).
export const FACTS = {
  mbsEt10: { model: "Montafonerbahn ET 10.103", type: "Electric railcar (historic)", source: "https://commons.wikimedia.org/wiki/File:Montafonerbahn_ET_10.103.jpg",
    about: "An old electric railcar of the Montafonerbahn, the short private railroad from Bludenz to Schruns: red below, yellow through the windows, cream wings and a crest on its nose, M B S on its side. This is historic stock, drawn because its photograph was the only one to hand; the line's trains today are newer low-floor electric units." },
};
