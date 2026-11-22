// PolRegio's cars (scripts/railroads/poland.py, agency "polregio"):
// Poland's regional passenger railroad. Trainsheet's own side views at the
// shared scale (js/carart.js), each drawn from, and checked against, one
// photograph on Wikimedia Commons, named here fleet by fleet. Bodies and
// parts from czechia.cars.js (unit, letters and the rest).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Only the
// Impuls photograph is a true side view; the others are three-quarter
// views from the front, so the windows' spacing, the doors' places, the
// roof equipment, what hangs under the floor and every length are
// Trainsheet's reading of the type, not measurements. The lengths the
// drawings are scaled to are the figures usually published for each class,
// set down from memory and not checked against a source for this file (see
// MODELS); the fact sheets give none. The file was verified after writing:
// node --check passes, every consist renders, and each drawing was looked
// at beside its photograph (22 Nov 2026).
//
//   EN57 (Pafawag, three cars): EN57-2070 at Kraków Główny
//     ("Polregio EN57-2070, Kraków Główny, 2024 (04).jpg"), with the
//     cab-end close-up ("Dwie jednostki EN57-20XX w malowaniu PolRegio na
//     stacji kolejowej w Gliwicach.jpg") for the livery's detail. The
//     modernised cab: red, a white swoosh behind it, an orange stripe
//     over a silver-grey lower side, a dark grey skirt; one big
//     windshield with the destination display under it, two round
//     headlights low on the nose. The classic red/orange EN57 in the
//     background of the same photograph is the same body in the older
//     paint; the modernised cab is drawn. "POLREGIO" under the cab
//     window, as photographed.
//   EN71 (Pafawag, four cars): EN71-001 at Kraków Główny
//     ("EN71-001 na stacji Kraków Główny (2024 r.).jpg"), a front view.
//     The classic EN57 body stretched to four cars: yellow from the roof
//     to the waist, blue below, a dark grey skirt; a flat front with
//     three windshield panes, the big round headlight on the roof's edge
//     and two round headlights low. What the side looks like is a reading
//     from the EN57 family and the sliver of side the photograph shows.
//   EN63H Impuls (Newag, three cars): EN63H-009 at Kołobrzeg
//     ("Newag Impuls EN63H-009 w Kołobrzegu (2023).jpg"), the one true
//     side view. White with a green cab, green and blue pixel blocks, a
//     black window band, green doors, "HYBRYDA" and "Pomorze Zachodnie"
//     along the side. The graffiti on the middle car's side is not drawn.
//     Three cars can be counted by their gangway joints.
//   EN81 (Pesa, two cars): EN81-002 ("EN81-002.jpg"), front three-quarter
//     view, bound for Kraków Główny. White, a red stripe low on the side
//     with a yellow line over it, sweeping up beside the cab; a rounded
//     cab, one big windshield, the destination display over it; an orange
//     panel with a blue mark mid-side. The doors' places, the windows
//     behind the cab and the roof equipment are a reading.
//   EN90 (Newag Impuls 2, three cars): EN90-006 at Słupsk
//     ("EN90-006.jpg"). White, the windows in a black band, red doors,
//     a dark lower front under an angular cab. Three cars can be counted:
//     two gangway joints are visible before the train is lost in the
//     distance, and three is the figure usually published for the class.
//     Where the pantograph sits is a reading.
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

