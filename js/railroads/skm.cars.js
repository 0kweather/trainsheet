// SKM Warszawa's cars (scripts/railroads/poland.py, agency "skm"):
// Warsaw's suburban railroad (S1, S2, S3, S4, S40). Trainsheet's own
// side views at the shared scale (js/carart.js), each drawn from, and
// checked against, one photograph on Wikimedia Commons, named here fleet
// by fleet. Bodies and parts from czechia.cars.js (unit, letters and the
// rest); the Impuls body is the one polregio.cars.js draws, the EN57 body
// the one it draws too.
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
//   14WE (Newag, four cars): 14WE-04 ("Newag, 14WE-04, SKM Warszawa
//     (15999496332).jpg"), on S2 to Pruszków. White, a blue cab and a
//     blue skirt, an orange stripe along the side at the waist, the
//     windows in one dark band; a big black windshield, "SKM" on the
//     side. Four cars can be counted by their gangway joints.
//   45WEa Impuls (Newag, six sections): 45WEa-002A
//     ("45WEa-002A SKM, Warszawa Gdańska.jpg"), on S4 to Legionowo. A
//     red cab and a red front, white sides, the windows in a black band,
//     red doors, a thin yellow line low on the side, "SKM" on the cab.
//     Six sections are the figure usually published for the class, set
//     down from memory.
//   EN57 (Pafawag, three cars): EN57-2070 at Kraków Główny
//     ("Polregio EN57-2070, Kraków Główny, 2024 (04).jpg"), in
//     PolRegio's modernised red, orange and silver. SKM Warszawa runs
//     EN57s, but no photograph of one in SKM livery is in this set, so
//     the body is drawn from that photograph and the livery — white, a
//     red cab, a navy stripe low on the side, red doors — is a judgement,
//     said so here and in FACTS.
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

// ---------- 14WE: the four-car unit ----------
// Four cars, each on two trucks of its own, a cab at each end of the
// train: a rounded nose under one big black windshield, the windows in
// one dark band, an orange stripe along the waist, a blue skirt.
const W14 = { white: "#f2f3f4", blue: "#1d4fa1", orange: "#f58220", band: "#1c1f23", roof: "#b9bec4", skirt: "#1d4fa1", black: "#1a1d20" };
const G14 = { roof: 13.4, sill: 3.4 };
const NOSE_14 = [[1.2, 3.4], [0.9, 6.0], ["q", 0.9, 7.0, 2.0, 8.2], [5.0, 12.6], ["q", 5.8, 13.4, 7.8, 13.4]];
function w14Paint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 20.0 : -1;
    return bands(L, [[0, 20, W14.white], [12.7, 3, W14.roof], [0, 3.4, W14.skirt]]) +
      // The window band: from behind the cab on an end car, the whole
      // side on a middle one.
      rect(a, 6.9, L - a + 1, 4.1, W14.band) +
      // The orange stripe along the waist, rising a little behind the cab.
      rect(-1, 5.4, L + 2, 0.45, W14.orange) +
      (cab ? path("M9.0 5.4L21.0 5.4L21.0 6.9Q15.0 5.7 9.0 5.85Z", W14.orange) : "") +
      // The blue cab: from the nose back past the windshield.
      (cab ? rect(-1, 6.4, 13.5, 7.0, W14.blue) : "");
  };
}
const w14Door = (x) => ({ x, w: 3.4, y0: G14.sill, y1: 11.0, leaves: 2, glassY: 0.4, glassH: 0.5, grabs: false, fill: W14.white });
const w14Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const w14Cab = (c) => unit(c, { roof: G14.roof, sill: G14.sill, nose: NOSE_14, rake: [[2.0, 8.2], [5.0, 12.6]], depth: 3.0, cabLen: 14, lampY: 4.6, coupler: "buffers",
  rows: [w14Win([26.0, 31.6, 37.2])], doors: [w14Door(19.5), w14Door(c.L - 7.5)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: w14Paint(true), surround: W14.black,
  // The cab's side window, raked at the front like the windshield.
  cab: () => path("M8.2 7.4L14.2 7.4L14.2 11.0L11.4 11.0Q9.2 9.8 8.2 7.4Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(20, G14.roof, 10, 0.6) + hvac(g.L - 22, G14.roof, 10, 0.6) + boxes(16, g.L - 14, G14.sill, 2, 0.8) +
    letters(cc, g.L / 2 + 2, 12.2, 0.9, "SKM", W14.blue, { weight: 800 }) });
const w14Mid = (c) => unit(c, { roof: G14.roof, sill: G14.sill,
  rows: [w14Win(seq(11.0, 5.4, 5))], doors: [w14Door(5.0), w14Door(c.L - 8.4)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: w14Paint(false),
  // The pantograph is on the second car (a reading).
  pan: c.index === 1 ? c.L / 2 : null,
  extra: (cc, g) => hvac(8, G14.roof, 10, 0.6) + hvac(g.L - 20, G14.roof, 10, 0.6) + boxes(12, g.L - 12, G14.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.8, "SKM", W14.blue, { weight: 800 }) });

// ---------- 45WEa Impuls: the six-section unit in red and white ----------
// The Impuls body again: articulated sections sharing a truck at each
// joint, a truck of its own under each cab; a rounded nose under a deep
// windshield, the windows in one black band, red doors, a thin yellow
// line low on the side.
const W45 = { white: "#f2f3f4", red: "#d6222c", band: "#1c1f23", yellow: "#f5c400", roof: "#b9bec4", skirt: "#3a3d42", blue: "#1d4fa1" };
const G45 = { roof: 13.7, sill: 3.2 };
const NOSE_45 = [[1.4, 3.2], [0.9, 5.4], ["q", 0.9, 6.8, 2.2, 8.0], [6.2, 12.8], ["q", 7.0, 13.7, 9.0, 13.7]];
function w45Paint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 20.0 : -1;
    return bands(L, [[0, 20, W45.white], [12.9, 3, W45.roof], [0, 3.9, W45.skirt]]) +
      rect(a, 6.9, L - a + 1, 4.1, W45.band) +
      // The red cab: from the nose back past the windshield.
      (cab ? rect(-1, 3.2, 14.5, 10.5, W45.red) : "") +
      // The thin yellow line low on the side.
      rect(-1, 4.4, L + 2, 0.3, W45.yellow);
  };
}
const w45Door = (x) => ({ x, w: 4.4, y0: G45.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: W45.red });
const w45Win = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const w45Cab = (c) => unit(c, { roof: G45.roof, sill: G45.sill, nose: NOSE_45, rake: [[2.2, 8.0], [6.2, 12.8]], depth: 3.2, cabLen: 16, lampY: 4.4,
  rows: [w45Win(seq(28.0, 5.6, 4))], doors: [w45Door(21.0), w45Door(c.L - 8.0)],
  trucks: [12.0, "end"], wheel: 35, paint: w45Paint(true), surround: "#111214",
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, G45.roof, 12, 0.7) + hvac(40, G45.roof, 10, 0.7) + boxes(20, g.L - 16, G45.sill, 2, 0.8) +
    letters(cc, 17.5, 5.2, 1.0, "SKM", W45.blue, { weight: 800 }) });
