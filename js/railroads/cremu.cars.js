// China Railway EMU's cars (scripts/railroads/china.py, "cremu": the D
// trains, 200-250 km/h): the two "Hexie" trains of 2007 that still work most
// of them, the Shinkansen-derived CRH2A (Kawasaki and CSR Qingdao Sifang)
// and the Pendolino-derived CRH5A (Alstom and CNR Changchun), and the
// 250 km/h "Fuxing" that follows them, CR300AF (CRRC Qingdao Sifang).
// 12306's timetable names no unit, so a train is drawn as a model that
// usually runs its kind, labeled as typical. Trainsheet's own side views
// from published dimensions and photographs, at the shared scale
// (js/carart.js), in China Railway's paint, lettered here (no logo files).
// Bodies and parts from czechia.cars.js.

import { C, rect, path, line, lines, poly, truck, slats, underframe } from "../carart.js?v=dev";
import { unit, letters, mark, hvac, hvLine } from "./czechia.cars.js?v=dev";
import { pantograph } from "../carart.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// The trains' names are brushed on in a kai (regular script) hand.
const KAI = "'Kaiti SC', STKaiti, KaiTi, 'Noto Serif CJK SC', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', serif";

// ---------- Paint ----------
// From photographs (Wikimedia Commons, fetched November 2026).
// CRH2A: white, the roof pale gray; a blue line under the windows, which
// are single dark panes in the white side, no band; at the cab the line
// runs on forward and down the long nose, and the windshield's canopy is
// rimmed in blue; "CRH" in blue beside the cab, 和谐号 over the first
// windows. CRH5A: white; a broader blue line under tall, close-set windows,
// ending in a downward flick behind the cab; a black mask over the
// windshield running up to the roof, the cab's side window a black wedge;
// gray ribbed skirts. CR300AF: a pale silver-blue; the windows in a black
// band the length of the train, a red line under it; at the cab the band
// ends in a point, the red swells into a ribbon running down the nose to
// its tip, a second ribbon goes up over the cab to the roof, and the cab's
// side window is a black lozenge between them.
const CR = { white: "#f2f3f2", pearl: "#e9ebec", ice: "#cddbea", roof: "#b4b9be", roofIce: "#a7b1bc", band: "#17181b", glass: "#2a2f37",
  red: "#d7142a", blue: "#1f4fa3", under: "#2a2c30", ink: "#2b2d31" };

// A plug door, single leaf, flush with the side and body-colored.
const plugDoor = (x, sill, top, w = 2.9, glassH = 0.34) => ({ x, w, y0: sill, y1: top, leaves: 1, glassY: 0.56, glassH, grabs: false, fill: "rgba(0,0,0,0.045)" });
// The door's outline, as the seam shows on the real side.
const doorSeam = (x, w, y0, y1) => rect(x, y0, w, y1 - y0, "none", 0, 'stroke="rgba(0,0,0,0.4)" stroke-width="0.7" vector-effect="non-scaling-stroke" rx="0.25"');
// The driver's own door, narrow, with a small window.
const crewDoor = (x, sill, top, y) => doorSeam(x, 2.0, sill, top) + rect(x + 0.45, y, 1.1, 1.5, CR.glass, 0.4, 'rx="0.2"');

// "CRH" (China Railway High-speed) with its swept stroke, blue on the
// white side behind the cab.
const crhMark = (c, x, y, h = 1.35, fill = CR.blue) => mark(c, x, y,
  `<text x="0" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="middle" font-weight="800" letter-spacing="0.02em" font-family="${SANS}" fill="${fill}">CRH</text>` +
  `<path d="M${n(h * 1.33)} ${n(h * 0.34)}Q${n(h * 1.85)} ${n(h * 0.3)} ${n(h * 2.25)} ${n(-h * 0.36)}Q${n(h * 1.77)} ${n(h * 0.02)} ${n(h * 1.33)} ${n(h * 0.34)}Z" fill="${fill}"/>`);
