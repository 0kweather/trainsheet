// HŽ Putnički prijevoz's cars (scripts/railroads/croatia.py): Croatia's
// national passenger railroad. Trainsheet's own side views at the shared
// scale (js/carart.js), each drawn from, and checked against, one
// photograph on Wikimedia Commons, named here fleet by fleet. Bodies and
// parts from czechia.cars.js and carmodels.js; HŽ's roundel and the
// lettering are drawn here (no logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. All but one
// of the photographs are three-quarter views from the front, so the
// windows' spacing behind the first door, the roof equipment, what hangs
// under the floor and every length are Trainsheet's reading of the type,
// not measurements: the lengths are the figures usually published for each
// class, set down from memory and not checked against a source for this
// file, so the fact sheets below give none but the 1141's, which is
// painted on its side. The file was verified after writing: node --check
// passes, every consist renders, and each drawing was looked at beside
// its photograph (22 Nov 2026).
//
//   7123, the tilting train (Bombardier RegioSwinger, two cars): 7123 005
//     showing "Zagreb Glavni kol." ("HŽ 7123 series DMU (04).JPG"). White,
//     a yellow frame round the windshield, a dark gray skirt, a crimson
//     line sweeping up from the skirt behind the cab to run under the
//     windows and another sweeping down from the roof to run over them, a
//     yellow line under that one along first class. These are the ICN
//     (InterCity Nagibni) trains between Zagreb and Split. Press and blog
//     reports late in 2026 say HŽPP's new Končar 7024 electro-diesel units
//     are taking the ICN trains over; there is no photograph of a 7024 in
//     this set, so the 7123 is drawn, as photographed.
//   7122, the railcar bought from Sweden (SJ's Y1, by Fiat): 7122 010 at
//     Pula ("7122 series train (12).JPG"). Orange, a black roof and
//     underframe, a white 2 by the door; HŽ's white roundel is on the
//     front, out of a side view. (The graffiti is not drawn.)
//   6112, Končar's low-floor electric unit (four sections): 6112 001 at a
//     trade fair ("HZ 6112 001-0 1.jpg"). White, a dark gray roof, the
//     windows in a black band over a silver one, a red stripe between
//     white lines under that, a yellow frame round the windshield, yellow
//     lamp pods and a yellow plow, a short yellow line over first class.
//   6111, Ganz-MÁVAG's electric unit (three cars): 6111 019 at Zagreb
//     Glavni kolodvor ("HŽ 6111 serie.jpg"). Blue from the waist to the
//     roof's edge, white below with a thin blue line near the bottom; the
//     front white round the windshields, blue across the lamps.
//   7023, Končar's diesel unit (three sections), the 6112's body: 7023 001
//     at Zagreb Glavni kolodvor in 2020 ("DMU 7023 at Zagreb Central
//     Station, 2020.jpg"). White, the windows in a black band, a broad red
//     band under them and a thin red line over a yellow one above them,
//     each ending in a red ring behind the cab; "HŽPP" on the nose.
//   7022, TŽV Gredelj's diesel unit, the only one built: at Zagreb Glavni
//     kolodvor showing "Moravice" ("C00 542 Bf Zagreb Gl. K., 7022.jpg").
//     Silver in panels, a red cap round the windshield, the windows in a
//     black band outlined in red, red doors, a yellow plow. The photograph
//     shows two gangway joints, so it is drawn in three sections.
//   1141, the electric locomotive: 1141 388 at Rijeka, the one true side
//     view ("HŽ 1141 388-4 at Rijeka Station (side view).jpg"), from which
//     its doors, round windows, louvers and stripes are placed: HŽPP's
//     blue, white "circuit" lines ending in rings, "HŽ PUTNIČKI PRIJEVOZ",
//     a dark gray frame. Its two cabs differ, as photographed.
//   1142, the electric locomotive: 1142 011 at Zagreb ("HŽ 1142 series
//     locomotive (01).JPG"). Orange-yellow over red over dark red, a white
//     line at the waist and another over the frame, a white cap over the
//     windshields, a dark red roof edge with louvers, oval windows. Where
//     the ovals and the doors sit along the side is read from a
//     three-quarter view.
//   The coach: an HŽ first-class car at Budapest Keleti ("Carrozza
//     Hrvatske željeznice.jpg"). Light gray through the windows, a yellow
//     line over them, white below with a red stripe and a thin gray line,
//     HŽ's roundel in gray. (The coaches behind 1142 011 in its photograph
//     are in an older blue and gray; the gray one is drawn.)
// HŽ 2041, the red diesel in the set's tenth photograph, is a freight and
// shunting locomotive and is not drawn.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each guess is
// marked.

import { newId, bilevel, coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, door, truck, pantograph, slats, underframe } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine, exhaust, tank, buffers } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// HŽ's roundel, drawn here: the two letters in a ring.
const hzRing = (c, x, y, r, color) => mark(c, x, y, `<circle cx="0" cy="0" r="${n(r)}" fill="none" stroke="${color}" stroke-width="${n(r * 0.14)}"/>` +
  `<text x="0" y="${n(r * 0.36)}" font-size="${n(r * 1.05)}" text-anchor="middle" font-weight="800" font-family="${FONT}" fill="${color}">HŽ</text>`);
// A ring, as the ends of HŽPP's "circuit" lines.
const ring = (x, y, r, fill, hole) => circle(x, y, r, fill) + circle(x, y, r * 0.48, hole);

