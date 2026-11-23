// Srbija Voz's cars (scripts/railroads/serbia.py, agency "srbijavoz"):
// Serbia's passenger railroad: the Soko double-deck sets of the Belgrade–
// Subotica high-speed line, the FLIRT and BG Voz electric units, the main-
// line locomotives and their coaches, and the regional diesel units.
// Trainsheet's own side views at the shared scale (js/carart.js), each
// drawn from one photograph on Wikimedia Commons, named here fleet by
// fleet. Bodies and parts from czechia.cars.js (unit, euroLoco, hvac and
// the rest) and carmodels.js (coachCar); the hood-unit diesel is drawn
// here, on the tcdd.cars.js pattern, since no shared builder shapes a hood
// unit. The lettering is drawn here (no logo files); the railroad's "ЖС"
// mark is set as slanted letters, not its real drawn form.
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Every one of
// the photographs is a three-quarter or distant view, so the windows'
// spacing, the doors' places, the roof equipment, what hangs under the
// floor and every length are Trainsheet's reading of the type, not
// measurements. The lengths the drawings are scaled to are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file (see MODELS); the fact sheets give them
// anyway, as the other plug-in files do. The set formations (four cars for
// the Soko, the FLIRT and the 412, three for the 711) are judgements too.
//
//   Soko, the KISS 410 (Stadler, four cars, double deck): 410 006 at Novi
//     Beograd ("Soko KISS 410 418.jpg"). White, a dark roof, the upper
//     deck's windows in a red band with a blue band under it, blue along
//     the bottom, red doors; the nose black round the windshield, red
//     sweeping down the front and blue outside and below it; "СОКО" big in
//     blue under a red and blue wing behind the cab; a yellow line over the
//     first door. The photograph is a front three-quarter view of one end
//     car, so the windows a car, the intermediate cars' doors and where
//     the pantograph sits are a reading.
//   FLIRT, the 413 (Stadler FLIRT 3, four cars): 413 006 at Belgrade
//     ("ŽS 413 006 3.jpg"). Red over the nose, the roof and the skirt, the
//     side blue from a wave that sweeps up behind the cab, white doors,
//     the "ЖС" mark in a white ring, a short yellow stripe over the blue by
//     the first door. Drawn on shared (Jakobs) trucks between the cars, as
//     photographed; the windows a car are a reading past the first car.
//   BG Voz, the 412 (RVR, four cars): a set on the Belgrade junction's
//     bridges ("Railway bridges belgrade railway junction.JPG"). A boxy
//     unit: light blue, a pale window band, a grey roof, red doors, a blue
//     flat front with two windows, the pantograph and its gear on the
//     leading car. THE PHOTO GAP: the standalone 412 photograph could not
//     be downloaded (rate-limited), so this fleet is drawn from the bridges
//     photograph alone, which is distant and from above — the windows, the
//     doors' number and places and the side's detail are a reading.
//   441, the electric locomotive (four axles): 441-075 at Belgrade-Glavna
//     ("ŽS 441 in Belgrade-Glavna railway station.jpg"). Bright red all
//     over, a grey skirt, round portholes along the side, a row of louvers
//     under the roof, "ЖС" in white, a white name plate. The other
//     photograph, near Priboj ("ŽS 441 in Priboj.jpg"), shows an older red,
//     white and blue paint at distance; the all-red one is drawn.
//   461, the electric locomotive (six axles): 461-157
//     ("ŽS 461-157.jpg"). Dark crimson all over, a dark grey skirt, oval
//     portholes along the side, louvers under the roof, two pantographs.
//   661, the diesel locomotive (EMD G26, six axles): 661-155 on a freight
//     between Dimitrovgrad and Pirot ("ŽS 661 between Dimitrovgrad and
//     Pirot.jpg"). A hood unit, dark green, yellow bands sweeping back from
//     the front along the cab, a yellow stripe along the frame, a yellow
//     and black chevron buffer beam, "ЖС" in red. The short hood is as
//     tall as the long one, as photographed. The photograph is head-on
//     three-quarter, so the long hood's doors and grilles are a reading.
//   711, the diesel unit (Metrovagonmash RA2): 711-101
//     ("Serbian Railways Class 711.jpg"). Grey-silver, red over the nose
//     and in a band under the windows, a white line round the window band,
//     red along the roof's edge, "ЖС" in a white ring. Drawn as three cars
//     (a judgement: the sets run as two or three cars); the photograph
//     shows one driving car from the front, the rest is a reading.
//   710, the railcar (ex-Swedish Y1): 710-003 near Matejevac
//     ("ŽS 710 near Matejevac.jpg"). White over blue, a thin blue line
//     under the windows and one at the eave, a white roof, a red plow. The
//     real car has a cab at each end; it is drawn here as a single car with
//     its cab nose on the left only (oneEnd), so a one-car consist shows
//     one cab end.
//   The Goša coach: the coach behind 441-075 at Belgrade-Glavna.
//     Silver-grey, the windows in a blue band, blue doors, a grey roof.
//     (The coaches near Priboj are in an older cream paint, not drawn.)
//     The windows and trucks are the standard UIC coach's.
//
// Not in this file: the Civity 6111 (CAF). It belongs to ŽPCG, the
// Montenegrin railroad (zpcg.cars.js), and does not work the Belgrade–Bar
// train, which is drawn here behind a 461. That file imports the 461 and
// the coach from this one (zs461Draw, gosaCoachDraw below).
//
// The timetable names no locomotive or unit, so which fleet a train is
// drawn as is a judgement, labeled as typical; see TYPICAL below, where
// each rule is set out. VERIFIED after writing (22 Nov 2026): node
// --check passes; every model rendered and looked at beside its
// photograph (one fix: invented "СРБИЈА ВОЗ" lettering removed from the
// coach); TYPICAL run over all 251 srbijavoz runs, 0 failures.

import { coachCar, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, truck, underframe, slats } from "../carart.js?v=dev";
import { unit, euroLoco, letters, hvac, buffers, exhaust, tank } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// The railroad's "ЖС" mark, as slanted letters; and the same in a ring.
const zsMark = (c, x, y, h, fill) => letters(c, x, y, h, "ЖС", fill, { weight: 800, style: "italic" });
const zsRing = (c, x, y, r, ring, inside) => circle(x, y, r, ring) + circle(x, y, r * 0.82, inside) + zsMark(c, x, y, r * 0.85, ring);
// The white name plate on a locomotive's side.
const plate = (c, x, y) => rect(x - 2.6, y - 0.45, 5.2, 0.9, "#eef0f2", 0.3) + letters(c, x, y, 0.42, "ЖЕЛЕЗНИЦЕ СРБИЈЕ", "#3a3d42", { weight: 700 });

