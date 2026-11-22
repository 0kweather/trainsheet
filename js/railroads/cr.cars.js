// China Railway's cars (scripts/railroads/china.py, "cr": the conventional
// trains, Z direct expresses, T expresses, K fast trains and the numbered
// ones): an HXD3D "Hexie" electric locomotive (CRRC Dalian) and the two
// families of coach behind it, the 160 km/h 25T and the 120-140 km/h 25G,
// as hard seats, hard sleepers, soft sleepers, dining cars and the 25G's
// generator car. 12306's timetable names no car, so a train is drawn as the
// set that usually runs its kind, labeled as typical. Trainsheet's own side
// views from published dimensions and photographs, at the shared scale
// (js/carart.js), in China Railway's paint, lettered here (no logo files).
// Bodies and parts from czechia.cars.js.

import { C, rect, path, line, lines, poly, truck, slats, underframe } from "../carart.js?v=dev";
import { unit, twinEnded, letters, hvac, hvLine, exhaust } from "./czechia.cars.js?v=dev";
import { pantograph } from "../carart.js?v=dev";

const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
const boxes = (a, b, top, k = 3, depth = 1.3) => underframe(a, b, top, { depth, boxes: k, tanks: false });
// The locomotive's name is brushed on in a kai (regular script) hand; the
// coaches' class names are in a plain hei (sans) one.
const KAI = "'Kaiti SC', STKaiti, KaiTi, 'Noto Serif CJK SC', 'Noto Sans CJK SC', 'PingFang SC', 'Microsoft YaHei', serif";
const HEI = "'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', 'Heiti SC', SimHei, 'Helvetica Neue', Arial, sans-serif";

// ---------- Paint ----------
// From photographs (Wikimedia Commons, fetched November 2026).
// HXD3D: bright red, the roof's edge a row of red louvers; a dark maroon
// mask over the cab, from under the windshield back and up to the roof
// behind the cab door; charcoal along the frame; a yellow plow striped
// black; 和谐 ("Hexie", harmony) large in white on the side with the class
// beside it, HXD3D with its D small and low.
// The coaches: since 2014 every conventional coach, 25T and 25G alike, is
// repainted in one scheme, a dark olive green with yellow lines (the 25T
// was blue and white before, the 25G red and orange): a fine yellow line
// over the windows, a broad one under them, a fine one along the bottom of
// the side; a gray roof. Low on the side in yellow, the car's class in
// Chinese and its type code (YZ hard seat, YW hard sleeper, RW soft
// sleeper, CA dining, KD generator) with the family small after it; a white
// destination board hangs under the middle windows.
const CR = { red: "#c9142b", maroon: "#55232c", frame: "#3a3d42", plow: "#e9bb12", white: "#f4f4f2",
  green: "#2c4a3b", deep: "#233c30", yellow: "#f1c40f", roof: "#7d858a", under: "#26282b", board: "#f3f3ee" };

