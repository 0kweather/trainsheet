// Indian Railways' cars (scripts/railroads/india.py, agency
// "indianrailways"): the premium loco-hauled trains — Rajdhani, Duronto,
// Garib Rath, Tejas, Humsafar, Gatimaan, Shatabdi / Jan Shatabdi and
// Intercity — and the Vande Bharat trainset. Trainsheet's own side views at the shared scale
// (js/carart.js), each drawn from, and checked against, one photograph on
// Wikimedia Commons, named here fleet by fleet. Locomotives from
// euroLoco and the coaches from coachCar (carmodels.js); the lettering is
// drawn here (no logo files).
//
// What is from the photographs: each fleet's paint, and what can be counted
// on the side that faces the camera. None of the photographs is a true side
// elevation (the Humsafar's and the Intercity's come closest), so the
// windows' spacing, the doors' places, the roof equipment, what hangs under
// the floor and every length are Trainsheet's reading of the type, not
// measurements. The lengths the drawings are scaled to are the figures
// usually published for each class (LHB coach 23.54 m, WAP-7 20.56 m,
// WAP-5 18.16 m), set down from memory and not checked against a source
// for this file (see MODELS).
//
//   WAP-7 (photos 17, 02): cream body, a red-brown stripe along the side
//     at window height, a dark lower band, a grey roof, two pantographs.
//     Photo 17 is a side view at the cab end: the big dark grille window,
//     the open cab door, the stripe and the dark skirt. Photo 02 shows
//     WAP-7 30673 head-on, white with the red stripe, hauling the red
//     Rajdhani rake.
//   WAP-5 (photos 04, 09): white body, a red stripe over an orange-yellow
//     stripe along the side, "INDIAN RAILWAYS" lettering, a dark skirt.
//     Photo 04 is WAP-5 30197 head-on at New Delhi; photo 09 shows the
//     side, the stripes and the big "WAP-5" on the cab end.
//   The red LHB coach (photo 02): red with a grey lower band and a grey
//     roof, dark windows, a door at each end. The coaches behind the
//     WAP-7 in photo 02 are distant, so the windows' spacing and the
//     band's depth are a reading; the same red LHB coach serves Rajdhani
//     and Duronto.
//   The Shatabdi chair car (photo 03): a coach close-up, pale blue above
//     and grey below, a grey roof, big windows in dark surrounds, a lit
//     destination board, a plug door with steps at the end. The board in
//     the photograph reads "KANPUR–NEW DELHI"; the drawing's board reads
//     "SHATABDI".
//   The Garib Rath coach (photo 05): a coach close-up, dark green with a
//     broad pale-yellow band across the window line, the name board on
//     the band, louvred windows. The photograph shows only part of one
//     coach, so the windows' spacing and the band's depth are a reading.
//   The Tejas coach (photo 06): yellow shading to orange toward the
//     sill, a sunburst of rays behind "TEJAS" lettering, dark windows,
//     a grey roof. The photograph is distant, across a platform, so the
//     rays' count and the lettering's place are a reading.
//   The Humsafar coach (photo 07): turquoise with a darker damask
//     pattern, a grey roof, an orange band over a green swoosh along the
//     sill, big dark windows with rounded corners. The pattern's exact
//     motif is a reading; the photograph's board reads "काशी महाकाल"
//     (Kashi Mahakal Express) and the coach "B-2" — neither is drawn.
//   The Gatimaan generator car (photo 09): light grey with a red stripe
//     at the roofline, a blue stripe and a yellow stripe below it, a big
//     louvred door, "LUGGAGE BRAKE & GENERATOR CAR" lettering and a
//     "GATIMAAN EXPRESS" board. Gatimaan's chair cars are not visible in
//     the photograph; they are drawn as the Shatabdi chair car (the same
//     LHB chair-car stock), a judgement marked in TYPICAL.
//   The Intercity chair car (photo 10): medium blue above and grey below,
//     a grey roof, big windows, "AC CHAIR CAR" lettering. The photograph
//     is a side view; the windows' spacing is a reading.
//   The Vande Bharat trainset (photo 01): white, a blue band along the
//     window line and a blue band low on the side, a dark windscreen in
//     an aerodynamic nose. The photograph is a front view at Balasore,
//     so the side — the windows' and doors' places, the roof equipment,
//     the car length (about 24 m a car) — is a reading.
//
// The timetable (the Neo2308 community GTFS) names no locomotive or
// rolling stock, so which locomotive hauls a train and how many coaches
// it has are judgements, labeled as typical; see TYPICAL below. Coach
// counts are fixed rakes per line (12 for the overnight premium trains,
// 8 for the day chair-car trains and the Vande Bharat sets). Loco assignments: WAP-7 for Rajdhani,
// Garib Rath, Humsafar and Intercity; WAP-5 for Duronto, Gatimaan,
// Shatabdi, Jan Shatabdi and Tejas — the photographs show WAP-7 on
// Rajdhani and WAP-5 on Duronto and Gatimaan; the rest is the usual
// pairing.
//
// VERIFIED after writing (23 Nov 2026): node --check passes; TYPICAL run
// over all 9,474 indianrailways runs through the real consist.js — 0
// failures, 320 runs get consists (Rajdhani 20, Duronto 37, Garib Rath
// 26, Tejas 22, Humsafar 62, Gatimaan 2, Shatabdi 41, Jan Shatabdi 5,
// Intercity 105) and the other 9,154 return null; every model rendered
// and looked at beside its photograph (what that pass found is in the
// build's STATE.md). Renders and the script: the build's work/verify-c1/.
//
// VERIFIED after writing (23 Nov 2026, C2): node --check passes; TYPICAL
// run over all 9,474 indianrailways runs through the real consist.js — 0
// failures, 372 runs get consists (Vande Bharat 52 as an 8-car set, the
// C1 distributions unchanged) and the other 9,102 return null; the
// driving car, an intermediate car and the trailing driving car rendered
// and looked at beside photograph 01. Renders and the script: the build's
// work/verify-c2/.