// ---------- 7123: the tilting train ----------
// Two cars, each on two trucks of its own, a cab at each outer end: a flat
// raked front, the windshield and the destination display in one black
// panel framed in yellow; a tall cab side window; a single plug door behind
// first class's two windows and another at the car's inner end.
const SW = { white: "#f2f2f0", roof: "#b3b8bd", skirt: "#565b61", pink: "#d2365c", yellow: "#f0d43a", door: "#e4e5e4", black: "#16181b" };
const SWG = { roof: 13.2, sill: 3.6 };
const NOSE_SW = [[1.0, 2.5], [0.8, 5.2], ["q", 0.8, 6.0, 1.2, 6.8], [3.6, 12.2], ["q", 4.1, 13.2, 5.8, 13.2]];
function swingerPaint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, SW.white], [12.75, 3, SW.roof], [0, 3.9, SW.skirt]]) +
    // The yellow round the windshield, and over the cab's roof.
    path("M-1 5.9L4.3 5.9L7.3 12.75L8.8 12.75L8.8 20L-1 20Z", SW.yellow) +
    // The lower line: thick where it leaves the skirt behind the cab,
    // curving up and thinning to run under the windows.
    path(`M9.4 3.9Q10.6 6.55 17 6.55L${L + 1} 6.55L${L + 1} 6.2L18.5 6.2Q13.2 6.1 12.0 3.9Z`, SW.pink) +
    // The upper line: down from the roof behind the cab, then over the
    // windows; first class's yellow under it, as far as the first door.
    path(`M9.6 12.75Q12.4 11.15 18.5 11.15L${L + 1} 11.15L${L + 1} 10.9L18.5 10.9Q13.6 10.9 11.4 12.75Z`, SW.pink) +
    (c.index === 0 ? rect(11.6, 10.58, 21.4, 0.3, SW.yellow) : "");
}
const swDoor = (x) => ({ x, w: 3.0, y0: SWG.sill, y1: 10.6, leaves: 1, glassY: 0.5, glassH: 0.36, grabs: false, fill: SW.door });
const swinger = (c) => unit(c, { roof: SWG.roof, sill: SWG.sill, nose: NOSE_SW, rake: [[1.2, 6.8], [3.6, 12.2]], depth: 2.4, cabLen: 12, lampY: 4.5,
  rows: [{ xs: [14.2, 20.2], y: 7.0, w: 5.0, h: 3.3, r: 0.4 }, { xs: [31.6], y: 7.3, w: 2.0, h: 2.7, r: 0.3 }, { xs: seq(35.2, 6.2, 6), y: 7.0, w: 5.0, h: 3.3, r: 0.4 }],
  doors: [swDoor(27.2), swDoor(c.L - 8.4)], trucks: [12.6, c.L - 13.6], wheel: 35, paint: swingerPaint, surround: SW.black,
  // The cab's side window: upright at the back, raked like the front.
  cab: () => path("M7.4 6.9L10.9 6.9L10.9 10.8L9.3 10.8Z", "#1d2026", 0.4),
  extra: (cc, g) => hzRing(cc, 22.6, 5.0, 0.55, "#3a3d42") + (c.index === 0 ? letters(cc, 19.7, 8.9, 1.0, "1", "#3a3d42", { weight: 500 }) : "") +
    // Roof: the cooling housing behind the cab, the exhaust, air
    // conditioning aft. Under the floor: the engine and the fuel tank.
    hvac(13, SWG.roof, 13, 0.8) + exhaust(29, SWG.roof) + hvac(45, SWG.roof, 12, 0.6) +
    boxes(19, 34, SWG.sill, 2, 1.3) + tank(38, 47, SWG.sill, 1.5) + boxes(49, g.L - 19, SWG.sill, 2, 1.1) });

// ---------- 7122: the Swedish railcar ----------
// One car on two trucks, a cab at each end: a flat front with two big
// windshield panes, buffers, the headlights in a pod on the roof's edge; a
// two-leaf door behind each cab, its leaves' windows tall and narrow; four
// wide windows, then two narrow ones, each side of the middle.
const Y1 = { orange: "#ee7b1e", roof: "#2b2a29", frame: "#232425", line: "#f1efe9" };
const Y1G = { roof: 12.5, sill: 3.7 };
const NOSE_Y1 = [[0.9, 3.7], [0.75, 11.4], ["q", 0.8, 12.5, 2.4, 12.5]];
const y1Half = (h) => unit(h, { roof: Y1G.roof, sill: Y1G.sill, nose: NOSE_Y1, rake: [[0.82, 7.5], [0.78, 10.7]], depth: 0.45, cabLen: 0.5, lampY: 5.0, coupler: "buffers",
  rows: [{ xs: [3.0], y: 7.4, w: 2.7, h: 3.2, r: 0.3 }, { xs: seq(13.4, 5.35, 4), y: 7.5, w: 4.4, h: 3.0, r: 0.35 }, { xs: [35.2, 37.6], y: 7.5, w: 1.5, h: 3.0, r: 0.3 }],
  doors: [{ x: 7.3, w: 4.2, y0: Y1G.sill, y1: 11.1, leaves: 2, glassY: 0.36, glassH: 0.5, grabs: false, fill: Y1.orange }],
  trucks: [13.6], wheel: 33, diaphragm: [4.2, 10.6], surround: "#1d2026",
  paint: (c, g) => bands(g.L, [[0, 20, Y1.orange], [11.75, 3, Y1.roof], [0, 4.25, Y1.frame], [4.25, 0.12, Y1.line]]),
  // The headlight pod on the roof's edge; the engines and tanks under the
  // floor; a roof vent.
  extra: (cc, g) => rect(0.7, 11.9, 1.5, 0.95, Y1.roof, 0.35, 'rx="0.3"') + rect(0.62, 12.1, 0.4, 0.5, "#fff4cf", 0.3, 'rx="0.15"') +
    boxes(19.5, 30, Y1G.sill, 2, 1.5) + tank(31, 39, Y1G.sill, 1.7) + rect(20, Y1G.roof - 0.05, 6, 0.5, C.steelDark, 0.4, 'rx="0.25"') });
function y1(c) {
  const L = c.L, h = (cc) => y1Half(cc);
  const id = newId();
  // Drawn once with its cab on the left, then that half again mirrored.
  const half = h({ ...c, cabL: true, cabR: false, coupledL: false, coupledR: false });
  return `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(L / 2 + 5.3)}" height="30"/></clipPath>` +
    `<g clip-path="url(#${id})">${half}</g><g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${half}</g></g>` +
    exhaust(L / 2 - 1.2, Y1G.roof) + letters(c, 12.35, 9.3, 1.3, "2", "#ffffff", { weight: 600 }) + letters(c, L - 12.35, 9.3, 1.3, "2", "#ffffff", { weight: 600 });
}

