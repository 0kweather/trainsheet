// China Railway High-speed's cars (scripts/railroads/china.py, "crhsr": the
// G and C trains): the two 350 km/h "Fuxing" standard EMUs, CR400AF (CRRC
// Qingdao Sifang) and CR400BF (CRRC Changchun), and the "Hexie" CRH380A
// before them. 12306's timetable names no unit, so a train is drawn as a
// model that usually runs its kind, labeled as typical. Trainsheet's own
// side views from published dimensions and photographs, at the shared
// scale (js/carart.js), in China Railway's paint, lettered here (no logo
// files). Bodies and parts from czechia.cars.js.

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
// From photographs (Wikimedia Commons, fetched November 2026). All three
// carry their windows in a black band the length of the train, a colored
// line under it, and a pale roof.
// CR400AF: pearl silver; a "China red" line under the band, which at the
// cab becomes a ribbon running down the long nose to its tip and a second
// one up over the cab to the roof; the band tapers to a point beside the
// windshield. CR400BF: white; a gold line under the band and a fine bronze
// one lower on the side; at the cab the gold sweeps round the cab's side
// window and up to the roof, a black mask over the windshield. CRH380A:
// white with a silver cast; a blue line under the band, running forward
// down the nose; the band tapers to a long point.
const CR = { silver: "#d9dcdf", white: "#f1f2f1", pearl: "#e9ebec", roof: "#b4b9be", roofAF: "#a9aeb4", band: "#17181b", glass: "#2a2f37",
  red: "#d7142a", gold: "#c8963c", bronze: "#a8763a", blue: "#1f4fa3", skirt: "#8f959c", under: "#2a2c30", ink: "#2b2d31", lamp: "#f4f4ee" };

// A plug door, single leaf, flush with the side: body-colored, its window
// in the black band.
const plugDoor = (x, sill, top, w = 2.9) => ({ x, w, y0: sill, y1: top, leaves: 1, glassY: 0.56, glassH: 0.34, grabs: false, fill: "rgba(0,0,0,0.045)" });
// The door's outline, as the seam shows on the real side.
const doorSeam = (x, w, y0, y1) => rect(x, y0, w, y1 - y0, "none", 0, 'stroke="rgba(0,0,0,0.4)" stroke-width="0.7" vector-effect="non-scaling-stroke" rx="0.25"');

// "CR", China Railway's mark of 2017, slanted, white in the window band.
const crMark = (c, x, y, h = 1.5, fill = "#ffffff") => letters(c, x, y, h, "CR", fill, { weight: 800, style: "italic", spacing: "-0.04em", family: SANS });
// "CRH" (China Railway High-speed), white in the window band, a swept
// stroke after it.
const crhMark = (c, x, y, h = 1.35, fill = "#ffffff") => mark(c, x, y,
  `<text x="0" y="${n(h * 0.36)}" font-size="${n(h)}" text-anchor="middle" font-weight="800" letter-spacing="0.02em" font-family="${SANS}" fill="${fill}">CRH</text>` +
  `<path d="M${n(h * 1.33)} ${n(h * 0.34)}Q${n(h * 1.85)} ${n(h * 0.3)} ${n(h * 2.25)} ${n(-h * 0.36)}Q${n(h * 1.77)} ${n(h * 0.02)} ${n(h * 1.33)} ${n(h * 0.34)}Z" fill="${fill}"/>`);
// The train's name over the windows: 复兴号 (Fuxing, "Rejuvenation") or
// 和谐号 (Hexie, "Harmony").
const named = (c, x, y, text, h = 1.25) => letters(c, x, y, h, text, CR.ink, { weight: 600, spacing: "0.3em", family: KAI });
// Low on the side: the car's type code (ZYS, ZE, ZEC, ZES) and, on the end
// cars, the unit's class.
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

// The cars' kinds, front to back, as China Railway letters them: ZYS
// (first class with a business-class saloon behind the cab), ZE (second
// class), ZEC (second class and the buffet), ZES (second class with a
// business saloon).
const CODE = { zys: "ZYS", ze: "ZE", zec: "ZEC", zes: "ZES" };