// A hood-unit diesel's body (the carmodels.js builders can't shape a hood
// unit): the outline filled, its livery clipped to it and shaded like the
// built-in drawings, as in tcdd.cars.js.
function hoodShell(d, base, liv, top = 13) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="${top}">` +
    '<stop offset="0.15" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="${top + 2}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// Hand rails along a hood unit's walkway, posts to the rail: from a to b
// at deck y, the rail h above the walkway.
const handrail = (a, b, deck, h = 2.4, color = "#d9dcdf") => lines([[a, deck + h, b, deck + h],
  ...seq(a, 5, Math.floor((b - a) / 5) + 1).map((x) => [x, deck, x, deck + h])], color, 0.7);

// ---------- Soko: the KISS 410 (Stadler) ----------
// Four double-deck cars, each on two trucks of its own, the low floor and
// the two decks between them. White; the upper deck's windows in a red
// band, a blue band under it; blue along the bottom under the lower
// deck's windows; red doors; a dark roof. The nose: black round the
// windshield, red sweeping down the front, blue outside and below it.
const SK = { white: "#f1f2f3", red: "#d6202a", blue: "#1d3f94", roof: "#2b2e33", yellow: "#f0c419", black: "#17191c" };
const SKG = { roof: 15.15, sill: 2.9, low: 1.2 };
const NOSE_SK = [[1.7, 2.9], [1.0, 4.4], ["q", 0.8, 6.2, 1.8, 8.2], [5.4, 13.6], ["q", 6.4, 15.15, 9.6, 15.15]];
function sokoPaint(cab) {
  return (c, g) => {
    const L = g.L, a = cab ? 13.5 : -1;
    let s = rect(-1, 0, L + 2, 20, SK.white) + rect(-1, 14.0, L + 2, 3, SK.roof) +
      rect(a, 10.2, L + 1 - a, 3.8, SK.red) + rect(a, 8.9, L + 1 - a, 1.3, SK.blue) + rect(a, 0, L + 1 - a, 3.5, SK.blue);
    if (cab) {
      // Blue over the lower front and in a sweep up behind the red to the
      // blue band; red from the windshield's foot up to the red band; the
      // black of the windshield's surround over the top of the nose.
      s += path("M-1 0L-1 6.0L3.6 6.0Q9.0 6.6 12.0 10.2L14.5 10.2L14.5 8.9Q12.6 4.6 10.2 3.5L14.5 3.5L14.5 0Z", SK.blue) +
        path("M-1 6.0L3.6 6.0Q9.0 6.6 12.0 10.2L14.5 10.2L14.5 14.0L-1 14.0Z", SK.red) +
        path("M-1 16L-1 8.6L2.2 8.6L6.6 13.2Q8.0 14.0 10.6 14.0L10.6 16Z", SK.black);
    }
    return s;
  };
}
const skDoor = (x) => ({ x, w: 4.6, y0: SKG.low + 0.2, y1: 8.7, leaves: 2, glassY: 0.42, glassH: 0.4, grabs: false, fill: SK.red });
// The wing over the name: three bars swept back to a point, red, blue, red.
const sokoWing = (c, x, y) =>
  path(`M${x - 2.4} ${y + 0.9}L${x + 1.6} ${y + 0.9}Q${x + 2.6} ${y + 0.5} ${x + 2.4} ${y - 0.6}L${x + 1.7} ${y - 0.9}Q${x + 2.0} ${y + 0.35} ${x + 1.2} ${y + 0.5}L${x - 2.0} ${y + 0.5}Z`, SK.red) +
  rect(x - 1.5, y - 0.15, 2.6, 0.38, SK.blue) + rect(x - 0.9, y - 0.75, 2.2, 0.38, SK.red);
const sokoCab = (c) => unit(c, { roof: SKG.roof, sill: SKG.sill, drop: { a: 24.0, b: c.L - 17.0, y: SKG.low }, diaphragm: [3.4, 13.4],
  nose: NOSE_SK, rake: [[1.8, 8.2], [5.4, 13.6]], depth: 3.2, cabLen: 10, lampY: 5.0, bare: true, surround: SK.black,
  // The cab's side window and the narrow one behind it; the upper deck;
  // the lower deck; the level over the inner truck.
  rows: [{ xs: [11.0], y: 6.9, w: 2.2, h: 3.0, r: 0.35 }, { xs: seq(27.4, 6.0, 7), y: 10.7, w: 4.6, h: 2.4, r: 0.5 },
    { xs: seq(33.6, 6.0, 4), y: 3.9, w: 4.6, h: 2.7, r: 0.4 }, { xs: [c.L - 13.4], y: 6.4, w: 5.0, h: 2.8, r: 0.4 }],
  doors: [skDoor(27.0), skDoor(c.L - 24.4)], trucks: [13.0, c.L - 10.2], wheel: 36, paint: sokoPaint(true),
  extra: (cc, g) => rect(26.0, 9.25, 7.0, 0.3, SK.yellow) +
    sokoWing(cc, 20.0, 8.0) + letters(cc, 20.0, 5.6, 1.7, "СОКО", SK.blue, { weight: 800, spacing: "0.03em" }) +
    letters(cc, 20.0, 3.75, 0.5, "410 006", SK.blue, { weight: 600 }) +
    hvac(14, SKG.roof, 9, 0.5) + hvac(g.L - 16, SKG.roof, 10, 0.5) });
const sokoMid = (c) => unit(c, { roof: SKG.roof, sill: SKG.sill, drop: { a: 17.0, b: c.L - 17.0, y: SKG.low }, diaphragm: [3.4, 13.4],
  rows: [{ xs: seq(19.6, 6.0, 8), y: 10.7, w: 4.6, h: 2.4, r: 0.5 }, { xs: seq(26.2, 6.0, 6), y: 3.9, w: 4.6, h: 2.7, r: 0.4 },
    { xs: [3.2, c.L - 8.2], y: 6.4, w: 5.0, h: 2.8, r: 0.4 }],
  doors: [skDoor(19.6), skDoor(c.L - 24.2)], trucks: [9.6, c.L - 9.6], wheel: 36, paint: sokoPaint(false),
  // The pantograph on the second car, over its outer truck (a reading).
  pan: c.index === 1 ? 7.0 : null,
  extra: (cc, g) => (c.index === 1 ? "" : hvac(3, SKG.roof, 10, 0.5)) + hvac(g.L - 14, SKG.roof, 10, 0.5) });

// ---------- FLIRT: the 413 (Stadler FLIRT 3) ----------
// Four cars on shared trucks, the floor low between them. Red over the
// nose, the roof and the skirt; the side blue from a wave that sweeps up
// behind the cab; white doors; "ЖС" in a white ring behind the cab.
const FL = { red: "#d8231f", redDark: "#b51c1a", blue: "#2456b4", white: "#e9ebee", yellow: "#f2cf1d", black: "#17191c" };
const FLG = { roof: 13.9, sill: 3.4, low: 2.4 };
const NOSE_FL = [[1.5, 3.4], [0.9, 4.6], ["q", 0.7, 6.0, 1.9, 7.4], [6.2, 12.6], ["q", 7.2, 13.9, 10.0, 13.9]];
function flirtPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = rect(-1, 0, L + 2, 20, FL.red) + rect(-1, 12.9, L + 2, 3, FL.redDark);
    // The blue of the side: from the wave behind the cab, to the top of
    // the windows; red is left along the skirt.
    s += cab ? path(`M14.0 0L14.0 2.0Q18.5 5.4 19.6 8.4Q20.4 11.0 23.6 11.4L${L + 1} 11.4L${L + 1} 4.5L31 4.5Q25 4.2 21.5 2.0L21.5 0Z`, FL.blue)
      : rect(-1, 4.5, L + 2, 6.9, FL.blue);
    // The short yellow stripe over the blue by the first door.
    if (cab) s += rect(27.0, 11.55, 6.4, 0.3, FL.yellow);
    return s;
  };
}
const flDoor = (x) => ({ x, w: 4.4, y0: FLG.low + 0.15, y1: 10.9, leaves: 2, glassY: 0.4, glassH: 0.45, grabs: false, fill: FL.white });
const flirtCab = (c) => unit(c, { roof: FLG.roof, sill: FLG.sill, drop: { a: 17.5, b: c.L - 2, y: FLG.low }, diaphragm: [3.0, 12.2],
  nose: NOSE_FL, rake: [[1.9, 7.4], [6.2, 12.6]], depth: 3.2, cabLen: 9, lampY: 5.2, bare: true, surround: FL.black,
  rows: [{ xs: [9.8], y: 8.0, w: 2.8, h: 3.0, r: 0.4 }, { xs: [13.4], y: 8.0, w: 1.7, h: 3.0, r: 0.3 },
    { xs: [24.4, 28.9], y: 7.7, w: 3.9, h: 3.3, r: 0.35 }, { xs: seq(39.6, 4.5, 4), y: 7.7, w: 3.9, h: 3.3, r: 0.35 }],
  doors: [flDoor(33.9)], trucks: [10.5, "end"], wheel: 34, paint: flirtPaint(true),
  extra: (cc, g) => zsRing(cc, 21.9, 9.2, 1.25, "#ffffff", FL.blue) + letters(cc, 12.6, 6.3, 0.55, "413 006", "#ffffff", { weight: 600 }) +
    hvac(13, FLG.roof, 9, 0.55) + hvac(g.L - 20, FLG.roof, 12, 0.55) });
const flirtMid = (c) => unit(c, { roof: FLG.roof, sill: FLG.sill, drop: { a: 2, b: c.L - 2, y: FLG.low }, diaphragm: [3.0, 12.2],
  rows: [{ xs: seq(4.0, 4.6, 5), y: 7.7, w: 3.9, h: 3.3, r: 0.35 }, { xs: seq(34.6, 4.6, 5), y: 7.7, w: 3.9, h: 3.3, r: 0.35 }],
  doors: [flDoor(28.3)], trucks: c.index === c.count - 2 ? [] : ["end"], wheel: 34, paint: flirtPaint(false),
  // The pantograph on the second car (a reading; the photograph shows the
  // roof gear from the front, at distance).
  pan: c.index === 1 ? 12 : null,
  extra: (cc, g) => (c.index === 1 ? "" : hvac(6, FLG.roof, 12, 0.55)) + hvac(g.L - 22, FLG.roof, 12, 0.55) });

// ---------- BG Voz: the 412 (RVR) ----------
// A boxy four-car unit, each car on two trucks of its own. Light blue, the
// windows in a pale band, a grey roof, red doors; a flat blue front; the
// pantograph and its gear on the leading car, as photographed.
const BG = { blue: "#2f7fd0", band: "#dfe5ec", roof: "#8a9096", red: "#d3282c", skirt: "#3a3d42", black: "#17191c" };
const BGG = { roof: 13.0, sill: 3.9 };
const NOSE_BG = [[1.0, 3.9], [0.8, 7.6], ["q", 0.8, 8.3, 1.2, 9.0], [2.0, 12.2], ["q", 2.3, 13.0, 3.6, 13.0]];
const bgvozPaint = (c, g) => bands(g.L, [[0, 20, BG.blue], [7.3, 4.0, BG.band], [12.2, 3, BG.roof], [0, 4.2, BG.skirt]]);
const bgDoor = (x) => ({ x, w: 3.6, y0: BGG.sill + 0.15, y1: 11.0, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: BG.red });
const bgvozCab = (c) => unit(c, { roof: BGG.roof, sill: BGG.sill, nose: NOSE_BG, rake: [[1.2, 9.0], [2.0, 12.2]], depth: 2.2, cabLen: 5, lampY: 5.6, coupler: "buffers", surround: BG.black,
  rows: [{ xs: [5.8], y: 8.4, w: 2.0, h: 2.6, r: 0.3 }, { xs: seq(15.0, 4.6, 8), y: 7.8, w: 3.4, h: 3.0, r: 0.3 }, { xs: [58.4], y: 7.8, w: 3.4, h: 3.0, r: 0.3 }],
  doors: [bgDoor(9.6), bgDoor(53.0)], trucks: [10.5, c.L - 10.5], wheel: 37, pan: 20,
  // The flat front is blue to the roof.
  paint: (cc, g) => bgvozPaint(cc, g) + rect(-1, 4.2, 5.6, 8.0, BG.blue),
  extra: (cc, g) => letters(cc, 12.0, 5.6, 0.6, "412-030", "#ffffff", { weight: 600 }) +
    rect(34, BGG.roof - 0.05, 9, 0.6, C.steelDark, 0.4, 'rx="0.2"') + rect(46, BGG.roof - 0.05, 6, 0.45, C.steelDark, 0.4, 'rx="0.2"') +
    boxes(20, g.L - 20, BGG.sill, 3, 1.3) });
const bgvozMid = (c) => unit(c, { roof: BGG.roof, sill: BGG.sill,
  rows: [{ xs: seq(9.7, 4.6, 10), y: 7.8, w: 3.4, h: 3.0, r: 0.3 }],
  doors: [bgDoor(4.0), bgDoor(c.L - 7.6)], trucks: [10.5, c.L - 10.5], wheel: 37, paint: bgvozPaint,
  extra: (cc, g) => seq(10, 12, 5).map((x) => rect(x, BGG.roof - 0.05, 1.6, 0.4, C.steelDark, 0.4, 'rx="0.15"')).join("") + boxes(20, g.L - 20, BGG.sill, 2, 1.1) });

// ---------- The electric locomotives ----------
// Both are boxes with a cab at each end and a nearly upright front, round
// portholes along the side and a row of louvers under the roof.
const NOSE_ZS = [[1.3, 4.1], [1.1, 8.2], ["q", 1.1, 8.8, 1.5, 9.3], [2.6, 12.2], ["q", 2.9, 12.9, 4.2, 12.9]];
const portholes = (xs, y, rx, ry) => xs.map((x) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${rx}" ry="${ry}" fill="${C.glass}" stroke="${C.gasket}" stroke-width="0.6" vector-effect="non-scaling-stroke"/>` +
  `<ellipse cx="${n(x)}" cy="${n(y + ry * 0.35)}" rx="${n(rx * 0.7)}" ry="${n(ry * 0.4)}" fill="${C.glassLight}"/>`).join("");