// ---------- HXD3D ----------
// CRRC Dalian's six-axle passenger locomotive, 2012 on: Co'Co', 22,989 mm
// over the couplers, 3,100 mm wide, 4,100 mm tall with the pantographs
// down; trucks of 4,350 mm wheelbase (2,250 + 2,100 mm) about 11.6 m
// apart; 1,250 mm wheels; 126 t; 7,200 kW; 160 km/h (Wikipedia, "China
// Railways HXD3D", whose table gives 7,500 kW; the builder gives 7,200). A
// cab at each end with a raked windshield over a blunt nose, a cab door
// behind each; knuckle couplers, no buffers.
const HXD = { roof: 13.0, sill: 4.1, L: 75.4, centers: 38.0 };
const NOSE_HXD = [[1.5, 4.1], [1.25, 7.0], ["q", 1.3, 8.3, 2.2, 9.0], [4.5, 12.3], ["q", 5.0, 13.0, 6.4, 13.0]];
function hxdPaint(c, g) {
  let s = bands(g.L, [[0, 20, CR.red], [0, 5.05, CR.frame], [5.05, 0.12, "#8f0e1f"]]);
  // The cab's maroon mask: under the windshield, then up and back to the
  // roof behind the cab door.
  s += path("M-1 8.55L3.4 8.55Q9.5 8.9 14.0 10.6Q18.5 12.3 23.0 13.2L-1 13.2Z", CR.maroon);
  return s;
}
function hxdHalf(h) {
  const { roof, sill } = HXD;
  return unit(h, { roof, sill, nose: NOSE_HXD, rake: [[2.2, 9.0], [4.4, 12.2]], depth: 2.0, cabLen: 0, bare: true, lampY: 6.2, surround: "#2a1418",
    paint: hxdPaint,
    // The cab's side window and its door, in the mask.
    rows: [{ xs: [5.4], y: 9.2, w: 1.7, h: 2.3, r: 0.3 }],
    doors: [{ x: 8.1, w: 1.9, y0: sill + 0.55, y1: roof - 1.5, leaves: 1, glassY: 0.62, glassH: 0.25, grabs: false, fill: "rgba(0,0,0,0.07)" }],
    extra: () =>
      // Grab rails either side of the door, the steps under it.
      line(7.8, sill + 1.1, 7.8, roof - 3.0, "#d9dcdf", 0.6) + line(10.3, sill + 1.1, 10.3, roof - 3.0, "#d9dcdf", 0.6) +
      rect(8.0, sill - 0.65, 2.1, 0.22, "currentColor") + rect(8.0, sill - 1.35, 2.1, 0.22, "currentColor") +
      // The headlamp over the windshield and the marker lamps' cluster low
      // on the nose; the number in white under the side window.
      rect(4.35, 12.45, 0.55, 0.4, "#fff4cf", 0.35, 'rx="0.15"') + rect(1.3, 5.3, 0.35, 0.95, "#e9ecef", 0.3, 'rx="0.12"') +
      // The plow, yellow striped black, and the knuckle coupler over it.
      path(poly([[1.35, 2.55], [5.4, 2.55], [5.0, 0.75], [2.0, 0.6], [1.2, 1.45]]), CR.plow, 0.4) +
      [2.1, 3.1, 4.1].map((x) => path(poly([[x, 2.5], [x + 0.45, 2.5], [x + 0.05, 0.8], [x - 0.4, 0.8]]), "#1c1d1f")).join("") +
      rect(0.35, 2.55, 1.4, 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0, 2.25, 0.45, 1.2, "currentColor", 0, 'rx="0.12"'),
  });
}
function hxd3d(c) {
  const L = c.L, { roof, sill, centers } = HXD;
  let s = twinEnded(c, hxdHalf);
  // The roof's edge between the cabs: a row of louvered panels, red.
  s += rect(23.2, 11.25, L - 46.4, 1.4, "rgba(0,0,0,0.13)", 0.4) + slats(23.2, 11.25, L - 46.4, 1.4, 0.28, "rgba(0,0,0,0.2)") +
    lines(seq(23.2 + (L - 46.4) / 8, (L - 46.4) / 8, 7).map((x) => [x, 11.25, x, 12.65]), "rgba(0,0,0,0.45)", 0.5);
  // Three-axle trucks; between them the transformer and the air tanks.
  for (const k of [-1, 1]) s += truck(L / 2 + k * centers / 2, { wb: 14.3, d: 49, kind: "loco", top: sill, axles: 3 });
  s += underframe(L / 2 - 8.6, L / 2 + 8.6, sill, { depth: 1.9, boxes: 2, tanks: true });
  // The pantographs, one at each end of the roof, the rear one up; the
  // roof's high-voltage gear between.
  s += pantograph(L * 0.25, roof + 0.4, { up: false }) + pantograph(L * 0.75, roof + 0.4, { up: true, facing: -1 }) +
    rect(L / 2 - 9, roof - 0.05, 18, 0.5, C.steelDark, 0.4, 'rx="0.2"') + hvLine(L * 0.25 + 3.2, L / 2 - 1.0, roof + 0.45) + hvLine(L * 0.75 - 3.2, L / 2 + 1.0, roof + 0.45);
  // 和谐 in white, large, with the class beside it; the class again, small,
  // under each cab's side window.
  s += letters(c, L / 2 - 4.6, 8.0, 2.5, "和谐", CR.white, { weight: 600, family: KAI, spacing: "0.08em" }) +
    letters(c, L / 2 + 3.6, 7.45, 1.15, 'HX<tspan font-size="0.62em" dy="0.22em">D</tspan><tspan dy="-0.14em">3D</tspan>', CR.white, { weight: 500, family: KAI }) +
    [6.3, L - 6.3].map((x) => letters(c, x, 7.9, 0.5, "HXD3D", CR.white, { weight: 600 })).join("");
  return s;
}