import { coachCar } from "../carmodels.js?v=dev";
import { rect, circle, path, slats, underframe, pantograph, win } from "../carart.js?v=dev";
import { euroLoco, letters, hvac, buffers, unit } from "./czechia.cars.js?v=dev";

const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.2) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- The locomotives ----------
// Both are twin-cab electrics with a nearly flat front; euroLoco draws
// one half and mirrors it, so the paint is symmetric end to end.

// WAP-7: cream, a red-brown stripe at window height, a dark lower band.
const WAP7 = { cream: "#f2ede2", stripe: "#8c3a2b", dark: "#22302a", roof: "#c5c9cc", skirt: "#2a2d31" };
const NOSE_WAP = [[1.4, 4.1], [1.1, 7.0], ["q", 1.1, 8.5, 2.2, 9.5], [3.5, 12.3], ["q", 4.2, 13.0, 6.0, 13.0]];
function wap7Paint(c, L) {
  return bands(L, [[0, 20, WAP7.cream], [12.25, 3, WAP7.roof], [0, 4.1, WAP7.dark]]) +
    rect(-1, 7.9, L + 2, 1.0, WAP7.stripe) + rect(-1, 4.1, L + 2, 0.18, WAP7.stripe);
}
const wap7 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_WAP, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 42, wheel: 43, surround: "#1d2026",
  door: 6.2, doorW: 1.9, paint: wap7Paint,
  grilles: [[-16, 10, 7.0, 11.0], [6, 10, 7.0, 11.0]], grilleFill: "rgba(20,22,25,0.55)",
  over: (cc, L) => letters(cc, L / 2, 6.2, 0.95, "WAP-7", "#3a3d42", { weight: 700 }) });

// WAP-5: white, a red stripe over an orange-yellow stripe, "INDIAN
// RAILWAYS" along the side, a dark skirt.
const WAP5 = { white: "#f2f3f4", red: "#c8352c", orange: "#f58220", dark: "#2a2d31", roof: "#c5c9cc" };
function wap5Paint(c, L) {
  return bands(L, [[0, 20, WAP5.white], [12.25, 3, WAP5.roof], [0, 4.1, WAP5.dark]]) +
    rect(-1, 8.6, L + 2, 0.9, WAP5.red) + rect(-1, 7.4, L + 2, 0.7, WAP5.orange);
}
const wap5 = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_WAP, rake: [[2.2, 9.5], [3.5, 12.3]], centers: 35, wheel: 43, surround: "#1d2026",
  door: 6.2, doorW: 1.9, paint: wap5Paint,
  grilles: [[-14, 9, 7.0, 11.0], [5, 9, 7.0, 11.0]], grilleFill: "rgba(20,22,25,0.5)",
  over: (cc, L) => letters(cc, L / 2, 10.6, 0.95, "INDIAN RAILWAYS", "#1d2b53", { weight: 700 }) +
    letters(cc, L - 8, 6.2, 1.1, "WAP-5", "#1d2b53", { weight: 800 }) });