// ---------- Končar's low-floor units: 6112 (electric), 7023 (diesel) ----------
// One body for both: articulated sections sharing a truck at each joint, a
// truck of its own under each cab; a long rounded nose under a deep
// windshield, buffers and a plow; the floor low between the trucks, double
// plug doors, the windows in one black band whose front end is the cab's
// rounded side window.
const KG = { roof: 13.7, sill: 3.4, low: 2.2, band: [6.8, 4.5] };
const NOSE_K = [[1.6, 2.5], [0.8, 4.3], ["q", 0.6, 6.3, 2.4, 7.7], [7.4, 12.5], ["q", 8.8, 13.7, 11.6, 13.7]];
const K = { white: "#f3f4f4", roof: "#4c5056", band: "#1c1f23", silver: "#a7acb2", skirt: "#8e949a", red: "#d6202b", yellow: "#f5d000", door: "#b9bec4", navy: "#1f2b4d" };
// The yellow frame round the windshield (the black panel is drawn over it)
// and the lamp pod; the plow under the nose.
const kFront = () => path("M1.6 7.1L8.2 13.2L12.4 13.2L5.6 6.5Z", K.yellow) + path("M1.3 5.2Q2.6 6.0 4.4 5.5Q3.4 4.7 1.3 4.8Z", K.yellow);
const kPlow = (fill = K.yellow) => path(poly([[1.3, 2.5], [6.4, 2.5], [6.0, 0.8], [1.9, 0.6]]), fill, 0.4);
// The window band: black from the cab's side window back, its front end
// rounded.
const kBand = (L, x) => path(`M${x + 2.6} ${KG.band[0]}Q${x} ${KG.band[0] + 0.3} ${x + 0.6} ${KG.band[0] + 2.6}Q${x + 1.2} ${KG.band[0] + KG.band[1]} ${x + 4} ${KG.band[0] + KG.band[1]}L${L + 1} ${KG.band[0] + KG.band[1]}L${L + 1} ${KG.band[0]}Z`, K.band);
const kDoor = (x, fill) => ({ x, w: 4.5, y0: KG.low, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill });
const kWin = (xs, w = 5.2) => ({ xs, y: 7.3, w, h: 3.6, r: 0.4 });
// 6112: white; the black window band over a silver one; under that a red
// stripe between white lines; a gray skirt; the roof dark gray.
function emuPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, K.white], [13.05, 3, K.roof]]) + (cab ? kBand(L, 9.6) : rect(-1, KG.band[0], L + 2, KG.band[1], K.band)) +
      rect(cab ? 17.5 : -1, 5.45, L + 2, 1.35, K.silver) + (cab ? path("M17.6 5.45Q14.2 6.0 14.0 6.8L17.6 6.8Z", K.silver) : "") +
      rect(cab ? 14.5 : -1, 4.45, L + 2, 0.62, K.red) + rect(cab ? 13.2 : -1, 0, L + 2, 4.05, K.skirt) +
      // First class's short yellow line over the door behind the cab.
      (cab && c.index === 0 ? rect(19.5, 11.75, 10, 0.32, K.yellow) : "") + (cab ? kFront() : "");
  };
}
const kCabWin = () => path("M11.0 7.5Q10.4 9.4 11.6 10.9L15.6 10.9L15.6 7.5Z", "#22262b", 0.4);
const emuCab = (c) => unit(c, { roof: KG.roof, sill: KG.sill, drop: { a: 19, b: c.L - 6, y: KG.low }, nose: NOSE_K, rake: [[2.4, 7.7], [7.4, 12.5]], depth: 3.0, cabLen: 16, lampY: 5.1, coupler: "buffers",
  rows: [kWin([17.4], 3.6), kWin(seq(28.4, 6.0, 3)), kWin([52.4, 58.4], 5.0)], doors: [kDoor(22.2, K.door), kDoor(46.6, K.door)],
  trucks: [11.5, "end"], paint: emuPaint(true), surround: K.band, cab: kCabWin,
  extra: (cc, g) => kPlow() + hzRing(cc, 19.8, 6.1, 0.5, "#3a3d42") + hvac(20, KG.roof, 14, 0.7) + hvac(40, KG.roof, 14, 0.7) + boxes(24, g.L - 10, KG.low, 3, 0.4) });
const emuMid = (c) => unit(c, { roof: KG.roof, sill: KG.sill, drop: { a: 6, b: c.L - 6, y: KG.low },
  rows: [kWin([5.2]), kWin(seq(18.4, 6.0, 3)), kWin([c.L - 10.4])], doors: [kDoor(12.0, K.door), kDoor(c.L - 16.5, K.door)],
  trucks: ["end"], paint: emuPaint(false),
  // The pantograph is on the second section (Trainsheet's reading).
  extra: (cc, g) => (c.index === 1 ? pantograph(g.L - 14, KG.roof + 0.3, { up: true, facing: -1 }) + hvLine(g.L - 10.8, g.L - 4, KG.roof + 0.3) + hvac(8, KG.roof, 16, 0.7)
    : hvac(8, KG.roof, 14, 0.7) + hvac(g.L - 24, KG.roof, 14, 0.7)) + boxes(8, g.L - 8, KG.low, 3, 0.4) });
// 7023: white; the black window band; a broad red band low on the side and
// a thin red line over a yellow one above the windows, each begun by a red
// ring behind the cab; a gray skirt; "HŽPP" on the nose.
function dmuPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, K.white], [13.05, 3, K.roof]]) + (cab ? kBand(L, 9.6) : rect(-1, KG.band[0], L + 2, KG.band[1], K.band)) +
      rect(cab ? 17.2 : -1, 12.05, L + 2, 0.36, K.red) + rect(cab ? 18.6 : -1, 11.72, L + 2, 0.24, "#e9b423") +
      // The low band steps down to its ring by the cab.
      (cab ? path(`M14.6 4.2L20.5 4.2Q22 4.3 22.8 5.0Q23.6 5.9 25 5.9L${L + 1} 5.9L${L + 1} 4.5L14.6 4.5Z`, K.red) : rect(-1, 4.5, L + 2, 1.4, K.red)) +
      rect(cab ? 13.2 : -1, 0, L + 2, 3.95, K.skirt) +
      (cab ? ring(16.6, 12.2, 0.75, K.red, K.white) + ring(14.4, 4.55, 0.85, K.red, K.white) + kFront() : "");
  };
}
const dmuCab = (c) => unit(c, { roof: KG.roof, sill: KG.sill, drop: { a: 19, b: c.L - 6, y: KG.low }, nose: NOSE_K, rake: [[2.4, 7.7], [7.4, 12.5]], depth: 3.0, cabLen: 16, lampY: 5.1, coupler: "buffers",
  rows: [kWin([17.6, 23.6]), kWin(seq(37.6, 6.0, 4)), kWin([c.L - 9.4], 4.0)], doors: [kDoor(30.6, K.red), kDoor(c.L - 16.2, K.red)],
  trucks: [11.5, "end"], paint: dmuPaint(true), surround: K.band, cab: kCabWin,
  extra: (cc, g) => kPlow() + letters(cc, 8.6, 5.6, 0.95, "HŽPP", K.navy, { weight: 800 }) +
    // The cooling group on the roof and its exhaust; the engine is in the
    // end section.
    hvac(24, KG.roof, 16, 0.9) + exhaust(42, KG.roof) + hvac(50, KG.roof, 12, 0.7) + boxes(24, g.L - 10, KG.low, 3, 0.4) });
const dmuMid = (c) => unit(c, { roof: KG.roof, sill: KG.sill, drop: { a: 6, b: c.L - 6, y: KG.low },
  rows: [kWin(seq(4.6, 6.0, 3)), kWin(seq(c.L - 39.0, 6.0, 4)), kWin([c.L - 9.4], 4.0)], doors: [kDoor(23.6, K.red), kDoor(c.L - 14.8, K.red)],
  trucks: ["end"], paint: dmuPaint(false),
  extra: (cc, g) => hvac(8, KG.roof, 14, 0.7) + hvac(g.L - 24, KG.roof, 14, 0.7) + boxes(8, g.L - 8, KG.low, 3, 0.4) });