// ---------- 25T and 25G coaches ----------
// Both families share a body: 25,500 mm long (26,576 mm over the couplers),
// 3,105 mm wide, 4,433 mm tall, on two trucks 18,000 mm apart with a
// 2,400-2,500 mm wheelbase and 915 mm wheels; knuckle couplers and
// rubber gangways. The 25G (1992 on; 120 km/h, later batches 140) has
// folding doors set in at its ends and one air-conditioning unit sunk into
// the roof at one end; the 25T (2003 on, for the sixth speed-up; 160 km/h)
// has flush plug doors, two roof units and its underfloor gear behind
// covers. Hard seat (YZ): 118 seats, 2+3, at a dozen windows. Hard sleeper
// (YW): 66 berths in eleven open bays of six, a window to a bay. Soft
// sleeper (RW): 36 berths in nine four-berth compartments, wider windows;
// the 25T's has its doors at one end only (as photographed). Dining car
// (CA): the saloon's big windows at one end, the kitchen's small high ones
// and its service door at the other. Generator car (KD, 25G sets fed at
// 380 V): diesel sets behind louvers, exhausts on the roof.
const COACH = { roof: 14.5, sill: 3.95, L: 87.2, centers: 59.05 };
const KINDS = {
  yz: { code: "YZ", zh: "硬座车", small: [7.2, 78.6], xs: seq(11.2, 5.6, 12), w: 3.3 },
  yw: { code: "YW", zh: "硬卧车", small: [6.6, 9.6, 79.2], xs: seq(13.6, 5.9, 11), w: 3.2 },
  rw: { code: "RW", zh: "软卧车", small: [6.6, 9.6, 79.2], xs: seq(15.4, 6.56, 9), w: 4.1 },
  ca: { code: "CA", zh: "餐车", small: [], xs: seq(8.0, 6.3, 6), w: 4.4 },
  kd: { code: "KD", zh: "发电车", small: [], xs: [9.0, 15.2, 70.0], w: 3.0 },
};
const coachPaint = (c, g) => bands(g.L, [[0, 20, CR.green], [13.25, 3, CR.roof], [12.3, 0.14, CR.yellow], [6.85, 0.42, CR.yellow], [4.55, 0.12, CR.yellow]]);
// A door at the end of the side: the 25G's folds in, set back in its
// opening; the 25T's is a flush plug door.
const endDoor = (x, t) => ({ x, w: 2.6, y0: COACH.sill + 0.1, y1: 11.3, leaves: 1, glassY: 0.52, glassH: 0.32, grabs: !t, fill: t ? CR.green : CR.deep });
// The yellow lettering low on the side: the class in Chinese, then its
// code with the family small after it; and the white destination board.
const coachName = (c, x, kind, t) => letters(c, x, 5.75, 0.72, KINDS[kind].zh, CR.yellow, { weight: 500, family: HEI }) +
  letters(c, x + 5.6, 5.75, 0.72, `${KINDS[kind].code}<tspan font-size="0.6em" dy="0.2em">${t ? "25T" : "25G"}</tspan>`, CR.yellow, { weight: 600 });