// ---------- The coaches ----------
// The LHB coach: 23.54 m on two trucks 19 m apart, a plug door at each
// end, big windows between. The roof carries the air-conditioning unit;
// the ends buffers and screw couplings.
const LHB = { roof: 13.3, sill: 3.9 };
function lhbCoach(c, { base, livery, rows, doors, extra, board }) {
  const L = c.L;
  return coachCar(c, { roof: LHB.roof, sill: LHB.sill, end: 0.6, endR: 1.2, base, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows, doors: (doors || [2.0, L - 4.6]).map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.38 })),
    livery, extra: (cc) => hvac(L / 2 - 7, LHB.roof, 14, 0.7) + boxes(L / 2 - 22, L / 2 + 22, LHB.sill, 3, 1.2) +
      buffers(0, -1, { sill: LHB.sill }) + buffers(L, 1, { sill: LHB.sill }) + (extra ? extra(cc) : "") + (board ? board(cc) : "") });
}
const lhbRows = (y = 7.4, w = 4.6, h = 3.0, skip = []) => [{ a: 6.0, b: 77.2 - 6.0, y, w, h, pitch: 6.45, r: 0.45, skip }];

// The red LHB coach of the Rajdhani and Duronto: red with a grey lower
// band and a grey roof.
const RED = { red: "#c22026", grey: "#9aa0a6", roof: "#b9bec4" };
const redCoach = (c) => lhbCoach(c, { base: RED.red, rows: lhbRows(),
  livery: () => bands(c.L, [[12.4, 3, RED.roof], [0, 7.0, RED.grey]]) });

// The Shatabdi chair car: pale blue above, grey below, a grey roof, big
// windows; the lit destination board between the windows.
const SH = { blue: "#9cc3cd", grey: "#b0b3b6", roof: "#c5c9cc", board: "#3a3f45" };
const shatabdiCoach = (c) => {
  const bx = c.L * 0.30, bw = 14;
  return lhbCoach(c, { base: SH.blue, rows: lhbRows(7.3, 5.2, 3.2, [[bx - 0.6, bx + bw + 0.6]]),
    livery: () => bands(c.L, [[12.4, 3, SH.roof], [0, 7.0, SH.grey], [7.0, 0.15, "#6e7a80"]]),
    board: (cc) => rect(bx, 8.6, bw, 2.0, SH.board, 0, 'rx="0.2"') + letters(cc, bx + bw / 2, 9.6, 0.9, "SHATABDI", "#f2f3f4", { weight: 700 }) });
};

// The Garib Rath coach: dark green with a broad pale-yellow band across
// the window line, louvred windows in the band.
const GR = { green: "#14532d", yellow: "#f2c230", roof: "#8f959b" };
const garibRathCoach = (c) => lhbCoach(c, { base: GR.green, rows: [{ a: 6.0, b: 77.2 - 6.0, y: 7.6, w: 3.0, h: 2.4, pitch: 6.45, r: 0.4 }],
  livery: () => bands(c.L, [[12.4, 3, GR.roof], [6.9, 4.0, GR.yellow], [0, 4.0, GR.green]]),
  extra: (cc) => {
    // The louvres over the windows in the yellow band.
    let s = "";
    for (let x = 6.0; x < 71; x += 6.45) s += slats(x + 0.3, 7.75, 2.4, 2.1, 0.35, "rgba(0,0,0,0.35)");
    return s;
  } });