// 441: four axles. Bright red all over, a grey skirt, a grey-brown roof;
// four portholes; "ЖС" and the number in white behind the cab, the white
// name plate toward the other end (441-075's side at Belgrade-Glavna).
const E441 = { red: "#d7302a", skirt: "#84888d", roof: "#7c746c" };
const paint441 = (c, L) => bands(L, [[0, 20, E441.red], [12.3, 3, E441.roof], [0, 5.0, E441.skirt]]);
const srbijavoz441 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_ZS, rake: [[1.5, 9.3], [2.6, 12.2]], centers: 25.5, wb: 9.2, wheel: 49, surround: "#1d2026",
  door: 6.4, doorW: 1.9, doorGlass: false, paint: paint441,
  grilles: [[-15.5, 31, 11.1, 12.0]], grilleFill: "rgba(20,22,25,0.55)",
  over: (cc, L) => portholes([L / 2 - 10.5, L / 2 - 3.5, L / 2 + 3.5, L / 2 + 10.5], 9.3, 0.75, 0.85) +
    zsMark(cc, 11.4, 10.0, 1.0, "#ffffff") + letters(cc, 11.6, 7.5, 0.55, "441-075", "#ffffff", { weight: 600 }) +
    plate(cc, L - 12.8, 7.3) });

