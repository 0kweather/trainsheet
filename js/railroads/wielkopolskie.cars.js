// Koleje Wielkopolskie's cars (scripts/railroads/poland.py, agency
// "wielkopolskie"): Greater Poland's regional railroad. Trainsheet's own
// side views at the shared scale (js/carart.js), each drawn from, and
// checked against, one photograph on Wikimedia Commons, named here fleet
// by fleet. Bodies and parts from czechia.cars.js (unit, letters and the
// rest); the Elf body is the one mazowieckie.cars.js draws, the EN57 body
// the one polregio.cars.js draws.
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
//   EN76 Elf (Pesa, four sections): an EN76 at Ciechanów
//     ("2025-01-26 EN76 Koleje Mazowieckie, Ciechanów (1).jpg"), in
//     Koleje Mazowieckie's green and white with yellow doors. KW's
//     EN76s are white with green and blue, not green and white, so the
//     shape and the yellow doors are from the photograph and the livery
//     is Trainsheet's reading of KW's colours: a green swoosh sweeping
//     up beside the cab and running back below the windows, a blue line
//     under it, yellow doors, a dark lower front. The livery is a
//     judgement, said so here and in FACTS.
//   EN57 (Pafawag, three cars): no photograph of a KW EN57 in this set.
//     Its body is the modernised EN57 polregio.cars.js draws from
//     EN57-2070 at Kraków Główny, and its paint is KW's white, green
//     and blue: a green band low on the side with a blue line over it,
//     a green cab, green doors. The livery is a judgement, said so here
//     and in FACTS.
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

// ---------- EN76: the Elf in KW colours ----------
// Four sections sharing a truck at each joint, a truck of its own under
// each cab; a rounded nose under a big curved windshield, the windows
// single, the green swoosh sweeping up beside the cab and running back
// below the windows, a blue line under it, yellow doors, a dark lower
// front. The shape and the yellow doors are from the KM photograph; the
// green-and-blue livery is a judgement.
const KW = { white: "#f2f3f4", green: "#009444", blue: "#009fe3", yellow: "#f7c600", roof: "#b9bec4", skirt: "#3a3d42", dark: "#20242a" };
const KWG = { roof: 13.4, sill: 3.2 };
const NOSE_KW = [[1.5, 3.2], [0.9, 5.6], ["q", 0.9, 7.2, 2.4, 8.4], [6.8, 12.6], ["q", 7.6, 13.4, 9.6, 13.4]];
function kwElfPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, KW.white], [12.7, 3, KW.roof], [0, 3.9, KW.skirt]]) +
      // The green swoosh: rising beside the cab, then a band below the
      // windows to the end of the section (on a middle section, the band
      // the whole way), with a blue line under it.
      (cab
        ? path("M5.0 3.9L14.0 3.9Q21.0 4.1 23.0 7.0L23.0 7.6L5.0 7.6Z", KW.green) + rect(23.0, 6.4, L - 22.0, 1.2, KW.green) +
          rect(23.0, 6.1, L - 22.0, 0.3, KW.blue)
        : rect(-1, 6.4, L + 2, 1.2, KW.green) + rect(-1, 6.1, L + 2, 0.3, KW.blue)) +
      // The dark lower front under the cab.
      (cab ? rect(-1, 3.2, 6.0, 2.2, KW.dark) : "");
  };
}
const kwElDoor = (x) => ({ x, w: 4.4, y0: KWG.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: KW.yellow });
const kwElWin = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const kwElfCab = (c) => unit(c, { roof: KWG.roof, sill: KWG.sill, nose: NOSE_KW, rake: [[2.4, 8.4], [6.8, 12.6]], depth: 3.0, cabLen: 15, lampY: 4.6,
  rows: [kwElWin(seq(28.0, 5.6, 4))], doors: [kwElDoor(21.0), kwElDoor(c.L - 8.0)], diaphragm: [3.2, 12.2],
  trucks: [12.0, "end"], wheel: 35, paint: kwElfPaint(true), surround: "#111214",
  // The cab's side window in a black panel, raked at the front like the
  // windshield.
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, KWG.roof, 12, 0.7) + hvac(40, KWG.roof, 10, 0.7) + boxes(20, g.L - 16, KWG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.9, "Koleje Wielkopolskie", KW.green, { weight: 700 }) });
const kwElfMid = (c) => unit(c, { roof: KWG.roof, sill: KWG.sill,
  rows: [kwElWin(seq(12.0, 5.6, 7))], doors: [kwElDoor(5.0), kwElDoor(c.L - 9.4)], diaphragm: [3.2, 12.2],
  trucks: ["end"], paint: kwElfPaint(false),
  // A pantograph on the first middle section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, KWG.roof, 12, 0.7) + hvac(g.L - 22, KWG.roof, 12, 0.7) + boxes(14, g.L - 14, KWG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.9, "Koleje Wielkopolskie", KW.green, { weight: 700 }) });

// ---------- EN57 in KW colours ----------
// The modernised EN57 body as polregio.cars.js draws it: a rounded cab,
// one big windshield; white, a green band low on the side with a blue
// line over it, a green cab, green doors. The livery is a judgement.
const K57W = { green: "#009444", blue: "#009fe3", white: "#f2f3f4", dark: "#3a3d42", roof: "#9aa0a6", black: "#1a1d20" };
const G57W = { roof: 13.2, sill: 3.6 };
const NOSE_57W = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function kwEn57Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, K57W.white], [12.55, 3, K57W.roof], [0, 5.0, K57W.green], [5.0, 0.35, K57W.blue], [0, 3.2, K57W.dark]]) +
      // The green cab: from the roof down past the windshield.
      (cab ? rect(-1, 7.3, 14.0, 6.1, K57W.green) : "");
  };
}
const kw57Door = (x) => ({ x, w: 3.0, y0: G57W.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: K57W.green });
const kw57Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const kwEn57Cab = (c) => unit(c, { roof: G57W.roof, sill: G57W.sill, nose: NOSE_57W, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [kw57Win(seq(17.5, 5.6, 5)), kw57Win([51.5, 57.1, 62.7])], doors: [kw57Door(12.4), kw57Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: kwEn57Paint(true), surround: K57W.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) => hvac(20, G57W.roof, 12, 0.6) + hvac(46, G57W.roof, 12, 0.6) + boxes(20, g.L - 16, G57W.sill, 3, 1.2) +
    letters(cc, 30.0, 11.7, 0.85, "Koleje Wielkopolskie", K57W.green, { weight: 700 }) });