// The Tejas coach: yellow shading to orange toward the sill, a sunburst
// of rays behind "TEJAS" lettering, dark windows.
const TJ = { yellow: "#f5b81d", orange: "#e87722", ray: "#f58220", roof: "#c5c9cc" };
const tejasCoach = (c) => lhbCoach(c, { base: TJ.yellow, rows: lhbRows(8.2, 4.6, 2.6),
  livery: () => {
    // The sunburst: rays fanning up from a point low on the car, drawn
    // in the livery so the windows sit over them, as in the photograph.
    const cx = c.L / 2, cy = 4.6;
    let s = bands(c.L, [[12.4, 3, TJ.roof], [0, 5.0, TJ.orange]]);
    for (let k = -3; k <= 3; k++) {
      const x = cx + k * 5.2;
      s += path(`M${cx} ${cy}L${x - 1.6} 11.6L${x + 1.6} 11.6Z`, TJ.ray, 0, 'opacity="0.55"');
    }
    return s;
  },
  extra: (cc) => letters(cc, c.L / 2, 6.4, 1.8, "TEJAS", "#b3401f", { weight: 800 }) });

// The Humsafar coach: turquoise with a darker damask pattern, a grey
// roof, an orange band over a green swoosh along the sill.
const HU = { turq: "#2bb3ad", dark: "#1e8a85", roof: "#c5c9cc", orange: "#f58220", green: "#8cc63f" };
const humsafarCoach = (c) => lhbCoach(c, { base: HU.turq, rows: lhbRows(7.4, 4.6, 3.0),
  livery: () => {
    let s = bands(c.L, [[12.4, 3, HU.roof], [4.3, 1.3, HU.green], [3.5, 0.8, HU.orange], [0, 3.5, "#3a3d42"]]);
    // The damask pattern: small diamonds above the windows and below
    // them, clear of the doors.
    for (let x = 6.5; x < 71; x += 3.2) {
      for (const y of [11.35, 5.9]) {
        s += path(`M${x} ${y}l0.55 0.55l-0.55 0.55l-0.55 -0.55Z`, HU.dark, 0, 'opacity="0.6"') +
          circle(x, y + 0.55, 0.28, HU.dark, 0, 'opacity="0.45"');
      }
    }
    return s;
  },
  extra: (cc) => letters(cc, c.L / 2, 11.7, 0.9, "HUMSAFAR", "#ffffff", { weight: 700 }) });

// The Gatimaan generator car: light grey with a red stripe at the
// roofline, a blue stripe and a yellow stripe below it, a big louvred
// door, no windows.
const GN = { grey: "#c5c9cc", red: "#c8352c", blue: "#5aa9e6", yellow: "#f2c400", skirt: "#8f959b" };
const gatimaanGen = (c) => lhbCoach(c, { base: GN.grey, rows: [],
  livery: () => bands(c.L, [[11.0, 0.8, GN.red], [9.6, 0.8, GN.blue], [8.6, 0.8, GN.yellow], [0, 3.9, GN.skirt]]),
  extra: (cc) => {
    // The big louvred door, left of centre.
    const x = c.L * 0.30;
    return rect(x, 4.2, 7.0, 7.6, "#aab1b9", 0, 'rx="0.2"') + slats(x + 0.4, 4.6, 6.2, 6.8, 0.45, "rgba(0,0,0,0.35)") +
      letters(cc, c.L * 0.62, 6.4, 0.8, "LUGGAGE BRAKE", "#3a3d42", { weight: 700 }) +
      letters(cc, c.L * 0.62, 5.4, 0.8, "GENERATOR CAR", "#3a3d42", { weight: 700 }) +
      // The board: light blue, over the stripes, dark lettering on it.
      rect(c.L * 0.66, 9.9, 19, 1.9, "#a8d4f0", 0, 'rx="0.15"') +
      letters(cc, c.L * 0.66 + 9.5, 10.85, 0.8, "GATIMAAN EXPRESS", "#1d3a6e", { weight: 700 });
  } });

// The Intercity chair car: medium blue above, grey below, a grey roof,
// big windows, "AC CHAIR CAR" lettering.
const IC = { blue: "#5a9bd4", grey: "#b0b3b6", roof: "#c5c9cc" };
const intercityCoach = (c) => lhbCoach(c, { base: IC.blue, rows: lhbRows(7.3, 5.2, 3.2),
  livery: () => bands(c.L, [[12.4, 3, IC.roof], [0, 7.0, IC.grey]]),
  extra: (cc) => letters(cc, c.L - 12, 11.8, 1.0, "AC CHAIR CAR", "#1d3a6e", { weight: 700 }) });