// 461: six axles. Dark crimson all over, a dark grey skirt; five oval
// portholes; "ЖС", the number and the name plate in white toward one end
// (461-157's side).
const E461 = { red: "#a8283a", skirt: "#55585d", roof: "#5e5a58" };
const paint461 = (c, L) => bands(L, [[0, 20, E461.red], [12.3, 3, E461.roof], [0, 5.1, E461.skirt]]);
const srbijavoz461 = (c) => {
  const centers = 34.0, wb = 14.2, c2 = centers / 2;
  return euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_ZS, rake: [[1.5, 9.3], [2.6, 12.2]], centers, wb, wheel: 49, surround: "#1d2026",
    door: 8.6, doorW: 1.9, doorGlass: false, paint: paint461,
    grilles: [[-20.5, 41, 11.1, 12.0]], grilleFill: "rgba(20,22,25,0.55)",
    // The trucks again with their middle axles (euroLoco draws two-axle
    // trucks), and the equipment between them.
    under: (cc, L) => [-1, 1].map((k) => truck(L / 2 + k * c2, { wb, d: 49, kind: "loco", top: 4.1, axles: 3 })).join("") +
      underframe(L / 2 - c2 + 9.4, L / 2 + c2 - 9.4, 4.1, { depth: 1.8, boxes: 2, tanks: true }),
    over: (cc, L) => portholes([11.6, L / 2 - 12, L / 2 - 4, L / 2 + 4, L / 2 + 12], 9.5, 0.6, 0.95) +
      zsMark(cc, L - 13.6, 10.3, 0.9, "#ffffff") + letters(cc, L - 13.6, 8.9, 0.55, "461-157", "#ffffff", { weight: 600 }) +
      plate(cc, L - 13.6, 7.4) });
};

