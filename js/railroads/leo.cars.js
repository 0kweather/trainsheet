// Leo Express's cars (scripts/railroads/poland.py, agency "leo"): the
// Czech open-access operator's trains between Praha and Warszawa and
// Kraków (via Bohumín). Trainsheet's own side views at the shared scale
// (js/carart.js), each drawn from, and checked against, one photograph on
// Wikimedia Commons, named here fleet by fleet. The Vectron is drawn
// here with czechia.cars.js's euroLoco body in Leo's white and orange —
// czechia's own Vectron wears Leo's older graphite livery, which is not
// the one photographed — and the coach is drawn here too.
//
// What is from the photograph: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. The
// photograph is a three-quarter view from the front, so the windows'
// spacing, the doors' places, the roof equipment, what hangs under the
// floor and every length are Trainsheet's reading of the type, not
// measurements. The lengths the drawings are scaled to are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file (see MODELS); the fact sheets give none.
// The file was verified after writing: node --check passes, every consist
// renders, and each drawing was looked at beside its photograph
// (22 Nov 2026).
//
//   Vectron (Siemens, 193 226): the white locomotive at Naumburg
//     ("2026-07-13-leo-express-235-frankfurt-bohumin-in-naumburg.jpg"),
//     an orange cap over each cab, an orange cab door, "leo express"
//     big in black along the side with its copper slash. (Leo also runs
//     FLIRT units and TRAXX locomotives on some of these trains; the
//     Vectron is drawn, as photographed.)
//   The coach: the blue coach behind it at Naumburg, a lighter blue
//     band through the windows, a silver roof, "leo express" small in
//     white mid-side.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each rule is
// set out.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, poly, win, truck, underframe } from "../carart.js?v=dev";
import { euroLoco, leoLogo, letters, hvac, buffers } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");

// ---------- The Vectron in Leo's white and orange ----------
// White, an orange cap over each cab, a dark underframe; "leo express"
// big in black along the side. The orange cab door is drawn over the
// body's door at each end.
const LEO = { white: "#f2f3f4", orange: "#f58220", copper: "#c96a1e", roof: "#9aa0a6", skirt: "#17181a", black: "#111214" };
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
const leoPaint = (c, L) => bands(L, [[0, 20, LEO.white], [11.8, 3, LEO.roof], [0, 4.9, LEO.skirt]]) +
  // The orange cap over the cab: its back edge sloping down to the roof.
  path("M0 11.8L0 10.6L2.6 10.8L4.6 11.8Z", LEO.orange) + path(`M${L} 11.8L${L} 10.6L${L - 2.6} 10.8L${L - 4.6} 11.8Z`, LEO.orange) +
  path("M0 11.8L8.0 11.8L8.0 12.9L0 12.9Z", LEO.orange) + path(`M${L} 11.8L${L - 8.0} 11.8L${L - 8.0} 12.9L${L} 12.9Z`, LEO.orange);
// The orange door over the body's door (x 5.6, w 1.9, y 4.6–11.2), its
// window drawn back over it; at both ends.
const leoDoor = (x) => rect(x, 4.6, 1.9, 6.6, LEO.orange) + win(x + 0.25, 8.2, 1.4, 2.0, 0.25);
const leoOver = (c, L) => leoLogo(c, L / 2, 8.9, 3.4, "#1d1e20") +
  letters(c, L / 2 + 9, 4.4, 0.55, "193 226", "#3a3d42", { weight: 600 }) +
  leoDoor(5.6) + leoDoor(L - 7.5);
const leoVectron = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6,
  paint: leoPaint, over: leoOver, surround: LEO.black,
  grilles: [[-19.0, 10.0, 9.4, 11.3], [9.0, 10.0, 9.4, 11.3], [-4.0, 8.0, 9.4, 11.3]], grilleFill: "rgba(20,22,25,0.5)" });

// ---------- The coach ----------
// A 26.4 m coach on two trucks 19 m apart, a door at each end, ten windows
// between. Blue, a lighter blue band through the windows, a silver roof,
// a dark skirt; "leo express" small in white mid-side.
const CO = { blue: "#2f6fb8", light: "#7fb2e5", roof: "#b9bec4", skirt: "#1d1e20" };
function leoCoach(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [2.0, L - 4.6];
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: CO.blue, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 })),
    livery: () => bands(L, [[6.9, 4.4, CO.light], [12.4, 3, CO.roof], [0, 4.2, CO.skirt]]),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.7) + [14, L - 14].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) +
      leoLogo(cc, L / 2, 5.5, 1.5, "#ffffff") });
}

// ---------- Tables ----------

export const TYPES = {
  leoVectron: { name: "Siemens Vectron electric locomotive (Leo Express)", kind: "electric", pan: true },
  leoCoach: { name: "Coach (Leo Express)", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the Vectron 18.98 m; the
// coach 26.4 m.
export const MODELS = {
  leoVectron: M(leoVectron, 62.27),
  leoCoach: M(leoCoach, 86.6, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const HAULED_SET = set("Typical: a white and orange Leo Express Vectron locomotive and coaches (a judgement: the timetable names no unit)",
  ["leoVectron", 1], ["leoCoach", 4]);

// The timetable (the Polish Trains GTFS) names no unit, so every Leo
// Express train is drawn as the Vectron and coaches.
export const TYPICAL = {
  leo: (t = {}) => HAULED_SET,
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
export const FACTS = {
  leoVectron: { model: "Siemens Vectron (Leo Express 193)", type: "Electric locomotive", builder: "Siemens Mobility",
    source: `${CM}2026-07-13-leo-express-235-frankfurt-bohumin-in-naumburg.jpg`,
    about: "Leo Express's white Vectron, as photographed at Naumburg: an orange cap over each cab, an orange cab door, \"leo express\" big in black along the side. Leo also runs FLIRT units and TRAXX locomotives on some of these trains; czechia.cars.js's Vectron wears Leo's older graphite livery, which is not the one drawn here." },
  leoCoach: { model: "Leo Express coach", type: "Locomotive-hauled passenger coach",
    source: `${CM}2026-07-13-leo-express-235-frankfurt-bohumin-in-naumburg.jpg`,
    about: "One of Leo Express's blue coaches, as photographed at Naumburg behind the white Vectron: a lighter blue band through the windows, a silver roof, \"leo express\" small in white mid-side." },
};