// ---------- EN57: the modernised three-car unit ----------
// Red over silver-grey with an orange stripe; a rounded modernised cab,
// one big windshield, the white swoosh behind it.
const E57 = { red: "#e30613", orange: "#f58220", silver: "#d8dade", skirt: "#5b6672", roof: "#9aa0a6", white: "#f2f3f4", black: "#1a1d20" };
const G57 = { roof: 13.2, sill: 3.6 };
const NOSE_57 = [[1.0, 3.6], [0.8, 6.2], ["q", 0.8, 7.2, 1.7, 8.0], [3.4, 12.4], ["q", 4.0, 13.2, 5.8, 13.2]];
function en57Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, E57.red], [12.55, 3, E57.roof], [0, 5.6, E57.silver], [0, 3.9, E57.skirt]]) +
      rect(-1, 5.0, L + 2, 0.9, E57.orange) +
      // The white swoosh behind the cab (photograph 05b).
      (cab ? path("M10.5 5.9L15.5 13.2L18.5 13.2L13.5 5.9Z", E57.white) : "");
  };
}
const e57Door = (x) => ({ x, w: 3.0, y0: G57.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: E57.red });
const e57Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en57Cab = (c) => unit(c, { roof: G57.roof, sill: G57.sill, nose: NOSE_57, rake: [[1.7, 8.0], [3.4, 12.4]], depth: 3.2, cabLen: 13, lampY: 4.6, coupler: "buffers",
  rows: [e57Win(seq(17.5, 5.6, 5)), e57Win([51.5, 57.1, 62.7])], doors: [e57Door(12.4), e57Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en57Paint(true), surround: E57.black,
  // The cab's side window, upright behind the windshield.
  cab: () => win(7.6, 7.8, 2.8, 3.0, 0.3),
  extra: (cc, g) => hvac(20, G57.roof, 12, 0.6) + hvac(46, G57.roof, 12, 0.6) + boxes(20, g.L - 16, G57.sill, 3, 1.2) +
    letters(cc, 9.0, 6.2, 0.85, "POLREGIO", "#ffffff", { weight: 800 }) });
const en57Mid = (c) => unit(c, { roof: G57.roof, sill: G57.sill,
  rows: [e57Win(seq(10.5, 5.6, 8))], doors: [e57Door(4.6), e57Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: en57Paint(false),
  // The pantograph is on the middle car (a reading).
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G57.roof, 12, 0.6) + hvac(g.L - 26, G57.roof, 12, 0.6) + boxes(16, g.L - 16, G57.sill, 3, 1.2) });

// ---------- EN71: the four-car classic ----------
// The same body as the EN57, yellow over blue, a flat three-pane front,
// the big round headlight on the roof's edge.
const E71 = { yellow: "#f5c400", blue: "#1d4fa1", roof: "#b9bec4", skirt: "#2e3236", black: "#1a1d20" };
const G71 = { roof: 13.2, sill: 3.6 };
const NOSE_71 = [[0.9, 3.6], [0.7, 7.2], [0.7, 11.6], ["q", 0.75, 13.2, 2.4, 13.2]];
function en71Paint() {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, E71.yellow], [12.55, 3, E71.roof], [0, 5.5, E71.blue], [0, 3.9, E71.skirt]]);
  };
}
const e71Door = (x, w = 3.0) => ({ x, w, y0: G71.sill, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.45, grabs: false, fill: E71.yellow });
const e71Win = (xs, w = 4.4) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en71Cab = (c) => unit(c, { roof: G71.roof, sill: G71.sill, nose: NOSE_71, rake: [[0.85, 8.0], [1.3, 12.0]], depth: 2.6, cabLen: 12, lampY: 4.6, coupler: "buffers",
  rows: [e71Win(seq(17.5, 5.6, 5)), e71Win([51.5, 57.1, 62.7])], doors: [e71Door(11.0, 2.4), e71Door(46.5)],
  trucks: [13.0, c.L - 13.0], wheel: 35, paint: en71Paint(), surround: E71.black,
  // The cab's side window, and its door right behind it, as on the EN57.
  cab: () => win(7.4, 7.8, 2.6, 3.0, 0.3),
  extra: (cc, g) =>
    // The big round headlight on the roof's edge, as photographed.
    circle(1.3, 13.15, 0.62, "#3a3d42") + circle(1.3, 13.15, 0.45, "#fff4cf") +
    hvac(20, G71.roof, 12, 0.6) + hvac(46, G71.roof, 12, 0.6) + boxes(20, g.L - 16, G71.sill, 3, 1.2) +
    letters(cc, 20.0, 4.6, 0.6, "EN71-001", "#ffffff", { weight: 600 }) });
const en71Mid = (c) => unit(c, { roof: G71.roof, sill: G71.sill,
  rows: [e71Win(seq(10.5, 5.6, 8))], doors: [e71Door(4.6), e71Door(c.L - 7.6)],
  trucks: [11.0, c.L - 11.0], wheel: 35, paint: en71Paint(),
  pan: c.L / 2,
  extra: (cc, g) => hvac(14, G71.roof, 12, 0.6) + hvac(g.L - 26, G71.roof, 12, 0.6) + boxes(16, g.L - 16, G71.sill, 3, 1.2) });