// ---------- The diesel locomotive: a hood unit ----------
// 661 (EMD G26): the cab on the left with the short hood ahead of it and
// the long hood behind, a walkway along the side. Dark green; yellow bands
// sweep back from the front along the short hood and the cab and run out
// on the long hood; a yellow stripe along the frame; a yellow and black
// chevron buffer beam; "ЖС" in red. The short hood is as tall as the long
// one, as photographed on 661-155.
const D661 = { green: "#1f5a3c", dark: "#174630", yellow: "#f2c21a", red: "#d8262c", frame: "#24272b" };
const srbijavoz661 = (c) => {
  const L = c.L, deck = 4.4, roof = 13.0, hood = 11.4;
  const d = poly([[0.7, deck], [0.7, hood - 0.6], ["q", 0.7, hood, 1.3, hood], [7.6, hood], [7.6, roof - 0.4],
    ["q", 7.6, roof, 8.2, roof], [14.0, roof], ["q", 14.6, roof, 14.6, roof - 0.6], [14.6, hood], [L - 0.7, hood], [L - 0.7, deck]]);
  let s = truck(L / 2 - 12.5, { wb: 12, d: 40, kind: "loco", top: deck, axles: 3 }) +
    truck(L / 2 + 12.5, { wb: 12, d: 40, kind: "loco", top: deck, axles: 3 });
  // The fuel tank between the trucks; the buffers and the chevron beam.
  s += tank(L / 2 - 6, L / 2 + 6, deck, 1.3) + buffers(0, -1, { sill: deck, end: 0.7 }) + buffers(L, 1, { sill: deck, end: 0.7 });
  for (const x of [0.75, L - 2.15]) s += rect(x, 1.5, 1.4, 1.5, D661.yellow, 0.4) + lines([[x + 0.1, 1.6, x + 0.6, 2.9], [x + 0.6, 1.6, x + 1.1, 2.9]], "#17191c", 1.4);
  const liv = rect(0, 0, L, 14, D661.green) +
    rect(14.6, hood - 0.45, L - 15.3, 0.45, D661.dark) + rect(7.6, roof - 0.45, 7.0, 0.45, D661.dark) + rect(0.7, hood - 0.45, 6.9, 0.45, D661.dark) +
    // The yellow stripe along the frame, a green line through it.
    rect(0, deck, L, 0.75, D661.yellow) + rect(0, deck + 0.32, L, 0.12, D661.green) +
    // The yellow bands from the front, along the short hood and the cab,
    // running out to a point on the long hood: one broad, two fine.
    path(`M0 7.4L15.5 7.4L22.5 8.05L15.5 8.7L0 8.7Z`, D661.yellow) +
    rect(0, 7.72, 16.5, 0.1, D661.green) + rect(0, 8.3, 16.5, 0.1, D661.green);
  s += hoodShell(d, D661.green, liv);
  // The cab's side windows, the number under them; the "ЖС" on the hood.
  s += win(8.5, 10.0, 2.2, 2.2, 0.35) + win(11.3, 10.0, 2.2, 2.2, 0.35) +
    letters(c, 11.1, 6.3, 0.6, "661-155", "#e8eaec", { weight: 600 }) + zsMark(c, 19.0, 9.6, 0.8, D661.red);
  // The long hood's doors and grilles, the radiator at the far end; the
  // short hood's louvers; the hand rails, yellow as photographed.
  s += lines(seq(18.5, 3.1, 9).map((x) => [x, deck + 0.9, x, hood - 0.5]), "rgba(0,0,0,0.25)", 0.45) +
    rect(L - 11.5, 6.4, 8.0, 3.8, "rgba(10,12,14,0.45)", 0.4) + slats(L - 11.5, 6.4, 8.0, 3.8, 0.32, "rgba(255,255,255,0.16)") +
    rect(5.2, 9.2, 1.4, 1.6, "rgba(10,12,14,0.4)", 0.4) + slats(5.2, 9.2, 1.4, 1.6, 0.28, "rgba(255,255,255,0.16)") +
    handrail(15.5, L - 1, deck, 1.6, D661.yellow) + handrail(1.0, 6.0, deck, 1.6, D661.yellow);
  // The exhaust stacks and the radiator fans on the long hood's roof; the
  // twin headlights high on the short hood's front, a marker lamp below.
  s += exhaust(L * 0.52, hood) + rect(L - 12, hood - 0.05, 4, 0.35, "#4c5258", 0.4, 'rx="0.1"') + rect(L - 7, hood - 0.05, 4, 0.35, "#4c5258", 0.4, 'rx="0.1"') +
    rect(0.75, 10.2, 0.45, 0.8, "#fff4cf", 0.35, 'rx="0.15"') + rect(0.75, 6.6, 0.4, 0.4, "#fff4cf", 0.3, 'rx="0.1"');
  return s;
};

// ---------- The regional diesels: the 711 and the 710 ----------

// 711 (Metrovagonmash RA2): grey-silver, red over the nose and in a band
// under the windows, a white line round the window band, red along the
// roof's edge, a grey skirt; red doors; "ЖС" in a white ring.
const R711 = { grey: "#9a9c9d", red: "#e02a1c", white: "#f3f4f5", skirt: "#8a8c8d", roof: "#85888a", black: "#17191c" };
const R7G = { roof: 13.0, sill: 3.6 };
const NOSE_711 = [[1.5, 3.6], [0.9, 4.8], ["q", 0.7, 6.2, 2.0, 7.6], [6.0, 12.2], ["q", 7.0, 13.0, 9.8, 13.0]];
function r711Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, R711.grey], [12.6, 3, R711.roof], [12.2, 0.4, R711.red], [4.7, 2.7, R711.red], [0, 4.7, R711.skirt]]);
    if (!cab) return s + rect(-1, 7.4, L + 2, 0.32, R711.white) + rect(-1, 11.5, L + 2, 0.32, R711.white);
    // The red nose, round the windshield's grey surround and back to the
    // cab's window; the white line round the window band, closed in a
    // curve ahead of the cab's window.
    s += path("M-1 4.7L-1 13L8.6 13Q10.6 10.4 11.0 7.4L11.0 4.7Z", R711.red) +
      path("M2.6 7.0L7.4 12.4L8.6 12.4L8.6 10.6L4.4 6.6Z", R711.grey) +
      rect(10.9, 7.4, L, 4.42, R711.white, 0, 'rx="2.0"') + rect(11.25, 7.72, L, 3.78, R711.grey, 0, 'rx="1.75"');
    return s;
  };
}
const r711Door = (x) => ({ x, w: 3.6, y0: R7G.sill + 0.15, y1: 11.0, leaves: 2, glassY: 0.52, glassH: 0.34, grabs: false, fill: R711.red });
const r711Cab = (c) => unit(c, { roof: R7G.roof, sill: R7G.sill, nose: NOSE_711, rake: [[2.0, 7.6], [6.0, 12.2]], depth: 3.0, cabLen: 11, lampY: 5.6, bare: true, surround: "#6f7274",
  rows: [{ xs: [13.0], y: 8.2, w: 2.8, h: 2.8, r: 0.35 }, { xs: [22.0, 26.9], y: 8.1, w: 4.2, h: 2.9, r: 0.35 },
    { xs: seq(37.5, 5.2, 4), y: 8.1, w: 4.2, h: 2.9, r: 0.35 }, { xs: [65.0, 70.2], y: 8.1, w: 4.2, h: 2.9, r: 0.35 }],
  doors: [r711Door(32.3), r711Door(59.6)], trucks: [12.0, c.L - 11.0], wheel: 34, paint: r711Paint(true),
  extra: (cc, g) => zsRing(cc, 19.0, 9.6, 1.05, "#ffffff", R711.grey) + letters(cc, 7.6, 5.9, 0.6, "711-101", "#ffffff", { weight: 600 }) +
    hvac(22, R7G.roof, 10, 0.6) + exhaust(44, R7G.roof) + hvac(g.L - 20, R7G.roof, 10, 0.6) +
    boxes(20, 34, R7G.sill, 2, 1.2) + tank(37, 46, R7G.sill, 1.5) + boxes(49, g.L - 18, R7G.sill, 1, 1.2) });