// ---------- Fuxing: CR400AF and CR400BF ----------
// The China Standardized EMU of 2016, eight cars, four motored (cars 2, 4,
// 5 and 7), 209 m. CR400AF: end cars 27.91 m, intermediates 25.65 m; BF:
// end cars 27.089 m, intermediates the same 25.65 m. Both 3.36 m wide and
// 4.05 m tall, the floor 1.26 m over the rail for 1.25 m platforms; trucks
// 17.8 m apart on 920 mm wheels; a plug door a side at each end of the
// intermediates, the end cars' behind the cab and at the inner end. Seat
// windows about 1.4 m wide, one to two rows. Pantographs on cars 3 and 6,
// one raised. The AF's nose is some 12 m long and low; the BF's shorter and
// blunter, with a deep windshield.
const FX = { roof: 13.3, sill: 4.1, band: [7.55, 3.2], line: [6.95, 0.3], top: 10.95 };
const NOSE_AF = [[1.5, 2.5], [0.5, 3.6], ["q", 0.3, 5.3, 3.2, 6.5], [15.0, 10.4], ["q", 22.5, 13.3, 31.5, 13.3]];
const NOSE_BF = [[1.3, 2.5], [0.55, 3.9], ["q", 0.5, 6.7, 2.9, 7.8], [11.0, 11.5], ["q", 14.6, 13.3, 21.0, 13.3]];
const AFP = { base: CR.silver, roof: CR.roofAF, line: CR.red, skirt: "#c3c7cb" };
const BFP = { base: CR.white, roof: CR.roof, line: CR.gold, skirt: "#dfe1e2" };

// The side: body, roof, the colored line, the black band from x0 on (the
// whole car on an intermediate), the dark underside.
function fxPaint(P, x0, cabArt = "") {
  return (c, g) => bands(g.L, [[0, 20, P.base], [12.75, 3, P.roof], [FX.line[0], FX.line[1], P.line], [0, 1.6, CR.under]]) +
    (P === BFP ? rect(-1, 5.75, g.L + 2, 0.12, CR.bronze) : "") +
    rect(x0, FX.band[0], g.L + 1 - x0, FX.band[1], CR.band) + cabArt;
}
// The AF's cab: the line and band cleared from the nose; the band drawn to
// a point beside the windshield, the cab's side window in it; the red line
// swelling into a ribbon down the nose, and a second ribbon up over the
// cab to the roof.
const AF_CAB = rect(-1, 6.6, 31, 4.3, CR.silver) +
  path("M30 7.55L22.5 7.55Q16.5 7.6 11.2 8.35Q16.5 9.9 22.0 10.75L30 10.75Z", CR.band) +
  path("M30 6.95L22.5 6.95Q13 6.9 6.5 6.0Q3.2 5.5 1.2 4.6Q2.6 6.3 6.4 7.0Q8.6 7.5 10.6 8.2Q16 7.3 22.5 7.25L30 7.25Z", CR.red) +
  path("M10.6 8.2Q12.4 8.0 13.6 8.6Q19 11.6 27.5 13.3L29.6 13.3Q20 11.2 14.6 8.2Q12.6 7.4 10.6 8.2Z", CR.red) +
  path(poly([[16.6, 8.45], [21.4, 8.1], [21.4, 10.0], [19.4, 10.0]]), CR.glass, 0.4);