// ---------- The Vande Bharat trainset ----------
// The Train 18/20 self-propelled set (photo 01, a front view at
// Balasore): white, a blue band along the window line and a blue band
// low on the side, a dark windscreen in an aerodynamic nose. The
// photograph shows the front only, so the side is a reading: the
// windows' and doors' places, the roof equipment and the car length
// (about 24 m a car) are Trainsheet's reading of the type, not
// measurements. The set is drawn as the standard 8-car rake; some
// routes run 16-car sets. The driving car and the intermediate cars
// are drawn with unit (carmodels via czechia.cars.js), as the Desiro
// sets are in arl.cars.js.
const VB = { white: "#f2f3f4", blue: "#1d4f9c", blueLow: "#2f6fb8", black: "#15171a", roof: "#c5c9cc", skirt: "#2a2d31" };
const VB_G = { roof: 13.0, sill: 3.7 };
// A pointed nose: bulging forward low, the windscreen raked back to the roof.
const NOSE_VB = [[1.6, 3.7], [0.9, 4.6], ["q", 0.2, 6.5, 1.1, 8.4], [3.2, 11.9], ["q", 4.0, 13.0, 6.2, 13.0]];
const vbDoor = (x) => ({ x, w: 4.6, y0: VB_G.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.44, grabs: false, fill: VB.white });
const vbWins = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const vbBox = (x, w) => hvac(x, VB_G.roof, w, 1.5).replaceAll("#a9b0b8", "#d9dcdd");
function vbPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, VB.white], [12.3, 3, VB.roof], [0, 3.7, VB.skirt]]) +
      // The blue window band the windows sit in, and the blue band low.
      rect(cab ? 15.2 : 1.6, 6.9, L - (cab ? 17.0 : 3.2), 4.1, VB.blue, 0, 'rx="0.3"') +
      rect(cab ? 9.6 : -1, 4.35, L + 2, 1.0, VB.blueLow);
    if (cab) {
      // The blue band sweeping up the nose to the window band, under the
      // dark windscreen that wraps the front.
      s += path("M-1 4.35L5.6 4.35Q8.6 4.9 10.0 7.9L11.6 11.0L13.8 11.0L13.8 6.9L10.6 6.9L8.0 8.2Q7.2 7.6 5.6 7.5L-1 7.5Z", VB.blue) +
        path("M-1 13.5L7.2 13.5L7.2 12.7L3.6 8.1L-1 8.1Z", VB.black) +
        path("M-1 0L-1 4.35L6.6 4.35L7.4 3.7L7.4 0Z", VB.skirt);
    }
    return s;
  };
}
// The driving car: one window, a door, four windows, a door and three
// windows behind the cab; the cab door with its window is drawn in cab().
const vbCab = (c) => unit(c, { roof: VB_G.roof, sill: VB_G.sill, nose: NOSE_VB, rake: [[1.1, 8.4], [3.2, 11.9]], depth: 2.5, cabLen: 16, lampY: 5.6, bare: true,
  rows: [vbWins([17.3, 29.6, 35.0, 40.3, 45.7]), vbWins([57.8, 61.9, 66.2], 3.4)], doors: [vbDoor(23.3), vbDoor(51.6)],
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: vbPaint(true), surround: VB.black,
  cab: () =>
    // The white cab door with its window.
    rect(13.7, 4.1, 2.2, 7.3, VB.white, 0.45, 'rx="0.3"') + win(14.25, 7.5, 1.1, 3.0, 0.15),
  extra: (cc, g) => letters(cc, g.L / 2, 6.15, 1.05, "VANDE BHARAT", VB.blue, { weight: 700 }) +
    vbBox(22, 22) + boxes(20, g.L - 16, VB_G.sill, 3) });
