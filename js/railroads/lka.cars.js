// Łódzka Kolej Aglomeracyjna's cars (scripts/railroads/poland.py,
// agency "lka"): the Łódź agglomeration railroad. Trainsheet's own side
// views at the shared scale (js/carart.js), each drawn from, and checked
// against, one photograph on Wikimedia Commons, named here fleet by
// fleet. Bodies and parts from czechia.cars.js (unit, letters and the
// rest); the Impuls body is the one polregio.cars.js draws, the EN57AL
// body the one mazowieckie.cars.js draws.
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. All the
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
//   EN62 (Pesa, two cars): EN62-001a ("EN62-001(1).jpg"), white with a
//     blue cap over the cab sweeping down its side, a black lower front,
//     a blue and green swoosh along the side. The photograph shows the
//     prototype in a Pesa demonstrator-ish livery; ŁKA's EN62s wear
//     ŁKA's own livery, so the livery as drawn is a judgement, said so
//     here and in FACTS. Two cars is the figure usually published for
//     the class.
//   EN98 (Newag Impuls 2, three sections): NO photograph of an EN98 was
//     found. Its shape is the Impuls drawn from the 31WE-022A
//     photograph ("NEWAG Impuls 31WE 022 Jelenia Gora 10 25.jpg"), and
//     its paint is ŁKA's white, blue and green, read from the EN62
//     photograph's swoosh: a blue wave low on the side with a green line
//     over it, blue doors. Both the shape's source and the livery are
//     said so here and in FACTS; the three sections are the figure
//     usually published for the class, set down from memory.
//   EN57AL (Pafawag, three cars): EN57AL-1651 of Koleje Mazowieckie
//     ("EN57AL-1651, Koleje Mazowieckie (43486229704).jpg"), green over
//     white with a yellow band low on the side. ŁKA's EN57ALs wear ŁKA
//     livery, not KM's, so the body and the cab are from the photograph
//     and the paint is ŁKA's blue and green, read from the EN62
//     photograph: a blue band above the windows, a blue cab, a green
//     band low on the side, blue doors. The livery is a judgement, said
//     so here and in FACTS.
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

// ---------- EN62: the two-car Pesa ----------
// A cab at each end of the train, each car on two trucks of its own; a
// very rounded cab under one big curved windshield, a blue cap over the
// cab sweeping down its side, a black lower front, a blue and green
// swoosh along the side.
const E62 = { white: "#f2f3f4", blue: "#1d5cb8", green: "#009444", roof: "#b9bec4", skirt: "#3a3d42", black: "#20242a", door: "#dfe2e6" };
const G62 = { roof: 13.4, sill: 3.4 };
const NOSE_62 = [[1.6, 3.4], [0.9, 5.6], ["q", 0.9, 7.2, 2.6, 8.6], [7.2, 12.6], ["q", 8.0, 13.4, 10.0, 13.4]];
function en62Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, E62.white], [12.7, 3, E62.roof], [0, 3.9, E62.skirt]]) +
      // The blue cap over the cab, sweeping down its side, and the black
      // lower front under it.
      (cab ? path("M-1 13.4L12.0 13.4L12.0 11.2Q10.5 8.0 6.0 7.6L-1 7.6Z", E62.blue) + rect(-1, 3.4, 5.5, 2.6, E62.black) : "") +
      // The swoosh: a blue arc over a green one, low on the side.
      path("M16.0 5.6Q26.0 5.6 32.0 9.4L32.0 10.2Q26.0 6.4 16.0 6.4Z", E62.blue) +
      path("M16.0 4.6Q28.0 4.6 34.0 8.6L34.0 9.4Q28.0 5.4 16.0 5.4Z", E62.green);
  };
}
const e62Door = (x) => ({ x, w: 3.0, y0: G62.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: E62.door });
const e62Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en62Car = (c) => unit(c, { roof: G62.roof, sill: G62.sill, nose: NOSE_62, rake: [[2.6, 8.6], [7.2, 12.6]], depth: 3.0, cabLen: 15, lampY: 4.6,
  rows: [e62Win(seq(17.5, 5.6, 5)), e62Win([51.5, 57.1, 62.7])], doors: [e62Door(12.4), e62Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en62Paint(true), surround: "#111214",
  // The cab's side window, raked at the front like the windshield.
  cab: () => path("M8.6 7.4L14.6 7.4L14.6 11.0L11.8 11.0Q9.6 9.8 8.6 7.4Z", "#1d2026", 0.4),
  // The pantograph is on the trailing car (a reading).
  pan: c.index === 1 ? c.L / 2 : null,
  extra: (cc, g) => hvac(20, G62.roof, 12, 0.6) + hvac(48, G62.roof, 10, 0.6) + boxes(20, g.L - 16, G62.sill, 2, 0.8) +
    letters(cc, 40.0, 12.2, 1.1, "ŁKA", E62.blue, { weight: 800 }) });

// ---------- EN98: the Impuls 2 in ŁKA colours ----------
// The Impuls shape, drawn from the 31WE photograph (no EN98 photograph
// was found): articulated sections sharing a truck at each joint, a truck
// of its own under each cab, a rounded nose under a deep windshield, the
// windows single. ŁKA's paint, read from the EN62 photograph's swoosh:
// a blue wave low on the side with a green line over it, blue doors.
const L98 = { white: "#f2f3f4", blue: "#1d5cb8", green: "#009444", roof: "#b9bec4", skirt: "#3a3d42" };
const G98 = { roof: 13.7, sill: 3.2 };
const NOSE_98 = [[1.4, 3.2], [0.9, 5.4], ["q", 0.9, 6.8, 2.2, 8.0], [6.2, 12.8], ["q", 7.0, 13.7, 9.0, 13.7]];
function en98Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, L98.white], [12.9, 3, L98.roof], [0, 3.9, L98.skirt]]) +
      // The blue wave: low along the side, rising behind the cab to just
      // under the windows, with a green line over its top edge.
      rect(-1, 3.9, L + 2, 1.6, L98.blue) + rect(-1, 5.5, L + 2, 0.28, L98.green) +
      (cab ? path("M10.0 3.9L23.0 3.9L23.0 8.0Q19.0 5.2 10.0 5.5Z", L98.blue) +
        line(10.0, 5.5, 23.0, 8.0, L98.green, 0.3) : "");
  };
}
const e98Door = (x) => ({ x, w: 4.4, y0: G98.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: L98.blue });
const e98Win = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en98Cab = (c) => unit(c, { roof: G98.roof, sill: G98.sill, nose: NOSE_98, rake: [[2.2, 8.0], [6.2, 12.8]], depth: 3.2, cabLen: 16, lampY: 4.4,
  rows: [e98Win(seq(28.0, 5.6, 4))], doors: [e98Door(21.0), e98Door(c.L - 8.0)],
  trucks: [12.0, "end"], wheel: 35, paint: en98Paint(true), surround: "#111214",
  // The cab's side window in a black panel, raked at the front like the
  // windshield.
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, G98.roof, 12, 0.7) + hvac(40, G98.roof, 10, 0.7) + boxes(20, g.L - 16, G98.sill, 2, 0.8) +
    letters(cc, 30.0, 12.2, 1.0, "ŁKA", L98.blue, { weight: 800 }) });
