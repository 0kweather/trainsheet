// ÖBB's cars (scripts/railroads/austria.py): Austria's national railroad.
// Trainsheet's own side views at the shared scale (js/carart.js), each
// drawn from, or checked against, one photograph on Wikimedia Commons,
// named here fleet by fleet. Bodies and parts from czechia.cars.js and
// carmodels.js; the lettering is drawn here (no logo files).
//
// What is from the photographs: each fleet's paint, the shape of its cab,
// and what can be counted on the side that faces the camera. Only the
// double-decker's and the couchette car's photographs are true side views
// (and each shows part of one car); the rest are three-quarter views from
// the front, so the windows' spacing behind the first door, the roof
// equipment, what hangs under the floor and every length are Trainsheet's
// reading of the type, not measurements. The lengths are the figures
// usually published for each class, set down from memory and not checked
// against a source for this file, so the fact sheets below give none but
// the double-decker's, which is painted on its side. The file was verified
// after writing: node --check passes, every consist renders, and each
// drawing was looked at beside its photograph (22 Nov 2026).
//
//   The railjet: Taurus 1116 237 and its train near Rosenheim ("ÖBB 1116
//     237 mit Railjet bei Rosenheim.jpg"). Carmine over a bright red
//     stripe over slate gray, "railjet" big in outline; the coaches the
//     same with the windows in one black band and light gray skirts. The
//     locomotive and the coach are czechia.cars.js's drawings (made for
//     the railjets that run to Prague, from other photographs of the same
//     trains), checked here against this photograph and used unchanged.
//     The driving trailer is at the far end of the photographed train, too
//     small to see, so its drawing is czechia.cars.js's as it stands and
//     was NOT checked against a photograph in this set.
//   Taurus 1116 in ÖBB's red: 1116 112 at Wörgl with IC 662 ("Woergl Hbf
//     OeBB 1116.112 mit IC 662 am Bstg 4 am 12.07.2015.jpg"). Red all
//     over, a dark gray frame, one door on the side, ÖBB big in white
//     behind it. The body is the railjet Taurus's (the same class); how
//     far back the door and the lettering sit is read from a steep
//     three-quarter view.
//   The intercity coach: the coaches behind 1116 112 in the same
//     photograph. Light gray, a red roof, a red line along the bottom of
//     the side over a dark frame, ÖBB small in red by the door. The
//     windows are too foreshortened to count: twelve is a reading.
//   The Nightjet couchette car: a Liegewagen at Zürich HB ("Nightjet
//     Zuerich 200719 1.jpg"), a side view of its first four windows. Night
//     blue, a gray roof, a red line under the windows with a thin gray one
//     beneath it, a big 2 between the first two windows, "liegewagen" in
//     white italics, SBB's name and ÖBB in red low on the side; the windows
//     in silver frames with a bar across. The rest of the car (ten wide
//     windows in all, the far door) is a reading. No star motif and no
//     "nightjet" word are in the photograph, so none is drawn; the door
//     stands open in it, so the door's outer color is not known and it is
//     drawn in the body's blue.
//     THE NIGHTJET'S LOCOMOTIVE: there is no photograph of a Taurus in the
//     Nightjet's dark blue in this set, so the Nightjets are drawn behind
//     the red Taurus above (1116 112's photograph), and the consist's
//     label says so. A dark blue Nightjet Taurus is not drawn from memory.
//   4746, the Desiro ML cityjet (three cars): a 4746 near
//     Niederkreuzstetten on the Laaer Ostbahn ("ÖBB 4746 kurz vor
//     Niederkreuzstetten (Laaer Ostbahn).jpg"). White over red, the red
//     rising behind the cab and darker toward the bottom; the windows in
//     black panels that straddle the two colors, white doors with narrow
//     windows, a red line down each side of the windshield, "cityjet" in
//     gray outline and ÖBB in red on the white. The train is small in the
//     frame and seen from the front: the cab, the paint and the order
//     behind the cab (cab window, a small window, a door, a long black
//     panel, a door) are from the photograph; the number of windows in
//     each panel, the middle car and the lengths follow czechia.cars.js's
//     reading of the same class (de.wikipedia's figures, cited there).
//   4024, the Talent (four sections): 4024 135 at Buchs SG ("ÖBB Talent
//     4024 135 7 Buchs AG 20230712.jpg"). Silver, ribbed above the
//     windows, red below them and over the nose, the windows in a dark
//     band, a three-cornered cab window, a red line round the windshield,
//     ÖBB in red behind the cab and "cityjet" small on the red. The
//     photograph shows three gangway joints, so four sections are drawn
//     (the build notes say three cars); the windows and doors of each
//     section, seen at a steep angle, are a reading.
//   4734, the Stadler KISS double-decker: 4734 601 at Ybbs an der Donau
//     ("ÖBB-KISS-Ybbs-a.d.-Donau-4734-001-Bild-1.jpg"), a true side view of
//     the cab car's front two thirds, from which its nose, cab window, cab
//     door, hatch, double door, both rows of windows, the displays, the
//     lettering and the red's upper edge are placed. Silver-white over
//     red, the red darker low down, a red line at the roof's edge,
//     "cityjet" in gray outline between the decks. Its side reads 106,94 m
//     and gives four cars' weights (101t+70t+70t+101t), so it is drawn as
//     four cars (the build notes' six cars and 150 m are the longer
//     version's). The cab car's far third and the whole middle car are out
//     of the frame: a reading. So is the pantograph's place.
//   4020, the older S-Bahn unit (three cars): driving trailer 6020 304
//     leading at Traismauer, showing "Wien FJB" ("ÖBB 4020 in
//     Traismauer.jpg"). Blue and white, as every 4020 photograph on
//     Commons is: light gray-white, the windows in a blue band, a thin
//     blue line under it and another along the bottom, the cab's end blue
//     behind a slanted edge, light gray doors. The driving trailer's side
//     is counted from the photograph (cab window, two windows, a door,
//     four windows, a door, three windows); the intermediate car is partly
//     in it; the power car at the other end is not, and is drawn as the
//     driving trailer with a pantograph, a reading.
//   5022, the Desiro diesel unit (two sections): 5022 027 near Förolach
//     ("ÖBB 5022-027 bei Förolach, 13. März 2017.jpg"). Gray-white, the
//     windows in a gray band, a gray skirt and roof, the cab's end red
//     behind a curved edge, white doors, ÖBB in red under the windows, a
//     white 2 on the band.
//   5047, the diesel railcar: 5047 060 at Traisen ("ÖBB 5047 060 in
//     Traisen.jpg"). Light gray, the windows in a blue band that turns
//     down to the floor behind the door, the door's end red, a red line
//     low along the side, ÖBB in red, a white 2 on the blue, a red plow.
//     The body is that of czechia.cars.js's GySEV 247 (the same railcar,
//     sold on), with ten windows as there.
// The City Airport Train (the set's eleventh photograph) is not drawn: the
// build carries no CAT service.
//
// The timetable names no unit, so which fleet a train is drawn as is a
// judgement, labeled as typical; see TYPICAL below, where each guess is
// marked.

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, win, pantograph, underframe } from "../carart.js?v=dev";
import { unit, twinEnded, euroLoco, letters, hvac, hvLine, exhaust, tank, buffers, taurus, obbRjCoach, obbRjCab } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 2, depth = 1.0) => underframe(a, b, top, { depth, boxes: k, tanks: false });
// A word in outline: a thin line round each letter, nothing inside.
const outline = (c, x, y, h, text, stroke, w = 0.07) => letters(c, x, y, h, text, "none", { weight: 700, style: "italic", extra: `stroke="${stroke}" stroke-width="${w}"` });
const AT = { red: "#e2231a", frame: "#3c4043", glass: "#1b1d21" };

