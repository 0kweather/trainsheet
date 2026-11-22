// PKP SKM Trójmiasto's cars (scripts/railroads/poland.py, agency
// "skmt"): the Tri-City's suburban railroad (Gdańsk–Gdynia–Wejherowo).
// Trainsheet's own side views at the shared scale (js/carart.js), each
// drawn from, and checked against, one photograph on Wikimedia Commons,
// named here fleet by fleet. Bodies and parts from czechia.cars.js (unit,
// letters and the rest); the Impuls body is the one polregio.cars.js
// draws.
//
// What is from the photograph: the Impuls's shape, its cab, and what can
// be counted on the side that faces the camera. The photograph is a
// three-quarter view from the front, so the windows' spacing, the doors'
// places, the roof equipment, what hangs under the floor and every length
// are Trainsheet's reading of the type, not measurements. The lengths the
// drawings are scaled to are the figures usually published for each class,
// set down from memory and not checked against a source for this file (see
// MODELS); the fact sheets give none. The file was verified after writing:
// node --check passes, every consist renders, and each drawing was looked
// at beside its photograph (22 Nov 2026).
//
//   31WE Impuls (Newag, four sections): 31WE-022A at Jelenia Góra
//     ("NEWAG Impuls 31WE 022 Jelenia Gora 10 25.jpg"), in Koleje
//     Dolnośląskie's white and yellow. SKM Trójmiasto runs 31WEs, but
//     no photograph of one in SKMT livery is in this set, so the shape
//     is drawn from that photograph and the livery — white, a dark blue
//     wave low on the side rising behind the cab, a thin yellow line
//     over it, blue doors — is a judgement, said so here and in FACTS.
//     Four sections can be counted by their gangway joints.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each rule is
// set out.

import { C, rect, circle, path, line, poly, win, truck, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- The Impuls in SKMT blue: 31WE (four sections) ----------
// Articulated sections sharing a truck at each joint, a truck of its own
// under each cab; a rounded nose under a deep windshield, the windows
// single, the blue wave rising behind the cab, blue doors.
const SK = { white: "#f2f3f4", blue: "#003da5", yellow: "#f5c400", roof: "#b9bec4", skirt: "#3a3d42" };
const SKG = { roof: 13.7, sill: 3.2 };
const NOSE_SK = [[1.4, 3.2], [0.9, 5.4], ["q", 0.9, 6.8, 2.2, 8.0], [6.2, 12.8], ["q", 7.0, 13.7, 9.0, 13.7]];
function skmtImpulsPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, SK.white], [12.9, 3, SK.roof], [0, 3.9, SK.skirt]]) +
      // The blue band low on the side, with a yellow line over its top
      // edge; behind the cab it rises to just under the windows.
      rect(-1, 3.9, L + 2, 1.6, SK.blue) + rect(-1, 5.5, L + 2, 0.28, SK.yellow) +
      (cab ? path("M10.0 3.9L23.0 3.9L23.0 8.0Q19.0 5.2 10.0 5.5Z", SK.blue) +
        line(10.0, 5.5, 23.0, 8.0, SK.yellow, 0.3) : "");
  };
}
const skImDoor = (x) => ({ x, w: 4.4, y0: SKG.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: SK.blue });
const skImWin = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const skmtImpulsCab = (c) => unit(c, { roof: SKG.roof, sill: SKG.sill, nose: NOSE_SK, rake: [[2.2, 8.0], [6.2, 12.8]], depth: 3.2, cabLen: 16, lampY: 4.4,
  rows: [skImWin(seq(28.0, 5.6, 4))], doors: [skImDoor(21.0), skImDoor(c.L - 8.0)],
  trucks: [12.0, "end"], wheel: 35, paint: skmtImpulsPaint(true), surround: "#111214",
  // The cab's side window in a black panel, raked at the front like the
  // windshield.
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, SKG.roof, 12, 0.7) + hvac(40, SKG.roof, 10, 0.7) + boxes(20, g.L - 16, SKG.sill, 2, 0.8) +
    letters(cc, 30.0, 12.2, 0.9, "SKM", SK.blue, { weight: 800 }) });
const skmtImpulsMid = (c) => unit(c, { roof: SKG.roof, sill: SKG.sill,
  rows: [skImWin(seq(12.0, 5.6, 7))], doors: [skImDoor(5.0), skImDoor(c.L - 9.4)],
  trucks: ["end"], paint: skmtImpulsPaint(false),
  // A pantograph on the second section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, SKG.roof, 12, 0.7) + hvac(g.L - 22, SKG.roof, 12, 0.7) + boxes(14, g.L - 14, SKG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.8, "SKM", SK.blue, { weight: 800 }) });

// ---------- Tables ----------

export const TYPES = {
  skmt31weCab: { name: "31WE Impuls end section (PKP SKM Trójmiasto)", kind: "emu" },
  skmt31weMid: { name: "31WE Impuls middle section (PKP SKM Trójmiasto)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the 31WE about 74 m as four sections.
export const MODELS = {
  skmt31weCab: M(skmtImpulsCab, 61.0, true),
  skmt31weMid: M(skmtImpulsMid, 61.0, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const IMPULS31_SET = set("Typical: a 31WE Impuls four-section electric unit (a judgement: the timetable names no unit; the 31WEs are SKMT's modern units)",
  ["skmt31weCab", 1], ["skmt31weMid", 2], ["skmt31weCab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, and SKMT's one
// line is the Tri-City corridor, so every train is drawn as the 31WE.
export const TYPICAL = {
  skmt: (t = {}) => IMPULS31_SET,
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const f31we = { model: "31WE Impuls", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}NEWAG_Impuls_31WE_022_Jelenia_Gora_10_25.jpg` };
export const FACTS = {
  skmt31weCab: { ...f31we,
    about: "An end section of Newag's Impuls in PKP SKM Trójmiasto's colours. No photograph of an SKMT 31WE is in this set: the shape is 31WE-022A of Koleje Dolnośląskie photographed at Jelenia Góra (white and yellow there), and the livery — a dark blue wave low on the side with a yellow line over it — is a judgement. Four sections can be counted." },
  skmt31weMid: { ...f31we,
    about: "A middle section of a 31WE Impuls; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading, and the SKMT livery is a judgement." },
};