const en98Mid = (c) => unit(c, { roof: G98.roof, sill: G98.sill,
  rows: [e98Win(seq(12.0, 5.6, 7))], doors: [e98Door(5.0), e98Door(c.L - 9.4)],
  trucks: ["end"], paint: en98Paint(false),
  // A pantograph on the second section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, G98.roof, 12, 0.7) + hvac(g.L - 22, G98.roof, 12, 0.7) + boxes(14, g.L - 14, G98.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 1.0, "ŁKA", L98.blue, { weight: 800 }) });

// ---------- EN57AL in ŁKA colours ----------
// The modernised EN57 body as mazowieckie.cars.js draws it from
// EN57AL-1651: a rounded cab, one big windshield; white, a blue band
// above the windows, a blue cab, a green band low on the side, blue
// doors. The livery is a judgement, read from the EN62 photograph.
const L57 = { blue: "#1d5cb8", green: "#009444", white: "#f2f3f4", dark: "#3a3d42", roof: "#9aa0a6", black: "#1a1d20" };
const G57L = { roof: 13.2, sill: 3.6 };
const NOSE_57L = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function lkaEn57alPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, L57.white], [10.9, 2.3, L57.blue], [12.55, 3, L57.roof], [0, 5.0, L57.green], [0, 3.2, L57.dark]]) +
      // The blue cab: from the roof down past the windshield.
      (cab ? rect(-1, 7.3, 14.0, 6.1, L57.blue) : "");
  };
}
const l57Door = (x) => ({ x, w: 3.0, y0: G57L.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: L57.blue });
const l57Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const lkaEn57alCab = (c) => unit(c, { roof: G57L.roof, sill: G57L.sill, nose: NOSE_57L, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [l57Win(seq(17.5, 5.6, 5)), l57Win([51.5, 57.1, 62.7])], doors: [l57Door(12.4), l57Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: lkaEn57alPaint(true), surround: L57.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) =>
    // The round headlight on the roof's edge, as photographed.
    circle(1.3, 13.15, 0.55, "#3a3d42") + circle(1.3, 13.15, 0.38, "#fff4cf") +
    hvac(20, G57L.roof, 12, 0.6) + hvac(46, G57L.roof, 12, 0.6) + boxes(20, g.L - 16, G57L.sill, 3, 1.2) +
    letters(cc, 30.0, 11.7, 0.85, "ŁKA", "#ffffff", { weight: 700 }) });