// An intermediate car: two windows, a door, seven windows, a door and
// two windows; the pantograph is on the car behind the leading car.
const vbMid = (c) => unit(c, { roof: VB_G.roof, sill: VB_G.sill,
  rows: [vbWins([2.6, 6.9], 3.4), vbWins([18.2, 23.8, 29.4, 35.0, 40.6, 46.2, 51.8]), vbWins([c.L - 10.3, c.L - 6.0], 3.4)],
  doors: [vbDoor(11.7), vbDoor(c.L - 16.3)],
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: vbPaint(false),
  extra: (cc, g) => letters(cc, g.L / 2, 6.15, 1.05, "VANDE BHARAT", VB.blue, { weight: 700 }) +
    (c.index === 1 ? pantograph(9, VB_G.roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168") + vbBox(24, 22) : vbBox(g.L / 2 - 14, 28)) +
    boxes(16, g.L - 16, VB_G.sill, 3) });

// ---------- Tables ----------

export const TYPES = {
  irWap7: { name: "WAP-7 electric locomotive", kind: "electric" },
  irWap5: { name: "WAP-5 electric locomotive", kind: "electric" },
  irRedCoach: { name: "LHB coach, Rajdhani/Duronto red", kind: "coach" },
  irShatabdiCoach: { name: "LHB AC chair car, Shatabdi pale blue", kind: "coach" },
  irGaribRathCoach: { name: "Garib Rath coach", kind: "coach" },
  irTejasCoach: { name: "Tejas coach", kind: "coach" },
  irHumsafarCoach: { name: "Humsafar coach", kind: "coach" },
  irGatimaanGen: { name: "Gatimaan luggage brake and generator car", kind: "coach" },
  irIntercityCoach: { name: "LHB AC chair car, Intercity blue", kind: "coach" },
  irVbCab: { name: "Vande Bharat driving car", kind: "emu" },
  irVbMid: { name: "Vande Bharat intermediate car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the LHB coach 23.54 m, the
// WAP-7 20.56 m, the WAP-5 18.16 m, a Vande Bharat car about 24 m.
export const MODELS = {
  irWap7: M(wap7, 67.5),
  irWap5: M(wap5, 59.6),
  irRedCoach: M(redCoach, 77.2),
  irShatabdiCoach: M(shatabdiCoach, 77.2),
  irGaribRathCoach: M(garibRathCoach, 77.2),
  irTejasCoach: M(tejasCoach, 77.2),
  irHumsafarCoach: M(humsafarCoach, 77.2),
  irGatimaanGen: M(gatimaanGen, 77.2),
  irIntercityCoach: M(intercityCoach, 77.2),
  irVbCab: M(vbCab, 78.7, true),
  irVbMid: M(vbMid, 78.7, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const RAJDHANI = set("Typical: a WAP-7 locomotive and 12 red LHB coaches (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap7", 1], ["irRedCoach", 12]);
const DURONTO = set("Typical: a WAP-5 locomotive and 12 red LHB coaches (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap5", 1], ["irRedCoach", 12]);
const GARIB_RATH = set("Typical: a WAP-7 locomotive and 12 dark-green and yellow Garib Rath coaches (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap7", 1], ["irGaribRathCoach", 12]);
const TEJAS = set("Typical: a WAP-5 locomotive and 8 yellow Tejas coaches (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap5", 1], ["irTejasCoach", 8]);
const HUMSAFAR = set("Typical: a WAP-7 locomotive and 12 turquoise Humsafar coaches (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap7", 1], ["irHumsafarCoach", 12]);
const GATIMAAN = set("Typical: a WAP-5 locomotive, a luggage brake and generator car and 8 chair cars (a judgement: the timetable names no rolling stock; the chair cars are drawn as the Shatabdi chair car, the same LHB chair-car stock — no separate Gatimaan chair-car photograph exists — and the coach count is a fixed rake)",
  ["irWap5", 1], ["irGatimaanGen", 1], ["irShatabdiCoach", 8]);
const SHATABDI = set("Typical: a WAP-5 locomotive and 8 pale-blue LHB chair cars (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap5", 1], ["irShatabdiCoach", 8]);
const INTERCITY = set("Typical: a WAP-7 locomotive and 8 blue LHB AC chair cars (a judgement: the timetable names no rolling stock; the coach count is a fixed rake)",
  ["irWap7", 1], ["irIntercityCoach", 8]);