const w45Mid = (c) => unit(c, { roof: G45.roof, sill: G45.sill,
  rows: [w45Win(seq(12.0, 5.6, 7))], doors: [w45Door(5.0), w45Door(c.L - 9.4)],
  trucks: ["end"], paint: w45Paint(false),
  // A pantograph on the second section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, G45.roof, 12, 0.7) + hvac(g.L - 22, G45.roof, 12, 0.7) + boxes(14, g.L - 14, G45.sill, 2, 0.8) });

// ---------- EN57 in SKM red and white ----------
// The modernised EN57 body as polregio.cars.js draws it: a rounded cab,
// one big windshield; white, a red cab, a navy stripe low on the side,
// red doors. The livery is a judgement, read from SKM's red and blue.
const W57 = { red: "#e30613", navy: "#1d4fa1", white: "#f2f3f4", roof: "#9aa0a6", skirt: "#5b6672", black: "#1a1d20" };
const G57 = { roof: 13.2, sill: 3.6 };
const NOSE_57 = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function w57Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, W57.white], [12.55, 3, W57.roof], [0, 5.0, W57.navy], [0, 3.9, W57.skirt]]) +
      // The red cab: from the roof down past the windshield.
      (cab ? rect(-1, 7.3, 14.0, 6.1, W57.red) : "");
  };
}
const w57Door = (x) => ({ x, w: 3.0, y0: G57.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: W57.red });
const w57Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const w57Cab = (c) => unit(c, { roof: G57.roof, sill: G57.sill, nose: NOSE_57, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [w57Win(seq(17.5, 5.6, 5)), w57Win([51.5, 57.1, 62.7])], doors: [w57Door(12.4), w57Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: w57Paint(true), surround: W57.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) => hvac(20, G57.roof, 12, 0.6) + hvac(46, G57.roof, 12, 0.6) + boxes(20, g.L - 16, G57.sill, 3, 1.2) +
    letters(cc, 30.0, 11.7, 0.85, "SKM", W57.navy, { weight: 800 }) });