// ---------- EN63H Impuls: the hybrid, three sections ----------
// Articulated sections sharing a truck at each joint, a truck of its own
// under each cab; a rounded nose under a deep windshield, the windows in
// one black band, green doors, the pixel blocks of the "Pomorze Zachodnie"
// livery.
const IM = { white: "#f2f4f3", green: "#7ac143", darkGreen: "#3d8b37", blue: "#2b7fc4", sky: "#7ec8e3", band: "#1c1f23", door: "#7ac143", roof: "#b9bec4", skirt: "#3a3d42" };
const IMG = { roof: 13.7, sill: 3.2 };
const NOSE_IM = [[1.4, 3.2], [0.9, 5.4], ["q", 0.9, 6.8, 2.2, 8.0], [6.2, 12.8], ["q", 7.0, 13.7, 9.0, 13.7]];
// The pixel blocks, as blocks of color on the white: by the cab and in a
// cluster above the windows mid-side (their exact places are a reading;
// the graffiti in the photograph is not drawn).
const pixels = (list) => list.map(([x, y, w, h, fill]) => rect(x, y, w, h, fill)).join("");
const imPixelsCab = pixels([[15.0, 11.3, 2.2, 1.5, IM.blue], [17.8, 12.0, 1.6, 1.1, IM.green], [20.0, 11.4, 1.8, 1.3, IM.sky],
  [23.8, 11.6, 1.5, 1.3, IM.green], [26.2, 11.9, 1.4, 1.0, IM.blue], [30.0, 11.6, 2.0, 1.3, IM.green], [32.6, 12.1, 1.5, 1.0, IM.blue],
  [35.0, 11.4, 1.7, 1.4, IM.sky], [37.5, 12.0, 1.4, 1.0, IM.green], [42.0, 11.5, 2.0, 1.3, IM.blue], [44.6, 12.0, 1.5, 1.0, IM.green]]);
const imPixelsMid = pixels([[6.0, 11.6, 2.0, 1.3, IM.green], [8.6, 12.1, 1.5, 1.0, IM.blue], [11.0, 11.4, 1.7, 1.4, IM.sky],
  [50.0, 11.6, 2.0, 1.3, IM.green], [52.6, 12.0, 1.5, 1.0, IM.blue], [55.0, 11.4, 1.7, 1.4, IM.sky]]);
function impulsPaint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 20.0 : -1;
    return bands(L, [[0, 20, IM.white], [12.9, 3, IM.roof], [0, 3.9, IM.skirt]]) +
      // The window band: from behind the cab on an end section, the whole
      // side on a middle one.
      rect(a, 6.9, L - a + 1, 4.1, IM.band) +
      // The green cab: from the nose back past the windshield.
      (cab ? rect(-1, 3.2, 14.5, 10.5, IM.green) : "") +
      (cab ? imPixelsCab : imPixelsMid);
  };
}
const imDoor = (x) => ({ x, w: 4.4, y0: IMG.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: IM.door });
const imWin = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const impulsCab = (c) => unit(c, { roof: IMG.roof, sill: IMG.sill, nose: NOSE_IM, rake: [[2.2, 8.0], [6.2, 12.8]], depth: 3.2, cabLen: 16, lampY: 4.4,
  rows: [imWin(seq(28.0, 5.6, 4))], doors: [imDoor(21.0), imDoor(c.L - 8.0)],
  trucks: [12.0, "end"], wheel: 35, paint: impulsPaint(true), surround: "#111214",
  // The cab's side window in a black panel, raked at the front like the
  // windshield.
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, IMG.roof, 12, 0.7) + hvac(40, IMG.roof, 10, 0.7) + boxes(20, g.L - 16, IMG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.85, "Pomorze Zachodnie", "#20242a", { weight: 700 }) +
    letters(cc, g.L / 2, 4.7, 1.1, "HYBRYDA", IM.darkGreen, { weight: 800 }) });
const impulsMid = (c) => unit(c, { roof: IMG.roof, sill: IMG.sill,
  rows: [imWin(seq(12.0, 5.6, 7))], doors: [imDoor(5.0), imDoor(c.L - 9.4)],
  trucks: ["end"], paint: impulsPaint(false),
  // A pantograph on the middle section (a reading).
  pan: c.L / 2 - 6,
  extra: (cc, g) => hvac(8, IMG.roof, 12, 0.7) + hvac(g.L - 22, IMG.roof, 12, 0.7) + boxes(14, g.L - 14, IMG.sill, 2, 0.8) +
    letters(cc, g.L / 2, 12.2, 0.85, "Pomorze Zachodnie", "#20242a", { weight: 700 }) +
    letters(cc, g.L / 2, 4.7, 1.1, "HYBRYDA", IM.darkGreen, { weight: 800 }) });