// ---------- Taurus 1116, ÖBB red ----------
// The railjet Taurus's body (czechia.cars.js: 19.28 m, trucks 9.9 m apart)
// in red: a dark gray frame, one door on the side, the louvers along the
// roof's edge, ÖBB in white. The door and the lettering are placed from
// 1116 112's three-quarter view, a reading.
const NOSE_TAURUS = [[1.7, 4.1], [1.1, 6.3], ["q", 0.95, 8.5, 2.3, 9.3], [3.9, 12.15], ["q", 4.6, 13.0, 6.4, 13.0]];
const taurusRed = (c) => euroLoco(c, { roof: 13.0, sill: 4.1, nose: NOSE_TAURUS, rake: [[2.3, 9.3], [3.9, 12.15]], centers: 32.5, wheel: 45, surround: "#141518",
  grilleFill: "rgba(20,22,25,0.3)", doors: [21.8, null], doorW: 2.2, doorGlass: false,
  paint: (cc, L) => rect(-1, 0, L + 2, 20, AT.red) + rect(-1, 11.96, L + 2, 0.08, "rgba(0,0,0,0.25)") + rect(-1, 0, L + 2, 5.9, AT.frame),
  grilles: [[-16.4, 3.8, 10.9, 11.8], [-12.0, 2.6, 10.9, 11.8], [16.5, 4.0, 10.9, 11.8]],
  over: (cc, L) => letters(cc, 44.6, 8.7, 2.9, "ÖBB", "#f4f4f2", { weight: 700 }) + letters(cc, 30.5, 4.8, 0.42, "A-ÖBB 1116 112", "#d9dbdc", { weight: 500 }) });

// ---------- The intercity coach ----------
// A 26.4 m coach on two trucks 19 m apart, a door at each end. Light gray,
// a red roof, a red line along the bottom of the side, a dark frame; ÖBB
// small in red by the door.
const IC = { gray: "#e3e5e6", roof: "#b9363b", line: AT.red, frame: "#45494d", door: "#eceeef" };
function icCoach(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [2.0, L - 4.6];
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: IC.gray, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 6.6, b: L - 6.6, y: 7.5, w: 4.0, h: 3.0, pitch: 6.25, r: 0.4 }],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 })),
    livery: () => bands(L, [[12.2, 3, IC.roof], [4.75, 0.5, IC.line], [0, 4.4, IC.frame]]) + xs.map((x) => rect(x, sill + 0.15, 2.6, 7.0, IC.door)).join(""),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.7) + buffers(0, -1, { sill }) + buffers(L, 1, { sill }) +
      letters(cc, 7.6, 5.9, 0.7, "ÖBB", AT.red, { weight: 800 }) + letters(cc, L - 7.6, 5.9, 0.7, "ÖBB", AT.red, { weight: 800 }) });
}

// ---------- The Nightjet couchette car ----------
// The same 26.4 m body. Night blue, a gray roof; under the windows a red
// line and a thin gray one. The first window is narrow, then wide ones
// 2.03 m apart (measured on the photograph against the car's height), each
// in a silver frame with a bar across; the big 2 between the first two.
const NJ = { blue: "#28306e", roof: "#8d9296", red: "#e5342f", gray: "#aeb3b8", frame: "#b4b9be", under: "#1c1d2e" };
function njCouchette(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [1.4, L - 4.0];
  const pane = (x, w) => rect(x - 0.14, 7.31, w + 0.28, 3.63, NJ.frame, 0, 'rx="0.45"') + win(x, 7.45, w, 3.35, 0.35) + line(x, 9.35, x + w, 9.35, NJ.frame, 1.3);
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: NJ.blue, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8], rows: [],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.5, glassH: 0.36 })),
    livery: () => bands(L, [[12.3, 3, NJ.roof], [6.95, 0.42, NJ.red], [6.72, 0.13, NJ.gray], [0, 4.2, NJ.under]]),
    extra: (cc) => pane(7.9, 2.9) + seq(15.6, 6.65, 10).map((x) => pane(x, 4.3)).join("") +
      [14, L - 14].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.7} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) +
      letters(cc, 13.2, 10.0, 1.9, "2", "#d9dce6", { weight: 500 }) + letters(cc, 10.6, 6.2, 0.8, "liegewagen", "#e9ecf2", { weight: 700, style: "italic" }) +
      rect(18.2, 6.02, 1.7, 0.56, "#e2231a") + letters(cc, 22.0, 6.3, 0.52, "SBB CFF FFS", "#ffffff", { weight: 700 }) +
      letters(cc, 31.0, 5.75, 1.25, "ÖBB", NJ.red, { weight: 800 }) });
}

// ---------- 4746: the Desiro ML cityjet ----------
// Three cars, each on two trucks of its own; a rounded nose under a tall
// windshield. The body's measures (nose, floor, roof, doors, trucks) are
// czechia.cars.js's for the same class; the paint is from the photograph.
const CJ = { white: "#f1f2f3", red: "#e3342b", dark: "#c8221f", roof: "#b9bfc6", skirt: "#2a2d31", door: "#eef0f1", gray: "#8a9097" };
const DML = { roof: 13.97, sill: 3.2, top: 8.0 };
const NOSE_DML = [[1.3, 3.2], [1.0, 5.6], ["q", 1.0, 7.4, 2.3, 8.6], [4.6, 12.9], ["q", 5.6, 13.97, 7.6, 13.97]];
// White; the red below, rising behind the cab to the middle of the windows
// and darker toward the bottom; each group of windows in a black panel.
const dmlPaint = (cab, panels) => (c, g) => {
  const L = g.L;
  return bands(L, [[0, 20, CJ.white], [13.0, 3, CJ.roof]]) +
    (cab ? path(`M-1 0L-1 5.9Q9 6.1 15.5 ${DML.top}L${L + 1} ${DML.top}L${L + 1} 0Z`, CJ.red) + path(`M-1 0L-1 4.4Q10 4.5 16 5.5L${L + 1} 5.5L${L + 1} 0Z`, CJ.dark)
      : rect(-1, 0, L + 2, DML.top, CJ.red) + rect(-1, 0, L + 2, 5.5, CJ.dark)) +
    rect(cab ? 9 : -1, 0, L + 2, 3.6, CJ.skirt) + panels.map(([a, b]) => rect(a, 6.5, b - a, 3.85, AT.glass, 0, 'rx="0.3"')).join("");
};
const dmlDoor = (x) => ({ x, w: 4.3, y0: 3.3, y1: 10.5, leaves: 2, glassY: 0.3, glassH: 0.58, grabs: false, fill: CJ.door });
const dmlWin = (xs, w = 4.7) => ({ xs, y: 6.75, w, h: 3.35, r: 0.4 });
const dmlCab = (c) => unit(c, { ...DML, nose: NOSE_DML, rake: [[2.3, 8.6], [4.6, 12.9]], depth: 3.0, cabLen: 9, lampY: 5.0,
  rows: [dmlWin([13.9], 3.2), dmlWin(seq(24.6, 5.5, 7)), dmlWin([c.L - 13.6, c.L - 8.1])],
  doors: [dmlDoor(18.4), dmlDoor(c.L - 21.0)], trucks: [11.5, c.L - 11.5], wheel: 33, surround: "#141518", pan: 30,
  paint: dmlPaint(true, [[13.6, 17.4], [24.2, 62.7], [c.L - 14.0, c.L - 3.0]]),
  // The cab's tall side window; the red line down the windshield's side.
  cab: () => path("M9.6 7.2L9.6 11.2L12.2 11.2L12.2 6.8Q10.4 6.8 9.6 7.2Z", AT.glass, 0.4) + path("M5.3 8.6L7.6 12.9L8.0 12.9L5.7 8.6Z", CJ.red),
  extra: (cc, g) => hvac(g.L - 30, DML.roof, 10) + boxes(17, 34, DML.sill, 2, 1.1) + boxes(40, g.L - 18, DML.sill, 2, 0.9) +
    letters(cc, 15.4, 11.6, 0.85, "ÖBB", CJ.red, { weight: 800 }) + outline(cc, 31.5, 11.6, 1.5, "cityjet", CJ.gray) });
