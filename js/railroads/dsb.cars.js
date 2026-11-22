// DSB's cars (scripts/railroads/denmark.py): Denmark's state railroad's
// long-distance and regional trains, lines IC, ICL, RE, ECE and RJ. The
// timetable (Rejseplanen's GTFS) names no car or unit, so every train is
// drawn as what usually runs on its line, labeled as typical. Trainsheet's
// own side views from published dimensions, at the shared scale
// (js/carart.js), lettered here (no logo files). Bodies and parts from
// czechia.cars.js.
//
// The paint is drawn from four photographs, and from nothing else:
//   IC3 MF 5052 on the Masnedsund bridge: white ribbed sides, the windows
//     in a dark gray band, a gold line over the windows by the cab, the
//     black rubber front;
//   IC4 MG 5804 at Aarhus: white, a dark blue nose and cab, the windows in
//     a black band, a gray skirt, red beside the doors' glass and DSB's red
//     disc low on the doors;
//   IR4 ER 2030: silver ribbed sides, the windows in a glossy black band, a
//     gold line over the first windows, the black rubber front;
//   Vectron EB 3242 at Hamburg-Altona with DB's intercity coaches: red all
//     over, a gray roof and cab top, a dark underframe, DSB's mark in white
//     outline behind each cab; the coach light gray with a red stripe under
//     the windows.
// The marks on the units' front faces (DSB's red disc and the number on the
// IC3 and IC4, the white winged wheel and crown on the IR4) can't be seen
// from the side, so they aren't drawn. There is no photograph of the ME
// diesel locomotives or the double-deck coaches of Zealand's regional
// trains, so that fleet is not drawn (see TYPICAL).

import { coachCar } from "../carmodels.js?v=dev";
import { C, rect, circle, path, lines, win, pantograph, underframe } from "../carart.js?v=dev";
import { unit, euroLoco, letters, mark, hvac, hvLine, exhaust, tank, buffers } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ---------- Paint ----------
// DSB's red is the railroad's color in denmark.py; the Vectron's body is
// the brighter red of the photograph.
const DSB = { red: "#b41730", white: "#eceeef", rib: "rgba(0,0,0,0.13)", band: "#3d444d", roof: "#aeb4ba", skirt: "#2a2d31", gold: "#d9a441",
  silver: "#c5cad0", silverRib: "rgba(255,255,255,0.55)", gloss: "#14171b", silverDoor: "#b9bfc6", silverSkirt: "#3a3d42",
  navy: "#252f48", ic4White: "#f0f1f1", ic4Roof: "#9aa0a7", ic4Skirt: "#8d9399", black: "#15171a",
  loco: "#d5152b", locoRoof: "#4a4f55", frame: "#33363b" };
const DB = { body: "#e6e5df", roof: "#b4b9be", red: "#e3162b", door: "#eceae4" };
// DSB's mark: its initials in a ring, white in outline (the Vectron's) or
// white on a red disc (the IC4's doors).
const dsbRing = (c, x, y, r) => mark(c, x, y, `<circle cx="0" cy="0" r="${n(r)}" fill="none" stroke="#ffffff" stroke-width="${n(r * 0.16)}"/>` +
  `<text x="0" y="${n(r * 0.28)}" font-size="${n(r * 0.8)}" text-anchor="middle" font-weight="800" font-family="${FONT}" fill="#ffffff">DSB</text>`);
const dsbDisc = (x, y, r) => circle(x, y, r, DSB.red);

