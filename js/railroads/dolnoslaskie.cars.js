// Koleje Dolnośląskie's cars (scripts/railroads/poland.py, agency
// "dolnoslaskie"): Lower Silesia's regional railroad. Trainsheet's own
// side views at the shared scale (js/carart.js), each drawn from, and
// checked against, one photograph on Wikimedia Commons, named here fleet
// by fleet. Bodies and parts from czechia.cars.js (unit, letters and the
// rest); the Impuls body is the one polregio.cars.js draws.
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
//   31WE Impuls (Newag, four sections): 31WE-022A at Jelenia Góra
//     ("NEWAG Impuls 31WE 022 Jelenia Gora 10 25.jpg"). White, the
//     yellow wave low on the side rising behind the cab to just under
//     the windows, a dark line over the wave's top edge, a dark grey
//     skirt; "DOLNY ŚLĄSK" with the Silesian eagle and "Koleje
//     Dolnośląskie" along the side, "KD" on the nose. Four sections can
//     be counted by their gangway joints. The windows stand singly on
//     the white, not in a black band.
//   45WE Impuls (Newag, six sections): no photograph of a KD 45WE in
//     this set. Its shape is the 45WEa-002A of SKM Warszawa
//     ("45WEa-002A SKM, Warszawa Gdańska.jpg") — red and white there —
//     and its paint is the 31WE's KD yellow, as drawn here; the six
//     sections are the figure usually published for the class, set down
//     from memory. The drawing is the 31WE's body, longer.
//   EN57 (Pafawag, three cars): no photograph of a KD EN57 in this set.
//     Its body is the modernised EN57 polregio.cars.js draws from
//     EN57-2070 at Kraków Główny, and its paint is KD's yellow and
//     white, read from the 31WE photograph: a yellow band above the
//     windows and a yellow band low on the side, a yellow cab, yellow
//     doors. The livery is a judgement, said so here and in FACTS.
//
// KD also runs SA135 diesel railcars on its unwired lines; they are not
// drawn in this file (no SA135 model for KD yet), so those trains are
// drawn as the electric units below. The timetable names no unit, so
// which fleet a train is drawn as is a judgement, labeled as typical;
// see TYPICAL below, where each rule is set out.

import { C, rect, circle, path, line, poly, win, truck, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- The Impuls in KD yellow: 31WE (four sections), 45WE (six) ----------
// Articulated sections sharing a truck at each joint, a truck of its own
// under each cab; a rounded nose under a deep windshield, the windows
// single, the yellow wave rising behind the cab, yellow doors.
const KD = { white: "#f2f3f4", yellow: "#ffcc00", dark: "#3a3d42", roof: "#b9bec4", skirt: "#3a3d42" };
const KDG = { roof: 13.7, sill: 3.2 };
const NOSE_KD = [[1.4, 3.2], [0.9, 5.4], ["q", 0.9, 6.8, 2.2, 8.0], [6.2, 12.8], ["q", 7.0, 13.7, 9.0, 13.7]];
function kdImpulsPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, KD.white], [12.9, 3, KD.roof], [0, 3.9, KD.skirt]]) +
      // The yellow band low on the side, with a dark line over its top
      // edge; behind the cab it rises to just under the windows.
      rect(-1, 3.9, L + 2, 1.6, KD.yellow) + rect(-1, 5.5, L + 2, 0.28, KD.dark) +
      (cab ? path("M10.0 3.9L23.0 3.9L23.0 8.0Q19.0 5.2 10.0 5.5Z", KD.yellow) +
        line(10.0, 5.5, 23.0, 8.0, KD.dark, 0.3) : "");
  };
}
const kdImDoor = (x) => ({ x, w: 4.4, y0: KDG.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: KD.yellow });
const kdImWin = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const kdImpulsCab = (c) => unit(c, { roof: KDG.roof, sill: KDG.sill, nose: NOSE_KD, rake: [[2.2, 8.0], [6.2, 12.8]], depth: 3.2, cabLen: 16, lampY: 4.4,
  rows: [kdImWin(seq(28.0, 5.6, 4))], doors: [kdImDoor(21.0), kdImDoor(c.L - 8.0)],
  trucks: [12.0, "end"], wheel: 35, paint: kdImpulsPaint(true), surround: "#111214",
  // The cab's side window in a black panel, raked at the front like the
  // windshield.
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, KDG.roof, 12, 0.7) + hvac(40, KDG.roof, 10, 0.7) + boxes(20, g.L - 16, KDG.sill, 2, 0.8) +
    letters(cc, 30.0, 12.2, 0.9, "DOLNY ŚLĄSK", KD.dark, { weight: 800 }) +
    letters(cc, 48.0, 12.2, 0.6, "Koleje Dolnośląskie", KD.dark, { weight: 600 }) });
