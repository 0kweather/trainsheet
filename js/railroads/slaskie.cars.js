// Koleje Śląskie's cars (scripts/railroads/poland.py, agency "slaskie"):
// the Pesa Elf and the EN57. Trainsheet's own side views at the shared
// scale (js/carart.js), each drawn from, and checked against, one
// photograph on Wikimedia Commons, named here fleet by fleet. Bodies and
// parts from czechia.cars.js (unit, letters and the rest); the Elf's
// sections follow the EN76's as js/railroads/mazowieckie.cars.js draws
// them, the EN57's cars the EN57's as js/railroads/polregio.cars.js draws
// them.
//
// What is from the photographs: the Elf's shape, and the EN57's shape and
// cab. NO exterior photograph of a Koleje Śląskie Elf (27WE/35WE) could be
// fetched — the 27WE-002 files found are interior shots only — so the Elf
// here is drawn FROM the EN76 photograph (the same Pesa Elf family, in
// Koleje Mazowieckie paint) and re-liveried to Koleje Śląskie's
// white/green-yellow, and that livery is a judgement, not a photograph.
// The EN57's Koleje Śląskie livery is likewise a judgement: the photograph
// shows the same unit in PolRegio's red/orange/silver, re-liveried here
// to white with a green band and a yellow skirt. All three photographs in
// the set are three-quarter views from the front, so the windows' spacing,
// the doors' places, the roof equipment, what hangs under the floor and
// every length are Trainsheet's reading of the type, not measurements. The
// lengths the drawings are scaled to are the figures usually published for
// each class, set down from memory and not checked against a source for
// this file (see MODELS); the fact sheets give none. The file was verified
// after writing: node --check passes, every consist renders, and each
// drawing was looked at beside its photograph (22 Nov 2026).
//
//   Elf 27WE/35WE (Pesa, four sections as drawn): the Elf's shape from
//     the EN76 at Ciechanów ("2025-01-26 EN76 Koleje Mazowieckie,
//     Ciechanów (1).jpg") — a rounded nose under a big curved windshield,
//     single windows, the green swoosh sweeping up beside the cab and
//     running back below the windows, yellow doors, a yellow skirt. The
//     27WE is the four-car car of the family, the 35WE its three-car
//     sister; the drawing shows the four-car set for both, and the label
//     says so. The sections share a truck at each joint. Where the
//     pantograph sits is a reading.
//   EN57 (Pafawag, three cars): EN57-2070 at Kraków Główny
//     ("Polregio EN57-2070, Kraków Główny, 2024 (04).jpg"), the
//     modernised cab with one big windshield, re-liveried to Koleje
//     Śląskie's white, green band and yellow skirt. The same body as
//     PolRegio's EN57.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each rule is set
// out.