// The BF's: a black mask from the windshield back to the band; the gold
// line turning up round the cab's side window to the roof, and gold round
// that window.
const BF_CAB = rect(-1, 6.6, 26, 4.3, CR.white) + rect(-1, 5.7, 12.5, 0.25, CR.white) +
  path("M25 7.55L17.5 7.55Q13.4 7.6 12.0 8.5Q13.4 9.9 16.2 10.75L25 10.75Z", CR.band) +
  path("M25 6.95L16 6.95Q10.6 7.0 9.3 8.2Q11.8 11.2 17.2 13.3L18.9 13.3Q13.2 10.8 11.0 8.3Q12.2 7.3 16.2 7.25L25 7.25Z", CR.gold) +
  path("M6.2 8.9Q9.2 10.9 13.2 12.9L16.4 13.3L17.2 13.3Q11.8 11.2 9.3 8.2Q7.6 8.2 6.2 8.9Z", CR.band) +
  path(poly([[13.3, 8.55], [17.6, 8.1], [17.6, 10.15], [15.6, 10.15]]), CR.glass, 0, `stroke="${CR.gold}" stroke-width="1.1" vector-effect="non-scaling-stroke"`);

const fxRows = (a, b) => rowOf(a, b, 7.95, 4.5, 2.4, 6.56, 0.35);
// The business saloon behind the cab has fewer, shorter windows.
const fxSaloon = (a, b) => rowOf(a, b, 7.95, 3.4, 2.4, 7.6, 0.35);
const fxRoofGear = (L, a) => hvac(a, FX.roof + 0.29, 13, 0.55) + hvac(L - 23, FX.roof + 0.29, 10, 0.55);

function fxCab(c, V) {
  const L = c.L, af = V.key === "af", d1 = V.door, k = c.index + 1;
  return unit(c, { roof: FX.roof, sill: FX.sill, nose: V.nose, rake: V.rake, depth: V.depth, cabLen: V.cabLen, lampY: V.lampY, low: 4.0,
    rows: [...fxSaloon(d1 + 4.6, d1 + 20.5), ...fxRows(d1 + 22.5, L - 15.5)],
    doors: [plugDoor(d1, FX.sill, FX.top), plugDoor(L - 4.9, FX.sill, FX.top)], trucks: [L - 71.3, L - 12.9], wheel: 36,
    diaphragm: [4.3, 11.9], paint: fxPaint(V.P, V.bandFrom, V.art), surround: CR.band,
    extra: (cc, g) => fairing(V.roofFrom, g.L - 1.0, FX.roof, V.P.roof) + fxRoofGear(g.L, d1 + 8) +
      skirt(L - 64.5, L - 19.6, V.P.skirt) + boxes(L - 63, L - 21, 3.25, 4, 1.35) +
      doorSeam(d1, 2.9, FX.sill, FX.top) + doorSeam(L - 4.9, 2.9, FX.sill, FX.top) +
      // 复兴号 over the windows behind the cab door; "CR" in the band at the
      // inner end; the unit's class and the car's kind low on the side.
      named(cc, d1 + 12.5, 11.85, "复兴号") + crMark(cc, L - 10.6, 9.15) +
      small(cc, d1 + 9.5, 5.2, af ? "CR400AF" : "CR400BF", 0.56) + small(cc, L - 24, 5.2, CODE[cc.cls]) + carNo(cc, L - 7.0, 6.0, k) });
}
function fxMid(c, V) {
  const L = c.L, k = c.index + 1;
  // The pantographs ride on cars 3 and 6; car 3's is drawn raised.
  const pan = k === 3 || k === 6;
  // The buffet (car 5) has a blind stretch by the counter.
  const rows = c.cls === "zec" ? [...fxRows(7.0, L * 0.52), ...rowOf(L * 0.52 + 9.5, L - 15.5, 7.95, 3.0, 2.4, 9.0, 0.35)] : fxRows(7.0, L - 15.5);
  return unit(c, { roof: FX.roof, sill: FX.sill, rows,
    doors: [plugDoor(2.0, FX.sill, FX.top), plugDoor(L - 4.9, FX.sill, FX.top)], trucks: [12.9, L - 12.9], wheel: 36,
    diaphragm: [4.3, 11.9], paint: fxPaint(V.P, -1),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, FX.roof, V.P.roof) +
      (pan ? pantograph(g.L * 0.3, FX.roof + 0.29, { up: k === 3, facing: -1 }) + hvLine(g.L * 0.3 + 3.0, g.L * 0.3 + 10.5, FX.roof + 0.29) + hvac(g.L - 27, FX.roof + 0.29, 13, 0.55)
        : fxRoofGear(g.L, 10)) +
      skirt(19.6, L - 19.6, V.P.skirt) + boxes(21, L - 21, 3.25, 4, 1.35) +
      doorSeam(2.0, 2.9, FX.sill, FX.top) + doorSeam(L - 4.9, 2.9, FX.sill, FX.top) +
      crMark(cc, L - 10.6, 9.15) + small(cc, L * 0.5, 5.2, CODE[cc.cls]) + carNo(cc, L - 7.0, 6.0, k) });
}
const AF = { key: "af", P: AFP, nose: NOSE_AF, rake: [[11.6, 9.4], [20.0, 12.4]], depth: 3.6, cabLen: 31, lampY: 4.5, door: 31.0, bandFrom: 30, roofFrom: 31.5, art: AF_CAB };
const BF = { key: "bf", P: BFP, nose: NOSE_BF, rake: [[5.2, 8.9], [12.2, 12.1]], depth: 3.4, cabLen: 22, lampY: 5.0, door: 26.0, bandFrom: 25, roofFrom: 21.0, art: BF_CAB };