// ---------- IC3 and IR4: the rubber-fronted units ----------
// ABB Scandia's articulated trains: the cars share a truck at each joint,
// and each end is a flat front in a thick black rubber ring (the cab's desk
// swings aside and the rings press together when two units couple, making a
// way through). About 3.85 m tall. A narrow cab window and a single door
// right behind the rubber, another door at the car's far end, the windows
// between in one band.
//   IC3 (MF), diesel: three cars, 58.8 m (the end cars about 21.0 m, the
//     middle one 16.8 m).
//   IR4 (ER), electric: four cars, 76.53 m (the end cars about 21.0 m, the
//     two middle ones 17.25 m), a pantograph on the second car.
const RUB = { roof: 12.6, sill: 3.4 };
const NOSE_RUB = [[0.6, 3.4], [0.4, 4.4], [0.4, 11.4], ["q", 0.4, 12.6, 1.8, 12.6]];
// The rubber ring from the side: a black bulge the height of the front,
// standing a little proud of the roof and the floor; a lamp's edge low and
// high on its face.
const rubber = () => path(`M2.7 3.1L0.9 3.1Q0.1 3.1 0.1 3.9L0.1 11.7Q0.1 12.8 1.4 12.8L2.7 12.8Z`, DSB.black, 0.5) +
  lines([[2.1, 3.5, 2.1, 12.4]], "rgba(255,255,255,0.10)", 0.6) +
  rect(0.02, 5.3, 0.24, 0.45, "#fff4cf", 0, 'rx="0.1"') + rect(0.02, 11.3, 0.24, 0.4, "#fff4cf", 0, 'rx="0.1"');
const PAINT = {
  ic3: { body: DSB.white, rib: DSB.rib, band: DSB.band, roof: DSB.roof, skirt: DSB.skirt, door: DSB.white, gold: [10.2, 31.5] },
  ir4: { body: DSB.silver, rib: DSB.silverRib, band: DSB.gloss, roof: "#9aa1a8", skirt: DSB.silverSkirt, door: DSB.silverDoor, gold: [10.2, 22.0] },
};
function rubPaint(p, cab) {
  return (c, g) => {
    const L = g.L, ribs = [];
    for (let y = 4.45; y < 7.1; y += 0.42) ribs.push([-1, y, L + 1, y]);
    for (let y = 10.85; y < 11.75; y += 0.42) ribs.push([-1, y, L + 1, y]);
    return bands(L, [[0, 20, p.body], [11.75, 3, p.roof], [7.25, 3.3, p.band], [0, 4.05, p.skirt]]) + lines(ribs, p.rib, 0.5) +
      // The gold line over the windows next to the cab.
      (cab ? rect(p.gold[0], 11.0, p.gold[1] - p.gold[0], 0.2, DSB.gold) : "");
  };
}
const rubDoor = (x) => ({ x, w: 2.7, y0: RUB.sill, y1: 11.0, leaves: 1, glassY: 0.48, glassH: 0.4, grabs: true });
const rubRows = (from, k) => [{ xs: seq(from, 5.4, k), y: 7.55, w: 4.3, h: 2.7, r: 0.5 }];
function rubCab(c, kind) {
  const p = PAINT[kind], L = c.L, diesel = kind === "ic3";
  return unit(c, { roof: RUB.roof, sill: RUB.sill, nose: NOSE_RUB, rake: [[0.7, 8.0], [0.75, 11.3]], depth: 1.4, cabLen: 7, lampY: 5.5,
    rows: rubRows(10.4, 9), doors: [rubDoor(5.6), rubDoor(L - 9.3)], doorFill: () => p.door, trucks: [9.5, "end"], wheel: 33,
    paint: rubPaint(p, true), surround: DSB.black,
    // The cab's side window, in the band; the rubber front over it all.
    cab: () => win(3.0, 7.6, 1.9, 2.6, 0.3) + rubber(),
    extra: (cc, g) => hvac(20, RUB.roof, 12, 0.55) + hvac(42, RUB.roof, 9, 0.55) +
      (diesel ? exhaust(35, RUB.roof) + underframe(17, 34, RUB.sill, { depth: 1.5, boxes: 2, tanks: false }) + tank(36, 44, RUB.sill, 1.4)
        : underframe(17, 44, RUB.sill, { depth: 1.4, boxes: 3, tanks: true })) });
}
function rubMid(c, kind) {
  const p = PAINT[kind], L = c.L, diesel = kind === "ic3", pan = kind === "ir4" && c.index === 1;
  return unit(c, { roof: RUB.roof, sill: RUB.sill, rows: rubRows(4.2, 8), doors: [rubDoor(L - 7.3)], doorFill: () => p.door,
    trucks: ["start", "end"], paint: rubPaint(p, false),
    extra: (cc, g) => (pan ? pantograph(12, RUB.roof, { up: true, facing: -1 }) + hvLine(15.5, 24, RUB.roof) + hvac(30, RUB.roof, 10, 0.55)
      : hvac(g.L / 2 - 7, RUB.roof, 14, 0.55)) +
      (diesel ? exhaust(g.L / 2 + 9, RUB.roof) : "") + underframe(10, g.L - 10, RUB.sill, { depth: 1.4, boxes: 3, tanks: !diesel }) });
}