// ---------- 7022: Gredelj's diesel unit ----------
// Three articulated sections, low-floor: an upright, boxy cab, its
// windshield and the destination display in a red cap; silver sides in
// narrow panels; the windows in one black band with a red line round it,
// rounded at its front corners; red double doors; a yellow plow.
const G = { silver: "#c6cacf", seam: "rgba(0,0,0,0.14)", roof: "#a3a8ae", band: "#1c1f23", red: "#d5222c", skirt: "#9aa0a6", yellow: "#f5d000", black: "#191b1f" };
const GG = { roof: 13.7, sill: 3.4, low: 2.2 };
const NOSE_G = [[1.2, 2.5], [0.9, 6.4], ["q", 0.9, 7.4, 1.5, 8.2], [3.4, 12.6], ["q", 3.9, 13.7, 5.8, 13.7]];
function gredeljPaint(cab) {
  return (c, g) => {
    const L = g.L, x = cab ? 13.4 : -3, y0 = 6.5, y1 = 11.5;
    return bands(L, [[0, 20, G.silver], [13.1, 3, G.roof]]) + lines(seq(cab ? 9 : 2, 3.4, Math.ceil(L / 3.4)).map((v) => [v, 3.6, v, 13.1]), G.seam, 0.5) +
      // The window band in its red outline.
      path(`M${x + 1.2} ${y0 - 0.3}Q${x - 0.3} ${y0 - 0.3} ${x - 0.3} ${y0 + 1.2}L${x - 0.3} ${y1 - 0.9}Q${x - 0.3} ${y1 + 0.3} ${x + 1.2} ${y1 + 0.3}L${L + 1} ${y1 + 0.3}L${L + 1} ${y0 - 0.3}Z`, G.red) +
      path(`M${x + 1.2} ${y0}Q${x} ${y0} ${x} ${y0 + 1.2}L${x} ${y1 - 0.9}Q${x} ${y1} ${x + 1.2} ${y1}L${L + 1} ${y1}L${L + 1} ${y0}Z`, G.band) +
      rect(cab ? 12 : -1, 4.3, L + 2, 0.3, G.red) + rect(cab ? 10.5 : -1, 0, L + 2, 3.75, G.skirt) +
      // The red cap: over the cab's roof, down each side of the windshield
      // and across under it.
      (cab ? path("M-1 6.9L5.0 6.9L5.2 7.4L7.3 13.1L9.2 13.1L9.2 20L-1 20Z", G.red) : "");
  };
}
const gDoor = (x) => ({ x, w: 4.4, y0: GG.low, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.46, grabs: false, fill: G.red });
const gWin = (xs, w = 5.4) => ({ xs, y: 6.9, w, h: 4.2, r: 0.3 });
const gredeljCab = (c) => unit(c, { roof: GG.roof, sill: GG.sill, drop: { a: 18, b: c.L - 6, y: GG.low }, nose: NOSE_G, rake: [[1.5, 8.2], [3.4, 12.6]], depth: 2.6, cabLen: 12, lampY: 5.6, coupler: "buffers",
  rows: [gWin([15.0], 4.6), gWin([26.0]), gWin(seq(32.2, 6.2, 3)), gWin([c.L - 9.0], 4.4)], doors: [gDoor(20.6), gDoor(c.L - 14.4)],
  trucks: [10.8, "end"], paint: gredeljPaint(true), surround: G.black,
  // The cab's side window, upright, ahead of the band.
  cab: () => path("M8.2 7.6L11.4 7.6L11.4 11.4L9.6 11.4Z", "#1d2026", 0.4),
  extra: (cc, g) => path(poly([[1.1, 2.5], [5.8, 2.5], [5.4, 0.8], [1.7, 0.6]]), G.yellow, 0.4) + hzRing(cc, 11.6, 5.6, 0.5, "#3a3d42") +
    // The roof's long perforated covers over the engines and the cooling.
    rect(14, GG.roof - 0.05, 22, 1.0, G.roof, 0.4, 'rx="0.2"') + slats(26, GG.roof + 0.1, 9, 0.7, 0.45, "rgba(0,0,0,0.35)") + rect(42, GG.roof - 0.05, 16, 1.0, G.roof, 0.4, 'rx="0.2"') +
    slats(43, GG.roof + 0.1, 8, 0.7, 0.45, "rgba(0,0,0,0.35)") + boxes(22, g.L - 10, GG.low, 3, 0.4) });
const gredeljMid = (c) => unit(c, { roof: GG.roof, sill: GG.sill, drop: { a: 6, b: c.L - 6, y: GG.low },
  rows: [gWin(seq(4.0, 6.2, 2)), gWin(seq(22.4, 6.2, 2)), gWin(seq(c.L - 15.8, 6.2, 2))], doors: [gDoor(16.8), gDoor(c.L - 22.6)],
  trucks: ["end"], paint: gredeljPaint(false),
  extra: (cc, g) => rect(6, GG.roof - 0.05, g.L - 12, 1.0, G.roof, 0.4, 'rx="0.2"') + slats(8, GG.roof + 0.1, 9, 0.7, 0.45, "rgba(0,0,0,0.35)") +
    slats(g.L - 17, GG.roof + 0.1, 9, 0.7, 0.45, "rgba(0,0,0,0.35)") + boxes(8, g.L - 8, GG.low, 3, 0.4) });