// ---------- CRH380A ----------
// CSR Qingdao Sifang's 350 km/h train of 2010, grown from the CRH2C: eight
// cars, six motored (the end cars trail), 203 m; end cars 26.5 m,
// intermediates 25.0 m; 3.38 m wide and only 3.70 m tall; trucks 17.5 m
// apart on 860 mm wheels; pantographs on cars 4 and 6. A very long, low
// nose (12 m) with a canopy of a windshield; small seat windows, one to a
// row, close together in the band.
const HX = { roof: 12.15, sill: 4.1, band: [7.35, 2.75], line: [6.8, 0.26], top: 10.5 };
const NOSE_380 = [[1.6, 2.5], [0.5, 3.3], ["q", 0.2, 4.6, 3.0, 5.5], [17.0, 9.0], ["q", 26.0, 12.15, 37.0, 12.15]];
function hxPaint(x0, cabArt = "") {
  return (c, g) => bands(g.L, [[0, 20, CR.pearl], [11.7, 3, CR.roof], [HX.line[0], HX.line[1], CR.blue], [0, 1.6, CR.under]]) +
    rect(x0, HX.band[0], g.L + 1 - x0, HX.band[1], CR.band) + cabArt;
}
// The cab: the band drawn out to a long point along the nose, the cab's
// side window in it; the blue line running on forward, down to the tip.
const HX_CAB = rect(-1, 6.2, 39, 4.0, CR.pearl) +
  path("M38 7.35L30 7.35Q22 7.3 16.5 7.6Q22 9.0 30.5 10.1L38 10.1Z", CR.band) +
  path("M38 6.8L30 6.8Q17 6.6 8.5 5.5Q4.4 4.9 1.6 4.0Q3.6 5.4 8.4 6.1Q17 7.1 30 7.06L38 7.06Z", CR.blue) +
  path(poly([[24.0, 7.8], [29.4, 7.75], [29.4, 9.3], [27.6, 9.3]]), CR.glass, 0.4);
