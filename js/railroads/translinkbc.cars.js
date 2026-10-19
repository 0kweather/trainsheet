// The West Coast Express's trains (scripts/railroads/translinkbc.py): an
// EMD F59PHI (or the MotivePower MP36PH-3C, or the rebuilt F59PH) at the
// Mission end, Bombardier BiLevel coaches, and a BiLevel cab car at the
// Waterfront end. Trainsheet's own side views, from published dimensions and
// photographs of the cars in today's paint; the lettering is drawn as type,
// not copied from TransLink's or the West Coast Express's logos.

import { bilevel, cabUnit } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, slats, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;

// The West Coast Express's colors since 1995: a violet blue, a golden
// yellow, white, and a thin teal line under the yellow along the sill.
const WCE = { blue: "#423f97", deep: "#2f2c78", yellow: "#f1b928", white: "#eef0f2", teal: "#1d9a8c", black: "#1b1c22", grey: "#c9ccd2" };

// ---------- Drawing helpers ----------

const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering h ft tall centered at (x, y), reading left to right even on a
// car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, italic = false, spacing = 0, anchor = "middle", family = SANS } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="${anchor}" font-weight="${weight}"` +
  `${italic ? ' font-style="italic"' : ""}${spacing ? ` letter-spacing="${spacing}"` : ""} font-family="${family}" fill="${fill}">${text}</text>`;
// A smooth curve through points (Catmull-Rom as cubic Béziers), as path data
// without its opening move.
function through(pts) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}
// The paint between two curves (each [[x, y], ...], left to right).
const band = (top, bottom, fill) => {
  const back = [...bottom].reverse();
  return path(`M${r2(top[0][0])} ${r2(top[0][1])}${through(top)}L${r2(back[0][0])} ${r2(back[0][1])}${through(back)}Z`, fill);
};
// Bands given as key points [x, y1, y2, ...] down the body: the curve
// through each column of heights, from the top.
const curves = (keys) => keys[0].slice(1).map((_, k) => keys.map((p) => [p[0], p[k + 1]]));

// The West Coast Express's name as on its cars: "WEST COAST" in blue on a
// slanted yellow tab, "EXPRESS" in big blue italics after it; on the
// coaches a blue mark of two peaks over a train before it (drawn simply,
// not the logo artwork). x: where the name starts, h: the cap height.
function wceName(c, x, y, h, { mark = false } = {}) {
  // Drawn in its own frame (x right, y down, the cap height 1), from x;
  // on a car drawn mirrored, turned so it still reads left to right.
  let s = "";
  if (mark) {
    s += path(poly([[-4.0, 0.9], [-2.75, -0.95], [-2.15, -0.05], [-1.7, -0.75], [-0.6, 0.9]]), WCE.blue) +
      path("M-3.85 0.55Q-2.3 0.15 -0.75 0.5", "none", 0, `stroke="${WCE.white}" stroke-width="0.3"`);
  }
  s += path(poly([[0.35, -0.62], [5.75, -0.62], [5.75, 0.62], [0, 0.62]]), WCE.yellow);
  s += `<text x="2.95" y="0.31" font-size="0.86" text-anchor="middle" font-weight="700" font-style="italic" font-family="${SANS}" fill="${WCE.blue}">WEST COAST</text>`;
  s += `<text x="5.9" y="0.45" font-size="1.25" text-anchor="start" font-weight="700" font-style="italic" font-family="${SANS}" fill="${WCE.blue}">EXPRESS</text>`;
  const w = 11.4;  // the name's length in its frame, from x
  return `<g transform="translate(${r2(c.mirrored ? x + w * h : x)} ${r2(y)}) scale(${c.mirrored ? -h : h} ${-h})">${s}</g>`;
}
// TransLink's name, small, as on every car: TRANS and LINK either side of a
// little swoosh (drawn as type).
const translink = (c, x, y, h, fill = WCE.blue) => letters(c, x, y, h, "TRANS⁄LINK", fill, { weight: 700, spacing: 0.02 });