const VANDE_BHARAT = set("Typical: an 8-car Vande Bharat trainset — a driving car, 6 intermediate cars and a driving car (a judgement: the timetable names no rolling stock; some routes run 16-car sets, but 8 cars is the standard set)",
  ["irVbCab", 1], ["irVbMid", 6], ["irVbCab", 1]);

// The timetable names no rolling stock, so a train is placed by its LINE
// alone (t.line, else t.route, the line's name). C1 covers the premium
// loco-hauled lines and C2 the Vande Bharat; every other line returns
// null — C3–C5 fill those in later (MEMU/DEMU, suburban EMUs,
// Mail/Express and the rest), and Antyodaya and DMU have no photograph
// to draw from.
const C1 = {
  "Rajdhani Express": RAJDHANI,
  "Duronto Express": DURONTO,
  "Garib Rath Express": GARIB_RATH,
  "Tejas Express": TEJAS,
  "Humsafar Express": HUMSAFAR,
  "Gatimaan Express": GATIMAAN,
  "Shatabdi Express": SHATABDI,
  "Jan Shatabdi Express": SHATABDI,
  "Intercity Express": INTERCITY,
  "Vande Bharat Express": VANDE_BHARAT,
};
export const TYPICAL = {
  indianrailways: (t = {}) => C1[String(t.line || t.route || "")] || null,
};

const CM = "https://commons.wikimedia.org/wiki/File:";
const fWap7 = { model: "WAP-7", type: "Electric locomotive", builder: "Chittaranjan Locomotive Works", lengthFt: 67.5,
  source: `${CM}Side_view_of_a_WAP_7_class_Locomotive_of_Indian_Railways.jpg` };
const fWap5 = { model: "WAP-5", type: "Electric locomotive", builder: "Chittaranjan Locomotive Works", lengthFt: 59.6,
  source: `${CM}12273_Duronto_Express_led_by_WAP_5_standing_on_Platform_5,_New_Delhi,_India.jpg` };
const fRed = { model: "LHB coach (Rajdhani/Duronto)", type: "Locomotive-hauled passenger coach", lengthFt: 77.2,
  source: `${CM}NZM_-_MAS_Rajdhani_Exp._(45891042044).jpg` };
const fShatabdi = { model: "LHB AC chair car (Shatabdi)", type: "Locomotive-hauled chair car", lengthFt: 77.2,
  source: `${CM}New_Delhi-Kanpur_Shatabdi_Express.jpg` };
const fGaribRath = { model: "Garib Rath coach", type: "Locomotive-hauled passenger coach", lengthFt: 77.2,
  source: `${CM}Delhi_Sarai_Rohilla_Bandra_Terminus_Garib_Rath_Express.jpg` };
const fTejas = { model: "Tejas coach", type: "Locomotive-hauled chair car", lengthFt: 77.2,
  source: `${CM}Tejas_Express_coaches_on_Tilak_Bridge_railway_Station,_India_01.jpg` };
const fHumsafar = { model: "Humsafar coach", type: "Locomotive-hauled sleeper coach", lengthFt: 77.2,
  source: `${CM}IRCTC_Humsafar_Rakes..jpg` };
const fGatimaan = { model: "Gatimaan luggage brake and generator car", type: "Locomotive-hauled generator car", lengthFt: 77.2,
  source: `${CM}Gatimaan_express.jpg` };
const fIntercity = { model: "LHB AC chair car (Intercity)", type: "Locomotive-hauled chair car", lengthFt: 77.2,
  source: `${CM}AC_Chair_Car_coach_of_New_Delhi-Jalandhar_City_Intercity_Express.jpg` };
const fVb = { model: "Vande Bharat Express (Train 18/20)", type: "Electric multiple unit", builder: "Integral Coach Factory", lengthFt: 78.7,
  source: `${CM}Howrah%E2%80%93Puri_Vande_Bharat_Express_at_Balasore_railway_station_1.jpg` };