const lkaEn57alMid = (c) => unit(c, { roof: G57L.roof, sill: G57L.sill,
  rows: [l57Win(seq(10.5, 5.6, 8))], doors: [l57Door(4.6), l57Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: lkaEn57alPaint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57L.roof, 12, 0.6) + hvac(g.L - 26, G57L.roof, 12, 0.6) + boxes(16, g.L - 16, G57L.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  lkaEn62Cab: { name: "EN62 car (Łódzka Kolej Aglomeracyjna)", kind: "emu" },
  lkaEn98Cab: { name: "EN98 Impuls 2 end section (Łódzka Kolej Aglomeracyjna)", kind: "emu" },
  lkaEn98Mid: { name: "EN98 Impuls 2 middle section (Łódzka Kolej Aglomeracyjna)", kind: "emu" },
  lkaEn57alCab: { name: "EN57AL end car (Łódzka Kolej Aglomeracyjna)", kind: "emu" },
  lkaEn57alMid: { name: "EN57AL middle car (Łódzka Kolej Aglomeracyjna)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the EN62 about 42.7 m as two cars; the EN98 about 58.5 m as three
// sections; the EN57AL 64.77 m as three cars, as the EN57.
export const MODELS = {
  lkaEn62Cab: M(en62Car, 70.0, true, byIndex),
  lkaEn98Cab: M(en98Cab, 64.0, true),
  lkaEn98Mid: M(en98Mid, 64.0, false, byIndex),
  lkaEn57alCab: M(lkaEn57alCab, 71.0, true),
  lkaEn57alMid: M(lkaEn57alMid, 70.5, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const EN62_SET = set("Typical: an EN62 two-car electric unit (a judgement: the timetable names no unit; the EN62s are ŁKA's commonest train)",
  ["lkaEn62Cab", 2]);
const EN98_SET = set("Typical: an EN98 Impuls 2 three-section electric unit (a judgement: the timetable names no unit)",
  ["lkaEn98Cab", 1], ["lkaEn98Mid", 1], ["lkaEn98Cab", 1]);
const EN57AL_SET = set("Typical: an EN57AL three-car electric unit (a judgement: the timetable names no unit)",
  ["lkaEn57alCab", 1], ["lkaEn57alMid", 1], ["lkaEn57alCab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, and ŁKA's lines
// are just "Ł", "ŁS" and "ŁP", so a train is placed by its line. Every
// rule below is a judgement.
//   ŁP: the EN98 Impuls 2.
//   ŁS: the EN57AL.
//   Everything else, and any train not placed: the EN62.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
export const TYPICAL = {
  lka: (t = {}) => {
    const route = fold(t.route || t.line || "");
    if (route === "lp") return EN98_SET;
    if (route === "ls") return EN57AL_SET;
    return EN62_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fEn62 = { model: "EN62", type: "Electric multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}EN62-001%281%29.jpg` };
const fEn98 = { model: "EN98 (Newag Impuls 2)", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}NEWAG_Impuls_31WE_022_Jelenia_Gora_10_25.jpg` };
const fEn57al = { model: "EN57AL", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}EN57AL-1651%2C_Koleje_Mazowieckie_%2843486229704%29.jpg` };
export const FACTS = {
  lkaEn62Cab: { ...fEn62,
    about: "One car of the EN62, Pesa's two-car unit: white with a blue cap over the cab, a black lower front and a blue and green swoosh along the side. The unit photographed is the prototype EN62-001a in a Pesa demonstrator-ish livery; ŁKA's EN62s wear ŁKA's own livery, so the livery as drawn is a judgement." },
  lkaEn98Cab: { ...fEn98,
    about: "An end section of the EN98, Newag's Impuls 2. No photograph of an EN98 was found: its shape is the Impuls drawn from the 31WE-022A photograph at Jelenia Góra, and its paint is ŁKA's white, blue and green, read from the EN62 photograph's swoosh. The three sections are the figure usually published for the class." },
  lkaEn98Mid: { ...fEn98,
    about: "The middle section of an EN98 Impuls 2; the sections share a truck at each joint. Both the shape's source and the livery are judgements, said in the file header." },
  lkaEn57alCab: { ...fEn57al,
    about: "An end car of the EN57AL, the modernised EN57, in ŁKA's blue and green. The photograph is a Koleje Mazowieckie EN57AL-1651, green over white with a yellow band: the body and the cab are from it, and the livery is ŁKA's, read from the EN62 photograph — a judgement." },
  lkaEn57alMid: { ...fEn57al,
    about: "The middle car of a ŁKA EN57AL; it carries the pantograph. The livery is a judgement." },
};
