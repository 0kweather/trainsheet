// S-tog's cars (scripts/railroads/denmark.py): DSB's Copenhagen S-trains,
// lines A, B, Bx, C, E, F and H, run by the fourth generation's eight-car
// set, Litra SA. The timetable names no unit, so every train is drawn as one
// SA set, labeled as typical. Trainsheet's own side views at the shared
// scale (js/carart.js), in S-tog's red, lettered here (no logo files).
//
// The paint is checked against a photograph of SA 8150 on line A at
// Nordhavn: the red body, the black mask round the windshield with the line
// letter and the S roundel at its top, the lamps and DSB's red hexagon at
// its foot, "SA" and the number in white under it, the black apron with its
// gray steps round the coupler, the dark windows along the side and the dark
// roof. That photograph shows the front and little of the side: the doors
// (one double door a car, read from the "8 doors" DSB's figures give a set),
// the windows' spacing, each car's length and the wheels' size are
// Trainsheet's reading, and a side view shows the front's marks on the turn
// of the nose. The four-car Litra SE has no drawing here, and nor do the
// sets that are to replace the fleet: no usable photograph of either.

import { C, rect, circle, path, line, lines, pantograph, underframe } from "../carart.js?v=dev";
import { bilevel } from "../carmodels.js?v=dev";
import { letters, mark } from "./czechia.cars.js?v=dev";

const n = (v) => Math.round(v * 100) / 100;
const seq = (from, pitch, k) => Array.from({ length: k }, (_, i) => from + i * pitch);
const bands = (L, list) => list.map(([y, h, fill]) => rect(-1, y, L + 2, h, fill)).join("");
// k windows of width w at the given pitch, centered between a and b.
const spread = (a, b, w, pitch) => {
  const k = Math.max(0, Math.floor((b - a - w) / pitch) + 1);
  return seq(a + (b - a - ((k - 1) * pitch + w)) / 2, pitch, k);
};

// ---------- Paint ----------
// Red all over, doors too; the windows dark in the red; a dark roof and a
// black underside. The front: a black mask from the waist to the roof round
// the windshield, the black apron below.
const ST = { red: "#b9202b", deep: "#9c1a24", roof: "#3a3d42", skirt: "#1b1d20", mask: "#15171a", sign: "#4a525b", lit: "#e9e4d2", hex: "#d2202c" };
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const LINES = new Set(["A", "B", "Bx", "C", "E", "F", "H"]);

// ---------- Litra SA ----------
// Eight short cars, 83.78 m together, 4.3 m tall and 3.52 m wide, the floor
// 1.1 m over the rail: SA-SB-SC-SD-SD-SC-SB-SA. Single axles, not trucks:
// two under each end car, one under every other car at its end away from
// the nearer cab, the other end carried by its neighbor
// (A'A'+A'+1'+A'+A'+1'+A'+A'A'). The SA has the cab, the SB the pantograph
// (1,650 V dc overhead), the SD the traction equipment. The cars' own
// lengths aren't published: here the six between are 10.06 m and the two
// end cars 11.72 m, which makes the set's 83.78 m.
const S = { roof: 14.1, sill: 3.0, floor: 3.6, end: 38.44, mid: 33.0 };
// The front: near upright to the waist, leaning back a little above it, and
// rounded into the roof.
const NOSE = [[1.3, 3.0], [0.8, 4.2], [0.75, 6.0], [2.0, 12.4], ["q", 2.4, 14.1, 5.0, 14.1]];
const noseAt = (y) => 0.75 + ((y - 6.0) * 1.25) / 6.4;