const w57Mid = (c) => unit(c, { roof: G57.roof, sill: G57.sill,
  rows: [w57Win(seq(10.5, 5.6, 8))], doors: [w57Door(4.6), w57Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: w57Paint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57.roof, 12, 0.6) + hvac(g.L - 26, G57.roof, 12, 0.6) + boxes(16, g.L - 16, G57.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  skm14weCab: { name: "14WE end car (SKM Warszawa)", kind: "emu" },
  skm14weMid: { name: "14WE middle car (SKM Warszawa)", kind: "emu" },
  skm45weCab: { name: "45WEa Impuls end section (SKM Warszawa)", kind: "emu" },
  skm45weMid: { name: "45WEa Impuls middle section (SKM Warszawa)", kind: "emu" },
  skmEn57Cab: { name: "EN57 end car (SKM Warszawa)", kind: "emu" },
  skmEn57Mid: { name: "EN57 middle car (SKM Warszawa)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the 14WE about 59.6 m as four cars; the 45WEa about 110 m as six
// sections; the EN57 64.77 m as three cars.
export const MODELS = {
  skm14weCab: M(w14Cab, 49.0, true),
  skm14weMid: M(w14Mid, 49.0, false, byIndex),
  skm45weCab: M(w45Cab, 60.0, true),
  skm45weMid: M(w45Mid, 60.0, false, byIndex),
  skmEn57Cab: M(w57Cab, 71.0, true),
  skmEn57Mid: M(w57Mid, 70.5, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const W14_SET = set("Typical: a 14WE four-car electric unit (a judgement: the timetable names no unit; the 14WEs are the S1/S2 units)",
  ["skm14weCab", 1], ["skm14weMid", 2], ["skm14weCab", 1]);
const W45_SET = set("Typical: a 45WEa Impuls six-section electric unit (a judgement: the timetable names no unit; the 45WEas are the S3/S4 units)",
  ["skm45weCab", 1], ["skm45weMid", 4], ["skm45weCab", 1]);
const EN57_SET = set("Typical: an EN57 three-car electric unit (a judgement: the timetable names no unit; the older unit, still on SKM services)",
  ["skmEn57Cab", 1], ["skmEn57Mid", 1], ["skmEn57Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, so a train is
// placed by its line number (S1, S2, S3, S4, S40) in its number, and by
// its line's two ends when no number is known. Every rule below is a
// judgement.
//   S1 (Otwock – Pruszków) and S2 (Sulejówek Miłosna – Warszawa Lotnisko
//     Chopina): the 14WE.
//   S3 (Legionowo – Warszawa Lotnisko Chopina), S4 (Piaseczno –
//     Wieliszew) and S40 (Piaseczno – Radzymin): the 45WEa.
//   Everything else, and any train not placed: the EN57.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
export const TYPICAL = {
  skm: (t = {}) => {
    const num = String(t.number || "").trim().toUpperCase();
    const head = num.split(/\s+/)[0];
    if (head === "S1" || head === "S2") return W14_SET;
    if (head === "S3" || head === "S4" || head === "S40") return W45_SET;
    if (head) return EN57_SET;
    // No number known (a line on the fleet page): the line's two ends.
    const route = fold(t.route || t.line);
    const ends = route ? route.split(/\s+[–-]\s+/) : [fold(t.origin), fold(t.destination || t.dest)];
    const either = (re) => ends.some((e) => re.test(e.trim()));
    if (either(/^otwock/) || either(/^sulejowek/)) return W14_SET;
    if (either(/^legionowo/) || either(/^piaseczno/)) return W45_SET;
    return EN57_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const f14we = { model: "14WE", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}Newag%2C_14WE-04%2C_SKM_Warszawa_%2815999496332%29.jpg` };
const f45we = { model: "45WEa Impuls", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}45WEa-002A_SKM%2C_Warszawa_Gda%C5%84ska.jpg` };
const fEn57 = { model: "EN57", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}Polregio_EN57-2070%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2804%29.jpg` };
export const FACTS = {
  skm14weCab: { ...f14we,
    about: "An end car of the 14WE, Newag's four-car unit for Warsaw's suburban trains: white with a blue cab and skirt, an orange stripe along the waist and the windows in one dark band. The unit photographed on S2 to Pruszków is 14WE-04; four cars can be counted." },
  skm14weMid: { ...f14we,
    about: "A middle car of a 14WE; it carries the pantograph on the second car. Each car rides on two trucks of its own." },
  skm45weCab: { ...f45we,
    about: "An end section of the 45WEa, the six-section Impuls in SKM Warszawa's red and white: a red cab, the windows in a black band, red doors and a thin yellow line low on the side. The unit photographed at Warszawa Gdańska is 45WEa-002A, on S4 to Legionowo." },
  skm45weMid: { ...f45we,
    about: "A middle section of a 45WEa Impuls; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
  skmEn57Cab: { ...fEn57,
    about: "An end car of the EN57, Poland's classic three-car electric unit, in SKM Warszawa's colours. No photograph of an SKM EN57 is in this set: the body is the modernised EN57 photographed at Kraków Główny, and the livery — white, a red cab, a navy stripe low on the side — is a judgement." },
  skmEn57Mid: { ...fEn57,
    about: "The middle car of an SKM EN57; it carries the pantograph. The livery is a judgement, read from SKM's red and blue." },
};