const board = (x) => rect(x - 1.9, 5.35, 3.8, 0.85, CR.board, 0.4) + rect(x - 1.6, 5.7, 3.2, 0.14, "#b3242c");
function coach(c, kind, t) {
  const L = c.L, { roof, sill, centers } = COACH, k = KINDS[kind];
  // Passenger doors: both ends, but the 25T soft sleeper's at one end only;
  // the dining car has only its kitchen's door, the generator car its
  // crew's.
  const doors = kind === "ca" ? [{ ...endDoor(L - 16.5, t), w: 2.3, grabs: false }] : kind === "kd" ? [endDoor(2.0, false)]
    : kind === "rw" && t ? [endDoor(L - 4.6, t)] : [endDoor(2.0, t), endDoor(L - 4.6, t)];
  const rows = [{ xs: k.xs, y: 8.0, w: k.w, h: 3.2, r: 0.35 }];
  // Small panes: the washrooms' and toilets' at the ends, frosted; the
  // kitchen's, high in the side.
  if (k.small.length) rows.push({ xs: k.small, y: 8.9, w: 1.6, h: 2.3, r: 0.3 });
  if (kind === "ca") rows.push({ xs: [50.5, 56.5, 62.5, 76.0], y: 9.3, w: 3.0, h: 1.9, r: 0.3 });
  return unit(c, { roof, sill, rows, doors, diaphragm: [sill + 0.3, 12.6], paint: coachPaint,
    extra: (cc, g) => {
      let s = truck(L / 2 - centers / 2, { wb: 7.9, d: 36, top: sill }) + truck(L / 2 + centers / 2, { wb: 7.9, d: 36, top: sill });
      if (kind === "kd") {
        // The engine room's louvers, the radiators' at the roof's edge, the
        // exhausts over them; fuel tanks under the floor.
        for (const x of [23.0, 36.5, 50.0]) s += rect(x, 7.6, 10.0, 3.9, "rgba(15,18,16,0.5)", 0.4) + slats(x, 7.6, 10.0, 3.9, 0.3, "rgba(255,255,255,0.14)");
        s += exhaust(27, roof) + exhaust(40.5, roof) + exhaust(54, roof) + hvac(64, roof, 8, 0.6) + underframe(22, L - 22, sill, { depth: 1.7, boxes: 1, tanks: true });
      } else if (t) {
        // 25T: two roof units; the underfloor gear behind covers.
        s += hvac(9, roof, 10, 0.6) + hvac(L - 19, roof, 10, 0.6) + rect(21.5, sill - 1.75, L - 43, 1.8, CR.under, 0.4, 'rx="0.2"') +
          lines(seq(26, 5.2, 7).map((x) => [x, sill - 1.6, x, sill - 0.1]), "rgba(255,255,255,0.14)", 0.4);
      } else {
        // 25G: one unit sunk into the roof at one end, vents along the rest;
        // battery and brake boxes and the water tank under the floor.
        s += hvac(L - 20.5, roof, 12, 0.5) + [16, 30, 44].map((x) => path(`M${x - 1.1} ${roof - 0.05}Q${x} ${roof + 0.6} ${x + 1.1} ${roof - 0.05}Z`, C.steelDark, 0.4)).join("") +
          boxes(22, L - 22, sill, 4, 1.35) + rect(L / 2 - 3.5, sill - 1.9, 7, 0.7, C.steelDark, 0.4, 'rx="0.35"');
      }
      // The dining car's kitchen has a chimney over its range.
      if (kind === "ca") s += rect(68, roof - 0.05, 1.2, 0.8, C.steelDark, 0.4, 'rx="0.2"');
      return s + coachName(cc, kind === "ca" ? 54 : 17.5, kind, t) + (kind === "kd" ? "" : board(L / 2 + (kind === "ca" ? -16 : 0.9)));
    } });
}

// ---------- Tables ----------

export const TYPES = {
  crHxd3d: { name: "HXD3D Hexie electric locomotive", kind: "electric", pan: true },
  crYz25t: { name: "25T hard seat car (YZ)", kind: "coach" },
  crYw25t: { name: "25T hard sleeper (YW)", kind: "coach", amenities: ["sleepers"] },
  crRw25t: { name: "25T soft sleeper (RW)", kind: "coach", amenities: ["sleepers"] },
  crCa25t: { name: "25T dining car (CA)", kind: "coach", amenities: ["dining"] },
  crYz25g: { name: "25G hard seat car (YZ)", kind: "coach" },
  crYw25g: { name: "25G hard sleeper (YW)", kind: "coach", amenities: ["sleepers"] },
  crRw25g: { name: "25G soft sleeper (RW)", kind: "coach", amenities: ["sleepers"] },
  crCa25g: { name: "25G dining car (CA)", kind: "coach", amenities: ["dining"] },
  crKd25g: { name: "25G generator car (KD)", kind: "coach" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  crHxd3d: M(hxd3d, HXD.L),
  crYz25t: M((c) => coach(c, "yz", true), COACH.L),
  crYw25t: M((c) => coach(c, "yw", true), COACH.L),
  crRw25t: M((c) => coach(c, "rw", true), COACH.L),
  crCa25t: M((c) => coach(c, "ca", true), COACH.L),
  crYz25g: M((c) => coach(c, "yz", false), COACH.L),
  crYw25g: M((c) => coach(c, "yw", false), COACH.L),
  crRw25g: M((c) => coach(c, "rw", false), COACH.L),
  crCa25g: M((c) => coach(c, "ca", false), COACH.L),
  crKd25g: M((c) => coach(c, "kd", false), COACH.L),
};

// 12306 names no locomotive or car; nothing to look up by number.
export const FLEETS = {
  cr: [],
};

const set = (label, ...units) => ({ label, units });
const Z25T = set("HXD3D and 25T coaches: hard seats, the dining car, soft sleepers, then hard sleepers",
  ["crHxd3d", 1], ["crYz25t", 4], ["crCa25t", 1], ["crRw25t", 2], ["crYw25t", 9]);
const K25G = set("HXD3D and 25G coaches: the generator car, hard seats, the dining car, a soft sleeper, then hard sleepers",
  ["crHxd3d", 1], ["crKd25g", 1], ["crYz25g", 6], ["crCa25g", 1], ["crRw25g", 1], ["crYw25g", 8]);
const PLAIN25G = set("HXD3D and 25G coaches: hard seats and hard sleepers",
  ["crHxd3d", 1], ["crYz25g", 8], ["crYw25g", 4]);
const BY_MODEL = { crYz25t: Z25T, crYw25t: Z25T, crRw25t: Z25T, crCa25t: Z25T, crYz25g: K25G, crYw25g: K25G, crRw25g: K25G, crCa25g: K25G, crKd25g: K25G };

// By the reported car; else by the train's kind, which its number's letter
// tells (china.py's lines): the Z direct expresses and T expresses, 160
// and 140 km/h, are mostly 25T sets; the K fast trains 25G sets with a
// dining car and a soft sleeper; the numbered trains, the slowest, plainer
// 25G sets of seats and hard sleepers. The label says "usually": formations
// differ train by train, and many lines' trains are hauled by other
// classes (HXD1D, SS8, SS9, diesels off the wires).
export const TYPICAL = {
  cr: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const letter = String(t.number || "").trim().charAt(0).toUpperCase(), kind = String(t.line || "");
    if (letter === "Z" || letter === "T" || /express/i.test(kind)) return Z25T;
    if (letter === "K" || /fast/i.test(kind)) return K25G;
    return PLAIN25G;
  },
};

