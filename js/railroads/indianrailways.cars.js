// Indian Railways' cars (scripts/railroads/india.py, agency
// "indianrailways"): the premium loco-hauled trains — Rajdhani, Duronto,
// Garib Rath, Tejas, Humsafar, Gatimaan, Shatabdi / Jan Shatabdi and
// Intercity — the Vande Bharat trainset, the MEMU and DEMU regional
// multiple units, and the Mumbai, Kolkata and Chennai suburban EMUs.
// Trainsheet's own side views at the shared scale (js/carart.js), each
// drawn from, and checked against, one photograph on Wikimedia Commons,
// named here fleet by fleet. Locomotives from
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
//   The red LHB coach again (photo 16): the same red LHB coach with a
//     grey lower band, photographed close on the Golden Temple Mail
//     (12903/12904) — an AC 2-tier coach, "AC TWO TIER" lettering, a
//     yellow destination board, the Indian Railways roundel low on the
//     side. It confirms the red LHB stock serves the Mail/Express
//     family too: Express, Passenger, Superfast Express and Mail/Express
//     all run behind WAP-7s on red LHB rakes, a judgement (the timetable
//     names no rolling stock).
//   The Palace on Wheels saloon coach (photo 18): cream with a dark
//     maroon lower band and a gold line along its top edge, a silver
//     roof, big windows with arched tops in maroon surrounds, a
//     scalloped maroon valance with gold dots above the windows, a red
//     shield crest between the window groups, a dark "DUNGARPUR SALOON"
//     board above the right-hand windows and a small red "PALACE ON
//     WHEELS" plate low on the side, an oval window in the end door.
//     The photograph is a side view at Jaipur; the windows' spacing,
//     the crest's place and the rake are a reading.
//   The Vande Bharat trainset (photo 01): white, a blue band along the
//     window line and a blue band low on the side, a dark windscreen in
//     an aerodynamic nose. The photograph is a front view at Balasore,
//     so the side — the windows' and doors' places, the roof equipment,
//     the car length (about 24 m a car) — is a reading.
//   The MEMU (photo 11) and the DEMU (photo 12): see the MEMU and DEMU
//     section below.
//   The suburban EMUs (photos 13, 14, 15): see the suburban EMU section
//     below.
//
// The timetable (the Neo2308 community GTFS) names no locomotive or
// rolling stock, so which locomotive hauls a train and how many coaches
// it has are judgements, labeled as typical; see TYPICAL below. Coach
// counts are fixed rakes per line (12 for the overnight premium trains,
// 8 for the day chair-car trains, the Vande Bharat sets and the MEMU
// rakes, 6 for the DEMU rakes, 12 for the Mail/Express family and for the
// Palace on Wheels saloon rake). Loco assignments: WAP-7 for Rajdhani,
// Garib Rath, Humsafar and Intercity, and for the Mail/Express family
// (Express, Passenger, Superfast Express, Mail/Express); WAP-5 for Duronto,
// Gatimaan, Shatabdi, Jan Shatabdi and Tejas — the photographs show WAP-7 on
// Rajdhani and WAP-5 on Duronto and Gatimaan; the rest is the usual
// pairing. The Palace on Wheels rake is drawn with no locomotive: the
// photograph shows the saloon coaches only. Special is left null: the
// line mixes long-distance festival specials (loco-hauled) with the
// narrow-gauge Darjeeling Himalayan Railway toy trains (02540/02541/
// 02549/02550 Darjeeling–Kurseong), a Kolkata suburban hop (31762
// Gede–Ranaghat) and short regional hops (65129/65130 Banaras–Jhusi,
// 68082, 79457, 59076, 10109, 18413) that run as MEMU/DMU/EMU stock,
// so no single typical fits it and the feed names no stock to tell
// them apart.
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
//
// VERIFIED after writing (23 Nov 2026, C3): node --check passes; TYPICAL
// run over all 9,474 indianrailways runs through the real consist.js — 0
// failures, 1,743 runs get consists (MEMU 1,304 as an 8-car set, DEMU 67
// as a 6-car set, the C1/C2 distributions unchanged) and the other 7,731
// return null; the driving car, an intermediate car and the trailing
// driving car of each rendered and looked at beside photographs 11 and
// 12 (the DEMU renders use real DEMU run 71451; the MEMU renders use
// real MEMU run 06605). Renders and the script: the build's work/verify-c3/.
//
// VERIFIED after writing (23 Nov 2026, C5): node --check passes; TYPICAL
// run over all 9,474 indianrailways runs through the real consist.js — 0
// failures, 8,819 runs get consists (Express 2,435, Passenger 1,247,
// Superfast Express 514 and Mail/Express 27 as WAP-7 + 12 red LHB coaches;
// Tourist 3 as 12 Palace saloon coaches; the C1–C4 distributions
// unchanged) and the other 655 return null (DMU 505, Antyodaya Express
// 13, Suburban 102, Local 1, Special 34 — Special is deliberately null:
// the line mixes loco-hauled festival specials with narrow-gauge
// Darjeeling toy trains and short regional hops); the Palace coach
// rendered and looked at beside photograph 18. Renders and the script:
// the build's work/verify-c5/.
//
// VERIFIED after writing (23 Nov 2026, C4): node --check passes; TYPICAL
// run over all 9,474 indianrailways runs through the real consist.js — 0
// failures, 4,593 runs get consists (Mumbai 485, Kolkata 1,490, Chennai
// 875, each as a 12-car set; the C1–C3 distributions unchanged) and the
// other 4,881 return null; the driving car, an intermediate car and the
// trailing driving car of each rendered and looked at beside photographs
// 13, 14 and 15 (the renders use real Local runs 95423 Mumbai, 38302
// Kolkata, 43001 Chennai). One mismatch found and fixed: the Mumbai
// intermediate car's "WR" sat behind its middle door (the doors are
// drawn over the lettering) and was invisible; moved to x = 0.30 L, clear
// of the doors, and re-rendered. Renders and the script: the build's
// work/verify-c4/.

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

