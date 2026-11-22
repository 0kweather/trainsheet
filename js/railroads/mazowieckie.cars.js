// Koleje Mazowieckie's cars (scripts/railroads/poland.py, agency
// "mazowieckie"): the FLIRT, the modernised EN57AL and the Pesa Elf.
// Trainsheet's own side views at the shared scale (js/carart.js), each
// drawn from, and checked against, one photograph on Wikimedia Commons,
// named here fleet by fleet. Bodies and parts from czechia.cars.js
// (unit, letters and the rest); the FLIRT's sections follow the ED160's
// as js/railroads/ic.cars.js draws them, the EN57AL's cars the EN57's as
// js/railroads/polregio.cars.js draws them.
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. All three
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
//   ER75 FLIRT (Stadler, four sections): ER75-006 at Warszawa Śródmieście
//     ("Stadler FLIRT (Koleje Mazowieckie) outside as ER75-006.jpg"),
//     bound for Żyrardów. White, a green band round the windows, a yellow
//     skirt, yellow doors, a green panel round the windshield with the
//     orange destination display over it. The photograph shows only the
//     leading section, so the four sections are the figure usually
//     published for the class, not a count; the pantograph's place is a
//     reading.
//   EN57AL (Pafawag, three cars): EN57AL-1651
//     ("EN57AL-1651, Koleje Mazowieckie (43486229704).jpg"), green over
//     white with a yellow skirt, yellow doors, the modernised cab with one
//     big windshield and the round headlight on the roof's edge. The same
//     body as PolRegio's EN57, in KM paint.
//   EN76 Elf (Pesa, four sections): an EN76 at Ciechanów
//     ("2025-01-26 EN76 Koleje Mazowieckie, Ciechanów (1).jpg"). White
//     with a green swoosh sweeping up beside the cab and running back
//     below the windows, yellow doors, a dark lower front. The cab's
//     rounded nose and big curved windshield are as photographed; the
//     sections share a truck at each joint, as the Impuls does. Where the
//     pantograph sits is a reading.
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

// ---------- ER75: the FLIRT ----------
// Four sections sharing a truck at each joint, a truck of its own under
// each cab: a rounded nose under a deep windshield; the cab's side window
// a black panel raked at the front; the windows in a green band; single
// plug doors, yellow.
const KF = { white: "#f2f3f4", green: "#009444", yellow: "#f7c600", roof: "#b9bec4", skirt: "#3a3d42" };
const KFG = { roof: 13.9, sill: 3.0, low: 5.0, band: [6.9, 4.1] };
const NOSE_KF = [[1.3, 3.0], [0.9, 5.6], ["q", 0.9, 7.0, 2.2, 8.1], [6.3, 12.9], ["q", 7.0, 13.9, 9.2, 13.9]];
function kmFlirtPaint(cab) {
  return (c, g) => {
    const L = g.L, [by, bh] = KFG.band;
    return bands(L, [[0, 20, KF.white], [12.85, 3, KF.roof], [0, KFG.low, KF.yellow]]) +
      (cab ? path(`M28.2 ${by}Q27 ${by} 27 ${by + 1.2}L27 ${by + bh - 1.2}Q27 ${by + bh} 28.2 ${by + bh}L${L + 1} ${by + bh}L${L + 1} ${by}Z`, KF.green) : rect(-1, by, L + 2, bh, KF.green)) +
      // The front: green from the roof round to below the windshield, its
      // back edge curving past the cab's side window; white below it to
      // the yellow skirt.
      (cab ? path(`M-1 20L13.4 20L12.8 12.85Q9.2 11.6 8.3 8.4Q8.4 7.0 11.6 7.5L-1 7.5Z`, KF.green) : "");
  };
}
const kfDoor = (x) => ({ x, w: 3.2, y0: KFG.sill, y1: 11.0, leaves: 1, glassY: 0.4, glassH: 0.5, grabs: false, fill: KF.yellow });
const kfWin = (xs, w = 4.2) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const kmFlirtCab = (c) => unit(c, { roof: KFG.roof, sill: KFG.sill, nose: NOSE_KF, rake: [[2.2, 8.1], [6.3, 12.9]], depth: 3.2, cabLen: 17, lampY: 4.2,
  rows: [kfWin([28.6, 33.6]), kfWin(seq(44.6, 5.0, 4))], doors: [kfDoor(39.4)], diaphragm: [3.2, 12.2],
  paint: kmFlirtPaint(true), surround: "#111214",
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4) + line(13.3, 7.3, 13.3, 11.5, "#3b444e", 0.7),
  extra: (cc, g) => truck(13.6, { wb: 8.2, d: 36, top: KFG.sill }) + truck(g.L, { wb: 8.86, d: 30, top: KFG.sill }) +
    hvac(22, KFG.roof, 10) + hvac(46, KFG.roof, 10) + boxes(26, 38, KFG.sill, 2, 0.6) +
    letters(cc, 30.6, 12.15, 1.0, "Koleje Mazowieckie", KF.green, { weight: 700 }) });
