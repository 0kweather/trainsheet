// Koleje Małopolskie's cars (scripts/railroads/poland.py, agency
// "malopolskie"): Lesser Poland's regional railroad. Trainsheet's own
// side views at the shared scale (js/carart.js), each drawn from, and
// checked against, one photograph on Wikimedia Commons, named here fleet
// by fleet. Bodies and parts from czechia.cars.js (unit, letters and the
// rest).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. The EN64
// photograph is a three-quarter view from the front and the EN71 one a
// front view, so the windows' spacing, the doors' places, the roof
// equipment, what hangs under the floor and every length are Trainsheet's
// reading of the type, not measurements. The lengths the drawings are
// scaled to are the figures usually published for each class, set down
// from memory and not checked against a source for this file (see
// MODELS); the fact sheets give none. The file was verified after
// writing: node --check passes, every consist renders, and each drawing
// was looked at beside its photograph (22 Nov 2026).
//
//   EN64 (Pesa Acatus Plus, two cars): EN64-003
//     ("Koleje Małopolskie EN64 2020.jpg"), orange and white with a blue
//     stripe low on the side, orange doors, a rounded cab under one big
//     windshield. Two cars can be counted; the pantograph sits on the
//     rear car, as photographed.
//   EN71 (Pafawag, four cars): EN71-001 at Kraków Główny
//     ("EN71-001 na stacji Kraków Główny (2024 r.).jpg"), a front view.
//     The classic EN57 body stretched to four cars: yellow from the roof
//     to the waist, blue below, a dark grey skirt; a flat front with
//     three windshield panes, the big round headlight on the roof's edge
//     and two round headlights low. What the side looks like is a reading
//     from the EN57 family and the sliver of side the photograph shows.
//     The yellow-and-blue livery is as photographed; that these trains
//     run in Koleje Małopolskie's service is a judgement, said so here
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