const dmlMid = (c) => unit(c, { ...DML,
  rows: [dmlWin([3.2, 9.0]), dmlWin(seq(23.0, 5.5, 6)), dmlWin([c.L - 14.3, c.L - 8.5])],
  doors: [dmlDoor(16.4), dmlDoor(c.L - 20.4)], trucks: [12.7, c.L - 12.7], wheel: 30,
  paint: dmlPaint(false, [[2.8, 14.1], [22.6, 55.6], [c.L - 14.7, c.L - 3.4]]),
  extra: (cc, g) => hvac(4, DML.roof, 9) + hvac(g.L - 13, DML.roof, 9) + boxes(22, g.L - 22, DML.sill, 3, 1.0) + outline(cc, 30, 11.6, 1.5, "cityjet", CJ.gray) });

// ---------- 4024: the Talent ----------
// Four articulated sections sharing a truck at each joint, a truck of its
// own under each cab; a long nose under a windshield raked far back, the
// floor low between the trucks. Silver, ribbed above the windows; red from
// under the windows down, and over the nose; the windows in a dark band; a
// three-cornered cab window ahead of the silver panel that carries ÖBB.
const TL = { silver: "#cdd1d5", rib: "rgba(90,96,104,0.35)", red: "#e3352b", band: "#1b1d21", skirt: "#3a3d42", roof: "#7f858b", door: "#b9bec3" };
const TG = { roof: 12.6, sill: 3.3, low: 2.2 };
const NOSE_T = [[1.6, 2.4], [0.7, 4.4], ["q", 0.5, 6.0, 2.0, 7.2], [8.6, 12.0], ["q", 9.6, 12.6, 11.6, 12.6]];
const talentPaint = (cab) => (c, g) => {
  const L = g.L, x = cab ? 13 : -1;
  return bands(L, [[0, 20, TL.silver], [11.95, 3, TL.roof]]) + lines(seq(11.05, 0.22, 4).map((y) => [x, y, L + 1, y]), TL.rib, 0.5) +
    rect(cab ? 17.6 : -1, 6.9, L + 2, 4.0, TL.band) +
    // The red: along the side under the windows; at the cab it runs down
    // over the nose, its upper edge falling toward the front.
    (cab ? path(`M-1 0L-1 5.3Q6 5.5 10.5 6.55L${L + 1} 6.55L${L + 1} 0Z`, TL.red) : rect(-1, 0, L + 2, 6.55, TL.red)) +
    rect(cab ? 12.5 : -1, 0, L + 2, 3.55, TL.skirt);
};
const tDoor = (x) => ({ x, w: 4.6, y0: TG.low, y1: 10.9, leaves: 2, glassY: 0.42, glassH: 0.5, grabs: false, fill: TL.door });
const tWin = (xs, w = 5.2) => ({ xs, y: 7.2, w, h: 3.4, r: 0.35 });
const talentCab = (c) => unit(c, { ...TG, drop: { a: 18.5, b: c.L - 6, y: TG.low }, nose: NOSE_T, rake: [[2.0, 7.2], [8.6, 12.0]], depth: 3.0, cabLen: 12, lampY: 5.0,
  rows: [tWin(seq(18.2, 6.0, 3)), tWin([44.6, 50.6], 5.0)], doors: [tDoor(37.6)], trucks: [11.0, "end"], paint: talentPaint(true), surround: TL.band,
  // The cab's three-cornered side window; the red line that frames the
  // windshield, seen along its side.
  cab: () => path("M8.4 6.9L13.6 10.75L13.9 10.75L13.9 6.9Z", AT.glass, 0.4) + path("M5.6 7.2L12.0 12.0L12.45 12.0L6.05 7.2Z", TL.red),
  extra: (cc, g) => path("M1.5 2.4L6.6 2.4L6.2 0.8L2.1 0.6Z", "#17191c", 0.4) + letters(cc, 15.8, 9.5, 0.8, "ÖBB", TL.red, { weight: 800 }) +
    letters(cc, 15.6, 5.75, 0.6, "cityjet", "#f6dcd8", { weight: 700, style: "italic" }) +
    hvac(22, TG.roof, 14, 0.8) + hvac(42, TG.roof, 12, 0.8) + boxes(24, g.L - 10, TG.low, 3, 0.4) });
const talentMid = (c) => unit(c, { ...TG, drop: { a: 6, b: c.L - 6, y: TG.low },
  rows: [tWin([4.4, 10.4]), tWin(seq(23.6, 6.0, 4), 5.0)], doors: [tDoor(17.2)], trucks: ["end"], paint: talentPaint(false),
  // The pantograph is on the second section (Trainsheet's reading).
  extra: (cc, g) => (c.index === 1 ? pantograph(14, TG.roof + 0.3, { up: true, facing: -1 }) + hvLine(17.2, 26, TG.roof + 0.3) + hvac(30, TG.roof, 14, 0.8)
    : hvac(6, TG.roof, 16, 0.8) + hvac(g.L - 22, TG.roof, 14, 0.8)) + boxes(8, g.L - 8, TG.low, 3, 0.4) });

