// Czechia's railroads' cars (scripts/railroads/czechia.py): České dráhy,
// RegioJet, Leo Express, Arriva and GW Train Regio. The feed names no car or
// unit (a train's vehicle id is a hash), so every train is drawn as what
// usually runs on its line or kind of train, labeled as typical. The
// drawings are Trainsheet's own side views from published dimensions, at the
// shared scale (js/carart.js), each operator's paint simplified to its main
// bands. Slovakia's (zsr.cars.js) and Greece's (hellenictrain.cars.js)
// railroads reuse the bodies here (twinEnded, euroLoco, euroCoach, unit)
// with their own paint.

import { newId, bilevel, coachCar, flirtCar, flirtMid } from "../carmodels.js?v=dev";
import { C, rect, circle, path, poly, win, truck, pantograph, slats } from "../carart.js?v=dev";

// ---------- Paint ----------
// Each operator's side, simplified: a body color, a roof band from the eave,
// a lower band to `low` with a line on top, a dark skirt under the floor.
// ČD: Najbrt's white over dark blue with a light blue line; ZSSK: white over
// blue with a red line; RegioJet: yellow all over; Leo Express: black with a
// gold line; Arriva: aquamarine under white; GW Train: green under white with
// a yellow line; Hellenic Train: white with a gray line and a black skirt.
export const SCHEME = {
  czcd: { base: "#f2f3f4", roof: "#a9b0b8", band: "#1f4e9c", line: "#62b5e5", skirt: "#2a2d31", screen: "#1d2026" },
  zssk: { base: "#f2f3f4", roof: "#a9b0b8", band: "#1d4f9f", line: "#e30613", skirt: "#2a2d31", screen: "#1d2026" },
  czregiojet: { base: "#fbc400", roof: "#8e9399", band: null, line: "#1d1e20", skirt: "#1d1e20", screen: "#1d1e20" },
  czleo: { base: "#26272a", roof: "#3c3e42", band: null, line: "#c8a04a", skirt: "#17181a", screen: "#111214" },
  czarriva: { base: "#eef0ef", roof: "#a9b0b8", band: "#00a3ad", line: null, skirt: "#2a2d31", screen: "#1d2026" },
  czgwtrain: { base: "#f2f3f4", roof: "#a9b0b8", band: "#2f8a3c", line: "#f0b400", skirt: "#2a2d31", screen: "#1d2026" },
  hellenictrain: { base: "#f2f3f4", roof: "#a9b0b8", band: null, line: "#8a9097", skirt: "#1d1e20", screen: "#1d2026", accent: ["#0a6ab4", "#e2001a"] },
};
SCHEME.regiojetsk = SCHEME.czregiojet;
SCHEME.leoexpresssk = SCHEME.czleo;
export const scheme = (c) => SCHEME[c.agency] || SCHEME.czcd;

// One side's paint, L long: eave, low (top of the lower band) and skirt in
// feet above the rail. A cab section's nose (cab: true) carries Hellenic
// Train's blue and red accents back to the first window.
export function side(c, L, { eave, low, skirt, cab = false, lineH = 0.32 }) {
  const s = scheme(c);
  let p = rect(0, 0, L, 20, s.base) + rect(0, eave, L, 8, s.roof);
  if (s.band) p += rect(0, 0, L, low, s.band);
  if (s.line) p += rect(0, low, L, lineH, s.line);
  if (cab && s.accent) p += path(`M0 ${skirt}L9.5 ${skirt}Q7.6 ${low + 1.5} 6.4 ${eave}L0 ${eave}Z`, s.accent[0]) + path(`M9.5 ${skirt}L10.3 ${skirt}Q8.4 ${low + 1.5} 7.2 ${eave}L6.4 ${eave}Q7.6 ${low + 1.5} 9.5 ${skirt}Z`, s.accent[1]);
  return p + rect(0, 0, L, skirt, s.skirt);
}

// A raked windshield seen from the side, set in the cab's dark surround:
// from p (where the nose's rake begins) to q (where it meets the roof).
export const screen = (c, [px, py], [qx, qy], depth = 2.6) =>
  path(poly([[px + 0.15, py - 0.35], [qx + 0.2, qy + 0.25], [qx + depth + 0.6, qy + 0.25], [px + depth + 0.6, py - 0.35]]), scheme(c).screen) +
  path(poly([[px + 0.45, py], [qx + 0.25, qy - 0.15], [qx + 0.9, qy - 0.15], [px + 1.3, py]]), C.glass) +
  path(poly([[px + 1.6, py], [qx + 1.15, qy - 0.15], [qx + depth, qy - 0.15], [px + depth, py]]), C.glass);

// ---------- Bodies ----------

// A body with a cab at each end: drawn once with its cab on the left, then
// that left half again mirrored for the right. half(c) draws the whole body.
export function twinEnded(c, half) {
  const id = newId(), L = c.L;
  const h = half({ ...c, cabL: true, cabR: false, coupledL: false, coupledR: false });
  return `<clipPath id="${id}"><rect x="-5" y="-5" width="${L / 2 + 5.3}" height="30"/></clipPath>` +
    `<g clip-path="url(#${id})">${h}</g><g transform="matrix(-1 0 0 1 ${L} 0)"><g clip-path="url(#${id})">${h}</g></g>`;
}