// The Palace on Wheels saloon coach (photo 18): cream with a dark
// maroon lower band, a gold line along the band's top edge and a thin
// maroon pinstripe above it, a silver roof, big arched windows with a
// scalloped maroon valance and gold dots above them, a red shield crest
// in the wide pillar between the window groups, a dark "DUNGARPUR
// SALOON" board above the right-hand windows and a small red "PALACE ON
// WHEELS" plate low on the side. The photograph is a side view at
// Jaipur, so the windows' spacing and the crest's and boards' places
// are a reading; the oval window in the end door is drawn over the
// coach's square door glass. The window row skips one window for the
// crest's pillar, as in the photograph.
const PL = { cream: "#f2e2a4", maroon: "#5a1f1f", maroonDeep: "#3a1414", gold: "#c9a227", goldLight: "#e8c85a", roof: "#d9dcdd", crest: "#b3271e" };
// Window left edges, as lhbRows lays them out (a 6.0, b 71.2, w 4.8,
// pitch 6.45): the row is centred, so the first window sits at 7.175.
const palaceWinXs = [7.175, 13.625, 20.075, 26.525, 32.975, 45.875, 65.225];
const palaceCoach = (c) => lhbCoach(c, { base: PL.cream, rows: lhbRows(7.2, 4.8, 3.4, [[38.8, 44.9]]),
  livery: () => bands(c.L, [[12.4, 3, PL.roof], [0, 6.0, PL.maroon], [6.0, 0.25, PL.gold], [6.6, 0.12, PL.maroon]]),
  extra: (cc) => {
    let s = "";
    // The scalloped maroon valance with a gold dot above each window,
    // except the two under the saloon board.
    for (const x of palaceWinXs) {
      s += path(`M${x} 11.0 Q${x + 2.4} 12.4 ${x + 4.8} 11.0 L${x + 4.8} 10.75 L${x} 10.75 Z`, PL.maroon) +
        circle(x + 2.4, 11.9, 0.28, PL.gold);
    }
    // The gold fretwork diamonds along the gold line at the top of the
    // maroon band, clear of the doors.
    for (let x = 8.5; x < 70; x += 4.0) {
      s += path(`M${x} 6.12l0.5 0.5l-0.5 0.5l-0.5 -0.5Z`, PL.gold);
    }
    // The red shield crest in the wide pillar between the window groups.
    const cx = 42.2;
    s += path(`M${cx - 1.1} 7.8 L${cx + 1.1} 7.8 L${cx + 1.1} 9.8 Q${cx + 1.1} 10.8 ${cx} 11.2 Q${cx - 1.1} 10.8 ${cx - 1.1} 9.8 Z`, PL.crest) +
      circle(cx, 9.1, 0.35, PL.goldLight);
    // The "DUNGARPUR SALOON" board above the right-hand windows.
    s += rect(51, 10.9, 14, 1.5, PL.maroonDeep, 0, 'rx="0.15"') +
      letters(cc, 58, 11.65, 0.7, "DUNGARPUR SALOON", PL.goldLight, { weight: 700 });
    // The small red "PALACE ON WHEELS" plate low on the side, below the
    // windows and above the gold line.
    s += rect(55.5, 6.4, 9, 0.8, PL.crest, 0, 'rx="0.1"') +
      letters(cc, 60, 6.8, 0.5, "PALACE ON WHEELS", "#f2f3f4", { weight: 700 });
    // The oval window in the left end door, over the square door glass.
    s += `<ellipse cx="3.3" cy="8.9" rx="0.9" ry="1.6" fill="#1d2026" stroke="${PL.maroon}" stroke-width="0.15"/>`;
    return s;
  } });

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

