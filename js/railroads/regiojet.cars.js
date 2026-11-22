// RegioJet's cars (scripts/railroads/poland.py, agency "regiojet"):
// the Czech open-access operator's trains between Praha and Przemyśl
// and Warszawa (via Bohumín). Trainsheet's own side views at the shared
// scale (js/carart.js), each drawn from, and checked against, one
// photograph on Wikimedia Commons, named here fleet by fleet. The
// Vectron is czechia.cars.js's, in RegioJet's yellow; the coach is drawn
// here.
//
// What is from the photograph: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. The
// photograph is a side view from across the platform, so the windows'
// spacing, the doors' places, the roof equipment, what hangs under the
// floor and every length are Trainsheet's reading of the type, not
// measurements. The lengths the drawings are scaled to are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file (see MODELS); the fact sheets give none.
// The file was verified after writing: node --check passes, every consist
// renders, and each drawing was looked at beside its photograph
// (22 Nov 2026).
//
//   Vectron (Siemens, 193): the yellow locomotive at Bohumín
//     ("Nádraží, RegioJet train to Brno.jpg"), "REGIOJET" in red and
//     blue along its side, a silver band along the top of the side
//     sweeping down behind each cab. (RegioJet also runs TRAXX
//     locomotives on some of these trains; the Vectron is drawn, as
//     photographed.)
//   The coach: the yellow coach behind it at Bohumín, a dark blue band
//     through the windows over yellow, "REGIOJET" in red mid-side, a
//     first-class "1" by the door.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each rule is
// set out.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, poly, win, truck, underframe } from "../carart.js?v=dev";
import { vectron, letters, hvac, buffers } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");

// ---------- The coach ----------
// A 26.4 m coach on two trucks 19 m apart, a door at each end, ten windows
// between. Yellow below a dark blue band through the windows, a silver
// roof, a black skirt; "REGIOJET" in red mid-side, a "1" by each door.
const CO = { yellow: "#f7d117", navy: "#1d3f9e", red: "#d6222c", roof: "#b9bec4", skirt: "#2a2d31", black: "#1a1d20" };
function rjCoach(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [2.0, L - 4.6];
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: CO.yellow, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 })),
    livery: () => bands(L, [[6.9, 4.4, CO.navy], [12.4, 3, CO.roof], [0, 4.2, CO.skirt]]) +
      rect(-1, 11.3, L + 2, 0.25, CO.yellow),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.7) + [14, L - 14].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) +
      letters(cc, L / 2, 5.5, 1.15, "REGIOJET", CO.red, { weight: 800 }) +
      letters(cc, 6.6, 9.4, 1.5, "1", "#ffffff", { weight: 600 }) + letters(cc, L - 6.6, 9.4, 1.5, "1", "#ffffff", { weight: 600 }) });
}

// ---------- Tables ----------

export const TYPES = {
  rjVectron: { name: "Siemens Vectron electric locomotive (RegioJet)", kind: "electric", pan: true },
  rjCoach: { name: "Coach (RegioJet)", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the Vectron 18.98 m; the
// coach 26.4 m.
export const MODELS = {
  rjVectron: M(vectron, 62.27),
  rjCoach: M(rjCoach, 86.6, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const HAULED_SET = set("Typical: a yellow RegioJet Vectron locomotive and coaches (a judgement: the timetable names no unit)",
  ["rjVectron", 1], ["rjCoach", 4]);

// The timetable (the Polish Trains GTFS) names no unit, so every
// RegioJet train is drawn as the Vectron and coaches.
export const TYPICAL = {
  regiojet: (t = {}) => HAULED_SET,
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
export const FACTS = {
  rjVectron: { model: "Siemens Vectron (RegioJet 193)", type: "Electric locomotive", builder: "Siemens Mobility",
    source: `${CM}N%C3%A1dra%C5%BE%C3%AD%2C_RegioJet_train_to_Brno.jpg`,
    about: "RegioJet's yellow Vectron, as photographed at Bohumín with its coaches: \"REGIOJET\" in red and blue along the side, a silver band along the top of the side sweeping down behind each cab. RegioJet also runs TRAXX locomotives on some of these trains." },
  rjCoach: { model: "RegioJet coach", type: "Locomotive-hauled passenger coach",
    source: `${CM}N%C3%A1dra%C5%BE%C3%AD%2C_RegioJet_train_to_Brno.jpg`,
    about: "One of RegioJet's coaches, as photographed at Bohumín: yellow below a dark blue band through the windows, \"REGIOJET\" in red mid-side, a first-class \"1\" by the door." },
};