// ---------- 6111: Ganz's electric unit ----------
// Three cars, each on two trucks of its own, a cab at each end of the
// train: an upright front, raked a little above the waist, two windshield
// panes, the lamps in a blue band across it; a cab door with yellow
// handrails; tall windows in pale frames, two pairs of double doors a car.
const GZ = { blue: "#2b3f9f", white: "#e9ebee", roof: "#c9cdd1", frame: "#dfe2e6", rail: "#d9a51f", skirt: "#3a3d42" };
const GZG = { roof: 12.9, sill: 3.9, waist: 6.7, eave: 12.1 };
const NOSE_GZ = [[1.1, 3.9], [0.7, 4.6], [0.7, 7.3], [1.9, 11.9], ["q", 2.2, 12.9, 3.8, 12.9]];
function ganzPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, GZ.white], [GZG.eave, 3, GZ.roof]]) + rect(cab ? 6.4 : -1, GZG.waist, L + 2, GZG.eave - GZG.waist, GZ.blue) +
      rect(cab ? 9.6 : -1, 4.35, L + 2, 0.34, GZ.blue) +
      // The front's blue band across the lamps, rising round the corner to
      // meet the side's blue at the cab door.
      (cab ? path(`M-1 4.75L4.4 4.75Q7.4 4.9 8.2 ${GZG.waist}L-1 ${GZG.waist}Z`, GZ.blue) : "");
  };
}
// Each window in its pale frame.
const gzFrames = (xs, w, y = 7.5, h = 3.9) => xs.map((x) => rect(x - 0.22, y - 0.22, w + 0.44, h + 0.44, GZ.frame, 0, 'rx="0.4"')).join("");
const gzDoor = (x) => ({ x, w: 4.2, y0: GZG.sill, y1: 11.3, leaves: 2, glassY: 0.4, glassH: 0.5, grabs: false, fill: GZ.blue });
function ganzCar(c, cab) {
  const L = c.L;
  // Behind the cab, as photographed: its door, three windows (the class
  // between the second and third), a double door, four windows, a double
  // door, and windows to the end. A middle car: two double doors likewise.
  const wins = cab ? [14.0, 19.2, 26.0, 36.2, 41.0, 45.8, 50.6, 60.8, 65.6, 70.4] : [4.4, 9.2, 14.0, 24.0, 28.8, 33.6, 38.4, 43.2, 53.2, 58.0, 62.8, 67.6, 72.4];
  const doors = cab ? [31.0, 55.4] : [18.8, 48.0];
  // The cab door's yellow handrails and the pod on the cab's roof; the
  // pantograph and its line on the middle car (Trainsheet's reading),
  // vent housings on the others.
  const cabParts = () => line(7.1, 5.0, 7.1, 9.6, GZ.rail, 1.2) + line(10.6, 5.0, 10.6, 9.6, GZ.rail, 1.2) + rect(2.6, GZG.roof - 0.05, 3.4, 0.75, GZ.white, 0.4, 'rx="0.3"') +
    hvac(26, GZG.roof, 12, 0.5) + hvac(48, GZG.roof, 12, 0.5);
  const midParts = () => pantograph(13, GZG.roof + 0.3, { up: true }) + hvLine(16.2, 26, GZG.roof + 0.3) + hvac(40, GZG.roof, 16, 0.6);
  const o = { roof: GZG.roof, sill: GZG.sill, rows: [{ xs: wins, y: 7.5, w: 3.6, h: 3.9, r: 0.35 }], doors: doors.map(gzDoor), trucks: [11.5, L - 11.5], wheel: 36,
    paint: (cc, g) => ganzPaint(cab)(cc, g) + gzFrames(wins, 3.6),
    extra: (cc, g) => (cab ? cabParts() : midParts()) + letters(cc, cab ? 24.4 : 13.4, 9.4, 1.3, "2", "#ffffff", { weight: 600 }) +
      hzRing(cc, L / 2 + 1.6, 5.6, 0.5, GZ.blue) + underframe(18, L - 18, GZG.sill, { depth: 1.5, boxes: 3, tanks: true }) };
  return cab ? unit(c, { ...o, nose: NOSE_GZ, rake: [[0.7, 7.5], [1.75, 11.5]], depth: 1.5, cabLen: 6.5, lampY: 5.5, coupler: "scharf", surround: "#1d2026",
    doors: [{ x: 7.5, w: 2.7, y0: GZG.sill, y1: 11.2, leaves: 1, glassY: 0.5, glassH: 0.42, grabs: false, fill: GZ.blue }, ...o.doors] }) : unit(c, o);
}

// ---------- 1141 and 1142: the electric locomotives ----------
// A four-axle box with a cab at each end: upright fronts raked a little
// above the waist, buffers, a plow. The shell is drawn as two mirrored
// halves and painted along its whole length; what is on the side (cab
// windows, doors, round windows, louvers, lettering) is placed over it, so
// the two ends can differ. o: roof, sill, x0 (the body's end), centers,
// wb, paint(L), side(c, L), plow (its color), lampY.
function locoShell(c, o) {
  const L = c.L, { roof, sill, x0 } = o;
  const nose = [[x0, sill], [x0, 8.2], [x0 + 0.45, roof - 0.9], ["q", x0 + 0.55, roof, x0 + 1.7, roof]];
  const half = (far) => bilevel({ ...c, cabL: true, cabR: false, coupledL: false, coupledR: false }, {
    roof, sill, cornerR: 0.8, end: x0, noTrucks: true, nose, badge: false, cabLen: 0, base: o.base, rows: [], doors: [],
    paint: () => (far ? `<g transform="matrix(-1 0 0 1 ${L} 0)">${o.paint(L)}</g>` : o.paint(L)),
    extra: () => path(poly([[x0 + 0.08, 8.7], [x0 + 0.4, roof - 1.2], [x0 + 0.58, roof - 1.2], [x0 + 0.26, 8.7]]), C.glass) +   // the windshield, edge-on
      buffers(0, -1, { end: x0, sill: 4.2, y: 3.45 }) + path(poly([[x0 + 0.1, sill], [x0 + 3.6, sill], [x0 + 3.2, 0.7], [x0 + 0.6, 0.6]]), o.plow ?? C.black, 0.4) +
      rect(x0 - 0.05, o.lampY ?? 5.6, 0.3, 0.7, "#fff6d8", 0.3, 'rx="0.12"') + rect(x0 + 0.5, roof - 0.5, 0.35, 0.5, "#fff6d8", 0.3, 'rx="0.12"'),
  });
  const id = newId();
  // The trucks first: the body's deep sides come down over their tops.
  let s = [-1, 1].map((k) => truck(L / 2 + (k * o.centers) / 2, { wb: o.wb, d: 49, kind: "loco", top: sill + 0.2 })).join("") +
    underframe(L / 2 - o.centers / 2 + 7.4, L / 2 + o.centers / 2 - 7.4, sill, { depth: 1.7, boxes: 2, tanks: true });
  s += `<clipPath id="${id}"><rect x="-5" y="-5" width="${n(L / 2 + 5.3)}" height="30"/></clipPath><g clip-path="url(#${id})">${half(false)}</g>` +
    `<g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${half(true)}</g></g>`;
  // The roof: two pantographs (the trailing one up), the line between them
  // on its insulators, the main breaker.
  s += pantograph(L * 0.24, roof + 0.5, { up: false }) + pantograph(L * 0.76, roof + 0.5, { up: true, facing: -1 }) +
    rect(L * 0.24 - 3.2, roof - 0.05, 6.4, 0.55, C.steelDark, 0.4, 'rx="0.2"') + rect(L * 0.76 - 3.2, roof - 0.05, 6.4, 0.55, C.steelDark, 0.4, 'rx="0.2"') +
    hvLine(L * 0.24 + 3.2, L / 2 - 1.2, roof + 0.5) + hvLine(L * 0.76 - 3.2, L / 2 + 1.2, roof + 0.5);
  return s + o.side(c, L);
}
const porthole = (x, y, rx, ry = rx) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.glass}" stroke="currentColor" stroke-width="0.5" vector-effect="non-scaling-stroke"/>` +
  `<ellipse cx="${n(x)}" cy="${n(y + ry * 0.35)}" rx="${n(rx * 0.7)}" ry="${n(ry * 0.4)}" fill="${C.glassLight}"/>`;
