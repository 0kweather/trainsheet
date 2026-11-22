// Lokaltog's cars (scripts/railroads/denmark.py): the local railways of
// Zealand, Lolland and Falster, routes 110R, 210R, 410, 510R, 710R, 910,
// 920R, 930R, 940R, 950R and 960R, drawn as the Alstom Coradia LINT 41
// two-car diesel unit, and Lollandsbanen's (710R, Nakskov-Nykøbing F) as
// the two-car IC2. The timetable names no unit, so every train is drawn as
// one set of its line's type, labeled as typical. Trainsheet's own side
// views from
// published dimensions, at the shared scale (js/carart.js), lettered here
// (no logo files). Bodies and parts from czechia.cars.js; the LINT's nose
// as drawn there for Leo Express's.
//
// The paint is checked against one photograph, a unit at Hillerød seen
// from above and to the side: the cab yellow, its roof dark gray down to
// the top of the windshield, a black three-cornered window behind the
// windshield and a yellow cab door behind that; the yellow ending in a long
// curve that leans back from the floor behind the first window to the roof
// just ahead of the door, a slash of lighter silver behind it; the rest
// silver-gray over a dark gray skirt, the doors dark, the windows tinted
// black; "DOT" in black and "Lokaltog" in an outlined box low on the yellow
// behind the nose; a dark display panel under the second window; bicycle
// signs on the door's glass; on the gray roof, light gray covers and an
// exhaust pipe over the door. Each car as photographed: three windows (the
// third narrower), the double door, four windows, the joint. The
// underfloor equipment is hidden by the platform in the photograph and is
// Trainsheet's reading of the type; the unit's number on the skirt can't be
// read and is left off.
//
// The IC2's paint is checked against one photograph too (Kurt Rasmussen's,
// bahnbilder.de 1228320, also on Wikimedia Commons): LJ FS 1144 and MF 1044
// at Nykøbing F on October 10, 2020, the control car (FS) nearest, seen
// from ahead and to the side, the motor car (MF) beyond it. What it shows
// is described at the IC2 below. It carries no DOT or Lokaltog lettering.

import { rect, path, lines, win, underframe } from "../carart.js?v=dev";
import { unit, letters, exhaust, tank } from "./czechia.cars.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 1, depth = 0.8) => underframe(a, b, top, { depth, boxes: k, tanks: false });

// ---------- Paint ----------
const LT = { yellow: "#f6c416", silver: "#b4b9be", light: "#d3d7da", roof: "#7f858b", cover: "#aeb4b9", skirt: "#5a5f65", black: "#17191d", door: "#1c2230", ink: "#1a1b1d", panel: "#6f6548" };
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";