// ---------- IC4 ----------
// AnsaldoBreda's diesel train (MG): four articulated cars, about 86 m (the
// end cars about 23.5 m, the middle ones 19.5 m), sharing a truck at each
// joint; a long sloped nose with a deep raked windshield. The nose and the
// cab are dark blue from the waist up, back past the cab door to where the
// black window band begins; the valance under the nose and the sides are
// white, the roof and the skirt gray. Wide single plug doors, white, red
// either side of their glass and DSB's red disc low on them.
const IC4 = { roof: 13.4, sill: 3.4 };
const NOSE_IC4 = [[2.2, 2.6], [0.7, 3.6], ["q", 0.2, 5.0, 1.6, 6.6], [9.5, 11.7], ["q", 11.8, 13.4, 15.5, 13.4]];
const ic4Paint = (cab) => (c, g) => bands(g.L, [[0, 20, DSB.ic4White], [12.6, 3, DSB.ic4Roof], [0, 4.3, DSB.ic4Skirt]]) +
  rect(cab ? 20 : -1, 7.2, g.L + 2, 3.0, DSB.black) +
  (cab ? path("M-1 5.6L7 5.6Q12 5.8 14.5 7.2L22 7.2L22 10.2Q15 10.7 9.5 12.3L-1 12.3Z", DSB.navy) + path("M-1 2L4.6 2L4.6 4.3L-1 4.3Z", DSB.ic4White) : "");
const ic4Door = (x) => ({ x, w: 3.0, y0: IC4.sill, y1: 10.9, leaves: 1, glassY: 0.5, glassH: 0.42, grabs: false, fill: DSB.ic4White });
const ic4Trim = (x) => rect(x + 0.3, 7.0, 0.2, 3.5, DSB.red) + rect(x + 2.5, 7.0, 0.2, 3.5, DSB.red) + dsbDisc(x + 1.5, 5.2, 0.42);
const ic4Rows = (xs) => [{ xs, y: 7.45, w: 5.6, h: 2.5, r: 0.4 }];
const ic4Cab = (c) => unit(c, { roof: IC4.roof, sill: IC4.sill, nose: NOSE_IC4, rake: [[2.4, 7.3], [9.0, 11.5]], depth: 3.4, cabLen: 18, lampY: 5.3, bare: true,
  rows: ic4Rows([...seq(24, 6.2, 5), ...seq(61, 6.2, 2)]), trucks: [13, "end"], wheel: 33, paint: ic4Paint(true), surround: DSB.navy,
  // The cab door: blue above the waist, white below, as the paint under it.
  doors: [{ x: 17.6, w: 2.4, y0: IC4.sill, y1: 10.6, leaves: 1, glassY: 0.58, glassH: 0.3, grabs: true, fill: "rgba(0,0,0,0.04)" }, ic4Door(56)],
  extra: (cc, g) => ic4Trim(56) + hvac(28, IC4.roof, 12, 0.5) + hvac(46, IC4.roof, 8, 0.5) + exhaust(41.5, IC4.roof) +
    underframe(20, 40, IC4.sill, { depth: 1.5, boxes: 2, tanks: false }) + tank(42, 51, IC4.sill, 1.4) });