const r711Mid = (c) => unit(c, { roof: R7G.roof, sill: R7G.sill,
  rows: [{ xs: seq(3.5, 5.2, 3), y: 8.1, w: 4.2, h: 2.9, r: 0.35 }, { xs: seq(26.5, 5.2, 5), y: 8.1, w: 4.2, h: 2.9, r: 0.35 }, { xs: seq(59.2, 5.2, 3), y: 8.1, w: 4.2, h: 2.9, r: 0.35 }],
  doors: [r711Door(20.5), r711Door(53.5)], trucks: [11.0, c.L - 11.0], wheel: 34, paint: r711Paint(false),
  extra: (cc, g) => hvac(10, R7G.roof, 10, 0.6) + hvac(g.L - 20, R7G.roof, 10, 0.6) + boxes(18, g.L - 18, R7G.sill, 3, 1.2) });

// 710 (the Swedish Y1): one long car on two trucks. White over blue, a
// thin blue line under the windows and one at the eave, a white roof, a
// red plow under the buffers. The real car has a cab at each end; only
// the left one is drawn (see the header).
const R710 = { white: "#f2f3f4", blue: "#1f63b8", roof: "#e3e5e7", red: "#b8382c", frame: "#3a3d42", black: "#17191c" };
const R0G = { roof: 13.0, sill: 3.8 };
const NOSE_710 = [[1.2, 3.8], [0.9, 7.0], ["q", 0.9, 7.8, 1.3, 8.6], [2.3, 12.0], ["q", 2.7, 13.0, 4.6, 13.0]];
const r710Paint = (c, g) => bands(g.L, [[0, 20, R710.white], [12.3, 3, R710.roof], [11.75, 0.16, R710.blue], [4.1, 3.3, R710.blue], [7.62, 0.22, R710.blue]]);
const r710Door = (x) => ({ x, w: 2.8, y0: R0G.sill + 0.15, y1: 11.2, leaves: 2, glassY: 0.5, glassH: 0.36, grabs: false, fill: R710.white });
const srbijavoz710 = (c) => unit(c, { roof: R0G.roof, sill: R0G.sill, nose: NOSE_710, rake: [[1.3, 8.6], [2.3, 12.0]], depth: 2.4, cabLen: 5, lampY: 5.6, coupler: "buffers", surround: R710.black,
  rows: [{ xs: [5.8], y: 8.5, w: 2.2, h: 2.6, r: 0.3 }, { xs: seq(13.6, 4.8, 11), y: 8.2, w: 3.6, h: 2.9, r: 0.35 }, { xs: [c.L - 8.0], y: 8.5, w: 2.2, h: 2.6, r: 0.3 }],
  doors: [r710Door(9.4), r710Door(c.L - 12.6)], trucks: [11.5, c.L - 11.5], wheel: 33, paint: r710Paint,
  // The red plow under the nose.
  cab: () => path(poly([[1.0, 3.3], [5.4, 3.3], [5.0, 1.3], [2.0, 0.8], [0.6, 1.6]]), R710.red, 0.4),
  extra: (cc, g) => letters(cc, 7.2, 6.3, 0.6, "710-003", "#ffffff", { weight: 600 }) +
    seq(14, 13, 5).map((x) => rect(x, R0G.roof - 0.05, 1.8, 0.4, R710.roof, 0.4, 'rx="0.15"')).join("") + exhaust(g.L / 2 + 3, R0G.roof) +
    boxes(18, 33, R0G.sill, 2, 1.2) + tank(36, 45, R0G.sill, 1.5) + boxes(48, g.L - 18, R0G.sill, 2, 1.2) });

// ---------- The Goša coach ----------
// The coach behind 441-075 at Belgrade-Glavna: silver-grey, the windows
// in a blue band, blue doors, a grey roof. On two trucks, a door at each
// end, ten windows between (the standard UIC coach's arrangement).
const GO = { silver: "#cfd2d6", blue: "#2456b4", roof: "#868b91", skirt: "#3a3d42" };
const srbijavozCoach = (c) => {
  const L = c.L;
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base: GO.silver, badge: false, under: true,
    trucks: { centers: L - 23.6, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.5, w: 4.4, h: 3.0, pitch: 6.3, r: 0.45 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, GO.roof], [7.0, 4.0, GO.blue], [0, 4.25, GO.skirt]]) +
      // The doors are blue: painted behind their translucent panels.
      rect(2.0, 4.05, 2.6, 7.0, GO.blue) + rect(L - 4.6, 4.05, 2.6, 7.0, GO.blue),
    extra: (cc) => hvac(L / 2 - 7, 13.3, 14, 0.7) +
      buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
};

// For zpcg.cars.js: the Belgrade–Bar train's locomotive and coach.
export const zs461Draw = srbijavoz461;
export const gosaCoachDraw = srbijavozCoach;

// ---------- Tables ----------

