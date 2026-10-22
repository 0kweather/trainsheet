// CP's cars (scripts/railroads/cp.py): Comboios de Portugal's trains for its
// four railroads here, long distance (cplc), regional (cpreg) and the
// urbanos of Lisbon (cplisboa) and Porto (cpporto). CP's timetable names no
// unit, so every train is drawn as what usually runs its service, labeled
// as typical. Trainsheet's own side views from published dimensions and
// photographs (Wikimedia Commons, 2023-2026), at the shared scale
// (js/carart.js), in the paint the trains carry now; CP's mark and the
// lettering are drawn here (no logo files). Bodies and parts from
// czechia.cars.js.

import { newId, coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, underframe, flutes } from "../carart.js?v=dev";
import { unit, mark, letters, hvac, hvLine, buffers, euroLoco, twinEnded } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";

// ---------- CP's mark ----------
// The "cp" ligature (CP since 2004): a "c" and a "p" drawn as one thick
// rounded stroke leaning forward, the c's lower arm running on into the p's
// stem, which drops below the line. h: the letters' height (x-height, ft);
// centered on (x, y); reads left to right on a mirrored car too.
const CP_D = "M1.02 0.14L0.47 0.14Q0.16 0.14 0.16 0.45L0.16 0.55Q0.16 0.86 0.47 0.86L1.38 0.86" +
  "M1.42 1.24L1.42 0.45Q1.42 0.14 1.73 0.14L2.12 0.14Q2.43 0.14 2.43 0.45L2.43 0.55Q2.43 0.86 2.12 0.86L1.62 0.86";
export const cpMark = (c, x, y, h, fill) => mark(c, x, y,
  `<g transform="scale(${n(h)}) skewX(-14) translate(-1.3 -0.5)"><path d="${CP_D}" fill="none" stroke="${fill}" stroke-width="0.28" stroke-linecap="butt" stroke-linejoin="round"/></g>`);
// "COMBOIOS DE PORTUGAL" in small capitals, the flag's green and red beside
// it on the side toward flagSide (-1 left, 1 right).
const cpName = (c, x, y, h, fill, flagSide = 1) => letters(c, x, y, h, "COMBOIOS DE PORTUGAL", fill, { weight: 500, spacing: "0.01em", family: SANS }) +
  rect(x + flagSide * (h * 6.9) - 0.32, y - h * 0.5, 0.26, h, "#1f8a3c") + rect(x + flagSide * (h * 6.9) - 0.06, y - h * 0.5, 0.38, h, "#d52b1e");