// ---------- Coradia LINT 41 ----------
// 41.81 m over the couplers as two sections on a shared Jakobs truck, a
// truck under each cab; a long raked windshield over a short nose, one
// double door a side in each section.
const LINT = { roof: 13.4, sill: 2.8, eave: 12.4, skirt: 3.5, len: 68.6 };
const NOSE = [[1.0, 2.8], [1.0, 5.6], ["q", 1.1, 7.0, 2.0, 8.0], [4.6, 12.4], ["q", 5.4, 13.4, 7.2, 13.4]];
// The yellow's rear edge, floor to roof, and the same curve set back for
// the lighter slash behind it (which closes to nothing at the roof).
const EDGE = "L17.5 3.5Q19.6 8.6 25.0 10.4Q28.2 11.5 31.0 12.4";
const SLASH = "M17.5 3.5L21.4 3.5Q22.6 8.2 26.6 10.2Q29.0 11.5 31.0 12.4Q28.2 11.5 25.0 10.4Q19.6 8.6 17.5 3.5Z";
function paint(c, g) {
  const L = g.L;
  return bands(L, [[0, 20, LT.silver], [10.7, 1.7, LT.light]]) +
    path(SLASH, LT.light) + path(`M-1 3.5${EDGE}L-1 12.4Z`, LT.yellow) +
    bands(L, [[LINT.eave, 3, LT.roof], [0, LINT.skirt, LT.skirt]]) +
    // The black three-cornered window behind the windshield.
    path("M4.4 6.4L9.6 6.4L9.6 10.4L8.6 10.4Z", LT.black);
}
const door = (x) => ({ x, w: 4.3, y0: LINT.sill, y1: 10.6, leaves: 2, glassY: 0.4, glassH: 0.48, grabs: false, fill: LT.door });
// A light gray cover on the roof.
const cover = (x, w, h = 0.75, roof = LINT.roof, fill = LT.cover) => rect(x, roof - 0.05, w, h, fill, 0.4, 'rx="0.3"');
function lint(c) {
  return unit(c, { roof: LINT.roof, sill: LINT.sill, nose: NOSE, rake: [[2.0, 8.0], [4.6, 12.4]], cabLen: 8, lampY: 4.6,
    rows: [{ xs: [13.5, 19.6], y: 6.4, w: 5.2, h: 3.9, r: 0.3 }, { xs: [25.8], y: 6.4, w: 3.6, h: 3.9, r: 0.3 }, { xs: seq(37.4, 7.2, 4), y: 6.4, w: 5.8, h: 3.9, r: 0.3 }],
    doors: [door(31.0)], trucks: [10.5, "end"], paint, surround: LT.black,
    extra: (cc, g) =>
      // The cab door, yellow, between the black window and the first one.
      rect(9.9, 3.6, 2.9, 7.0, "rgba(0,0,0,0.05)", 0.5) +
      // The display panel under the second window.
      rect(19.9, 4.7, 4.6, 0.8, LT.panel, 0.3, 'rx="0.1"') +
      // The bicycle signs on the door's glass, as two white dots.
      rect(31.85, 6.9, 0.45, 0.45, "#e9ecee", 0, 'rx="0.2"') + rect(34.0, 6.9, 0.45, 0.45, "#e9ecee", 0, 'rx="0.2"') +
      // Roof: a long cover from the first window to the third, a taller
      // box behind it, the exhaust over the door, a long cover beyond.
      cover(13.5, 15.5) + cover(29.6, 2.4, 1.05) + exhaust(32.6, LINT.roof) + cover(39.5, g.L - 47) +
      boxes(25, 40, LINT.sill, 2, 1.0) + tank(41, 48, LINT.sill, 1.2) +
      // "DOT", black, and "Lokaltog" in its outlined box, low on the yellow.
      letters(cc, 5.5, 4.55, 0.72, "DOT", LT.ink, { weight: 800, family: SANS }) +
      rect(6.75, 4.15, 2.75, 0.8, "none", 0, `rx="0.12" stroke="${LT.ink}" stroke-width="0.06"`) +
      letters(cc, 8.12, 4.55, 0.5, "Lokaltog", LT.ink, { weight: 500, family: SANS }) });
}

// ---------- IC2 ----------
// Adtranz's two-car diesel unit of 1997 for the private railways, the IC3's
// smaller sister: a motor car (MF) and a control car (FS), 41 m, each end
// the IC3's flat front in a thick black rubber ring. The profile and the
// front are the IC3's as dsb.cars.js draws them; the two cars are drawn on
// a shared truck at the joint like the IC3's (the photograph's shadow
// hides the joint's underside).
//
// As photographed (LJ FS 1144 + MF 1044, Nykøbing F, 2020): ribbed silver
// sides and roof over a dark gray-brown skirt; behind the black rubber a
// dark crimson end, full width at the roof and cut back on a slant to
// nothing at the floor, the cab's tall narrow window and its mirror in it;
// a dark blue band at window height that begins on the same slant behind
// the cab and runs the length of the train; silver single doors with a
// tall narrow pane; a tan rubber ring at the joint.
//   FS (nearest, so measured off the photograph): a dark display over the
//     band behind the cab, one big window in the band, a door that reaches
//     down into the skirt, a small white sign on the blue behind it, four
//     windows set low (their tops in the band, the rest in the silver
//     below: the low floor), a second low door, one more window in the
//     band before the joint; a long white box on the roof toward the joint;
//     "LJ FS 1144" small and white on the skirt behind the cab.
//   MF (beyond it, seen small and end-on, so its spacing is approximate):
//     from the joint a row of windows in the band (seven, as counted), a
//     door, one window, the cab, the same crimson end; equipment under the
//     floor; small covers on the roof. Its number can't be read and is
//     left off, and no exhaust can be made out, so none is drawn.
const IC2 = { roof: 12.6, sill: 3.4, skirt: 4.05, band: [7.1, 10.4], len: 67.26 };
const IP = { silver: "#c3c6cb", rib: "rgba(0,0,0,0.12)", roof: "#cdd0d4", crimson: "#96304a", blue: "#2e3457", skirt: "#4b4742", door: "#b7babf",
  rubber: "#1d1c1b", ring: "#8a7355", box: "#e4e4e0", mirror: "#4a4d52" };