// ---------- MEMU and DEMU ----------
// The regional multiple units (photos 11, 12): ICF cars about 21.3 m
// long, drawn with unit like the Vande Bharat. The MEMU photograph is a
// front view at Paravur, so the side is a reading; the DEMU photograph
// is an elevated side view at Miryalguda, so the side is drawn from it.
//
//   The MEMU (photo 11): MEMU 13023, pale yellow-cream above, a deep
//     blue band low on the front with a wide orange chevron pointing
//     down across it, "MEMU" lettering low on the front, two windscreens
//     with vertical bars over them, a round headlight in the middle of
//     the chevron and big round buffers low. The side stretching away
//     shows the cream upper and the chevron's arm sweeping down the
//     nose. The blue ICF coach alongside is another train, not the MEMU.
//   The DEMU (photo 12): a blue/red/white rake at Miryalguda — deep
//     royal-blue body, a red band along the top of the side under a
//     light-grey roof, "VENDORS" and "SC" lettering on the red band, a
//     white stripe and a red band low on the side, small roof vents,
//     dark open doorways. The driving car's front is too distant to
//     read, so its nose follows the MEMU's, a judgement.
//   The suburban EMUs (photos 13, 14, 15): ICF cars about 21.3 m long,
//     drawn with unit like the MEMU and DEMU. The timetable names no
//     rolling stock and the lines are families, not cities, so which
//     city a Local or Suburban train belongs to is read from its train
//     number (verified against departures.json — see TYPICAL): 3xxxx
//     Kolkata, 4xxxx Chennai, 9xxxx Mumbai. Numbers outside those
//     ranges (Delhi 6xxxx, Bengaluru 0xxxx) have no photograph and
//     keep returning null.
//     The Mumbai EMU (photo 13): a Western Railway AC EMU, a side view
//       — white with a purple band low on the side, a thin purple
//       stripe under the roof, big "WR" lettering on the purple band,
//       "WESTERN RAILWAY" in small purple letters above the band, grey
//       roof, mesh-covered windows, oval windows on the doors. The cab
//       end is not visible, so the nose follows the MEMU's, a judgement.
//     The Kolkata EMU (photo 14): EMU 11417, a front/side view at
//       Bandel — cream above, dark green below with a red chevron
//       across the front and "12 COACH" on the green, red stripes on
//       the cream front, silver buffers. The side stretching away shows
//       the cream upper, the green lower band and a thin red stripe
//       between them. The chevron's arm sweeping down the nose is a
//       reading of the front; the "12 COACH" is drawn on the green
//       band, and the unit number is not drawn.
//     The Chennai EMU (photo 15): EMU 14003, a front/side view —
//       cream front with a dark-green lower front sweeping up in a V,
//       the red unit number 14003 and a "B" board, white buffer discs;
//       the cars behind are white with red doors and dark windows. The
//       green V is drawn as a wedge rising up the nose; the mid cars
//       are white with red doors and no green band, as in the
//       photograph. The unit number and the board are not drawn.
const MU = { cream: "#e9dc96", blue: "#1f4d9e", orange: "#ef7d1a", roof: "#c5c9cc", skirt: "#2a2d31" };
const DE = { blue: "#1f45a8", red: "#c8352c", white: "#f2f3f4", roof: "#d9dcdd", skirt: "#2a2d31" };
const MU_G = { roof: 13.0, sill: 3.7 };
// A flat-ish multiple-unit nose: nearly upright low, the windscreens
// raked back to the roof.
const NOSE_MU = [[1.6, 3.7], [1.2, 4.6], ["q", 0.6, 6.5, 1.4, 8.4], [3.2, 11.9], ["q", 4.0, 13.0, 6.2, 13.0]];
const muWins = (xs, w = 4.6) => ({ xs, y: 7.3, w, h: 3.3, r: 0.35 });
const muDoor = (x, fill) => ({ x, w: 4.6, y0: MU_G.sill, y1: 11.3, leaves: 2, glassY: 0.44, glassH: 0.44, grabs: false, fill });
const muCabRows = [muWins([17.3, 29.6, 35.0, 40.3, 45.7]), muWins([57.8, 61.9], 3.4)];
const muCabDoors = (fill) => [muDoor(23.3, fill), muDoor(51.6, fill)];
const muMidRows = [muWins([2.6, 6.9], 3.4), muWins([18.2, 23.8, 29.4, 35.0, 40.6, 46.2]), muWins([59.7, 64.0], 3.4)];
const muMidDoors = (fill) => [muDoor(11.7, fill), muDoor(53.7, fill)];
function memuPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, MU.cream], [12.3, 3, MU.roof], [0, 3.7, MU.skirt]]) +
      // The blue window band the windows sit in, and the blue band low.
      rect(cab ? 15.2 : 1.6, 6.9, L - (cab ? 17.0 : 3.2), 4.1, MU.blue, 0, 'rx="0.3"') +
      rect(cab ? 9.6 : -1, 4.35, L + 2, 1.0, MU.blue);
    if (cab) {
      // The orange chevron sweeping down the nose to the low band, as on
      // the front at Paravur.
      s += path("M13.8 11.0L13.8 9.0L2.6 4.35L-1 4.35L-1 5.9L11.8 11.0Z", MU.orange);
    }
    return s;
  };
}
// The driving car: a window, a door, four windows, a door and two windows
// behind the cab; the cab door with its window is drawn in cab().
const memuCab = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill, nose: NOSE_MU, rake: [[1.4, 8.4], [3.2, 11.9]], depth: 2.5, cabLen: 16, lampY: 5.6, bare: true,
  rows: muCabRows, doors: muCabDoors(MU.cream),
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: memuPaint(true), surround: "#15171a",
  cab: () =>
    // The cream cab door with its window.
    rect(13.7, 4.1, 2.2, 7.3, MU.cream, 0.45, 'rx="0.3"') + win(14.25, 7.5, 1.1, 3.0, 0.15),
  extra: (cc, g) => letters(cc, g.L / 2, 6.15, 1.05, "MEMU", MU.blue, { weight: 700 }) +
    hvac(22, MU_G.roof, 22, 1.0) + boxes(20, g.L - 16, MU_G.sill, 3) });