const kdImpulsMid = (c) => unit(c, { roof: KDG.roof, sill: KDG.sill,
  rows: [kdImWin(seq(12.0, 5.6, 7))], doors: [kdImDoor(5.0), kdImDoor(c.L - 9.4)],
  trucks: ["end"], paint: kdImpulsPaint(false),
  // A pantograph on the second section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, KDG.roof, 12, 0.7) + hvac(g.L - 22, KDG.roof, 12, 0.7) + boxes(14, g.L - 14, KDG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.8, "DOLNY ŚLĄSK", KD.dark, { weight: 800 }) });

// ---------- EN57 in KD yellow ----------
// The modernised EN57 body as polregio.cars.js draws it: a rounded cab,
// one big windshield; white, a yellow band above the windows and a yellow
// band low on the side, a yellow cab, yellow doors. The livery is a
// judgement, read from the 31WE photograph.
const K57 = { yellow: "#ffcc00", white: "#f2f3f4", dark: "#3a3d42", roof: "#9aa0a6", black: "#1a1d20" };
const G57K = { roof: 13.2, sill: 3.6 };
const NOSE_57K = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function kdEn57Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, K57.white], [10.9, 2.3, K57.yellow], [12.55, 3, K57.roof], [0, 5.0, K57.yellow], [0, 3.2, K57.dark]]) +
      // The yellow cab: from the roof down past the windshield.
      (cab ? rect(-1, 7.3, 14.0, 6.1, K57.yellow) : "");
  };
}
const kd57Door = (x) => ({ x, w: 3.0, y0: G57K.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: K57.yellow });
const kd57Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const kdEn57Cab = (c) => unit(c, { roof: G57K.roof, sill: G57K.sill, nose: NOSE_57K, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [kd57Win(seq(17.5, 5.6, 5)), kd57Win([51.5, 57.1, 62.7])], doors: [kd57Door(12.4), kd57Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: kdEn57Paint(true), surround: K57.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) => hvac(20, G57K.roof, 12, 0.6) + hvac(46, G57K.roof, 12, 0.6) + boxes(20, g.L - 16, G57K.sill, 3, 1.2) +
    letters(cc, 30.0, 11.7, 0.85, "Koleje Dolnośląskie", K57.dark, { weight: 700 }) });
