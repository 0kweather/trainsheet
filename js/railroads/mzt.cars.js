// MŽ Transport's cars (scripts/railroads/northmacedonia.py, agency
// "mzt"): the passenger railroad of North Macedonia. Its timetable in
// this feed has 34 trains: the 6xx Skopje–Bitola/Gevgelija/Veles, the
// 2xxx Skopje–Kumanovo and the 3xxx Skopje–Zelenikovo locals. Trainsheet's
// own side views at the shared scale (js/carart.js), each drawn from one
// photograph on Wikimedia Commons, named here fleet by fleet. The
// lettering is drawn here (no logo files); the MŽ mark is not drawn.
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Every one of
// the photographs is a three-quarter or front view, so the windows'
// spacing, the doors' places, the roof equipment, what hangs under the
// floor and every length are Trainsheet's reading of the type, not
// measurements.
//
//   441, the electric locomotive (Končar, ex-JŽ 441): 441-107 at Skopje,
//     23 Apr 2010 ("23.04.10 Skopje 441.107 & 712.107
//     (5821492431).jpg"). Orange all over with a red band below the
//     windows and a white stripe between them, a red buffer beam, a grey
//     roof, two windshields and round headlamps, one pantograph up,
//     hauling grey coaches. The small round windows along the side are
//     drawn as a reading.
//   661, the diesel locomotive (GM-EMD G16, ex-JŽ 661): 661-236 at Bitola,
//     22 Apr 2010 ("22.04.10 Bitola 661.236 (5821472001).jpg") and
//     661-219 at Skopje the next day ("23.04.10 Skopje 661.219
//     (5821479619).jpg"). Dark green, a yellow chevron on the nose, two
//     yellow stripes along the side, yellow handrails, hauling red coaches
//     with a yellow band — the Bitola-line train as it runs. A hood unit:
//     the cab near the front, the long hood behind it, two three-axle
//     trucks. The chevron on the nose is drawn on the side as a yellow V
//     at the front end.
//   712, the diesel railcar (Đuro Đaković, ex-JŽ 712): 712-107 at Gjorče
//     Petrov, 23 Apr 2010 ("23.04.10 Gjorche Petrov 712.107
//     (5821485025).jpg"), and head-on at Skopje the same day (the 441
//     photograph above). Cream with a red band at window level and an
//     orange band below it, a grey roof, two windshields and the round
//     headlamp on the roof, "712-107" on the nose and side. A two-car set:
//     a driving car at each end.
//   461, the electric locomotive (ASEA, ex-JŽ 461): 461-116 at Skopje,
//     2003 ("MŽ 461.jpg"). Weathered grey-blue JŽ livery (a blue band at
//     window level and along the roof edge, a grey body), oval portholes
//     along the side, round headlamps in a pod on the cab roof, two
//     pantographs, a red coach behind. NO photograph of a 461 in a
//     distinct MŽ livery was found — this one still wears JŽ colours, and
//     it is drawn as photographed.
//   411, the CRRC electric unit (the modern suburban stock): 411-103 in
//     service at Zelenikovo Novo, 7 Oct 2018 ("MŽ 411 103 at Zelenikovo
//     Novo.jpg") and front three-quarter at the builder's plant, 6 Jan
//     2016 ("MŽ 411-103@BCR (20160106155835).jpg"). White with a red band
//     along the roofline, a black window band, red doors, a yellow sweep
//     under the nose and the red swoosh down the cab's side, "411-103" and
//     the MŽ Transport roundel. A two-car set: a driving car at each end.
//     The 411 is photographed on the Skopje–Zelenikovo line itself.
//   412/416, the RVR electric unit (412 motor cars, 416 trailers):
//     412-054 at Skopje, 27 Jun 2011 ("Macedonia (5881146055).jpg").
//     Light blue with a white roof and a white band low on the side, a
//     white chevron on the nose, red doors, "412-054" on the nose. The
//     window/door layout is from that photograph's side view; the 416
//     trailer in this livery has no photograph of its own, so the trailer
//     is drawn in the same livery as a judgement. The pantograph on the
//     second car is a reading.
//   The coaches: no standalone coach photograph was found; coaches appear
//     only in the backgrounds above. The grey coach is the one behind
//     441-107 at Skopje (silver-grey, the windows in a dark band, a grey
//     roof); the red coach is the one behind both 661s (red with a yellow
//     band at window level, a dark roof) — the red/yellow set is the
//     Bitola-line stock. Both coaches' windows, doors and lengths are
//     those of the standard 24.5 m Goša coach, not counted from a
//     photograph.
//
// The honest caveats:
//   The timetable names no locomotive or unit, so every fleet assignment
//     is a judgement, labeled as typical; see TYPICAL below. The 712 runs
//     no train in this timetable: the 712s worked the Kičevo and Kočani
//     branches, which have no passenger service in this feed's timetable.
//     It is drawn all the same, with a fact sheet, so the model exists
//     when service returns.
//   The FLEETS ranges are judgements — only 441-107, 661-219, 661-236,
//     712-107, 461-116, 411-103 and 412-054 are photographed.
//   The lengths are judgements: the 441 15.5 m and the 461 18.6 m, the
//     661 17.5 m, the 712 22.5 m a car (the DB 628 figure), the 411 25 m a
//     car, the 412/416 19.6 m a car (the ER2 figure, as in
//     georgianrailway.cars.js), the coaches 24.5 m.
//   All locomotive photographs are 2003–2011; liveries may have changed
//     since. The 411 photographs (2016/2018) are the only current-livery
//     references.