import { C, rect, circle, path, line, poly, win, truck, underframe } from "../carart.js?v=dev";
import { unit, letters, hvac } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Elf 27WE/35WE ----------
// Four sections sharing a truck at each joint, a truck of its own under
// each cab; a rounded nose under a big curved windshield, the windows
// single, the green swoosh sweeping up beside the cab and running back
// below the windows, yellow doors, a yellow skirt. The shape is the EN76's
// (see mazowieckie.cars.js); the livery is Koleje Śląskie's as judged,
// not photographed.
const EL = { white: "#f2f3f4", green: "#009444", yellow: "#f7c600", roof: "#b9bec4", skirt: "#3a3d42", dark: "#20242a" };
const ELG = { roof: 13.4, sill: 3.2 };
const NOSE_EL = [[1.5, 3.2], [0.9, 5.6], ["q", 0.9, 7.2, 2.4, 8.4], [6.8, 12.6], ["q", 7.6, 13.4, 9.6, 13.4]];
function elfPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, EL.white], [12.7, 3, EL.roof], [0, 5.0, EL.yellow], [0, 3.9, EL.skirt]]) +
      // The green swoosh: rising beside the cab, then a band below the
      // windows to the end of the section (on a middle section, the band
      // the whole way).
      (cab
        ? path("M5.0 3.9L14.0 3.9Q21.0 4.1 23.0 7.0L23.0 7.6L5.0 7.6Z", EL.green) + rect(23.0, 6.4, L - 22.0, 1.2, EL.green)
        : rect(-1, 6.4, L + 2, 1.2, EL.green)) +
      // The dark lower front under the cab.
      (cab ? rect(-1, 3.2, 6.0, 2.2, EL.dark) : "");
  };
}
const elDoor = (x) => ({ x, w: 4.4, y0: ELG.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: EL.yellow });
const elWin = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const elfCab = (c) => unit(c, { roof: ELG.roof, sill: ELG.sill, nose: NOSE_EL, rake: [[2.4, 8.4], [6.8, 12.6]], depth: 3.0, cabLen: 15, lampY: 4.6,
  rows: [elWin(seq(28.0, 5.6, 4))], doors: [elDoor(21.0), elDoor(c.L - 8.0)], diaphragm: [3.2, 12.2],
  trucks: [12.0, "end"], wheel: 35, paint: elfPaint(true), surround: "#111214",
  // The cab's side window in a black panel, raked at the front like the
  // windshield.
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, ELG.roof, 12, 0.7) + hvac(40, ELG.roof, 10, 0.7) + boxes(20, g.L - 16, ELG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.9, "Koleje Śląskie", EL.green, { weight: 700 }) });
const elfMid = (c) => unit(c, { roof: ELG.roof, sill: ELG.sill,
  rows: [elWin(seq(12.0, 5.6, 7))], doors: [elDoor(5.0), elDoor(c.L - 9.4)], diaphragm: [3.2, 12.2],
  trucks: ["end"], paint: elfPaint(false),
  // A pantograph on the first middle section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, ELG.roof, 12, 0.7) + hvac(g.L - 22, ELG.roof, 12, 0.7) + boxes(14, g.L - 14, ELG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.9, "Koleje Śląskie", EL.green, { weight: 700 }) });

// ---------- EN57 in Koleje Śląskie service ----------
// The EN57 body as polregio.cars.js draws it: a rounded modernised cab,
// one big windshield, the white band with the windows between a green band
// above and a yellow skirt below; yellow doors. The livery is a judgement:
// the photograph shows this unit in PolRegio paint.
const KS57 = { green: "#009444", yellow: "#f7c600", white: "#f2f3f4", skirt: "#3a3d42", roof: "#9aa0a6", black: "#1a1d20" };
const G57K = { roof: 13.2, sill: 3.6 };
const NOSE_57K = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function en57Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, KS57.white], [10.9, 2.3, KS57.green], [12.55, 3, KS57.roof], [0, 5.0, KS57.yellow], [0, 3.2, KS57.skirt]]) +
      // The green cab: from the roof down past the windshield.
      (cab ? rect(-1, 7.3, 14.0, 6.1, KS57.green) : "");
  };
}
const e57Door = (x) => ({ x, w: 3.0, y0: G57K.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: KS57.yellow });
const e57Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en57Cab = (c) => unit(c, { roof: G57K.roof, sill: G57K.sill, nose: NOSE_57K, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [e57Win(seq(17.5, 5.6, 5)), e57Win([51.5, 57.1, 62.7])], doors: [e57Door(12.4), e57Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en57Paint(true), surround: KS57.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) =>
    // The round headlight on the roof's edge, as photographed.
    circle(1.3, 13.15, 0.55, "#3a3d42") + circle(1.3, 13.15, 0.38, "#fff4cf") +
    hvac(20, G57K.roof, 12, 0.6) + hvac(46, G57K.roof, 12, 0.6) + boxes(20, g.L - 16, G57K.sill, 3, 1.2) +
    letters(cc, 30.0, 11.7, 0.85, "Koleje Śląskie", "#ffffff", { weight: 700 }) });
const en57Mid = (c) => unit(c, { roof: G57K.roof, sill: G57K.sill,
  rows: [e57Win(seq(10.5, 5.6, 8))], doors: [e57Door(4.6), e57Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: en57Paint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57K.roof, 12, 0.6) + hvac(g.L - 26, G57K.roof, 12, 0.6) + boxes(16, g.L - 16, G57K.sill, 3, 1.2) });

// ---------- Tables ----------