const ic4Mid = (c) => unit(c, { roof: IC4.roof, sill: IC4.sill, rows: ic4Rows(seq(9, 6.2, 8)), doors: [ic4Door(4)], trucks: ["start", "end"], paint: ic4Paint(false),
  extra: (cc, g) => ic4Trim(4) + hvac(g.L / 2 - 8, IC4.roof, 12, 0.5) + exhaust(g.L / 2 + 6, IC4.roof) +
    underframe(12, g.L - 22, IC4.sill, { depth: 1.5, boxes: 2, tanks: false }) + tank(g.L - 20, g.L - 12, IC4.sill, 1.4) });

// ---------- Vectron and coaches ----------
// Siemens Vectron (DSB's EB): 18.98 m over the buffers, Bo'Bo'; czechia's
// body, in DSB's paint as photographed (EB 3242): red from the frame to the
// roof and across the front, the roof and the top of each cab gray, the
// underframe dark; DSB's mark in white outline behind each cab, the number
// small in white low on the side.
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
const ebPaint = (c, L) => bands(L, [[0, 20, DSB.loco], [11.7, 3, DSB.locoRoof], [0, 5.0, DSB.frame]]) + path("M0 11.7L0 10.4L2.6 10.6L4.6 11.7Z", DSB.locoRoof);
const ebOver = (c, L) => dsbRing(c, 8.6, 8.3, 0.75) + dsbRing(c, L - 8.6, 8.3, 0.75) +
  letters(c, L / 2 + 3, 5.55, 0.5, "EB 3242", "#ffffff", { weight: 700, family: FONT }) +
  letters(c, L / 2 - 5, 4.4, 0.34, "SIEMENS", "#e9ebed", { weight: 700, family: FONT }) + letters(c, L / 2 + 9, 4.4, 0.34, "Vectron", "#e9ebed", { weight: 500, family: FONT });
const eb = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6,
  paint: ebPaint, over: ebOver, surround: DSB.black,
  grilles: [[-19.0, 10.0, 11.75, 12.6], [9.0, 10.0, 11.75, 12.6]], grilleFill: "rgba(20,22,25,0.3)" });

// The coach behind EB 3242 at Hamburg-Altona, one of DB's intercity cars:
// 26.4 m, a door at each end; light gray, a red stripe under the windows
// that stops at the doors, a silver-gray roof, each window in its own dark
// frame. The one photographed is first class, its 1 between the door and
// the first window; it is lettered on the first coach only.
function dbCoach(c) {
  const L = c.L, roof = 13.3, sill = 3.9, xs = [2.0, L - 4.6];
  return coachCar(c, { roof, sill, end: 0.6, endR: 1.2, base: DB.body, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: [{ a: 7.6, b: L - 7.6, y: 7.3, w: 4.6, h: 3.0, pitch: 6.45, r: 0.45 }],
    doors: xs.map((x) => ({ x, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 })),
    livery: () => bands(L, [[12.25, 3, DB.roof], [5.5, 0.65, DB.red]]) + xs.map((x) => rect(x, sill + 0.15, 2.6, 7.0, DB.door)).join(""),
    extra: (cc) => hvac(L / 2 - 7, roof, 14, 0.7) + rect(L / 2 - 3.5, sill - 1.9, 7, 0.75, C.steelDark, 0.4, 'rx="0.37"') +
      buffers(0, -1, { sill }) + buffers(L, 1, { sill }) +
      (cc.index === 1 ? letters(cc, 6.05, 9.1, 1.3, "1", "#55595e", { weight: 500, family: FONT }) + letters(cc, L - 6.05, 9.1, 1.3, "1", "#55595e", { weight: 500, family: FONT }) : "") });
}

// ---------- Tables ----------