// "CR", China Railway's mark of 2017, slanted, white in the window band.
const crMark = (c, x, y, h = 1.5, fill = "#ffffff") => letters(c, x, y, h, "CR", fill, { weight: 800, style: "italic", spacing: "-0.04em", family: SANS });
// The train's name over the windows: 和谐号 (Hexie, "Harmony") or 复兴号
// (Fuxing, "Rejuvenation").
const named = (c, x, y, text, h = 1.2) => letters(c, x, y, h, text, CR.ink, { weight: 600, spacing: "0.3em", family: KAI });
// Low on the side: the car's type code and, on the end cars, the unit's
// class.
const small = (c, x, y, text, h = 0.5) => letters(c, x, y, h, text, CR.ink, { weight: 600, spacing: "0.05em", family: SANS });
// The car's number on a plate beside its door.
const carNo = (c, x, y, k) => mark(c, x, y, `<rect x="-0.62" y="-0.62" width="1.24" height="1.24" rx="0.16" fill="${CR.band}"/>`) + letters(c, x, y, 0.85, String(k), "#f4d77a", { weight: 700, family: SANS });

// The skirt over the underfloor equipment, between the trucks, with its
// hatches' seams.
const skirt = (a, b, fill, top = 3.25) => rect(a, 1.5, b - a, top - 1.5, fill, 0.4, 'rx="0.2"') +
  lines(seq(a + 3.2, 3.6, Math.max(0, Math.floor((b - a - 3.4) / 3.6))).map((x) => [x, 1.7, x, top - 0.15]), "rgba(0,0,0,0.2)", 0.4);
// A low roof fairing the length of the car.
const fairing = (a, b, roof, fill = CR.roof) => rect(a, roof - 0.05, b - a, 0.34, fill, 0.4, 'rx="0.17"');
// Windows in a row from a to b, centered.
function rowOf(a, b, y, w, h, pitch, r = 0.3) {
  const k = Math.max(1, Math.floor((b - a - w) / pitch) + 1), x0 = a + (b - a - ((k - 1) * pitch + w)) / 2;
  return [{ xs: seq(x0, pitch, k), y, w, h, r }];
}

// The cars' kinds as China Railway letters them: ZY (first class), ZE
// (second class), ZEC (second class and the buffet).
const CODE = { zy: "ZY", ze: "ZE", zec: "ZEC" };

// ---------- CRH2A ----------
// Kawasaki's E2-1000 Shinkansen train as built for China from 2006, most
// of them by CSR Qingdao Sifang: eight cars, four motored (cars 2, 3, 6
// and 7), 201.4 m; end cars 25.7 m, intermediates 25.0 m; 3.38 m wide and
// 3.70 m tall, for 1.25 m platforms; trucks 17.5 m apart on 860 mm wheels;
// pantographs on cars 4 and 6. A long, low nose with a bubble of a
// windshield; the E2-1000's wide windows, one to two rows of seats (ten on
// a second class car); a plug door a side at each end of the car, and the
// driver's own door behind the cab.
const H2 = { roof: 12.15, sill: 4.1, line: [6.8, 0.32], top: 10.5, winY: 7.55, winH: 2.1 };
const NOSE_2 = [[1.4, 2.5], [0.5, 3.4], ["q", 0.3, 5.1, 3.2, 6.1], [14.0, 9.5], ["q", 19.5, 12.15, 26.5, 12.15]];
function h2Paint(cabArt = "") {
  return (c, g) => bands(g.L, [[0, 20, CR.white], [11.7, 3, CR.roof], [H2.line[0], H2.line[1], CR.blue], [0, 1.6, CR.under]]) + cabArt;
}
// The cab: the line cleared from the nose and drawn again sinking forward
// to a point low on it; a blue rim under the canopy.
const H2_CAB = rect(-1, 6.4, 28.5, 1.2, CR.white) +
  path("M27.5 6.8L24 6.75Q15 6.3 6.0 4.5Q14 5.6 24 6.45L27.5 7.12Z", CR.blue) +
  path("M8.6 7.9Q14.5 8.6 21.4 11.2L21.8 11.75Q14.6 9.3 8.6 7.9Z", CR.blue);