// ---------- Alfa Pendular (CP 4000) ----------
// FIAT's tilting Pendolino for CP, built with Sorefame (ten units,
// 1998-2000), the Italian ETR 460's family: six cars, 158.9 m, the end cars
// 27.65 m and the four between 25.9 m; a narrow body leaning into curves.
// Refurbished 2017-2021 by EMEF to Alma Design's scheme (photographs at
// Coimbra-B, Santa Apolónia and Alfarelos, 2023-2026): silver all over, a
// charcoal band through the windows with a lime-green line along its top;
// at the cab end the line curves into a big "cp", the p in the band's
// charcoal dropping below it, "COMBOIOS DE PORTUGAL" small under it with
// the flag; at each door end of a car its number, big and light gray, and
// a small "cp" with the class (conforto, turística) under it; lime edges on
// every door and round the cab's side window; CP's mark on the nose.
const AP = { silver: "#b8bcc0", roof: "#9da2a8", band: "#45484d", lime: "#a8d91c", dark: "#2b2d31", fair: "#62666b", num: "#c9cdd1", glass: "#2f3b40" };
const APD = { roof: 12.2, sill: 3.3 };
const NOSE_AP = [[2.6, 1.2], [0.9, 2.1], ["q", 0.15, 3.1, 0.25, 4.5], ["q", 0.45, 5.8, 2.4, 6.2], [4.2, 6.9], [11.2, 10.8], ["q", 13.0, 12.2, 16.4, 12.2]];
// A plug door: silver, its edges lime.
const apDoor = (x, w = 2.4) => ({ x, w, y0: APD.sill, y1: 10.3, leaves: 1, glassY: 0.6, glassH: 0.28, grabs: false, fill: "rgba(0,0,0,0.04)" });
const apDoorEdge = (x, w = 2.4) => rect(x - 0.08, APD.sill + 0.2, 0.16, 10.3 - APD.sill - 0.2, AP.lime) + rect(x + w - 0.08, APD.sill + 0.2, 0.16, 10.3 - APD.sill - 0.2, AP.lime);
// The band and its lime line from a to b.
const apBand = (a, b) => rect(a, 6.55, b - a, 3.0, AP.band) + rect(a, 9.55, b - a, 0.22, AP.lime);
// The car's number and class at a band end, "N cp" reading left to right
// from x (the panel's left edge).
// Lettering inside a mark() group (y down, centered on its own origin).
const txt = (x, y, h, text, fill, { weight = 700, anchor = "middle", family = SANS, spacing = 0, italic = false } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${italic ? ' font-style="italic"' : ""}>${text}</text>`;
const cpIn = (x, y, h, fill) => `<g transform="translate(${n(x)} ${n(y)}) scale(${n(h)}) skewX(-14) translate(-1.3 -0.5)"><path d="${CP_D}" fill="none" stroke="${fill}" stroke-width="0.28"/></g>`;
// The car's number, tall, thin and leaning, from the band's foot up
// through its lime line (broken round it), then a small "cp": "N cp"
// reading left to right from x (the panel's left edge). (A word in small
// letters under the cp, too small to read in any photograph, is left out.)
const apPlate = (c, x, k) => mark(c, x + 1.9, 8.2, `<rect x="-1.55" y="-1.62" width="1.1" height="0.32" fill="${AP.silver}"/>` +
  txt(-0.95, 0.05, 3.6, String(k), AP.num, { weight: 200, italic: true }) + cpIn(0.95, -0.25, 0.75, AP.num));
// The big "cp" closing the band at the cab end, the band's charcoal
// shaped into the two letters (their counters silver), the p's stem
// dropping below the band; the lime line runs on over the c and down the
// p's stem. x: the mark's left edge (nearest the cab, the c); reads "cp"
// on both sides, so the p is nearest the cab on a car running mirrored.
const apBigMark = (c, x) => mark(c, x + 3.9, 8.25,
  `<g transform="scale(3.0) skewX(-12) translate(-1.3 -0.5)"><path d="${CP_D}" fill="none" stroke="${AP.band}" stroke-width="0.34" stroke-linecap="butt" stroke-linejoin="round"/>` +
  `<path d="M2.6 0.0L1.2 0.0Q0.0 0.0 0.0 0.45L0.0 0.62M1.24 0.0L1.24 0.86" fill="none" stroke="${AP.lime}" stroke-width="0.075"/></g>`);
function apPaint(c, g, cab) {
  let s = bands(g.L, [[0, 20, AP.silver], [11.4, 3, AP.roof], [0, APD.sill + 0.35, AP.dark]]);
  if (cab) {
    // The nose: a charcoal band across it with the lamps, the lower nose
    // silver, the skirt charcoal.
    s += path("M-1 5.75L3.0 5.75L4.4 6.95L-1 6.95Z", AP.band) + path("M-1 1.0L-1 3.0Q2.2 3.3 5.0 3.2L5.0 1.0Z", AP.dark);
    // The lime line framing the cab's side window, from the band's line
    // down past the window's foot.
    // A charcoal surround over the cab's side window and door top, the lime
    // line along its foot from the door's rear edge down toward the nose.
    s += path("M11.6 7.95L18.6 9.9L18.6 11.7L11.0 11.7Z", AP.band) + path("M18.52 10.75L18.52 9.9L11.4 7.85L11.4 8.07L18.3 10.02L18.3 10.75Z", AP.lime);
  }
  return s;
}
// Windows: rounded panes in the band.
const apRows = (xs, w = 3.1) => [{ xs, y: 6.8, w, h: 2.55, r: 0.5 }];
const apRoof = (a, b) => rect(a, APD.roof - 0.05, b - a, 0.3, "#a8adb3", 0.4, 'rx="0.15"');
const apUnder = (a, b) => rect(a, 1.5, b - a, APD.sill - 1.5, AP.fair, 0.4, 'rx="0.2"') + lines(seq(a + 3, 3.2, Math.max(0, Math.floor((b - a - 4) / 3.2))).map((x) => [x, 1.7, x, APD.sill - 0.15]), "rgba(0,0,0,0.25)", 0.4);
// The end car (car 1 or 6): the cab, the big mark, eight windows, the door
// at the inner end.
function apCab(c) {
  const L = c.L, dx = L - 3.4;
  const xs = c.cls === "conforto" ? seq(32.0, 5.75, 8) : seq(31.6, 5.15, 9);
  return unit(c, { roof: APD.roof, sill: APD.sill, nose: NOSE_AP, rake: [[4.2, 6.9], [11.2, 10.8]], depth: 4.0, cabLen: 19, lampY: 5.4, low: 3.6,
    rows: apRows(xs), doors: [apDoor(dx)], trucks: [12.5, L - 10.0], wheel: 35, diaphragm: [3.6, 10.9],
    paint: (cc, g) => apPaint(cc, { ...g }, true) + apBand(25.6, dx - 0.6) + rect(dx - 0.6, 9.55, 0.6, 0.22, AP.lime),
    surround: AP.dark,
    extra: (cc, g) => apRoof(16, g.L - 1) + hvac(31, APD.roof + 0.2, 13, 0.6) + hvac(g.L - 24, APD.roof + 0.2, 10, 0.6) +
      apUnder(18.2, g.L - 16) + apDoorEdge(dx) +
      // The cab door, its handrails; the cab's side window.
      rect(16.1, 3.6, 2.2, 6.9, "rgba(0,0,0,0.05)", 0.5) + line(15.9, 4.4, 15.9, 8.6, "currentColor", 0.5) + line(18.5, 4.4, 18.5, 8.6, "currentColor", 0.5) +
      path(poly([[12.4, 8.65], [15.5, 9.5], [15.5, 11.0], [12.9, 11.0]]), "#1d2026", 0.4) +
      letters(cc, 17.2, 9.4, 0.42, cc.cls === "conforto" ? "1" : "2", AP.dark, { weight: 500 }) +
      apBigMark(cc, 21.6) + cpName(cc, 27.0, 5.2, 0.33, "#3a3d42", -1) +
      apPlate(cc, dx - 5.2, cc.index + 1) +
      mark(cc, 2.4, 6.5, "") });
}
// An intermediate car: a door at each end (one on the bar car), the number
// at each door end.
function apMid(c) {
  const L = c.L, k = c.index;
  const bar = c.bar;
  const xs = c.cls === "conforto" ? seq(10.2, 5.9, 11) : bar ? seq(26.0, 5.3, 9) : seq(9.8, 5.3, 13);
  const doors = bar ? [apDoor(L - 3.4)] : [apDoor(1.0), apDoor(L - 3.4)];
  // The pantographs, drawn on cars 2 and 4 at their ends toward car 3
  // (approximate, from photographs).
  const pan = k === 1 ? L - 13 : k === 3 ? 13 : null;
  return unit(c, { roof: APD.roof, sill: APD.sill, rows: apRows(xs), doors, trucks: [9.4, L - 9.4], wheel: 35, diaphragm: [3.6, 10.9],
    paint: (cc, g) => apPaint(cc, g, false) + apBand(bar ? 1.0 : 4.0, g.L - 4.0) + rect(-1, 9.55, 2, 0.22, AP.lime) + rect(g.L - 1, 9.55, 2, 0.22, AP.lime),
    extra: (cc, g) => apRoof(1, g.L - 1) + (pan != null ? pantograph(pan, APD.roof + 0.25, { up: k === 3, facing: k === 1 ? 1 : -1 }) + hvLine(k === 1 ? pan - 9 : pan + 3, k === 1 ? pan - 3 : pan + 9, APD.roof + 0.25) : hvac(g.L / 2 - 7, APD.roof + 0.2, 14, 0.6)) +
      apUnder(14.5, g.L - 14.5) + doors.map((d) => apDoorEdge(d.x)).join("") +
      (bar ? "" : apPlate(cc, 4.3, k + 1)) + apPlate(cc, g.L - 9.2, k + 1) });
}

// ---------- CP's other trains: shared paint and parts ----------
// CP's red (the Lisbon units' cabs and door panels, the 5600s' cabs), the
// regional and Porto units' yellow, stainless, the window bands' charcoal.
const CP = { red: "#d9262c", yellow: "#f3b41b", steel: "#c9cdd1", roof: "#a4aab0", band: "#26292d", skirt: "#34373c", black: "#1b1c1e", white: "#f3f3f0", grey: "#8b9096" };
const panes = (xs, y, w, h, r = 0.3) => ({ xs, y, w, h, r });
const dbl = (x, y0, y1, fill = null, w = 4.3) => ({ x, w, y0, y1, leaves: 2, glassY: 0.45, glassH: 0.38, grabs: false, ...(fill ? { fill } : {}) });
const one = (x, y0, y1, fill = null, w = 2.6) => ({ x, w, y0, y1, leaves: 1, glassY: 0.55, glassH: 0.3, grabs: false, ...(fill ? { fill } : {}) });
// Windows spread evenly between a and b, k of them, w wide.
const spread = (a, b, k, w) => (k === 1 ? [(a + b - w) / 2] : seq(a, (b - a - w) / (k - 1), k));
// A diesel's exhaust stack and silencer on the roof.
const stack = (x, roof) => rect(x, roof - 0.05, 2.6, 0.5, C.steelDark, 0.4, 'rx="0.2"') + rect(x + 0.7, roof + 0.45, 0.5, 0.6, "currentColor") + rect(x + 1.5, roof + 0.45, 0.5, 0.45, "currentColor");
// An underfloor diesel engine and its radiator between the trucks.
const engine = (a, b, top) => rect(a, top - 1.7, b - a, 1.6, "currentColor", 0, 'opacity="0.8" rx="0.15"') + slats(a + 0.4, top - 1.5, Math.min(4, b - a - 0.8), 1.2, 0.35, "rgba(255,255,255,0.2)");

// ---------- Lisbon: UQE 2300/2400 (Sintra, Azambuja, Sado) ----------
// Sorefame and Siemens, 1992-1997 (42 + 14 units): four cars of about
// 23.9 m (95.6 m), motor-trailer-trailer-motor, single-deck, 316 seats in
// one class; two double doors (1.3 m) a side on every car. Photographs at
// Queluz-Belas and Entrecampos (2025): corrugated stainless sides (fluted
// below the windows), a rounded red fiberglass cab end, its windshield in
// black; every door set in a red panel from the windows' foot to the roof,
// a white "cp" in the red over the door. One pantograph, on the trailer
// next to a cab car.
const U23 = { roof: 13.5, sill: 3.9 };
const NOSE_U23 = [[1.2, 1.7], [0.6, 3.9], [0.45, 7.6], ["q", 0.5, 10.4, 1.3, 11.8], [2.4, 13.0], ["q", 2.9, 13.5, 4.2, 13.5]];
const u23Doors = (L) => [dbl(L * 0.3 - 2.15, 4.1, 11.0), dbl(L * 0.7 - 2.15, 4.1, 11.0)];
function u23Paint(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, CP.steel], [12.95, 3, CP.roof], [0, 4.2, CP.skirt]]) + flutes(-1, g.L + 1, 4.4, 7.05, 0.3);
    for (const d of u23Doors(g.L)) s += rect(d.x - 0.9, 6.9, d.w + 1.8, 12.95 - 6.9, CP.red);
    if (cab) s += path("M-1 1.0L6.4 1.0L6.4 13.6L-1 13.6Z", CP.red) + rect(-1, 1.0, 7.4, 2.6, CP.skirt);
    return s;
  };
}
const u23Marks = (c, g) => u23Doors(g.L).map((d) => cpMark(c, d.x + d.w / 2, 11.95, 0.62, "#ffffff")).join("");
function u23Cab(c) {
  const L = c.L;
  return unit(c, { roof: U23.roof, sill: U23.sill, nose: NOSE_U23, rake: [[0.5, 8.4], [2.1, 12.6]], depth: 2.4, cabLen: 8, lampY: 5.4,
    rows: [panes([12.4], 7.05, 4.3, 3.5), panes(spread(L * 0.3 + 3.4, L * 0.7 - 7.6, 3, 4.3), 7.05, 4.3, 3.5), panes(spread(L * 0.7 + 3.4, L - 5.8, 2, 4.3), 7.05, 4.3, 3.5)],
    doors: [one(8.3, 4.1, 11.2, "rgba(0,0,0,0.04)", 2.0), ...u23Doors(L)], trucks: [9.5, L - 9.5], wheel: 36, diaphragm: [4.2, 12.0],
    paint: u23Paint(true), surround: CP.black,
    extra: (cc, g) => hvac(g.L - 30, U23.roof, 16, 0.85) + boxes(16, g.L - 16, U23.sill, 3, 1.3) + u23Marks(cc, g) +
      path(poly([[3.4, 8.6], [6.0, 8.6], [6.0, 11.4], [4.0, 11.4]]), "#1d2026", 0.4) });
}
function u23Mid(c) {
  const L = c.L, pan = c.index % 4 === 1;
  return unit(c, { roof: U23.roof, sill: U23.sill,
    rows: [panes(spread(1.8, L * 0.3 - 3.4 - 4.3, 3, 4.3), 7.05, 4.3, 3.5), panes(spread(L * 0.3 + 3.4, L * 0.7 - 7.6, 3, 4.3), 7.05, 4.3, 3.5), panes(spread(L * 0.7 + 3.4, L - 6.1, 3, 4.3), 7.05, 4.3, 3.5)],
    doors: u23Doors(L), trucks: [9.5, L - 9.5], wheel: 33, diaphragm: [4.2, 12.0], paint: u23Paint(false), pan: pan ? L * 0.62 : null,
    extra: (cc, g) => (pan ? hvac(8, U23.roof, 14, 0.85) : hvac(g.L / 2 - 8, U23.roof, 16, 0.85)) + boxes(16, g.L - 16, U23.sill, 3, 1.2) + u23Marks(cc, g) });
}

// ---------- Lisbon: 3150/3250 (Cascais line) ----------
// Sorefame's stainless cars of 1950s design, rebuilt 1998 for the Cascais
// line's 1,500 V DC: three-car (3150) and four-car (3250) units, about
// 19.8 m a car, three single sliding doors a side on each car, the windows
// in pairs between. Photographs at Cais do Sodré and Oeiras (2023, 2026):
// corrugated stainless all along the side, the flat cab front yellow with a
// black band across it carrying a white "cp" and the number; pantographs
// on the motor cars at the cab ends. (Some cars wear full advertising
// wraps; they are drawn in the stainless.)
const CAS = { roof: 12.9, sill: 3.9 };
const NOSE_CAS = [[0.9, 1.9], [0.6, 3.9], [0.5, 10.9], ["q", 0.6, 12.9, 2.6, 12.9]];
const casDoors = (L) => [7.0, L / 2 - 1.5, L - 10.0].map((x) => one(x, 4.0, 11.0, "rgba(0,0,0,0.06)", 3.0));
const casRows = (L, cab) => [panes([...(cab ? [] : [1.8]), ...spread(10.8, L / 2 - 2.6, 2, 4.2), ...spread(L / 2 + 2.3, L - 11.6, 2, 4.2), L - 6.4], 6.9, 4.2, 3.8, 0.35)];
function casPaint(cab) {
  return (c, g) => bands(g.L, [[0, 20, CP.steel], [11.95, 3, CP.roof], [0, 4.1, CP.skirt]]) + flutes(-1, g.L + 1, 4.3, 6.6, 0.28) +
    (cab ? path("M-1 1.0L1.6 1.0L1.6 13.0L-1 13.0Z", CP.yellow) + rect(-1, 9.9, 2.6, 1.4, CP.black) : "");
}
const casCab = (c) => unit(c, { roof: CAS.roof, sill: CAS.sill, nose: NOSE_CAS, rake: [[0.55, 7.6], [0.6, 9.8]], depth: 1.4, cabLen: 5, lampY: 5.2,
  rows: casRows(c.L, true), doors: casDoors(c.L), trucks: [8.0, c.L - 8.0], wheel: 41, diaphragm: [4.2, 11.6], paint: casPaint(true), surround: CP.black,
  extra: (cc, g) => rect(8, CAS.roof - 0.05, 12, 1.0, C.steelDark, 0.4, 'rx="0.2"') + slats(8.5, CAS.roof + 0.15, 11, 0.7, 0.45, "rgba(0,0,0,0.3)") + pantograph(g.L - 16, CAS.roof, { up: true, facing: -1 }) + rect(g.L - 30, CAS.roof - 0.05, 9, 0.7, C.steelDark, 0.4, 'rx="0.2"') +
    hvLine(g.L - 21.5, g.L - 13, CAS.roof + 0.1) + boxes(14, g.L - 14, CAS.sill, 3, 1.4) });
const casMid = (c) => unit(c, { roof: CAS.roof, sill: CAS.sill, rows: casRows(c.L, false), doors: casDoors(c.L), trucks: [8.0, c.L - 8.0], wheel: 33,
  diaphragm: [4.2, 11.6], paint: casPaint(false), extra: (cc, g) => hvac(g.L / 2 - 6, CAS.roof, 12, 0.7) + boxes(14, g.L - 14, CAS.sill, 3, 1.1) });

// ---------- Porto: UME 3400 ----------
// Siemens and Bombardier (Amadora), 2002-2004, 34 units: four articulated
// cars on five trucks (Jakobs trucks at the joints), 66.8 m, 3.95 m tall,
// 180 seats; two double doors a side on every car, one pantograph on the
// second car. Photographs at Porto Campanhã, São Bento and Gaia
// (2023-2026): silver-gray, the cab end yellow back to the first door, the
// windshield in a black mask; each door in a yellow panel, a big red disc
// across its two leaves; a "cp" and "COMBOIOS DE PORTUGAL" in black on the
// yellow behind the cab.
const U34 = { roof: 12.95, sill: 3.7, body: "#c3c7cb" };
const NOSE_U34 = [[1.3, 1.6], [0.6, 3.7], [0.5, 6.3], ["q", 0.6, 8.0, 1.4, 9.0], [2.6, 12.0], ["q", 3.2, 12.95, 4.8, 12.95]];
const u34Doors = (L, cab) => (cab ? [dbl(15.0, 3.9, 10.8, "rgba(0,0,0,0.04)", 4.6), dbl(L - 9.6, 3.9, 10.8, "rgba(0,0,0,0.04)", 4.6)] : [dbl(4.6, 3.9, 10.8, "rgba(0,0,0,0.04)", 4.6), dbl(L - 9.2, 3.9, 10.8, "rgba(0,0,0,0.04)", 4.6)]);
function u34Paint(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, U34.body], [12.05, 3, CP.roof], [0, 3.95, CP.skirt]]);
    for (const d of u34Doors(g.L, cab)) s += rect(d.x - 0.55, 3.9, d.w + 1.1, 12.1 - 3.9, CP.yellow);
    if (cab) s += path("M-1 3.9L15.0 3.9L15.0 12.1L-1 12.1Z", CP.yellow) + path("M-1 6.0L1.6 6.0Q2.4 9.6 4.4 12.1L-1 12.1Z", CP.black);
    return s;
  };
}
// The red disc on a door, cut by the leaves' windows (drawn over it).
const u34Discs = (L, cab) => u34Doors(L, cab).map((d) => {
  const id = newId();
  return `<clipPath id="${id}"><rect x="${n(d.x)}" y="${n(d.y0)}" width="${n(d.w)}" height="${n(d.y1 - d.y0)}"/></clipPath>` +
    `<g clip-path="url(#${id})">${circle(d.x + d.w / 2, 7.4, 3.1, "#a8161d")}</g>`;
}).join("");
function u34Car(c, cab) {
  const L = c.L, doors = u34Doors(L, cab);
  const a = doors[0].x + doors[0].w + 0.7, b = doors[1].x - 0.7;
  return unit(c, { roof: U34.roof, sill: U34.sill, ...(cab ? { nose: NOSE_U34, rake: [[1.4, 9.0], [2.6, 12.0]], depth: 2.6, cabLen: 9, lampY: 5.0 } : {}),
    rows: [panes(spread(a + 0.3, b - 4.3, Math.round((b - a) / 6.2), 4.0), 6.5, 4.0, 4.3, 0.3)],
    doors: doors.map((d) => ({ ...d, glassY: 0.2, glassH: 0.62 })), trucks: cab ? [7.5, "end"] : ["start", "end"], wheel: 33, diaphragm: [4.0, 11.6],
    paint: (cc, g) => u34Paint(cab)(cc, g) + u34Discs(g.L, cab), surround: CP.black, pan: !cab && c.index % 4 === 1 ? L / 2 - 3 : null,
    extra: (cc, g) => (cab ? hvac(17, U34.roof, 12, 0.7) + path(poly([[5.6, 8.4], [8.6, 8.4], [8.6, 11.0], [6.4, 11.0]]), "#1d2026", 0.4) +
      cpMark(cc, 6.6, 11.55, 0.55, CP.black) + letters(cc, 10.6, 11.55, 0.3, "COMBOIOS DE PORTUGAL", CP.black, { weight: 500 }) : hvac(g.L / 2 + 6, U34.roof, 10, 0.7)) +
      boxes(cab ? 12 : 8, g.L - 8, U34.sill, 2, 1.2) });
}

// ---------- 2240 (UTE): regional and urbanos ----------
// Sorefame's 1970s-80s three-car units, rebuilt by Alstom 2003-2005 (57):
// a driving trailer at each end of the motor car, 22.89 m each, 264 seats
// in one class. Photographs at Entroncamento, Santa Apolónia, Vila Nova de
// Cerveira and Grândola (2022-2026): corrugated stainless sides and roof,
// the windows in a long dark ribbon, a yellow band along the top of the
// side over them; the cab end yellow (black and yellow chevrons across the
// front, under the windshield); two double doors a side on each car,
// yellow, a black "cp" on each; the pantograph on the middle car.
const U22 = { roof: 13.4, sill: 4.0 };
const NOSE_U22 = [[1.0, 1.6], [0.6, 4.0], [0.5, 10.6], ["q", 0.6, 13.4, 3.0, 13.4]];
const u22Doors = (L, cab) => (cab ? [dbl(L * 0.43, 4.2, 11.0, CP.yellow), dbl(L * 0.74, 4.2, 11.0, CP.yellow)] : [dbl(L * 0.26 - 2.15, 4.2, 11.0, CP.yellow), dbl(L * 0.74 - 2.15, 4.2, 11.0, CP.yellow)]);
function u22Paint(cab) {
  return (c, g) => {
    let s = bands(g.L, [[0, 20, CP.steel], [12.0, 3, "#b4b9be"], [11.05, 0.9, CP.yellow], [0, 4.2, CP.skirt]]) + flutes(-1, g.L + 1, 4.4, 7.3, 0.28) + flutes(-1, g.L + 1, 12.1, 13.4, 0.3);
    // The window ribbon, broken at the doors.
    const ds = u22Doors(g.L, cab), stops = [cab ? 6.2 : 1.0, ...ds.flatMap((d) => [d.x - 0.5, d.x + d.w + 0.5]), g.L - 1.0];
    for (let k = 0; k < stops.length; k += 2) s += rect(stops[k], 7.5, stops[k + 1] - stops[k], 3.25, CP.band, 0, 'rx="0.25"');
    if (cab) s += path("M-1 1.0L5.4 1.0L5.4 11.05Q5.4 11.95 6.3 11.95L6.3 13.5L-1 13.5Z", CP.yellow);
    return s;
  };
}
function u22Car(c, cab) {
  const L = c.L, ds = u22Doors(L, cab);
  const segs = [[cab ? 6.6 : 1.4, ds[0].x - 0.9], [ds[0].x + ds[0].w + 0.9, ds[1].x - 0.9], [ds[1].x + ds[1].w + 0.9, L - 1.4]];
  const rows = segs.map(([a, b]) => { const k = Math.max(1, Math.round((b - a) / 8.6)), w = (b - a - (k - 1) * 0.35) / k; return panes(seq(a, w + 0.35, k), 7.75, w, 2.75, 0.15); });
  return unit(c, { roof: U22.roof, sill: U22.sill, ...(cab ? { nose: NOSE_U22, rake: [[0.55, 7.9], [0.6, 11.2]], depth: 1.5, cabLen: 5.4, lampY: 5.6 } : {}),
    rows, doors: ds, trucks: [9.0, L - 9.0], wheel: cab ? 33 : 36, diaphragm: [4.3, 12.0], paint: u22Paint(cab), surround: CP.black, pan: cab ? null : L / 2 - 3,
    extra: (cc, g) => (cab ? hvac(18, U22.roof, 16, 0.95) : "") + boxes(15, g.L - 15, U22.sill, 3, cab ? 1.1 : 1.4) +
      ds.map((d) => cpMark(cc, d.x + d.w * 0.25, 6.4, 0.5, CP.black)).join("") });
}

// ---------- Lisbon and Fertagus: the double-deck 3500 ----------
// Alstom and CAF, 1999 (30 units: Fertagus 3501-3518, CP 3519-3530): four
// double-deck cars of about 26.65 m (106.6 m), the motor cars at the ends,
// the floor dropped low between the trucks; two double doors a side on
// each car, in the end sections over the trucks. CP's (Azambuja line;
// photograph at Lisboa Oriente, 2022): red all over, both decks' windows in
// dark bands, a black band across the front with a white "cp" and the
// number. Fertagus's (photographs near Coina and Pinhal Novo, 2023):
// royal blue with a red line along the top of the side; the cab end white,
// parted from the blue by a red stripe slanting up and back from the foot
// of the cab door to the roof; its doors blue over white, the one at each
// end car's inner end red over white; a white "fertagus" on the upper deck,
// and "fertagus" small in gray on the white cab side. (Its red emblem by
// that name is left out; several sets run in advertising wraps instead.)
const DD = { roof: 14.7, sill: 3.9 };
const NOSE_DD = [[1.3, 1.6], [0.6, 3.9], [0.5, 7.0], ["q", 0.6, 9.0, 1.4, 10.0], [2.3, 13.6], ["q", 2.8, 14.7, 4.4, 14.7]];
const ddDoors = (L, cab, fill) => [dbl(cab ? 17.6 : 9.2, 2.0, 10.0, fill), dbl(L - 13.5, 2.0, 10.0, fill)];
const FT = { blue: "#1f4fd0", red: "#d8262c", white: "#f3f4f5" };
// Fertagus's name: lowercase, upright and heavy, with slab serifs.
const FT_FONT = "Rockwell, 'Roboto Slab', 'Courier New', Georgia, serif";
function ddPaint(c, g, cab) {
  const fert = c.agency === "fertagus";
  let s = bands(g.L, [[0, 20, fert ? FT.blue : CP.red], [14.0, 3, CP.roof], [0, 2.3, fert ? "#5d6268" : CP.skirt]]);
  // Dark bands through both decks' windows, and the end sections'.
  s += rect(cab ? 22.5 : 14.0, 10.3, g.L - (cab ? 22.5 : 14.0) - 14.0, 2.75, CP.band, 0, 'rx="0.3"') + rect(cab ? 22.5 : 14.0, 3.0, g.L - (cab ? 22.5 : 14.0) - 14.0, 2.9, CP.band, 0, 'rx="0.3"');
  if (fert) {
    s += rect(-1, 13.55, g.L + 2, 0.32, FT.red) + rect(-1, 13.87, g.L + 2, 0.13, FT.white);
    if (cab) s += path("M-1 1.0L12.6 1.0L20.4 14.0L-1 14.0Z", FT.white) + path("M12.6 1.0L13.5 1.0L21.3 13.55L20.4 14.0Z", FT.red);
  } else if (cab) s += rect(-1, 9.0, 3.2, 2.2, CP.black);
  return s;
}
export function ddCar(c, cab) {
  const L = c.L, fert = c.agency === "fertagus";
  const ds = ddDoors(L, cab, "rgba(0,0,0,0.05)");
  const upper = panes(spread(cab ? 23.0 : 14.6, L - 18.2, cab ? 7 : 9, 3.6), 10.6, 3.6, 2.15, 0.35);
  const lower = panes(spread(cab ? 23.0 : 14.6, L - 18.2, cab ? 7 : 9, 3.6), 3.35, 3.6, 2.2, 0.35);
  const ends = panes([...(cab ? [] : [2.0]), L - 8.4], 7.4, 3.0, 2.4, 0.3);
  return unit(c, { roof: DD.roof, sill: DD.sill, drop: { a: 13.6, b: L - 13.6, y: 1.6 }, ...(cab ? { nose: NOSE_DD, rake: [[1.4, 10.0], [2.3, 13.6]], depth: 2.6, cabLen: 9, lampY: 5.4 } : {}),
    rows: [upper, lower, ends], doors: ds, trucks: [7.2, L - 7.2], wheel: 36, diaphragm: [4.2, 13.0], surround: CP.black,
    paint: (cc, g) => ddPaint(cc, g, cab) + (fert ? ds.map((d, i) => rect(d.x, 2.0, d.w, 3.6, FT.white) + (cab && i === 1 ? rect(d.x, 5.6, d.w, 4.4, FT.red) : "")).join("") : ""),
    pan: null,
    extra: (cc, g) => (cab ? pantograph(g.L - 15, DD.roof, { up: !!cc.lead, facing: -1 }) + hvLine(g.L - 25, g.L - 18, DD.roof) : "") + (cab ? path(poly([[5.0, 9.6], [8.0, 9.6], [8.0, 12.2], [5.6, 12.2]]), "#1d2026", 0.4) + rect(10.0, 2.4, 2.2, 8.4, "rgba(0,0,0,0.05)", 0.5) + hvac(28, DD.roof, 12, 0.6) : hvac(g.L / 2 - 14, DD.roof, 10, 0.6)) +
      (fert ? letters(cc, cab ? 34 : 24, 11.65, 1.55, "fertagus", "#ffffff", { weight: 700, family: FT_FONT }) + (cab ? letters(cc, 14.6, 6.6, 0.42, "fertagus", "#6b7079", { weight: 600, family: FT_FONT }) : "") : "") });
}

// ---------- 592 (ex-Renfe DMUs, leased) ----------
// MACOSA and ATEINSA, 1981-84; leased from Renfe since 2011 (the lease
// renewed in 2025 for two more years): three cars, motor-trailer-motor,
// 196 seats in one class; a door near each end of every car. Photographs
// at Porto Campanhã (2025) and Caldas de Aregos (2026): white, the cab end
// yellow and a yellow band along the top of the side, the windows in gray
// panels, yellow doors, a gray roof and skirt, a black "cp" on the side
// behind the cab.
const U59 = { roof: 13.2, sill: 3.9 };
const NOSE_592 = [[1.0, 1.6], [0.7, 3.9], [0.6, 8.0], [1.3, 11.8], ["q", 1.5, 13.2, 3.0, 13.2]];
const u59Doors = (L, cab) => [one(cab ? 23.0 : 1.6, 4.1, 11.0, CP.yellow, 2.8), one(L - 4.4, 4.1, 11.0, CP.yellow, 2.8)];
function u59Car(c, cab) {
  const L = c.L, ds = u59Doors(L, cab);
  const a = ds[0].x + ds[0].w + 1.2, b = ds[1].x - 1.2;
  const xs = spread(a, b - 4.6, 7, 4.6);
  return unit(c, { roof: U59.roof, sill: U59.sill, ...(cab ? { nose: NOSE_592, rake: [[0.65, 8.3], [1.3, 11.8]], depth: 1.6, cabLen: 6, lampY: 5.5 } : {}),
    rows: [panes(xs, 7.7, 4.6, 2.75, 0.25), ...(cab ? [panes([12.6, 17.4], 7.7, 4.4, 2.75, 0.25)] : [])], doors: ds, trucks: [8.5, L - 8.5], wheel: 33, diaphragm: [4.2, 11.8],
    surround: CP.black,
    paint: (cc, g) => bands(g.L, [[0, 20, CP.white], [12.35, 3, "#9aa0a6"], [11.6, 0.75, CP.yellow], [0, 4.25, "#55595e"]]) + rect(a - 0.5, 7.35, b - a + 1.0, 3.45, "#8e9398") +
      (cab ? rect(11.9, 7.35, 10.4, 3.45, "#8e9398") + path("M-1 1.0L6.4 1.0L6.4 13.4L-1 13.4Z", CP.yellow) : ""),
    extra: (cc, g) => (cab ? stack(30, U59.roof) + hvac(g.L - 24, U59.roof, 12, 0.7) + cpMark(cc, 9.2, 9.1, 0.85, CP.black) : hvac(g.L / 2 - 6, U59.roof, 12, 0.7)) +
      (cab ? engine(18, g.L - 18, U59.sill) : boxes(18, g.L - 18, U59.sill, 2, 1.0)) });
}

// ---------- 0450 (UDD) ----------
// Sorefame, 1998-2000, 19 two-car diesel units, a cab in each car.
// Photographs near Grândola (2023) and at Vila Real de Santo António
// (2023): corrugated stainless, the cab end sky blue, thin red lines over and under the dark window
// band (round the front too), blue doors; a red "cp" low on the side.
const U45 = { roof: 13.0, sill: 3.9, blue: "#4bb3dc" };
const NOSE_U45 = [[1.0, 1.6], [0.7, 3.9], [0.6, 7.6], [1.6, 11.6], ["q", 1.9, 13.0, 3.4, 13.0]];
function u45Car(c) {
  const L = c.L;
  const ds = [one(5.0, 4.1, 11.2, "rgba(0,0,0,0.05)", 2.6), one(L * 0.66, 4.1, 11.2, U45.blue, 2.8), one(L - 4.2, 4.1, 11.2, U45.blue, 2.8)];
  return unit(c, { roof: U45.roof, sill: U45.sill, nose: NOSE_U45, rake: [[0.65, 7.8], [1.6, 11.6]], depth: 2.0, cabLen: 4.6, lampY: 5.4,
    rows: [panes(spread(8.4, L * 0.66 - 5.4, 5, 4.2), 7.55, 4.2, 2.9, 0.2), panes(spread(L * 0.66 + 3.9, L - 9.6, 2, 4.2), 7.55, 4.2, 2.9, 0.2)], doors: ds,
    trucks: [8.5, L - 8.5], wheel: 33, diaphragm: [4.2, 11.6], surround: CP.black,
    paint: (cc, g) => bands(g.L, [[0, 20, CP.steel], [12.05, 3, "#b0b6bc"], [0, 4.3, "#9ea4aa"], [0, 3.1, CP.skirt]]) + flutes(-1, g.L + 1, 4.45, 7.1, 0.28) +
      rect(-1, 7.35, g.L + 2, 3.45, CP.band) + rect(-1, 7.15, g.L + 2, 0.2, "#d6262c") + rect(-1, 10.8, g.L + 2, 0.2, "#d6262c") + path("M-1 3.1L4.6 3.1L4.6 13.2L-1 13.2Z", U45.blue) +
      rect(-1, 7.35, 1.6, 3.45, CP.band),
    extra: (cc, g) => stack(g.L - 22, U45.roof) + hvac(16, U45.roof, 12, 0.7) + engine(16, g.L - 16, U45.sill) + cpMark(cc, g.L * 0.42, 5.7, 0.8, "#d6262c") });
}

// ---------- 0350 (Allan railbus, Linha do Leste) ----------
// Allan railcars of 1954, rebuilt as the 0350 (single cars, a cab at each
// end). Photograph at Entroncamento (2025): bright green cab ends and
// roof, cream sides, the windows in a dark band, a door behind each cab, a
// black "cp" high on the green.
const ALN = { roof: 12.8, sill: 3.9, green: "#3dbd3a", cream: "#e8e2d0" };
const NOSE_ALN = [[1.0, 1.7], [0.7, 3.9], [0.6, 8.4], [1.3, 11.6], ["q", 1.6, 12.8, 3.0, 12.8]];
const allanHalf = (c) => unit(c, { roof: ALN.roof, sill: ALN.sill, nose: NOSE_ALN, rake: [[0.65, 8.6], [1.3, 11.6]], depth: 1.8, cabLen: 5, lampY: 5.4,
  rows: [panes(spread(10.2, c.L / 2 + 2, 4, 4.4), 7.6, 4.4, 2.9, 0.25)], doors: [one(6.0, 4.1, 11.0, ALN.cream, 2.6)], trucks: [10.0, c.L - 10.0], wheel: 33, surround: CP.black,
  paint: (cc, g) => bands(g.L, [[0, 20, ALN.cream], [11.9, 3, ALN.green], [0, 4.2, CP.skirt]]) + rect(9.6, 7.35, g.L - 19.2, 3.4, CP.band, 0, 'rx="0.3"') +
    path("M-1 1.0L5.6 1.0L5.6 13.0L-1 13.0Z", ALN.green),
  extra: (cc, g) => engine(16, g.L / 2, ALN.sill) + stack(g.L / 2 - 4, ALN.roof) + cpMark(cc, 2.8, 11.3, 0.6, CP.black) });
const allan = (c) => twinEnded(c, allanHalf);

// ---------- 9630 (Linha do Vouga, metre gauge) ----------
// Sorefame and CAF, 1991, seven two-car units, a cab in each car, on the
// 1,000 mm gauge Vouga line: small, low cars (about 17.5 m). Photographs
// at Sernada do Vouga (2010) and on the line (2022): red cab ends and red
// upper sides (the window zone), corrugated stainless below, a gray roof
// and skirt; a door behind the cab and one at the inner end.
const V96 = { roof: 11.4, sill: 3.3, red: "#c5262d" };
const NOSE_V96 = [[0.9, 1.4], [0.6, 3.3], [0.5, 7.6], [0.9, 10.2], ["q", 1.1, 11.4, 2.6, 11.4]];
const vougaCar = (c) => unit(c, { roof: V96.roof, sill: V96.sill, nose: NOSE_V96, rake: [[0.55, 7.0], [0.9, 10.0]], depth: 1.7, cabLen: 4.4, lampY: 4.6,
  rows: [panes([0, 1, 2].flatMap((g) => seq(8.6 + g * ((c.L - 13.2) / 3), 2.75, 3)), 6.3, 2.3, 3.4, 0.2)], doors: [one(4.8, 3.5, 9.8, "rgba(0,0,0,0.06)", 2.4), one(c.L - 3.6, 3.5, 9.8, "rgba(0,0,0,0.06)", 2.4)],
  trucks: [6.5, c.L - 6.5], wheel: 26, diaphragm: [3.6, 10.0], surround: CP.black,
  paint: (cc, g) => bands(g.L, [[0, 20, CP.steel], [10.45, 3, "#9aa0a6"], [5.9, 4.55, V96.red], [0, 3.55, "#5b6066"]]) + flutes(-1, g.L + 1, 3.75, 5.75, 0.26) +
    path("M-1 1.0L4.4 1.0L4.4 11.6L-1 11.6Z", V96.red),
  extra: (cc, g) => stack(g.L / 2 - 1, V96.roof) + engine(12, g.L - 12, V96.sill) });

// ---------- Locomotives ----------
// 5600 (Siemens EuroSprinter, built with Krauss-Maffei and Sorefame,
// 1993-95): 19.6 m, Bo'Bo', 220 km/h, two pantographs. Photographs at
// Santa Apolónia and Coimbra-B (2025-2026): the cabs red back past the
// crew door, the machine room silver-gray between them over a dark gray
// lower side, a row of dark grilles high along it; a white "cp" on the red
// behind each crew door.
const NOSE_5600 = [[1.3, 4.1], [1.15, 7.2], ["q", 1.2, 8.1, 1.8, 8.9], [3.3, 12.2], ["q", 3.7, 12.9, 4.8, 12.9]];
const l56Paint = (c, L) => bands(L, [[0, 20, CP.red], [12.0, 3, "#b0b5bb"], [0, 4.1, CP.skirt]]) + rect(11.2, 4.1, L - 22.4, 8.0, "#b9bdc1") + rect(11.2, 4.1, L - 22.4, 1.7, "#4a4e54") +
  path("M0 12.0L0 9.4L2.2 9.6L4.3 12.0Z", CP.red);
const loco5600 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_5600, rake: [[1.8, 8.9], [3.3, 12.2]], centers: 32.5, door: 7.2, wheel: 49,
  paint: l56Paint, surround: CP.black, grilles: [[-(c.L / 2 - 12.2), c.L - 24.4, 10.5, 11.8]], grilleFill: "rgba(20,22,25,0.7)",
  over: (cc, L) => cpMark(cc, 10.3, 8.4, 0.85, "#ffffff") + cpMark(cc, L - 10.3, 8.4, 0.85, "#ffffff") });
// 2600/2620 (Alsthom, 1974 and 1987; the French BB 15000's family): 17.5 m,
// B'B', 160 km/h, the "broken nose" leaning forward under a windshield
// leaning back. Photograph at Valença (2023): orange-red, a dark maroon
// band through the cab windows, a broad white stripe slanting up across
// the nose corner; a big dark "cp" mid-side.
const NOSE_2600 = [[1.6, 4.1], [0.35, 7.6], [2.4, 11.6], ["q", 2.8, 12.9, 4.2, 12.9]];
const l26Paint = (c, L) => bands(L, [[0, 20, "#ef5a24"], [12.2, 3, "#5a3a33"], [0, 4.5, "#2e3034"]]) +
  [[0, 1], [L, -1]].map(([a, k]) => path(`M${a} 9.0L${a + k * 9.0} 9.0L${a + k * 9.0} 11.7L${a} 11.7Z`, "#5a2a28") +
    path(`M${a + k * 0.9} 4.6L${a + k * 2.2} 4.6L${a + k * 5.0} 7.9L${a + k * 3.7} 7.9Z`, "#f4f4f2")).join("");
const loco2600 = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_2600, rake: [[0.7, 8.6], [2.4, 11.6]], centers: 31.0, door: 6.0, wheel: 49,
  paint: l26Paint, surround: "#3a2422", grilles: [[-(c.L / 2 - 10.5), c.L - 21, 9.6, 11.6]], grilleFill: "rgba(20,22,25,0.45)",
  over: (cc, L) => cpMark(cc, L / 2, 6.8, 1.5, "#2b2b2d") });
// 1400 (English Electric, built with Sorefame, 1967-69): a road-switcher,
// the cab at one end and a long hood ahead of it, Bo'Bo', 105 km/h.
// Photograph at Caldas de Aregos (Douro): CP orange, a big black "cp" on
// the hood, red and white stripes slanting across the hood's end, the cab
// roof dark. Drawn running hood first, as on the Douro.
function loco1400(c) {
  const L = c.L, top = 10.9, cabTop = 12.8, deck = 4.4, cab0 = L - 12.6;
  const O = "#f07a1e";
  let s = truck(9.5, { wb: 8.0, d: 40, kind: "loco", top: deck - 0.2 }) + truck(L - 9.5, { wb: 8.0, d: 40, kind: "loco", top: deck - 0.2 });
  s += rect(14.6, 1.6, L - 29.2, 2.4, "currentColor", 0, 'opacity="0.82" rx="0.3"');                        // fuel tank
  s += rect(0.4, deck - 1.0, L - 0.8, 1.0, "#2e3034");                                                       // frame
  // The hood, with stripes on its end, and the cab.
  const hood = poly([[1.6, deck], [cab0, deck], [cab0, top - 0.3], ["q", cab0, top, cab0 - 0.3, top], [1.9, top], ["q", 1.6, top, 1.6, top - 0.3]]);
  const id = newId();
  s += path(hood, O) + `<clipPath id="${id}"><path d="${hood}"/></clipPath><g clip-path="url(#${id})">` +
    [0, 1.6, 3.2, 4.8].map((k) => path(`M${n(1.6 + k)} ${deck}L${n(2.4 + k)} ${deck}L${n(-2.8 + k + 6.0)} ${top}L${n(-3.6 + k + 6.0)} ${top}Z`, k % 3.2 ? "#ffffff" : "#d6262c")).join("") + "</g>" + path(hood, "none", 0.7);
  s += lines(seq(8, 2.4, Math.floor((cab0 - 10) / 2.4)).map((x) => [x, deck + 0.6, x, top - 0.6]), "rgba(0,0,0,0.18)", 0.4) + rect(cab0 - 6.0, top - 2.6, 4.6, 1.6, "rgba(20,22,25,0.45)", 0.4);
  s += path(poly([[cab0, deck], [L - 0.9, deck], [L - 0.9, cabTop - 0.4], ["q", L - 0.9, cabTop, L - 1.3, cabTop], [cab0 + 0.4, cabTop], ["q", cab0, cabTop, cab0, cabTop - 0.4]]), O, 0.7);
  s += rect(cab0 - 0.1, cabTop - 0.6, L - cab0 - 0.7, 0.6, "#4a3a35") + rect(cab0 + 1.0, 8.6, 2.6, 2.6, C.glass, 0.4, 'rx="0.2"') + rect(cab0 + 4.4, deck + 0.3, 2.2, 7.0, "rgba(0,0,0,0.06)", 0.5) +
    rect(cab0 + 7.6, 8.6, 3.0, 2.6, C.glass, 0.4, 'rx="0.2"') + rect(L - 7.0, cabTop - 0.05, 1.2, 0.5, "currentColor");
  s += cpMark(c, cab0 * 0.55, 7.6, 1.6, CP.black) + stack(cab0 * 0.42, top);
  s += buffers(0, -1, { sill: deck, end: 0.4 }) + buffers(L, 1, { sill: deck, end: 0.9 });
  // The handrail along the walkway.
  s += line(1.0, deck + 2.6, cab0, deck + 2.6, "currentColor", 0.5) + lines(seq(2, 4.5, Math.floor(cab0 / 4.5)).map((x) => [x, deck, x, deck + 2.6]), "currentColor", 0.4);
  return s;
}

// ---------- Coaches ----------
// Intercidades: the Corail coaches (built by Sorefame under licence, 1985)
// and the Sorefame "modernizadas", 26.4 m, alike from the side: corrugated
// stainless, the windows in a dark navy band with a lime line under it, a
// plug door at each end; by each door the class's color across the band
// and the door, lilac for 1st (Conforto) and light green for 2nd
// (Turística), the class's number on it; a big dark "cp" on the stainless
// under the windows. Photographs near Tunes (2024) and at Lisboa (2023).
// The bar car is a 1st-class coach with the bar (numbered 81-89).
const ICC = { lilac: "#a796c9", green: "#9fcf5a", navy: "#24283a", lime: "#a8d91c" };
function icCoach(c) {
  const L = c.L, roof = 13.1, sill = 4.0, first = c.cls !== 2, col = first ? ICC.lilac : ICC.green;
  const rows = [{ a: 7.0, b: L - 7.0, y: 7.4, w: 4.6, h: 2.95, pitch: c.bar ? 7.4 : 6.1, r: 0.5 }];
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: CP.steel, badge: false, under: true,
    trucks: { centers: 60.4, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows,
    doors: [{ x: 1.6, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3, grabs: true }, { x: L - 4.2, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3, grabs: true }],
    livery: (cc) => bands(L, [[12.2, 3, "#9fa5ab"], [0, 4.3, CP.skirt]]) + flutes(-1, L + 1, 4.5, 7.0, 0.28) + flutes(-1, L + 1, 10.75, 12.1, 0.28) +
      rect(-1, 7.15, L + 2, 3.5, ICC.navy) + rect(-1, 7.0, L + 2, 0.16, ICC.lime) +
      [[1.0, 5.6], [L - 6.6, 5.6]].map(([x, w]) => rect(x, 4.2, w, 7.9, col)).join(""),
    extra: (cc) => {
      let s = hvac(L / 2 - 7, roof, 14, 0.7) + [12, 24, L - 24, L - 12].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("");
      s += buffers(0, -1, { sill }) + buffers(L, 1, { sill });
      s += letters(cc, 5.15, 9.0, 1.7, first ? "1" : "2", "#2b2d33", { weight: 600 }) + letters(cc, L - 2.0 + 0.0 - 0.9, 9.0, 1.7, first ? "1" : "2", "#2b2d33", { weight: 600 });
      return s + cpMark(cc, L * 0.3, 5.75, 1.3, "#33363b");
    },
  });
}
// The Arco coaches (CAF, 1990s, for Renfe; bought by CP in 2020 and rebuilt
// at Guifões), 26.4 m: light gray, a continuous black window band, a gray
// roof; the vestibule ends colored, blue on the 1st-class coach (a big
// white "1" and "Classe" on it) and red on the others; a small "cp" low on
// the side. Photograph at Porto São Bento (2023).
function arcoCoach(c) {
  const L = c.L, roof = 13.2, sill = 4.0, first = c.cls === 1, col = first ? "#2a6fc4" : "#d4262d";
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.4, base: "#e6e8ea", badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.5, d: 36 }, diaphragm: [4.25, 11.9],
    rows: [{ a: 6.6, b: L - 6.6, y: 7.55, w: 4.6, h: 3.0, pitch: c.bar ? 7.4 : 6.25, r: 0.3 }],
    doors: [{ x: 2.7, w: 2.6, h: 7.1, glassY: 0.5, glassH: 0.36, grabs: false }, { x: L - 5.3, w: 2.6, h: 7.1, glassY: 0.5, glassH: 0.36, grabs: false }],
    livery: (cc) => bands(L, [[12.3, 3, "#a4aab0"], [0, 4.3, "#3a3d42"]]) + rect(5.9, 7.3, L - 11.8, 3.5, CP.black, 0, 'rx="0.3"') +
      rect(-1, 4.1, 6.7, 10, col) + rect(L - 5.7, 4.1, 6.7, 10, col),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.7) + buffers(0, -1, { sill }) + buffers(L, 1, { sill }) + cpMark(cc, L * 0.45, 5.4, 0.6, "#4a4d52") +
      (first ? letters(cc, 1.65, 9.6, 1.5, "1", "#ffffff", { weight: 500 }) + letters(cc, 1.65, 8.35, 0.3, "Classe", "#ffffff", { weight: 500 }) : "") });
}
// The Douro's MiraDouro coaches: the Schindler cars (1949; crimson, each window
// framed in cream, a dark roof, doors at the ends and one
// mid-side) and a Sorefame coach (1970s; cream over crimson, a white "cp"
// and "COMBOIOS DE PORTUGAL" on the crimson). Photograph at Caldas de
// Aregos (2021).
function schindler(c) {
  const L = c.L, roof = 12.9, sill = 4.0, R = "#c3202b";
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.0, base: R, badge: false, under: true, trucks: { centers: 52, wb: 8.2, d: 36 }, diaphragm: [4.2, 11.6],
    rows: [{ a: 4.4, b: L * 0.45 - 1, y: 7.7, w: 2.6, h: 2.8, pitch: 3.8, r: 0.2 }, { a: L * 0.45 + 3.6, b: L - 4.4, y: 7.7, w: 2.6, h: 2.8, pitch: 3.8, r: 0.2 }],
    doors: [{ x: 1.2, w: 2.2, h: 7.2, glassY: 0.55, glassH: 0.3 }, { x: L * 0.45 - 0.2, w: 2.6, h: 7.2, glassY: 0.55, glassH: 0.3 }, { x: L - 3.4, w: 2.2, h: 7.2, glassY: 0.55, glassH: 0.3 }],
    livery: () => bands(L, [[11.9, 3, "#5d3b36"], [0, 4.25, CP.skirt]]) +
      [[4.4, L * 0.45 - 1], [L * 0.45 + 3.6, L - 4.4]].map(([a, b]) => { const k = Math.floor((b - a - 2.6) / 3.8) + 1, x0 = a + (b - a - ((k - 1) * 3.8 + 2.6)) / 2; return seq(x0, 3.8, k).map((x) => rect(x - 0.35, 7.35, 3.3, 3.5, "#efe6d2", 0, 'rx="0.2"')).join(""); }).join(""),
    extra: (cc) => buffers(0, -1, { sill }) + buffers(L, 1, { sill }) + cpMark(cc, L * 0.25, 5.8, 0.6, "#ffffff") });
}
function sorefameCoach(c) {
  const L = c.L, roof = 13.0, sill = 4.0;
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.1, base: "#f1ede2", badge: false, under: true, trucks: { centers: 56, wb: 8.2, d: 36 }, diaphragm: [4.2, 11.7],
    rows: [{ a: 5.0, b: L - 5.0, y: 7.6, w: 3.0, h: 2.8, pitch: 5.3, r: 0.3 }],
    doors: [{ x: 1.3, w: 2.3, h: 7.1, glassY: 0.55, glassH: 0.3 }, { x: L - 3.6, w: 2.3, h: 7.1, glassY: 0.55, glassH: 0.3 }],
    livery: () => bands(L, [[12.1, 3, "#ddd8cc"], [4.2, 3.05, "#b11d3a"], [0, 4.25, CP.skirt]]) + rect(1.0, 4.2, 2.9, 7.4, "#b11d3a") + rect(L - 3.9, 4.2, 2.9, 7.4, "#b11d3a"),
    extra: (cc) => buffers(0, -1, { sill }) + buffers(L, 1, { sill }) + cpMark(cc, L * 0.42, 5.75, 0.6, "#ffffff") + letters(cc, L * 0.42 + 4.6, 5.7, 0.38, "COMBOIOS DE PORTUGAL", "#ffffff", { weight: 500 }) });
}

// ---------- Tables ----------

// Each class of car is its own type: the Alfa Pendular's Conforto (1st)
// cars 1-2 and bar car 3, the Intercidades and Arco coaches by class.
export const TYPES = {
  cpApCab1: { name: "Alfa Pendular end car (Conforto, 1st class)", kind: "emu", amenities: ["first"] },
  cpApConforto: { name: "Alfa Pendular Conforto car (1st class)", kind: "emu", amenities: ["first"] },
  cpApBar: { name: "Alfa Pendular bar car (Turística)", kind: "emu", amenities: ["cafe"] },
  cpApTur: { name: "Alfa Pendular Turística car", kind: "emu" },
  cpApCab6: { name: "Alfa Pendular end car (Turística)", kind: "emu" },
  cp5600: { name: "5600 electric locomotive", kind: "electric", pan: true },
  cpIc1: { name: "Intercidades coach, Conforto (1st class)", kind: "coach", amenities: ["first"] },
  cpIcBar: { name: "Intercidades bar coach (1st class and bar)", kind: "coach", amenities: ["first", "cafe"] },
  cpIc2: { name: "Intercidades coach, Turística (2nd class)", kind: "coach" },
  cp2600: { name: "2600 electric locomotive", kind: "electric", pan: true },
  cpArco1: { name: "Arco coach, 1st class", kind: "coach", amenities: ["first"] },
  cpArcoBar: { name: "Arco bar coach", kind: "coach", amenities: ["cafe"] },
  cpArco2: { name: "Arco coach, 2nd class", kind: "coach" },
  cp1400: { name: "1400 diesel locomotive", kind: "diesel" },
  cpSorefame: { name: "Sorefame coach (MiraDouro)", kind: "coach" },
  cpSchindler: { name: "Schindler coach (MiraDouro)", kind: "coach" },
  cp2240Cab: { name: "2240 driving trailer", kind: "emu" },
  cp2240Mid: { name: "2240 motor car", kind: "emu", pan: true },
  cp3400Cab: { name: "3400 end car", kind: "emu" },
  cp3400Mid: { name: "3400 intermediate car", kind: "emu", pan: true },
  cp2300Cab: { name: "UQE 2300/2400 motor car", kind: "emu" },
  cp2300Mid: { name: "UQE 2300/2400 trailer", kind: "emu", pan: true },
  cp3500Cab: { name: "3500 double-deck motor car", kind: "emu" },
  cp3500Mid: { name: "3500 double-deck trailer", kind: "emu", pan: true },
  cp3150Cab: { name: "3150/3250 motor car", kind: "emu", pan: true },
  cp3150Mid: { name: "3150/3250 trailer", kind: "emu" },
  cp592Cab: { name: "592 diesel motor car", kind: "emu" },
  cp592Mid: { name: "592 diesel trailer", kind: "emu" },
  cp0450: { name: "0450 diesel railcar", kind: "emu" },
  cp0350: { name: "0350 Allan railbus", kind: "emu" },
  cp9630: { name: "9630 metre-gauge diesel railcar", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
export const MODELS = {
  cpApCab1: M((c) => apCab({ ...c, cls: "conforto" }), 90.7, true),
  cpApConforto: M((c) => apMid({ ...c, cls: "conforto" }), 85.0, false, byIndex),
  cpApBar: M((c) => apMid({ ...c, cls: "turistica", bar: true }), 85.0, false, byIndex),
  cpApTur: M((c) => apMid({ ...c, cls: "turistica" }), 85.0, false, byIndex),
  cpApCab6: M((c) => apCab({ ...c, cls: "turistica" }), 90.7, true),
  cp5600: M(loco5600, 64.2),
  cpIc1: M((c) => icCoach({ ...c, cls: 1 }), 86.6),
  cpIcBar: M((c) => icCoach({ ...c, cls: 1, bar: true }), 86.6),
  cpIc2: M((c) => icCoach({ ...c, cls: 2 }), 86.6),
  cp2600: M(loco2600, 57.4),
  cpArco1: M((c) => arcoCoach({ ...c, cls: 1 }), 86.6),
  cpArcoBar: M((c) => arcoCoach({ ...c, cls: 2, bar: true }), 86.6),
  cpArco2: M((c) => arcoCoach({ ...c, cls: 2 }), 86.6),
  cp1400: M(loco1400, 44.6),
  cpSorefame: M(sorefameCoach, 77.4),
  cpSchindler: M(schindler, 72.2),
  cp2240Cab: M((c) => u22Car(c, true), 75.1, true),
  cp2240Mid: M((c) => u22Car(c, false), 75.1),
  cp3400Cab: M((c) => u34Car(c, true), 60.2, true),
  cp3400Mid: M((c) => u34Car(c, false), 49.4, false, byIndex),
  cp2300Cab: M(u23Cab, 78.4, true),
  cp2300Mid: M(u23Mid, 78.4, false, byIndex),
  cp3500Cab: M((c) => ddCar(c, true), 87.4, true),
  cp3500Mid: M((c) => ddCar(c, false), 87.4, false, byIndex),
  cp3150Cab: M(casCab, 65.0, true),
  cp3150Mid: M(casMid, 65.0),
  cp592Cab: M((c) => u59Car(c, true), 72.2, true),
  cp592Mid: M((c) => u59Car(c, false), 70.5),
  cp0450: M(u45Car, 75.5, true),
  cp0350: M(allan, 72.0),
  cp9630: M(vougaCar, 57.4, true),
};

// CP's class numbers, for the railroads' fleet pages (the timetable names
// no unit).
export const FLEETS = {
  cplc: [[4001, 4010, "cpApCab1"], [5601, 5630, "cp5600"]],
  cpreg: [[2241, 2297, "cp2240Cab"], [592201, 592230, "cp592Cab"], [451, 469, "cp0450"], [351, 368, "cp0350"], [9631, 9637, "cp9630"],
    [2601, 2612, "cp2600"], [1401, 1467, "cp1400"]],
  cplisboa: [[2301, 2342, "cp2300Cab"], [2401, 2414, "cp2300Cab"], [3519, 3530, "cp3500Cab"], [3151, 3163, "cp3150Cab"], [3251, 3271, "cp3150Cab"]],
  cpporto: [[3401, 3434, "cp3400Cab"]],
};

const set = (label, ...units) => ({ label, units });
const AP6 = set("Alfa Pendular (CP 4000): six tilting cars, Conforto (1st class) in cars 1-2, the bar in car 3, Turística behind",
  ["cpApCab1", 1], ["cpApConforto", 1], ["cpApBar", 1], ["cpApTur", 2], ["cpApCab6", 1]);
const IC = set("5600 locomotive with Intercidades coaches (Corail or Sorefame): Conforto (1st class), the bar car and Turística (2nd)",
  ["cp5600", 1], ["cpIc1", 1], ["cpIcBar", 1], ["cpIc2", 3]);
const IC_GUARDA = set("5600 locomotive with two Turística (2nd class) coaches and a bar coach", ["cp5600", 1], ["cpIc2", 2], ["cpIcBar", 1]);
const IC_ARCO = set("5600 locomotive with Arco coaches (1st class, bar, 2nd class)", ["cp5600", 1], ["cpArco1", 1], ["cpArcoBar", 1], ["cpArco2", 2]);
const IR_ARCO = set("2600 locomotive with Arco coaches: 1st class, 2nd class and the bar", ["cp2600", 1], ["cpArco1", 1], ["cpArco2", 1], ["cpArcoBar", 1]);
const MIRADOURO = set("MiraDouro: a 1400 diesel locomotive with a Sorefame coach and Schindler coaches", ["cp1400", 1], ["cpSorefame", 1], ["cpSchindler", 2]);
const U2240 = set("2240: a three-car electric unit (sometimes two coupled)", ["cp2240Cab", 1], ["cp2240Mid", 1], ["cp2240Cab", 1]);
const U592 = set("592: a three-car diesel unit (leased from Renfe)", ["cp592Cab", 1], ["cp592Mid", 1], ["cp592Cab", 1]);
const U0450 = set("0450: a two-car diesel unit", ["cp0450", 2]);
const U0350 = set("0350: an Allan railbus", ["cp0350", 1]);
const U9630 = set("9630: a two-car metre-gauge diesel unit", ["cp9630", 2]);
const U2300 = set("UQE 2300/2400: a four-car electric unit (often two coupled)", ["cp2300Cab", 1], ["cp2300Mid", 2], ["cp2300Cab", 1]);
const U3500 = set("3500: a four-car double-deck electric unit (some trains a UQE 2300/2400)", ["cp3500Cab", 1], ["cp3500Mid", 2], ["cp3500Cab", 1]);
const U3150 = set("3150/3250: a three- or four-car electric unit, usually two coupled", ["cp3150Cab", 1], ["cp3150Mid", 2], ["cp3150Cab", 1]);
const U3400 = set("3400: a four-car articulated electric unit (often two coupled)", ["cp3400Cab", 1], ["cp3400Mid", 2], ["cp3400Cab", 1]);
const BY_MODEL = {
  cpApCab1: AP6, cp5600: IC, cp2600: IR_ARCO, cp1400: MIRADOURO, cp2240Cab: U2240, cp592Cab: U592, cp0450: U0450, cp0350: U0350,
  cp9630: U9630, cp2300Cab: U2300, cp3500Cab: U3500, cp3150Cab: U3150, cp3400Cab: U3400,
};

// The ends of a train, unaccented ("Régua" matches /Regua/).
const plain = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const ends = (t) => `${plain(t.origin)}|${plain(t.destination)}`;
// What usually runs each service (CP's timetables and news, 2025-2026;
// photographs): the Alfa Pendulars on their own trains; Intercidades a
// 5600 with Corail or Sorefame coaches, Arco coaches on IC 523/528, the
// Guarda trains short, the Beja trains a 0450 shuttle to Casa Branca or
// Évora. Regional and InterRegional by line: the Douro (Porto/Marco/
// Caíde-Régua-Pocinho) 592s, the MiraDouro (Porto-Pinhão/Pocinho
// InterRegional) a 1400 with Schindler and Sorefame coaches; the Minho and
// Figueira-Porto InterRegionals a 2600 with Arco coaches; the Vouga the
// 9630s; the Leste (Entroncamento-Elvas) the Allan 0350s; the Oeste
// (Caldas da Rainha-Coimbra/Figueira/Meleças) and the Alentejo (Beja) the
// 0450s; everything else under the wires, the Algarve's too since July
// 2026, the 2240s. The FLIRTs (2700) are still in testing.
export const TYPICAL = {
  cplc: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const e = ends(t), k = String(t.number || "");
    if (t.route === "Alfa Pendular") return AP6;
    if (/Beja/.test(e)) return set("0450: a two-car diesel unit (the Intercidades' shuttle for Beja)", ["cp0450", 2]);
    if (k === "523" || k === "528") return IC_ARCO;
    if (/Guarda/.test(e)) return IC_GUARDA;
    return IC;
  },
  cpreg: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const e = ends(t), r = t.route || "";
    if (r === "Urbanos de Coimbra") return U2240;
    if (/Vouga|Sernada|Macinhata|Agueda|Oliveira de Azemeis/.test(e)) return U9630;
    if (/Elvas|Badajoz/.test(e)) return U0350;
    if (/Beja|Baronia|Casa Branca/.test(e)) return U0450;
    // The Oeste beyond the wires (Meleças to Caldas da Rainha and on to
    // Coimbra and Figueira); Lisboa–Meleças alone runs under them.
    if (/Caldas da Rainha|Lourical/.test(e)) return U0450;
    if (r === "InterRegional" && /Pocinho|Pinhao/.test(e) && /Porto/.test(e)) return MIRADOURO;
    if (/Regua|Pocinho|Pinhao|Marco de Canaveses|Caide/.test(e)) return U592;
    if (r === "InterRegional" && /Valenca|Figueira da Foz/.test(e)) return IR_ARCO;
    return U2240;
  },
  cplisboa: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (/Cascais/.test(r)) return U3150;
    if (/Azambuja/.test(r) && !/Sintra/.test(ends(t))) return U3500;
    return U2300;
  },
  cpporto: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    if (/Aveiro/.test(t.route || "")) return set("3400: a four-car articulated electric unit (some trains a 2240)", ["cp3400Cab", 1], ["cp3400Mid", 2], ["cp3400Cab", 1]);
    return U3400;
  },
};

const WIKI = (s) => `https://pt.wikipedia.org/wiki/${s}`;
const ap = { model: "Alfa Pendular (CP 4000)", type: "Tilting high-speed electric multiple unit", builder: "FIAT Ferroviaria and Sorefame (ADtranz and Siemens equipment)",
  built: "1998–2000; refurbished 2017–2021", fleet: "10 six-car units", topSpeedMph: 137, powerHp: 5364, seats: 301, lengthFt: 521, source: WIKI("Alfa_Pendular") };
const ic = { model: "Intercidades coach (Corail or Sorefame)", type: "Passenger coach", builder: "Sorefame (Corail under licence, 1985; the Sorefame coaches modernised 1993–96)",
  fleet: "58 Corail and 45 Sorefame coaches", topSpeedMph: 124, lengthFt: 86.6, source: WIKI("Intercidades_(CP)") };
const arco = { model: "Arco coach", type: "Passenger coach", builder: "CAF, for Renfe; rebuilt by CP at Guifões", built: "1990s; in CP service since 2022",
  fleet: "36 bought from Renfe in 2020, about 17 in service", topSpeedMph: 124, lengthFt: 86.6, source: "https://echoboomer.pt/carruagens-arco-entraram-ao-servico-da-cp/" };
const u22 = { model: "CP 2240 (UTE)", type: "Electric multiple unit", builder: "Sorefame; rebuilt by Alstom", built: "1970–1984; rebuilt 2003–2005", fleet: "57 three-car units",
  topSpeedMph: 75, powerHp: 1718, seats: 264, lengthFt: 225, source: WIKI("S%C3%A9rie_2240_da_CP") };
const u34 = { model: "CP 3400 (UME)", type: "Articulated electric multiple unit", builder: "Siemens and Bombardier (Amadora)", built: "2002–2004", fleet: "34 four-car units",
  topSpeedMph: 87, powerHp: 1877, seats: 180, lengthFt: 219, source: WIKI("S%C3%A9rie_3400_da_CP") };
const u23 = { model: "CP 2300/2400 (UQE)", type: "Electric multiple unit", builder: "Sorefame and Siemens", built: "1992–1997", fleet: "42 (2300) and 14 (2400) four-car units",
  topSpeedMph: 75, powerHp: 4157, seats: 316, lengthFt: 313.6, source: WIKI("S%C3%A9rie_2300_da_CP") };
const u35 = { model: "CP 3500", type: "Double-deck electric multiple unit", builder: "Alstom and CAF", built: "1999", fleet: "12 four-car units with CP (18 more with Fertagus)",
  topSpeedMph: 87, seats: 476, lengthFt: 349.7, source: WIKI("S%C3%A9rie_3500_da_CP") };
const cas = { model: "CP 3150/3250", type: "Electric multiple unit (1,500 V DC)", builder: "Sorefame", built: "1950s; rebuilt 1998", fleet: "13 three-car (3150) and 18 four-car (3250) units",
  topSpeedMph: 56, seats: 208, lengthFt: 259, source: WIKI("CP_Urbanos_de_Lisboa") };
const u59 = { model: "Renfe 592 (leased)", type: "Diesel multiple unit", builder: "MACOSA and ATEINSA", built: "1981–1984; with CP since 2011", fleet: "Leased from Renfe, about 9–18 units",
  topSpeedMph: 75, seats: 196, source: WIKI("S%C3%A9rie_592_da_CP") };
export const FACTS = {
  cpApCab1: { ...ap, about: "Car 1, an end car in Conforto, CP's first class (96 seats in cars 1 and 2, seated 2+1). The FIAT Pendolino family (the Italian ETR 460's), tilting up to 8° in curves; the trains run Braga–Porto–Lisboa–Faro. Outside, the class shows only as a small \"1\" on the cab door." },
  cpApConforto: { ...ap, about: "Car 2, Conforto (first class). On the side each car carries its number, big, by each door, with a small \"cp\"; the classes aren't otherwise marked outside." },
  cpApBar: { ...ap, about: "Car 3 holds the bar and Turística seats. About 205 Turística seats fill cars 3 to 6, seated 2+2." },
  cpApTur: { ...ap, about: "Turística, the standard class, in cars 4 and 5. The two pantographs are drawn on cars 2 and 4, one raised; their exact positions are from photographs and approximate." },
  cpApCab6: { ...ap, about: "Car 6, an end car in Turística; the cab door carries a small \"2\". The refurbished trains' silver, charcoal and lime are Alma Design's (2017)." },
  cp5600: { model: "CP 5600", type: "Electric locomotive", builder: "Siemens and Krauss-Maffei, with Sorefame", built: "1993–1995", fleet: "30 built; about 19 with CP for passengers",
    topSpeedMph: 137, powerHp: 7510, lengthFt: 64.2, source: WIKI("S%C3%A9rie_5600_da_CP"), about: "A Siemens EuroSprinter, the Intercidades' locomotive, at the head of the train out of Lisboa." },
  cpIc1: { ...ic, about: "First class, sold as Conforto: numbered 11–19, lilac by the doors with a \"1\"." },
  cpIcBar: { ...ic, about: "First class with the bar (numbered 81–89). Its outside is the 1st-class coaches'." },
  cpIc2: { ...ic, about: "Second class, sold as Turística: numbered 21–29, light green by the doors with a \"2\"." },
  cp2600: { model: "CP 2600/2620", type: "Electric locomotive", builder: "Alsthom (Alstom)", built: "1974 and 1987", fleet: "About 12 in service", topSpeedMph: 99, powerHp: 5900,
    lengthFt: 57.4, source: WIKI("S%C3%A9rie_2600_da_CP"), about: "The French BB 15000's family, with its \"broken nose\". It hauls the Arco coaches on the Minho and Figueira–Porto InterRegionals, and stands in on Intercidades." },
  cpArco1: { ...arco, about: "First class (56 seats in a 2022 set), its ends painted blue with a big white \"1\" and \"Classe\"." },
  cpArcoBar: { ...arco, about: "The bar coach (25 seats in a 2022 set). Which color its ends carry is drawn as the 2nd-class coach's red; not confirmed in a photograph." },
  cpArco2: { ...arco, about: "Second class (80 seats in a 2022 set), its ends red. Arco coaches run the Minho and Figueira–Porto InterRegionals and, since August 2025, Intercidades 523/528." },
  cp1400: { model: "CP 1400", type: "Diesel locomotive", builder: "English Electric, with Sorefame", built: "1967–1969", fleet: "About 11 in service", topSpeedMph: 65, lengthFt: 44.6,
    source: "https://cp.pt/info/en/miradouro-train", about: "It hauls the MiraDouro, the Douro's daily InterRegional between Porto and Pocinho, with old Schindler and Sorefame coaches." },
  cpSorefame: { model: "Sorefame coach", type: "Passenger coach", builder: "Sorefame", built: "1970s", lengthFt: 77.4, source: "https://cp.pt/info/en/miradouro-train",
    about: "A Sorefame coach in the MiraDouro, cream over crimson." },
  cpSchindler: { model: "Schindler coach", type: "Passenger coach", builder: "Schindler", built: "1948–1949; back in service since 2017", fleet: "17 in service", topSpeedMph: 75, lengthFt: 72.2,
    source: "https://cp.pt/info/en/miradouro-train", about: "The MiraDouro's Schindler coaches, with windows that open over the Douro." },
  cp2240Cab: { ...u22, about: "A driving trailer, one at each end of the unit. The 2240s run the regional trains under the wires (the Algarve's too since July 2026), Coimbra's urbanos and some of Porto's." },
  cp2240Mid: { ...u22, about: "The motor car, in the middle, with the pantograph. One class throughout." },
  cp3400Cab: { ...u34, about: "An end car. The 3400s run all of Porto's urbanos: Braga, Guimarães, Marco, Aveiro and Leixões." },
  cp3400Mid: { ...u34, about: "An intermediate car; the four cars share their trucks at the joints." },
  cp2300Cab: { ...u23, about: "A motor car, with the cab. The 2300s and 2400s run the Sintra and Sado lines and, with the 3500s, the Azambuja line." },
  cp2300Mid: { ...u23, about: "A trailer; one class throughout, no toilets (built for suburban runs)." },
  cp3500Cab: { ...u35, about: "A double-deck motor car with the cab, in CP's red. CP's 3500s run the Azambuja line." },
  cp3500Mid: { ...u35, about: "A double-deck trailer." },
  cp3150Cab: { ...cas, about: "A motor car with the cab. The Cascais line's own trains, on its 1,500 V DC; usually two units coupled." },
  cp3150Mid: { ...cas, about: "A trailer (the 3250s have two)." },
  cp592Cab: { ...u59, about: "A motor car with the cab. CP leases these from Renfe for the Douro, the Celta to Vigo and the Oeste; one class." },
  cp592Mid: { ...u59, about: "The trailer in the middle." },
  cp0450: { model: "CP 0450 (UDD)", type: "Diesel multiple unit", builder: "Sorefame", built: "1998–2000", fleet: "19 two-car units", topSpeedMph: 75, source: WIKI("S%C3%A9rie_0450_da_CP"),
    about: "Each of the two cars has a cab. Since the Algarve's wires went live in July 2026 they run the Oeste and the Alentejo (Beja)." },
  cp0350: { model: "CP 0350 (Allan)", type: "Diesel railbus", builder: "Allan; rebuilt by CP", fleet: "About 5 in service", topSpeedMph: 62, source: WIKI("S%C3%A9rie_0350_da_CP"),
    about: "A single car with a cab at each end, on the Linha do Leste between Entroncamento and Elvas." },
  cp9630: { model: "CP 9630", type: "Metre-gauge diesel multiple unit", builder: "Sorefame and CAF", built: "1991", fleet: "7 two-car units", topSpeedMph: 56, source: WIKI("S%C3%A9rie_9630_da_CP"),
    about: "The only trains on the Linha do Vouga, CP's last metre-gauge line (Espinho–Oliveira de Azeméis, Aveiro–Sernada do Vouga)." },
};
