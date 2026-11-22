// Arriva RP's cars (scripts/railroads/poland.py, agency "arriva"): the
// regional railroad of Kujawsko-Pomorskie (Toruń, Bydgoszcz, Grudziądz,
// Chojnice). Trainsheet's own side views at the shared scale
// (js/carart.js), each drawn from, and checked against, one photograph on
// Wikimedia Commons, named here fleet by fleet. Bodies and parts from
// czechia.cars.js (unit, letters and the rest).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Both
// photographs are three-quarter views from the front, so the windows'
// spacing, the doors' places, the roof equipment, what hangs under the
// floor and every length are Trainsheet's reading of the type, not
// measurements. The lengths the drawings are scaled to are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file (see MODELS); the fact sheets give none.
// The file was verified after writing: node --check passes, every consist
// renders, and each drawing was looked at beside its photograph
// (22 Nov 2026).
//
//   SA134 (Pesa 218M, two cars): SA134-001b ("Arriva SA134 001b.jpg").
//     White, a teal band low on the side with a thin yellow line over
//     it, a dark grey skirt; a rounded cab, one big windshield, "ARRIVA"
//     on the nose. Two cars can be counted by their gangway joint.
//   SA135 (Pesa 218M, two cars): no photograph of an Arriva SA135 in
//     this set. Its shape is SA135-002 of Koleje Dolnośląskie
//     ("Koleje Dolnoslaskie, Zgorzelec (LRM 20220308 125256).jpg") —
//     white and yellow there — and its paint is the SA134's Arriva
//     teal and white; the longer cars are the figure usually published
//     for the class, set down from memory. The drawing is the SA134's
//     body, longer.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each rule is
// set out.

import { C, rect, circle, path, line, poly, win, truck, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac, exhaust, tank } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- The Pesa 218M in Arriva teal: SA134, SA135 ----------
// Two cars, each on two trucks of its own, a cab at each end of the
// train: a rounded nose under one big windshield, the destination
// display under it; a cab side window raked at the front; plug doors,
// the windows single on the white.
const AR = { white: "#f2f3f4", teal: "#009aa6", yellow: "#f5c400", roof: "#b9bec4", skirt: "#3a3d42", black: "#1a1d20" };
const ARG = { roof: 13.2, sill: 3.6 };
const NOSE_AR = [[1.1, 3.6], [0.8, 5.6], ["q", 0.8, 7.0, 1.9, 8.2], [4.4, 12.4], ["q", 5.2, 13.2, 7.2, 13.2]];
function arrivaPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, AR.white], [12.55, 3, AR.roof], [0, 5.6, AR.teal], [5.6, 0.3, AR.yellow], [0, 3.6, AR.skirt]]) +
      // The teal rising behind the cab to just under the windows.
      (cab ? path("M9.0 5.6L21.0 5.6L21.0 8.0Q17.0 5.9 9.0 5.9Z", AR.teal) +
        line(9.0, 5.9, 21.0, 8.0, AR.yellow, 0.3) : "");
  };
}
const arDoor = (x) => ({ x, w: 3.2, y0: ARG.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: AR.teal });
const arWin = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
// L is the car's length: the SA134's cars are the shorter ones, the
// SA135's longer, so the windows and doors are placed from L.
const arCab = (c) => unit(c, { roof: ARG.roof, sill: ARG.sill, nose: NOSE_AR, rake: [[1.9, 8.2], [4.4, 12.4]], depth: 3.0, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [arWin(seq(17.5, 5.6, 4)), arWin([c.L - 18.5, c.L - 12.9, c.L - 7.3])], doors: [arDoor(12.4), arDoor(c.L - 24.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: arrivaPaint(true), surround: AR.black,
  // The cab's side window, raked at the front like the windshield.
  cab: () => path("M7.6 7.4L13.6 7.4L13.6 11.0L10.8 11.0Q8.6 9.8 7.6 7.4Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(20, ARG.roof, 12, 0.6) + hvac(g.L - 26, ARG.roof, 12, 0.6) + exhaust(g.L / 2 + 8, ARG.roof) +
    boxes(20, g.L - 16, ARG.sill, 2, 1.0) + tank(g.L / 2 - 2, g.L / 2 + 6, ARG.sill, 1.3) +
    letters(cc, g.L / 2 + 2, 12.2, 0.9, "ARRIVA", AR.teal, { weight: 800 }) });

// ---------- Tables ----------

export const TYPES = {
  arSa134Cab: { name: "SA134 car (Arriva RP)", kind: "emu" },
  arSa135Cab: { name: "SA135 car (Arriva RP)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the SA134 about 41.9 m as
// two cars; the SA135 about 52 m as two cars.
export const MODELS = {
  arSa134Cab: M(arCab, 69.0, true),
  arSa135Cab: M(arCab, 86.0, true),
};

const set = (label, ...units) => ({ label, units });
const SA134_SET = set("Typical: an SA134 two-car diesel unit (a judgement: the timetable names no unit)",
  ["arSa134Cab", 2]);
const SA135_SET = set("Typical: an SA135 two-car diesel unit, the longer Pesa 218M (a judgement: the timetable names no unit)",
  ["arSa135Cab", 2]);

// The timetable (the Polish Trains GTFS) names no unit, and Arriva's
// one line is just "AR", so a train is placed by its two ends. Every
// rule below is a judgement.
//   The Toruń–Grudziądz–Bydgoszcz corridor (either end Toruń Główny,
//     Grudziądz, Bydgoszcz Główna or Laskowice Pomorskie): the SA135,
//     the longer unit for the busier corridor.
//   Everything else, and any train not placed: the SA134.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const MAIN = /^(torun glowny|grudziadz|bydgoszcz glowna|laskowice pomorskie)/;
export const TYPICAL = {
  arriva: (t = {}) => {
    const a = fold(t.origin), b = fold(t.destination || t.dest);
    const either = (re) => re.test(a) || re.test(b);
    if (either(MAIN)) return SA135_SET;
    return SA134_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fSa134 = { model: "SA134 (Pesa 218M)", type: "Diesel multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}Arriva_SA134_001b.jpg` };
const fSa135 = { model: "SA135 (Pesa 218M)", type: "Diesel multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}Koleje_Dolnoslaskie%2C_Zgorzelec_%28LRM_20220308_125256%29.jpg` };
export const FACTS = {
  arSa134Cab: { ...fSa134,
    about: "One car of the SA134, Pesa's two-car diesel unit for the regional lines of Kujawsko-Pomorskie: white with a teal band low on the side and a thin yellow line over it, a rounded cab with one big windshield. The unit photographed is SA134-001b; two cars can be counted." },
  arSa135Cab: { ...fSa135,
    about: "One car of the SA135, the longer two-car Pesa 218M. No photograph of an Arriva SA135 is in this set: its shape is SA135-002 of Koleje Dolnośląskie photographed at Zgorzelec (white and yellow there), and its paint is the SA134's Arriva teal and white." },
};