const h2Rows = (a, b) => rowOf(a, b, H2.winY, 4.3, H2.winH, 6.43, 0.32);
// First class: the seats further apart, the windows with them.
const h2Wide = (a, b) => rowOf(a, b, H2.winY, 4.9, H2.winH, 7.6, 0.32);
const h2RoofGear = (L, a) => hvac(a, H2.roof + 0.29, 12, 0.5) + hvac(L - 22, H2.roof + 0.29, 10, 0.5);
const H2_SKIRT = "#dfe1e2";
function h2Cab(c) {
  const L = c.L, k = c.index + 1, d0 = 24.6, d1 = 28.0;
  return unit(c, { roof: H2.roof, sill: H2.sill, nose: NOSE_2, rake: [[10.4, 8.5], [19.6, 11.6]], depth: 4.0, cabLen: 26, lampY: 4.6, low: 4.0,
    rows: h2Rows(d1 + 5.0, L - 14.5),
    doors: [plugDoor(d1, H2.sill, H2.top, 2.7), plugDoor(L - 4.7, H2.sill, H2.top, 2.7)], trucks: [L - 69.7, L - 12.3], wheel: 34,
    diaphragm: [4.3, 11.0], paint: h2Paint(H2_CAB), surround: CR.blue,
    extra: (cc, g) => fairing(26.5, g.L - 1.0, H2.roof) + hvac(d1 + 8, H2.roof + 0.29, 12, 0.5) + hvac(g.L - 20, H2.roof + 0.29, 9, 0.5) +
      skirt(L - 63, L - 19, H2_SKIRT) + boxes(L - 61, L - 21, 3.25, 3, 1.35) +
      crewDoor(d0, H2.sill, H2.top - 0.4, 8.0) + doorSeam(d1, 2.7, H2.sill, H2.top) + doorSeam(L - 4.7, 2.7, H2.sill, H2.top) +
      // "CRH" beside the cab; 和谐号 over the first windows; the unit's class
      // and the car's kind under the line.
      crhMark(cc, 19.2, 7.55, 1.25) + named(cc, d1 + 13.5, 10.75, "和谐号", 1.1) +
      small(cc, d1 + 9.5, 5.2, "CRH2A", 0.56) + small(cc, L - 24, 5.2, CODE[cc.cls]) + carNo(cc, L - 6.7, 5.9, k) });
}
function h2Mid(c) {
  const L = c.L, k = c.index + 1;
  // The pantographs ride on cars 4 and 6; car 4's is drawn raised.
  const pan = k === 4 || k === 6;
  // The buffet (car 5) has a blind stretch by the counter.
  const rows = c.cls === "zec" ? [...h2Rows(7.0, L * 0.5), ...rowOf(L * 0.5 + 9, L - 7.0, H2.winY, 3.0, H2.winH, 8.6, 0.32)]
    : c.cls === "zy" ? h2Wide(7.0, L - 7.0) : h2Rows(7.0, L - 7.0);
  return unit(c, { roof: H2.roof, sill: H2.sill, rows,
    doors: [plugDoor(2.0, H2.sill, H2.top, 2.7), plugDoor(L - 4.7, H2.sill, H2.top, 2.7)], trucks: [12.3, L - 12.3], wheel: 34,
    diaphragm: [4.3, 11.0], paint: h2Paint(),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, H2.roof) +
      (pan ? pantograph(g.L * 0.32, H2.roof + 0.29, { up: k === 4, facing: -1 }) + hvLine(g.L * 0.32 + 3.0, g.L * 0.32 + 10.5, H2.roof + 0.29) + hvac(g.L - 26, H2.roof + 0.29, 12, 0.5)
        : h2RoofGear(g.L, 10)) +
      skirt(19, L - 19, H2_SKIRT) + boxes(21, L - 21, 3.25, 4, 1.35) +
      doorSeam(2.0, 2.7, H2.sill, H2.top) + doorSeam(L - 4.7, 2.7, H2.sill, H2.top) +
      small(cc, L * 0.5, 5.2, CODE[cc.cls]) + carNo(cc, L - 6.7, 5.9, k) });
}