//   VERIFIED after writing (23 Nov 2026): node --check passes; TYPICAL
//     run over all 34 mzt runs through the real consist.js — 0 failures,
//     0 nulls (6 × 661 + three red coaches on the 64x Bitola trains,
//     2 × 441 and 2 × 461 + three grey coaches on the 61x/63x Gevgelija
//     trains, 8 × 412/416 four-car sets on the 20xx Kumanovo/Veles trains
//     and 600/601, 16 × 411 two-car sets on the 30xx/31xx Zelenikovo
//     trains); every one of the 11 models rendered and looked at beside
//     its photograph (three fixes made in the pass: the 661's chevron
//     redrawn as a compact V at the nose, its handrail thinned, the 411's
//     number moved clear of its first door; the MŽ mark was left undrawn
//     after its first attempt read as stray flags). Renders and the
//     verification script live in the build's work/verify-c1/.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, truck, underframe, lines, slats, poly } from "../carart.js?v=dev";
import { unit, euroLoco, letters, hvac, buffers, exhaust, tank } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Class 441: the Končar electric locomotive ----------
// Orange with a red band below the windows and a white stripe between
// them, a red buffer beam, a grey roof. Two windshields, round headlamps,
// one pantograph up, small round windows along the side (a reading).
const E441 = { orange: "#e86e1a", red: "#c8322b", white: "#f2f3f4", roof: "#8f959b", skirt: "#5a2028", ink: "#ffffff" };
const NOSE_441 = [[1.4, 4.1], [1.1, 7.0], ["q", 1.1, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
function e441Paint(c, L) {
  let s = bands(L, [[0, 20, E441.orange], [12.25, 3, E441.roof], [0, 4.1, E441.skirt]]);
  s += rect(-1, 5.6, L + 2, 1.4, E441.red) + rect(-1, 7.0, L + 2, 0.35, E441.white);
  return s;
}
const mzt441 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_441, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 26, wheel: 49, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: e441Paint,
  grilles: [[-8, 12, 7.4, 9.2]], grilleFill: "rgba(20,22,25,0.35)",
  over: (cc, L) => letters(cc, 15, 4.9, 0.62, "441-107", E441.ink, { weight: 600 }) +
    [18, 24, 30, 36].map((x) => circle(x, 10.6, 0.55, C.glass, 0.5)).join("") });

// ---------- Class 461: the ASEA electric locomotive ----------
// Weathered grey-blue JŽ livery as photographed: a light grey body, a blue
// band at window level and along the roof edge, a blue-grey skirt, oval
// portholes along the side, round headlamps in a pod on the cab roof, two
// pantographs. No MŽ-liveried 461 was photographed; this is 461-116 as it
// stands in the 2003 photograph.
const E461 = { grey: "#c7cbc6", blue: "#4f7d9c", roof: "#9aa0a6", skirt: "#5d6b73", ink: "#3a4a55" };
const NOSE_461 = [[1.5, 4.1], [1.2, 7.0], ["q", 1.2, 8.5, 2.3, 9.5], [3.6, 12.3], ["q", 4.3, 13.0, 6.1, 13.0]];
function e461Paint(c, L) {
  let s = bands(L, [[0, 20, E461.grey], [12.25, 3, E461.roof], [0, 4.1, E461.skirt]]);
  s += rect(-1, 11.6, L + 2, 0.65, E461.blue) + rect(-1, 8.6, L + 2, 1.0, E461.blue);
  return s;
}
const mzt461 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_461, rake: [[2.3, 9.5], [3.6, 12.3]], centers: 34, wheel: 49, surround: "#1d2026",
  door: 7.0, doorW: 2.0, paint: e461Paint,
  grilles: [[-10, 14, 7.0, 8.4]], grilleFill: "rgba(20,22,25,0.3)",
  over: (cc, L) => letters(cc, 15, 4.9, 0.62, "461-116", E461.ink, { weight: 600 }) +
    [20, 28, 36].map((x) => circle(x, 10.4, 0.6, C.glass, 0.5)).join("") +
    // The round headlamps in their pod on each cab roof.
    [2.6, L - 2.6].map((x) => rect(x - 1.6, 13.0, 3.2, 1.0, E461.grey, 0.4, 'rx="0.4"') +
      circle(x - 0.7, 13.5, 0.42, "#fff4cf", 0.3) + circle(x + 0.7, 13.5, 0.42, "#fff4cf", 0.3)).join("") });