const louver = (x, y, w, h) => rect(x, y, w, h, "rgba(12,14,18,0.72)", 0.3, 'rx="0.08"') + lines(seq(y + h / 4, h / 4, 3).map((v) => [x + 0.15, v, x + w - 0.15, v]), "rgba(255,255,255,0.2)", 0.4);
const cabDoor = (x, w, y0, y1, glass) => door(x, y0, w, y1 - y0, { leaves: 1, glass, glassY: 0.66, glassH: 0.26, grabs: false, fill: "rgba(0,0,0,0.05)" });
const rails = (xs, y0, y1, color) => xs.map((x) => line(x, y0, x, y1, color, 1.3)).join("");

// 1141: everything below is placed from the side view of 1141 388 (the A
// end on the left). The A cab has a wide side window and its door a way
// back, with no window; the B cab a door with a window right behind a
// narrow side window. Four round windows; nine louvers along the roof's
// edge; a thin white line through the round windows from a ring to a ring,
// with a branch stepping down toward each end; a thick white line low on
// the side, a big ring at each end of it.
const B41 = { blue: "#1f51cf", frame: "#4b4f55", white: "#f2f4f6", rail: "#e3a21c" };
const G41 = { roof: 12.6, sill: 3.0, x0: 1.1, centers: 25.26, wb: 8.86, frame: 4.5 };
const paint1141 = (L) => bands(L, [[0, 20, B41.blue], [0, G41.frame, B41.frame]]) +
  rect(9.2, 9.65, 33.8, 0.2, B41.white) + rect(13.8, 7.35, 0.2, 2.5, B41.white) + rect(-1, 7.35, 15, 0.2, B41.white) +
  rect(38.7, 7.35, 0.2, 2.5, B41.white) + rect(38.7, 7.35, L, 0.2, B41.white) + ring(9.2, 9.75, 0.42, B41.white, B41.blue) + ring(43.0, 9.75, 0.42, B41.white, B41.blue) +
  rect(2.6, 5.35, L - 5.2, 0.6, B41.white) + ring(2.6, 5.65, 0.8, B41.white, B41.blue) + ring(L - 2.6, 5.65, 0.8, B41.white, B41.blue);
const side1141 = (c, L) => win(2.1, 8.9, 3.3, 2.0, 0.3) + win(47.5, 8.9, 1.4, 2.0, 0.25) +
  cabDoor(15.3, 2.4, 4.7, 10.8, false) + cabDoor(45.0, 1.8, 4.7, 10.8, true) + rails([14.9, 18.1, 44.6, 47.15], 4.9, 10.2, B41.rail) +
  [12.1, 21.7, 31.8, 40.5].map((x) => porthole(x, 9.75, 1.0)).join("") + seq(7.3, 4.18, 9).map((x) => louver(x, 11.05, 3.85, 0.8)).join("") +
  // HŽPP's circuit mark and the name; the number under the A cab's window.
  lines([[20.3, 7.6, 22.1, 7.6], [22.1, 7.6, 22.1, 6.6], [20.9, 7.1, 22.1, 7.1], [21.5, 6.6, 22.1, 6.6]], B41.white, 1.1) +
  circle(20.2, 7.6, 0.16, B41.white) + circle(20.8, 7.1, 0.16, B41.white) + circle(21.4, 6.6, 0.16, B41.white) +
  letters(c, 29.2, 7.05, 0.78, "HŽ PUTNIČKI PRIJEVOZ", B41.white, { weight: 700 }) + letters(c, 9.4, 6.75, 0.36, "HR-HŽPP 1141 388-4", B41.white, { weight: 600 });
const loco1141 = (c) => locoShell(c, { ...G41, base: B41.blue, paint: paint1141, side: side1141, plow: "#3a3d42" });

// 1142: orange-yellow above a white waist line, red below it, a white line
// and the dark red frame; a white cap over each cab's windshields; the
// roof's edge dark red, louvers along it; a yellow plow. Four oval windows,
// the second in a door; a door at the far cab. Their places are read from
// a three-quarter view.
const R42 = { yellow: "#f2a61f", red: "#e0391f", maroon: "#8c1c24", white: "#f1eee7" };
const G42 = { roof: 12.8, sill: 3.0, x0: 1.1, centers: 30.2, wb: 8.86, frame: 4.9 };
const paint1142 = (L) => bands(L, [[0, 20, R42.yellow], [11.7, 3, R42.maroon], [0, 8.45, R42.red], [8.0, 0.45, R42.white], [0, 5.3, R42.white], [0, G42.frame, R42.maroon]]) +
  // The white cap, its back edge sloping up to the roof.
  path("M-1 11.7L8.0 11.7L10.4 13.5L-1 13.5Z", R42.white) + path(`M${L + 1} 11.7L${L - 8.0} 11.7L${L - 10.4} 13.5L${L + 1} 13.5Z`, R42.white);
const side1142 = (c, L) => win(2.4, 9.0, 1.1, 2.0, 0.25) + win(4.0, 9.0, 2.2, 2.0, 0.3) + win(L - 6.2, 9.0, 2.2, 2.0, 0.3) + win(L - 3.5, 9.0, 1.1, 2.0, 0.25) +
  cabDoor(18.2, 2.4, 5.4, 11.2, false) + cabDoor(L - 10.2, 2.2, 5.4, 11.2, false) + rails([17.8, 21.0, L - 10.6, L - 7.6], 5.6, 10.4, "#3a3d42") +
  [11.2, 19.4, 31.0, 41.6].map((x) => porthole(x, 9.9, 0.62, 1.0)).join("") + seq(11.4, 4.5, 8).map((x) => louver(x, 11.85, 4.1, 0.75)).join("") +
  hzRing(c, 8.2, 9.9, 0.55, R42.maroon) + letters(c, 26.0, 6.7, 0.6, "1142 011", R42.white, { weight: 600 });
const loco1142 = (c) => locoShell(c, { ...G42, base: R42.yellow, paint: paint1142, side: side1142, plow: R42.yellow, lampY: 6.2 });