export const TYPES = {
  ksElfCab: { name: "Elf 27WE/35WE end section (Koleje Śląskie)", kind: "emu" },
  ksElfMid: { name: "Elf 27WE/35WE middle section (Koleje Śląskie)", kind: "emu" },
  ksEn57Cab: { name: "EN57 end car (Koleje Śląskie)", kind: "emu" },
  ksEn57Mid: { name: "EN57 middle car (Koleje Śląskie)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the 27WE about 64.3 m as four sections; the EN57 64.77 m as three cars,
// as PolRegio's.
export const MODELS = {
  ksElfCab: M(elfCab, 55.1, true),
  ksElfMid: M(elfMid, 50.4, false, byIndex),
  ksEn57Cab: M(en57Cab, 71.0, true),
  ksEn57Mid: M(en57Mid, 70.5, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const ELF_SET = set("Typical: an Elf 27WE/35WE electric unit (a judgement: the timetable names no unit; the 27WE is the four-car car of the family, the 35WE its three-car sister — the drawing shows the four-car set for both)",
  ["ksElfCab", 1], ["ksElfMid", 2], ["ksElfCab", 1]);
const EN57_SET = set("Typical: an EN57 three-car electric unit in Koleje Śląskie service (a judgement: the timetable names no unit)",
  ["ksEn57Cab", 1], ["ksEn57Mid", 1], ["ksEn57Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, and a train is
// placed by its route, the label the feed gives each run ("Częstochowa –
// Gliwice", "Katowice – Zwardoń") and, where the label is missing, by its
// two ends. Every rule below is a judgement.
//   The Elf on the S1/S5/S6/S7 corridors: S1 Gliwice–Częstochowa (via
//     Chorzów), S5 Katowice–Zwardoń, S6 Katowice–Wisła (via Skoczów, and
//     its Cieszyn branch), S7 Katowice–Racibórz (via Rybnik, Wodzisław
//     and Żory, and its Orzesze–Tychy branch).
//   The EN57 elsewhere: the Tychy Lodowisko shuttles, the Lubliniec
//     lines, Mysłowice–Oświęcim, Katowice–Bohumín, the Kraków lines,
//     Chorzew Siemkowice–Chorzów and Bytom–Gliwice.
//   A run whose route the feed does not name ("KŚ", 41 runs): the Elf,
//     the fallback.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").replace(/[–—]/g, "-").toLowerCase().trim();
const ELF_ROUTES = new Set([
  "czestochowa - gliwice", "chorzow - czestochowa",
  "katowice - zwardon", "gliwice - zwardon",
  "katowice - wisla", "raciborz - wisla", "gliwice - wisla", "cieszyn - skoczow",
  "katowice - raciborz", "chalupki - raciborz", "gliwice - wodzislaw slaski",
  "rybnik - zory", "orzesze jaskowice - tychy",
]);
const KNOWN_ROUTES = new Set([...ELF_ROUTES,
  "tychy - tychy lodowisko", "chorzow - lubliniec", "czestochowa - lubliniec",
  "myslowice - oswiecim", "katowice - bohumin", "katowice - krakow",
  "czestochowa - krakow", "chorzew siemkowice - chorzow", "bytom - gliwice",
]);
export const TYPICAL = {
  slaskie: (t = {}) => {
    const route = fold(t.route);
    const pair = fold(`${t.origin || ""} - ${t.destination || ""}`);
    const pairR = fold(`${t.destination || ""} - ${t.origin || ""}`);
    if (ELF_ROUTES.has(route) || ELF_ROUTES.has(pair) || ELF_ROUTES.has(pairR)) return ELF_SET;
    if (KNOWN_ROUTES.has(route) || KNOWN_ROUTES.has(pair) || KNOWN_ROUTES.has(pairR)) return EN57_SET;
    return ELF_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fElf = { model: "Elf 27WE/35WE (Pesa)", type: "Electric multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}2025-01-26_EN76_Koleje_Mazowieckie%2C_Ciechan%C3%B3w_%281%29.jpg` };
const fEn57 = { model: "EN57", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}Polregio_EN57-2070%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2804%29.jpg` };
export const FACTS = {
  ksElfCab: { ...fElf,
    about: "An end section of Koleje Śląskie's Elf, drawn from the EN76 photograph — no exterior photograph of a 27WE/35WE could be fetched — in Koleje Śląskie's white, green and yellow, a judgement: a rounded nose under a big curved windshield, a green swoosh sweeping up beside the cab, yellow doors and a yellow skirt. The 27WE is the four-car car of the family; the drawing shows the four-car set." },
  ksElfMid: { ...fElf,
    about: "A middle section of the Elf; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
  ksEn57Cab: { ...fEn57,
    about: "An end car of the EN57 in Koleje Śląskie service, the classic three-car unit re-liveried to white with a green band and a yellow skirt — a judgement, the photograph shows it in PolRegio paint. One big windshield, the round headlight on the roof's edge." },
  ksEn57Mid: { ...fEn57,
    about: "The middle car of an EN57; it carries the pantograph." },
};