// ---------- CRH5A ----------
// Alstom's New Pendolino without the tilt, widened for China and built
// from 2006 at Savigliano and then by CNR Changchun: eight cars, five
// motored (cars 1, 2, 4, 7 and 8), 211.5 m; end cars 27.6 m, intermediates
// 25.0 m; 3.2 m wide and 4.27 m tall, its steps serving platforms from
// 500 mm to 1.25 m; trucks 19.0 m apart on 890 mm wheels; pantographs on
// cars 3 and 6. A short, blunt nose under a deep windshield; tall, narrow
// windows, one to a row; a plug door a side at each end of the
// intermediates, the end cars' at the inner end, with the driver's own
// door behind the cab.
const H5 = { roof: 14.0, sill: 4.15, line: [6.75, 0.5], top: 11.2, winY: 7.9, winH: 3.0 };
const NOSE_5 = [[1.2, 2.6], [0.5, 4.2], ["q", 0.4, 6.6, 2.6, 7.8], [10.4, 12.5], ["q", 13.2, 14.0, 17.5, 14.0]];
function h5Paint(cabArt = "") {
  return (c, g) => bands(g.L, [[0, 20, CR.white], [13.5, 3, CR.roof], [H5.line[0], H5.line[1], CR.blue], [0, 1.6, CR.under]]) + cabArt;
}
// The cab: the line stops behind it with a flick downward; a black mask
// from under the windshield up to the roof; the side window a black wedge.
const H5_CAB = rect(-1, 6.4, 20.5, 1.2, CR.white) +
  path("M19.5 7.25L19.5 6.75Q17.6 6.7 15.6 5.9Q17.0 6.9 19.5 7.25Z", CR.blue) +
  path("M3.2 8.1Q7.6 7.9 11.4 8.9Q12.6 11.6 16.4 14.0L11.8 14.0Q7.0 11.4 3.2 8.1Z", CR.band) +
  path(poly([[13.2, 9.0], [17.2, 8.7], [17.2, 11.0], [15.4, 11.0]]), CR.glass, 0.4);
const h5Rows = (a, b) => rowOf(a, b, H5.winY, 3.0, H5.winH, 4.9, 0.3);
// First class: wider apart.
const h5Wide = (a, b) => rowOf(a, b, H5.winY, 3.2, H5.winH, 5.5, 0.3);
const h5RoofGear = (L, a) => hvac(a, H5.roof + 0.29, 13, 0.55) + hvac(L - 24, H5.roof + 0.29, 11, 0.55);
// The gray ribbed skirts along the underframe.
const h5Skirt = (a, b) => rect(a, 1.5, b - a, 1.8, "#c4c8cc", 0.4, 'rx="0.2"') + slats(a + 0.5, 1.8, b - a - 1.0, 1.2, 0.4, "rgba(0,0,0,0.16)");
function h5Cab(c) {
  const L = c.L, k = c.index + 1, d0 = 23.4;
  return unit(c, { roof: H5.roof, sill: H5.sill, nose: NOSE_5, rake: [[4.4, 8.8], [10.6, 12.7]], depth: 3.4, cabLen: 18, lampY: 5.4, low: 4.1,
    rows: c.cls === "zy" ? h5Wide(d0 + 6.0, L - 12.5) : h5Rows(d0 + 6.0, L - 12.5),
    doors: [plugDoor(L - 5.2, H5.sill, H5.top, 2.9, 0.3)], trucks: [L - 72.15, L - 9.85], wheel: 35,
    diaphragm: [4.4, 12.4], paint: h5Paint(H5_CAB), surround: CR.band,
    extra: (cc, g) => fairing(17.5, g.L - 1.0, H5.roof) + hvac(d0 + 10, H5.roof + 0.29, 13, 0.55) + hvac(g.L - 22, H5.roof + 0.29, 10, 0.55) +
      h5Skirt(L - 66.5, L - 15.5) + boxes(L - 64, L - 18, 3.3, 3, 1.3) +
      crewDoor(d0, H5.sill, H5.top - 0.6, 8.3) + doorSeam(L - 5.2, 2.9, H5.sill, H5.top) +
      // "CRH" behind the cab's side window, over the line's end; 和谐号
      // over the first windows; the unit's class under the line.
      crhMark(cc, 20.0, 8.25, 1.1) + named(cc, d0 + 13.5, 12.2, "和谐号", 1.15) +
      small(cc, d0 + 10, 5.45, "CRH5A", 0.56) + small(cc, L - 24, 5.45, CODE[cc.cls]) + carNo(cc, L - 7.4, 6.0, k) });
}
function h5Mid(c) {
  const L = c.L, k = c.index + 1;
  // The pantographs ride on cars 3 and 6; car 3's is drawn raised.
  const pan = k === 3 || k === 6;
  // The buffet (car 6) has a blind stretch by the counter.
  const rows = c.cls === "zec" ? [...h5Rows(7.4, L * 0.48), ...rowOf(L * 0.48 + 9, L - 7.4, H5.winY, 3.0, H5.winH, 8.6, 0.3)] : h5Rows(7.4, L - 7.4);
  return unit(c, { roof: H5.roof, sill: H5.sill, rows,
    doors: [plugDoor(2.2, H5.sill, H5.top, 2.9, 0.3), plugDoor(L - 5.1, H5.sill, H5.top, 2.9, 0.3)], trucks: [9.85, L - 9.85], wheel: 35,
    diaphragm: [4.4, 12.4], paint: h5Paint(),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, H5.roof) +
      (pan ? pantograph(g.L * 0.3, H5.roof + 0.29, { up: k === 3, facing: -1 }) + hvLine(g.L * 0.3 + 3.0, g.L * 0.3 + 10.5, H5.roof + 0.29) + hvac(g.L - 28, H5.roof + 0.29, 13, 0.55)
        : h5RoofGear(g.L, 10)) +
      h5Skirt(15.5, L - 15.5) + boxes(18, L - 18, 3.3, 4, 1.3) +
      doorSeam(2.2, 2.9, H5.sill, H5.top) + doorSeam(L - 5.1, 2.9, H5.sill, H5.top) +
      small(cc, L * 0.5, 5.45, CODE[cc.cls]) + carNo(cc, L - 7.3, 6.0, k) });
}