export const TYPES = {
  dkIc3Cab: { name: "IC3 end car (MF)", kind: "emu", amenities: ["first"] },
  dkIc3Mid: { name: "IC3 intermediate car (FF)", kind: "emu" },
  dkIc4Cab: { name: "IC4 end car (MG)", kind: "emu" },
  dkIc4Mid: { name: "IC4 intermediate car", kind: "emu" },
  dkIr4Cab: { name: "IR4 end car (ER)", kind: "emu" },
  dkIr4Mid: { name: "IR4 intermediate car", kind: "emu", pan: true },
  dkEb: { name: "Siemens Vectron electric locomotive (EB)", kind: "electric", pan: true },
  dkDbCoach: { name: "Intercity coach (DB)", kind: "coach" },
};

const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const byIndex = (ctx) => ctx.index;
// Feet over the couplers (or the joint's center). IC3: 21.0 + 16.8 + 21.0 m
// = 58.8 m. IC4: 23.5 + 19.5 + 19.5 + 23.5 m = 86.0 m. IR4: 21.0 + 17.25 +
// 17.25 + 21.0 m = 76.5 m. The Vectron 18.98 m, the coach 26.4 m.
export const MODELS = {
  dkIc3Cab: M((c) => rubCab(c, "ic3"), 68.9, true),
  dkIc3Mid: M((c) => rubMid(c, "ic3"), 55.12),
  dkIc4Cab: M(ic4Cab, 77.1, true),
  dkIc4Mid: M(ic4Mid, 63.98),
  dkIr4Cab: M((c) => rubCab(c, "ir4"), 68.9, true),
  dkIr4Mid: M((c) => rubMid(c, "ir4"), 56.6, false, byIndex),
  dkEb: M(eb, 62.27),
  dkDbCoach: M(dbCoach, 86.6, false, byIndex),
};

const set = (label, ...units) => ({ label, units });
const IC3_UNITS = [["dkIc3Cab", 1], ["dkIc3Mid", 1], ["dkIc3Cab", 1]];
const IC4_UNITS = [["dkIc4Cab", 1], ["dkIc4Mid", 2], ["dkIc4Cab", 1]];
const IR4_UNITS = [["dkIr4Cab", 1], ["dkIr4Mid", 2], ["dkIr4Cab", 1]];
const IC3_SET = set("Usually an IC3: a three-car diesel unit (often two or three coupled)", ...IC3_UNITS);
const IC4_SET = set("Drawn as an IC4, a four-car diesel unit (many of these trains are IC3s)", ...IC4_UNITS);
const IR4_SET = set("Usually an IR4: a four-car electric unit (often two coupled)", ...IR4_UNITS);
const IC3_ZEALAND = set("Drawn as an IC3 diesel unit; many of this line's trains are a locomotive with double-deck coaches, which Trainsheet has not drawn yet", ...IC3_UNITS);
const VECTRON = (what) => set(`A red DSB Vectron locomotive and coaches${what}`, ["dkEb", 1], ["dkDbCoach", 6]);

// Where the wire reaches: the Coast Line from Helsingør, Copenhagen and its
// airport, and the main line west over Zealand and Funen to Fredericia, on
// to Esbjerg and south to Sønderborg. A regional train with both its ends
// there is drawn as the electric IR4 (Aalborg's airport is not among them).
const WIRED = /Helsingør|København|Østerport|CPH Lufthavn|Høje Taastrup|Roskilde|Ringsted|Slagelse|Korsør|Odense|Ejby|Fredericia|Kolding|Esbjerg|Sønderborg/;
const ZEALAND = /Kalundborg|Holbæk|Næstved|Nykøbing|Vordingborg|Køge|Haslev|Helsingør|København|Østerport|Roskilde|Ringsted/;