// ---------- Class 661: the GM-EMD G16 diesel ----------
// A hood unit: the cab near the front, the long hood behind it, two
// three-axle trucks. Dark green, a yellow chevron on the nose, two yellow
// stripes along the side, yellow handrails. Drawn with plain primitives
// (the BDZ class 55 pattern), not euroLoco, which is cab-at-each-end.
const D661 = { green: "#1e4a38", yellow: "#f2c21a", roof: "#2a332e", frame: "#2a2d31", ink: "#f2c21a" };
function mzt661(c) {
  const L = c.L, deck = 4.4, hood = 11.0, cabTop = 13.4, cab0 = 10.0, cab1 = 18.0;
  let s = buffers(0, -1, { end: 1.4, sill: deck, y: 3.45 }) + buffers(L, 1, { end: 1.4, sill: deck, y: 3.45 });
  // The frame and its walkway.
  s += rect(1.3, deck - 0.9, L - 2.6, 0.9, D661.frame, 0.5);
  // The short nose ahead of the cab, the cab, the long hood behind it.
  s += path(poly([[2.2, deck], [2.2, hood - 0.6], ["q", 2.2, hood, 2.8, hood], [cab0, hood], [cab0, deck]]), D661.green, 0.5);
  s += path(poly([[cab0, deck], [cab0, cabTop - 0.7], ["q", cab0, cabTop, cab0 + 0.8, cabTop], [cab1 - 0.8, cabTop], ["q", cab1, cabTop, cab1, cabTop - 0.7], [cab1, deck]]), D661.green, 0.5);
  s += path(poly([[cab1, deck], [cab1, hood - 0.4], [L - 2.8, hood - 0.4], ["q", L - 2.2, hood - 0.4, L - 2.2, hood - 1.0], [L - 2.2, deck]]), D661.green, 0.5);
  // The yellow chevron on the nose: a compact V band at the nose's front
  // edge (its arms sweep back along the nose's sides in the photograph),
  // and the two yellow stripes along the whole side.
  s += path("M2.2 10.2L4.5 8.0L2.2 5.8L2.2 6.9L3.6 8.0L2.2 9.1Z", D661.yellow);
  s += rect(2.2, 9.35, L - 4.4, 0.28, D661.yellow) + rect(2.2, 8.85, L - 4.4, 0.28, D661.yellow);
  // Hood doors and louvers, the radiator at the long hood's far end, the
  // cab windows and door, handrails along the walkway.
  for (const x of seq(22.0, 3.2, 8)) s += rect(x, 5.2, 2.8, 3.6, "none", 0.45);
  s += rect(L - 6.0, 5.0, 3.6, 5.3, "rgba(20,22,25,0.35)", 0.4) + slats(L - 6.0, 5.0, 3.6, 5.3, 0.3, "rgba(255,255,255,0.2)");
  s += rect(cab0 + 0.7, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') + rect(cab1 - 3.2, 9.6, 2.5, 2.6, C.glass, 0.5, 'rx="0.25"') +
    rect(cab0 + 3.6, 5.0, 0.4, 6.8, "none", 0.5);
  s += lines([[2.4, deck + 2.2, cab0 - 0.6, deck + 2.2], [cab1 + 0.6, deck + 2.2, L - 2.4, deck + 2.2]], D661.yellow, 0.35);
  s += exhaust(cab1 + 6.0, hood) + rect(cab1 + 12.0, hood - 0.05, 4.4, 0.45, "#1a2b23", 0.4, 'rx="0.2"');
  // The number plate; the MŽ mark is not drawn (see the header).
  s += letters(c, 14, 7.6, 0.55, "661-236", D661.ink, { weight: 600 });
  s += circle(2.6, 6.6, 0.45, "#fff4cf", 0.3) + rect(2.2, 5.8, 0.8, 0.5, "#d8262c", 0.3, 'rx="0.1"');
  s += tank(L / 2 - 4.5, L / 2 + 3.0, deck - 0.9, 1.5);
  for (const x of [10.0, L - 10.0]) s += truck(x, { wb: 8.5, d: 40, kind: "loco", top: deck - 0.9, axles: 3 });
  return s;
}

// ---------- Class 712: the Đuro Đaković diesel railcar ----------
// Two cars, a driving car at each end: cream with a red band at window
// level and an orange band below it, a grey roof, two windshields and the
// round headlamp on the roof, "712-107" on the nose and side.
const DM712 = { cream: "#f0ead8", red: "#c8322b", orange: "#e87a1c", roof: "#9aa0a6", skirt: "#3a3d42" };
const DM712G = { roof: 13.2, sill: 3.6 };
const NOSE_712 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.2, 2.8, 13.2]];
function dm712Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, DM712.cream], [12.35, 3, DM712.roof], [0, 3.95, DM712.skirt]]) +
      rect(-1, 6.6, L + 2, 1.5, DM712.red) + rect(-1, 4.4, L + 2, 1.6, DM712.orange);
    if (cab) s += rect(-1, 6.6, 9, 3.4, DM712.red) + rect(-1, 4.4, 9, 1.6, DM712.orange);
    return s;
  };
}
const dm712Door = (x) => ({ x, w: 3.2, y0: DM712G.sill, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill: DM712.cream });
const dm712Win = (xs) => ({ xs, y: 7.6, w: 2.4, h: 2.8, r: 0.3 });
const mzt712Cab = (c) => unit(c, { roof: DM712G.roof, sill: DM712G.sill, nose: NOSE_712, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 8, lampY: 5.6, bare: true,
  rows: [dm712Win([...seq(20, 3.8, 5), ...seq(48.5, 3.4, 4)])],
  doors: [dm712Door(11.5), dm712Door(44)], trucks: [10.0, c.L - 10.0], wheel: 33, paint: dm712Paint(true), surround: "#1d2026",
  // The round headlamp on the cab roof, and the cab's side window.
  cab: () => circle(2.0, 13.3, 0.55, "#fff4cf", 0.4) + path("M4.6 8.5L7.6 8.5L7.6 11.2L4.6 11.2Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 18.0, 7.0, 0.5, "712-107", "#3a3d42", { weight: 600 }) +
    hvac(16, DM712G.roof, 10, 0.55) + hvac(g.L - 24, DM712G.roof, 12, 0.55) + boxes(16, g.L - 16, DM712G.sill, 3, 1.2) });
const mzt712Mid = (c) => unit(c, { roof: DM712G.roof, sill: DM712G.sill,
  rows: [dm712Win([5.0, 8.4, ...seq(19, 3.4, 7), ...seq(48.5, 3.4, 4)])],
  doors: [dm712Door(14), dm712Door(44)], trucks: [10.0, c.L - 10.0], wheel: 33, paint: dm712Paint(false),
  extra: (cc, g) => hvac(16, DM712G.roof, 12, 0.55) + hvac(g.L - 24, DM712G.roof, 12, 0.55) + boxes(16, g.L - 16, DM712G.sill, 3, 1.2) });

// ---------- Class 411: the CRRC electric unit ----------
// Two cars, a driving car at each end: white with a red band along the
// roofline, a black window band, red doors, a yellow sweep under the nose
// and the red swoosh down the cab's side. The nose is streamlined with a
// deep raked windshield.
const EM411 = { white: "#f2f3f4", red: "#d3222a", black: "#17191c", yellow: "#f2c21a", roof: "#9aa0a6", skirt: "#3a3d42" };
const EM411G = { roof: 12.8, sill: 3.6 };
const NOSE_411 = [[1.6, 3.6], [0.7, 4.7], ["q", 0.4, 6.3, 2.6, 7.7], [10.2, 12.0], ["q", 11.8, 12.8, 14.8, 12.8]];
function em411Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EM411.white], [11.85, 3, EM411.roof], [0, 3.95, EM411.skirt]]) +
      rect(-1, 12.0, L + 2, 0.8, EM411.red) +
      rect(cab ? 20 : -1, 7.0, L - (cab ? 20 : -1) + 1, 3.4, EM411.black, 0, 'rx="0.4"') +
      rect(-1, 6.5, L + 2, 0.5, EM411.yellow);
    if (cab) {
      // The black of the cab's front, then the red swoosh down the cab's
      // side, sweeping from the roof to the yellow line under the window
      // band.
      s += rect(-1, 3.6, 11, 9.2, EM411.black) +
        path("M7.5 3.6L10.5 3.6L16.5 12.8L13.5 12.8Z", EM411.red) +
        path("M10.5 3.6L13.0 3.6L18.5 12.8L16.5 12.8Z", EM411.yellow);
    }
    return s;
  };
}
const em411Door = (x) => ({ x, w: 3.4, y0: EM411G.sill, y1: 10.6, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: false, fill: EM411.red });
const em411Win = (xs) => ({ xs, y: 7.3, w: 4.3, h: 2.6, r: 0.35 });
const mzt411Cab = (c) => unit(c, { roof: EM411G.roof, sill: EM411G.sill, nose: NOSE_411, rake: [[2.6, 7.7], [10.2, 12.0]], depth: 3.6, cabLen: 19, lampY: 5.9, bare: true,
  rows: [{ xs: seq(26.0, 5.6, 6), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [em411Door(21), em411Door(c.L - 4.6)],
  trucks: [14.0, c.L - 10.0], wheel: 35, paint: em411Paint(true), surround: "#14171b",
  // A pantograph on the second car (a reading: one is visible on the car
  // behind the leading car in the Zelenikovo Novo photograph).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  // The eye-like lamp cluster over the windshield, and the cab's side window.
  cab: () => path("M5.5 12.6Q7.5 11.7 9.5 12.6Q7.5 13.5 5.5 12.6Z", "#101215", 0.4) + circle(7.5, 12.6, 0.45, "#fff4cf", 0.3) +
    path("M13.5 7.6L17.5 7.6L17.5 10.2L15.7 10.2Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 28, 5.2, 0.5, "411-103", "#3a3d42", { weight: 600 }) +
    hvac(24, EM411G.roof, 10, 0.6) + hvac(g.L - 20, EM411G.roof, 10, 0.6) + boxes(22, g.L - 16, EM411G.sill, 3, 1.2) });
const mzt411Mid = (c) => unit(c, { roof: EM411G.roof, sill: EM411G.sill,
  rows: [{ xs: seq(6.9, 5.6, 9), y: 7.3, w: 4.3, h: 2.6, r: 0.35 }], doors: [em411Door(1.7), em411Door(c.L - 4.4)],
  trucks: [10.0, c.L - 10.0], wheel: 35, paint: em411Paint(false),
  // A pantograph on the second car (a reading: one is visible on the car
  // behind the leading car in the Zelenikovo Novo photograph).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(8, EM411G.roof, 10, 0.6) + hvac(g.L - 20, EM411G.roof, 10, 0.6) + boxes(16, g.L - 16, EM411G.sill, 3, 1.2) });

// ---------- Class 412/416: the RVR electric unit ----------
// The four-car set (412 motor cars at the ends, 416 trailers between):
// light blue with a white roof and a white band low on the side, a white
// chevron on the nose, red doors. Drawn from 412-054 at Skopje in 2011.
// The 416 trailer in this livery has no photograph of its own, so the
// trailer is drawn in the same livery as a judgement. The pantograph on
// the second car is a reading.
const EM412 = { blue: "#5b9bc4", white: "#f2f3f4", red: "#c8322b", roof: "#dfe3e6", skirt: "#3a3d42", ink: "#2a4a5e", lamp: "#fff4cf" };
const EM412G = { roof: 13.2, sill: 3.6 };
const NOSE_412 = [[0.9, 3.6], [0.7, 8.0], [1.2, 12.2], ["q", 1.4, 13.2, 2.8, 13.2]];
function em412Paint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, EM412.blue], [12.35, 3, EM412.roof], [0, 3.6, EM412.skirt]]) +
      rect(-1, 5.0, L + 2, 1.1, EM412.white);
    if (cab) {
      // The white chevron on the nose, and the red lower front.
      s += path("M-1 5.5L3.5 8.5L-1 11.5L-1 10.5L2.5 8.5L-1 6.5Z", EM412.white) +
        rect(-1, 0, 7, 3.6, EM412.red);
    }
    return s;
  };
}
const em412Door = (x) => ({ x, w: 3.6, y0: EM412G.sill, y1: 10.8, leaves: 2, glassY: 0.45, glassH: 0.4, grabs: true, fill: EM412.red });
const em412Win = (xs) => ({ xs, y: 7.6, w: 2.4, h: 2.8, r: 0.3 });
const mzt412Cab = (c) => unit(c, { roof: EM412G.roof, sill: EM412G.sill, nose: NOSE_412, rake: [[1.0, 8.2], [1.4, 12.2]], depth: 2.6, cabLen: 8, lampY: 5.6, bare: true,
  rows: [em412Win([...seq(20, 3.8, 5), ...seq(48.5, 3.4, 4)])],
  doors: [em412Door(11.5), em412Door(44)], trucks: [10.0, c.L - 10.0], wheel: 33, paint: em412Paint(true), surround: "#1d2026",
  // The headlamp pod on the cab roof, and the cab's side window.
  cab: () => rect(1.6, 13.2, 3.4, 1.1, EM412.roof, 0.4, 'rx="0.4"') + circle(2.7, 13.75, 0.45, EM412.lamp, 0.3) + circle(4.0, 13.75, 0.45, EM412.lamp, 0.3) +
    path("M4.6 8.5L7.6 8.5L7.6 11.2L4.6 11.2Z", "#1d2026", 0.4),
  extra: (cc, g) => letters(cc, 18.0, 7.0, 0.5, "412-054", EM412.ink, { weight: 600 }) +
    hvac(16, EM412G.roof, 10, 0.55) + hvac(g.L - 24, EM412G.roof, 12, 0.55) + boxes(16, g.L - 16, EM412G.sill, 3, 1.2) });