const hxRows = (a, b) => rowOf(a, b, 7.75, 2.2, 1.95, 3.22, 0.3);
// First and business class: wider windows, further apart.
const hxWide = (a, b) => rowOf(a, b, 7.75, 3.0, 1.95, 4.4, 0.3);
const hxRoofGear = (L, a) => hvac(a, HX.roof + 0.29, 12, 0.5) + hvac(L - 22, HX.roof + 0.29, 10, 0.5);
function hxCab(c) {
  const L = c.L, k = c.index + 1, d1 = 37.6;
  return unit(c, { roof: HX.roof, sill: HX.sill, nose: NOSE_380, rake: [[14.4, 8.6], [25.0, 11.5]], depth: 4.2, cabLen: 37, lampY: 4.2, low: 4.0,
    rows: c.cls === "zys" ? [...hxWide(d1 + 4.4, d1 + 14.5), ...hxWide(d1 + 17.5, L - 7.2)] : [...hxWide(d1 + 4.4, d1 + 14.5), ...hxRows(d1 + 17.5, L - 7.2)],
    doors: [plugDoor(d1, HX.sill, HX.top, 2.7), plugDoor(L - 4.7, HX.sill, HX.top, 2.7)], trucks: [L - 69.7, L - 12.3], wheel: 34,
    diaphragm: [4.3, 11.0], paint: hxPaint(38, HX_CAB), surround: CR.band,
    extra: (cc, g) => fairing(37.0, g.L - 1.0, HX.roof) + hvac(d1 + 10, HX.roof + 0.29, 12, 0.5) + hvac(g.L - 20, HX.roof + 0.29, 9, 0.5) +
      skirt(L - 63, L - 19, "#d4d7d9") + boxes(L - 61, L - 21, 3.25, 3, 1.35) +
      doorSeam(d1, 2.7, HX.sill, HX.top) + doorSeam(L - 4.7, 2.7, HX.sill, HX.top) +
      // 和谐号 over the windows; "CRH" in the band behind the cab door; the
      // unit's class under the line.
      named(cc, d1 + 11, 10.95, "和谐号", 1.1) + crhMark(cc, d1 + 17.0, 8.72) +
      small(cc, d1 + 8.5, 5.2, "CRH380A", 0.56) + small(cc, L - 24, 5.2, CODE[cc.cls]) + carNo(cc, L - 6.7, 5.9, k) });
}
function hxMid(c) {
  const L = c.L, k = c.index + 1;
  // The pantographs ride on cars 4 and 6; car 4's is drawn raised.
  const pan = k === 4 || k === 6;
  const rows = c.cls === "zec" ? [...hxRows(6.8, L * 0.5), ...rowOf(L * 0.5 + 9, L - 7.0, 7.75, 2.6, 1.95, 8.2, 0.3)] : hxRows(6.8, L - 7.0);
  return unit(c, { roof: HX.roof, sill: HX.sill, rows,
    doors: [plugDoor(2.0, HX.sill, HX.top, 2.7), plugDoor(L - 4.7, HX.sill, HX.top, 2.7)], trucks: [12.3, L - 12.3], wheel: 34,
    diaphragm: [4.3, 11.0], paint: hxPaint(-1),
    extra: (cc, g) => fairing(1.0, g.L - 1.0, HX.roof) +
      (pan ? pantograph(g.L * 0.32, HX.roof + 0.29, { up: k === 4, facing: -1 }) + hvLine(g.L * 0.32 + 3.0, g.L * 0.32 + 10.5, HX.roof + 0.29) + hvac(g.L - 26, HX.roof + 0.29, 12, 0.5)
        : hxRoofGear(g.L, 10)) +
      skirt(19, L - 19, "#d4d7d9") + boxes(21, L - 21, 3.25, 4, 1.35) +
      doorSeam(2.0, 2.7, HX.sill, HX.top) + doorSeam(L - 4.7, 2.7, HX.sill, HX.top) +
      small(cc, L * 0.5, 5.2, CODE[cc.cls]) + carNo(cc, L - 6.7, 5.9, k) });
}

// ---------- Tables ----------