// An intermediate car: two windows, a door, six windows, a door and two
// windows; the pantograph is on the car behind the leading car.
const memuMid = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill,
  rows: muMidRows, doors: muMidDoors(MU.cream),
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: memuPaint(false),
  extra: (cc, g) => letters(cc, g.L / 2, 6.15, 1.05, "MEMU", MU.blue, { weight: 700 }) +
    (c.index === 1 ? pantograph(9, MU_G.roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168") + hvac(24, MU_G.roof, 22, 1.0) : hvac(g.L / 2 - 14, MU_G.roof, 28, 1.0)) +
    boxes(16, g.L - 16, MU_G.sill, 3) });
function demuPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, DE.blue], [12.3, 3, DE.roof], [11.1, 1.2, DE.red], [4.6, 0.6, DE.white], [3.7, 0.9, DE.red], [0, 3.7, DE.skirt]]);
  };
}
// The DEMU driving car: the same carbody and window/door layout as the
// MEMU, in the blue/red/white livery; its front is a reading.
const demuCab = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill, nose: NOSE_MU, rake: [[1.4, 8.4], [3.2, 11.9]], depth: 2.5, cabLen: 16, lampY: 5.6, bare: true,
  rows: muCabRows, doors: muCabDoors(DE.blue),
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: demuPaint(true), surround: "#15171a",
  cab: () =>
    rect(13.7, 4.1, 2.2, 7.3, DE.blue, 0.45, 'rx="0.3"') + win(14.25, 7.5, 1.1, 3.0, 0.15),
  extra: (cc, g) => letters(cc, g.L * 0.30, 11.7, 0.75, "SC", "#ffffff", { weight: 700 }) +
    letters(cc, g.L * 0.62, 11.7, 0.75, "VENDORS", "#ffffff", { weight: 700 }) +
    hvac(22, MU_G.roof, 22, 1.0) + boxes(20, g.L - 16, MU_G.sill, 3) });
// An intermediate car: two windows, a door, six windows, a door and two
// windows; small roof vents along the roof, as in the photograph.
const demuMid = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill,
  rows: muMidRows, doors: muMidDoors(DE.blue),
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: demuPaint(false),
  extra: (cc, g) => letters(cc, g.L * 0.30, 11.7, 0.75, "SC", "#ffffff", { weight: 700 }) +
    letters(cc, g.L * 0.62, 11.7, 0.75, "VENDORS", "#ffffff", { weight: 700 }) +
    hvac(10, MU_G.roof, 5, 0.6) + hvac(30, MU_G.roof, 5, 0.6) + hvac(50, MU_G.roof, 5, 0.6) +
    boxes(16, g.L - 16, MU_G.sill, 3) });