const HXD3D = "https://en.wikipedia.org/wiki/China_Railways_HXD3D";
const COACHES = "https://en.wikipedia.org/wiki/Passenger_rail_transport_in_China";
const t25 = { model: "25T coach", type: "Passenger coach", builder: "CRRC Changchun, Tangshan, Qingdao Sifang and Nanjing Puzhen", built: "Since 2003", topSpeedMph: 99, lengthFt: 87.2, source: COACHES };
const g25 = { model: "25G coach", type: "Passenger coach", builder: "CRRC Changchun, Tangshan, Qingdao Sifang and Nanjing Puzhen", built: "Since 1992", topSpeedMph: 75, lengthFt: 87.2, source: COACHES };
export const FACTS = {
  crHxd3d: { model: "HXD3D Hexie", type: "Electric locomotive", builder: "CRRC Dalian", built: "Since 2012", fleet: "More than 500", topSpeedMph: 99, powerHp: 9655, lengthFt: 75.4, source: HXD3D,
    about: "China Railway's standard six-axle passenger electric: 7,200 kW, 126 tonnes, 160 km/h, supplying the train's power at 600 V DC. Red, with 和谐 (Hexie, harmony) in white on its side. Trainsheet draws it on every conventional train; many are hauled by other classes, and by diesels where there are no wires." },
  crYz25t: { ...t25, seats: 118, about: "Hard seat (硬座), the cheapest class: 118 seats, three and two across an aisle. The 25T was built for the 2004 speed-up to 160 km/h and works most Z and T trains; blue and white when new, since repainted in the olive green and yellow that all conventional coaches now wear." },
  crYw25t: { ...t25, seats: 66, about: "Hard sleeper (硬卧): 66 berths in eleven open bays of six, three tiers a side, with a corridor along one side of the car." },
  crRw25t: { ...t25, seats: 36, about: "Soft sleeper (软卧): 36 berths in nine closed compartments of four." },
  crCa25t: { ...t25, about: "The dining car (餐车): a saloon of tables at one end, the kitchen at the other, usually marshalled between the seats and the sleepers." },
  crYz25g: { ...g25, seats: 118, about: "Hard seat (硬座): 118 seats, three and two across an aisle. The 25G, built from 1992, is the most numerous air-conditioned coach in China and works most K and numbered trains at 120 km/h (later batches 140); once red and orange, now olive green with yellow lines." },
  crYw25g: { ...g25, seats: 66, about: "Hard sleeper (硬卧): 66 berths in eleven open bays of six, the staple of China's overnight trains." },
  crRw25g: { ...g25, seats: 36, about: "Soft sleeper (软卧): 36 berths in nine closed compartments of four." },
  crCa25g: { ...g25, about: "The dining car (餐车): a saloon of tables at one end, the kitchen at the other." },
  crKd25g: { ...g25, model: "25G generator car", type: "Generator car", about: "A generator car (发电车): diesel sets supplying the train's lighting and air conditioning at 380 V, at the head of 25G sets that aren't fed from the locomotive." },
};