// ---------- CR300AF ----------
// CRRC Qingdao Sifang's 250 km/h Fuxing of 2018, in service since 2020,
// the CR400AF's body with half its power and a shorter nose: eight cars,
// four motored (cars 2, 4, 5 and 7), 208.95 m; intermediates 25.65 m, the
// end cars the rest, about 27.5 m each; 3.36 m wide and 4.05 m tall;
// trucks 17.8 m apart on 920 mm wheels; pantographs on cars 3 and 6. A
// plug door a side at each end of the intermediates, the end cars' behind
// the cab and at the inner end.
const FX = { roof: 13.3, sill: 4.1, band: [7.55, 3.2], line: [6.95, 0.3], top: 10.95 };
const NOSE_300 = [[1.5, 2.5], [0.5, 3.6], ["q", 0.3, 5.4, 3.0, 6.6], [12.0, 10.6], ["q", 18.0, 13.3, 25.0, 13.3]];
const FX_SKIRT = "#bcc7d2";
function fxPaint(x0, cabArt = "") {
  return (c, g) => bands(g.L, [[0, 20, CR.ice], [12.75, 3, CR.roofIce], [FX.line[0], FX.line[1], CR.red], [0, 1.6, CR.under]]) +
    rect(x0, FX.band[0], g.L + 1 - x0, FX.band[1], CR.band) + cabArt;
}
// The cab: the line and band cleared from the nose; the band drawn to a
// point behind the cab; the red line swelling into a ribbon down the nose,
// a second ribbon up over the cab to the roof, and the side window a black
// lozenge between them.
const FX_CAB = rect(-1, 6.6, 26, 4.3, CR.ice) +
  path("M25 7.55L21.5 7.55Q18.6 7.7 17.0 8.6Q18.8 10.0 21.6 10.75L25 10.75Z", CR.band) +
  path("M25 6.95L19 6.95Q11 6.9 5.5 5.6Q3.0 5.0 1.4 4.2Q2.4 6.0 5.6 6.8Q7.6 7.4 9.4 8.1Q14 7.3 19 7.25L25 7.25Z", CR.red) +
  path("M9.4 8.1Q11 7.9 12.0 8.5Q16.5 11.6 22.5 13.3L24.4 13.3Q17 11.2 12.8 8.1Q11 7.4 9.4 8.1Z", CR.red) +
  path(poly([[12.8, 8.2], [14.6, 8.75], [16.6, 8.2], [14.6, 7.75]]), CR.glass, 0.4);