// ---------- The coach ----------
// A 26.4 m coach on two trucks 19 m apart, a door at each end, ten windows
// between. Light gray from just under the windows to the roof, a yellow
// line over the windows; white below, a red stripe along it and a thin gray
// line under that, broken for HŽ's roundel; the class by the door.
const CO = { gray: "#bfc2c6", white: "#efefec", red: "#d6222c", yellow: "#f0cf1c", line: "#9a9da2", roof: "#a9adb2", skirt: "#d9dad8" };
function coach(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [2.0, L - 4.6], cls = c.index === 1 ? "1" : "2";
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: CO.white, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 })),
    livery: () => bands(L, [[7.0, 20, CO.gray], [12.4, 3, CO.roof], [11.55, 0.42, CO.yellow], [5.95, 0.62, CO.red], [5.05, 0.24, CO.line], [0, 4.2, CO.skirt]]) +
      rect(L / 2 - 9.2, 4.9, 2.4, 0.6, CO.white),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.7) + [14, L - 14].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) + hzRing(cc, L / 2 - 8.0, 5.2, 0.62, CO.line) +
      letters(cc, 6.6, 9.4, 1.5, cls, "#ffffff", { weight: 600 }) + letters(cc, L - 6.6, 9.4, 1.5, cls, "#ffffff", { weight: 600 }) });
}

// ---------- Tables ----------