// The timetable names no unit, so each line is drawn as its usual train:
//   ECE (Copenhagen-Hamburg) and RJ (Copenhagen-Hamburg-Berlin-Prague):
//     the Vectron and coaches, as photographed at Hamburg-Altona;
//   ICL (InterCityLyn): the IC4; to Sønderborg, under the wire all the way
//     from Copenhagen, the IR4;
//   IC: the IC3;
//   RE: the IR4 where both ends are under the wire, the IC3 elsewhere.
//     Zealand's other regional trains are mostly locomotives with
//     double-deck coaches, which are not drawn: the IC3 stands in, and the
//     label says so.
export const TYPICAL = {
  dsb: (t) => {
    const r = String(t.route || t.line || "").trim().toUpperCase();
    const a = t.origin || "", b = t.destination || t.dest || "";
    if (r === "ECE") return VECTRON(" (drawn as DB's intercity cars)");
    if (r === "RJ") return VECTRON(" (drawn as DB's intercity cars; this train's own cars are not drawn yet)");
    if (r === "ICL") return /Sønderborg/.test(`${a} ${b}`) ? IR4_SET : IC4_SET;
    if (r === "RE") {
      if (a && b && WIRED.test(a) && WIRED.test(b)) return IR4_SET;
      return ZEALAND.test(a) || ZEALAND.test(b) ? IC3_ZEALAND : IC3_SET;
    }
    return IC3_SET;
  },
};

const WP = "https://en.wikipedia.org/wiki/";
const ic3 = { model: "IC3 (DSB class MF)", type: "Diesel multiple unit", builder: "ABB Scandia, Randers", fleet: "96 three-car sets",
  topSpeedMph: 112, powerHp: 1577, lengthFt: 192.9, source: `${WP}IC3` };
const ic4 = { model: "IC4 (DSB class MG)", type: "Diesel multiple unit", builder: "AnsaldoBreda", lengthFt: 282.2, source: `${WP}IC4` };
const ir4 = { model: "IR4 (DSB class ER)", type: "Electric multiple unit", builder: "ABB Scandia, Randers", fleet: "44 four-car sets",
  topSpeedMph: 112, lengthFt: 251.1, source: `${WP}IR4` };
export const FACTS = {
  dkIc3Cab: { ...ic3,
    about: "An end car of an IC3, the three-car diesel train that has carried most of DSB's InterCity traffic since 1989. Each end is a flat front in a thick black rubber ring: when two units couple, the cab's desk swings aside and the rings press together, so passengers can walk through the whole train." },
  dkIc3Mid: { ...ic3,
    about: "The middle car of an IC3. The three cars are articulated, sharing a truck at each joint; the four diesel engines are under the floors of the end cars." },
  dkIc4Cab: { ...ic4,
    about: "An end car of an IC4, the four-car diesel train DSB ordered from AnsaldoBreda in 2000 for its InterCity and InterCityLyn services. Delivery ran many years late, and the trains entered regular service only from 2007." },
  dkIc4Mid: { ...ic4,
    about: "An intermediate car of an IC4. The four cars are articulated, sharing a truck at each joint." },
  dkIr4Cab: { ...ir4,
    about: "An end car of an IR4, the four-car electric sister of the IC3, with the same rubber-ringed fronts; the two types can run coupled together. It works under Denmark's 25 kV wire." },
  dkIr4Mid: { ...ir4,
    about: "An intermediate car of an IR4; the pantograph is on the second car." },
  dkEb: { model: "Siemens Vectron (DSB class EB)", type: "Electric locomotive", builder: "Siemens Mobility", fleet: "42, EB 3201–3242",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 62.3, source: `${WP}Siemens_Vectron`,
    about: "DSB's red Vectrons, delivered from 2020, haul its locomotive-drawn trains, among them the international trains between Copenhagen and Hamburg." },
  dkDbCoach: { model: "Intercity coach", type: "Locomotive-hauled passenger coach", lengthFt: 86.6, source: `${WP}Intercity_(Deutsche_Bahn)`,
    about: "One of Deutsche Bahn's intercity coaches, as photographed behind a DSB Vectron at Hamburg-Altona: light gray with a red stripe under the windows." },
};