// The eight cars, front to back (car 1 at the front), on all three: car 1
// ZYS, first class with a small business-class saloon behind the cab; cars
// 2-4 ZE, second class; car 5 ZEC, second class and the buffet counter;
// cars 6-7 ZE; car 8 ZES, second class with a business saloon behind its
// cab. Each kind is its own type, placed in the formation, with its own
// fact sheet; the pantograph cars are drawn by their place in the train.
export const TYPES = {
  crAfFirst: { name: "CR400AF first and business class end car", kind: "emu", amenities: ["first", "business"] },
  crAfMid: { name: "CR400AF second class car", kind: "emu", pan: true },
  crAfBuffet: { name: "CR400AF second class and buffet car", kind: "emu", amenities: ["cafe"] },
  crAfCab: { name: "CR400AF second and business class end car", kind: "emu", amenities: ["business"] },
  crBfFirst: { name: "CR400BF first and business class end car", kind: "emu", amenities: ["first", "business"] },
  crBfMid: { name: "CR400BF second class car", kind: "emu", pan: true },
  crBfBuffet: { name: "CR400BF second class and buffet car", kind: "emu", amenities: ["cafe"] },
  crBfCab: { name: "CR400BF second and business class end car", kind: "emu", amenities: ["business"] },
  cr380First: { name: "CRH380A first and business class end car", kind: "emu", amenities: ["first", "business"] },
  cr380Mid: { name: "CRH380A second class car", kind: "emu", pan: true },
  cr380Buffet: { name: "CRH380A second class and buffet car", kind: "emu", amenities: ["cafe"] },
  cr380Cab: { name: "CRH380A second and business class end car", kind: "emu", amenities: ["business"] },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Lengths in feet: CR400AF 27.91 m and 25.65 m; CR400BF 27.089 m and
// 25.65 m; CRH380A 26.5 m and 25.0 m.
export const MODELS = {
  crAfFirst: M((c) => fxCab({ ...c, cls: "zys" }, AF), 91.6, true),
  crAfMid: M((c) => fxMid({ ...c, cls: "ze" }, AF), 84.15, false, byIndex),
  crAfBuffet: M((c) => fxMid({ ...c, cls: "zec" }, AF), 84.15, false, byIndex),
  crAfCab: M((c) => fxCab({ ...c, cls: "zes" }, AF), 91.6, true),
  crBfFirst: M((c) => fxCab({ ...c, cls: "zys" }, BF), 88.9, true),
  crBfMid: M((c) => fxMid({ ...c, cls: "ze" }, BF), 84.15, false, byIndex),
  crBfBuffet: M((c) => fxMid({ ...c, cls: "zec" }, BF), 84.15, false, byIndex),
  crBfCab: M((c) => fxCab({ ...c, cls: "zes" }, BF), 88.9, true),
  cr380First: M((c) => hxCab({ ...c, cls: "zys" }), 86.9, true),
  cr380Mid: M((c) => hxMid({ ...c, cls: "ze" }), 82.0, false, byIndex),
  cr380Buffet: M((c) => hxMid({ ...c, cls: "zec" }), 82.0, false, byIndex),
  cr380Cab: M((c) => hxCab({ ...c, cls: "zes" }), 86.9, true),
};

// 12306 names no unit, and the three classes' serials overlap (CR400AF-2xxx,
// CR400BF-5xxx, CRH380A-2xxx), so no units are listed by number.
export const FLEETS = {
  crhsr: [],
};

const set = (label, ...units) => ({ label, units });
const eight = (p) => [[p + "First", 1], [p + "Mid", 3], [p + "Buffet", 1], [p + "Mid", 2], [p + "Cab", 1]];
const CR400AF = set("CR400AF Fuxing: eight cars; first and business class in car 1, the buffet in car 5, business seats in car 8 too", ...eight("crAf"));
const CR400BF = set("CR400BF Fuxing: eight cars; first and business class in car 1, the buffet in car 5, business seats in car 8 too", ...eight("crBf"));
const CRH380A = set("CRH380A Hexie: eight cars; first and business class in car 1, the buffet in car 5, business seats in car 8 too", ...eight("cr380"));
const BY_MODEL = Object.fromEntries([["crAf", CR400AF], ["crBf", CR400BF], ["cr380", CRH380A]].flatMap(([p, s]) => ["First", "Mid", "Buffet", "Cab"].map((k) => [p + k, s])));

// By the reported unit; else by train number. China Railway publishes no
// rosters by train, and all three classes (with their 16- and 17-car
// versions, and others not drawn here) work G trains everywhere, two
// eight-car units often coupled. As a rough guide only: the C trains
// (intercity shuttles) are drawn as CRH380As, and the G trains as Fuxings,
// CR400AFs on the odd-numbered hundreds and CR400BFs on the even; the
// label says "usually" and any of them may appear.
export const TYPICAL = {
  crhsr: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const s = String(t.number || "").toUpperCase(), k = Number(s.replace(/\D/g, ""));
    if (s.startsWith("C")) return CRH380A;
    return Math.floor(k / 100) % 2 ? CR400AF : CR400BF;
  },
};