// ---------- EN81: the two-car unit ----------
// White, a red stripe low on the side with a yellow line over it, sweeping
// up beside the cab; a rounded cab under one big windshield.
const E81 = { white: "#f2f3f4", red: "#d6222c", yellow: "#f5c400", orange: "#e8722a", blue: "#2b5aa8", roof: "#b9bec4", skirt: "#8d9399", door: "#dfe2e6" };
const G81 = { roof: 13.4, sill: 3.4 };
const NOSE_81 = [[1.5, 3.4], [0.9, 5.8], ["q", 0.9, 7.2, 2.4, 8.4], [7.0, 12.6], ["q", 7.8, 13.4, 9.8, 13.4]];
function en81Paint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, E81.white], [12.7, 3, E81.roof], [0, 3.9, E81.skirt]]) +
      rect(-1, 4.2, L + 2, 0.9, E81.red) + rect(-1, 5.1, L + 2, 0.35, E81.yellow) +
      // The stripe sweeping up beside the cab.
      (cab ? path("M-1 4.2L8.5 4.2Q10.2 4.8 10.6 6.8L10.6 7.6L-1 7.6Z", E81.red) : "") +
      // The orange panel with its blue mark, mid-side, between the
      // windows and the door.
      rect(37.2, 8.2, 3.4, 4.2, E81.orange) + rect(38.1, 9.0, 1.6, 2.6, E81.blue);
  };
}
const e81Door = (x) => ({ x, w: 3.4, y0: G81.sill, y1: 11.0, leaves: 1, glassY: 0.4, glassH: 0.5, grabs: false, fill: E81.door });
const e81Win = (xs, w = 4.0) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en81Cab = (c) => unit(c, { roof: G81.roof, sill: G81.sill, nose: NOSE_81, rake: [[2.4, 8.4], [7.0, 12.6]], depth: 3.0, cabLen: 15, lampY: 4.6,
  rows: [e81Win(seq(16.0, 5.2, 4)), e81Win([48.5, 53.7, 58.9, 64.1])], doors: [e81Door(43.0)],
  trucks: [12.0, c.L - 12.0], wheel: 35, paint: en81Paint(true), surround: "#111214",
  // The cab's side window, raked at the front like the windshield.
  cab: () => path("M8.6 7.4L14.6 7.4L14.6 11.0L11.8 11.0Q9.6 9.8 8.6 7.4Z", "#1d2026", 0.4),
  // The pantograph is on the leading car (a reading).
  pan: c.index === 0 ? c.L - 16 : null,
  extra: (cc, g) => hvac(20, G81.roof, 12, 0.6) + hvac(48, G81.roof, 10, 0.6) + boxes(20, g.L - 16, G81.sill, 2, 0.8) });

// ---------- EN90: the Impuls 2, three sections ----------
// The Impuls's shape again, white with the windows in a black band, red
// doors, a dark lower front under an angular cab.
const E90 = { white: "#eef0f1", band: "#17191d", red: "#d6222c", roof: "#b9bec4", skirt: "#6b7280", dark: "#20242a" };
const G90 = { roof: 13.7, sill: 3.2 };
const NOSE_90 = [[1.4, 3.2], [0.9, 5.2], ["q", 0.9, 6.6, 2.4, 7.9], [6.4, 12.8], ["q", 7.2, 13.7, 9.2, 13.7]];
function en90Paint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 20.0 : -1;
    return bands(L, [[0, 20, E90.white], [12.9, 3, E90.roof], [0, 3.9, E90.skirt]]) +
      rect(a, 6.9, L - a + 1, 4.1, E90.band) +
      // The dark lower front under the cab.
      (cab ? rect(-1, 3.2, 13.0, 2.2, E90.dark) : "");
  };
}
const e90Door = (x) => ({ x, w: 4.4, y0: G90.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: E90.red });
const e90Win = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const en90Cab = (c) => unit(c, { roof: G90.roof, sill: G90.sill, nose: NOSE_90, rake: [[2.4, 7.9], [6.4, 12.8]], depth: 3.2, cabLen: 16, lampY: 4.4,
  rows: [e90Win(seq(28.0, 5.6, 4))], doors: [e90Door(21.0), e90Door(c.L - 8.0)],
  trucks: [12.0, "end"], wheel: 35, paint: en90Paint(true), surround: "#111214",
  cab: () => path("M8.9 7.3L15.6 7.3L15.6 11.5L12.3 11.5Q10.0 10.2 8.9 7.3Z", "#1d2026", 0.4),
  extra: (cc, g) => hvac(18, G90.roof, 12, 0.7) + hvac(40, G90.roof, 10, 0.7) + boxes(20, g.L - 16, G90.sill, 2, 0.8) });