// A four-axle European locomotive with a cab at each end. o: roof, sill,
// nose (points, bottom up), rake ([p, q] of the windshield), centers (truck
// centers apart), wheel (in), pans (electric), grilles ([x, w] from the
// middle), paint(c, L) for the side (default: the operator's).
export function euroLoco(c, o) {
  const L = c.L, { roof, sill } = o;
  const half = (h) => bilevel(h, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, nose: o.nose, badge: false, cabLen: 0,
    paint: () => (o.paint ? o.paint(c, L) : side(c, L, { eave: roof - 1.1, low: sill + 2.2, skirt: sill + 0.55, cab: true })),
    doors: [{ x: o.door ?? 6.2, w: 1.9, y0: sill + 0.5, y1: roof - 1.7, glassY: 0.62, glassH: 0.25, grabs: false }],
    rows: [{ xs: [o.rake[1][0] + 0.6], y: o.rake[0][1] - 0.4, w: 1.6, h: 2.2, r: 0.3 }],
    cab: () => screen(c, o.rake[0], o.rake[1], 2.0),
  });
  let s = twinEnded(c, half);
  // Side grilles, louvers either side of the middle; equipment on the roof.
  for (const [dx, w] of o.grilles || [[-14.5, 9.5], [5.0, 9.5]]) {
    const x = L / 2 + dx;
    s += rect(x, sill + 3.1, w, roof - sill - 5.2, "rgba(20,22,25,0.5)", 0.4) + slats(x, sill + 3.1, w, roof - sill - 5.2, 0.32, "rgba(255,255,255,0.18)");
  }
  s += rect(L / 2 - 9, roof - 0.05, 18, 0.55, C.steelDark, 0.4, 'rx="0.2"');
  for (const k of [-1, 1]) s += truck(L / 2 + (k * o.centers) / 2, { wb: 8.5, d: o.wheel ?? 49, kind: "loco", top: sill });
  if (o.pans !== false) s += pantograph(L * 0.29, roof + 0.5, { up: false }) + pantograph(L * 0.71, roof + 0.5, { up: true, facing: -1 });
  else s += [L / 2 - 5, L / 2 + 1].map((x) => rect(x, roof + 0.45, 4, 0.5, C.steelDark, 0.4, 'rx="0.2"')).join("") + rect(L / 2 - 0.4, roof + 0.95, 0.8, 0.7, "currentColor");
  return s;
}

// A UIC-Z passenger coach, 26.4 m: two trucks 19 m apart, a single plug door
// at each end, ten big windows between. o: rows, paint, cab (a driving
// trailer's end), base.
export function euroCoach(c, o = {}) {
  const L = c.L, roof = 13.3, sill = 3.9;
  return coachCar(c, {
    roof, sill, end: 0.6, endR: 1.2, base: o.base ?? scheme(c).base, badge: false, under: true,
    trucks: { centers: 62.3, wb: 8.2, d: 36 }, diaphragm: [4.25, 11.8],
    rows: o.rows ?? [{ a: 6.0, b: L - 6.0, y: 7.3, w: 4.6, h: 3.0, pitch: 6.45, r: 0.45 }],
    doors: [{ x: 2.0, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 }, { x: L - 4.6, w: 2.6, h: 7.0, glassY: 0.55, glassH: 0.3 }],
    livery: () => (o.paint ? o.paint(c, L) : side(c, L, { eave: 12.25, low: 6.6, skirt: 4.3 })),
    ...(o.cab ? { cab: o.cab, cabLen: 8, cabR: 3.2 } : {}),
  });
}

// One section of a multiple unit (low or high floor). o: roof, sill, nose
// (on a cab section), rake, rows, doors, trucks ([x...] own trucks; "end"
// for a Jakobs truck shared at the right end), pan (x of a pantograph),
// roofItems, paint(c, g) for the side.
export function unit(c, o) {
  const { roof, sill } = o;
  const cabbed = !!o.nose;
  return bilevel(cabbed ? { ...c, cabL: true } : { ...c, cabL: false, cabR: false }, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, badge: false, nose: o.nose || null,
    drop: o.drop || null, diaphragm: o.diaphragm ?? [sill + 0.2, roof - 1.6], cabLen: cabbed ? o.cabLen ?? 7 : 0,
    rows: o.rows, doors: o.doors, roofItems: o.roofItems || [],
    paint: (cc, g) => (o.paint ? o.paint(cc, g) : side(c, g.L, { eave: roof - 1.2, low: o.low ?? sill + 1.6, skirt: sill + 0.2, cab: cabbed })),
    cab: cabbed ? () => screen(c, o.rake[0], o.rake[1], o.depth ?? 2.6) : null,
    extra: (cc, g) => (o.trucks || []).map((x) => (x === "end" ? truck(g.L, { wb: 8.5, d: 30, top: sill }) : x === "start" ? truck(0, { wb: 8.5, d: 30, top: sill })
      : truck(x, { wb: 8.5, d: o.wheel ?? 33, top: sill }))).join("") + (o.pan != null ? pantograph(o.pan, roof, { up: true, facing: -1 }) : "") + (o.extra ? o.extra(cc, g) : ""),
  });
}
const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const plug = (x, sill, top, w = 4.4) => ({ x, w, y0: sill, y1: top, leaves: 2, glassY: 0.4, glassH: 0.45 });

// ---------- Locomotives ----------

// Škoda 109E (ČD 380): 18.0 m, Bo'Bo', 1,250 mm wheels; a rounded nose with
// a deep raked windshield.
const NOSE_109E = [[1.2, 4.1], [1.0, 6.6], ["q", 1.1, 8.0, 2.2, 9.1], [4.0, 12.3], ["q", 4.6, 12.9, 5.8, 12.9]];
export const loco109E = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_109E, rake: [[2.2, 9.1], [4.0, 12.3]], centers: 30, door: 7.0 });
// Siemens Vectron: 18.98 m over buffers, Bo'Bo'; a flat, nearly upright
// front under a short raked windshield.
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
export const vectron = (c) => euroLoco(c, { roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6 });

// ---------- Coaches ----------