const kmFlirtMid = (c) => unit(c, { roof: KFG.roof, sill: KFG.sill,
  rows: [kfWin(seq(3.0, 5.0, 4)), kfWin(seq(29.6, 5.0, 5))], doors: [kfDoor(24.4)], diaphragm: [3.2, 12.2], paint: kmFlirtPaint(false),
  // A pantograph on the third section (a reading).
  pan: c.index === 2 ? c.L / 2 + 6 : null,
  extra: (cc, g) => truck(0, { wb: 8.86, d: 30, top: KFG.sill }) + truck(g.L, { wb: 8.86, d: 30, top: KFG.sill }) +
    hvac(4, KFG.roof, 12) + hvac(g.L - 20, KFG.roof, 12) + boxes(30, 46, KFG.sill, 2, 0.6) });

// ---------- EN57AL: the modernised EN57 in KM paint ----------
// The EN57 body as polregio.cars.js draws it: a rounded modernised cab,
// one big windshield, the white band with the windows between a green band
// above and a yellow skirt below; yellow doors.
const KM57 = { green: "#009444", yellow: "#f7c600", white: "#f2f3f4", skirt: "#3a3d42", roof: "#9aa0a6", black: "#1a1d20" };
const G57A = { roof: 13.2, sill: 3.6 };
const NOSE_57A = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function en57alPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, KM57.white], [10.9, 2.3, KM57.green], [12.55, 3, KM57.roof], [0, 5.0, KM57.yellow], [0, 3.2, KM57.skirt]]) +
      // The green cab: from the roof down past the windshield.
      (cab ? rect(-1, 7.3, 14.0, 6.1, KM57.green) : "");
  };
}
const e57aDoor = (x) => ({ x, w: 3.0, y0: G57A.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: KM57.yellow });
const e57aWin = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en57alCab = (c) => unit(c, { roof: G57A.roof, sill: G57A.sill, nose: NOSE_57A, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [e57aWin(seq(17.5, 5.6, 5)), e57aWin([51.5, 57.1, 62.7])], doors: [e57aDoor(12.4), e57aDoor(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en57alPaint(true), surround: KM57.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) =>
    // The round headlight on the roof's edge, as photographed.
    circle(1.3, 13.15, 0.55, "#3a3d42") + circle(1.3, 13.15, 0.38, "#fff4cf") +
    hvac(20, G57A.roof, 12, 0.6) + hvac(46, G57A.roof, 12, 0.6) + boxes(20, g.L - 16, G57A.sill, 3, 1.2) +
    letters(cc, 30.0, 11.7, 0.85, "Koleje Mazowieckie", "#ffffff", { weight: 700 }) });
const en57alMid = (c) => unit(c, { roof: G57A.roof, sill: G57A.sill,
  rows: [e57aWin(seq(10.5, 5.6, 8))], doors: [e57aDoor(4.6), e57aDoor(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: en57alPaint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57A.roof, 12, 0.6) + hvac(g.L - 26, G57A.roof, 12, 0.6) + boxes(16, g.L - 16, G57A.sill, 3, 1.2) });

// ---------- EN76: the Elf ----------
// Four sections sharing a truck at each joint, a truck of its own under
// each cab; a rounded nose under a big curved windshield, the windows
// single, the green swoosh sweeping up beside the cab and running back
// below the windows, yellow doors, a dark lower front.
const EL = { white: "#f2f3f4", green: "#009444", yellow: "#f7c600", roof: "#b9bec4", skirt: "#3a3d42", dark: "#20242a" };
const ELG = { roof: 13.4, sill: 3.2 };
const NOSE_EL = [[1.5, 3.2], [0.9, 5.6], ["q", 0.9, 7.2, 2.4, 8.4], [6.8, 12.6], ["q", 7.6, 13.4, 9.6, 13.4]];
function elfPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, EL.white], [12.7, 3, EL.roof], [0, 3.9, EL.skirt]]) +
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
    letters(cc, g.L / 2, 12.2, 0.9, "Koleje Mazowieckie", EL.green, { weight: 700 }) });