const en90Mid = (c) => unit(c, { roof: G90.roof, sill: G90.sill,
  rows: [e90Win(seq(12.0, 5.6, 7))], doors: [e90Door(5.0), e90Door(c.L - 9.4)],
  trucks: ["end"], paint: en90Paint(false),
  pan: c.L / 2 - 6,
  extra: (cc, g) => hvac(8, G90.roof, 12, 0.7) + hvac(g.L - 22, G90.roof, 12, 0.7) + boxes(14, g.L - 14, G90.sill, 2, 0.8) });

// ---------- Tables ----------

export const TYPES = {
  plEn57Cab: { name: "EN57 end car (PolRegio)", kind: "emu" },
  plEn57Mid: { name: "EN57 middle car (PolRegio)", kind: "emu" },
  plEn71Cab: { name: "EN71 end car", kind: "emu" },
  plEn71Mid: { name: "EN71 middle car", kind: "emu" },
  plEn63hCab: { name: "EN63H Impuls end section", kind: "emu" },
  plEn63hMid: { name: "EN63H Impuls middle section", kind: "emu" },
  plEn81Cab: { name: "EN81 car", kind: "emu" },
  plEn90Cab: { name: "EN90 Impuls 2 end section", kind: "emu" },
  plEn90Mid: { name: "EN90 Impuls 2 middle section", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file:
// the EN57 64.77 m as three cars; the EN71 about 86.7 m as four cars; the
// EN63H about 59.7 m as three sections; the EN81 about 42.9 m as two cars;
// the EN90 about 58.6 m as three sections.
export const MODELS = {
  plEn57Cab: M(en57Cab, 71.0, true),
  plEn57Mid: M(en57Mid, 70.5, false, byIndex),
  plEn71Cab: M(en71Cab, 71.0, true),
  plEn71Mid: M(en71Mid, 71.2, false, byIndex),
  plEn63hCab: M(impulsCab, 65.3, true),
  plEn63hMid: M(impulsMid, 65.3, false, byIndex),
  plEn81Cab: M(en81Cab, 70.4, true, byIndex),
  plEn90Cab: M(en90Cab, 64.1, true),
  plEn90Mid: M(en90Mid, 64.1, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const EN57_SET = set("Typical: an EN57 three-car electric unit (a judgement: the timetable names no unit; the EN57 is PolRegio's commonest train)",
  ["plEn57Cab", 1], ["plEn57Mid", 1], ["plEn57Cab", 1]);
const EN71_SET = set("Typical: an EN71 four-car electric unit (a judgement: the timetable names no unit)",
  ["plEn71Cab", 1], ["plEn71Mid", 2], ["plEn71Cab", 1]);
const IMPULS_SET = set("Typical: an EN63H Impuls three-section hybrid unit (a judgement: the timetable names no unit; the EN63Hs are Zachodniopomorskie's units)",
  ["plEn63hCab", 1], ["plEn63hMid", 1], ["plEn63hCab", 1]);
const EN81_SET = set("Typical: an EN81 two-car electric unit (a judgement: the timetable names no unit)",
  ["plEn81Cab", 2]);
const EN90_SET = set("Typical: an EN90 Impuls 2 three-section unit (a judgement: the timetable names no unit)",
  ["plEn90Cab", 1], ["plEn90Mid", 1], ["plEn90Cab", 1]);

// The timetable (the Polish Trains GTFS) names no unit, and PolRegio's
// lines are just its categories (poland.py: "R", "K5", "SKA2", "RP", "IR",
// "Os"), so a train is placed by the category in its number ("R 88481",
// "K2/R 123", "SKA2 12", "RP 12201", "IR 10130/1", "Os 5151") and by its
// two ends. Every rule below is a judgement.
//   A train with an end in the Szczecin area (Szczecin, Kołobrzeg, Słupsk,
//     Koszalin, Stargard, Świnoujście, Gryfino, Goleniów, Białogard,
//     Szczecinek): the EN63H Impuls, whose photographed unit is a
//     Zachodniopomorskie one.
//   RP, and trains between Kraków and Kielce, Rzeszów, Tarnów, Nowy
//     Sącz, Sandomierz, Mielec, Dębica or Przemyśl (whatever their
//     category, K-prefixed ones included): the EN71, the longer
//     four-car unit for the longer regional runs.
//   SKA (Kraków's agglomeration trains): the EN90.
//   K (Kraków's other regional trains, K2, K3, K5, K7, K33, K46, K52,
//     K63 and their /R and /P variants): the EN81, the small two-car
//     unit for the branch lines.
//   Everything else, and any train not placed: the EN57.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const SZCZECIN = /^(szczecin|kolobrzeg|slupsk|koszalin|stargard|gryfino|swinoujscie|goleniow|bialogard|szczecinek|kamien pomorski)/;
const KRAKOW = /^krakow/;
const EAST = /^(kielce|rzeszow|tarnow|nowy sacz|sandomierz|mielec|debica|przemysl|jaslo|krosno)/;
export const TYPICAL = {
  polregio: (t = {}) => {
    const num = String(t.number || "").trim().toUpperCase();
    const head = num.split(/\s+/)[0] || String(t.route || t.line || "").trim().toUpperCase();
    const a = fold(t.origin), b = fold(t.destination || t.dest);
    const either = (re) => re.test(a) || re.test(b);
    if (either(SZCZECIN)) return IMPULS_SET;
    if (head === "RP" || head.startsWith("RP/") || head.endsWith("/RP")) return EN71_SET;
    if ((KRAKOW.test(a) && EAST.test(b)) || (KRAKOW.test(b) && EAST.test(a))) return EN71_SET;
    if (head.startsWith("SKA")) return EN90_SET;
    if (head.startsWith("K")) return EN81_SET;
    return EN57_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fEn57 = { model: "EN57", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}Polregio_EN57-2070%2C_Krak%C3%B3w_G%C5%82%C3%B3wny%2C_2024_%2804%29.jpg` };
const fEn71 = { model: "EN71", type: "Electric multiple unit", builder: "Pafawag, Wrocław",
  source: `${CM}EN71-001_na_stacji_Krak%C3%B3w_G%C5%82%C3%B3wny_%282024_r.%29.jpg` };
const fEn63h = { model: "EN63H Impuls (Newag 36WEh)", type: "Hybrid multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}Newag_Impuls_EN63H-009_w_Ko%C5%82obrzegu_%282023%29.jpg` };
const fEn81 = { model: "EN81", type: "Electric multiple unit", builder: "Pesa, Bydgoszcz",
  source: `${CM}EN81-002.jpg` };
const fEn90 = { model: "EN90 (Newag Impuls 2)", type: "Electric multiple unit", builder: "Newag, Nowy Sącz",
  source: `${CM}EN90-006.jpg` };
export const FACTS = {
  plEn57Cab: { ...fEn57,
    about: "An end car of the EN57, Poland's classic three-car electric unit, in PolRegio's modernised red, orange and silver: a rounded cab with one big windshield, the white swoosh behind it and \"POLREGIO\" under the cab window. The unit photographed at Kraków Główny is EN57-2070." },
  plEn57Mid: { ...fEn57,
    about: "The middle car of an EN57; it carries the pantograph. Each car rides on two trucks of its own." },
  plEn71Cab: { ...fEn71,
    about: "An end car of the EN71, the EN57's four-car sister: the same classic body, yellow over blue, a flat three-pane front with the big round headlight on the roof's edge. The unit photographed at Kraków Główny is the first, EN71-001; what its side looks like is read from the EN57 family." },
  plEn71Mid: { ...fEn71,
    about: "A middle car of an EN71; it carries the pantograph." },
  plEn63hCab: { ...fEn63h,
    about: "An end section of Newag's Impuls hybrid, which runs on wire and on its diesel engine away from it: white with a green cab, green and blue pixel blocks, \"HYBRYDA\" and \"Pomorze Zachodnie\" along the side. The unit photographed at Kołobrzeg is EN63H-009; the graffiti on its side is not drawn." },
  plEn63hMid: { ...fEn63h,
    about: "The middle section of an EN63H; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
  plEn81Cab: { ...fEn81,
    about: "One car of the EN81, Pesa's two-car unit for the branch lines: white with a red stripe low on the side and a yellow line over it, sweeping up beside a rounded cab. The unit photographed, EN81-002, is bound for Kraków Główny; the doors' places and roof equipment are a reading." },
  plEn90Cab: { ...fEn90,
    about: "An end section of the EN90, Newag's Impuls 2: white with the windows in a black band, red doors and a dark lower front. The unit photographed at Słupsk is EN90-006; the photograph shows three cars." },
  plEn90Mid: { ...fEn90,
    about: "The middle section of an EN90; the sections share a truck at each joint. Where its pantograph sits is Trainsheet's reading." },
};