// Horns and a bell on a roof; the headlight and marker lamp on a nose.
const horns = (x, roof) => rect(x, roof - 0.05, 1.5, 0.3, "#5a6068", 0.3, 'rx="0.1"') +
  path(poly([[x + 0.2, roof + 0.25], [x - 0.4, roof + 0.55], [x - 0.4, roof + 0.85], [x + 0.2, roof + 0.55]]), "#6a7078") +
  path(poly([[x + 1.2, roof + 0.25], [x + 1.9, roof + 0.5], [x + 1.9, roof + 0.8], [x + 1.2, roof + 0.55]]), "#6a7078");
const bell = (x, roof) => rect(x - 0.15, roof - 0.05, 0.3, 0.4, "#5a6068") + path(`M${r2(x - 0.45)} ${r2(roof + 0.35)}Q${r2(x - 0.45)} ${r2(roof + 1.05)} ${r2(x)} ${r2(roof + 1.05)}Q${r2(x + 0.45)} ${r2(roof + 1.05)} ${r2(x + 0.45)} ${r2(roof + 0.35)}Z`, "#b49a3c", 0.3);
const lamp = (x, y, r = 0.38) => circle(x, y, r + 0.12, "#d6d9de", 0.35) + circle(x, y, r, "#fff6d0") + circle(x, y, r * 0.45, "#ffffff");
const marker = (x, y, r = 0.3) => circle(x, y, r + 0.1, "#d6d9de", 0.3) + circle(x, y, r, "#c8202e");
// A locomotive's ribbed fuel tank, painted blue as the West Coast
// Express's are, with its filler and gauge.
function fuelTank(x0, x1, top, bottom = 1.5) {
  let s = path(poly([[x0, top], [x1, top], [x1, bottom + 0.9], ["q", x1, bottom, x1 - 0.9, bottom], [x0 + 0.9, bottom], ["q", x0, bottom, x0, bottom + 0.9]]), WCE.blue, 0.4);
  s += lines(seq(bottom + 0.45, 0.42, Math.floor((top - bottom - 0.6) / 0.42)).map((y) => [x0 + 0.4, y, x1 - 0.4, y]), "rgba(255,255,255,0.22)", 0.5);
  return s + circle(x0 + (x1 - x0) * 0.27, top - 1.05, 0.28, "#1d1f22") + rect(x0 + (x1 - x0) * 0.62, top - 1.2, 0.5, 0.5, "#e8e9ec", 0.3);
}
// A locomotive's pilot in the body color: the plow raked back from the
// nose, the coupler pocket and the MU and air hoses under the headlights.
function bluePilot(fx, sill) {
  let s = path(poly([[fx + 0.15, sill + 0.05], [fx + 4.4, sill + 0.05], [fx + 3.9, 2.9], [fx + 3.2, 0.5], [fx + 1.0, 0.5], [fx + 0.1, 2.2]]), WCE.blue, 0.5);
  s += rect(fx - 0.3, 2.45, 1.6, 0.8, "#2a2d31", 0, 'rx="0.15"') + rect(fx - 0.35, 2.2, 0.45, 1.3, "#2a2d31", 0, 'rx="0.12"');
  s += path(`M${r2(fx + 1.4)} ${r2(sill - 0.2)}Q${r2(fx + 0.7)} ${r2(sill - 1.4)} ${r2(fx + 1.6)} ${r2(sill - 1.6)}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.8" stroke-linecap="round"');
  return s + lines([[fx + 0.5, 1.8, fx + 3.4, 1.8]], "rgba(255,255,255,0.3)", 0.5);
}
// Grab irons and the steps at a cab door; the yellow ladder up the side.
const ladder = (x, y0, y1) => lines([[x, y0, x, y1], [x + 0.95, y0, x + 0.95, y1], ...seq(y0 + 0.45, 0.9, Math.floor((y1 - y0) / 0.9)).map((y) => [x, y, x + 0.95, y])], WCE.yellow, 0.8);

// The locomotives' scheme, the same on each body: blue over the roof and
// cab; under it a yellow band from the nose back along the body, a blue band
// under that, white below; both bands rise in a long wave toward the rear,
// the yellow filling the radiator end. A yellow line over a teal one along
// the bottom of the side, blue frame and fuel tank below. keys: [x, top of
// the yellow, yellow to blue, blue to white] down the body.
function locoPaint(L, keys, sill) {
  const [top, mid, low] = curves(keys);
  let s = rect(0, 0, L, 17, WCE.blue);
  s += band(low, [[-1, sill + 1.1], [L + 1, sill + 1.1]], WCE.white);
  s += band(top, mid, WCE.yellow);
  s += rect(0, sill + 0.55, L, 0.5, WCE.yellow) + rect(0, sill + 0.4, L, 0.17, WCE.teal) + rect(0, 0, L, sill + 0.4, WCE.blue);
  return s;
}

// --- EMD F59PHI (901-905, built 1995 at London, Ontario): 58 ft 7 in over
// the couplers, 15 ft 7 in over the cab roof; Blomberg trucks 35 ft 7 in
// apart, 9 ft wheelbase, 40 in wheels; a 3,000 hp 12-710G3 with its
// head-end-power generator behind it. A long, rounded nose under a raked
// two-piece windshield, the cab side window, then the crew door with a
// ladder each side; the inertial-filter box and the dynamic brake blister
// on the roof behind the cab, an intake grille high on the side, and the
// radiator grilles along the top of the rear third with three fans over
// them. Measurements from EMD's and Wikipedia's figures (length, height,
// trucks, wheels); door, window and grille places from photographs of 901
// and 904 side-on (Wikimedia Commons), allowing for their perspective.
// Paint as on 904 in the 2010s: the WCE scheme (above), the name tab behind
// the cab door's yellow ladder, TRANS LINK small under the cab window, the
// headlight and the red marker in the white low on the nose.
const F59_NOSE = [[2.2, 4.6], ["q", 1.1, 4.8, 0.9, 6.2], ["q", 0.9, 8.4, 1.8, 9.9], [3.1, 10.5], [6.2, 14.6], ["q", 7.0, 15.58, 8.6, 15.58],
  [15.6, 15.58], ["q", 16.6, 15.58, 17.2, 15.1]];
const F59_KEYS = [[-1, 9.2, 7.9, 6.3], [0.6, 9.4, 8.0, 6.6], [2.5, 10.5, 8.8, 7.5], [6, 11.0, 9.4, 8.2], [15, 11.2, 9.6, 8.5], [30, 11.4, 9.8, 8.7],
  [38, 11.8, 10.1, 9.0], [45, 13.0, 10.8, 9.4], [52, 14.3, 12.0, 10.4], [58.58, 15.2, 13.0, 11.2], [59.6, 15.2, 13.1, 11.3]];
export function f59phi(c) {
  const L = c.L;
  return cabUnit(c, {
    roof: 15.05, sill: 4.6, rearR: 0.9, nose: F59_NOSE, top: [[18.4, 15.05]],
    glass: [[[3.35, 10.75], [6.25, 14.35], [7.6, 14.35], [7.6, 10.75]], [[7.85, 10.75], [7.85, 14.35], [8.9, 14.35], [8.9, 10.75]]],
    sideWin: [[10.1, 11.35, 3.0, 2.2]],
    doors: [[13.6, 2.0, 5.2, 14.3]],
    grilles: [[37.0, 11.4, 5.8, 2.1, 0.32], [43.5, 11.6, 13.6, 3.0, 0.42]],
    panels: [[10.0, 5.6, 3.3, 2.6], [20.2, 5.7, 3.0, 5.6], [23.6, 5.7, 3.0, 5.6], [27.0, 5.7, 3.0, 5.6], [30.4, 5.7, 3.0, 5.6], [33.8, 5.7, 3.0, 5.6]],
    reservoir: [28.4, 37.6],
    trucks: { centers: 35.58, wb: 9.0, d: 40 },
    fans: [L - 12.6, L - 8.0, L - 3.5],
    base: WCE.blue,
    paint: () => locoPaint(L, F59_KEYS, 4.6),
    extra: (c) => fuelTank(18.5, 40.5, 4.6) + bluePilot(0.85, 4.6) +
      // The inertial-filter box and the dynamic brake blister on the roof.
      path(poly([[22.6, 15.0], [23.0, 15.55], [29.6, 15.55], [30.0, 15.0]]), WCE.blue, 0.4) + slats(23.4, 15.05, 5.8, 0.42, 0.28, "rgba(0,0,0,0.4)") +
      path(`M30.6 15.0Q31.2 15.6 32.4 15.6L34.6 15.6Q35.8 15.6 36.4 15.0Z`, WCE.blue, 0.4) +
      // Upper intake behind the cab, the yellow ladders and grab irons.
      rect(23.4, 12.4, 5.8, 1.6, "rgba(20,22,25,0.55)", 0.4) + slats(23.4, 12.4, 5.8, 1.6, 0.3, "rgba(255,255,255,0.18)") +
      ladder(12.45, 2.2, 13.8) + ladder(15.9, 2.2, 13.8) + line(L - 1.4, 4.9, L - 1.4, 12.5, WCE.yellow, 0.9) +
      lamp(2.0, 6.95) + marker(3.3, 6.95) + rect(3.6, 9.55, 2.1, 0.7, WCE.black, 0, 'rx="0.3"') +
      line(5.3, 13.3, 7.1, 14.2, "#0b0d0f", 0.8) + horns(16.0, 15.58) +
      wceName(c, 41.2, 7.1, 0.85) + translink(c, 11.7, 6.6, 0.42),
  });
}

// --- MotivePower MP36PH-3C (906, built 2006 at Boise): 68 ft over the
// couplers, 15 ft 6 in; Blomberg trucks 42 ft 10 in apart, 9 ft 4 in
// wheelbase, 40 in wheels; a 3,600 hp 16-645F3B and a separate
// head-end-power genset. The MPXpress body GO, Metra and Caltrain run: a
// long, bulbous nose ahead of a raked two-pane windshield, the cab side
// window and the crew door 13 ft back, intakes high along the hood behind
// the dynamic brake, five roof fans (the last cools the genset).
// Measurements from MotivePower's figures, as carmodels.js's mp36 draws
// them. Paint: the WCE scheme laid on its longer body, as photographs of
// 906 at Waterfront show it (Wikimedia Commons, 2024).
const MPX_KEYS = [[-1, 9.0, 7.7, 6.2], [0.6, 9.2, 7.9, 6.5], [3.0, 10.1, 8.8, 7.4], [7, 10.6, 9.3, 8.2], [18, 11.0, 9.7, 8.5], [36, 11.3, 9.9, 8.8],
  [46, 11.9, 10.2, 9.0], [55, 13.1, 10.9, 9.4], [62, 14.2, 12.0, 10.4], [68, 15.0, 12.9, 11.1], [69, 15.0, 13.0, 11.2]];
export function mp36ph(c) {
  const L = c.L;
  return cabUnit(c, {
    roof: 15.5, sill: 4.55, rearR: 1.1,
    nose: [[2.0, 4.55], ["q", 0.6, 4.9, 0.6, 6.4], ["q", 0.7, 8.4, 1.9, 9.1], [3.5, 10.1], [4.7, 12.6], ["q", 5.6, 15.5, 9.5, 15.5]],
    glass: [[[4.0, 10.4], [4.95, 12.45], [6.1, 12.45], [6.1, 10.4]], [[6.3, 10.45], [6.3, 12.45], [8.5, 12.45], [8.5, 10.6]]],
    sideWin: [[9.8, 10.2, 2.8, 1.7]],
    doors: [[13.3, 1.9, 5.0, 12.9]],
    grilles: [[9.0, 5.1, 3.2, 1.3, 0.25], [27.5, 12.4, 9.8, 1.6, 0.36], [37.8, 11.9, 8.4, 2.6, 0.38], [46.6, 11.9, 7.9, 2.6, 0.38], [54.7, 11.9, 11.5, 2.6, 0.38]],
    panels: [[8.6, 4.75, 4.0, 2.0], [29.3, 5.0, 5.9, 3.8], [53.5, 5.0, 6.6, 3.8]],
    reservoir: [21.9, 32.6],
    trucks: { centers: 42.83, wb: 9.33, d: 40 },
    roofItems: [[33, 1.6, 0.6]], fans: [46.7, 51.1, 55.5, 59.9, 64.1], horn: 10.6,
    base: WCE.blue,
    paint: () => locoPaint(L, MPX_KEYS, 4.55),
    extra: (c) => fuelTank(33.1, 48.2, 4.55) + bluePilot(0.55, 4.55) + ladder(15.5, 2.1, 12.4) +
      lamp(1.7, 6.9) + marker(2.9, 6.9) + rect(3.7, 9.6, 2.0, 0.6, WCE.black, 0, 'rx="0.28"') + bell(20.0, 15.5) +
      wceName(c, 47.0, 7.0, 0.85) + translink(c, 10.9, 6.3, 0.42),
  });
}

// --- EMD F59PH (907: built 1988 for GO Transit as 533, rebuilt by Progress
// Rail and in West Coast Express service since June 2023): 58 ft 2 in over
// the couplers, 15 ft 7 in over the cab; trucks 35 ft 7 in apart, 9 ft
// wheelbase, 40 in wheels. A tall, flat-fronted short nose up to the
// windshield, the cab standing a foot above the body, a row of small
// windows behind it; intakes and two radiator grilles along the upper side,
// three fans on the roof. Measurements as carmodels.js's f59ph draws GO's
// and exo's. Paint: the WCE scheme, its bands lower on the flat nose
// (photographs at Waterfront, Wikimedia Commons, 2024).
const F59PH_KEYS = [[-1, 11.1, 9.9, 8.4], [1.4, 11.1, 9.9, 8.4], [13, 11.3, 9.9, 8.6], [30, 11.6, 10.0, 8.8], [38, 11.9, 10.2, 9.0],
  [45, 12.9, 10.8, 9.4], [52, 14.1, 11.9, 10.3], [58.2, 14.9, 12.8, 11.1], [59.2, 14.9, 12.9, 11.2]];
export function f59ph(c) {
  const L = c.L;
  return cabUnit(c, {
    roof: 14.6, sill: 4.6, rearR: 0.9,
    nose: [[1.7, 4.6], [1.35, 5.0], [1.35, 11.9], [1.9, 12.45], [5.6, 12.45], [6.3, 15.0], ["q", 6.45, 15.55, 7.1, 15.55], [12.9, 15.55], ["q", 13.35, 15.55, 13.4, 15.1]],
    top: [[13.45, 14.6]],
    glass: [[[5.8, 12.6], [6.3, 14.75], [6.75, 14.75], [6.75, 12.6]]],
    sideWin: [[7.0, 12.55, 1.6, 1.8], [9.1, 12.55, 3.4, 1.8], [13.9, 12.0, 1.4, 1.85], [15.7, 12.0, 2.9, 1.85], [18.9, 12.0, 0.8, 1.85]],
    panels: [[21.0, 5.1, 3.0, 5.9], [36.4, 5.1, 2.8, 5.9], [49.6, 5.1, 2.8, 5.6]],
    grilles: [[23.6, 11.6, 3.8, 1.9, 0.5], [33.8, 11.6, 6.1, 1.9, 0.5], [41.4, 10.8, 8.9, 2.9, 0.32], [51.6, 10.8, 3.3, 2.9, 0.32]],
    reservoir: [L / 2 - 4, L / 2 + 6],
    trucks: { centers: 35.58, wb: 9.0, d: 40 },
    roofItems: [[13.6, 3.4, 1.0], [30.5, 4.9, 0.45]], fans: [40.5, 44.4, 50.7],
    base: WCE.blue,
    paint: () => locoPaint(L, F59PH_KEYS, 4.6),
    extra: (c) => fuelTank(17.5, L - 17, 4.6) + bluePilot(1.0, 4.6) + ladder(5.7, 2.1, 12.2) +
      line(17.15, 12.05, 17.15, 13.8, C.gasket, 0.8) + [7.9, 8.8, 10.0, 10.9].map((x) => rect(x, 15.5, 0.6, 0.5, "currentColor", 0, 'rx="0.2"')).join("") +
      lamp(1.9, 7.4) + marker(1.9, 6.3, 0.26) + wceName(c, 39.0, 7.1, 0.85) + translink(c, 9.6, 6.6, 0.42),
  });
}

// --- Bombardier BiLevel coaches (201-220 and 301-309, built 1994-95 at
// Thunder Bay; 401-406, 2010) and cab cars (101-108, 1995; 109, 2010), the
// GO Transit design: 85 ft over the couplers, 15 ft 11 in over the middle,
// 14 ft 1 in over the end sections (rising in an S-curve about 16 ft in
// from each end); trucks 64 ft apart, 8 ft 6 in wheelbase, 33 in wheels; the
// lower floor 25 in over the rail between the trucks. An octagonal body.
// Two sets of bi-parting doors a side on the lower level, inboard of the
// trucks; nine windows upstairs, four between the doors downstairs, three
// in each end section. Bombardier's figures, as carmodels.js's BiLevels
// use them. The cab car's 1990s cab is in its end section: a flat end
// with the engineer's window in the first end window's place.
// Paint (photographs at Waterfront, Wikimedia Commons, 2018-2024): violet
// blue over the roof and down past the upper windows, white below, a
// golden yellow stripe over a thin teal one at the lower floor, blue under
// them to the bottom. The name big between the decks mid-car, after the
// mark of peaks over a train, and TRANS LINK small by the door. The cab
// end is yellow, a black band across it for the headlights and number
// boards and a blue V below, seen edge-on from the side.
const BIL = {
  roof: 15.92, sill: 3.7, ends: { h: 14.1, len: 9.5, ramp: 6.5 }, cornerR: 0.9,
  drop: { a: 16.6, b: 68.4, y: 1.25 }, trucks: { centers: 64, wb: 8.5, d: 33 }, chamfer: [2.4, 14.15],
  rows: [{ xs: seq(16.9, 5.55, 9), y: 11.6, w: 4.3, h: 2.3, r: 0.35 }, { xs: seq(27.6, 5.55, 4), y: 4.5, w: 4.3, h: 2.5, r: 0.35 },
    { xs: [1.4], y: 6.9, w: 3.9, h: 2.3, r: 0.3 }, { xs: [6.5], y: 6.9, w: 4.3, h: 2.3, r: 0.3 }, { xs: [11.7], y: 6.9, w: 2.9, h: 2.3, r: 0.3 },
    { xs: [68.6], y: 6.9, w: 3.1, h: 2.3, r: 0.3 }, { xs: [73.0], y: 6.9, w: 4.6, h: 2.3, r: 0.3 }, { xs: [79.0], y: 6.9, w: 3.4, h: 2.3, r: 0.3 }],
  doors: [{ x: 19.6, w: 4.4, y0: 1.55, y1: 8.7, leaves: 2, glassY: 0.45, glassH: 0.38 }, { x: 55.6, w: 4.4, y0: 1.55, y1: 8.7, leaves: 2, glassY: 0.45, glassH: 0.38 }],
  roofItems: [[3.0, 5.5, 0.35, 14.1], [76.5, 5.5, 0.35, 14.1]], diaphragm: [4.25, 13.2], badge: false, base: WCE.white,
};
// The blue over the roof follows the roofline down over the end sections.
function bilevelPaint(c, g) {
  const L = g.L;
  let s = rect(0, 0, L, 17, WCE.white) + rect(0, 11.15, L, 6, WCE.blue);
  s += rect(0, 3.62, L, 0.55, WCE.yellow) + rect(0, 3.45, L, 0.17, WCE.teal) + rect(0, 0, L, 3.45, WCE.blue);
  return s;
}
// Under the floor: the HEP and brake equipment hung beside the low floor's
// well, step plates at each door, the eave's rain strip, the HVAC grilles
// in the end sections' roofs.
const bilevelDetail = (c, g) =>
  [19.6, 55.6].map((x) => rect(x + 0.2, 1.05, 4.0, 0.25, "#3a3f45")).join("") +
  underframe(6.0, 13.2, 3.7, { depth: 1.0, boxes: 2, tanks: false }) + underframe(71.8, 79.0, 3.7, { depth: 1.0, boxes: 2, tanks: false }) +
  lines([[17.6, 15.55, 67.4, 15.55]], "rgba(0,0,0,0.18)", 0.5) +
  slats(3.3, 14.12, 4.9, 0.28, 0.3, "rgba(0,0,0,0.35)") + slats(76.8, 14.12, 4.9, 0.28, 0.3, "rgba(0,0,0,0.35)");
export const wceCoach = (c) => bilevel(c, { ...BIL, paint: bilevelPaint,
  extra: (c, g) => bilevelDetail(c, g) + wceName(c, 34.6, 9.8, 0.95, { mark: true }) + translink(c, 63.4, 9.6, 0.4) });
// The cab end, seen edge-on at the left: yellow above, the black lamp band,
// the blue V's arm, white and blue below; the engineer's side window; horns
// and the bell on the end roof.
const cabEnd = (c, { x0 }) => {
  let s = rect(x0, 3.7, 0.6, 8.6 - 3.7, WCE.white) + rect(x0, 8.6, 0.6, 5.0, WCE.yellow) + rect(x0, 11.3, 0.6, 1.25, WCE.black) +
    rect(x0, 7.4, 0.6, 1.2, WCE.blue) + rect(x0, 3.7, 0.6, 0.45, WCE.yellow) + line(x0 + 0.6, 3.8, x0 + 0.6, 13.5, "rgba(0,0,0,0.25)", 0.5);
  s += rect(x0, 6.8, 0.45, 0.25, "#9aa0a8") + win(x0 + 0.8, 6.9, 3.0, 2.3, 0.3) + lamp(x0 + 0.25, 12.0, 0.22) + marker(x0 + 0.25, 13.5, 0.18);
  return s + horns(2.2, 14.1) + bell(5.6, 14.1) + rect(x0 - 0.3, 2.3, 0.5, 1.2, "#2a2d31", 0, 'rx="0.12"');
};
export const wceCab = (c) => bilevel(c, { ...BIL, paint: bilevelPaint, cabLen: 5, cab: cabEnd,
  extra: (c, g) => bilevelDetail(c, g) + wceName(c, 34.6, 9.8, 0.95, { mark: true }) + translink(c, 63.4, 9.6, 0.4) });

export const TYPES = {
  wceF59: { name: "F59PHI locomotive", kind: "diesel" },
  wceMp36: { name: "MP36PH-3C locomotive", kind: "diesel" },
  wceF59ph: { name: "F59PH locomotive", kind: "diesel" },
  wceCoach: { name: "BiLevel coach", kind: "bilevel" },
  wceCab: { name: "BiLevel cab car", kind: "bilevel", cab: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of a train.
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  wceF59: M(f59phi, 58.58, true),
  wceMp36: M(mp36ph, 68, true),
  wceF59ph: M(f59ph, 58.17, true),
  wceCoach: M(wceCoach, 85),
  wceCab: M(wceCab, 85, true),
};
// Fleet numbers (TransLink's roster): locomotives 901-907; cab cars
// 101-109; coaches 201-220, 301-309 and 401-406.
export const FLEETS = {
  westcoastexpress: [[901, 905, "wceF59"], [906, 906, "wceMp36"], [907, 907, "wceF59ph"], [101, 109, "wceCab"],
    [201, 220, "wceCoach"], [301, 309, "wceCoach"], [401, 406, "wceCoach"]],
};
// The cab car is at the Waterfront end, the locomotive at Mission's: it
// pulls the evening trains out of Vancouver and pushes the morning ones in.
// Trains run four to ten cars; six coaches is drawn.
const LOCO = { wceMp36: "wceMp36", wceF59ph: "wceF59ph" };
export const TYPICAL = {
  westcoastexpress: (t, reported) => {
    const loco = LOCO[reported] || "wceF59";
    const units = [[loco, 1], ["wceCoach", 6], ["wceCab", 1]];
    return { label: `${TYPES[loco].name} with BiLevel coaches and a cab car, usually 5 to 10 cars`,
      units: /Waterfront/.test(t.destination || "") ? units.reverse() : units };
  },
};

const WP = "https://en.wikipedia.org/wiki/";
export const FACTS = {
  wceF59: { model: "EMD F59PHI", type: "Diesel-electric locomotive", builder: "General Motors Electro-Motive Division (London, Ontario)", built: "1995",
    fleet: "5 (901–905)", topSpeedMph: 110, powerHp: 3000, lengthFt: 58.58,
    about: "The West Coast Express's own locomotives since it opened in November 1995, at the Mission end of every train: they pull the evening trains out of Vancouver and push the morning ones in.",
    source: `${WP}EMD_F59PHI` },
  wceMp36: { model: "MotivePower MP36PH-3C", type: "Diesel-electric locomotive", builder: "MotivePower (Boise, Idaho)", built: "2006",
    fleet: "1 (906)", topSpeedMph: 110, powerHp: 3600, lengthFt: 68,
    about: "The first locomotive TransLink itself bought for the West Coast Express, a spare that also runs in daily service.", source: `${WP}MPI_MPXpress` },
  wceF59ph: { model: "EMD F59PH", type: "Diesel-electric locomotive", builder: "General Motors Electro-Motive Division; rebuilt by Progress Rail", built: "1988, rebuilt 2023",
    fleet: "1 (907, once GO Transit 533)", topSpeedMph: 83, powerHp: 3000, lengthFt: 58.17,
    about: "Built for GO Transit in Toronto, then leased out and rebuilt; it joined the West Coast Express in June 2023 as a spare.", source: `${WP}EMD_F59PH` },
  wceCoach: { model: "Bombardier BiLevel coach", type: "Bi-level passenger coach", builder: "Bombardier Transportation (Thunder Bay)", built: "1994–1995, 2010",
    fleet: "35 coaches (201–220, 301–309, 401–406)", topSpeedMph: 93, seats: 144, lengthFt: 85,
    about: "GO Transit's bi-level design, built in Thunder Bay. Seven more cars came in 2010; trains run four to ten of them.", source: `${WP}BiLevel_Coach` },
  wceCab: { model: "Bombardier BiLevel cab car", type: "Bi-level cab car", builder: "Bombardier Transportation (Thunder Bay)", built: "1995, 2010",
    fleet: "9 (101–109)", topSpeedMph: 93, lengthFt: 85,
    about: "The engineer's cab at the Waterfront end of each train, from which the morning trains are driven into Vancouver with the locomotive pushing.", source: `${WP}BiLevel_Coach` },
};