// ČD's railjets: Siemens Viaggio coaches in ČD's railjet paint, dark blue
// with a light blue line under the windows; the driving trailer's rounded
// cab end at the back of the train.
const RJ = { navy: "#1f3264", sky: "#62b5e5" };
const rjPaint = (c, L) => rect(0, 0, L, 20, RJ.navy) + rect(0, 12.25, L, 8, "#5b6470") + rect(0, 6.55, L, 0.3, RJ.sky) + rect(0, 0, L, 4.3, "#15171a");
const RJ_ROWS = (L) => [{ a: 6.0, b: L - 6.0, y: 7.2, w: 5.2, h: 3.1, pitch: 6.45, r: 0.5 }];
export const rjCoach = (c) => euroCoach(c, { base: RJ.navy, paint: rjPaint, rows: RJ_ROWS(c.L) });
export const rjCab = (c) => euroCoach(c, { base: RJ.navy, paint: rjPaint, rows: RJ_ROWS(c.L),
  cab: () => path(poly([[1.0, 8.6], [2.6, 11.6], [5.4, 11.6], [5.4, 8.6]]), C.glass) + path(poly([[0.75, 8.3], [0.75, 11.9], [2.4, 12.2], ["q", 1.0, 11.6, 0.75, 8.3]]), "#111214") });

// ---------- Multiple units ----------

// Pendolino (ČD 680): seven cars, 185.3 m; a long tapered nose; a narrow
// body for tilting; small paired windows.
const NOSE_680 = [[1.0, 3.6], [0.8, 5.4], ["q", 0.9, 7.0, 2.6, 8.3], [8.8, 11.9], ["q", 10.4, 12.7, 12.8, 12.7]];
const pendoPaint = (c, g) => side(c, g.L, { eave: 11.6, low: 6.2, skirt: 3.9 }) + rect(0, 7.0, g.L, 2.9, "#141619");
export const pendolinoCab = (c) => unit(c, { roof: 12.7, sill: 3.6, nose: NOSE_680, rake: [[2.6, 8.3], [8.8, 11.9]], depth: 3.4, cabLen: 14, low: 6.2,
  rows: [{ xs: seq(17.0, 5.6, 12), y: 7.25, w: 4.2, h: 2.4, r: 0.35 }], doors: [plug(14.2, 3.6, 10.6, 2.4), plug(c.L - 4.2, 3.6, 10.6, 2.4)],
  trucks: [12.0, c.L - 10.0], wheel: 36, paint: pendoPaint });
export const pendolinoMid = (c) => unit(c, { roof: 12.7, sill: 3.6, low: 6.2,
  rows: [{ xs: seq(6.8, 5.6, 13), y: 7.25, w: 4.2, h: 2.4, r: 0.35 }], doors: [plug(1.6, 3.6, 10.6, 2.4), plug(c.L - 4.0, 3.6, 10.6, 2.4)],
  trucks: [10.0, c.L - 10.0], wheel: 36, paint: pendoPaint, pan: c.pan ? c.L / 2 : null });

// CityElefant (ČD 471, ZSSK 671): three double-deck cars of 26.4 m, the
// power car (471) and cab trailer (971) at the ends; a low floor between
// the trucks, two double doors a side, windows on both decks and on the
// intermediate level over each truck.
const ELE = { roof: 15.2, sill: 3.7, drop: (L) => ({ a: 14.6, b: L - 14.6, y: 1.6 }) };
const NOSE_471 = [[1.3, 3.7], [1.2, 6.8], ["q", 1.3, 8.2, 2.2, 9.4], [4.6, 14.0], ["q", 5.4, 15.2, 7.2, 15.2]];
const elePaint = (c, g) => side(c, g.L, { eave: 14.2, low: 4.4, skirt: 1.7 }) + rect(17.0, 10.55, g.L - 34.0, 3.0, "#141619", 0, 'rx="0.4"');
const eleRows = (L, a = 6.2) => [{ xs: seq(17.6, 5.4, Math.floor((L - 35.2) / 5.4) + 1), y: 10.75, w: 4.4, h: 2.6, r: 0.4 },
  { xs: seq(22.6, 5.5, Math.floor((L - 45.2) / 5.5) + 1), y: 4.6, w: 4.4, h: 2.6, r: 0.4 }, { xs: [a, L - a - 4.2], y: 7.4, w: 4.2, h: 2.8, r: 0.4 }];
const eleDoors = (L) => [plug(16.2, 1.7, 9.2, 4.8), plug(L - 21.0, 1.7, 9.2, 4.8)];
const eleTrucks = (L) => [8.0, L - 8.0];
const elefantCab = (c, pan) => unit(c, { roof: ELE.roof, sill: ELE.sill, drop: ELE.drop(c.L), nose: NOSE_471, rake: [[2.2, 9.4], [4.6, 14.0]], cabLen: 8,
  rows: eleRows(c.L, 9.4), doors: eleDoors(c.L), trucks: eleTrucks(c.L), wheel: 36, paint: elePaint, diaphragm: [3.9, 13.6],
  pan: pan ? 22.0 : null, roofItems: [[c.L - 20, 9, 0.6]] });
export const elefant471 = (c) => elefantCab(c, true);
export const elefant971 = (c) => elefantCab(c, false);
export const elefant071 = (c) => unit(c, { roof: ELE.roof, sill: ELE.sill, drop: ELE.drop(c.L), rows: eleRows(c.L), doors: eleDoors(c.L),
  trucks: eleTrucks(c.L), wheel: 36, paint: elePaint, diaphragm: [3.9, 13.6] });

// RegioPanter (Škoda 7Ev: ČD 640 and 650, Arriva's 650s, ZSSK 661): cars of
// 26.45 m on their own trucks, low floor at the doors; a blunt nose under a
// big windshield; two double doors a side.
const NOSE_PANTER = [[1.2, 3.0], [1.0, 5.8], ["q", 1.1, 7.2, 2.0, 8.3], [4.2, 12.9], ["q", 4.9, 13.9, 6.6, 13.9]];
const panterPaint = (cab) => (c, g) => side(c, g.L, { eave: 12.7, low: 5.4, skirt: 3.3, cab }) + rect(0, 6.2, g.L, 4.2, "#141619");
export const panterCab = (c) => unit(c, { roof: 13.9, sill: 3.0, nose: NOSE_PANTER, rake: [[2.0, 8.3], [4.2, 12.9]], cabLen: 8,
  rows: [{ xs: seq(19.0, 6.4, 5), y: 6.4, w: 5.6, h: 3.8, r: 0.45 }, { xs: [9.6, c.L - 7.4], y: 6.4, w: 3.6, h: 3.8, r: 0.45 }],
  doors: [plug(13.8, 3.0, 10.5), plug(c.L - 13.2, 3.0, 10.5)], trucks: [9.5, c.L - 8.0], paint: panterPaint(true),
  pan: c.index === 0 && c.count === 2 ? 40 : null, roofItems: [[20, 14, 0.55], [c.L - 26, 10, 0.55]] });