// ---------- 4734: the KISS double-decker ----------
// Four cars, each on two trucks of its own, the floor low between them and
// two decks over it. The cab car is placed from 4734 601's side view, at
// about 90 pixels to the meter (its 4.6 m height): a long nose, the cab's
// window in a dark three-cornered panel, the cab's door with a dark
// window, a hatch, ÖBB in red over the first double door (dark leaves, a
// white line between them), the upper windows from over that door back,
// the lower ones behind it. Silver-white; red below, its edge rising from
// the nose to just over the lower windows, darker along the bottom; a red
// line at the roof's edge; both rows of windows in black bands.
const KS = { silver: "#e4e6e7", red: "#e4372c", dark: "#cc2620", roof: "#9a9fa5", door: "#2b2d30", hatch: "#cfd3d6", gray: "#8f959b" };
const KG = { roof: 15.1, sill: 3.6, low: 2.0, top: 8.4 };
const NOSE_K = [[1.4, 2.6], [0.5, 3.6], ["q", 0.2, 5.4, 1.0, 6.9], [4.6, 11.3], [7.5, 13.7], ["q", 9.4, 15.1, 13.6, 15.1]];
const kissPaint = (cab) => (c, g) => {
  const L = g.L, top = KG.top;
  return bands(L, [[0, 20, KS.silver], [14.75, 3, KS.roof], [14.55, 0.2, KS.red]]) +
    (cab ? path(`M-1 0L-1 6.6Q14 7.0 27 ${top - 0.15}L${L + 1} ${top}L${L + 1} 0Z`, KS.red) + path(`M-1 0L-1 4.0Q20 4.0 36 4.3L${L + 1} 4.3L${L + 1} 0Z`, KS.dark)
      : rect(-1, 0, L + 2, top, KS.red) + rect(-1, 0, L + 2, 4.3, KS.dark)) +
    // The window bands: the upper deck's, the lower deck's between the
    // doors.
    rect(cab ? 30.2 : 6.6, 11.75, cab ? L - 34.8 : L - 13.2, 2.5, AT.glass, 0, 'rx="0.5"') +
    (cab ? rect(35.8, 4.4, 28.2, 3.15, AT.glass, 0, 'rx="0.5"') : rect(25.5, 4.4, L - 51.0, 3.15, AT.glass, 0, 'rx="0.5"'));
};
// A double door: dark leaves, a white line between them.
const kDoor = (x) => ({ x, w: 6.4, y0: 2.2, y1: 10.3, leaves: 2, glassY: 0.28, glassH: 0.5, grabs: false, fill: KS.door });
const kDoorLine = (x) => rect(x + 2.95, 2.3, 0.5, 7.9, "#eef0f1");
const kUpper = (xs, w = 5.0) => ({ xs, y: 12.0, w, h: 2.0, r: 0.3 });
const kLower = (xs, w = 4.2) => ({ xs, y: 4.7, w, h: 2.6, r: 0.3 });
const kDisplay = (x) => rect(x, 8.0, 4.4, 0.75, "#1d2023", 0, 'rx="0.2"') + rect(x + 0.3, 8.2, 3.8, 0.35, "#3d4349", 0, 'rx="0.1"');
const kissCab = (c) => unit(c, { ...KG, drop: { a: 24.5, b: c.L - 15.5, y: KG.low }, nose: NOSE_K, rake: [[1.2, 7.3], [4.6, 11.3]], depth: 1.7, cabLen: 20, lampY: 4.9, bare: true,
  rows: [kUpper([30.6], 2.0), kUpper(seq(36.6, 6.85, 6)), kLower([36.3], 3.1), kLower(seq(41.7, 6.2, 3)), kLower([60.3], 3.1)],
  doors: [kDoor(27.9), kDoor(c.L - 22.3)], trucks: [15.9, c.L - 9.2], wheel: 36, paint: kissPaint(true), surround: "#e9ebec",
  // The cab's window in its dark panel; the cab's door and its window; the
  // hatch behind it.
  cab: () => path("M4.9 7.8L6.6 10.75L11.3 10.8L10.0 8.35L8.9 7.8Z", "#2a2d31", 0.4) + win(6.9, 8.6, 1.6, 1.9, 0.25) +
    rect(11.0, 5.3, 3.7, 5.2, "none", 0.5, 'rx="0.3"') + rect(11.5, 7.4, 2.8, 2.8, AT.glass, 0, 'rx="0.2"') + rect(18.8, 7.65, 2.2, 2.75, KS.hatch, 0.5, 'rx="0.35"'),
  extra: (cc, g) => kDoorLine(27.9) + kDoorLine(g.L - 22.3) + kDisplay(41.6) + kDisplay(53.9) + rect(25.3, 5.65, 1.4, 0.95, "rgba(0,0,0,0.25)", 0, 'rx="0.1"') +
    letters(cc, 25.8, 12.15, 0.85, "ÖBB", KS.red, { weight: 800 }) + outline(cc, 51.0, 9.9, 2.1, "cityjet", KS.gray, 0.09) +
    letters(cc, 6.7, 4.8, 0.36, "4734 601-9", "#f6dcd8", { weight: 600 }) +
    // The roof: the cab's air conditioning; the pantograph toward the
    // car's inner end (a reading: none is in the photograph's frame).
    rect(17.7, KG.roof - 0.05, 5.8, 0.45, KS.roof, 0.4, 'rx="0.2"') + pantograph(g.L - 13, KG.roof + 0.25, { up: true, facing: -1 }) + hvLine(g.L - 24, g.L - 16.2, KG.roof + 0.25) });
const kissMid = (c) => unit(c, { ...KG, drop: { a: 16.0, b: c.L - 16.0, y: KG.low },
  rows: [kUpper(seq(7.4, 6.85, 11)), kLower([26.0], 3.1), kLower(seq(31.4, 6.2, 4)), kLower([c.L - 29.1], 3.1)],
  doors: [kDoor(17.0), kDoor(c.L - 23.4)], trucks: [9.3, c.L - 9.3], wheel: 36, paint: kissPaint(false),
  extra: (cc, g) => kDoorLine(17.0) + kDoorLine(g.L - 23.4) + kDisplay(31.3) + kDisplay(g.L - 35.7) + outline(cc, g.L / 2, 9.9, 2.1, "cityjet", KS.gray, 0.09) +
    rect(10, KG.roof - 0.05, 16, 0.4, KS.roof, 0.4, 'rx="0.2"') + rect(g.L - 26, KG.roof - 0.05, 16, 0.4, KS.roof, 0.4, 'rx="0.2"') });

// ---------- 4020: the older S-Bahn unit ----------
// Three cars, each on two trucks of its own: the power car (4020), the
// intermediate car (7020) and the driving trailer (6020), which is the car
// photographed. An upright front, raked above the waist; the frame deeper
// between the trucks; two pairs of double doors a car. Light gray-white;
// the windows in a blue band that ends, slanted, short of the cab; the
// cab's end blue behind an edge slanted the same way; a thin blue line
// under the band and another along the bottom.
const SB = { white: "#dfe2e4", blue: "#2c3391", roof: "#c7cbcf", door: "#d3d7da" };
const SG = { roof: 12.3, sill: 3.6, low: 2.7 };
const NOSE_4020 = [[0.9, 3.6], [0.7, 4.4], [0.7, 7.2], [1.9, 11.4], ["q", 2.2, 12.3, 3.6, 12.3]];
const sbPaint = (cab) => (c, g) => {
  const L = g.L;
  return bands(L, [[0, 20, SB.white], [11.75, 3, SB.roof]]) +
    (cab ? path(`M8.0 6.6L9.15 11.3L${L + 1} 11.3L${L + 1} 6.6Z`, SB.blue) + path(`M-1 0L6.0 0L8.6 11.75L-1 11.75Z`, SB.blue)
      : rect(-1, 6.6, L + 2, 4.7, SB.blue)) +
    rect(cab ? 7.6 : -1, 5.25, L + 2, 0.4, SB.blue) + rect(cab ? 6 : -1, 0, L + 2, 3.05, SB.blue);
};
const sbDoor = (x) => ({ x, w: 4.6, y0: 3.0, y1: 10.9, leaves: 2, glassY: 0.5, glassH: 0.38, grabs: false, fill: SB.door });
const sbWin = (xs) => ({ xs, y: 7.4, w: 4.0, h: 3.2, r: 0.3 });
// A cab car: the power car (pan: true) or the driving trailer.
const sbCab = (c, pan) => unit(c, { ...SG, drop: { a: 20.0, b: c.L - 18.0, y: SG.low }, nose: NOSE_4020, rake: [[0.7, 7.4], [1.8, 11.2]], depth: 1.6, cabLen: 7, lampY: 5.3,
  rows: [sbWin([10.6, 15.9]), sbWin(seq(28.4, 5.3, 4)), sbWin(seq(56.8, 5.3, 3))], doors: [sbDoor(21.6), sbDoor(50.0)],
  trucks: [11.0, c.L - 11.0], wheel: 37, paint: sbPaint(true), surround: "#1d2026",
  // The cab's side window, in the blue.
  cab: () => win(4.0, 7.9, 2.2, 2.8, 0.3),
  extra: (cc, g) => (pan ? pantograph(18, SG.roof + 0.3, { up: true, facing: -1 }) + hvLine(21.2, 30, SG.roof + 0.3) + rect(36, SG.roof - 0.05, 20, 0.6, C.steelDark, 0.4, 'rx="0.2"')
    : seq(14, 14, 4).map((x) => rect(x, SG.roof - 0.05, 2.6, 0.4, SB.roof, 0.4, 'rx="0.2"')).join("")) +
    (pan ? boxes(24, g.L - 22, SG.low, 3, 0.9) : "") });