// ---------- EN64: the two-car Acatus Plus ----------
// A cab at each end of the train, each car on two trucks of its own; a
// rounded cab under one big windshield, orange over the cab and along the
// top of the side, white below with a blue stripe low, orange doors, a
// grey skirt.
const E64 = { orange: "#e8541d", white: "#f2f3f4", blue: "#1d4fa1", roof: "#8d9399", skirt: "#8d9399", black: "#1a1d20" };
const G64 = { roof: 13.4, sill: 3.4 };
const NOSE_64 = [[1.5, 3.4], [0.9, 5.8], ["q", 0.9, 7.2, 2.4, 8.4], [7.0, 12.6], ["q", 7.8, 13.4, 9.8, 13.4]];
function en64Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, E64.white], [12.7, 3, E64.roof], [0, 3.9, E64.skirt]]) +
      // The orange band along the top of the side, and the blue stripe
      // low on it.
      rect(-1, 11.6, L + 2, 1.1, E64.orange) + rect(-1, 5.0, L + 2, 0.7, E64.blue) +
      // The orange cab: from the roof down past the windshield.
      (cab ? rect(-1, 3.4, 13.5, 10.0, E64.orange) : "");
  };
}
const e64Door = (x) => ({ x, w: 3.0, y0: G64.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: E64.orange });
const e64Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en64Car = (c) => unit(c, { roof: G64.roof, sill: G64.sill, nose: NOSE_64, rake: [[2.4, 8.4], [7.0, 12.6]], depth: 3.0, cabLen: 15, lampY: 4.6,
  rows: [e64Win(seq(17.5, 5.6, 5)), e64Win([51.5, 57.1, 62.7])], doors: [e64Door(12.4), e64Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en64Paint(true), surround: E64.black,
  // The cab's side window, raked at the front like the windshield.
  cab: () => path("M8.6 7.4L14.6 7.4L14.6 11.0L11.8 11.0Q9.6 9.8 8.6 7.4Z", "#1d2026", 0.4),
  // The pantograph is on the trailing car (as photographed).
  pan: c.index === 1 ? c.L / 2 : null,
  extra: (cc, g) => hvac(20, G64.roof, 12, 0.6) + hvac(48, G64.roof, 10, 0.6) + boxes(20, g.L - 16, G64.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.7, "Koleje Małopolskie", "#ffffff", { weight: 700 }) });

// ---------- EN71: the four-car classic ----------
// The same body as the EN57, yellow over blue, a flat three-pane front,
// the big round headlight on the roof's edge. Drawn as photographed;
// its service here is a judgement.
const E71M = { yellow: "#f5c400", blue: "#1d4fa1", roof: "#b9bec4", skirt: "#2e3236", black: "#1a1d20" };
const G71M = { roof: 13.2, sill: 3.6 };
const NOSE_71M = [[0.9, 3.6], [0.7, 7.2], [0.7, 11.6], ["q", 0.75, 13.2, 2.4, 13.2]];
function en71Paint() {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, E71M.yellow], [12.55, 3, E71M.roof], [0, 5.5, E71M.blue], [0, 3.9, E71M.skirt]]);
  };
}
const e71Door = (x, w = 3.0) => ({ x, w, y0: G71M.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: E71M.yellow });
const e71Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en71Cab = (c) => unit(c, { roof: G71M.roof, sill: G71M.sill, nose: NOSE_71M, rake: [[0.85, 8.0], [1.3, 12.0]], depth: 2.6, cabLen: 12, lampY: 4.6, coupler: "buffers",
  rows: [e71Win(seq(17.5, 5.6, 5)), e71Win([51.5, 57.1, 62.7])], doors: [e71Door(11.0, 2.4), e71Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en71Paint(), surround: E71M.black,
  // The cab's side window, and its door right behind it, as on the EN57.
  cab: () => win(7.4, 7.8, 2.6, 3.0, 0.3),
  extra: (cc, g) =>
    // The big round headlight on the roof's edge, as photographed.
    circle(1.3, 13.15, 0.62, "#3a3d42") + circle(1.3, 13.15, 0.45, "#fff4cf") +
    hvac(20, G71M.roof, 12, 0.6) + hvac(46, G71M.roof, 12, 0.6) + boxes(20, g.L - 16, G71M.sill, 3, 1.2) +
    letters(cc, 20.0, 4.6, 0.6, "Koleje Małopolskie", "#ffffff", { weight: 600 }) });
const en71Mid = (c) => unit(c, { roof: G71M.roof, sill: G71M.sill,
  rows: [e71Win(seq(10.5, 5.6, 8))], doors: [e71Door(4.6), e71Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: en71Paint(),
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G71M.roof, 12, 0.6) + hvac(g.L - 26, G71M.roof, 12, 0.6) + boxes(16, g.L - 16, G71M.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  kmEn64Cab: { name: "EN64 car (Koleje Małopolskie)", kind: "emu" },
  kmEn71Cab: { name: "EN71 end car (Koleje Małopolskie)", kind: "emu" },
  kmEn71Mid: { name: "EN71 middle car (Koleje Małopolskie)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the EN64 about 42.8 m as two
// cars; the EN71 about 86.7 m as four cars.
export const MODELS = {
  kmEn64Cab: M(en64Car, 70.0, true, byIndex),
  kmEn71Cab: M(en71Cab, 71.0, true),
  kmEn71Mid: M(en71Mid, 71.2, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const EN64_SET = set("Typical: an EN64 two-car electric unit (a judgement: the timetable names no unit; the EN64s are Koleje Małopolskie's train for the SKA lines)",
  ["kmEn64Cab", 2]);
const EN71_SET = set("Typical: an EN71 four-car electric unit (a judgement: the timetable names no unit; the longer unit for the longer runs to Zakopane, Krynica and Jasło)",
  ["kmEn71Cab", 1], ["kmEn71Mid", 2], ["kmEn71Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, so a train is
// placed by its line ("Kraków Główny – Zakopane", "Oświęcim – Sędziszów")
// and, when no line is known, by its two ends. Every rule below is a
// judgement.
//   The longer runs (Zakopane, Krynica-Zdrój, Jasło): the EN71.
//   Everything else, and any train not placed: the EN64.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
export const TYPICAL = {
  malopolskie: (t = {}) => {
    const route = fold(t.route || t.line || `${t.origin || ""} – ${t.destination || t.dest || ""}`);
    if (/zakopane|krynica|jaslo/.test(route)) return EN71_SET;
    return EN64_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fEn64 = { model: "EN64 (Pesa Acatus Plus)", type: "Electric multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}Koleje_Ma%C5%82opolskie_EN64_2020.jpg` };
const fEn71 = { model: "EN71", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}EN71-001_na_stacji_Krak%C3%B3w_G%C5%82%C3%B3wny_%282024_r.%29.jpg` };
export const FACTS = {
  kmEn64Cab: { ...fEn64,
    about: "One car of the EN64, Pesa's two-car unit for Koleje Małopolskie: orange over the cab and along the top of the side, white below with a blue stripe and orange doors. The unit photographed is EN64-003; the pantograph sits on the rear car, as photographed." },
  kmEn71Cab: { ...fEn71,
    about: "An end car of the EN71, the EN57's four-car sister: the same classic body, yellow over blue, a flat three-pane front with the big round headlight on the roof's edge. The unit photographed at Kraków Główny is the first, EN71-001; what its side looks like is read from the EN57 family, and its service here is a judgement." },
  kmEn71Mid: { ...fEn71,
    about: "A middle car of an EN71; it carries the pantograph. Its service here is a judgement." },
};
