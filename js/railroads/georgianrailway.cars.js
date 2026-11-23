// Georgian Railway's cars (scripts/railroads/georgia.py, agency
// "georgianrailway"): the Tbilisi–Batumi expresses, the locals and the
// two cross-border night trains. Trainsheet's own side views at the
// shared scale (js/carart.js), each drawn from, and checked against, a
// photograph on Wikimedia Commons, named here fleet by fleet. Bodies and
// parts from czechia.cars.js (unit, euroLoco, hvac and the rest) and
// carmodels.js (coachCar); the lettering is drawn here (no logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. None of the
// photographs is a true side view (all nine are front three-quarter
// views), so the windows' spacing, the doors' places, the roof equipment,
// what hangs under the floor and every length are Trainsheet's reading of
// the type, not measurements. The lengths the drawings are scaled to are
// the figures usually published for each class, set down from memory and
// not checked against a source for this file (see MODELS); the fact
// sheets give only the locomotives' and the coach's. The file was
// verified after writing: node --check passes, every consist renders, and
// each drawing was looked at beside its photograph (23 Nov 2026).
//
//   Stadler KISS, Georgian Railway's GRS class: GRS-011 leaving Tbilisi
//     after working a train from Batumi ("Georgian Railway GRS Class at
//     Tbilisi 1.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railway_GRS_Class_at_Tbilisi_1.jpg).
//     A white double-decker, a broad red stripe between the decks, the
//     lower deck's windows in a dark band and the upper deck's set singly
//     in the white, red doors on the cars behind the first, a thin red
//     upright line with the red crosses of the Georgian flag behind the
//     cab, "GR" in red on the side, a black windshield surround, a dark
//     skirt. The photograph looks down the train from ahead: the cars a
//     set (drawn as four), the windows a deck and where the pantograph
//     sits are a reading.
//   ER2: ER2-631 at Tbilisi ("Georgian Railways ER2 Class at Tbilisi.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railways_ER2_Class_at_Tbilisi.jpg)
//     and at Tbilisi Airport ("Georgian Railways ER2 Class at Tbilisi
//     Airport.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railways_ER2_Class_at_Tbilisi_Airport.jpg).
//     The classic flat-fronted unit: white, a red band along the foot of
//     the body, a red plow, a big round headlamp on the cab roof, a pale
//     grey roof. Four cars in the first photograph, and drawn as four.
//     The number ("ერ2-631") and the red bar are on the front face and
//     are not drawn on the side.
//   ER2M: ER2-1011-M at Tbilisi ("Georgian Railways ER2M Class at
//     Tbilisi.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railways_ER2M_Class_at_Tbilisi.jpg).
//     An ER2 with a rebuilt, raked cab: white, a red band under the
//     windows, a pale blue-grey band along the foot of the body, a faded
//     red plow, a grey cab roof with a lamp on it. Drawn as two cars (the
//     photo manifest's count; the photograph itself shows the train from
//     ahead and its far end is not clear).
//   ES: ES 003 at Tbilisi ("Georgian Railway ES Class at Tbilisi 1.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railway_ES_Class_at_Tbilisi_1.jpg).
//     A rebuilt ER2-derived unit with a long raked windshield: white
//     above, a red stripe under the windows, grey below it, a grey roof,
//     a faded red plow, the destination display in a housing on the cab
//     roof, "GR" in red on the nose. Four cars can be made out, and it is
//     drawn as four.
//   VL10 (two sections): VL10-1599 at Zestafoni ("Zestafoni Railway
//     Station - VL10 engines.jpg",
//     https://commons.wikimedia.org/wiki/File:Zestafoni_Railway_Station_-_VL10_engines.jpg)
//     and VL10-1623 near Makhinjauri ("VL10-1623 electric locomotive
//     crossing the Green Cape platform near Makhinjauri.jpg",
//     https://commons.wikimedia.org/wiki/File:VL10-1623_electric_locomotive_crossing_the_Green_Cape_platform_near_Makhinjauri.jpg).
//     Green, darker green along the foot of the body, two orange stripes
//     round the nose and a thin yellow one under the windshields, a grey
//     roof with a big round lamp. The number is on a red plate on the
//     front face and is not drawn on the side.
//   VL11 (two sections): VL11-778 on the sleeper from Baku at Tbilisi
//     ("Georgian Railway VL11 Class at Tbilisi Main Station.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railway_VL11_Class_at_Tbilisi_Main_Station.jpg)
//     and VL11-264A at Gori ("Georgian Railway VL11 Class at Gori.jpg",
//     https://commons.wikimedia.org/wiki/File:Georgian_Railway_VL11_Class_at_Gori.jpg).
//     Red, a pale grey panel with slanted ends on each section's side, a
//     grey band under it, dark grey along the foot of the body, a cream
//     band round the nose and an orange stripe low on it, an olive-grey
//     roof with a big round lamp. The panel's exact outline is a reading.
//   The coach: the coaches behind VL11-778 in the same Tbilisi
//     photograph, the only coaches in the set. Dark green with a cream
//     band round the windows, seen at a steep angle a train's length
//     away: the paint is from the photograph, the windows, doors and
//     length are those of the standard 24.5 m coach.
//
// Not drawn: the Stadler FLIRT. No photograph of one in Georgia was
// found and nothing shows that one runs there, so there is no model. No
// coach has a photograph of its own (see above).
//
// The timetable names no locomotive or unit, so which fleet a train is
// drawn as is a judgement, labeled as typical; see TYPICAL below, where
// each rule is set out and the two that rest on a photograph are named.
// One fleet has no train in the timetable: the VL10 is drawn, with a
// fact sheet, but both loco-hauled pairs are drawn behind the VL11 (the
// locomotive photographed on one of them).