const FUXING = "https://en.wikipedia.org/wiki/Fuxing_(train)";
const HEXIE = "https://en.wikipedia.org/wiki/China_Railway_CRH380A";
const af = { model: "CR400AF Fuxing", type: "High-speed electric multiple unit", builder: "CRRC Qingdao Sifang", built: "Since 2016",
  fleet: "Eight-car units (16- and 17-car versions too)", topSpeedMph: 217, powerHp: 13947, seats: 576, source: FUXING };
const bf = { model: "CR400BF Fuxing", type: "High-speed electric multiple unit", builder: "CRRC Changchun and CRRC Tangshan", built: "Since 2016",
  fleet: "Eight-car units (16- and 17-car versions too)", topSpeedMph: 217, powerHp: 13598, seats: 576, source: FUXING };
const hx = { model: "CRH380A Hexie", type: "High-speed electric multiple unit", builder: "CSR (now CRRC) Qingdao Sifang", built: "Since 2010",
  fleet: "Eight-car units (the 16-car CRH380AL too)", topSpeedMph: 217, powerHp: 12874, seats: 556, source: HEXIE };
const FX_FIRST = "Car 1: a small business-class saloon of lie-flat seats behind the cab, and first class (2+2) behind it.";
const FX_MID = "Second class, seated 3+2. Cars 2, 4, 5 and 7 are motored; the pantographs ride on cars 3 and 6.";
const FX_BUFFET = "Car 5: second class, with the buffet counter at one end.";
const FX_CAB = "Car 8: second class, with a business-class saloon behind the cab.";
export const FACTS = {
  crAfFirst: { ...af, lengthFt: 686,
    about: FX_FIRST + " The CR400AF is CRRC Qingdao Sifang's Fuxing (\"Rejuvenation\"), the China Standardized EMU: designed for 400 km/h and run at 350 since 2017 on the Beijing–Shanghai line; silver, with a red line." },
  crAfMid: { ...af, about: FX_MID },
  crAfBuffet: { ...af, about: FX_BUFFET },
  crAfCab: { ...af, about: FX_CAB + " An eight-car unit seats 556 or 576: 10 in business, 28 in first and the rest in second class." },
  crBfFirst: { ...bf, lengthFt: 686,
    about: FX_FIRST + " The CR400BF is CRRC Changchun's Fuxing, built to the same standard as the CR400AF and able to run coupled to one; white, with a gold line and a blunter nose." },
  crBfMid: { ...bf, about: FX_MID },
  crBfBuffet: { ...bf, about: FX_BUFFET },
  crBfCab: { ...bf, about: FX_CAB + " An eight-car unit seats 556 or 576: 10 in business, 28 in first and the rest in second class." },
  cr380First: { ...hx, lengthFt: 666,
    about: "Car 1: first class, with a business-class saloon behind the cab. The CRH380A Hexie (\"Harmony\") entered service in 2010 on the Shanghai–Nanjing line; a sixteen-car CRH380AL reached 486.1 km/h on test that December." },
  cr380Mid: { ...hx, about: "Second class, seated 3+2. Six of the eight cars are motored (the end cars trail); the pantographs ride on cars 4 and 6." },
  cr380Buffet: { ...hx, about: "Car 5: second class, with the buffet counter at one end." },
  cr380Cab: { ...hx, about: "Car 8: second class, with a business-class saloon behind the cab." },
};