const sbMid = (c) => unit(c, { ...SG, drop: { a: 19.0, b: c.L - 19.0, y: SG.low },
  rows: [sbWin(seq(4.6, 5.3, 3)), sbWin(seq(27.8, 5.3, 4)), sbWin(seq(57.1, 5.3, 3))], doors: [sbDoor(21.0), sbDoor(50.3)],
  trucks: [11.0, c.L - 11.0], wheel: 37, paint: sbPaint(false),
  extra: (cc, g) => seq(12, 14, 4).map((x) => rect(x, SG.roof - 0.05, 2.6, 0.4, SB.roof, 0.4, 'rx="0.2"')).join("") });

// ---------- 5022: the Desiro diesel unit ----------
// Two sections sharing a truck at the joint, a truck of its own under each
// cab; a rounded nose, the windshield in a black mask. Gray-white; the
// windows in a gray band that runs on to the cab; a gray skirt and roof;
// the cab's end red, the red's edge curving back toward the floor; white
// double doors.
const DS = { white: "#eceded", gray: "#8f9499", roof: "#9a9fa4", red: "#e8392d", door: "#f2f3f3", skirt: "#868b90" };
const DG = { roof: 12.6, sill: 3.4, low: 2.3 };
const NOSE_5022 = [[1.4, 2.6], [0.8, 4.2], ["q", 0.7, 6.6, 2.2, 7.9], [6.0, 11.8], ["q", 6.8, 12.6, 8.8, 12.6]];
const dsPaint = (c, g) => {
  const L = g.L;
  return bands(L, [[0, 20, DS.white], [11.9, 3, DS.roof]]) + path("M-1 0L24.5 0L24.5 4.4Q23.6 9.4 18.6 11.9L-1 11.9Z", DS.red) +
    rect(10.6, 6.9, L + 2, 4.3, DS.gray) + rect(-1, 0, L + 2, 4.3, DS.skirt);
};
const dsWin = (xs, w = 4.2) => ({ xs, y: 7.3, w, h: 3.5, r: 0.3 });
const desiro5022 = (c) => unit(c, { ...DG, drop: { a: 18.0, b: c.L - 6, y: DG.low }, nose: NOSE_5022, rake: [[2.2, 7.9], [6.0, 11.8]], depth: 2.8, cabLen: 10, lampY: 5.2,
  rows: [dsWin([11.2], 1.7), dsWin([14.4, 19.4, 25.4]), dsWin([30.4], 2.8), dsWin(seq(42.8, 5.1, 4)), dsWin([63.2], 2.9)],
  doors: [{ x: 35.4, w: 4.6, y0: DG.low, y1: 11.1, leaves: 2, glassY: 0.38, glassH: 0.52, grabs: false, fill: DS.door }],
  trucks: [11.0, "end"], wheel: 30, paint: dsPaint, surround: "#17191c",
  // The cab's three-cornered side window.
  cab: () => path("M6.7 7.3L9.7 10.8L10.3 10.8L10.3 7.3Z", AT.glass, 0.4),
  extra: (cc, g) => letters(cc, 29.4, 5.6, 0.85, "ÖBB", DS.red, { weight: 800 }) + letters(cc, 24.5, 9.6, 1.1, "2", "#ffffff", { weight: 600 }) +
    // The cooling and the exhaust on the roof; the engine and its tank
    // under the cab's end.
    hvac(16, DG.roof, 14, 0.7) + exhaust(34, DG.roof) + hvac(44, DG.roof, 12, 0.6) + boxes(20, 33, DG.low, 2, 0.5) + tank(42, 52, DG.low, 1.3) });

// ---------- 5047: the diesel railcar ----------
// One car on two trucks, a cab at each end (czechia.cars.js's GySEV 247 is
// the same body): a flat front leaning back a little over buffers, a
// two-leaf door behind each cab, ten windows between. Light gray; the
// windows in a blue band that turns down to the floor behind the door; the
// door's end red, its edges slanted; a red line low along the side; the
// windshields framed in blue; a red plow.
const RC = { gray: "#d6d8d9", blue: "#2147b5", red: "#e8432a", roof: "#c2c6c9" };
const NOSE_5047 = [[0.9, 3.9], [0.8, 8.3], [1.15, 11.6], ["q", 1.3, 12.6, 2.4, 12.6]];
const rcPaint = (c, g) => bands(g.L, [[0, 20, RC.gray], [11.75, 3, RC.roof], [11.45, 0.3, RC.blue]]) +
  rect(11.6, 6.7, g.L, 4.3, RC.blue) + path("M8.8 0L11.4 0L12.4 11.0L9.6 11.45Z", RC.blue) + rect(11.5, 4.3, g.L, 0.6, RC.red) +
  path("M2.6 0L8.8 0L9.6 11.45L3.2 11.45Z", RC.red);
const railcar5047 = (c) => twinEnded(c, (h) => unit(h, { roof: 12.6, sill: 3.9, nose: NOSE_5047, rake: [[0.85, 8.4], [1.15, 11.4]], depth: 2.2, cabLen: 4, lampY: 5.4,
  rows: [{ xs: seq(15.0, 5.45, 5), y: 7.1, w: 4.2, h: 3.4, r: 0.35 }], doors: [{ x: 5.0, w: 2.9, y0: 3.4, y1: 10.9, leaves: 2, glassY: 0.42, glassH: 0.46, fill: RC.red, grabs: false }],
  trucks: [12.7], wheel: 33, paint: rcPaint, coupler: "buffers", diaphragm: [4.2, 11.0], surround: RC.blue,
  extra: () => hvac(14, 12.6, 9, 0.55) + rect(4.9, 2.9, 3.1, 0.3, "currentColor") + path("M1.0 3.9L4.4 3.9L4.0 1.2L1.5 1.0Z", RC.red, 0.4) +
    // The headlight on the roof's edge.
    circle(1.5, 12.55, 0.45, "#fff4cf", 0.4) })) +
  // The one engine: its exhaust on the roof, the engine, gearbox and fuel
  // tank under the floor at the powered end.
  exhaust(c.L - 30, 12.6) + boxes(c.L - 36, c.L - 22, 3.9, 1, 1.6) + tank(22, 34, 3.9, 2.0) + boxes(36, c.L - 38, 3.9, 2, 1.0) +
  [13.5, c.L - 13.5].map((x) => letters(c, x, 9.0, 1.5, "2", "#ffffff", { weight: 600 })).join("") + letters(c, 23.5, 5.8, 0.9, "ÖBB", RC.red, { weight: 800 });