const NOSE_IC2 = [[0.6, 3.4], [0.4, 4.4], [0.4, 11.4], ["q", 0.4, 12.6, 1.8, 12.6]];
// The rubber ring from the side, standing a little proud of roof and floor.
const rubber = () => path("M2.7 3.1L0.9 3.1Q0.1 3.1 0.1 3.9L0.1 11.7Q0.1 12.8 1.4 12.8L2.7 12.8Z", IP.rubber, 0.5) +
  lines([[2.1, 3.5, 2.1, 12.4]], "rgba(255,255,255,0.10)", 0.6) +
  rect(0.02, 5.3, 0.24, 0.45, "#fff4cf", 0, 'rx="0.1"') + rect(0.02, 11.3, 0.24, 0.4, "#fff4cf", 0, 'rx="0.1"');
function ic2Paint(c, g) {
  const L = g.L, [b0, b1] = IC2.band, ribs = [];
  for (let y = 4.45; y < b0 - 0.1; y += 0.42) ribs.push([-1, y, L + 1, y]);
  for (let y = b1 + 0.35; y < IC2.roof; y += 0.42) ribs.push([-1, y, L + 1, y]);
  return bands(L, [[0, 20, IP.silver], [11.75, 3, IP.roof]]) +
    // The blue band, its leading edge leaning back like the crimson's.
    path(`M9.3 ${b0}L12 ${b1}L${L + 1} ${b1}L${L + 1} ${b0}Z`, IP.blue) +
    // The crimson end: to the roof, cut back from the band's top to the floor.
    path(`M-1 ${IC2.skirt}L3 ${IC2.skirt}L8.9 ${b1}L9.5 14L-1 14Z`, IP.crimson) +
    lines(ribs, IP.rib, 0.5) + bands(L, [[0, IC2.skirt, IP.skirt]]);
}
const ic2Door = (x, y0 = IC2.sill) => ({ x, w: 3.2, y0, y1: 10.9, leaves: 1, glassY: 0.3, glassH: 0.6, grabs: false, fill: IP.door });
// The cab's side window in the crimson, its mirror, the rubber over it all.
const ic2Cab = () => win(5.8, 7.0, 2.3, 3.4, 0.4) + rect(8.0, 8.9, 0.7, 1.2, IP.mirror, 0.3, 'rx="0.12"') + rubber();
// The tan rubber ring at the joint.
const ring = (L) => rect(L - 0.45, IC2.sill + 0.1, 0.5, IC2.roof - IC2.sill - 0.05, IP.ring, 0.3, 'rx="0.2"');
const ic2Base = { roof: IC2.roof, sill: IC2.sill, nose: NOSE_IC2, rake: [[0.7, 8.0], [0.75, 11.3]], depth: 1.4, cabLen: 7, lampY: 5.5,
  trucks: [9.5, "end"], wheel: 33, paint: ic2Paint, surround: IP.rubber, cab: ic2Cab };