export const TYPES = {
  hr7123: { name: "7123 tilting train car (RegioSwinger)", kind: "emu" },
  hr7122: { name: "7122 diesel railcar", kind: "emu" },
  hr6112Cab: { name: "6112 end section", kind: "emu" },
  hr6112Mid: { name: "6112 middle section", kind: "emu" },
  hr6111Cab: { name: "6111 end car", kind: "emu" },
  hr6111Mid: { name: "6111 middle car", kind: "emu" },
  hr7023Cab: { name: "7023 end section", kind: "emu" },
  hr7023Mid: { name: "7023 middle section", kind: "emu" },
  hr7022Cab: { name: "7022 end section", kind: "emu" },
  hr7022Mid: { name: "7022 middle section", kind: "emu" },
  hr1141: { name: "1141 electric locomotive", kind: "electric" },
  hr1142: { name: "1142 electric locomotive", kind: "electric" },
  hrCoach: { name: "Coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or the joint's center), from the figures usually
// published, not checked for this file: the 7123 51.75 m as two cars; the
// 7122 24.4 m; the 6112 75 m as four sections; the 6111 about 72 m as three
// cars; the 7023 about 70 m as three sections; the 7022 drawn at 58 m (a
// guess); the 1141 15.47 m (its side carries the figure); the 1142 about
// 17.7 m; the coach 26.4 m.
export const MODELS = {
  hr7123: M(swinger, 84.9, true, byIndex),
  hr7122: M(y1, 80.05),
  hr6112Cab: M(emuCab, 67.0, true, byIndex),
  hr6112Mid: M(emuMid, 56.0, false, byIndex),
  hr6111Cab: M((c) => ganzCar(c, true), 79.0, true),
  hr6111Mid: M((c) => ganzCar(c, false), 79.0),
  hr7023Cab: M(dmuCab, 79.0, true),
  hr7023Mid: M(dmuMid, 72.0),
  hr7022Cab: M(gredeljCab, 66.0, true),
  hr7022Mid: M(gredeljMid, 58.0),
  hr1141: M(loco1141, 50.75),
  hr1142: M(loco1142, 58.07),
  hrCoach: M(coach, 86.6, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const ICN = set("Typical: a 7123 two-car tilting diesel unit, the InterCity Nagibni (newer Končar units are taking these trains over)", ["hr7123", 2]);
const ICN_NIGHT = set("Drawn as the 7123 tilting unit of the day trains; this overnight train may be coaches behind a diesel locomotive, which Trainsheet has not drawn", ["hr7123", 2]);
const RAILCAR = set("Typical: a 7122 diesel railcar (often two coupled)", ["hr7122", 1]);
const EMU_6112 = set("Typical: a 6112 four-section low-floor electric unit", ["hr6112Cab", 1], ["hr6112Mid", 2], ["hr6112Cab", 1]);
const EMU_6111 = set("Typical: a 6111 three-car electric unit (newer 6112 units run many of these trains)", ["hr6111Cab", 1], ["hr6111Mid", 1], ["hr6111Cab", 1]);
const DMU_7023 = set("Typical: a 7023 three-section low-floor diesel unit (older railcars run some of these trains)", ["hr7023Cab", 1], ["hr7023Mid", 1], ["hr7023Cab", 1]);
const DMU_7022 = set("Drawn as HŽPP's one 7022 diesel unit, photographed showing this line's Moravice; a guess", ["hr7022Cab", 1], ["hr7022Mid", 1], ["hr7022Cab", 1]);
const HAULED_1141 = set("Typical: a 1141 electric locomotive and coaches", ["hr1141", 1], ["hrCoach", 4]);
const HAULED_1142 = set("Typical: a 1142 electric locomotive and coaches", ["hr1142", 1], ["hrCoach", 5]);

// The timetable (HŽPP's GTFS) names no unit, and its lines are nominal
// (croatia.py: a route is named by where its trains end, not by the way
// they go), so a train is placed by its number and its two ends, and by its
// line's two ends only when its own aren't known. Every rule is a
// judgement; the ones with least behind them are marked "a guess".
//   520-523 (the ICN), and any train between Zagreb and Split: the 7123.
//     1820/1821, the overnight pair, is drawn the same and says so.
//   A train to or from Istria (Pula, Buzet, Lupoglav): the 7122, as
//     photographed at Pula. That includes the Zagreb-Pula pair 1472-1475,
//     which is a guess.
//   Zagreb's suburban trains (the 80xx and 81xx numbers, or both ends among
//     Harmica, Savski Marof, Zaprešić, Zagreb, Dugo Selo, Velika Gorica):
//     the 6112.
//   Under the wire all the way (both ends in WIRED, Trainsheet's list of
//     the electrified main lines' stations, from memory and not checked
//     against HŽ Infrastruktura's network statement):
//       a fast train (a number under 2000) between Zagreb and Rijeka, and
//       the Croatian legs of the international trains through Zaprešić or
//       Šapjane: the 1141 and coaches (the 1141 was photographed at
//       Rijeka; a guess);
//       a fast train between Zagreb and Slavonski Brod, Vinkovci, Tovarnik
//       or Vukovar: the 1142 and coaches (a guess; whether the wire reaches
//       Vukovar is not checked);
//       a local train on the Rijeka line (Karlovac, Ogulin, Moravice,
//       Rijeka, Šapjane): the 6111, but the one Karlovac-Moravice pair,
//       4200/4201, the 7022, whose only photograph shows it bound for
//       Moravice (a guess);
//       any other: the 6112.
//   Everything else, the lines without wire (Zagorje, Varaždin, Čakovec,
//     Bjelovar, Virovitica, Osijek, Požega, Dalmatia, Volinja) and any
//     train not placed: the 7023. That includes the fast trains between
//     Zagreb and Osijek: they run by Koprivnica and Virovitica, beyond the
//     wire as far as Trainsheet knows, so they are not drawn behind an
//     electric locomotive.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
const ISTRIA = /^(pula|buzet|lupoglav|pazin|kanfanar|vodnjan)/;
const SUBURB = /^(harmica|savski marof|zapresic|zagreb|dugo selo|velika gorica|sutla)/;
const WIRED = /^(zagreb|zapresic|savski marof|harmica|dugo selo|ivanic grad|novoselec|novska|slavonski brod|strizivojna|vinkovci|tovarnik|slavonski samac|velika gorica|sisak|sunja|vrbovec|krizevci|koprivnica|karlovac|duga resa|ostarije|ogulin|moravice|rijeka|permani|sapjane)/;
const RIJEKA_LINE = /^(karlovac|duga resa|ostarije|ogulin|moravice|rijeka|permani|sapjane)/;
const EAST = /^(slavonski brod|vinkovci|tovarnik|vukovar)/;
export const TYPICAL = {
  hzpp: (t = {}) => {
    const num = parseInt(t.number, 10);
    let a = fold(t.origin).trim(), b = fold(t.destination || t.dest).trim();
    // No ends known (a line on the fleet page): the line's own two.
    if (!a || !b) [a = "", b = ""] = fold(t.route || t.line).split(/\s+[–-]\s+/).map((s) => s.trim());
    const either = (re) => re.test(a) || re.test(b), both = (re) => re.test(a) && re.test(b);
    const zagreb = either(/^zagreb/);
    if (num >= 520 && num <= 523) return ICN;
    if (zagreb && either(/^split/)) return num === 1820 || num === 1821 ? ICN_NIGHT : ICN;
    if (either(ISTRIA)) return RAILCAR;
    const fast = num > 0 && num < 2000;
    if (fast && zagreb && either(EAST)) return HAULED_1142;
    if (both(WIRED)) {
      if (fast && ((zagreb && either(/^rijeka/)) || (num < 1000 && zagreb && either(/^zapresic/)) || both(/^(rijeka|sapjane)/))) return HAULED_1141;
      if ((num >= 8000 && num < 8200) || both(SUBURB)) return EMU_6112;
      if (num === 4200 || num === 4201) return DMU_7022;
      return either(RIJEKA_LINE) ? EMU_6111 : EMU_6112;
    }
    return DMU_7023;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders and years are the commonly published ones, set down
// from memory; figures Trainsheet could not check are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const f6112 = { model: "HŽ 6112", type: "Electric multiple unit", builder: "Končar", source: `${CM}HZ_6112_001-0_1.jpg` };
const f6111 = { model: "HŽ 6111", type: "Electric multiple unit", builder: "Ganz-MÁVAG", source: `${CM}H%C5%BD_6111_serie.jpg` };
const f7023 = { model: "HŽ 7023", type: "Diesel multiple unit", builder: "Končar", source: `${CM}DMU_7023_at_Zagreb_Central_Station,_2020.jpg` };
const f7022 = { model: "HŽ 7022", type: "Diesel multiple unit", builder: "TŽV Gredelj", fleet: 1, source: `${CM}C00_542_Bf_Zagreb_Gl._K.,_7022.jpg` };
export const FACTS = {
  hr7123: { model: "HŽ 7123 (Bombardier RegioSwinger)", type: "Tilting diesel multiple unit", builder: "Bombardier", source: `${CM}H%C5%BD_7123_series_DMU_(04).JPG`,
    about: "A two-car tilting diesel train, the InterCity Nagibni between Zagreb and Split, where its tilting lets it take the Lika line's curves faster. White with crimson lines and a yellow frame round the windshield; the unit photographed is 7123 005. HŽPP's new Končar electro-diesel units were reported taking these trains over late in 2026." },
  hr7122: { model: "HŽ 7122 (ex-SJ Y1)", type: "Diesel railcar", builder: "Fiat Ferroviaria", source: `${CM}7122_series_train_(12).JPG`,
    about: "A single diesel railcar with a cab at each end, bought second-hand from Sweden, where it was class Y1. Orange with a black roof; it works Istria's lines, cut off from the rest of Croatia's network, and the unit photographed at Pula is 7122 010." },
  hr6112Cab: { ...f6112,
    about: "An end section of Končar's four-section low-floor electric unit, built in Zagreb for the city's suburban line and for regional trains under the wire. The sections share a truck at each joint. The unit photographed is the first, 6112 001." },
  hr6112Mid: { ...f6112,
    about: "A middle section of a 6112. Where its pantograph sits is Trainsheet's reading; the photograph shows the unit from the front." },
  hr6111Cab: { ...f6111,
    about: "An end car of the three-car electric unit Ganz-MÁVAG of Budapest built in the 1970s, for decades Zagreb's suburban train and now on regional trains under the wire. Blue over white; the unit photographed at Zagreb Glavni kolodvor is 6111 019." },
  hr6111Mid: { ...f6111,
    about: "The middle car of a 6111. Unlike the newer units' sections, each car rides on two trucks of its own." },
  hr7023Cab: { ...f7023,
    about: "An end section of Končar's three-section low-floor diesel unit, the diesel sister of the 6112 with the same body and cab, for the regional lines without wire. The unit photographed is the first, 7023 001, with \"HŽPP\" on its nose." },
  hr7023Mid: { ...f7023,
    about: "The middle section of a 7023; the sections share a truck at each joint." },
  hr7022Cab: { ...f7022,
    about: "An end section of the one diesel unit TŽV Gredelj of Zagreb built: silver, with a red cap round the windshield and red doors. Photographed at Zagreb Glavni kolodvor showing \"Moravice\"." },
  hr7022Mid: { ...f7022,
    about: "The middle section of the 7022. The photograph shows two gangway joints, so Trainsheet draws three sections." },
  hr1141: { model: "HŽ 1141", type: "Electric locomotive", builder: "Končar, to ASEA's design", lengthFt: 50.8, source: `${CM}H%C5%BD_1141_388-4_at_Rijeka_Station_(side_view).jpg`,
    about: "The four-axle locomotive of Croatia's 25 kV lines, built in Zagreb under license from ASEA of Sweden. The one photographed at Rijeka, 1141 388, is in HŽ Putnički prijevoz's blue with white lines drawn like a circuit; its side gives its length as 15.47 m." },
  hr1142: { model: "HŽ 1142", type: "Electric locomotive", builder: "Končar", source: `${CM}H%C5%BD_1142_series_locomotive_(01).JPG`,
    about: "Končar's later and more powerful four-axle electric locomotive, for the fastest trains on the main line east of Zagreb. The one photographed, 1142 011, is in the older orange-yellow and red with oval windows along its side." },
  hrCoach: { model: "HŽ coach", type: "Locomotive-hauled passenger coach", source: `${CM}Carrozza_Hrvatske_%C5%BEeljeznice.jpg`,
    about: "One of HŽ's long-distance coaches, as photographed at Budapest Keleti: light gray through the windows under a yellow line, white below with a red stripe and HŽ's roundel." },
};