// ---------- Tables ----------

export const TYPES = {
  obbTaurusRj: { name: "Taurus (1116) electric locomotive, railjet paint", kind: "electric", pan: true },
  obbTaurus: { name: "Taurus (1116) electric locomotive", kind: "electric", pan: true },
  obbRjCoach: { name: "railjet coach", kind: "coach", amenities: ["first", "business", "dining"] },
  obbRjCab: { name: "railjet driving trailer", kind: "coach", cab: true, amenities: ["first", "business"] },
  obbIcCoach: { name: "Intercity coach", kind: "coach" },
  obbNjCouchette: { name: "Nightjet couchette car", kind: "coach", amenities: ["sleepers"] },
  obb4746Cab: { name: "cityjet (Desiro ML 4746) end car", kind: "emu" },
  obb4746Mid: { name: "cityjet (Desiro ML 4746) middle car", kind: "emu" },
  obb4024Cab: { name: "Talent (4024) end section", kind: "emu" },
  obb4024Mid: { name: "Talent (4024) middle section", kind: "emu" },
  obb4734Cab: { name: "cityjet double-decker (KISS 4734) end car", kind: "emu" },
  obb4734Mid: { name: "cityjet double-decker (KISS 4734) middle car", kind: "emu" },
  obb4020: { name: "4020 power car", kind: "emu" },
  obb7020: { name: "7020 intermediate car", kind: "emu" },
  obb6020: { name: "6020 driving trailer", kind: "emu" },
  obb5022: { name: "5022 (Desiro) diesel section", kind: "emu" },
  obb5047: { name: "5047 diesel railcar", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or the joint's center), from the figures usually
// published, not checked for this file: the Taurus 19.28 m; the railjet's
// coaches 26.5 m and its driving trailer 26.8 m (czechia.cars.js's); the
// intercity coach and the couchette car 26.4 m; the 4746 75.15 m as three
// cars (czechia.cars.js's figure; the build notes say about 70 m); the
// 4024 66.87 m as four sections; the 4734 106.94 m as four cars (painted on
// its side), drawn as four equal cars, which is a guess; the 4020 about
// 69.4 m as three cars; the 5022 41.7 m as two sections; the 5047 25.42 m.
export const MODELS = {
  obbTaurusRj: M(taurus, 63.25),
  obbTaurus: M(taurusRed, 63.25),
  obbRjCoach: M(obbRjCoach, 86.9, false, byIndex),
  obbRjCab: M(obbRjCab, 87.9, true),
  obbIcCoach: M(icCoach, 86.6),
  obbNjCouchette: M(njCouchette, 86.6),
  obb4746Cab: M(dmlCab, 84.0, true),
  obb4746Mid: M(dmlMid, 78.7),
  obb4024Cab: M(talentCab, 60.2, true),
  obb4024Mid: M(talentMid, 49.5, false, byIndex),
  obb4734Cab: M(kissCab, 87.7, true),
  obb4734Mid: M(kissMid, 87.7),
  obb4020: M((c) => sbCab(c, true), 75.9, true),
  obb7020: M(sbMid, 75.9),
  obb6020: M((c) => sbCab(c, false), 75.9, true),
  obb5022: M(desiro5022, 68.4, true),
  obb5047: M(railcar5047, 83.4),
};

const set = (label, ...units) => ({ label, units });
const RJ_UNITS = [["obbTaurusRj", 1], ["obbRjCoach", 6], ["obbRjCab", 1]];
const IC_UNITS = [["obbTaurus", 1], ["obbIcCoach", 6]];
const RAILJET = set("Typical: a Taurus (1116) locomotive and seven railjet cars, the driving trailer at the far end (some trains are two sets coupled, some the newer railjets, not drawn)", ...RJ_UNITS);
const NIGHTJET = set("Nightjet couchette cars behind a Taurus drawn in ÖBB's red (no photograph of a Nightjet-blue locomotive was to hand); the real train also carries sleeping cars and seated coaches, not drawn", ["obbTaurus", 1], ["obbNjCouchette", 7]);
const INTERCITY = set("Typical: a Taurus (1116) locomotive and intercity coaches (some EC trains are other railroads' cars or units, not drawn)", ...IC_UNITS);
const HAULED = set("Drawn as a Taurus (1116) locomotive and intercity coaches; a guess, the timetable names no cars", ["obbTaurus", 1], ["obbIcCoach", 4]);
const ICE = set("Drawn as ÖBB's locomotive and intercity coaches: this is a Deutsche Bahn ICE unit, which Trainsheet has not drawn for Austria", ...IC_UNITS);
const AUTOSCHLEUSE = set("The Tauern car shuttle (Autoschleuse Tauernbahn): a locomotive, a coach for the motorists, and the flat wagons that carry their cars, which are not drawn", ["obbTaurus", 1], ["obbIcCoach", 1]);
const DESIRO_ML = (note = "") => set(`Typical: a 4746 cityjet (Desiro ML) three-car electric unit${note}`, ["obb4746Cab", 1], ["obb4746Mid", 1], ["obb4746Cab", 1]);
const CITYJET = DESIRO_ML(), CITYJET_GUESS = DESIRO_ML(" (a guess; locomotive-hauled double-deck trains, not drawn, run many of these)");
const TALENT = set("Typical: a 4024 Talent four-section electric unit (the timetable names no unit; a guess)", ["obb4024Cab", 1], ["obb4024Mid", 2], ["obb4024Cab", 1]);
const KISS = set("Typical: a 4734 cityjet double-deck (KISS) four-car electric unit (a guess; six-car units and locomotive-hauled double-deck trains run these too)", ["obb4734Cab", 1], ["obb4734Mid", 2], ["obb4734Cab", 1]);
const OLD_SBAHN = set("Drawn as a 4020 three-car electric unit, photographed on this line bound for Wien Franz-Josefs-Bahnhof; newer cityjets run many of these trains", ["obb4020", 1], ["obb7020", 1], ["obb6020", 1]);
const DMU_5022 = set("Typical: a 5022 (Desiro) two-section diesel unit (a guess from the line)", ["obb5022", 2]);
const DMU_5047 = set("Typical: a 5047 diesel railcar (a guess from the line; often two coupled)", ["obb5047", 1]);

// ÖBB's timetable (GTFS) names no unit, and its lines are mostly timetable
// corridors ("Wien – Lindau" covers most of the west; austria.py), so a
// train is placed by its number's letters ("RJ 658", "S 4711"), then by its
// two ends, then by its line where the line has a name of its own ("R55",
// "CJX9"). Every rule is a judgement; the ones with least behind them say
// "a guess" in their label. The lists of stations are Trainsheet's, from
// memory, and not checked against ÖBB's network statement.
//   RJ, RJX: the railjet.
//   NJ, EN: the Nightjet's couchette cars behind the red Taurus (see the
//     header: no Nightjet-blue locomotive is drawn).
//   IC, EC: the red Taurus and intercity coaches. The EC trains through
//     Bregenz and Lindau and some others are foreign units; the label says
//     so and the drawing does not try to show them.
//   ICE (20 trips in the schedule: Wien–Salzburg, Graz–Salzburg–Klagenfurt
//     legs, Innsbruck–Kufstein, Innsbruck–Lindau): Deutsche Bahn's ICE
//     units running through Austria. Trainsheet has no photograph of one in
//     this set and does not draw one from memory: they are drawn as the red
//     Taurus and intercity coaches, labeled as that.
//   D, SP (the fast trains over the borders at Jesenice, Tarvisio,
//     Hegyeshalom and České Velenice, a few inland): the red Taurus and
//     four coaches, a guess.
//   ATB (line 220-A, Mallnitz-Obervellach – Böckstein): the Tauern car
//     shuttle, drawn as the locomotive and one coach; its car-carrying
//     wagons are not drawn, there being no photograph of them.
//   CJX: the 4734 double-decker (photographed at Ybbs on the Westbahn, where
//     the CJX trains run), but the 4746 for Tyrol's (Innsbruck–Kufstein).
//   S: with an end at Wien Franz-Josefs-Bahnhof, the 4020 (the photograph
//     shows one on that line; where else the 4020 still runs is not known
//     to Trainsheet, so it is drawn nowhere else); otherwise in and round
//     Vienna the 4746 (photographed on the Laaer Ostbahn); on the lines
//     without wire (below) the diesel units; everywhere else the 4024 Talent
//     (photographed at Buchs, on Vorarlberg's S-Bahn).
//   REX, R, RB, ER, IR:
//     on the short branches without wire (Horn–Sigmundsherberg,
//     Leobersdorf–Weissenbach-Neuhaus, Pöchlarn–Scheibbs, St. Pölten–
//     Traisen–Schrambach and –Hainfeld, where the 5047 was photographed,
//     St. Valentin–St. Nikola-Struden): the 5047;
//     on the longer lines without wire (Linz Urfahr–Rottenegg, Wiener
//     Neustadt–Gutenstein, –Puchberg, –Aspang–Friedberg–Hartberg–Fehring,
//     the inner Aspangbahn by Traiskirchen, St. Pölten–Horn, Fehring–
//     Szentgotthárd and –Fürstenfeld, Neumarkt am Wallersee–Friedburg–
//     Braunau and on to Simbach and Neumarkt-Kallham): the 5022. Which of
//     the two diesel fleets a line gets is genuinely uncertain; the split
//     by the line's length is Trainsheet's. Carinthia's lines to
//     Weizelsdorf, Bleiburg and Wolfsberg are left to the Talent: Trainsheet
//     believes them wired by now, and has not checked;
//     between Wien Westbahnhof and St. Pölten or Amstetten: the 4734;
//     elsewhere in and round Vienna: the 4746, said to be a guess (many of
//     these REX trains are locomotive-hauled double-deck trains, for which
//     there is no photograph);
//     everywhere else: the 4024 Talent.
//   Anything not placed: the 4024 Talent.
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const BRANCH_5047 = /^(weissenbach-neuhaus|scheibbs|schrambach|hainfeld|traisen|st\.? ?nikola-struden|wieselburg)/;
const DIESEL_5022 = /^(rottenegg|linz\/donau urfahr|aigen-schlagl|gutenstein|puchberg am schneeberg|aspang markt|friedberg|hartberg|furstenfeld|szentgotthard|traiskirchen aspangbahn|friedburg|braunau|horn$|winzendorf|bad fischau-brunn)/;
const VIENNA = /^(wien|flughafen wien|wolfsthal|bratislava|devinska|marchegg|ganserndorf|mistelbach|wolkersdorf|laa\/thaya|korneuburg|stockerau|hollabrunn|retz|absdorf|tulln|st\. andra-wordern|krems|gmund|sigmundsherberg|st\. polten|eichgraben|unterpurkersdorf|neulengbach|modling|baden|leobersdorf|wiener neustadt|payerbach|murzzuschlag|bruck\/leitha|neusiedl|pamhagen|parndorf|nickelsdorf|hegyeshalom|eisenstadt|wulkaprodersdorf|sopron|deutschkreutz|breclav|bernhardsthal|gotzendorf|amstetten|pochlarn|st\. valentin)/;
const WEST_OF_VIENNA = /^(st\. polten|amstetten|pochlarn|st\. valentin|melk|ybbs)/;
const TYROL = /^(innsbruck|kufstein|worgl|jenbach|telfs|landeck|brennero|steinach|hall in tirol|scharnitz)/;
// A named line's fleet, for a line shown without a train (the fleet page).
const LINE = { "220-a": AUTOSCHLEUSE, r54: DMU_5047, r55: DMU_5047, r96: DMU_5047, r92: DMU_5022, r95: DMU_5022, r97: DMU_5022, r98: DMU_5022, rex92: DMU_5022, rex97: DMU_5022,
  "520-n": DMU_5022, cjx9: KISS, r62: CITYJET_GUESS, r91: CITYJET_GUESS, rex6: CITYJET_GUESS, rex62: CITYJET_GUESS, rex63: CITYJET_GUESS, rex64: CITYJET_GUESS, rex65: CITYJET_GUESS,
  rex9: CITYJET_GUESS, rex93: CITYJET_GUESS };
export const TYPICAL = {
  obb: (t = {}) => {
    const line = fold(t.route || t.line);
    // The number's letters; failing them, a named line's ("REX64").
    const kind = (String(t.number || "").trim().match(/^[A-Za-z]+/) || line.match(/^(?:s|r|rex|cjx)(?=\d)/) || [""])[0].toUpperCase();
    let a = fold(t.origin), b = fold(t.destination || t.dest);
    const ends = !!(a && b);
    // No ends known (a line on the fleet page): the line's own two.
    if (!ends) [a = "", b = ""] = line.split(/\s+[–-]\s+/);
    const either = (re) => re.test(a) || re.test(b), both = (re) => re.test(a) && re.test(b);
    switch (kind) {
      case "RJ": case "RJX": return RAILJET;
      case "NJ": case "EN": return NIGHTJET;
      case "IC": case "EC": return INTERCITY;
      case "ICE": return ICE;
      case "D": case "SP": return HAULED;
      case "ATB": return AUTOSCHLEUSE;
    }
    if (!kind && line === "220-a") return AUTOSCHLEUSE;
    // A line with a name of its own, where the train's ends don't say more.
    if (!ends) return LINE[line] || (kind === "CJX" ? KISS : TALENT);
    if (kind === "CJX") return both(TYROL) ? CITYJET : KISS;
    if (kind === "S" && either(/^wien franz-josefs-bahnhof/)) return OLD_SBAHN;
    // The lines without wire.
    if (either(BRANCH_5047) || (both(/^(horn|sigmundsherberg)/) && either(/^horn/))) return DMU_5047;
    if (either(DIESEL_5022) || LINE[line] === DMU_5022 || (either(/^fehring/) && !either(/^(graz|wien)/))) return DMU_5022;
    if (LINE[line] === DMU_5047) return DMU_5047;
    if (kind === "S") return both(VIENNA) ? CITYJET : TALENT;
    if (either(/^wien westbahnhof/) && either(WEST_OF_VIENNA)) return KISS;
    if (both(VIENNA)) return CITYJET_GUESS;
    return TALENT;
  },
};

// Sources: the photograph each drawing was checked against (Wikimedia
// Commons). Builders are the commonly published ones, set down from memory;
// figures Trainsheet could not check are left out.
const CM = "https://commons.wikimedia.org/wiki/File:";
const P = { rj: `${CM}%C3%96BB_1116_237_mit_Railjet_bei_Rosenheim.jpg`, ic: `${CM}Woergl_Hbf_OeBB_1116.112_mit_IC_662_am_Bstg_4_am_12.07.2015.jpg`,
  nj: `${CM}Nightjet_Zuerich_200719_1.jpg`, dml: `${CM}%C3%96BB_4746_kurz_vor_Niederkreuzstetten_(Laaer_Ostbahn).jpg`, talent: `${CM}%C3%96BB_Talent_4024_135_7_Buchs_AG_20230712.jpg`,
  kiss: `${CM}%C3%96BB-KISS-Ybbs-a.d.-Donau-4734-001-Bild-1.jpg`, sb: `${CM}%C3%96BB_4020_in_Traismauer.jpg`, d5022: `${CM}%C3%96BB_5022-027_bei_F%C3%B6rolach,_13._M%C3%A4rz_2017.jpg`,
  d5047: `${CM}%C3%96BB_5047_060_in_Traisen.jpg` };
const f4746 = { model: "ÖBB 4746 cityjet (Siemens Desiro ML)", type: "Electric multiple unit", builder: "Siemens Mobility", source: P.dml };
const f4024 = { model: "ÖBB 4024 (Bombardier Talent)", type: "Electric multiple unit", builder: "Bombardier", source: P.talent };
const f4734 = { model: "ÖBB 4734 cityjet (Stadler KISS)", type: "Double-deck electric multiple unit", builder: "Stadler Rail", lengthFt: 350.9, source: P.kiss };
const f4020 = { model: "ÖBB 4020", type: "Electric multiple unit", builder: "Simmering-Graz-Pauker", source: P.sb };
export const FACTS = {
  obbTaurusRj: { model: "Siemens Taurus (ÖBB 1116), railjet paint", type: "Electric locomotive", builder: "Siemens", source: P.rj,
    about: "The Taurus, ÖBB's four-axle express locomotive, in the railjet's carmine, red and slate gray to match its train. The one photographed near Rosenheim is 1116 237. The drawing is the one Trainsheet made for the railjets that run to Prague, checked against this photograph." },
  obbTaurus: { model: "Siemens Taurus (ÖBB 1116)", type: "Electric locomotive", builder: "Siemens", source: P.ic,
    about: "The Taurus in ÖBB's plain red with a dark gray frame, as on the Intercity and EuroCity trains; the one photographed at Wörgl with IC 662 is 1116 112. Trainsheet also draws it at the head of the Nightjets, having no photograph of a locomotive in the Nightjet's dark blue." },
  obbRjCoach: { model: "railjet coach", type: "Passenger coach", builder: "Siemens Mobility", source: P.rj,
    about: "A coach of ÖBB's railjet, the fixed seven-car train pushed or pulled by a Taurus: carmine over a red stripe and slate gray, the windows in one black band, the word railjet in outline on the gray." },
  obbRjCab: { model: "railjet driving trailer", type: "Driving trailer", builder: "Siemens Mobility", source: P.rj,
    about: "The car at the far end of a railjet, with a cab from which the locomotive at the other end is driven. It is too far off to see in the photograph this file used, so the drawing is the one Trainsheet made for the railjets that run to Prague, not checked again here." },
  obbIcCoach: { model: "ÖBB Intercity coach", type: "Locomotive-hauled passenger coach", source: P.ic,
    about: "One of the coaches of ÖBB's Intercity and EuroCity trains, as photographed behind 1116 112 at Wörgl: light gray with a red roof and a red line along the bottom of the side. The photograph shows them at a steep angle, so the number of windows is Trainsheet's reading." },
  obbNjCouchette: { model: "Nightjet couchette car (Liegewagen)", type: "Couchette car", source: P.nj,
    about: "A couchette car of the Nightjet, ÖBB's night trains, photographed at Zürich HB: night blue with a red line under the windows, a big 2 and the word liegewagen. The photograph shows its first four windows; the rest of the car is Trainsheet's reading." },
  obb4746Cab: { ...f4746,
    about: "An end car of the three-car cityjet that works Vienna's S-Bahn and regional trains: white over red, the windows in black panels. Photographed on the Laaer Ostbahn north of Vienna, small in the frame, so the windows behind the first door are a reading." },
  obb4746Mid: { ...f4746,
    about: "The middle car of a 4746. Each of the three cars rides on two trucks of its own." },
  obb4024Cab: { ...f4024,
    about: "An end section of the Talent, the articulated electric unit of ÖBB's S-Bahn and regional trains across Austria: silver with red below the windows and over its long nose. The one photographed at Buchs, on the Swiss border, is 4024 135." },
  obb4024Mid: { ...f4024,
    about: "A middle section of a 4024. The photograph shows three gangway joints, so Trainsheet draws four sections sharing a truck at each joint; where the pantograph sits is a reading." },
  obb4734Cab: { ...f4734,
    about: "The cab car of ÖBB's double-deck cityjet, built by Stadler: silver-white over red, two rows of windows, the word cityjet in outline between the decks. Drawn from a side view of 4734 601 at Ybbs an der Donau, whose side gives the unit's length as 106.94 m and the weights of four cars." },
  obb4734Mid: { ...f4734,
    about: "A middle car of a 4734. None is in the photograph, so its doors and windows are Trainsheet's reading from the cab car's." },
  obb4020: { ...f4020,
    about: "The power car of a 4020, the three-car unit that worked Vienna's S-Bahn for decades, in its blue and white. Only the driving trailer is in the photograph; the power car is drawn as its twin with a pantograph, a reading." },
  obb7020: { ...f4020,
    about: "The intermediate car of a 4020 (numbered 7020), between the power car and the driving trailer." },
  obb6020: { ...f4020,
    about: "The driving trailer of a 4020 (numbered 6020): the car photographed, 6020 304, leading a train for Wien Franz-Josefs-Bahnhof at Traismauer. Its windows and doors are counted from the photograph." },
  obb5022: { model: "ÖBB 5022 (Siemens Desiro)", type: "Diesel multiple unit", builder: "Siemens", source: P.d5022,
    about: "One of the two sections of ÖBB's Desiro diesel unit, for the regional lines without wire: gray-white with a red cab end, the two sections sharing a truck at the joint. The one photographed near Förolach in Carinthia is 5022 027." },
  obb5047: { model: "ÖBB 5047", type: "Diesel railcar", builder: "Jenbacher Werke", source: P.d5047,
    about: "A single diesel railcar with a cab at each end, the usual train of Lower Austria's branch lines: light gray with a blue window band and a red door end. The one photographed at Traisen is 5047 060." },
};