export const panterMid = (c) => unit(c, { roof: 13.9, sill: 3.0,
  rows: [{ xs: seq(17.6, 6.4, 7), y: 6.4, w: 5.6, h: 3.8, r: 0.45 }, { xs: [3.0, c.L - 6.6], y: 6.4, w: 3.6, h: 3.8, r: 0.45 }],
  doors: [plug(9.4, 3.0, 10.5), plug(c.L - 13.8, 3.0, 10.5)], trucks: [8.0, c.L - 8.0], paint: panterPaint(false), pan: c.L / 2, roofItems: [[8, 10, 0.55]] });

// RegioShark (Pesa Link, ČD 844): two cars, 43.73 m, a diesel under each;
// a rounded nose; one double door a side in each car, near the coupling.
const NOSE_LINK = [[1.3, 2.9], [1.1, 5.5], ["q", 1.2, 7.3, 2.4, 8.6], [4.6, 12.3], ["q", 5.3, 13.3, 7.0, 13.3]];
export const linkCar = (c) => unit(c, { roof: 13.3, sill: 2.9, nose: NOSE_LINK, rake: [[2.4, 8.6], [4.6, 12.3]], cabLen: 8,
  rows: [{ xs: seq(10.0, 6.1, 6), y: 6.2, w: 5.0, h: 3.6, r: 0.45 }, { xs: [c.L - 6.4], y: 6.2, w: 3.4, h: 3.6, r: 0.45 }],
  doors: [plug(c.L - 13.6, 2.9, 10.2)], trucks: [10.0, c.L - 9.0], paint: panterPaint(true), roofItems: [[14, 12, 0.7], [36, 8, 0.7]] });