import { coachCar } from "../carmodels.js?v=dev";
import { rect, circle, path, truck, underframe, win } from "../carart.js?v=dev";
import { unit, euroLoco, letters, hvac, buffers } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Stadler KISS (GRS class) ----------
// A double-decker, each car on two trucks of its own; a white cab with a
// black windshield surround, a broad red stripe between the decks, the
// lower windows in a dark band, red doors behind the first car's.
const KS = { white: "#f1f2f3", red: "#c8202c", dark: "#23272c", roof: "#a9aeb3", skirt: "#33373c" };
const KSG = { roof: 15.0, sill: 3.6 };
const NOSE_KS = [[1.3, 3.6], [0.9, 6.0], ["q", 0.8, 7.6, 2.0, 8.6], [5.6, 13.6], ["q", 6.6, 15.0, 9.0, 15.0]];
function kissPaint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 22 : -1;
    let s = bands(L, [[0, 20, KS.white], [14.0, 3, KS.roof], [0, 3.95, KS.skirt]]) +
      // The red stripe between the decks, and the lower deck's dark band.
      rect(a, 9.5, L - a + 1, 1.3, KS.red) + rect(cab ? 23.5 : -1, 6.2, L - (cab ? 23.5 : -1) + 1, 2.9, KS.dark, 0, 'rx="0.3"');
    if (cab) {
      // The thin red upright line behind the cab and the red crosses on it.
      s += rect(17.2, 3.95, 0.45, 10.05, KS.red) +
        rect(16.0, 12.0, 1.9, 0.5, KS.red) + rect(16.7, 11.3, 0.5, 1.9, KS.red) +
        rect(14.4, 5.6, 1.9, 0.5, KS.red) + rect(15.1, 4.9, 0.5, 1.9, KS.red) +
        rect(17.65, 9.5, 4.5, 1.3, KS.red);
    }
    return s;
  };
}
const ksDoor = (x, fill) => ({ x, w: 3.2, y0: KSG.sill, y1: 10.9, leaves: 2, glassY: 0.42, glassH: 0.42, grabs: false, fill });
const ksRows = (xs) => [{ xs, y: 11.3, w: 4.2, h: 2.1, r: 0.35 }, { xs, y: 6.5, w: 4.2, h: 2.3, r: 0.3 }];
const kissCab = (c) => unit(c, { roof: KSG.roof, sill: KSG.sill, nose: NOSE_KS, rake: [[2.0, 8.6], [5.6, 13.6]], depth: 3.2, cabLen: 16, lampY: 5.6, bare: true,
  rows: ksRows(seq(24.5, 5.4, 8)), doors: [ksDoor(19.2, KS.white), ksDoor(c.L - 15.0, KS.red)],
  trucks: [10.0, c.L - 10.0], wheel: 36, paint: kissPaint(true), surround: "#14171b",
  // The cab's side window.
  cab: () => path("M9.6 9.0L13.2 9.0L13.2 11.8L11.4 11.8Q10.2 10.6 9.6 9.0Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 26.5, 4.6, 1.1, "GR", KS.red, { weight: 800 }) +
    hvac(26, KSG.roof, 12, 0.5) + hvac(g.L - 24, KSG.roof, 12, 0.5) });
const kissMid = (c) => unit(c, { roof: KSG.roof, sill: KSG.sill,
  rows: ksRows(seq(14.0, 5.4, 11)), doors: [ksDoor(8.0, KS.red), ksDoor(c.L - 11.2, KS.red)],
  trucks: [10.0, c.L - 10.0], wheel: 36, paint: kissPaint(false),
  // A pantograph on the second car (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(10, KSG.roof, 12, 0.5) + hvac(g.L - 24, KSG.roof, 12, 0.5) });

// ---------- The regional EMUs: ER2, ER2M, ES ----------
// The 19.6 m car with a door at each quarter and many small windows. The
// windows are placed to clear the doors (the doors are drawn over the
// paint, and a window behind one would show through it).
const emuDoor = (x, fill) => ({ x, w: 3.2, y0: 3.6, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill });
const emuWin = (xs) => ({ xs, y: 7.6, w: 2.4, h: 2.8, r: 0.3 });
const WIN_MID = [5.0, 8.4, 19.0, 22.4, 25.8, 29.2, 32.6, 36.0, 39.4, 42.8, 52.0, 55.4, 58.8];
const WIN_FLAT = [...seq(16.5, 3.4, 8), 52.0, 55.4, 58.8];
const WIN_RAKED = [...seq(21.0, 3.4, 7), 52.0, 55.4, 58.8];
const EMG = { roof: 13.2, sill: 3.6 };

// ER2: white, a red band along the foot of the body, a red plow, a big
// round headlamp on the cab roof.
const E2 = { white: "#eeede8", red: "#c44a4f", roof: "#cfd1cf", skirt: "#3a3d42" };
const NOSE_E2 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.2, 2.8, 13.2]];
function er2Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, E2.white], [12.35, 3, E2.roof], [0, 3.6, E2.skirt]]) + rect(-1, 3.6, L + 2, 1.7, E2.red);
    if (cab) s += rect(-1, 0, 7, 3.6, E2.red);
    return s;
  };
}
const er2Cab = (c) => unit(c, { roof: EMG.roof, sill: EMG.sill, nose: NOSE_E2, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 8, lampY: 6.2, bare: true,
  rows: [emuWin(WIN_FLAT)], doors: [emuDoor(11.5, E2.white), emuDoor(47, E2.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: er2Paint(true), surround: "#1d2026",
  // The big round headlamp on the cab roof, and the cab's side window.
  cab: () => circle(3.4, 13.55, 0.95, "#d9d6cc", 0.4) + circle(3.4, 13.55, 0.55, "#fff4cf", 0.3) +
    path("M4.6 8.4L7.6 8.4L7.6 11.0L4.6 11.0Z", "#1d2026", 0.4),
  extra: (cc, g) => boxes(16, g.L - 16, EMG.sill, 3, 1.2) });
const er2Mid = (c) => unit(c, { roof: EMG.roof, sill: EMG.sill,
  rows: [emuWin(WIN_MID)], doors: [emuDoor(14, E2.white), emuDoor(47, E2.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: er2Paint(false),
  // A pantograph on the second car (as in the Tbilisi photograph).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => boxes(16, g.L - 16, EMG.sill, 3, 1.2) });

// ER2M: the rebuilt raked cab; white, a red band under the windows, a
// pale blue-grey band along the foot of the body, a faded red plow, a
// grey cab roof with a lamp on it.
const E2M = { white: "#efeee9", red: "#b8323a", pale: "#c5d0d6", plow: "#d9788a", roof: "#aab0b6", skirt: "#3a3d42" };
const NOSE_E2M = [[0.9, 3.6], [0.6, 6.0], ["q", 0.5, 8.0, 1.8, 8.6], [6.4, 12.2], ["q", 7.4, 13.2, 9.4, 13.2]];
function er2mPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, E2M.white], [12.35, 3, E2M.roof], [0, 3.6, E2M.skirt]]) +
    rect(-1, 3.6, L + 2, 1.3, E2M.pale) + rect(11.5, 5.7, L - 10.5, 1.3, E2M.red) +
    rect(11.5, 5.5, L - 10.5, 0.12, E2M.red) + rect(11.5, 7.1, L - 10.5, 0.12, E2M.red) +
    rect(-1, 0, 7, 3.6, E2M.plow);
}
const er2mCab = (c) => unit(c, { roof: EMG.roof, sill: EMG.sill, nose: NOSE_E2M, rake: [[1.8, 8.6], [6.4, 12.2]], depth: 3.0, cabLen: 12, lampY: 6.3, bare: true,
  rows: [emuWin(WIN_RAKED)], doors: [emuDoor(15.5, E2M.white), emuDoor(47, E2M.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: er2mPaint, surround: "#1d2026",
  // The lamp on the cab roof, and the cab's side window.
  cab: () => rect(7.6, 13.15, 1.5, 0.95, "#c9ced3", 0.4, 'rx="0.4"') + circle(7.7, 13.65, 0.4, "#fff4cf", 0.3) +
    path("M8.6 8.6L12.4 8.6L12.4 11.4L10.6 11.4Q9.4 10.2 8.6 8.6Z", "#1d2026", 0.4),
  // The pantograph on the second car (as in the photograph).
  pan: c.index === 1 ? c.L / 2 : null,
  extra: (cc, g) => boxes(16, g.L - 16, EMG.sill, 3, 1.2) });

// ES: a long raked windshield under a grey roof, the destination display
// in a housing on the cab roof; white above a red stripe, grey below it,
// a faded red plow, "GR" in red on the nose.
const ES = { white: "#ecebe7", red: "#cf4a55", grey: "#8d949b", plow: "#c7545c", roof: "#9aa1a8", skirt: "#3a3d42" };
const NOSE_ES = [[1.0, 3.6], [0.6, 5.6], ["q", 0.5, 7.4, 2.0, 8.0], [8.4, 12.2], ["q", 9.6, 13.2, 11.8, 13.2]];
function esPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, ES.white], [12.35, 3, ES.roof], [0, 3.6, ES.skirt]]) +
      rect(-1, 3.6, L + 2, 2.3, ES.grey) + rect(-1, 5.9, L + 2, 0.95, ES.red);
    if (cab) s += rect(-1, 0, 8, 3.6, ES.plow);
    return s;
  };
}
const esCab = (c) => unit(c, { roof: EMG.roof, sill: EMG.sill, nose: NOSE_ES, rake: [[2.0, 8.0], [8.4, 12.2]], depth: 3.2, cabLen: 14, lampY: 6.3, bare: true,
  rows: [emuWin(WIN_RAKED)], doors: [emuDoor(15.8, ES.white), emuDoor(47, ES.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: esPaint(true), surround: "#1d2026",
  // The destination display's housing on the cab roof, and the cab's
  // side window.
  cab: () => path("M10.2 13.15L10.8 14.3L13.6 14.3L14.2 13.15Z", "#b9ada0", 0.4) + rect(11.3, 13.45, 1.6, 0.55, "#f39a26", 0, 'opacity="0.9"') +
    path("M10.8 8.4L13.8 8.4L13.8 11.4L12.6 11.4Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 6.4, 7.0, 0.85, "GR", ES.red, { weight: 800, style: "italic" }) +
    boxes(16, g.L - 16, EMG.sill, 3, 1.2) });
const esMid = (c) => unit(c, { roof: EMG.roof, sill: EMG.sill,
  rows: [emuWin(WIN_MID)], doors: [emuDoor(14, ES.white), emuDoor(47, ES.white)],
  trucks: [10.0, c.L - 10.0], wheel: 33, paint: esPaint(false),
  // A pantograph on the second car (as in the photograph).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => boxes(16, g.L - 16, EMG.sill, 3, 1.2) });

// ---------- The locomotives ----------
// Both are two-section locomotives, drawn as one body with a cab at each
// end; euroLoco draws two trucks, and the inner two bogies are added in
// `over`, so each section rides on two bogies. The paint is drawn for
// the whole length, the same about the middle.
const NOSE_VL = [[1.5, 4.1], [1.2, 7.0], ["q", 1.2, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
const both = (L, f) => f((x) => x) + f((x) => L - x);
const roofLamp = (L) => [4.6, L - 4.6].map((x) => circle(x, 13.45, 0.9, "#8b8f86", 0.4) + circle(x, 13.45, 0.52, "#fff4cf", 0.3)).join("");

// VL10: green, darker along the foot of the body, two orange stripes
// round the nose and a thin yellow one under the windshields.
const V10 = { green: "#2f8a4b", deep: "#1f5c36", orange: "#f2651d", yellow: "#e8b83a", roof: "#a3a8a4", skirt: "#1c1e20" };
function vl10Paint(c, L) {
  let s = bands(L, [[0, 20, V10.green], [12.25, 3, V10.roof], [0, 6.0, V10.deep], [0, 4.1, V10.skirt]]);
  for (const x of [-1, L - 9]) s += rect(x, 6.6, 10, 0.9, V10.orange) + rect(x, 4.5, 10, 0.9, V10.orange) + rect(x, 9.05, 10, 0.28, V10.yellow);
  for (const y of [7.9, 10.6, 11.6]) s += rect(-1, y, L + 2, 0.12, "rgba(0,0,0,0.22)");
  return s;
}
const vl10 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_VL, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 82, wheel: 49, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: vl10Paint,
  grilles: [[-38, 16, 6.5, 8.5], [22, 16, 6.5, 8.5]], grilleFill: "rgba(20,22,25,0.3)",
  over: (cc, L) => truck(44, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) + truck(L - 44, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) +
    roofLamp(L) + [23, 33, 43, L - 45, L - 35, L - 25].map((x) => win(x, 10.9, 2.0, 1.2, 0.25)).join("") });

// VL11: red, a pale grey panel with slanted ends on each section's side
// over a grey band, dark grey along the foot of the body, a cream band
// round the nose and an orange stripe low on it.
const V11 = { red: "#c9463f", pale: "#d9d8d2", grey: "#8f9498", deep: "#3d4145", cream: "#d8d2bd", orange: "#f2731d", roof: "#7d7f6f", skirt: "#1c1e20" };
function vl11Paint(c, L) {
  let s = bands(L, [[0, 20, V11.red], [12.25, 3, V11.roof], [0, 6.3, V11.deep], [0, 4.1, V11.skirt]]);
  s += both(L, (X) => {
    const P = (pts) => path("M" + pts.map(([x, y]) => `${X(x)} ${y}`).join("L") + "Z", V11.pale);
    return P([[14.5, 7.5], [19.5, 11.9], [L / 2 - 8.5, 11.9], [L / 2 - 5.5, 7.5]]) +
      path(`M${X(13.2)} 6.3L${X(14.5)} 7.5L${X(L / 2 - 5.5)} 7.5L${X(L / 2 - 4.7)} 6.3Z`, V11.grey) +
      rect(Math.min(X(-1), X(12)), 6.3, 13, 0.85, V11.cream) + rect(Math.min(X(-1), X(10)), 4.6, 11, 0.9, V11.orange);
  });
  return s;
}
const vl11 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_VL, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 82, wheel: 49, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: vl11Paint, grilles: [],
  over: (cc, L) => truck(44, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) + truck(L - 44, { wb: 8.5, d: 49, kind: "loco", top: 4.1 }) +
    roofLamp(L) + [26, 36, L - 38, L - 28].map((x) => circle(x + 0.8, 10.3, 0.75, "#2a2f36", 0.3)).join("") });

// ---------- The coach ----------
// The standard 24.5 m coach on two trucks 19 m apart, a door at each
// end, eleven windows between; dark green with a cream band round the
// windows, as the coaches behind VL11-778.
const CO = { green: "#2c5a3c", cream: "#e3dcb4", roof: "#6f756f", skirt: "#2a2d31" };
function coach(c) {
  const L = c.L;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base: CO.green, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, CO.roof], [6.9, 4.3, CO.cream], [0, 4.25, CO.skirt]]),
    extra: () => buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
}