export const TYPES = {
  srbijavozSokoCab: { name: "Soko KISS 410 end car", kind: "emu" },
  srbijavozSokoMid: { name: "Soko KISS 410 intermediate car", kind: "emu" },
  srbijavozFlirtCab: { name: "FLIRT 413 end car", kind: "emu" },
  srbijavozFlirtMid: { name: "FLIRT 413 intermediate car", kind: "emu" },
  srbijavozBgvozCab: { name: "ŽS 412 BG Voz end car", kind: "emu" },
  srbijavozBgvozMid: { name: "ŽS 412 BG Voz intermediate car", kind: "emu" },
  srbijavoz441: { name: "ŽS 441 electric locomotive", kind: "electric" },
  srbijavoz461: { name: "ŽS 461 electric locomotive", kind: "electric" },
  srbijavoz661: { name: "ŽS 661 diesel locomotive", kind: "diesel" },
  srbijavoz711Cab: { name: "ŽS 711 driving car", kind: "emu" },
  srbijavoz711Mid: { name: "ŽS 711 intermediate car", kind: "emu" },
  srbijavoz710: { name: "ŽS 710 railcar", kind: "emu" },
  srbijavozCoach: { name: "Goša coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or to the joint's center), from the figures
// usually published, set down from memory and not checked for this file,
// so each is a judgement: the Soko about 106 m as four cars; the FLIRT
// about 75 m as four cars; the 412 about 20 m a car; the 441 15.5 m (drawn
// a little over); the 461 19.8 m; the 661 about 18 m; the 711 about 23 m a
// car; the 710 24.4 m; the coach 24.5 m.
export const MODELS = {
  srbijavozSokoCab: M(sokoCab, 87.0, true),
  srbijavozSokoMid: M(sokoMid, 87.0, false, byIndex),
  srbijavozFlirtCab: M(flirtCab, 61.0, true),
  srbijavozFlirtMid: M(flirtMid, 61.0, false, byIndex),
  srbijavozBgvozCab: M(bgvozCab, 66.0, true),
  srbijavozBgvozMid: M(bgvozMid, 66.0),
  srbijavoz441: M(srbijavoz441, 52.0),
  srbijavoz461: M(srbijavoz461, 64.0),
  srbijavoz661: M(srbijavoz661, 59.0),
  srbijavoz711Cab: M(r711Cab, 76.0, true),
  srbijavoz711Mid: M(r711Mid, 76.0),
  srbijavoz710: M(srbijavoz710, 80.0, true),
  srbijavozCoach: M(srbijavozCoach, 80.0),
};

const set = (label, ...units) => ({ label, units });
const hauled = (loco, name, k, why) => set(`Typical: a ${name} locomotive and ${k} Goša coaches (which locomotive is a judgement${why ? `: ${why}` : ""}; the timetable names none)`,
  [loco, 1], ["srbijavozCoach", k]);
const SOKO_SET = set("Typical: a four-car Soko KISS 410 set (a judgement: the timetable names no unit; the Soko works the IC 540–557 Beograd–Subotica)",
  ["srbijavozSokoCab", 1], ["srbijavozSokoMid", 2], ["srbijavozSokoCab", 1]);
const FLIRT_SET = set("Typical: a four-car FLIRT 413 set (a judgement: the timetable names no unit; the FLIRT works the electrified regional lines)",
  ["srbijavozFlirtCab", 1], ["srbijavozFlirtMid", 2], ["srbijavozFlirtCab", 1]);
const BGVOZ_SET = set("Typical: a four-car ŽS 412 BG Voz set (a judgement: the timetable names no unit; the 412 works the BG Voz line to Pančevo Vojlovica)",
  ["srbijavozBgvozCab", 1], ["srbijavozBgvozMid", 2], ["srbijavozBgvozCab", 1]);
const R711_SET = set("Typical: a three-car ŽS 711 diesel unit (a judgement: the timetable names no unit, and the sets run as two or three cars; the 711 works the lines without wires)",
  ["srbijavoz711Cab", 1], ["srbijavoz711Mid", 1], ["srbijavoz711Cab", 1]);
const R710_SET = set("Typical: a single ŽS 710 railcar (a judgement: the timetable names no unit; the 710 works the Zaječar lines)",
  ["srbijavoz710", 1]);

// The timetable (the community Srbijavoz GTFS) names no locomotive or
// unit, so a train is placed by its number's category and by its line's
// name. Every rule is a judgement.
//   IC: the Soko, which works the IC 540–557 Beograd–Subotica.
//   B 433: the Belgrade–Bar train, a 461 and five coaches (the six-axle
//     461 is the Bar line's locomotive).
//   B 620–623: Beograd–Zvornik, over a line without wires: a 661 and four
//     coaches.
//   Other B (fast) trains: a 441 and four coaches.
//   IR and ReX: the FLIRT.
//   Re (regional): by the line's name. To Pančevo Vojlovica: the BG Voz
//     412. A Zaječar line: the 710 railcar. A line without wires (Sombor,
//     Zrenjanin, Kikinda, Senta, Šabac, Kraljevo, Požega, Rudnica,
//     Jagodina, Majdanpek, Prahovo, Vršac, Karavukovo in its name): the
//     711. Otherwise the FLIRT.
//   Anything not placed: the FLIRT.
// NFD would decompose Cyrillic й and ї (Київ -> "киів", Кривий ->
// "кривии") and strip the combining mark, so they are parked on
// private-use code points while the Latin diacritics are stripped, then
// put back.
const fold = (s) => String(s || "").replace(/[йЙ]/g, "").replace(/[їЇ]/g, "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(//g, "й").replace(//g, "ї")
  .replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const ends = (t) => {
  const a = fold(t.origin), b = fold(t.destination || t.dest);
  if (a || b) return `${a} ${b}`;
  return fold(String(t.route || t.line || "").replace(/ – /g, " "));
};
const ZAJECAR_LINES = /(зајечар)/;
const DIESEL_LINES = /(сомбор|зрењанин|кикинда|сента|шабац|краљево|пожега|рудница|јагодина|мајданпек|прахово|вршац|каравуково)/;
export const TYPICAL = {
  srbijavoz: (t = {}) => {
    const num = String(t.number || "").trim();
    // The line's name (a short working's own ends can lie on a wired
    // main line, so the line decides); the train's ends only without one.
    const r = fold(t.route || t.line) || ends(t);
    if (/^IC /.test(num)) return SOKO_SET;
    if (/^B 433/.test(num)) return hauled("srbijavoz461", "ŽS 461 electric", 5, "the 461 works the Belgrade–Bar line");
    if (/^B 62[0-3]/.test(num)) return hauled("srbijavoz661", "ŽS 661 diesel", 4, "the Beograd–Zvornik line has no wires");
    if (/^B /.test(num)) return hauled("srbijavoz441", "ŽS 441 electric", 4);
    if (/^(IR|ReX) /.test(num)) return FLIRT_SET;
    if (/^Re /.test(num)) {
      if (/панчево војловица/.test(r)) return BGVOZ_SET;
      if (ZAJECAR_LINES.test(r)) return R710_SET;
      if (DIESEL_LINES.test(r)) return R711_SET;
      return FLIRT_SET;
    }
    return FLIRT_SET;
  },
};

// Sources: the photograph each drawing was made from (Wikimedia Commons).
// Builders are the commonly published ones, set down from memory; top
// speeds are given only where Trainsheet is confident of them.
const CM = "https://commons.wikimedia.org/wiki/File:";
const fSoko = { model: "Soko (Stadler KISS, class 410)", type: "Double-deck electric multiple unit", builder: "Stadler", topSpeedMph: 125, lengthFt: 87.0,
  source: `${CM}Soko_KISS_410_418.jpg` };
const fFlirt = { model: "FLIRT 3 (class 413)", type: "Electric multiple unit", builder: "Stadler", topSpeedMph: 100, lengthFt: 61.0,
  source: `${CM}%C5%BDS_413_006_3.jpg` };
const fBgvoz = { model: "ŽS 412", type: "Electric multiple unit", builder: "RVR (Rīgas Vagonbūves Rūpnīca)", lengthFt: 66.0,
  source: `${CM}Railway_bridges_belgrade_railway_junction.JPG` };
const f711 = { model: "ŽS 711 (Metrovagonmash RA2)", type: "Diesel multiple unit", builder: "Metrovagonmash", topSpeedMph: 75, lengthFt: 76.0,
  source: `${CM}Serbian_Railways_Class_711.jpg` };
export const FACTS = {
  srbijavozSokoCab: { ...fSoko,
    about: "An end car of the Soko (\"falcon\"), Stadler's double-deck KISS set for the Belgrade–Novi Sad–Subotica high-speed line: white with a dark roof, the upper deck's windows in a red band over a blue one, blue along the bottom, red doors, and \"СОКО\" in blue under a red and blue wing behind the cab. The set photographed at Novi Beograd is 410 006, seen from the front, so the windows a car are a reading. Drawn as a four-car set." },
  srbijavozSokoMid: { ...fSoko,
    about: "An intermediate car of a Soko set, in the same red, blue and white. Its windows, its doors' places and where the pantograph sits are Trainsheet's reading; the photograph shows an end car from the front." },
  srbijavozFlirtCab: { ...fFlirt,
    about: "An end car of the class 413, Stadler's FLIRT 3 for Serbia's electrified regional lines: red over the nose, roof and skirt, the side blue from a wave sweeping up behind the cab, white doors, the \"ЖС\" mark in a white ring and a short yellow stripe by the first door. The set photographed at Belgrade is 413 006. Drawn as a four-car set on shared trucks; the windows past the first car are a reading." },
  srbijavozFlirtMid: { ...fFlirt,
    about: "An intermediate car of a class 413 FLIRT, blue between a red roof and a red skirt, with white doors. Its windows and where the pantograph sits are a reading; the photograph shows the set from the front." },
  srbijavozBgvozCab: { ...fBgvoz,
    about: "An end car of the class 412, the Riga-built electric unit that works Belgrade's BG Voz city line: boxy, light blue with a pale window band, a grey roof, red doors and a flat blue front, the pantograph on the leading car. Drawn from a distant photograph of a set on the Belgrade junction's bridges (the only one Trainsheet had for this fleet), so the windows, the doors and the side's detail are a reading. Drawn as a four-car set." },
  srbijavozBgvozMid: { ...fBgvoz,
    about: "An intermediate car of a class 412 BG Voz set, light blue with red doors. Its windows and doors are a reading; the photograph is distant and from above." },
  srbijavoz441: { model: "ŽS 441", type: "Electric locomotive", builder: "ASEA (licence-built)", lengthFt: 52.0,
    source: `${CM}%C5%BDS_441_in_Belgrade-Glavna_railway_station.jpg`,
    about: "The class 441, the four-axle electric locomotive of ASEA's design that is Serbia's standard main-line engine: bright red all over with a grey skirt, round portholes along the side, louvers under the roof and \"ЖС\" in white. The one photographed at Belgrade-Glavna is 441-075; an older red, white and blue paint is photographed near Priboj (commons.wikimedia.org/wiki/File:ŽS_441_in_Priboj.jpg) and is not drawn. The portholes' number and spacing are a reading of a three-quarter view. Which trains it hauls is a judgement." },
  srbijavoz461: { model: "ŽS 461", type: "Electric locomotive", builder: "Electroputere", lengthFt: 64.0,
    source: `${CM}%C5%BDS_461-157.jpg`,
    about: "The class 461, the six-axle Romanian-built electric locomotive of the mountain line to Bar: dark crimson all over with a dark grey skirt, oval portholes along the side, louvers under the roof and two pantographs. The one photographed is 461-157. The portholes' spacing and the lettering's place are a reading of a three-quarter view; drawing it on the Belgrade–Bar train is a judgement." },
  srbijavoz661: { model: "ŽS 661 (EMD G26)", type: "Diesel locomotive", builder: "Electro-Motive Diesel", lengthFt: 59.0,
    source: `${CM}%C5%BDS_661_between_Dimitrovgrad_and_Pirot.jpg`,
    about: "The class 661, EMD's six-axle G26 hood unit: dark green with yellow bands sweeping back from the front along the cab, a yellow stripe along the frame, a yellow and black chevron buffer beam and \"ЖС\" in red. The one photographed between Dimitrovgrad and Pirot is 661-155, on a freight, seen nearly head-on, so the long hood's doors and grilles are a reading. Drawing it on the Beograd–Zvornik trains is a judgement." },
  srbijavoz711Cab: { ...f711,
    about: "A driving car of the class 711, Metrovagonmash's RA2 diesel unit for the lines without wires: grey-silver with red over the nose and in a band under the windows, a white line round the window band and \"ЖС\" in a white ring. The one photographed is 711-101, showing \"DOBRO DOŠLI\" (welcome) on its display. The photograph is a front view of one car, so the windows and doors are a reading. Drawn as a three-car set, a judgement: the sets run as two or three cars." },
  srbijavoz711Mid: { ...f711,
    about: "An intermediate car of a class 711 diesel unit, grey-silver with a red band under the windows and red doors. Its windows and doors are a reading; the photograph shows a driving car from the front." },
  srbijavoz710: { model: "ŽS 710 (ex-Swedish Y1)", type: "Diesel railcar", builder: "Kalmar Verkstad", topSpeedMph: 81, lengthFt: 80.0,
    source: `${CM}%C5%BDS_710_near_Matejevac.jpg`,
    about: "The class 710, the Swedish Y1 railcar bought second-hand for Serbia's quietest lines: white over blue with a thin blue line under the windows, a white roof and a red plow. The one photographed near Matejevac is 710-003, at distance, so the windows' number is a reading. The real car has a cab at each end; Trainsheet draws it with one cab nose." },
  srbijavozCoach: { model: "Goša coach", type: "Locomotive-hauled passenger coach", builder: "Goša", lengthFt: 80.0,
    source: `${CM}%C5%BDS_441_in_Belgrade-Glavna_railway_station.jpg`,
    about: "A coach of the kind built by Goša of Smederevska Palanka: silver-grey with the windows in a blue band, blue doors and a grey roof — as the coach behind 441-075 at Belgrade-Glavna, which is seen end-on, so the windows and length are those of the standard coach, not counted from the photograph." },
};