const kdEn57Mid = (c) => unit(c, { roof: G57K.roof, sill: G57K.sill,
  rows: [kd57Win(seq(10.5, 5.6, 8))], doors: [kd57Door(4.6), kd57Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: kdEn57Paint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57K.roof, 12, 0.6) + hvac(g.L - 26, G57K.roof, 12, 0.6) + boxes(16, g.L - 16, G57K.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  kd31weCab: { name: "31WE Impuls end section (Koleje Dolnośląskie)", kind: "emu" },
  kd31weMid: { name: "31WE Impuls middle section (Koleje Dolnośląskie)", kind: "emu" },
  kd45weCab: { name: "45WE Impuls end section (Koleje Dolnośląskie)", kind: "emu" },
  kd45weMid: { name: "45WE Impuls middle section (Koleje Dolnośląskie)", kind: "emu" },
  kdEn57Cab: { name: "EN57 end car (Koleje Dolnośląskie)", kind: "emu" },
  kdEn57Mid: { name: "EN57 middle car (Koleje Dolnośląskie)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the 31WE about 74 m as four sections; the 45WE about 110 m as six
// sections; the EN57 64.77 m as three cars.
export const MODELS = {
  kd31weCab: M(kdImpulsCab, 61.0, true),
  kd31weMid: M(kdImpulsMid, 61.0, false, byIndex),
  kd45weCab: M(kdImpulsCab, 60.0, true),
  kd45weMid: M(kdImpulsMid, 60.0, false, byIndex),
  kdEn57Cab: M(kdEn57Cab, 71.0, true),
  kdEn57Mid: M(kdEn57Mid, 70.5, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const IMPULS31_SET = set("Typical: a 31WE Impuls four-section electric unit (a judgement: the timetable names no unit; the 31WEs are KD's commonest train)",
  ["kd31weCab", 1], ["kd31weMid", 2], ["kd31weCab", 1]);
const IMPULS45_SET = set("Typical: a 45WE Impuls six-section electric unit (a judgement: the timetable names no unit; the longer Impuls for the Sprinter workings)",
  ["kd45weCab", 1], ["kd45weMid", 4], ["kd45weCab", 1]);
const EN57_SET = set("Typical: an EN57 three-car electric unit (a judgement: the timetable names no unit; the older unit for the mountain lines)",
  ["kdEn57Cab", 1], ["kdEn57Mid", 1], ["kdEn57Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, so a train is
// placed by its line ("KD Sprinter", "Wrocław – Jelenia Góra") and, when
// no line is known, by its two ends. Every rule below is a judgement.
//   KD Sprinter (the limited-stop workings): the 45WE, the longer Impuls.
//   The mountain and cross-border lines (Jelenia Góra, Szklarska Poręba,
//     Karpacz, Kudowa-Zdrój, Wałbrzych, Liberec, Trutnov): the EN57.
//   Everything else, and any train not placed: the 31WE.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const MOUNTAIN = /^(liberec|szklarska poreba|jelenia gora|karpacz|trutnov|sedzislaw|kudowa|walbrzych|harrachov|jablonec)/;
export const TYPICAL = {
  dolnoslaskie: (t = {}) => {
    let route = fold(t.route || t.line);
    let ends = route ? route.split(/\s+[–-]\s+/) : [fold(t.origin), fold(t.destination || t.dest)];
    const either = (re) => ends.some((e) => re.test(e.trim()));
    if (route === "kd sprinter") return IMPULS45_SET;
    if (either(MOUNTAIN)) return EN57_SET;
    return IMPULS31_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const f31we = { model: "31WE Impuls", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}NEWAG_Impuls_31WE_022_Jelenia_Gora_10_25.jpg` };
const f45we = { model: "45WE Impuls", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}45WEa-002A_SKM%2C_Warszawa_Gda%C5%84ska.jpg` };
const fEn57 = { model: "EN57", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}Polregio_EN57-2070%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2804%29.jpg` };
export const FACTS = {
  kd31weCab: { ...f31we,
    about: "An end section of Newag's Impuls in Koleje Dolnośląskie's white and yellow: the yellow wave low on the side rising behind the cab, \"DOLNY ŚLĄSK\" along the side. The unit photographed at Jelenia Góra is 31WE-022A; four sections can be counted." },
  kd31weMid: { ...f31we,
    about: "A middle section of a 31WE Impuls; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
  kd45weCab: { ...f45we,
    about: "An end section of the 45WE, the six-section Impuls. No photograph of a KD 45WE is in this set: its shape is the SKM Warszawa 45WEa-002A photographed at Warszawa Gdańska (red and white there), and its paint is the 31WE's KD yellow. The six sections are the figure usually published for the class." },
  kd45weMid: { ...f45we,
    about: "A middle section of a 45WE Impuls, drawn as the 31WE's body; the sections share a truck at each joint." },
  kdEn57Cab: { ...fEn57,
    about: "An end car of the EN57, Poland's classic three-car electric unit, in KD's yellow and white. No photograph of a KD EN57 is in this set: the body is the modernised EN57 photographed at Kraków Główny, and the livery is read from KD's 31WE photograph — a judgement." },
  kdEn57Mid: { ...fEn57,
    about: "The middle car of a KD EN57; it carries the pantograph. The livery is a judgement, read from KD's 31WE photograph." },
};