const mzt416Mid = (c) => unit(c, { roof: EM412G.roof, sill: EM412G.sill,
  rows: [em412Win([5.0, 8.4, ...seq(19, 3.4, 7), ...seq(48.5, 3.4, 4)])],
  doors: [em412Door(14), em412Door(44)], trucks: [10.0, c.L - 10.0], wheel: 33, paint: em412Paint(false),
  // A pantograph on the second car (a reading).
  pan: c.index === 1 ? c.L / 2 - 6 : null,
  extra: (cc, g) => hvac(16, EM412G.roof, 12, 0.55) + hvac(g.L - 24, EM412G.roof, 12, 0.55) + boxes(16, g.L - 16, EM412G.sill, 3, 1.2) });

// ---------- The coaches ----------
// The standard 24.5 m Goša coach on two trucks 19 m apart, a door at each
// end, ten windows between. Grey for the 441's trains (the coach behind
// 441-107 at Skopje); red with a yellow band for the 661's Bitola trains
// (the coaches behind both 661s). Both are drawn from backgrounds, not
// from a standalone coach photograph — see the header.
function mztCoach(c, red) {
  const L = c.L, base = red ? "#c8322b" : "#c9ccce", band = red ? "#f2c21a" : "#262c33";
  return coachCar(c, { roof: 13.3, sill: 3.9, end: 0.6, endR: 1.2, base, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.0, b: L - 6.0, y: 7.4, w: 4.6, h: 3.1, pitch: 6.45, r: 0.45 }],
    doors: [2.0, L - 4.6].map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery: () => bands(L, [[12.4, 3, red ? "#6d7073" : "#9aa0a6"], [6.3, 0.9, band], [0, 4.25, "#2a2d31"]]),
    extra: (cc) => hvac(L / 2 - 7, 13.3, 14, 0.7) +
      buffers(0, -1, { sill: 3.9 }) + buffers(L, 1, { sill: 3.9 }) });
}
const coachGrey = (c) => mztCoach(c, false);
const coachRed = (c) => mztCoach(c, true);