// ---------- Tables ----------

export const TYPES = {
  geKissCab: { name: "Stadler KISS (GRS class) end car", kind: "emu" },
  geKissMid: { name: "Stadler KISS (GRS class) intermediate car", kind: "emu" },
  geEr2Cab: { name: "ER2 end car", kind: "emu" },
  geEr2Mid: { name: "ER2 intermediate car", kind: "emu" },
  geEr2mCab: { name: "ER2M car", kind: "emu" },
  geEsCab: { name: "ES class end car", kind: "emu" },
  geEsMid: { name: "ES class intermediate car", kind: "emu" },
  geVl10: { name: "VL10 electric locomotive", kind: "electric" },
  geVl11: { name: "VL11 electric locomotive", kind: "electric" },
  geCoach: { name: "Georgian Railway coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the KISS about 26.5 m a
// car; the ER2, ER2M and ES 19.6 m a car; the VL10 32.84 m; the VL11
// about 33 m; the coach 24.5 m.
export const MODELS = {
  geKissCab: M(kissCab, 86.9, true),
  geKissMid: M(kissMid, 86.9, false, byIndex),
  geEr2Cab: M(er2Cab, 64.3, true),
  geEr2Mid: M(er2Mid, 64.3, false, byIndex),
  geEr2mCab: M(er2mCab, 64.3, true, byIndex),
  geEsCab: M(esCab, 64.3, true),
  geEsMid: M(esMid, 64.3, false, byIndex),
  geVl10: M(vl10, 107.7),
  geVl11: M(vl11, 108.3),
  geCoach: M(coach, 80.4),
};

const set = (label, ...units) => ({ label, units });
const KISS_SET = set("Typical: a four-car Stadler KISS (GRS class) double-deck set (the fleet photographed on a Batumi train at Tbilisi; the timetable names no unit, and the four cars are a reading)",
  ["geKissCab", 1], ["geKissMid", 2], ["geKissCab", 1]);
const ER2_SET = set("Typical: a four-car ER2 electric unit (a judgement: the timetable names no unit)",
  ["geEr2Cab", 1], ["geEr2Mid", 2], ["geEr2Cab", 1]);
const ER2M_SET = set("Typical: a two-car ER2M electric unit (a judgement: the timetable names no unit)",
  ["geEr2mCab", 2]);
const ES_SET = set("Typical: a four-car ES class electric unit (a judgement: the timetable names no unit)",
  ["geEsCab", 1], ["geEsMid", 2], ["geEsCab", 1]);
const BAKU_SET = set("Typical: a VL11 electric locomotive and six coaches (the locomotive photographed on the Baku sleeper at Tbilisi; the six coaches are a reading)",
  ["geVl11", 1], ["geCoach", 6]);
const YEREVAN_SET = set("Typical: a VL11 electric locomotive and six coaches (a judgement: the timetable names no locomotive, and this one is drawn as the Baku sleeper is)",
  ["geVl11", 1], ["geCoach", 6]);

// The timetable (the jbb.ghsq.de GTFS) names no locomotive or unit, so a
// train is placed by its number, and a line's page (which has no number)
// by its two ends. Two rules rest on a photograph; every other one, and
// so every local's fleet, is a judgement.
//   801–804, 853/854, 869/870, 873/874 (Tbilisi to Batumi, Ozurgeti,
//     Zugdidi and Poti): the Stadler KISS. GRS-011 was photographed at
//     Tbilisi off a train from Batumi; that the Ozurgeti, Zugdidi and
//     Poti pairs are KISS too is the photo manifest's mapping.
//   37/38 (Tbilisi–Baku): a VL11 and the green-and-cream coaches, as
//     VL11-778 was photographed on the sleeper from Baku.
//   371/372 (Tbilisi–Yerevan): drawn the same, a judgement; no photograph
//     of the Yerevan train is in the set.
//   6413–6416 (Tbilisi–Gardabani) and 681–684 (Batumi–Kutaisi): the ER2,
//     the plain regional unit. (ER2-631 stands at Tbilisi under a
//     departure board listing 6416, but nothing says it worked it.)
//   617/618, 685/686 (Tbilisi–Borjomi): the ES, a judgement: the longest
//     of the locals goes to the rebuilt unit.
//   6417/6418, 6445/6446 (Khashuri–Zestafoni) and 633/634
//     (Kutaisi–Sachkhere): the two-car ER2M, a judgement: the short
//     branch and shuttle workings go to the short set.
//   Any train not placed: the ER2.
const ends = (t) => `${t.origin || ""} ${t.destination || t.dest || ""} ${t.route || t.line || ""}`.toLowerCase();
const num = (t) => parseInt(String(t.number || "").trim(), 10);
export const TYPICAL = {
  georgianrailway: (t = {}) => {
    const k = num(t), e = ends(t);
    if (k) {
      if ((k >= 801 && k <= 804) || [853, 854, 869, 870, 873, 874].includes(k)) return KISS_SET;
      if (k === 37 || k === 38) return BAKU_SET;
      if (k === 371 || k === 372) return YEREVAN_SET;
      if ([617, 618, 685, 686].includes(k)) return ES_SET;
      if ([6417, 6418, 6445, 6446, 633, 634].includes(k)) return ER2M_SET;
      if ((k >= 6413 && k <= 6416) || (k >= 681 && k <= 684)) return ER2_SET;
    }
    if (/bak[ıi]|baku/.test(e)) return BAKU_SET;
    if (/yerevan/.test(e)) return YEREVAN_SET;
    if (/tbilisi/.test(e) && /(batumi|ozurgeti|zugdidi|poti)/.test(e)) return KISS_SET;
    if (/borjomi/.test(e)) return ES_SET;
    if (/sachkhere/.test(e) || (/khashuri/.test(e) && /zestafoni/.test(e))) return ER2M_SET;
    return ER2_SET;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from
// memory; figures Trainsheet could not stand behind are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fKiss = { model: "Stadler KISS (GRS class)", type: "Double-deck electric multiple unit", builder: "Stadler Rail",
  source: `${CM}Georgian_Railway_GRS_Class_at_Tbilisi_1.jpg` };
const fEr2 = { model: "ER2", type: "Electric multiple unit", builder: "Rīgas Vagonbūves Rūpnīca (RVR)",
  source: `${CM}Georgian_Railways_ER2_Class_at_Tbilisi.jpg` };
const fEr2m = { model: "ER2M", type: "Electric multiple unit (rebuilt ER2)",
  source: `${CM}Georgian_Railways_ER2M_Class_at_Tbilisi.jpg` };
const fEs = { model: "ES class", type: "Electric multiple unit (rebuilt, ER2-derived)",
  source: `${CM}Georgian_Railway_ES_Class_at_Tbilisi_1.jpg` };
const fVl10 = { model: "VL10", type: "Electric locomotive", builder: "Tbilisi Electric Locomotive Works", lengthFt: 107.7,
  source: `${CM}VL10-1623_electric_locomotive_crossing_the_Green_Cape_platform_near_Makhinjauri.jpg` };
const fVl11 = { model: "VL11", type: "Electric locomotive", builder: "Tbilisi Electric Locomotive Works", lengthFt: 108.3,
  source: `${CM}Georgian_Railway_VL11_Class_at_Tbilisi_Main_Station.jpg` };
const fCoach = { model: "Georgian Railway coach", type: "Locomotive-hauled passenger coach", lengthFt: 80.4,
  source: `${CM}Georgian_Railway_VL11_Class_at_Tbilisi_Main_Station.jpg` };
export const FACTS = {
  geKissCab: { ...fKiss,
    about: "An end car of the Stadler KISS, Georgian Railway's GRS class, the double-decker of the Tbilisi–Batumi expresses: white with a broad red stripe between the decks, the red crosses of the Georgian flag behind the cab and \"GR\" in red. The set photographed leaving Tbilisi after a run from Batumi is GRS-011; the four cars drawn are a reading." },
  geKissMid: { ...fKiss,
    about: "An intermediate car of a Stadler KISS (GRS class), with windows on both decks and red doors. The photograph looks down the train from ahead, so the windows a deck and where the pantograph sits are Trainsheet's reading." },
  geEr2Cab: { ...fEr2,
    about: "An end car of the ER2, the classic flat-fronted regional unit: white with a red band along the foot of the body, a red plow and a big round headlamp on the cab roof. The unit photographed at Tbilisi and at Tbilisi Airport is ER2-631; its number is on the front face and is not drawn on the side." },
  geEr2Mid: { ...fEr2,
    about: "An intermediate car of an ER2. The set photographed at Tbilisi has four cars, with the pantograph on the second." },
  geEr2mCab: { ...fEr2m,
    about: "A car of the ER2M, an ER2 with a rebuilt, raked cab, drawn as a two-car set: white with a red band under the windows, a pale blue-grey band along the foot of the body and a faded red plow. The unit photographed at Tbilisi is ER2-1011-M." },
  geEsCab: { ...fEs,
    about: "An end car of the ES class, a rebuilt ER2-derived unit with a long raked windshield and the destination display in a housing on the cab roof: white above a red stripe, grey below it, \"GR\" in red on the nose. The unit photographed at Tbilisi is ES 003." },
  geEsMid: { ...fEs,
    about: "An intermediate car of an ES class unit, white above a red stripe and grey below it. Four cars can be made out in the photograph of ES 003 at Tbilisi." },
  geVl10: { ...fVl10,
    about: "The VL10, the two-section DC electric locomotive built in Tbilisi: green, darker along the foot of the body, with orange stripes round the nose. Those photographed are VL10-1623 near Makhinjauri and VL10-1599 at Zestafoni. No train in the timetable is drawn behind one: both loco-hauled pairs are drawn behind the VL11." },
  geVl11: { ...fVl11,
    about: "The VL11, the two-section DC electric locomotive of Georgian Railway's loco-hauled trains: red with a pale grey panel on each section's side, a cream band round the nose and an orange stripe low on it. The one photographed at Tbilisi, on the sleeper from Baku, is VL11-778; VL11-264A was photographed at Gori. The panel's exact outline is a reading." },
  geCoach: { ...fCoach,
    about: "A Georgian Railway coach: dark green with a cream band round the windows, as the coaches behind VL11-778 on the sleeper from Baku at Tbilisi, the only coaches in the photographs. They are seen at a steep angle a train's length away, so the windows, doors and length are those of the standard 24.5 m coach." },
};