// ---------- The suburban EMUs ----------
// Mumbai, Kolkata and Chennai (photos 13, 14, 15): the same ICF carbody
// as the MEMU, so the driving cars reuse its window/door layout and the
// nose; the intermediate cars have three doors a side, as the Chennai
// photograph shows. The liveries are drawn from the photographs, the
// layouts are a reading.
const MB = { white: "#f2f3f4", purple: "#8e2a8e", roof: "#c5c9cc", skirt: "#2a2d31" };
const KK = { cream: "#e8ddb0", green: "#1d5c3a", red: "#c8352c", roof: "#c5c9cc", skirt: "#2a2d31" };
const CH = { white: "#eef0f1", red: "#c8352c", green: "#1d5c3a", roof: "#c5c9cc", skirt: "#2a2d31" };
const subMidRows = [muWins([2.6, 6.9], 3.4), muWins([18.2, 23.8]), muWins([39.4, 45.0]), muWins([59.7, 64.0], 3.4)];
const subMidDoors = (fill) => [muDoor(11.7, fill), muDoor(33.0, fill), muDoor(53.7, fill)];
const subCab = (fill) => rect(13.7, 4.1, 2.2, 7.3, fill, 0.45, 'rx="0.3"') + win(14.25, 7.5, 1.1, 3.0, 0.15);
// The Mumbai EMU (photo 13): white with a purple band low on the side,
// a thin purple stripe under the roof, "WR" on the purple band.
function mumbaiPaint(cab) {
  return (c, g) => {
    const L = g.L;
    return bands(L, [[0, 20, MB.white], [12.3, 3, MB.roof], [0, 3.7, MB.skirt], [3.7, 2.0, MB.purple], [11.9, 0.35, MB.purple]]);
  };
}
const mumbaiCab = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill, nose: NOSE_MU, rake: [[1.4, 8.4], [3.2, 11.9]], depth: 2.5, cabLen: 16, lampY: 5.6, bare: true,
  rows: muCabRows, doors: muCabDoors(MB.white),
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: mumbaiPaint(true), surround: "#15171a",
  cab: () => subCab(MB.white),
  extra: (cc, g) => letters(cc, g.L - 10, 4.7, 1.6, "WR", "#ffffff", { weight: 800 }) +
    letters(cc, g.L * 0.45, 6.4, 0.65, "WESTERN RAILWAY", MB.purple, { weight: 700 }) +
    hvac(22, MU_G.roof, 22, 1.0) + boxes(20, g.L - 16, MU_G.sill, 3) });
const mumbaiMid = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill,
  rows: subMidRows, doors: subMidDoors(MB.white),
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: mumbaiPaint(false),
  extra: (cc, g) => letters(cc, g.L * 0.30, 4.7, 1.6, "WR", "#ffffff", { weight: 800 }) +
    (c.index === 1 ? pantograph(9, MU_G.roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168") + hvac(24, MU_G.roof, 22, 1.0) : hvac(g.L / 2 - 14, MU_G.roof, 28, 1.0)) +
    boxes(16, g.L - 16, MU_G.sill, 3) });
// The Kolkata EMU (photo 14): cream above, dark green below with a thin
// red stripe between them; the red chevron's arm sweeping down the nose.
function kolkataPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, KK.cream], [12.3, 3, KK.roof], [0, 3.7, KK.skirt], [3.7, 2.6, KK.green], [6.3, 0.3, KK.red]]);
    if (cab) {
      // The red chevron's arm sweeping down the nose to the green band,
      // as on the front at Bandel.
      s += path("M13.8 11.0L13.8 9.2L3.0 6.6L-1 6.6L-1 8.2L11.8 11.0Z", KK.red);
    }
    return s;
  };
}
const kolkataCab = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill, nose: NOSE_MU, rake: [[1.4, 8.4], [3.2, 11.9]], depth: 2.5, cabLen: 16, lampY: 5.6, bare: true,
  rows: muCabRows, doors: muCabDoors(KK.cream),
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: kolkataPaint(true), surround: "#15171a",
  cab: () => subCab(KK.cream),
  extra: (cc, g) => letters(cc, g.L / 2, 5.0, 1.0, "12 COACH", "#f2f3f4", { weight: 700 }) +
    hvac(22, MU_G.roof, 22, 1.0) + boxes(20, g.L - 16, MU_G.sill, 3) });
const kolkataMid = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill,
  rows: subMidRows, doors: subMidDoors(KK.cream),
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: kolkataPaint(false),
  extra: (cc, g) =>
    (c.index === 1 ? pantograph(9, MU_G.roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168") + hvac(24, MU_G.roof, 22, 1.0) : hvac(g.L / 2 - 14, MU_G.roof, 28, 1.0)) +
    boxes(16, g.L - 16, MU_G.sill, 3) });
// The Chennai EMU (photo 15): white with red doors; the green lower
// front of the photograph is drawn as a wedge rising up the nose.
function chennaiPaint(cab) {
  return (c, g) => {
    const L = g.L;
    let s = bands(L, [[0, 20, CH.white], [12.3, 3, CH.roof], [0, 3.7, CH.skirt]]);
    if (cab) {
      // The green lower front sweeping up in a V, as at the station in
      // the photograph: a wedge rising up the nose from the low band.
      s += path("M-1 3.7L-1 7.4L5.0 7.4L13.8 11.0L13.8 9.6L7.0 5.7L-1 5.7Z", CH.green);
    }
    return s;
  };
}
const chennaiCab = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill, nose: NOSE_MU, rake: [[1.4, 8.4], [3.2, 11.9]], depth: 2.5, cabLen: 16, lampY: 5.6, bare: true,
  rows: muCabRows, doors: muCabDoors(CH.red),
  trucks: [10.5, c.L - 9.5], wheel: 33, paint: chennaiPaint(true), surround: "#15171a",
  cab: () => subCab(CH.white),
  extra: (cc, g) => hvac(22, MU_G.roof, 22, 1.0) + boxes(20, g.L - 16, MU_G.sill, 3) });