// The control car: low between the trucks.
function ic2Fs(c) {
  return unit(c, { ...ic2Base, drop: { a: 20.5, b: 59.5, y: 1.9 },
    rows: [{ xs: [13.4], y: 7.4, w: 5.5, h: 2.8, r: 0.5 }, { xs: [60.6], y: 7.4, w: 4.2, h: 2.8, r: 0.5 },
      { xs: seq(28.9, 6.75, 4), y: 4.7, w: 4.7, h: 3.05, r: 0.5 }],
    doors: [ic2Door(22.6, 1.9), ic2Door(54.6, 1.9)],
    extra: (cc, g) =>
      // The display over the band behind the cab.
      rect(12.8, 10.7, 5.0, 0.75, IP.rubber, 0.3, 'rx="0.1"') +
      // The white sign on the blue behind the first door.
      rect(26.2, 7.9, 1.0, 1.7, "none", 0, 'rx="0.1" stroke="#e9ecee" stroke-width="0.08"') + rect(26.38, 8.05, 0.64, 0.4, "#e9ecee", 0, 'rx="0.05"') +
      // Roof: small covers over the cab, the long white box toward the joint.
      cover(9.5, 3.0, 0.5, IC2.roof, IP.box) + cover(44, 19.5, 1.0, IC2.roof, IP.box) + ring(g.L) +
      letters(cc, 15, 3.7, 0.42, "LJ FS 1144", "#e9ecee", { weight: 500, family: SANS }) });
}
// The motor car: its engines under the floor.
function ic2Mf(c) {
  return unit(c, { ...ic2Base,
    rows: [{ xs: [11.4], y: 7.4, w: 4.5, h: 2.8, r: 0.5 }, { xs: seq(22.4, 6.0, 7), y: 7.4, w: 4.7, h: 2.8, r: 0.5 }],
    doors: [ic2Door(17.0)],
    extra: (cc, g) => cover(9.5, 3.0, 0.5, IC2.roof, IP.box) + cover(28, 6, 0.5, IC2.roof, IP.box) + cover(46, 5, 0.5, IC2.roof, IP.box) + ring(g.L) +
      boxes(21, 52, IC2.sill, 3, 1.4) });
}

// ---------- Tables ----------

export const TYPES = {
  ltLint: { name: "Coradia LINT 41 section", kind: "emu", amenities: ["bikes"] },
  ltIc2Fs: { name: "IC2 control car (FS)", kind: "emu" },
  ltIc2Mf: { name: "IC2 motor car (MF)", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// Feet: half of 41.81 m; the IC2's cars 20.5 m each.
export const MODELS = {
  ltLint: M(lint, LINT.len, true),
  ltIc2Fs: M(ic2Fs, IC2.len, true),
  ltIc2Mf: M(ic2Mf, IC2.len, true),
};

const set = (label, ...units) => ({ label, units });
const LINT41 = set("Typical Lokaltog train: an Alstom Coradia LINT 41 two-car diesel unit", ["ltLint", 2]);

const IC2_SET = set("Typical Lollandsbanen train: an IC2 two-car diesel unit", ["ltIc2Fs", 1], ["ltIc2Mf", 1]);

// The timetable (Rejseplanen's) names no unit, so each train is drawn as
// its line's type: the IC2 on Lollandsbanen (route 710R, Nakskov-Nykøbing
// F; Nakskov is on no other line), one LINT 41 everywhere else.
export const TYPICAL = {
  lokaltog: (t = {}) => {
    const r = String(t.route || t.line || "").trim().toUpperCase();
    const ends = `${t.origin || ""} ${t.destination || t.dest || ""}`;
    return r === "710R" || /Nakskov/.test(ends) ? IC2_SET : LINT41;
  },
};

// The LINT's seats, fleet size and build years are left out: not checked
// against a source here. The IC2's figures are Danish Wikipedia's.
const ic2 = { model: "IC2 (class MF/FS)", type: "Diesel multiple unit", builder: "Adtranz, Randers (1997)", fleet: "13 two-car sets",
  topSpeedMph: 87, powerHp: 840, lengthFt: 134.5, source: "https://da.wikipedia.org/wiki/IC2" };
export const FACTS = {
  ltLint: { model: "Alstom Coradia LINT 41", type: "Diesel multiple unit", builder: "Alstom (Salzgitter)", topSpeedMph: 74.6, lengthFt: 137.2,
    source: "https://en.wikipedia.org/wiki/Alstom_Coradia_LINT",
    about: "A two-car diesel unit, its two sections sharing a truck at the joint, with one double door a side in each. Lokaltog's are silver-gray with yellow cabs, lettered DOT Lokaltog, and work its local lines on Zealand, Lolland and Falster. Lollandsbanen's trains are IC2 sets instead." },
  ltIc2Fs: { ...ic2,
    about: "The control car of an IC2, the two-car diesel train built for Denmark's private railways as a smaller sister of DSB's IC3, with the same flat fronts in a black rubber ring. Its floor is low between the trucks, so its doors and four of its windows sit lower than the rest. Lollandsbanen's are silver with a dark blue window band and crimson ends; the one photographed at Nykøbing F is FS 1144." },
  ltIc2Mf: { ...ic2,
    about: "The motor car of an IC2, with two diesel engines under its floor. It runs coupled to a control car (FS) between Nakskov and Nykøbing F on Lollandsbanen." },
};