const fxRows = (a, b) => rowOf(a, b, 7.95, 4.5, 2.4, 6.56, 0.35);
// First class: the seats, and the windows, further apart.
const fxWide = (a, b) => rowOf(a, b, 7.95, 4.5, 2.4, 7.4, 0.35);
const fxRoofGear = (L, a) => hvac(a, FX.roof + 0.29, 13, 0.55) + hvac(L - 23, FX.roof + 0.29, 10, 0.55);
function fxCab(c) {
  const L = c.L, k = c.index + 1, d1 = 26.0;
  return unit(c, { roof: FX.roof, sill: FX.sill, nose: NOSE_300, rake: [[8.4, 9.2], [16.2, 12.5]], depth: 3.6, cabLen: 25, lampY: 4.6, low: 4.0,
    rows: c.cls === "zy" ? fxWide(d1 + 4.6, L - 15.5) : fxRows(d1 + 4.6, L - 15.5),
    doors: [plugDoor(d1, FX.sill, FX.top), plugDoor(L - 4.9, FX.sill, FX.top)], trucks: [L - 71.3, L - 12.9], wheel: 36,
    diaphragm: [4.3, 11.9], paint: fxPaint(25, FX_CAB), surround: CR.band,
    extra: (cc, g) => fairing(25.0, g.L - 1.0, FX.roof, CR.roofIce) + fxRoofGear(g.L, d1 + 8) +
      skirt(L - 64.5, L - 19.6, FX_SKIRT) + boxes(L - 63, L - 21, 3.25, 4, 1.35) +
      doorSeam(d1, 2.9, FX.sill, FX.top) + doorSeam(L - 4.9, 2.9, FX.sill, FX.top) +
      // 复兴号 over the windows behind the cab door; "CR" in the band at the
      // inner end; the unit's class and the car's kind low on the side.
      named(cc, d1 + 12.5, 11.85, "复兴号", 1.25) + crMark(cc, L - 10.6, 9.15) +
      small(cc, d1 + 9.5, 5.2, "CR300AF", 0.56) + small(cc, L - 24, 5.2, CODE[cc.cls]) + carNo(cc, L - 7.0, 6.0, k) });
}
function fxMid(c) {
  const L = c.L, k = c.index + 1;
  // The pantographs ride on cars 3 and 6; car 3's is drawn raised.
  const pan = k === 3 || k === 6;
  // The buffet (car 5) has a blind stretch by the counter.
  const rows = c.cls === "zec" ? [...fxRows(7.0, L * 0.52), ...rowOf(L * 0.52 + 9.5, L - 15.5, 7.95, 3.0, 2.4, 9.0, 0.35)] : fxRows(7.0, L - 15.5);
  return unit(c, { roof: FX.roof, sill: FX.sill, rows,
    doors: [plugDoor(2.0, FX.sill, FX.top), plugDoor(L - 4.9, FX.sill, FX.top)], trucks: [12.9, L - 12.9], wheel: 36,
    diaphragm: [4.3, 11.9], paint: fxPaint(-1),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, FX.roof, CR.roofIce) +
      (pan ? pantograph(g.L * 0.3, FX.roof + 0.29, { up: k === 3, facing: -1 }) + hvLine(g.L * 0.3 + 3.0, g.L * 0.3 + 10.5, FX.roof + 0.29) + hvac(g.L - 27, FX.roof + 0.29, 13, 0.55)
        : fxRoofGear(g.L, 10)) +
      skirt(19.6, L - 19.6, FX_SKIRT) + boxes(21, L - 21, 3.25, 4, 1.35) +
      doorSeam(2.0, 2.9, FX.sill, FX.top) + doorSeam(L - 4.9, 2.9, FX.sill, FX.top) +
      crMark(cc, L - 10.6, 9.15) + small(cc, L * 0.5, 5.2, CODE[cc.cls]) + carNo(cc, L - 7.0, 6.0, k) });
}

// ---------- Tables ----------