const chennaiMid = (c) => unit(c, { roof: MU_G.roof, sill: MU_G.sill,
  rows: subMidRows, doors: subMidDoors(CH.red),
  trucks: [9.5, c.L - 9.5], wheel: 33, paint: chennaiPaint(false),
  extra: (cc, g) =>
    (c.index === 1 ? pantograph(9, MU_G.roof, { up: true, facing: -1 }).replaceAll("currentColor", "#5b6168") + hvac(24, MU_G.roof, 22, 1.0) : hvac(g.L / 2 - 14, MU_G.roof, 28, 1.0)) +
    boxes(16, g.L - 16, MU_G.sill, 3) });

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
  irMemuCab: { name: "MEMU driving car", kind: "emu" },
  irMemuMid: { name: "MEMU intermediate car", kind: "emu" },
  irDemuCab: { name: "DEMU driving car", kind: "dmu" },
  irDemuMid: { name: "DEMU intermediate car", kind: "dmu" },
  irMumbaiCab: { name: "Mumbai suburban EMU driving car", kind: "emu" },
  irMumbaiMid: { name: "Mumbai suburban EMU intermediate car", kind: "emu" },
  irKolkataCab: { name: "Kolkata suburban EMU driving car", kind: "emu" },
  irKolkataMid: { name: "Kolkata suburban EMU intermediate car", kind: "emu" },
  irChennaiCab: { name: "Chennai suburban EMU driving car", kind: "emu" },
  irChennaiMid: { name: "Chennai suburban EMU intermediate car", kind: "emu" },
  irPalaceCoach: { name: "Palace on Wheels saloon coach", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers, from the figures usually published, set down
// from memory and not checked for this file: the LHB coach 23.54 m, the
// WAP-7 20.56 m, the WAP-5 18.16 m, a Vande Bharat car about 24 m, a
// MEMU or DEMU car about 21.3 m, a suburban EMU car about 21.3 m.
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
  irMemuCab: M(memuCab, 70.0, true),
  irMemuMid: M(memuMid, 70.0, false, byIndex),
  irDemuCab: M(demuCab, 70.0, true),
  irDemuMid: M(demuMid, 70.0, false),
  irMumbaiCab: M(mumbaiCab, 70.0, true),
  irMumbaiMid: M(mumbaiMid, 70.0, false, byIndex),
  irKolkataCab: M(kolkataCab, 70.0, true),
  irKolkataMid: M(kolkataMid, 70.0, false, byIndex),
  irChennaiCab: M(chennaiCab, 70.0, true),
  irChennaiMid: M(chennaiMid, 70.0, false, byIndex),
  irPalaceCoach: M(palaceCoach, 77.2),
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
const MEMU = set("Typical: an 8-car MEMU rake — a driving car, 6 intermediate cars and a driving car (a judgement: the timetable names no rolling stock; MEMU rakes run 8–12 cars, 8 is the usual set)",
  ["irMemuCab", 1], ["irMemuMid", 6], ["irMemuCab", 1]);
const DEMU = set("Typical: a 6-car DEMU rake — a driving car, 4 intermediate cars and a driving car (a judgement: the timetable names no rolling stock)",
  ["irDemuCab", 1], ["irDemuMid", 4], ["irDemuCab", 1]);
const MUMBAI = set("Typical: a 12-car Mumbai suburban EMU rake — a driving car, 10 intermediate cars and a driving car (a judgement: the timetable names no rolling stock; Mumbai locals run 12- and 15-car rakes, 12 is the usual set)",
  ["irMumbaiCab", 1], ["irMumbaiMid", 10], ["irMumbaiCab", 1]);
const KOLKATA = set("Typical: a 12-car Kolkata suburban EMU rake — a driving car, 10 intermediate cars and a driving car (a judgement: the timetable names no rolling stock; the photograph's unit is marked \"12 COACH\")",
  ["irKolkataCab", 1], ["irKolkataMid", 10], ["irKolkataCab", 1]);
const CHENNAI = set("Typical: a 12-car Chennai suburban EMU rake — a driving car, 10 intermediate cars and a driving car (a judgement: the timetable names no rolling stock; Chennai locals run 9- and 12-car rakes, 12 is the usual set)",
  ["irChennaiCab", 1], ["irChennaiMid", 10], ["irChennaiCab", 1]);
const MAIL_EXPRESS = set("Typical: a WAP-7 locomotive and 12 red LHB coaches (a judgement: the timetable names no rolling stock; the coach count is a fixed rake — the same red LHB stock as the Rajdhani and Duronto, confirmed by the Golden Temple Mail coach in photograph 16)",
  ["irWap7", 1], ["irRedCoach", 12]);
const PALACE = set("Typical: 12 cream and maroon Palace on Wheels saloon coaches and no locomotive (a judgement: the timetable names no rolling stock; the photograph shows the saloon coaches only, and the coach count is a fixed rake)",
  ["irPalaceCoach", 12]);

// The timetable names no rolling stock, so a train is placed by its LINE
// alone (t.line, else t.route, the line's name) — except Local and
// Suburban, which are placed by train number. The feed's number ranges
// are the cities, verified against data/regions/in/departures.json
// (2026-11-23): 3xxxx Kolkata (Sealdah, Howrah Jn, Bandel, Ranaghat,
// Gede, Lalgola), 4xxxx Chennai (Chennai Beach, Chennai Central
// Suburban, Tambaram, St Thomas Mount MRTS), 9xxxx Mumbai (Kalyan,
// Titvala, Lonavala, Pune Jn). Numbers outside those ranges keep
// returning null — Delhi 6xxxx (94 Suburban runs) and Bengaluru 0xxxx
// (8 Suburban runs) have no photograph, and the single Local 66007
// (Chennai Central Suburban – Avadi) is numbered in the Delhi 6xxxx
// range, so its city is not guessed from its stations.
const SUBURBAN = (t) => {
  const n = String(t.number || "");
  if (n[0] === "3") return KOLKATA;
  if (n[0] === "4") return CHENNAI;
  if (n[0] === "9") return MUMBAI;
  return null;
};
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
  "MEMU": MEMU,
  "DEMU": DEMU,
  "Express": MAIL_EXPRESS,
  "Passenger": MAIL_EXPRESS,
  "Superfast Express": MAIL_EXPRESS,
  "Mail/Express": MAIL_EXPRESS,
  "Tourist": PALACE,
  // "Special" is deliberately absent: the line mixes loco-hauled
  // festival specials with narrow-gauge toy trains and short regional
  // hops, so no single typical fits it — see the header comment.
};
export const TYPICAL = {
  indianrailways: (t = {}) => {
    const line = String(t.line || t.route || "");
    if (line === "Local" || line === "Suburban") return SUBURBAN(t);
    return C1[line] || null;
  },
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
const fMemu = { model: "MEMU (Mainline Electric Multiple Unit)", type: "Electric multiple unit", builder: "Integral Coach Factory", lengthFt: 70.0,
  source: `${CM}A_MEMU_train_at_Paravur_railway_station,_Jan_2020.jpg` };
const fDemu = { model: "DEMU (Diesel Electric Multiple Unit)", type: "Diesel multiple unit", builder: "Integral Coach Factory", lengthFt: 70.0,
  source: `${CM}KCG-Miryalguda_DEMU_Passenger_train_01.jpg` };
const fMumbai = { model: "Mumbai suburban EMU (Western Railway AC EMU)", type: "Electric multiple unit", builder: "Integral Coach Factory", lengthFt: 70.0,
  source: `${CM}Mumbai_EMU_AC_coaches.jpg` };
const fKolkata = { model: "Kolkata suburban EMU", type: "Electric multiple unit", builder: "Integral Coach Factory", lengthFt: 70.0,
  source: `${CM}EMU_at_Bandel.jpg` };
const fChennai = { model: "Chennai suburban EMU", type: "Electric multiple unit", builder: "Integral Coach Factory", lengthFt: 70.0,
  source: `${CM}Chennai_local_14003.jpg` };
const fPalace = { model: "Palace on Wheels saloon coach", type: "Locomotive-hauled luxury saloon coach", lengthFt: 77.2,
  source: `${CM}Palace_on_Wheels_luxury_train_at_Jaipur_India.jpg` };
export const FACTS = {
  irWap7: { ...fWap7,
    about: "The WAP-7, Indian Railways' 6,350 hp passenger electric locomotive: cream with a red-brown stripe and a dark lower band. The one photographed from the side is at a station with its cab door open; WAP-7 30673 is photographed head-on hauling the New Delhi–Chennai Rajdhani. Drawing it on every Rajdhani, Garib Rath, Humsafar and Intercity train, and on every Express, Passenger, Superfast Express and Mail/Express train, is a judgement: the timetable names no locomotive." },
  irWap5: { ...fWap5,
    about: "The WAP-5, Indian Railways' 6,000 hp passenger electric locomotive: white with a red stripe over an orange-yellow stripe and \"INDIAN RAILWAYS\" lettering. The one photographed head-on at New Delhi is WAP-5 30197 on the Duronto; the side view is from the Gatimaan. Drawing it on every Duronto, Gatimaan, Shatabdi, Jan Shatabdi and Tejas train is a judgement: the timetable names no locomotive." },
  irRedCoach: { ...fRed,
    about: "A red LHB coach with a grey lower band, as the Rajdhani rake behind WAP-7 30673 in the photograph. The same coach serves the Duronto, and the Golden Temple Mail coach photographed close up confirms it serves the Mail/Express family too. The windows' spacing and the band's depth are a reading — the coaches in the photograph are distant. Drawing 12 of them behind every Rajdhani, Duronto, Express, Passenger, Superfast Express and Mail/Express train is a judgement: the timetable names no rolling stock." },
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
  irMemuCab: { ...fMemu,
    about: "A driving car of a MEMU (Mainline Electric Multiple Unit): pale yellow-cream with a blue window band and a blue band low, and an orange chevron sweeping down the nose. The unit photographed is MEMU 13023 at Paravur, seen from the front — the side is a reading, and so are the windows' and doors' places and the car length (about 21.3 m a car). Drawing it as an 8-car set on every MEMU is a judgement: the timetable names no rolling stock, and MEMU rakes run 8–12 cars." },
  irMemuMid: { ...fMemu,
    about: "An intermediate car of a MEMU, with the same cream and blue livery. No photograph shows it squarely, so its doors and windows follow the driving car's, a judgement; so is the pantograph's place, on the car behind the leading car. Drawing 6 of them in every MEMU set is a judgement: the timetable names no rolling stock." },
  irDemuCab: { ...fDemu,
    about: "A driving car of a DEMU (Diesel Electric Multiple Unit): deep royal blue with a red band along the top of the side under a light-grey roof, a white stripe and a red band low, \"SC\" and \"VENDORS\" lettering on the red band. The rake photographed is at Miryalguda, seen from above and to the side — its driving car's front is too distant to read, so the nose follows the MEMU's, a judgement. Drawing it as a 6-car set on every DEMU is a judgement: the timetable names no rolling stock." },
  irDemuMid: { ...fDemu,
    about: "An intermediate car of a DEMU, with the same blue, red and white livery and the small roof vents of the photograph. Its doors and windows are a reading of the side view at Miryalguda. Drawing 4 of them in every DEMU set is a judgement: the timetable names no rolling stock." },
  irMumbaiCab: { ...fMumbai,
    about: "A driving car of a Mumbai suburban EMU: white with a purple band low on the side, a thin purple stripe under the roof, big \"WR\" lettering on the band and \"WESTERN RAILWAY\" in small purple letters above it. The car photographed is a Western Railway AC EMU, seen from the side — the cab end is not visible, so the nose follows the MEMU's, a judgement. Which Local and Suburban trains are Mumbai's is read from the train number (9xxxx), verified against the timetable; drawing it as a 12-car rake on every one is a judgement: the timetable names no rolling stock, and Mumbai locals also run 15-car rakes." },
  irMumbaiMid: { ...fMumbai,
    about: "An intermediate car of a Mumbai suburban EMU, with the same white and purple livery and \"WR\" on the band. Its doors and windows are a reading — the photograph shows the side of an AC EMU, not a measured elevation — and so is the pantograph's place, on the car behind the leading car. Drawing 10 of them in every Mumbai suburban rake is a judgement: the timetable names no rolling stock." },
  irKolkataCab: { ...fKolkata,
    about: "A driving car of a Kolkata suburban EMU: cream above, dark green below with a thin red stripe between them, the red chevron's arm sweeping down the nose, \"12 COACH\" on the green band. The unit photographed is EMU 11417 at Bandel, seen from the front and side — the unit number is not drawn. Which Local and Suburban trains are Kolkata's is read from the train number (3xxxx), verified against the timetable; drawing it as a 12-car rake on every one is a judgement: the timetable names no rolling stock." },
  irKolkataMid: { ...fKolkata,
    about: "An intermediate car of a Kolkata suburban EMU, with the same cream and green livery and the thin red stripe. Its doors and windows are a reading of the side stretching away in the photograph at Bandel; so is the pantograph's place, on the car behind the leading car. Drawing 10 of them in every Kolkata suburban rake is a judgement: the timetable names no rolling stock." },
  irChennaiCab: { ...fChennai,
    about: "A driving car of a Chennai suburban EMU: white with red doors, the dark-green lower front of the photograph drawn as a wedge rising up the nose. The unit photographed is EMU 14003 at a station, seen from the front and side — its red unit number and \"B\" board are not drawn. Which Local and Suburban trains are Chennai's is read from the train number (4xxxx), verified against the timetable; drawing it as a 12-car rake on every one is a judgement: the timetable names no rolling stock." },
  irChennaiMid: { ...fChennai,
    about: "An intermediate car of a Chennai suburban EMU: white with red doors, as the cars behind EMU 14003 in the photograph — no green band, as in the photograph. Its doors and windows are a reading of that side view; so is the pantograph's place, on the car behind the leading car. Drawing 10 of them in every Chennai suburban rake is a judgement: the timetable names no rolling stock." },
  irPalaceCoach: { ...fPalace,
    about: "A Palace on Wheels saloon coach: cream with a dark maroon lower band and a gold line along its top edge, a silver roof, big arched windows with a scalloped maroon valance above them, a red shield crest and a dark \"DUNGARPUR SALOON\" board. The coach photographed is the Dungarpur Saloon at Jaipur. The windows' spacing and the crest's and boards' places are a reading. Drawing 12 of them, with no locomotive, on every Tourist train is a judgement: the timetable names no rolling stock, and the photograph shows the saloon coaches only." },
};