// ---------- Tables ----------

export const TYPES = {
  mzt441: { name: "MŽ 441 electric locomotive", kind: "electric" },
  mzt461: { name: "MŽ 461 electric locomotive", kind: "electric" },
  mzt661: { name: "MŽ 661 diesel locomotive", kind: "diesel" },
  mzt712Cab: { name: "Class 712 DMU driving car", kind: "emu" },
  mzt712Mid: { name: "Class 712 DMU trailer car", kind: "emu" },
  mzt411Cab: { name: "Class 411 EMU driving car", kind: "emu" },
  mzt411Mid: { name: "Class 411 EMU trailer car", kind: "emu" },
  mzt412Cab: { name: "Class 412 EMU end car", kind: "emu" },
  mzt416Mid: { name: "Class 416 EMU trailer car", kind: "emu" },
  mztCoachGrey: { name: "MŽ grey coach", kind: "coach" },
  mztCoachRed: { name: "MŽ red coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, each a judgement: the 441 15.5 m, the 461 18.6 m,
// the 661 17.5 m, the 712 22.5 m a car (the DB 628 figure), the 411 25 m a
// car, the 412/416 19.6 m a car (the ER2 figure), the coaches 24.5 m.
export const MODELS = {
  mzt441: M(mzt441, 51.0),
  mzt461: M(mzt461, 61.0),
  mzt661: M(mzt661, 57.0),
  mzt712Cab: M(mzt712Cab, 74.0, true),
  mzt712Mid: M(mzt712Mid, 74.0, false, byIndex),
  mzt411Cab: M(mzt411Cab, 82.0, true),
  mzt411Mid: M(mzt411Mid, 82.0, false, byIndex),
  mzt412Cab: M(mzt412Cab, 64.3, true),
  mzt416Mid: M(mzt416Mid, 64.3, false, byIndex),
  mztCoachGrey: M(coachGrey, 80.0),
  mztCoachRed: M(coachRed, 80.0),
};

// The fleet view: the CRRC sets and the RVR sets, the locomotives and the
// 712s. All ranges are judgements (only 441-107, 661-219, 661-236, 712-107,
// 461-116, 411-103 and 412-054 are photographed).
export const FLEETS = { mzt: [[411101, 411104, "mzt411Cab"], [412050, 412056, "mzt412Cab"], [441101, 441110, "mzt441"], [461101, 461120, "mzt461"], [661219, 661236, "mzt661"], [712101, 712110, "mzt712Cab"]] };

const set = (label, ...units) => ({ label, units });
const hauled = (loco, coach, k, label) => set(label, [loco, 1], [coach, k]);
const BITOLA_SET = hauled("mzt661", "mztCoachRed", 3,
  "Typical: a 661 diesel locomotive and three red coaches (a judgement: the timetable names no locomotive; the 661s haul the Bitola line, photographed at Bitola and Skopje with the red/yellow coaches, and Veles–Bitola is the diesel line)");
const GEVGELIJA_441_SET = hauled("mzt441", "mztCoachGrey", 3,
  "Typical: a 441 electric locomotive and three grey coaches (a judgement: the timetable names no locomotive; the 441s work the electrified main line, photographed at Skopje hauling the grey coaches)");
const GEVGELIJA_461_SET = hauled("mzt461", "mztCoachGrey", 3,
  "Typical: a 461 electric locomotive and three grey coaches (a judgement: the timetable names no locomotive; the 461s work the electrified main line, photographed at Skopje in JŽ colours)");
const EMU411_SET = set("Typical: a two-car class 411 CRRC electric unit (a judgement: the timetable names no unit; the 411 is photographed in service at Zelenikovo Novo, on the Skopje–Zelenikovo line itself)",
  ["mzt411Cab", 1], ["mzt411Cab", 1]);
const EMU412_SET = set("Typical: a four-car class 412/416 electric unit (a judgement: the timetable names no unit; the 412s are the older suburban stock, photographed at Skopje)",
  ["mzt412Cab", 1], ["mzt416Mid", 2], ["mzt412Cab", 1]);
const DMU712_SET = set("Typical: a two-car class 712 diesel unit (a judgement: the timetable names no unit; the 712s worked the Kičevo and Kočani branches, which have no passenger service in this timetable)",
  ["mzt712Cab", 1], ["mzt712Cab", 1]);

// The timetable (the community MŽ GTFS) names no locomotive or unit, so a
// train is placed by its number, and a line's page (which has no number)
// by its two ends. The 64x Skopje–Bitola trains go behind a 661 with the
// red coaches (the diesel line, photographed as such); the 61x/63x
// Skopje–Gevgelija trains behind a 441 or a 461 with grey coaches (the
// electrified main line); the 2xxx Skopje–Kumanovo and 208x Skopje–Veles
// trains behind a 412/416 set; the 3xxx Skopje–Zelenikovo locals behind a
// 411, photographed on that very line. The 712 runs no train in this
// timetable. TYPICAL never returns null.
const fold = (s) => String(s || "").replace(/[йЙ]/g, "").replace(/[їЇ]/g, "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(//g, "й").replace(//g, "ї")
  .replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase().trim();
const ends = (t) => {
  const a = fold(t.origin), b = fold(t.destination || t.dest);
  if (a || b) return `${a} ${b}`;
  return fold(String(t.route || t.line || "").replace(/ – /g, " "));
};
export const TYPICAL = {
  mzt: (t = {}) => {
    const num = String(t.number || "").trim();
    const e = ends(t);
    // 640–645, Skopje–Bitola: the 661 with red coaches.
    if (/^64/.test(num) || /\bbitola\b/.test(e)) return BITOLA_SET;
    // 611, 630–632, Skopje–Gevgelija: 441 on two, 461 on two (the split
    // between the two electrics is arbitrary — a judgement).
    if (/^611$|^63[012]$/.test(num) || /\bgevgelija\b/.test(e)) {
      return /^(611|631)$/.test(num) || (/gevgelija/.test(e) && !num) ? GEVGELIJA_441_SET : GEVGELIJA_461_SET;
    }
    // 2020–2023 Skopje–Kumanovo and 2080/2083 Skopje–Veles: the 412/416.
    if (/^20/.test(num) || /\bkumanovo\b/.test(e) || (/\bveles\b/.test(e) && !/\bbitola\b/.test(e) && !/\bgevgelija\b/.test(e))) return EMU412_SET;
    // 3080–3089, 3180–3185 Skopje–Zelenikovo: the 411.
    if (/^3[01]/.test(num) || /\bzelenikovo\b/.test(e)) return EMU411_SET;
    // Anything not placed: the 412/416 set.
    return EMU412_SET;
  },
};

// Sources: the photograph each drawing was made from (Wikimedia Commons).
// Builders are the commonly published ones, set down from memory; top
// speeds are given only where Trainsheet is confident of them.
const CM = "https://commons.wikimedia.org/wiki/File:";
const f441 = { model: "441 (Končar)", type: "Electric locomotive", builder: "Končar", lengthFt: 51.0,
  source: `${CM}23.04.10_Skopje_441.107_%26_712.107_%285821492431%29.jpg` };
const f461 = { model: "461 (ASEA)", type: "Electric locomotive", builder: "ASEA", lengthFt: 61.0,
  source: `${CM}M%C5%BD_461.jpg` };
const f661 = { model: "661 (GM-EMD G16)", type: "Diesel-electric locomotive", builder: "GM-EMD", lengthFt: 57.0,
  source: `${CM}22.04.10_Bitola_661.236_%285821472001%29.jpg` };
const f712 = { model: "712 (Đuro Đaković)", type: "Diesel multiple unit", builder: "Đuro Đaković", lengthFt: 74.0,
  source: `${CM}23.04.10_Gjorche_Petrov_712.107_%285821485025%29.jpg` };
const f411 = { model: "411 (CRRC)", type: "Electric multiple unit", builder: "CRRC", lengthFt: 82.0,
  source: `${CM}M%C5%BD_411_103_at_Zelenikovo_Novo.jpg` };
const f412 = { model: "412/416 (RVR)", type: "Electric multiple unit", builder: "Rīgas Vagonbūves Rūpnīca (RVR)", lengthFt: 64.3,
  source: `${CM}Macedonia_%285881146055%29.jpg` };
export const FACTS = {
  mzt441: { ...f441,
    about: "The class 441, Končar's electric locomotive of the electrified main line: orange all over with a red band below the windows and a white stripe between them, a red buffer beam, a grey roof, two windshields and round headlamps. The one photographed at Skopje is 441-107, hauling the grey coaches drawn here; the small round windows along its side are a reading, the photograph being a front three-quarter view. Drawing it on the Gevgelija trains is a judgement: the timetable names no locomotive." },
  mzt461: { ...f461,
    about: "The class 461, ASEA's six-axle electric locomotive: weathered grey-blue JŽ livery, a blue band at window level and along the roof edge, oval portholes along the side, round headlamps in a pod on the cab roof and two pantographs. The one photographed at Skopje in 2003 is 461-116; no photograph of a 461 in a distinct MŽ livery was found, so it is drawn as photographed, still wearing JŽ colours. Drawing it on the Gevgelija trains is a judgement: the timetable names no locomotive." },
  mzt661: { ...f661,
    about: "The class 661, GM-EMD's G16 diesel of the unelectrified Veles–Bitola line: dark green with a yellow chevron on the nose, two yellow stripes along the side and yellow handrails, a hood unit with the cab near the front and the long hood behind it on two three-axle trucks. The one photographed at Bitola is 661-236, hauling the red coaches with the yellow band drawn here; 661-219 was photographed at Skopje the next day. Drawing it on the Bitola trains is a judgement: the timetable names no locomotive." },
  mzt712Cab: { ...f712,
    about: "A driving car of the class 712, Đuro Đaković's diesel railcar: cream with a red band at window level and an orange band below it, a grey roof, two windshields and the round headlamp on the roof. The set photographed at Gjorče Petrov is 712-107. It runs no train in this timetable: the 712s worked the Kičevo and Kočani branches, which have no passenger service in the feed, so the model exists for when service returns." },
  mzt712Mid: { ...f712,
    about: "The trailer car of a class 712 set, in the same cream with the red and orange bands. No separate photograph of the trailer was found; its windows and doors are taken to match the driving car, and the set is drawn as two driving cars back to back." },
  mzt411Cab: { ...f411,
    about: "A driving car of the class 411, CRRC's two-car electric unit and the modern suburban stock: white with a red band along the roofline, a black window band, red doors, a yellow sweep under the nose and the red swoosh down the cab's side. The set photographed at Zelenikovo Novo is 411-103, on the Skopje–Zelenikovo line itself; the builder's-plant photograph shows the nose's red, black and yellow front in detail. Drawing it on the Zelenikovo locals is a judgement: the timetable names no unit." },
  mzt411Mid: { ...f411,
    about: "The trailer car of a class 411 set, in the same white with the red roofline band, black window band and red doors. The pantograph on the second car is a reading: one is visible on the car behind the leading car in the Zelenikovo Novo photograph. The set is drawn as two driving cars back to back." },
  mzt412Cab: { ...f412,
    about: "An end car of the class 412, the RVR electric unit of the older suburban stock: light blue with a white roof and a white band low on the side, a white chevron on the nose, red doors and the headlamp pod on the cab roof. The unit photographed at Skopje is 412-054; its window/door layout is from that photograph's side view. Drawing it on the Kumanovo and Veles trains is a judgement: the timetable names no unit." },
  mzt416Mid: { ...f412,
    about: "A trailer car of a class 412/416 set, in the same light blue with the white band and red doors. No photograph shows a 416 trailer in this livery, so the trailer is drawn in the same livery as a judgement; its window/door layout follows the end car, and the pantograph on the second car is a reading." },
  mztCoachGrey: { model: "MŽ grey coach", type: "Locomotive-hauled passenger coach", builder: "Goša", lengthFt: 80.0,
    source: `${CM}23.04.10_Skopje_441.107_%26_712.107_%285821492431%29.jpg`,
    about: "A grey coach of the kind behind 441-107 at Skopje: silver-grey with the windows in a dark band and a grey roof. No standalone coach photograph was found — the coach is drawn from the background of the 441 photograph — so its windows, doors and 24.5 m length are those of the standard Goša coach." },
  mztCoachRed: { model: "MŽ red coach", type: "Locomotive-hauled passenger coach", builder: "Goša", lengthFt: 80.0,
    source: `${CM}22.04.10_Bitola_661.236_%285821472001%29.jpg`,
    about: "A red coach of the Bitola-line set behind 661-236 at Bitola: red with a yellow band at window level and a dark roof. No standalone coach photograph was found — the coach is drawn from the background of the 661 photographs — so its windows, doors and 24.5 m length are those of the standard Goša coach." },
};