const elfMid = (c) => unit(c, { roof: ELG.roof, sill: ELG.sill,
  rows: [elWin(seq(12.0, 5.6, 7))], doors: [elDoor(5.0), elDoor(c.L - 9.4)], diaphragm: [3.2, 12.2],
  trucks: ["end"], paint: elfPaint(false),
  // A pantograph on the first middle section (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, ELG.roof, 12, 0.7) + hvac(g.L - 22, ELG.roof, 12, 0.7) + boxes(14, g.L - 14, ELG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.9, "Koleje Mazowieckie", EL.green, { weight: 700 }) });

// ---------- Tables ----------

export const TYPES = {
  kmEr75Cab: { name: "ER75 FLIRT end section (Koleje Mazowieckie)", kind: "emu" },
  kmEr75Mid: { name: "ER75 FLIRT intermediate section (Koleje Mazowieckie)", kind: "emu" },
  kmEn57alCab: { name: "EN57AL end car (Koleje Mazowieckie)", kind: "emu" },
  kmEn57alMid: { name: "EN57AL middle car (Koleje Mazowieckie)", kind: "emu" },
  kmEn76Cab: { name: "EN76 Elf end section (Koleje Mazowieckie)", kind: "emu" },
  kmEn76Mid: { name: "EN76 Elf middle section (Koleje Mazowieckie)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the ER75 about 74.3 m as four sections; the EN57AL 64.77 m as three
// cars, as the EN57; the EN76 about 64.3 m as four sections.
export const MODELS = {
  kmEr75Cab: M(kmFlirtCab, 69.6, true),
  kmEr75Mid: M(kmFlirtMid, 52.3, false, byIndex),
  kmEn57alCab: M(en57alCab, 71.0, true),
  kmEn57alMid: M(en57alMid, 70.5, false, byIndex),
  kmEn76Cab: M(elfCab, 55.1, true),
  kmEn76Mid: M(elfMid, 50.4, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const ER75_SET = set("Typical: an ER75 FLIRT four-section electric unit (a judgement: the timetable names no unit; the ER75s run the busiest Warszawa corridors)",
  ["kmEr75Cab", 1], ["kmEr75Mid", 2], ["kmEr75Cab", 1]);
const EN57AL_SET = set("Typical: an EN57AL three-car electric unit (a judgement: the timetable names no unit)",
  ["kmEn57alCab", 1], ["kmEn57alMid", 1], ["kmEn57alCab", 1]);
const EN76_SET = set("Typical: an EN76 Elf four-section electric unit (a judgement: the timetable names no unit)",
  ["kmEn76Cab", 1], ["kmEn76Mid", 2], ["kmEn76Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, and a train is
// placed by the line in its number ("R1 19300/1", "RE2 38", "RL 47").
// Every rule below is a judgement.
//   RL (the airport line, Modlin – Warszawa Lotnisko Chopina): the ER75.
//   R1/R2/R3/R7 and their RE versions (Warszawa – Skierniewice, Łuków,
//     Kutno, Dęblin): the ER75, the busiest corridors.
//   R6/R60 (Warszawa – Małkinia) and R9/R90 (Warszawa – Działdowo) and
//     their RE versions: the EN76 Elf — the photographed EN76 stands at
//     Ciechanów, on the Działdowo line.
//   Everything else, and any train not placed (the R8 Radom/Skarżysko
//     family, the branch lines to Sierpc, Ostrołęka, Płock and Czeremcha):
//     the EN57AL.
const BUSY = new Set(["R1", "R2", "R3", "R7"]);
const ELF_LINES = new Set(["R6", "R60", "R9", "R90"]);
export const TYPICAL = {
  mazowieckie: (t = {}) => {
    const num = String(t.number || "").trim().toUpperCase();
    const head = (num.split(/\s+/)[0] || "").split("/")[0];
    if (head === "RL") return ER75_SET;
    const fam = head.replace(/^RE/, "R");
    if (BUSY.has(fam)) return ER75_SET;
    if (ELF_LINES.has(fam)) return EN76_SET;
    return EN57AL_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fEr75 = { model: "ER75 (Stadler FLIRT)", type: "Electric multiple unit", builder: "Stadler, Siedlce",
  source: `${CM}Stadler_FLIRT_%28Koleje_Mazowieckie%29_outside_as_ER75-006.jpg` };
const fEn57al = { model: "EN57AL", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}EN57AL-1651%2C_Koleje_Mazowieckie_%2843486229704%29.jpg` };
const fEn76 = { model: "EN76 (Pesa Elf)", type: "Electric multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}2025-01-26_EN76_Koleje_Mazowieckie%2C_Ciechan%C3%B3w_%281%29.jpg` };
export const FACTS = {
  kmEr75Cab: { ...fEr75,
    about: "An end section of the ER75, Koleje Mazowieckie's FLIRT: white with a green band round the windows, a yellow skirt and yellow doors, a green panel round the windshield. The unit photographed at Warszawa Śródmieście is ER75-006, bound for Żyrardów; the photograph shows only the leading section, so the four sections are the figure usually published, not a count." },
  kmEr75Mid: { ...fEr75,
    about: "An intermediate section of an ER75; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
  kmEn57alCab: { ...fEn57al,
    about: "An end car of the EN57AL, the modernised EN57 in Koleje Mazowieckie's green, white and yellow: one big windshield, the round headlight on the roof's edge, \"Koleje Mazowieckie\" along the green band. The unit photographed is EN57AL-1651." },
  kmEn57alMid: { ...fEn57al,
    about: "The middle car of an EN57AL; it carries the pantograph." },
  kmEn76Cab: { ...fEn76,
    about: "An end section of the EN76, Pesa's Elf for Koleje Mazowieckie: white with a green swoosh sweeping up beside the cab and running back below the windows, yellow doors, a dark lower front. The unit photographed at Ciechanów is an EN76; the doors' places and roof equipment are a reading." },
  kmEn76Mid: { ...fEn76,
    about: "A middle section of an EN76; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
};