// Regionova (ČD 814): two-axle railbus cars of 14.22 m rebuilt from class
// 810 railbuses; an upright new cab, a folding door behind it.
function axle(x, sill) {
  return rect(x - 2.6, 1.6, 5.2, 0.32, "currentColor", 0, 'opacity="0.8"') + circle(x, 1.25, 1.25, "currentColor") + circle(x, 1.25, 1.02, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5" vector-effect="non-scaling-stroke"`) +
    circle(x, 1.25, 0.33, C.steelDark) + rect(x - 0.55, 0.85, 1.1, 0.8, C.steelDark, 0, 'rx="0.14"') + rect(x - 1.2, 1.95, 2.4, sill - 1.95, "currentColor", 0, 'opacity="0.8"');
}
const NOSE_814 = [[0.9, 3.9], [0.8, 6.8], ["q", 0.9, 7.9, 1.6, 8.6], [2.4, 10.9], ["q", 2.8, 11.6, 3.8, 11.6]];
export const regionova = (c) => unit(c, { roof: 11.6, sill: 3.9, nose: NOSE_814, rake: [[1.6, 8.6], [2.4, 10.9]], depth: 2.0, cabLen: 5, low: 5.9,
  rows: [{ xs: seq(10.6, 4.6, 7), y: 6.9, w: 3.8, h: 2.6, r: 0.35 }], doors: [{ x: 5.4, w: 3.2, y0: 3.4, y1: 10.2, leaves: 2, glassY: 0.5, glassH: 0.35 }],
  extra: (cc, g) => axle(12.5, 3.9) + axle(g.L - 12.5, 3.9) + rect(18, 11.55, 9, 0.5, C.steelDark, 0.4, 'rx="0.2"'), diaphragm: [4.2, 10.4] });

// Regio-Shuttle RS1 (ČD 840 and 841, GW Train 841.2): one car of 25.5 m with
// a cab at each end, a low floor between the motor trucks, two double doors
// a side beside it.
const NOSE_RS1 = [[1.1, 3.6], [1.0, 6.0], ["q", 1.1, 7.6, 2.2, 8.6], [4.0, 12.2], ["q", 4.7, 13.1, 6.4, 13.1]];
export const rs1 = (c) => twinEnded(c, (h) => unit(h, { roof: 13.1, sill: 3.6, drop: { a: 16.8, b: c.L - 16.8, y: 2.0 }, nose: NOSE_RS1, rake: [[2.2, 8.6], [4.0, 12.2]],
  rows: [{ xs: [9.4, 23.6, 29.4, 35.2, c.L / 2 - 2.3], y: 6.3, w: 4.6, h: 3.7, r: 0.45 }], doors: [plug(17.6, 2.1, 10.3), plug(c.L - 22.0, 2.1, 10.3)],
  trucks: [8.4, c.L - 8.4], roofItems: [[12, 10, 0.6]], low: 4.6 }));

// DB class 628 (Arriva 845, GW Train's 628s): two cars of 22.9 m, a diesel
// under the motor car; a wedge cab; single folding doors near each end.
const NOSE_628 = [[1.0, 3.9], [0.9, 6.6], ["q", 1.0, 7.6, 1.9, 8.4], [3.4, 12.4], ["q", 3.9, 13.2, 5.2, 13.2]];
export const vt628 = (c) => unit(c, { roof: 13.2, sill: 3.9, nose: NOSE_628, rake: [[1.9, 8.4], [3.4, 12.4]], depth: 2.2, cabLen: 6, low: 6.0,
  rows: [{ xs: seq(13.4, 5.0, 11), y: 7.3, w: 4.2, h: 2.9, r: 0.35 }], doors: [{ x: 8.4, w: 3.2, y0: 3.4, y1: 11.0, leaves: 2, glassY: 0.5, glassH: 0.35 },
    { x: c.L - 5.4, w: 3.2, y0: 3.4, y1: 11.0, leaves: 2, glassY: 0.5, glassH: 0.35 }], trucks: [9.0, c.L - 9.0], roofItems: [[16, 10, 0.6]], diaphragm: [4.2, 11.8] });

// Alstom Coradia LINT 41 (Leo Express's, CZ and SK): two sections, 41.89 m,
// on a shared Jakobs truck; a raked nose; one double door a side in each.
const NOSE_LINT = [[1.0, 2.8], [1.0, 5.6], ["q", 1.1, 7.0, 2.0, 8.0], [4.6, 12.4], ["q", 5.4, 13.4, 7.2, 13.4]];
export const lintCar = (c) => unit(c, { roof: 13.4, sill: 2.8, nose: NOSE_LINT, rake: [[2.0, 8.0], [4.6, 12.4]], cabLen: 8,
  rows: [{ xs: [9.6], y: 6.4, w: 3.0, h: 3.8, r: 0.45 }, { xs: seq(20.6, 5.6, 8), y: 6.4, w: 4.8, h: 3.8, r: 0.45 }],
  doors: [plug(14.2, 2.8, 10.4)], trucks: [10.5, "end"], roofItems: [[22, 12, 0.6], [44, 8, 0.6]] });

// Pesa Elf.eu (RegioJet 654): two cars of about 21.8 m, a pantograph on the
// first; a rounded nose; two double doors a side in each car.
const NOSE_ELF = [[1.4, 3.4], [1.0, 6.0], ["q", 1.1, 7.8, 2.6, 9.2], [5.0, 12.9], ["q", 5.8, 13.8, 7.6, 13.8]];
export const elfCar = (c) => unit(c, { roof: 13.8, sill: 3.4, nose: NOSE_ELF, rake: [[2.6, 9.2], [5.0, 12.9]], cabLen: 8,
  rows: [{ xs: seq(15.6, 6.0, 3), y: 6.6, w: 5.0, h: 3.7, r: 0.45 }, { xs: seq(40.4, 6.0, 4), y: 6.6, w: 5.0, h: 3.7, r: 0.45 }],
  doors: [plug(9.8, 3.4, 10.6), plug(34.4, 3.4, 10.6)], trucks: [9.0, c.L - 8.0], pan: c.index === 0 ? 50 : null, roofItems: [[16, 12, 0.6]] });

// Stadler FLIRT (Leo Express 480): the built-in FLIRT sections, repainted in
// Leo Express black with its gold line (the built-in white, blue and green
// swapped out), and a pantograph on the middle section.
const LEO_FLIRT = { "#f4f5f6": "#26272a", "#2a62d4": "#3c3e42", "#3fb54a": "#c8a04a" };
export const repaint = (svg, map) => svg.replace(/#[0-9a-f]{6}\b/gi, (m) => map[m.toLowerCase()] || m);
export const leoFlirtCab = (c) => repaint(flirtCar(c), LEO_FLIRT);
export const leoFlirtMid = (c) => repaint(flirtMid(c), LEO_FLIRT) + (c.index === 2 ? pantograph(c.L / 2, 14.06, { up: true, facing: -1 }) : "");

// ---------- Tables ----------

export const TYPES = {
  cz380: { name: "Škoda 109E electric locomotive", kind: "electric", pan: true },
  czVectron: { name: "Siemens Vectron electric locomotive", kind: "electric", pan: true },
  czCoach: { name: "Coach", kind: "coach" },
  czRjCoach: { name: "railjet coach", kind: "coach", amenities: ["first", "business", "dining"] },
  czRjCab: { name: "railjet driving trailer", kind: "coach", cab: true },
  czPendoCab: { name: "Pendolino end car", kind: "emu", amenities: ["first", "cafe"] },
  czPendoMid: { name: "Pendolino intermediate car", kind: "emu", pan: true },
  czElefant471: { name: "CityElefant power car", kind: "bilevel", emu: true },
  czElefant071: { name: "CityElefant intermediate car", kind: "bilevel", emu: true },
  czElefant971: { name: "CityElefant cab trailer", kind: "bilevel", emu: true },
  czPanter640: { name: "RegioPanter end car", kind: "emu" },
  czPanter650: { name: "RegioPanter car", kind: "emu" },
  czPanterMid: { name: "RegioPanter intermediate car", kind: "emu" },
  czLink: { name: "RegioShark car", kind: "emu" },
  czRegionova: { name: "Regionova railbus", kind: "emu" },
  czRs1: { name: "Regio-Shuttle RS1 railcar", kind: "emu" },
  cz628: { name: "Class 628 diesel car", kind: "emu" },
  czLint: { name: "Coradia LINT 41 section", kind: "emu" },
  czElf: { name: "Pesa Elf car", kind: "emu" },
  czFlirtCab: { name: "Stadler FLIRT end section", kind: "emu", amenities: ["first", "cafe"] },
  czFlirtMid: { name: "Stadler FLIRT intermediate section", kind: "emu" },
};

const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  cz380: M(loco109E, 59.06),
  czVectron: M(vectron, 62.27),
  czCoach: M((c) => euroCoach(c), 86.6),
  czRjCoach: M(rjCoach, 86.9),
  czRjCab: M(rjCab, 86.9, true),
  czPendoCab: M(pendolinoCab, 91.5, true),
  czPendoMid: M(pendolinoMid, 85.0),
  czElefant471: M(elefant471, 86.6, true),
  czElefant071: M(elefant071, 86.6),
  czElefant971: M(elefant971, 86.6, true),
  czPanter640: M(panterCab, 86.8, true),
  czPanter650: M(panterCab, 86.8, true),
  czPanterMid: M(panterMid, 86.8),
  czLink: M(linkCar, 71.7, true),
  czRegionova: M(regionova, 46.65, true),
  czRs1: M(rs1, 83.7),
  cz628: M(vt628, 75.1, true),
  czLint: M(lintCar, 68.7, true),
  czElf: M(elfCar, 71.5, true),
  czFlirtCab: M(leoFlirtCab, 70.5, true),
  czFlirtMid: M(leoFlirtMid, 51.5),
};

// [first, last, type], by UIC number (class and serial run together).
export const FLEETS = {
  czcd: [[380001, 380020, "cz380"], [681001, 681007, "czPendoCab"], [471001, 471083, "czElefant471"], [640001, 640008, "czPanter640"],
    [640101, 640112, "czPanter640"], [640201, 640260, "czPanter640"], [650001, 650008, "czPanter650"], [650201, 650246, "czPanter650"],
    [844001, 844031, "czLink"], [814001, 814210, "czRegionova"], [840001, 840016, "czRs1"], [841001, 841017, "czRs1"]],
  czregiojet: [[654001, 654007, "czElf"]],
  czleo: [[480001, 480005, "czFlirtCab"]],
  czarriva: [[845101, 845104, "cz628"]],
};

// A train's line or kind: "S4", "R19", "Ex3", or "Osobní", "railjet"...
const lineNo = (route) => Number((/^[A-Z]+(\d+)/.exec(route || "") || [])[1]);
const set = (label, ...units) => ({ label, units });
const RAILJET = set("railjet: a ČD 109E locomotive and seven railjet coaches, the driving trailer at the back", ["cz380", 1], ["czRjCoach", 6], ["czRjCab", 1]);
const PENDOLINO = set("Pendolino: a seven-car tilting electric train", ["czPendoCab", 1], ["czPendoMid", 5], ["czPendoCab", 1]);
const CD_LOCO = (n) => set("A 109E electric locomotive and coaches", ["cz380", 1], ["czCoach", n]);
const ELEFANT = set("CityElefant: a three-car double-deck electric unit", ["czElefant471", 1], ["czElefant071", 1], ["czElefant971", 1]);
const PANTER3 = set("RegioPanter: a three-car electric unit", ["czPanter640", 1], ["czPanterMid", 1], ["czPanter640", 1]);
const PANTER2 = (who) => set(`RegioPanter: a two-car electric unit${who}`, ["czPanter650", 2]);
const SHARK = set("RegioShark: a two-car diesel unit", ["czLink", 2]);
const REGIONOVA = set("Regionova: a two-car railbus", ["czRegionova", 2]);
const RS1 = set("Regio-Shuttle RS1: a single diesel railcar", ["czRs1", 1]);
const VT628 = set("Class 628: a two-car diesel unit", ["cz628", 2]);
const LINT = set("Coradia LINT 41: a two-section diesel unit", ["czLint", 2]);
const FLIRT = set("Stadler FLIRT: a five-section electric unit", ["czFlirtCab", 1], ["czFlirtMid", 3], ["czFlirtCab", 1]);
const RJ_TRAIN = set("A Vectron locomotive and RegioJet's yellow coaches", ["czVectron", 1], ["czCoach", 6]);
const ELF = set("Pesa Elf: a two-car electric unit", ["czElf", 2]);
// The formation a reported car's model runs in (for the fleet pages).
const BY_MODEL = { cz380: CD_LOCO(6), czPendoCab: PENDOLINO, czElefant471: ELEFANT, czPanter640: PANTER3, czPanter650: PANTER2(""), czLink: SHARK,
  czRegionova: REGIONOVA, czRs1: RS1, cz628: VT628, czLint: LINT, czFlirtCab: FLIRT, czElf: ELF, czVectron: RJ_TRAIN };

// What usually runs, by line or kind of train. ČD: SuperCity trains are
// Pendolinos, railjets its 109Es with railjet coaches, the other long-distance
// trains (EuroCity, InterCity, Ex and R lines, night trains) 109E or other
// locomotives with coaches; Prague's and Brno's main S lines (S1-S9)
// CityElefants, the other electric suburban lines RegioPanters, and the
// branch lines (unnamed Os and Sp trains, lines numbered from 20) diesel
// RegioSharks and Regionovas. Lines vary with the day's workings; the
// labels say "usually".
export const TYPICAL = {
  czcd: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "", n = lineNo(r);
    if (r === "SuperCity") return PENDOLINO;
    if (r === "railjet") return RAILJET;
    if (/^(EuroCity|InterCity|Expres|EuroNight|Nightjet|Rychlík)$/.test(r) || /^(Ex|R)\d/.test(r)) return CD_LOCO(r === "Rychlík" || /^R\d/.test(r) ? 5 : 7);
    if (/^S\d/.test(r) && n <= 9) return ELEFANT;
    if (/^[A-Z]+\d/.test(r) && n < 20) return /^S\d/.test(r) ? PANTER3 : PANTER2("");
    if (r === "Osobní" || r === "Spěšný") return REGIONOVA;
    return SHARK;
  },
  // RegioJet: its long-distance trains are locomotive-hauled yellow coaches,
  // as are R8 and R23; its Ústí-region and other regional lines Pesa Elfs.
  czregiojet: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (r === "RegioJet") return RJ_TRAIN;
    if (/^R\d/.test(r)) return set("A locomotive and RegioJet's yellow coaches", ["czVectron", 1], ["czCoach", 5]);
    return ELF;
  },
  // Leo Express: its own FLIRTs on Prague-Ostrava; leased LINT 41s on its
  // regional trains in the Pardubice and Zlín regions.
  czleo: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (r === "Leo Express") return FLIRT;
    if (r === "EuroCity" || r === "Expres") return set("A leased Vectron locomotive and coaches", ["czVectron", 1], ["czCoach", 5]);
    return LINT;
  },
  // Arriva: RegioPanters on the Plzeň-region electric lines (P), class 845
  // (ex-DB 628) diesels on its express and other lines.
  czarriva: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    return /^P\d/.test(t.route || "") ? PANTER2(" (Arriva's ex-ČD 650s)") : VT628;
  },
  // GW Train Regio: modernised RS1s (841.2) on its Pošumaví P lines, 628s on
  // the express and Ústí-region lines; railbuses and RS1s elsewhere.
  czgwtrain: (t, reported) => {
    if (BY_MODEL[reported]) return BY_MODEL[reported];
    const r = t.route || "";
    if (/^(R|U|T|D)\d/.test(r)) return VT628;
    return RS1;
  },
};