export const FACTS = {
  irWap7: { ...fWap7,
    about: "The WAP-7, Indian Railways' 6,350 hp passenger electric locomotive: cream with a red-brown stripe and a dark lower band. The one photographed from the side is at a station with its cab door open; WAP-7 30673 is photographed head-on hauling the New Delhi–Chennai Rajdhani. Drawing it on every Rajdhani, Garib Rath, Humsafar and Intercity train is a judgement: the timetable names no locomotive." },
  irWap5: { ...fWap5,
    about: "The WAP-5, Indian Railways' 6,000 hp passenger electric locomotive: white with a red stripe over an orange-yellow stripe and \"INDIAN RAILWAYS\" lettering. The one photographed head-on at New Delhi is WAP-5 30197 on the Duronto; the side view is from the Gatimaan. Drawing it on every Duronto, Gatimaan, Shatabdi, Jan Shatabdi and Tejas train is a judgement: the timetable names no locomotive." },
  irRedCoach: { ...fRed,
    about: "A red LHB coach with a grey lower band, as the Rajdhani rake behind WAP-7 30673 in the photograph. The same coach serves the Duronto. The windows' spacing and the band's depth are a reading — the coaches in the photograph are distant. Drawing 12 of them behind every Rajdhani and Duronto is a judgement: the timetable names no rolling stock." },
  irShatabdiCoach: { ...fShatabdi,
    about: "A Shatabdi AC chair car: pale blue above, grey below, big windows in dark surrounds, a lit destination board. The coach photographed is on the New Delhi–Kanpur Shatabdi; its board reads \"KANPUR–NEW DELHI\" where the drawing's reads \"SHATABDI\". The same stock serves the Jan Shatabdi and, as a judgement, the Gatimaan, whose chair cars have no separate photograph. Drawing 8 of them behind every Shatabdi and Jan Shatabdi is a judgement: the timetable names no rolling stock." },
  irGaribRathCoach: { ...fGaribRath,
    about: "A Garib Rath coach: dark green with a broad pale-yellow band across the window line and louvred windows. The photograph shows only part of one coach of the Delhi Sarai Rohilla–Bandra Terminus Garib Rath (12215/12216), so the windows' spacing and the band's depth are a reading. Drawing 12 of them behind every Garib Rath is a judgement: the timetable names no rolling stock." },
  irTejasCoach: { ...fTejas,
    about: "A Tejas coach: yellow shading to orange toward the sill, a sunburst of rays behind \"TEJAS\" lettering, seen at Tilak Bridge station in the photograph. The rays' count and the lettering's place are a reading — the photograph is taken across a platform. Drawing 8 of them behind every Tejas is a judgement: the timetable names no rolling stock." },
  irHumsafarCoach: { ...fHumsafar,
    about: "A Humsafar coach: turquoise with a darker damask pattern, an orange band over a green swoosh along the sill. The coach photographed is on the Kashi Mahakal Express; its board reads \"काशी महाकाल\" and the coach \"B-2\" — neither is drawn. The pattern's exact motif is a reading. Drawing 12 of them behind every Humsafar is a judgement: the timetable names no rolling stock." },
  irGatimaanGen: { ...fGatimaan,
    about: "The Gatimaan's luggage brake and generator car: light grey with a red stripe at the roofline, a blue stripe and a yellow stripe below it, a big louvred door. The car photographed is behind a WAP-5 at New Delhi. It runs first behind the locomotive in the drawing, a judgement: the timetable names no rolling stock." },
  irIntercityCoach: { ...fIntercity,
    about: "An Intercity AC chair car: medium blue above, grey below, big windows, \"AC CHAIR CAR\" lettering. The coach photographed is on the New Delhi–Jalandhar City Intercity Express. The windows' spacing is a reading. Drawing 8 of them behind every Intercity Express is a judgement: the timetable names no rolling stock." },
  irVbCab: { ...fVb,
    about: "A driving car of a Vande Bharat Express trainset: white with a blue band along the window line and a blue band low on the side, a dark windscreen in an aerodynamic nose. The set photographed is the Howrah–Puri Vande Bharat at Balasore, seen from the front — the side is a reading, and so are the windows' and doors' places. Drawing it as an 8-car set on every Vande Bharat Express is a judgement: the timetable names no rolling stock, and some routes run 16-car sets." },
  irVbMid: { ...fVb,
    about: "An intermediate car of a Vande Bharat Express trainset, with the same white and blue livery. No photograph shows it squarely, so its doors and windows follow the driving car's, a judgement; so is the pantograph's place, on the car behind the leading car. Drawing 6 of them in every Vande Bharat Express set is a judgement: the timetable names no rolling stock." },
};