const kwEn57Mid = (c) => unit(c, { roof: G57W.roof, sill: G57W.sill,
  rows: [kw57Win(seq(10.5, 5.6, 8))], doors: [kw57Door(4.6), kw57Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: kwEn57Paint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57W.roof, 12, 0.6) + hvac(g.L - 26, G57W.roof, 12, 0.6) + boxes(16, g.L - 16, G57W.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  kwEn76Cab: { name: "EN76 Elf end section (Koleje Wielkopolskie)", kind: "emu" },
  kwEn76Mid: { name: "EN76 Elf middle section (Koleje Wielkopolskie)", kind: "emu" },
  kwEn57Cab: { name: "EN57 end car (Koleje Wielkopolskie)", kind: "emu" },
  kwEn57Mid: { name: "EN57 middle car (Koleje Wielkopolskie)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the EN76 about 64.3 m as four sections; the EN57 64.77 m as three cars.
export const MODELS = {
  kwEn76Cab: M(kwElfCab, 55.1, true),
  kwEn76Mid: M(kwElfMid, 50.4, false, byIndex),
  kwEn57Cab: M(kwEn57Cab, 71.0, true),
  kwEn57Mid: M(kwEn57Mid, 70.5, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const ELF_SET = set("Typical: an EN76 Elf four-section electric unit (a judgement: the timetable names no unit; the Elfs are KW's commonest train)",
  ["kwEn76Cab", 1], ["kwEn76Mid", 2], ["kwEn76Cab", 1]);
const EN57_SET = set("Typical: an EN57 three-car electric unit (a judgement: the timetable names no unit; the older unit for the branch lines)",
  ["kwEn57Cab", 1], ["kwEn57Mid", 1], ["kwEn57Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, so a train is
// placed by its line ("Poznań – Rogoźno Wlkp.", "Nowy Tomyśl – Września")
// and, when no line is known, by its two ends. Every rule below is a
// judgement.
//   The branch lines to Rogoźno and Środa Wielkopolska: the EN57.
//   Everything else, and any train not placed: the EN76 Elf.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
export const TYPICAL = {
  wielkopolskie: (t = {}) => {
    const route = fold(t.route || t.line || `${t.origin || ""} – ${t.destination || t.dest || ""}`);
    if (/rogozno|sroda wlkp/.test(route)) return EN57_SET;
    return ELF_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fEn76 = { model: "EN76 Elf (Pesa 22WE)", type: "Electric multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}2025-01-26_EN76_Koleje_Mazowieckie%2C_Ciechan%C3%B3w_%281%29.jpg` };
const fEn57 = { model: "EN57", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}Polregio_EN57-2070%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2804%29.jpg` };
export const FACTS = {
  kwEn76Cab: { ...fEn76,
    about: "An end section of Pesa's Elf in Koleje Wielkopolskie's white, green and blue. The photograph is a Koleje Mazowieckie EN76 at Ciechanów, green and white with yellow doors: the shape and the yellow doors are from it, and the green-and-blue livery is Trainsheet's reading of KW's colours — a judgement." },
  kwEn76Mid: { ...fEn76,
    about: "A middle section of a KW EN76 Elf; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading; the livery is a judgement." },
  kwEn57Cab: { ...fEn57,
    about: "An end car of the EN57, Poland's classic three-car electric unit, in KW's white, green and blue. No photograph of a KW EN57 is in this set: the body is the modernised EN57 photographed at Kraków Główny, and the livery is a judgement." },
  kwEn57Mid: { ...fEn57,
    about: "The middle car of a KW EN57; it carries the pantograph. The livery is a judgement." },
};