// The eight cars, front to back (car 1 at the front). CRH2A, as first
// delivered: cars 1-4 ZE, second class; car 5 ZEC, second class and the
// buffet; car 6 ZE; car 7 ZY, first class; car 8 ZE. CRH5A, as most were
// built (5013-5042 and 5054-5140): car 1 ZY, first class; cars 2-5 ZE; car
// 6 ZEC; car 7 ZE; car 8 ZY. CR300AF: car 1 ZY; cars 2-4 ZE; car 5 ZEC;
// cars 6-8 ZE. Each kind is its own type, placed in the formation, with
// its own fact sheet; the pantograph cars are drawn by their place in the
// train.
export const TYPES = {
  cr2Cab: { name: "CRH2A second class end car", kind: "emu" },
  cr2Mid: { name: "CRH2A second class car", kind: "emu", pan: true },
  cr2Buffet: { name: "CRH2A second class and buffet car", kind: "emu", amenities: ["cafe"] },
  cr2First: { name: "CRH2A first class car", kind: "emu", amenities: ["first"] },
  cr5First: { name: "CRH5A first class end car", kind: "emu", amenities: ["first"] },
  cr5Mid: { name: "CRH5A second class car", kind: "emu", pan: true },
  cr5Buffet: { name: "CRH5A second class and buffet car", kind: "emu", pan: true, amenities: ["cafe"] },
  cr300First: { name: "CR300AF first class end car", kind: "emu", amenities: ["first"] },
  cr300Mid: { name: "CR300AF second class car", kind: "emu", pan: true },
  cr300Buffet: { name: "CR300AF second class and buffet car", kind: "emu", amenities: ["cafe"] },
  cr300Cab: { name: "CR300AF second class end car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Lengths in feet: CRH2A 25.7 m and 25.0 m; CRH5A 27.6 m and 25.0 m;
// CR300AF about 27.5 m and 25.65 m.
export const MODELS = {
  cr2Cab: M((c) => h2Cab({ ...c, cls: "ze" }), 84.3, true),
  cr2Mid: M((c) => h2Mid({ ...c, cls: "ze" }), 82.0, false, byIndex),
  cr2Buffet: M((c) => h2Mid({ ...c, cls: "zec" }), 82.0, false, byIndex),
  cr2First: M((c) => h2Mid({ ...c, cls: "zy" }), 82.0, false, byIndex),
  cr5First: M((c) => h5Cab({ ...c, cls: "zy" }), 90.55, true),
  cr5Mid: M((c) => h5Mid({ ...c, cls: "ze" }), 82.0, false, byIndex),
  cr5Buffet: M((c) => h5Mid({ ...c, cls: "zec" }), 82.0, false, byIndex),
  cr300First: M((c) => fxCab({ ...c, cls: "zy" }), 90.3, true),
  cr300Mid: M((c) => fxMid({ ...c, cls: "ze" }), 84.15, false, byIndex),
  cr300Buffet: M((c) => fxMid({ ...c, cls: "zec" }), 84.15, false, byIndex),
  cr300Cab: M((c) => fxCab({ ...c, cls: "ze" }), 90.3, true),
};

// 12306 names no unit, and the classes' serials overlap (CRH2A-2xxx and
// -4xxx, CRH5A-5xxx, CR300AF-2xxx and -5xxx), so no units are listed by
// number.
export const FLEETS = {
  cremu: [],
};

const set = (label, ...units) => ({ label, units });
const CRH2A = set("CRH2A Hexie: eight cars; the buffet in car 5, first class in car 7",
  ["cr2Cab", 1], ["cr2Mid", 3], ["cr2Buffet", 1], ["cr2Mid", 1], ["cr2First", 1], ["cr2Cab", 1]);
const CRH5A = set("CRH5A Hexie: eight cars; first class in cars 1 and 8, the buffet in car 6",
  ["cr5First", 1], ["cr5Mid", 4], ["cr5Buffet", 1], ["cr5Mid", 1], ["cr5First", 1]);
const CR300AF = set("CR300AF Fuxing: eight cars; first class in car 1, the buffet in car 5",
  ["cr300First", 1], ["cr300Mid", 3], ["cr300Buffet", 1], ["cr300Mid", 2], ["cr300Cab", 1]);
const BY_MODEL = { cr2Cab: CRH2A, cr2Mid: CRH2A, cr2Buffet: CRH2A, cr2First: CRH2A, cr5First: CRH5A, cr5Mid: CRH5A, cr5Buffet: CRH5A,
  cr300First: CR300AF, cr300Mid: CR300AF, cr300Buffet: CR300AF, cr300Cab: CR300AF };

// By the reported unit; else by train number. China Railway publishes no
// rosters by train: the CRH2As work D trains over most of the country, the
// CRH5As in the north, northeast and northwest (they are the cold-weather
// fleet), the CR300AFs on the newer 250 km/h lines, alongside CRH1s,
// CR300BFs and others not drawn here, two eight-car units often coupled.
// A train's number tells none of that, so as a rough guide only the three
// are shared out by the number's hundreds; the label says "usually" and
// any of them may appear.
export const TYPICAL = {
  cremu: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const k = Number(String(t.number || "").replace(/\D/g, "")) || 0;
    return [CRH2A, CR300AF, CRH5A][Math.floor(k / 100) % 3];
  },
};

const CRH2 = "https://en.wikipedia.org/wiki/China_Railway_CRH2";
const CRH5 = "https://en.wikipedia.org/wiki/China_Railway_CRH5";
const FUXING = "https://en.wikipedia.org/wiki/Fuxing_(train)";
const h2 = { model: "CRH2A Hexie", type: "High-speed electric multiple unit", builder: "Kawasaki Heavy Industries and CSR (now CRRC) Qingdao Sifang", built: "Since 2006",
  fleet: "About 490 eight-car units", topSpeedMph: 155, powerHp: 6437, seats: 610, source: CRH2 };
const h5 = { model: "CRH5A Hexie", type: "High-speed electric multiple unit", builder: "Alstom (Savigliano) and CNR (now CRRC) Changchun", built: "Since 2006",
  fleet: "140 eight-car units", topSpeedMph: 155, powerHp: 7376, seats: 586, source: CRH5 };
const fx = { model: "CR300AF Fuxing", type: "High-speed electric multiple unit", builder: "CRRC Qingdao Sifang", built: "Since 2018",
  fleet: "Eight-car units", topSpeedMph: 155, seats: 613, source: FUXING };
export const FACTS = {
  cr2Cab: { ...h2, lengthFt: 661,
    about: "An end car, second class, seated 3+2; both end cars trail. The CRH2A Hexie (\"Harmony\") is Kawasaki's E2-1000 Shinkansen train as built for China: the first three came from Japan in 2006, the rest from Qingdao Sifang. In service since 2007, at up to 250 km/h." },
  cr2Mid: { ...h2, about: "Second class, seated 3+2. Cars 2, 3, 6 and 7 are motored; the pantographs ride on cars 4 and 6." },
  cr2Buffet: { ...h2, about: "Car 5: second class, with the buffet counter at one end." },
  cr2First: { ...h2, about: "Car 7: first class, seated 2+2. Later units carry first class in car 3 as well, or instead." },
  cr5First: { ...h5, lengthFt: 694,
    about: "Cars 1 and 8: first class, seated 2+2, behind the cab (the first twelve units had second class in car 1). The CRH5A Hexie (\"Harmony\") is Alstom's New Pendolino without the tilt, built for the cold: it began on the Beijing–Harbin line in April 2007 and still works the north, northeast and northwest." },
  cr5Mid: { ...h5, about: "Second class, seated 3+2. Five of the eight cars are motored (cars 1, 2, 4, 7 and 8); the pantographs ride on cars 3 and 6." },
  cr5Buffet: { ...h5, about: "Car 6: second class, with the buffet counter at one end; it carries the second pantograph." },
  cr300First: { ...fx, lengthFt: 686,
    about: "Car 1: first class, seated 2+2, 48 seats. The CR300AF is the 250 km/h Fuxing (\"Rejuvenation\"), CRRC Qingdao Sifang's successor to the CRH2A, in service since 2020; the same body as the CR400AF, pale silver-blue with a red line." },
  cr300Mid: { ...fx, about: "Second class, seated 3+2. Cars 2, 4, 5 and 7 are motored; the pantographs ride on cars 3 and 6." },
  cr300Buffet: { ...fx, about: "Car 5: second class, with the buffet counter at one end." },
  cr300Cab: { ...fx, about: "Car 8: second class. An eight-car unit seats 613: 48 in first class and 565 in second." },
};