// One axle under the floor at cx: the wheel, its axle box and the spring
// over it.
function axle(cx, d = 33) {
  const r = d / 24;
  return circle(cx, r, r, "currentColor") + circle(cx, r, r * 0.82, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
    circle(cx, r, r * 0.26, C.steelDark) + rect(cx - 2.0, r + 0.2, 4.0, 0.55, "currentColor", 0, 'rx="0.15"') +
    rect(cx - 0.55, r - 0.45, 1.1, 0.9, C.steelDark, 0, 'rx="0.14"') + rect(cx - 0.5, r + 0.75, 1.0, Math.max(0, S.sill - r - 0.75), "currentColor", 0, 'opacity="0.7"');
}
const boxes = (a, b, k = 2) => underframe(a, b, S.sill, { depth: 1.1, boxes: k, tanks: false });
const door = (x) => ({ x, w: 4.6, y0: S.floor, y1: 11.1, leaves: 2, glassY: 0.5, glassH: 0.43, grabs: false, fill: ST.red });
const WIN = { y: 7.5, w: 4.5, h: 3.3, r: 0.45 };
const row = (xs) => ({ xs, ...WIN });
const sidePaint = (c, g) => bands(g.L, [[0, 20, ST.red], [13.0, 3, ST.roof], [0, 3.45, ST.skirt]]);
// The roof's low housings along a car, clear of anything at its middle.
const roofGear = (L, a = 3) => rect(a, S.roof - 0.05, L / 2 - a - 4.5, 0.4, C.steelDark, 0.4, 'rx="0.2"') + rect(L / 2 + 4.5, S.roof - 0.05, L / 2 - 7.5, 0.4, C.steelDark, 0.4, 'rx="0.2"');

function car(c, o) {
  return bilevel(o.cab ? { ...c, cabL: true, cabR: false } : { ...c, cabL: false, cabR: false }, {
    roof: S.roof, sill: S.sill, cornerR: 1.0, end: 0.6, noTrucks: true, badge: false, nose: o.cab ? NOSE : null, cabLen: 0,
    diaphragm: [3.7, 12.6], rows: o.rows, doors: o.doors, paint: o.paint || sidePaint, extra: o.extra });
}

// The front's marks, on the turn of the nose: in the mask's top the line's
// letter in its sign and the white S in its red roundel; the windshield and
// its wiper; at the mask's foot a white lamp and a red one and DSB's red
// hexagon; "SA" in white under the mask.
const hexagon = (r) => `M${[0, 1, 2, 3, 4, 5].map((k) => `${n(r * Math.cos((Math.PI * k) / 3))} ${n(r * Math.sin((Math.PI * k) / 3))}`).join("L")}Z`;
function front(c) {
  const letter = LINES.has(c.route) ? c.route : "";
  let s = path(`M${n(noseAt(7.0) + 0.3)} 7.0L${n(noseAt(11.3) + 0.3)} 11.3L${n(noseAt(11.3) + 2.3)} 11.3L${n(noseAt(7.0) + 2.3)} 7.0Z`, C.glassLight) +
    line(noseAt(7.0) + 0.6, 7.1, noseAt(9.4) + 1.3, 9.4, "#0b0c0e", 0.8) +
    rect(2.15, 11.8, 1.15, 1.0, ST.sign, 0, 'rx="0.08"') +
    (letter ? letters(c, 2.72, 12.3, letter.length > 1 ? 0.62 : 0.85, letter, ST.lit, { weight: 700, family: SANS }) : "") +
    circle(3.9, 12.3, 0.43, ST.hex) + letters(c, 3.9, 12.3, 0.62, "S", "#ffffff", { weight: 800, family: SANS }) +
    rect(0.88, 5.95, 0.36, 0.5, "#f4f1e4", 0.3, 'rx="0.14"') + rect(1.34, 5.95, 0.36, 0.5, "#e0444a", 0.3, 'rx="0.14"') +
    mark(c, 2.7, 6.2, `<path d="${hexagon(0.78)}" fill="${ST.hex}"/>` +
      `<text y="0.17" font-size="0.5" text-anchor="middle" font-weight="800" font-family="${SANS}" fill="#ffffff">DSB</text>`) +
    letters(c, 2.5, 4.3, 0.42, "SA", "#ffffff", { weight: 700, spacing: "0.04em", family: SANS });
  // The black apron under the nose with its gray steps; the Scharfenberg
  // coupler in its recess, when nothing is coupled ahead.
  s += rect(1.3, 1.75, 4.6, 1.3, ST.skirt, 0, 'rx="0.2"') + rect(1.5, 2.25, 2.4, 0.5, "#6d737a", 0, 'rx="0.08"') +
    lines([[1.5, 2.42, 3.9, 2.42], [1.5, 2.58, 3.9, 2.58]], "rgba(0,0,0,0.45)", 0.4);
  if (!c.coupledL) s += rect(0.3, 2.45, 1.4, 0.5, "currentColor", 0, 'opacity="0.9"') + rect(0.1, 2.2, 0.42, 1.0, C.steelDark, 0.4, 'rx="0.14"');
  return s;
}

// SA: the cab, a side window behind it, and the car's door between its
// windows; an axle behind the cab and one at the inner end.
function endCar(c) {
  const L = c.L;
  return car(c, { cab: true, rows: [{ xs: [6.3], y: 7.7, w: 2.6, h: 2.9, r: 0.35 }, row(spread(10.6, 18.6, WIN.w, 5.3)), row(spread(24.4, L - 1.8, WIN.w, 5.3))],
    doors: [door(19.2)],
    paint: (cc, g) => sidePaint(cc, g) + path("M-1 5.0L3.7 5.0L4.75 13.3L-1 13.3Z", ST.mask),
    extra: (cc, g) => axle(8.2) + axle(g.L - 3.4) + boxes(13, g.L - 8) + roofGear(g.L, 7) + front(cc) });
}
// The cars between: the door at the middle, two windows either side, one
// axle at the end away from the nearer cab. o.pan: the SB's pantograph.
function midCar(c, o = {}) {
  const L = c.L, fore = c.index < c.count / 2;
  return car(c, { rows: [row(spread(1.6, L / 2 - 2.9, WIN.w, 5.3)), row(spread(L / 2 + 2.9, L - 1.6, WIN.w, 5.3))], doors: [door(L / 2 - 2.3)],
    extra: (cc, g) => axle(fore ? g.L - 3.4 : 3.4) + (fore ? boxes(4, g.L - 8) : boxes(8, g.L - 4)) + roofGear(g.L) +
      (o.pan ? pantograph(g.L / 2, S.roof, { up: true, facing: fore ? -1 : 1 }) : "") });
}

// ---------- Tables ----------

export const TYPES = {
  stogSA: { name: "Litra SA driving motor car", kind: "emu" },
  stogSB: { name: "Litra SB motor car with pantograph", kind: "emu", pan: true },
  stogSC: { name: "Litra SC intermediate car", kind: "emu" },
  stogSD: { name: "Litra SD motor car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
// The front shows the line's letter, and a car's axle is at its end away
// from the nearer cab: a drawing for each line and each half of the train.
const half = (ctx) => (ctx.index < ctx.count / 2 ? "fore" : "aft");
// Feet: 11.72 m and 10.06 m (see above); the eight together 83.78 m.
export const MODELS = {
  stogSA: M(endCar, S.end, true, (ctx) => ctx.route || ""),
  stogSB: M((c) => midCar(c, { pan: true }), S.mid, false, half),
  stogSC: M((c) => midCar(c), S.mid, false, half),
  stogSD: M((c) => midCar(c), S.mid, false, half),
};

const set = (label, ...units) => ({ label, units });
const SA_SET = set("Typical S-tog train: a Litra SA set, eight short cars on single axles",
  ["stogSA", 1], ["stogSB", 1], ["stogSC", 1], ["stogSD", 2], ["stogSC", 1], ["stogSB", 1], ["stogSA", 1]);

// The timetable names no unit. Every line is drawn as one SA set: they are
// most of the fleet (104 of them to 31 four-car SE sets).
export const TYPICAL = {
  stog: () => SA_SET,
};

const LITRA_SA = "https://da.wikipedia.org/wiki/Litra_SA";
const STRAIN = "https://en.wikipedia.org/wiki/S-train_(Copenhagen)";
const sa = { model: "DSB Litra SA (fourth-generation S-tog)", type: "Electric multiple unit", builder: "Alstom LHB and Siemens (Salzgitter)", built: "1996–2006",
  fleet: "104 eight-car sets in service (105 built)", topSpeedMph: 75, powerHp: 2300, seats: 312 };
export const FACTS = {
  stogSA: { ...sa, lengthFt: 274.9, source: LITRA_SA,
    about: "The driving car at each end of an SA set, with the cab and the flexible space for bicycles. The fourth generation of Copenhagen's S-trains, in service since 1996: eight short, wide cars (3.52 m) on single axles, two under each end car and one under each of the others; 312 seats and 28 folding ones. Up to 120 km/h, 80 on the Ring Line." },
  stogSB: { ...sa, source: LITRA_SA,
    about: "The second car from each end, a motor car carrying the set's pantograph: the S-trains draw 1,650 V dc from the overhead wire. Like every car but the end ones it has a single axle, its other end resting on its neighbor." },
  stogSC: { ...sa, source: LITRA_SA,
    about: "The unpowered intermediate car, third from each end. The set's eight traction motors drive the axles of the other cars." },
  stogSD: { ...sa, source: STRAIN,
    about: "The two cars at the middle of the set, motor cars carrying the traction equipment (the inverters)." },
};