const WP = "https://en.wikipedia.org/wiki/";
const cs = (page) => `https://cs.wikipedia.org/wiki/${page}`;
export const FACTS = {
  cz380: { model: "Škoda 109E (class 380)", type: "Electric locomotive", builder: "Škoda Transportation", built: "2008–2011", fleet: "20, 380 001–020",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 59.1, source: `${WP}ČD_Class_380`,
    about: "ČD's three-system electric locomotive, Škoda's 109E, built for 200 km/h on Czech, Slovak, Austrian and German lines. It hauls ČD's railjets between Prague, Vienna and Graz and many of its EuroCity and InterCity trains." },
  "czVectron@czregiojet": { model: "Siemens Vectron", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2010", fleet: "Leased, in RegioJet yellow",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 62.3, source: `${WP}Siemens_Vectron`,
    about: "RegioJet hauls its long-distance trains with leased locomotives painted in its yellow, Siemens Vectrons among them. A multi-system Vectron runs on both the Czech 3 kV DC and 25 kV AC lines." },
  "czVectron@czleo": { model: "Siemens Vectron", type: "Electric locomotive", builder: "Siemens Mobility", built: "Since 2010", fleet: "Leased from Railpool",
    topSpeedMph: 124, powerHp: 8583, lengthFt: 62.3, source: cs("Leo_Express"),
    about: "Leo Express leases Vectrons for its locomotive-hauled international trains, such as the Przemyśl–Frankfurt service." },
  "czCoach@czcd": { model: "Long-distance coach", type: "Passenger coach", builder: "Various", fleet: "Hundreds", lengthFt: 86.6, source: cs("České_dráhy"),
    about: "ČD's InterCity, EuroCity and Rychlík trains are made up of standard 26.4 m coaches, many rebuilt with air conditioning, power outlets and Wi-Fi. They are drawn here in ČD's white and blue." },
  "czCoach@czregiojet": { model: "RegioJet coach", type: "Passenger coach", builder: "Various (rebuilt ex-ÖBB and new coaches)", lengthFt: 86.6, source: cs("RegioJet"),
    about: "RegioJet's yellow coaches offer Low Cost, Standard, Relax and Business classes, with stewards serving drinks and snacks at the seat." },
  "czCoach@czleo": { model: "Coach", type: "Passenger coach", builder: "Various (former Deutsche Bahn)", lengthFt: 86.6, source: cs("Leo_Express"),
    about: "Leo Express began running locomotive-hauled trains of former Deutsche Bahn coaches in 2026, as the base for its Prague–Munich plans." },
  czRjCoach: { model: "ČD railjet coach (Siemens Viaggio)", type: "Passenger coach", builder: "Siemens Mobility", built: "2013–2014", fleet: "7 seven-car sets",
    topSpeedMph: 143, lengthFt: 86.9, source: `${WP}Railjet`,
    about: "ČD's railjets are the same Siemens trains as ÖBB's, painted dark blue, with economy, first and business class and a restaurant. They run Prague–Brno–Vienna–Graz behind a ČD 109E, a driving trailer at the other end." },
  czRjCab: { model: "ČD railjet driving trailer", type: "Driving trailer", builder: "Siemens Mobility", built: "2013–2014", fleet: "7", topSpeedMph: 143, lengthFt: 86.9,
    source: `${WP}Railjet`, about: "The railjet's driving trailer has a cab at its far end, so the train runs push-pull and needs no locomotive at the back." },
  czPendoCab: { model: "Pendolino (class 680)", type: "Tilting electric multiple unit", builder: "Alstom (Fiat Ferroviaria)", built: "2004", fleet: "7 seven-car sets",
    topSpeedMph: 124, powerHp: 5257, lengthFt: 608, source: `${WP}ČD_Class_680`,
    about: "ČD's SuperCity Pendolinos tilt into curves to run faster on the old main lines, mainly Prague–Ostrava. Designed for 230 km/h, they run at up to 200 km/h." },
  czPendoMid: { model: "Pendolino (class 680)", type: "Tilting electric multiple unit", builder: "Alstom (Fiat Ferroviaria)", built: "2004", fleet: "7 seven-car sets",
    topSpeedMph: 124, powerHp: 5257, source: `${WP}ČD_Class_680`,
    about: "Each Pendolino has seven cars: two driving motor cars, motor cars, trailers and a buffet car." },
  czElefant471: { model: "CityElefant (class 471)", type: "Double-deck electric multiple unit", builder: "Škoda Vagonka", built: "1997–2013", fleet: "83 three-car units",
    topSpeedMph: 87, powerHp: 2682, seats: 310, source: `${WP}ČD_Class_471`,
    about: "Prague's and Brno's suburban workhorse: a power car with first class, an intermediate car and a cab trailer, all double-deck. Two or three units couple in rush hour." },
  czElefant071: { model: "CityElefant (class 071)", type: "Double-deck trailer", builder: "Škoda Vagonka", built: "1997–2013", seats: 310, source: `${WP}ČD_Class_471`,
    about: "The middle car of a CityElefant, unpowered, with the low floor between the trucks that both decks are reached from." },
  czElefant971: { model: "CityElefant (class 971)", type: "Double-deck cab trailer", builder: "Škoda Vagonka", built: "1997–2013", source: `${WP}ČD_Class_471`,
    about: "The CityElefant's cab trailer, at the opposite end from the power car." },
  czPanter640: { model: "RegioPanter (class 640)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2012–2024", fleet: "80 three-car units",
    topSpeedMph: 99.4, seats: 241, source: `${WP}Škoda_7Ev`,
    about: "Škoda's low-floor regional electric unit, the backbone of ČD's newer regional fleet across most regions. Three-car 640s seat about 240." },
  czPanter650: { model: "RegioPanter (class 650)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2012–2024", fleet: "54 two-car units",
    topSpeedMph: 99.4, seats: 147, lengthFt: 173.6, source: `${WP}Škoda_7Ev`,
    about: "The two-car RegioPanter, for lighter regional lines; two or three couple at busy times." },
  "czPanter650@czarriva": { model: "RegioPanter (class 650)", type: "Electric multiple unit", builder: "Škoda Transportation", built: "2018", fleet: "9 two-car units",
    topSpeedMph: 99.4, seats: 147, lengthFt: 173.6, source: cs("Arriva_vlaky"),
    about: "Arriva took over nine two-car RegioPanters in December 2023 for its Plzeň-region trains to Horažďovice předměstí." },
  czPanterMid: { model: "RegioPanter", type: "Electric multiple unit", builder: "Škoda Transportation", built: "Since 2012", topSpeedMph: 99.4, source: `${WP}Škoda_7Ev`,
    about: "The intermediate car of a three-car RegioPanter, carrying the pantograph." },
  czLink: { model: "RegioShark (Pesa Link, class 844)", type: "Diesel multiple unit", builder: "Pesa Bydgoszcz", built: "Since 2012", fleet: "31 two-car units",
    topSpeedMph: 74.6, powerHp: 1046, lengthFt: 143.5, source: `${WP}ČD_Class_844`,
    about: "A low-floor two-car diesel unit from Poland, with an engine under each car, on ČD's busier non-electrified regional lines." },
  czRegionova: { model: "Regionova (class 814)", type: "Diesel railbus", builder: "Pars nova (rebuilt from class 810)", built: "1973–1984, rebuilt 2005–2012",
    fleet: "210", topSpeedMph: 50, powerHp: 325, lengthFt: 46.7, source: `${WP}ČD_Class_814`,
    about: "The ubiquitous branch-line railbus: an 810 motor car and a trailer, rebuilt by Pars nova with new cabs and a low-floor section. It runs on two axles per car." },
  czRs1: { model: "Stadler Regio-Shuttle RS1 (classes 840 and 841)", type: "Diesel railcar", builder: "Adtranz and Stadler", built: "1996–2013", fleet: "67 with ČD",
    topSpeedMph: 74.6, powerHp: 689, lengthFt: 83.7, source: `${WP}Stadler_Regio-Shuttle_RS1`,
    about: "A single low-floor railcar with a cab at each end. ČD bought new ones for Liberec and Vysočina and later many second-hand from Germany." },
  "czRs1@czgwtrain": { model: "Stadler Regio-Shuttle RS1 (class 841.2)", type: "Diesel railcar", builder: "Adtranz and Stadler, modernised", fleet: "Pošumaví contract",
    topSpeedMph: 74.6, powerHp: 689, lengthFt: 83.7, source: cs("GW_Train_Regio"),
    about: "GW Train Regio runs modernised RS1s on its Pošumaví lines P11 Strakonice–Klatovy and P23 Klatovy–Domažlice, under a contract to 2033." },
  "cz628@czarriva": { model: "Class 845 (ex-DB 628)", type: "Diesel multiple unit", builder: "Duewag and others; rebuilt by Pars nova", built: "1986–1996",
    fleet: "845 101–104 and more", topSpeedMph: 74.6, powerHp: 650, lengthFt: 150, source: `${WP}DB_Class_628`,
    about: "Former Deutsche Bahn two-car diesels, rebuilt for Arriva's express lines such as R14 Liberec–Pardubice and Ústí nad Labem." },
  "cz628@czgwtrain": { model: "Class 628", type: "Diesel multiple unit", builder: "Duewag and others", built: "1986–1996", topSpeedMph: 74.6, powerHp: 650, lengthFt: 150,
    source: `${WP}DB_Class_628`, about: "Bought from Germany and modernised, GW Train's 628s run its Plzeň–Most express (R25) and its Ústí-region lines U52 and T8." },
  czLint: { model: "Alstom Coradia LINT 41 (class 846)", type: "Diesel multiple unit", builder: "Alstom", fleet: "11 leased from Alstom", topSpeedMph: 87, lengthFt: 137.4,
    seats: 115, source: cs("Leo_Express"),
    about: "Two articulated sections on a shared truck. Leo Express runs leased LINT 41s on regional trains in the Pardubice and Zlín regions." },
  czElf: { model: "Pesa Elf.eu (class 654)", type: "Electric multiple unit", builder: "Pesa Bydgoszcz", built: "2022–2023", fleet: "7 two-car units, plus 7 three-car 655s",
    source: `${WP}Pesa_Elf`, about: "RegioJet's low-floor electric units for its Ústí-region lines, in service since December 2022; three-car class 655s joined in 2025." },
  czFlirtCab: { model: "Stadler FLIRT (class 480)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2012", fleet: "5 five-car units, 480 001–005",
    topSpeedMph: 99.4, source: `${WP}Leo_Express`,
    about: "Leo Express's black and gold FLIRTs, fitted for long distance with Economy, Business and Premium classes, run its Prague–Ostrava trains." },
  czFlirtMid: { model: "Stadler FLIRT (class 480)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2012", fleet: "5 five-car units", topSpeedMph: 99.4,
    source: `${WP}Leo_Express`, about: "An intermediate section of a Leo Express FLIRT; sections share trucks at each joint." },
};
