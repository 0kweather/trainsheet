// Renfe's cars (scripts/railroads/renfe.py), for both its agencies: the
// AVE, Avlo, Alvia, Avant and Media Distancia fleets (renfe) and Cercanías
// and Rodalies (cercanias). Neither feed names the train's units (vehicle.id
// is the train number), so every train is drawn as what usually runs on its
// service or line. Trainsheet's own side views, from published dimensions
// and photographs; liveries simplified.
import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, poly, win, door, truck, pantograph, slats, bodyOutline, underframe } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);

// Renfe's white with an orange line over an aubergine stripe (long distance
// and Media Distancia); Avlo's purple; Cercanías red; Rodalies orange.
const RF = { white: "#f1f2f3", roof: "#b9bec4", band: "#2a2e33", purple: "#6e2050", orange: "#ef8a1c", skirt: "#3a3e44",
  avlo: "#7a1d5c", coral: "#ff6b5b", lilac: "#b0568f", red: "#d8102b", rod: "#ee7d1e" };

// A band of paint following a line of points (its top edge), w deep.
const ribbon = (pts, w, fill) => path(poly([...pts, ...[...pts].reverse().map(([x, y]) => [x, y - w])]), fill);
// The orange line and aubergine stripe at height y; on a cab car (nose: how
// far back the nose runs) they sweep down to the bottom of the nose.
function rfStripes(L, y, nose = 0, color = RF.purple) {
  const pts = nose ? [[0, y - 2.4], [nose * 0.5, y - 1.2], [nose, y - 0.15], [nose + 4, y], [L, y]] : [[0, y], [L, y]];
  return ribbon(pts.map(([x, v]) => [x, v + 0.95]), 0.24, RF.orange) + ribbon(pts, 0.75, color);
}
// White body, gray roof edge and skirt, the stripes; options: the window
// band (dark glass band, from x0), the stripes' height, a cab's nose length.
const rfPaint = (L, { y = 5.2, nose = 0, roof = 12.0, skirt = 3.4, band = null } = {}) =>
  rect(0, 0, L, 17, RF.white) + rect(0, roof, L, 3, RF.roof) + rect(0, 0, L, skirt, RF.skirt) +
  (band ? rect(band[0], band[1], L - band[0] - (band[3] ?? 0), band[2], RF.band, 0, 'rx="0.4"') : "") + rfStripes(L, y, nose);
// Avlo: purple all over, coral and lilac swooshes rising toward the ends.
const avloPaint = (L, { roof = 12.0, skirt = 3.4 } = {}) => {
  let s = rect(0, 0, L, 17, RF.avlo) + rect(0, roof, L, 3, "#5b1645") + rect(0, 0, L, skirt, "#3a1030");
  s += path(`M0 ${skirt + 0.5}L${L * 0.45} ${skirt + 0.5}Q${L * 0.7} ${skirt + 0.6} ${L * 0.82} ${roof - 2}L${L * 0.86} ${roof - 2}Q${L * 0.72} ${skirt + 1.4} ${L * 0.45} ${skirt + 1.2}L0 ${skirt + 1.2}Z`, RF.coral);
  return s + path(`M0 ${skirt + 1.5}L${L * 0.4} ${skirt + 1.5}Q${L * 0.62} ${skirt + 1.7} ${L * 0.72} ${roof - 1}L${L * 0.75} ${roof - 1}Q${L * 0.6} ${skirt + 2.2} ${L * 0.4} ${skirt + 2.0}L0 ${skirt + 2.0}Z`, RF.lilac);
};
const isAvlo = (c) => c.route === "Avlo";
const isRodalies = (c) => /Rodalies/.test(c.route || "");

// --- Talgo articulated coaches (series 102/112, 106 and 130/730): short
// cars hung between single wheel pairs, one under each joint; low floors,
// a door at one end of each car, gauge-changing wheelsets on the 130s and
// the variable-gauge 106s. Drawn with the wheel pair at each end (the
// neighbor draws over the same place).
function talgoCoach(c, { roof = 11.2, sill = 2.6, rows, doorX = 1.2, paint }) {
  const { L } = c, x0 = 0.3, x1 = L - 0.3;
  const d = bodyOutline(x0, x1, sill, roof, { endR: 1.2 });
  let s = "";
  for (const x of [0, L]) s += rect(x - 1.3, 1.7, 2.6, 2.4, "currentColor", 0, 'opacity="0.85" rx="0.3"') + circle(x, 1.45, 1.45, "currentColor") +
    circle(x, 1.45, 1.15, "none", 0, `stroke="${C.steelDark}" stroke-width="0.5"`) + circle(x, 1.45, 0.35, C.steelDark);
  s += shell(d, RF.white, paint(c, L));
  for (const [x, y, w, h] of rows) s += win(x, y, w, h, 0.4);
  s += door(doorX, 2.9, 2.4, 6.9, { glassY: 0.55, glassH: 0.3, grabs: false });
  return s + coupled(c, 2.9, roof - 1.0);
}
// The rubber diaphragm between coupled cars (carmodels.js's carEnds, which
// the shell-drawn cars can't reach).
function coupled(c, floor, top) {
  let s = "";
  for (const [x, on] of [[0, c.coupledL], [c.L - 1.0, c.coupledR]]) if (on) s += rect(x, floor + 0.2, 1.0, top - floor - 0.4, C.rubber, 0, 'rx="0.2"');
  return s;
}
// A body the carmodels.js builders can't shape: the outline filled, its
// livery clipped to it and shaded like the built-in drawings.
function shell(d, base, liv) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="14">` +
    '<stop offset="0.2" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="16" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
const grille = (x, y, w, h) => rect(x, y, w, h, "rgba(20,22,25,0.5)", 0.4) + slats(x, y, w, h, 0.4, "rgba(255,255,255,0.18)");

// A power car (series 102/112, 106, 130): a cab and nose at the left, a
// machinery room behind it with grilles, two motor trucks, a pantograph.
function powerCar(c, { nose, roof, sill = 3.4, glass, centers, cabLen, paint, side = [], panX }) {
  return bilevel({ ...c, cabL: true, cabR: false }, {
    roof, sill, cornerR: 1.0, end: 0.6, noTrucks: true, nose, cabLen, badge: false, diaphragm: [3.2, roof - 1.4],
    paint: (c, g) => paint(c, g.L), rows: [],
    doors: [{ x: cabLen + 0.6, w: 2.2, y0: sill + 0.3, y1: sill + 6.6, glassY: 0.6, glassH: 0.25, grabs: false }],
    roofItems: [[cabLen + 4, 10, 0.5]],
    cab: () => path(poly(glass), C.glass),
    extra: (c, g) => {
      let s = truck(g.L / 2 - centers / 2, { wb: 9.2, d: 40, kind: "loco", top: sill }) + truck(g.L / 2 + centers / 2, { wb: 9.2, d: 40, kind: "loco", top: sill });
      for (const [x, w] of side) s += grille(x, sill + 3.6, w, 3.2);
      return s + pantograph(panX ?? g.L - 14, roof, { up: true, facing: -1 });
    },
  });
}

// --- Series 103 (Siemens Velaro E, 2005-09): 26 eight-car sets, 200 m,
// 8,800 kW spread under half the cars, 300 km/h (350 certified). End cars
// 25.68 m with a long tapered nose, middle cars 24.78 m; a single plug door
// at the ends of each car, small windows in a row; pantographs on two of
// the middle cars. Renfe white with the orange and aubergine stripes.
const V103 = { roof: 12.8, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 57, wb: 8.2, d: 36 }, diaphragm: [3.8, 11.8], badge: false };
const v103Door = (x) => ({ x, w: 2.6, y0: 3.6, y1: 10.6, glassY: 0.55, glassH: 0.3, grabs: false });
export const rf103Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...V103,
  nose: [[1.4, 3.4], [0.6, 4.1], ["q", 0.3, 5.2, 1.3, 6.0], [10.5, 10.9], ["q", 13.5, 12.8, 19.0, 12.8]],
  rows: [{ xs: seq(26.4, 3.95, 13), y: 7.6, w: 2.7, h: 2.3, r: 0.5 }],
  doors: [v103Door(21.6), v103Door(c.L - 4.0)], cabLen: 18,
  paint: (c, g) => rfPaint(g.L, { y: 5.3, nose: 18, roof: 11.9 }),
  cab: () => path(poly([[6.4, 8.4], [9.6, 10.5], [13.0, 11.6], [14.4, 10.0], [10.4, 8.6]]), C.glass),
  extra: () => underframe(26, 60, 3.4, { depth: 1.0, boxes: 3, tanks: false }),
});
export const rf103 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...V103,
  rows: [{ xs: seq(6.0, 3.95, 18), y: 7.6, w: 2.7, h: 2.3, r: 0.5 }],
  doors: [v103Door(1.4), v103Door(c.L - 4.0)],
  paint: (c, g) => rfPaint(g.L, { y: 5.3, roof: 11.9 }),
  extra: (c) => underframe(22, 60, 3.4, { depth: 1.0, boxes: 3, tanks: false }) + (c.index === 2 || c.index === c.count - 3 ? pantograph(c.L - 14, 12.8, { up: true, facing: -1 }) : ""),
});

// --- Series 102 and 112 (Talgo 350, power cars by Adtranz/Bombardier,
// 2005-10): 16 and 30 sets, a power car at each end of twelve Talgo
// coaches, 200 m, 8,000 kW, 330 km/h; the power cars' long flattened
// noses earned them the nickname "Pato" (duck). Avlo's 112s are purple.
const PATO = [[0.6, 2.9], [0.2, 3.6], ["q", 0.4, 4.4, 2.6, 4.7], [9.0, 6.0], ["q", 12.8, 7.2, 15.2, 9.8], ["q", 17.4, 12.9, 21.6, 12.9]];
export const rf112Power = (c) => powerCar(c, { nose: PATO, roof: 12.9, sill: 3.3, cabLen: 20, centers: 34,
  glass: [[11.8, 7.9], [14.2, 9.4], [16.4, 12.0], [19.6, 12.0], [19.6, 9.2], [15.0, 8.0]],
  side: [[25, 9], [37, 9]], paint: (c, L) => (isAvlo(c) ? avloPaint(L) : rfPaint(L, { y: 4.8, nose: 14 })) });
export const rf112Coach = (c) => talgoCoach(c, { roof: 11.2, rows: seq(5.4, 5.9, 6).map((x) => [x, 6.0, 4.0, 2.7]),
  paint: (c, L) => (isAvlo(c) ? avloPaint(L, { roof: 10.4, skirt: 2.6 }) : rfPaint(L, { y: 4.3, roof: 10.4, skirt: 2.6 })) });

// --- Series 106 (Talgo Avril, 2021-24): 30 sets, half of them variable
// gauge, two power cars and twelve wide, low Talgo coaches, 201.8 m, 8,800
// kW, 300 km/h in service. In AVE white (the Avlo sets purple).
const AVRIL = [[0.6, 3.0], [0.3, 3.8], ["q", 0.6, 4.8, 3.0, 5.4], [12.0, 9.2], ["q", 15.5, 12.5, 21.0, 12.6]];
export const rf106Power = (c) => powerCar(c, { nose: AVRIL, roof: 12.6, sill: 3.3, cabLen: 18, centers: 40,
  glass: [[7.8, 7.0], [12.6, 10.1], [16.0, 11.6], [17.0, 10.2], [11.8, 7.3]],
  side: [[30, 10], [44, 10], [58, 6]], paint: (c, L) => (isAvlo(c) ? avloPaint(L) : rfPaint(L, { y: 5.0, nose: 16 })) });
export const rf106Coach = (c) => talgoCoach(c, { roof: 11.8, sill: 2.4, rows: seq(6.2, 6.9, 5).map((x) => [x, 6.0, 5.2, 3.2]),
  paint: (c, L) => (isAvlo(c) ? avloPaint(L, { roof: 11.0, skirt: 2.4 }) : rfPaint(L, { y: 4.2, roof: 11.0, skirt: 2.4 })) });

// --- Series 100 (GEC-Alsthom and CAF, 1992): 22 sets on the TGV
// Atlantique pattern, two power cars and eight articulated trailers on
// shared trucks, 200 m, 8,800 kW, 300 km/h; the first AVEs, still
// Madrid–Seville. Power cars 22.13 m, trailers 18.7 m.
export const rf100Power = (c) => powerCar(c, {
  nose: [[0.8, 3.3], [0.4, 4.0], ["q", 0.6, 5.0, 2.4, 5.6], [8.6, 8.8], ["q", 10.6, 11.4, 13.2, 12.4], ["q", 14.4, 12.9, 17.0, 12.9]],
  roof: 12.9, sill: 3.3, cabLen: 15, centers: 46, glass: [[8.8, 9.0], [11.0, 11.0], [13.6, 12.1], [14.2, 10.2], [11.0, 9.0]],
  side: [[20, 12], [36, 12], [52, 8]], paint: (c, L) => rfPaint(L, { y: 5.0, nose: 12 }) });
export const rf100 = (c) => bilevel({ ...c, cabL: false, cabR: false }, {
  roof: 11.4, sill: 3.4, cornerR: 1.0, end: 0.3, noTrucks: true, diaphragm: [3.7, 10.6], badge: false,
  rows: [{ xs: seq(5.4, 4.7, 11), y: 6.9, w: 3.2, h: 2.4, r: 0.5 }],
  doors: [{ x: 1.0, w: 2.5, y0: 3.6, y1: 10.0, glassY: 0.55, glassH: 0.3, grabs: false }],
  paint: (c, g) => rfPaint(g.L, { y: 5.0, roof: 10.6 }),
  extra: (c, g) => truck(0, { wb: 9.8, d: 36, top: 3.4 }) + truck(g.L, { wb: 9.8, d: 36, top: 3.4 }),
});

// --- Series 130 (Talgo 250, power cars by Bombardier, 2007-10) and 730
// (15 of them made hybrid, with diesel generator cars): 45 sets, two power
// cars and eleven Talgo coaches, 184 m, 4,800 kW, 250 km/h, changing gauge
// on the move. Alvia, Euromed and Intercity services.
export const rf130Power = (c) => powerCar(c, {
  nose: [[0.8, 3.3], [0.4, 4.2], ["q", 0.6, 5.4, 2.4, 6.2], [6.4, 9.2], ["q", 8.6, 11.8, 11.0, 12.7], ["q", 12.4, 13.1, 14.6, 13.1]],
  roof: 13.1, sill: 3.3, cabLen: 12, centers: 38, glass: [[6.8, 9.6], [8.6, 11.6], [11.4, 12.4], [11.8, 10.0], [8.6, 9.4]],
  side: [[17, 10], [30, 10], [43, 8]], paint: (c, L) => rfPaint(L, { y: 5.0, nose: 10 }) });
export const rf130Coach = (c) => talgoCoach(c, { roof: 11.0, rows: seq(5.4, 5.9, 6).map((x) => [x, 5.9, 4.0, 2.6]),
  paint: (c, L) => rfPaint(L, { y: 4.3, roof: 10.2, skirt: 2.6 }) });

// --- Series 120 and 121 (CAF with Alstom, 2006-09): four-car electric
// units, 106.23 m, end cars 27.35 m and middle cars 25.78 m, 4,000 kW, 250
// km/h, changing gauge on the move; 120s on Alvia services, 121s on Avant.
// A tapered nose, a single plug door at each end of each car.
const S120 = { roof: 13.2, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 62, wb: 8.5, d: 34 }, diaphragm: [3.9, 12.0], badge: false };
const s120Door = (x) => ({ x, w: 2.6, y0: 3.8, y1: 10.9, glassY: 0.55, glassH: 0.3, grabs: false });
export const rf120Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...S120,
  nose: [[1.2, 3.6], [0.6, 4.4], ["q", 0.5, 5.8, 1.8, 6.8], [8.2, 11.2], ["q", 10.6, 13.2, 15.0, 13.2]],
  rows: [{ xs: seq(22.0, 5.1, 12), y: 7.2, w: 3.9, h: 2.6, r: 0.4 }],
  doors: [s120Door(17.4), s120Door(c.L - 4.0)], cabLen: 15,
  paint: (c, g) => rfPaint(g.L, { y: 5.4, nose: 14, roof: 12.3, skirt: 3.6 }),
  cab: () => path(poly([[5.0, 8.6], [8.6, 11.3], [11.2, 12.4], [12.2, 10.8], [8.6, 8.8]]), C.glass),
  extra: (c) => underframe(24, 64, 3.6, { depth: 1.1, boxes: 3, tanks: false }) + pantograph(c.L - 14, 13.2, { up: true, facing: -1 }),
});
export const rf120 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...S120,
  rows: [{ xs: seq(6.4, 5.1, 14), y: 7.2, w: 3.9, h: 2.6, r: 0.4 }],
  doors: [s120Door(1.4), s120Door(c.L - 4.0)],
  paint: (c, g) => rfPaint(g.L, { y: 5.4, roof: 12.3, skirt: 3.6 }),
  extra: () => underframe(22, 62, 3.6, { depth: 1.1, boxes: 3, tanks: false }),
});

// --- Series 104 (Alstom and CAF, 2004) and 114 (Alstom, 2008-10): the
// Avant's four-car "Pendolino" units (they don't tilt), 107 m, 4,000 kW,
// 250 km/h; 20 and 13 sets. A rounded nose under a deep windshield.
const P104 = { roof: 12.9, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 60, wb: 8.9, d: 34 }, diaphragm: [3.9, 11.8], badge: false };
export const rf104Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...P104,
  nose: [[1.0, 3.6], [0.5, 4.6], ["q", 0.4, 6.4, 1.6, 7.6], [5.6, 11.4], ["q", 7.6, 12.9, 11.0, 12.9]],
  rows: [{ xs: seq(17.6, 5.3, 12), y: 7.1, w: 4.2, h: 2.6, r: 0.5 }],
  doors: [s120Door(12.8), s120Door(c.L - 4.0)], cabLen: 11,
  paint: (c, g) => rfPaint(g.L, { y: 5.4, nose: 10, roof: 12.0, skirt: 3.6 }),
  cab: () => path(poly([[2.2, 8.0], [5.4, 11.0], [8.4, 12.2], [9.2, 9.6], [5.6, 8.2]]), C.glass),
  extra: (c) => underframe(20, 62, 3.6, { depth: 1.1, boxes: 3, tanks: false }) + pantograph(c.L - 12, 12.9, { up: true, facing: -1 }),
});
export const rf104 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...P104,
  rows: [{ xs: seq(6.0, 5.3, 14), y: 7.1, w: 4.2, h: 2.6, r: 0.5 }],
  doors: [s120Door(1.4), s120Door(c.L - 4.0)],
  paint: (c, g) => rfPaint(g.L, { y: 5.4, roof: 12.0, skirt: 3.6 }),
  extra: () => underframe(22, 62, 3.6, { depth: 1.1, boxes: 3, tanks: false }),
});

// --- Series 449 (CAF, 2008-11; Media Distancia electric) and 599 (CAF,
// 2008-10; diesel): one family's bulbous nose and big windshield. 449: 57
// five-car units on shared trucks, 98 m, 2,400 kW, 160 km/h. 599: 50
// three-car units, 76 m, four MTU engines, 160 km/h. A double plug door
// a side near each end of each car; individual windows.
const CAFMD = { roof: 13.4, sill: 3.6, cornerR: 1.0, end: 0.6, diaphragm: [3.9, 12.2], badge: false };
const CAF_NOSE = [[1.4, 3.6], [0.7, 4.4], ["q", 0.4, 5.9, 1.4, 7.4], [4.6, 11.4], ["q", 6.2, 13.4, 9.6, 13.4]];
const mdDoor = (x) => ({ x, w: 3.6, y0: 3.8, y1: 10.9, leaves: 2, glassY: 0.5, glassH: 0.35, grabs: false });
const cafCab = () => path(poly([[1.6, 7.6], [4.6, 11.2], [7.6, 12.6], [8.4, 9.4], [5.0, 7.8]]), C.glass);
const jakobs = (x) => truck(x, { wb: 8.5, d: 33, top: 3.6 });
export const rf449Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...CAFMD, noTrucks: true,
  nose: CAF_NOSE, rows: [{ xs: [...seq(22.6, 5.6, 6), 57.0], y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(16.6), mdDoor(c.L - 6.6)], cabLen: 10,
  paint: (c, g) => rfPaint(g.L, { y: 5.2, nose: 10, roof: 12.4, skirt: 3.6 }), cab: cafCab,
  extra: (c, g) => truck(13.0, { wb: 8.5, d: 36, top: 3.6 }) + jakobs(g.L) + pantograph(g.L - 16, 13.4, { up: true, facing: -1 }),
});
export const rf449 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...CAFMD, noTrucks: true,
  rows: [{ xs: seq(7.6, 5.6, 9), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(2.0)], paint: (c, g) => rfPaint(g.L, { y: 5.2, roof: 12.4, skirt: 3.6 }),
  extra: (c, g) => jakobs(0) + jakobs(g.L),
});
export const rf599Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...CAFMD,
  trucks: { centers: 57, wb: 8.5, d: 34 }, nose: CAF_NOSE, rows: [{ xs: seq(21.0, 5.6, 10), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(15.6), mdDoor(c.L - 5.6)], cabLen: 10,
  paint: (c, g) => rfPaint(g.L, { y: 5.2, nose: 10, roof: 12.4, skirt: 3.6 }), cab: cafCab,
  roofItems: [[c.L - 26, 12, 0.6]],
  extra: () => underframe(22, 60, 3.6, { depth: 1.4, boxes: 3 }),
});
export const rf599 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...CAFMD,
  trucks: { centers: 55, wb: 8.5, d: 34 }, rows: [{ xs: seq(7.6, 5.6, 11), y: 7.2, w: 4.6, h: 2.8, r: 0.4 }],
  doors: [mdDoor(2.0), mdDoor(c.L - 5.6)], paint: (c, g) => rfPaint(g.L, { y: 5.2, roof: 12.4, skirt: 3.6 }),
  extra: () => underframe(20, 58, 3.6, { depth: 1.2, boxes: 3 }),
});

// Cercanías: white, a red band low on the side, the cab's front red around
// the windshield. Rodalies (Catalonia): white, an orange front and orange
// doors, a thin red line under the windows.
const cerPaint = (c, L, { cab = false, roof = 12.3, skirt = 3.6, y = 4.6 } = {}) => {
  let s = rect(0, 0, L, 17, RF.white) + rect(0, roof, L, 3, RF.roof) + rect(0, 0, L, skirt, RF.skirt);
  if (isRodalies(c)) return s + rect(0, y + 2.2, L, 0.22, RF.red) + (cab ? rect(0, skirt, 3.2, roof - skirt, RF.rod) : "");
  return s + rect(0, y, L, 0.9, RF.red) + rect(0, y + 1.05, L, 0.18, "#8a9097") + (cab ? rect(0, skirt, 2.6, roof - skirt, RF.red) : "");
};
const cerDoor = (c, x, w = 4.3) => ({ x, w, y0: 3.7, y1: 10.9, leaves: 2, glassY: 0.45, glassH: 0.42, ...(isRodalies(c) ? { fill: RF.rod } : {}) });

// --- Civia (series 462-465; CAF, Alstom and Siemens, 2003-10): 248
// low-floor units of two to five cars, the 465 five-car set 98 m, 2,200
// kW, 120 km/h. Two double sliding doors a side on each car, big windows;
// the cab front a red surround on white.
const CIVIA = { roof: 12.6, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 44, wb: 8.2, d: 30 }, diaphragm: [3.6, 11.6], badge: false };
export const rfCiviaCab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...CIVIA,
  nose: [[1.0, 3.3], [0.7, 4.4], ["q", 0.6, 9.6, 1.6, 11.4], ["q", 2.4, 12.6, 4.4, 12.6]],
  rows: [{ xs: [9.8, 28.6, 34.0, 52.6, 58.0, 63.4], y: 6.8, w: 4.6, h: 3.0, r: 0.4 }],
  doors: [cerDoor(c, 20.0), cerDoor(c, 43.6)], cabLen: 6,
  paint: (c, g) => cerPaint(c, g.L, { cab: true, roof: 11.6, skirt: 3.3, y: 4.2 }),
  cab: () => path(poly([[0.8, 7.2], [1.3, 11.0], [5.4, 11.0], [5.4, 7.2]]), C.glass),
  extra: (c) => underframe(16, 46, 3.3, { depth: 1.0, boxes: 2, tanks: false }) + pantograph(c.L - 12, 12.6, { up: true, facing: -1 }),
});
export const rfCivia = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...CIVIA,
  rows: [{ xs: [2.4, 20.4, 25.8, 31.2, 49.8, 55.2], y: 6.8, w: 4.6, h: 3.0, r: 0.4 }],
  doors: [cerDoor(c, 11.6), cerDoor(c, 40.8)],
  paint: (c, g) => cerPaint(c, g.L, { roof: 11.6, skirt: 3.3, y: 4.2 }),
  extra: () => underframe(14, 44, 3.3, { depth: 1.0, boxes: 2, tanks: false }),
});

// --- Series 446 (1989-93) and 447 (1992-2001; CAF, Alstom, Siemens, ABB):
// three-car units, a motor car with a cab at each end and a trailer
// between, 76 m, 2,400 kW; 170 and 183 built. Three pairs of sliding
// doors a side on every car.
const S447 = { roof: 13.2, sill: 3.7, cornerR: 1.0, end: 0.6, trucks: { centers: 56, wb: 8.5, d: 34 }, diaphragm: [3.9, 12.0], badge: false };
export const rf447Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...S447,
  nose: [[0.9, 3.7], [0.7, 9.8], ["q", 0.8, 12.0, 2.0, 12.8], ["q", 2.8, 13.2, 4.2, 13.2]],
  rows: [{ xs: [6.2, 21.2, 26.2, 45.0, 50.0, 69.2, 74.2], y: 7.3, w: 4.0, h: 2.7, r: 0.3 }],
  doors: [cerDoor(c, 11.8, 4.2), cerDoor(c, 35.6, 4.2), cerDoor(c, 59.4, 4.2)], cabLen: 4,
  paint: (c, g) => cerPaint(c, g.L, { cab: true }),
  cab: () => path(poly([[0.8, 7.8], [1.2, 11.6], [4.0, 11.6], [4.0, 7.8]]), C.glass),
  extra: (c) => underframe(16, 58, 3.7, { depth: 1.3, boxes: 3 }) + pantograph(c.L - 12, 13.2, { up: true, facing: -1 }),
});
export const rf447 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...S447,
  rows: [{ xs: [2.4, 17.4, 22.4, 41.2, 46.2, 65.2, 70.2], y: 7.3, w: 4.0, h: 2.7, r: 0.3 }],
  doors: [cerDoor(c, 8.0, 4.2), cerDoor(c, 31.8, 4.2), cerDoor(c, 55.6, 4.2)],
  paint: (c, g) => cerPaint(c, g.L),
  extra: () => underframe(16, 56, 3.7, { depth: 1.1, boxes: 2 }),
});

// --- Series 450 and 451 (GEC-Alsthom and CAF, 1993-95): double-deck
// units, 24 six-car 450s (two motor cars with cabs and four trailers,
// 159.4 m) and 12 three-car 451s, 2,960 kW, 140 km/h, on Madrid's and
// Barcelona's busiest lines. Two pairs of plug doors a side on every car,
// the low deck dropped between the trucks.
const S450 = { roof: 14.6, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 61, wb: 8.5, d: 36 }, diaphragm: [4.0, 12.6], badge: false,
  ends: { h: 13.6, len: 12, ramp: 3 } };
const dd450 = (c, g, cab) => cerPaint(c, g.L, { cab, roof: 13.2, skirt: 3.9, y: 4.4 }) + rect(cab ? 6 : 0, 10.0, g.L - (cab ? 6 : 0), 2.2, RF.band, 0, 'rx="0.4"');
export const rf450Cab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...S450, drop: { a: 17.5, b: c.L - 17.5, y: 1.6 },
  nose: [[0.9, 3.9], [0.7, 10.0], ["q", 0.8, 12.6, 2.2, 13.3], ["q", 3.0, 13.6, 4.4, 13.6]],
  rows: [{ xs: seq(27.2, 5.4, 6), y: 10.1, w: 4.2, h: 2.0, r: 0.3 }, { xs: seq(27.2, 5.4, 6), y: 5.0, w: 4.2, h: 2.2, r: 0.3 }, { xs: [9.4, 75.4], y: 7.6, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [cerDoor(c, 19.8, 4.4), { ...cerDoor(c, c.L - 21.8, 4.4) }].map((d) => ({ ...d, y0: 1.7, y1: 9.6 })), cabLen: 5,
  paint: (c, g) => dd450(c, g, true),
  cab: () => path(poly([[0.8, 8.6], [1.2, 12.4], [4.4, 12.4], [4.4, 8.6]]), C.glass),
  extra: (c) => pantograph(c.L - 8, 13.6, { up: true, facing: -1 }),
});
export const rf450 = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...S450, drop: { a: 17.5, b: c.L - 17.5, y: 1.6 },
  rows: [{ xs: seq(27.2, 5.4, 6), y: 10.1, w: 4.2, h: 2.0, r: 0.3 }, { xs: seq(27.2, 5.4, 6), y: 5.0, w: 4.2, h: 2.2, r: 0.3 }, { xs: [5.6, 77.4], y: 7.6, w: 4.0, h: 2.4, r: 0.3 }],
  doors: [cerDoor(c, 19.8, 4.4), cerDoor(c, c.L - 24.2, 4.4)].map((d) => ({ ...d, y0: 1.7, y1: 9.6 })),
  paint: (c, g) => dd450(c, g, false),
});

// --- The metre-gauge network Renfe took over from FEVE in 2013
// (Cercanías in Asturias, Cantabria, Bilbao, León, Ferrol and Cartagena):
// electric units of series 433-438 and diesel 526-529, mostly two or three
// short cars. Drawn as one generic three-car unit in Cercanías colors.
const MET = { roof: 11.8, sill: 3.2, cornerR: 0.9, end: 0.5, trucks: { centers: 40, wb: 7.0, d: 28 }, diaphragm: [3.4, 10.8], badge: false };
export const rfMetCab = (c) => bilevel({ ...c, cabL: true, cabR: false }, { ...MET,
  nose: [[0.9, 3.2], [0.7, 8.8], ["q", 0.8, 10.8, 2.0, 11.5], ["q", 2.6, 11.8, 3.8, 11.8]],
  rows: [{ xs: [5.6, 19.4, 24.0, 28.6, 43.4, 48.0], y: 6.6, w: 3.6, h: 2.5, r: 0.3 }],
  doors: [cerDoor(c, 10.8, 3.6), cerDoor(c, 34.4, 3.6)].map((d) => ({ ...d, y0: 3.3, y1: 9.9 })), cabLen: 4,
  paint: (c, g) => cerPaint(c, g.L, { cab: true, roof: 11.0, skirt: 3.2, y: 4.0 }),
  cab: () => path(poly([[0.8, 7.0], [1.2, 10.4], [3.6, 10.4], [3.6, 7.0]]), C.glass),
  extra: () => underframe(14, 42, 3.2, { depth: 1.0, boxes: 2 }),
});
export const rfMet = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...MET,
  rows: [{ xs: [2.0, 15.8, 20.4, 25.0, 39.8, 44.4], y: 6.6, w: 3.6, h: 2.5, r: 0.3 }],
  doors: [cerDoor(c, 7.4, 3.6), cerDoor(c, 30.8, 3.6)].map((d) => ({ ...d, y0: 3.3, y1: 9.9 })),
  paint: (c, g) => cerPaint(c, g.L, { roof: 11.0, skirt: 3.2, y: 4.0 }),
  extra: (c) => underframe(12, 40, 3.2, { depth: 1.0, boxes: 2 }) + pantograph(c.L / 2, 11.8, { up: true }),
});

export const TYPES = {
  rf103Cab: { name: "Series 103 end car", kind: "emu", amenities: ["first", "cafe"] },
  rf103: { name: "Series 103 car", kind: "emu", amenities: ["first", "cafe"] },
  rf112Power: { name: "Series 102/112 power car", kind: "electric", pan: true },
  rf112Coach: { name: "Series 102/112 Talgo coach", kind: "talgo", amenities: ["first", "cafe"] },
  rf106Power: { name: "Series 106 Avril power car", kind: "electric", pan: true },
  rf106Coach: { name: "Series 106 Avril coach", kind: "talgo", amenities: ["first", "cafe"] },
  rf100Power: { name: "Series 100 power car", kind: "electric", pan: true },
  rf100: { name: "Series 100 trailer", kind: "coach", amenities: ["first", "cafe"] },
  rf130Power: { name: "Series 130 power car", kind: "electric", pan: true },
  rf130Coach: { name: "Series 130 Talgo coach", kind: "talgo", amenities: ["first", "cafe"] },
  rf120Cab: { name: "Series 120/121 end car", kind: "emu", pan: true },
  rf120: { name: "Series 120/121 car", kind: "emu" },
  rf104Cab: { name: "Series 104/114 end car", kind: "emu", pan: true },
  rf104: { name: "Series 104/114 car", kind: "emu" },
  rf449Cab: { name: "Series 449 end car", kind: "emu", pan: true },
  rf449: { name: "Series 449 car", kind: "emu" },
  rf599Cab: { name: "Series 599 end car", kind: "emu" },
  rf599: { name: "Series 599 car", kind: "emu" },
  rfCiviaCab: { name: "Civia end car", kind: "emu", pan: true },
  rfCivia: { name: "Civia car", kind: "emu" },
  rf447Cab: { name: "Series 447 motor car", kind: "emu", pan: true },
  rf447: { name: "Series 447 trailer", kind: "emu" },
  rf450Cab: { name: "Series 450 double-deck motor car", kind: "bilevel", emu: true, pan: true },
  rf450: { name: "Series 450 double-deck trailer", kind: "bilevel", emu: true },
  rfMetCab: { name: "Metre-gauge unit end car", kind: "emu" },
  rfMet: { name: "Metre-gauge unit car", kind: "emu", pan: true },
};
// oneEnd: single-cab equipment, drawn cab-left and mirrored at the back of
// a train. variant: Avlo's purple and Rodalies' orange are the same cars
// painted differently.
const paintVariant = (c) => (isAvlo(c) ? "avlo" : isRodalies(c) ? "rod" : "");
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: paintVariant });
export const MODELS = {
  rf103Cab: M(rf103Cab, 84.2, true), rf103: M(rf103, 81.3),
  rf112Power: M(rf112Power, 65.6, true), rf112Coach: M(rf112Coach, 43.1),
  rf106Power: M(rf106Power, 75, true), rf106Coach: M(rf106Coach, 42.65),
  rf100Power: M(rf100Power, 72.6, true), rf100: M(rf100, 61.35),
  rf130Power: M(rf130Power, 68.1, true), rf130Coach: M(rf130Coach, 43.1),
  rf120Cab: M(rf120Cab, 89.7, true), rf120: M(rf120, 84.6),
  rf104Cab: M(rf104Cab, 89.0, true), rf104: M(rf104, 86.6),
  rf449Cab: M(rf449Cab, 69.5, true), rf449: M(rf449, 61.8),
  rf599Cab: M(rf599Cab, 85.0, true), rf599: M(rf599, 79.1),
  rfCiviaCab: M(rfCiviaCab, 70.5, true), rfCivia: M(rfCivia, 60.4),
  rf447Cab: M(rf447Cab, 85.0, true), rf447: M(rf447, 79.3),
  rf450Cab: M(rf450Cab, 87.2, true), rf450: M(rf450, 87.2),
  rfMetCab: M(rfMetCab, 58.0, true), rfMet: M(rfMet, 54.0),
};

const set = (label, ...units) => ({ label, units });
const sets = {
  s103: set("Series 103 (Siemens Velaro) trainset, 8 cars", ["rf103Cab", 1], ["rf103", 6], ["rf103Cab", 1]),
  s112: set("Series 112 or 102 (Talgo 350) trainset: two power cars and twelve coaches", ["rf112Power", 1], ["rf112Coach", 12], ["rf112Power", 1]),
  avlo: set("Avlo Series 112 (Talgo 350) trainset, some Avlo trains Series 106", ["rf112Power", 1], ["rf112Coach", 12], ["rf112Power", 1]),
  s106: set("Series 106 (Talgo Avril) trainset: two power cars and twelve coaches", ["rf106Power", 1], ["rf106Coach", 12], ["rf106Power", 1]),
  s100: set("Series 100 trainset: two power cars and eight trailers (some trains Series 102 or 112)", ["rf100Power", 1], ["rf100", 8], ["rf100Power", 1]),
  s130: set("Series 130 (Talgo 250) trainset: two power cars and eleven coaches (Series 730 hybrids on some routes)", ["rf130Power", 1], ["rf130Coach", 11], ["rf130Power", 1]),
  s120: set("Series 120 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  s121: set("Series 121 (CAF) four-car unit, sometimes two coupled", ["rf120Cab", 1], ["rf120", 2], ["rf120Cab", 1]),
  s104: set("Series 104 or 114 four-car unit", ["rf104Cab", 1], ["rf104", 2], ["rf104Cab", 1]),
  s449: set("Series 449 five-car electric unit (older 440 and 470 units on some lines)", ["rf449Cab", 1], ["rf449", 3], ["rf449Cab", 1]),
  s599: set("Series 599 three-car diesel unit", ["rf599Cab", 1], ["rf599", 1], ["rf599Cab", 1]),
  civia: set("Civia electric unit, usually 5 cars (some trains Series 446 or 447)", ["rfCiviaCab", 1], ["rfCivia", 3], ["rfCiviaCab", 1]),
  s447: set("Series 447 or 446 three-car unit, often two coupled (some trains Civia)", ["rf447Cab", 1], ["rf447", 1], ["rf447Cab", 1]),
  s450: set("Series 450 six-car double-deck unit (Series 451 three-car sets on some trains)", ["rf450Cab", 1], ["rf450", 4], ["rf450Cab", 1]),
  met: set("Metre-gauge unit (series 433-438 electric or 526-529 diesel, drawn as one)", ["rfMetCab", 1], ["rfMet", 1], ["rfMetCab", 1]),
};
// Where a long-distance train runs, from its first and last stations.
const ends = (t) => `${t.origin || ""} ${t.destination || ""}`;
// Media Distancia lines that aren't electrified, run with diesel 599s.
const DIESEL = /Badajoz|C[áa]ceres|M[ée]rida|Zafra|Plasencia|Huelva|Almer[íi]a|Granada|Guadix|Soria|Teruel|Cuenca|Zamora|Sanabria|Ferrol|Lugo|Monforte|Talavera|Algeciras|Ronda|Linares|Ja[ée]n|Cartagena|[ÁA]guilas|Alcoi|Alcoy|Utiel|Huesca|Canfranc|Valen[çc]a|Porto|Vigo|Pontevedra/;
export const TYPICAL = {
  renfe: (t) => {
    const e = ends(t);
    switch (t.route) {
      case "AVE":
        if (/Barcelona|Figueres|Girona|M[áa]laga/.test(e)) return sets.s103;
        if (/Coru|Vigo|Santiago|Ourense|Gij[óo]n|Oviedo|Pontevedra/.test(e)) return sets.s106;
        if (/Sevilla/.test(e) && /Madrid/.test(e)) return sets.s100;
        return sets.s112;
      case "AVE Internacional": return sets.s106;
      case "Avlo": return sets.avlo;
      case "Alvia": return /Pamplona|Logro|Hendaya|Ir[úu]n|Salamanca|Huelva/.test(e) ? sets.s120 : sets.s130;
      case "Euromed": case "Intercity": return sets.s130;
      case "Avant": case "Avant Exprés": return /Lleida|Ourense|Coru|Santiago|Vigo|Pontevedra|Calatayud|Zaragoza/.test(e) ? sets.s121 : sets.s104;
      default: return DIESEL.test(e) ? sets.s599 : sets.s449;
    }
  },
  cercanias: (t) => {
    const [line, ...rest] = (t.route || "").split(" "), core = rest.join(" ");
    const n = Number((line.match(/\d+/) || [0])[0]);
    if (line === "T1") return null;                                     // Cádiz's tram-train isn't Renfe's
    if (core === "Rodalies") return /^R2/.test(line) ? sets.s450 : sets.s447;
    if (/Le[óo]n|Ferrol|Cartagena/.test(core) || (core === "Asturias" && n >= 4) || (core === "Bilbao" && n >= 4) || (core === "Santander" && n >= 2)) return sets.met;
    if (/Valencia|Bilbao|San Sebasti|Murcia|Santander/.test(core)) return sets.s447;
    return sets.civia;
  },
};

// Facts come in km/h and kW; the page converts them back for display.
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/", ES = "https://es.wikipedia.org/wiki/";
export const FACTS = {
  rf103Cab: { model: "Siemens Velaro E (Series 103)", type: "High-speed electric multiple unit", builder: "Siemens", built: "2005–2009", fleet: "26 eight-car sets",
    topSpeedMph: kmh(300), powerHp: kw(8800), seats: 404, lengthFt: 84.2,
    about: "Renfe's AVE on Madrid–Barcelona and Madrid–Málaga, the second Velaro after Germany's ICE 3. Seats are for the whole set; one reached 403.7 km/h in a 2006 test, then a record for an unmodified train.", source: `${WP}Renfe_Class_103` },
  rf103: { model: "Series 103 middle car", type: "High-speed electric multiple unit", builder: "Siemens", built: "2005–2009", fleet: "26 eight-car sets",
    topSpeedMph: kmh(300), powerHp: kw(8800), lengthFt: 81.3,
    about: "A middle car of the Velaro E. Its traction motors are spread under half the train's cars rather than in power cars.", source: `${WP}Renfe_Class_103` },
  rf112Power: { model: "Talgo 350 (Series 102 and 112)", type: "High-speed power car", builder: "Talgo, with Adtranz/Bombardier", built: "2005–2010",
    fleet: "16 Series 102 and 30 Series 112 sets", topSpeedMph: kmh(330), powerHp: kw(8000), lengthFt: 65.6,
    about: "Each Talgo 350 has a power car at both ends of twelve articulated coaches; the long, flattened nose gave it the nickname \"Pato\" (duck). Avlo's low-cost trains are 112s in purple.", source: `${WP}Renfe_Class_102` },
  rf112Coach: { model: "Talgo 350 coach (Series 102 and 112)", type: "Articulated coach", builder: "Talgo", built: "2005–2010",
    fleet: "12 per set", topSpeedMph: kmh(330), seats: 353, lengthFt: 43.1,
    about: "Talgo's short coaches ride on single wheel pairs at the joints, not trucks. Seats are for the whole set (316 on a 102, 353 on a 112).", source: `${WP}Renfe_Class_102` },
  rf106Power: { model: "Talgo Avril (Series 106)", type: "High-speed power car", builder: "Talgo", built: "2016–2024", fleet: "30 sets, 15 of them variable gauge",
    topSpeedMph: kmh(300), powerHp: kw(8800), lengthFt: 75,
    about: "Talgo's newest high-speed train, in AVE service since May 2024 to Asturias and Galicia, its variable-gauge sets running on into the Iberian-gauge network.", source: `${WP}Talgo_AVRIL` },
  rf106Coach: { model: "Talgo Avril coach (Series 106)", type: "Articulated coach", builder: "Talgo", built: "2016–2024", fleet: "12 per set",
    topSpeedMph: kmh(300), seats: 507, lengthFt: 42.65,
    about: "The Avril's coaches are wide and low, with the floor at platform height. Seats are for the whole set: 507, or 581 in the Avlo layout.", source: `${WP}Talgo_AVRIL` },
  rf100Power: { model: "Series 100 power car", type: "High-speed power car", builder: "GEC-Alsthom and CAF", built: "1992", fleet: "22 sets",
    topSpeedMph: kmh(300), powerHp: kw(8800), lengthFt: 72.6,
    about: "The first AVE, built on the TGV Atlantique design for the 1992 Madrid–Seville line it still mostly serves. Refurbished in 2007–12.", source: `${WP}Renfe_Class_100` },
  rf100: { model: "Series 100 trailer", type: "Articulated coach", builder: "GEC-Alsthom and CAF", built: "1992", fleet: "8 per set",
    topSpeedMph: kmh(300), seats: 332, lengthFt: 61.35,
    about: "The eight trailers between the power cars share trucks at their joints, as on a TGV. Seats are for the whole set.", source: `${WP}Renfe_Class_100` },
  rf130Power: { model: "Talgo 250 (Series 130 and 730)", type: "Dual-gauge power car", builder: "Talgo and Bombardier", built: "2007–2010",
    fleet: "45 sets; 15 rebuilt as hybrid Series 730", topSpeedMph: kmh(250), powerHp: kw(4800), lengthFt: 68.1,
    about: "Alvia's gauge-changing trains, which switch between the standard-gauge high-speed lines and the Iberian-gauge network without stopping; also Euromed and Intercity services. The 730s add diesel generator cars for unelectrified lines.", source: `${WP}Renfe_Class_130` },
  rf130Coach: { model: "Talgo 250 coach (Series 130)", type: "Articulated coach", builder: "Talgo", built: "2007–2010", fleet: "11 per set",
    topSpeedMph: kmh(250), seats: 299, lengthFt: 43.1,
    about: "Talgo Series 7 coaches with gauge-changing wheel pairs. Seats are for the whole set, 63 of them first class.", source: `${WP}Renfe_Class_130` },
  rf120Cab: { model: "CAF Series 120 and 121", type: "Dual-gauge electric multiple unit", builder: "CAF, with Alstom", built: "2006–2009",
    fleet: "57 Series 120, 29 Series 121", topSpeedMph: kmh(250), powerHp: kw(4000), seats: 238, lengthFt: 89.7,
    about: "Four-car gauge-changing units: the 120s run Alvia services such as Madrid–Pamplona and Barcelona–Bilbao, the 121s Avant services in Catalonia and Galicia. Seats are for a Series 120 set.", source: `${WP}Renfe_Class_120` },
  rf120: { model: "Series 120 and 121 middle car", type: "Dual-gauge electric multiple unit", builder: "CAF, with Alstom", built: "2006–2009",
    fleet: "57 Series 120, 29 Series 121", topSpeedMph: kmh(250), powerHp: kw(4000), lengthFt: 84.6,
    about: "A middle car of the CAF dual-gauge unit, which changes gauge on the move at about 30 km/h.", source: `${WP}Renfe_Class_120` },
  rf104Cab: { model: "Series 104 and 114", type: "High-speed electric multiple unit", builder: "Alstom (104 with CAF)", built: "2004, 2008–2010",
    fleet: "20 Series 104, 13 Series 114", topSpeedMph: kmh(250), powerHp: kw(4000), lengthFt: 89.0,
    about: "The Avant's four-car units, from Alstom's Pendolino family without the tilt: the 104s Madrid–Toledo and Ciudad Real, the 114s Madrid–Segovia–Valladolid.", source: `${WP}Renfe_Class_104` },
  rf104: { model: "Series 104 and 114 middle car", type: "High-speed electric multiple unit", builder: "Alstom (104 with CAF)", built: "2004, 2008–2010",
    fleet: "20 Series 104, 13 Series 114", topSpeedMph: kmh(250), lengthFt: 86.6,
    about: "A middle car of the Avant's four-car units.", source: `${WP}Renfe_Class_104` },
  rf449Cab: { model: "CAF Series 449", type: "Electric multiple unit", builder: "CAF, Mitsubishi traction", built: "2008–2011", fleet: "57 five-car units",
    topSpeedMph: kmh(160), powerHp: kw(2400), seats: 263, lengthFt: 69.5,
    about: "Renfe's Media Distancia electric unit, five cars on shared trucks, up to three coupled. Seats are for the whole unit.", source: `${ES}Serie_449_de_Renfe` },
  rf449: { model: "Series 449 middle car", type: "Electric multiple unit", builder: "CAF, Mitsubishi traction", built: "2008–2011", fleet: "57 five-car units",
    topSpeedMph: kmh(160), powerHp: kw(2400), lengthFt: 61.8,
    about: "A middle car of the 449, sharing a truck with each neighbor.", source: `${ES}Serie_449_de_Renfe` },
  rf599Cab: { model: "CAF Series 599", type: "Diesel multiple unit", builder: "CAF", built: "2008–2010", fleet: "50 three-car units",
    topSpeedMph: kmh(160), powerHp: kw(1400), seats: 185, lengthFt: 85,
    about: "The diesel sister of the 449, on Media Distancia lines without wires: Extremadura, Madrid–Soria, Granada–Almería, Galicia and more. Seats are for the whole unit.", source: `${ES}Serie_599_de_Renfe` },
  rf599: { model: "Series 599 middle car", type: "Diesel multiple unit", builder: "CAF", built: "2008–2010", fleet: "50 three-car units",
    topSpeedMph: kmh(160), lengthFt: 79.1,
    about: "The 599's middle trailer; the two end cars carry its four diesel engines.", source: `${ES}Serie_599_de_Renfe` },
  rfCiviaCab: { model: "Civia (Series 462–465)", type: "Electric multiple unit", builder: "CAF, Alstom and Siemens", built: "2003–2010",
    fleet: "248 units of 2 to 5 cars", topSpeedMph: kmh(120), powerHp: kw(2200), seats: 277, lengthFt: 70.5,
    about: "The low-floor Cercanías train built from interchangeable cars, from the two-car 462 to the five-car 465; most Cercanías networks run them. Seats are for a five-car 465.", source: `${ES}Civia` },
  rfCivia: { model: "Civia middle car", type: "Electric multiple unit", builder: "CAF, Alstom and Siemens", built: "2003–2010",
    fleet: "248 units of 2 to 5 cars", topSpeedMph: kmh(120), lengthFt: 60.4,
    about: "A middle car of a Civia; the low-floor section is in one of them, with space for bicycles and wheelchairs.", source: `${ES}Civia` },
  rf447Cab: { model: "Series 447 (and 446)", type: "Electric multiple unit", builder: "CAF, Alstom, Siemens, ABB and Adtranz", built: "1992–2001 (446: 1989–1993)",
    fleet: "183 Series 447, 170 Series 446 built", topSpeedMph: kmh(120), powerHp: kw(2400), seats: 234, lengthFt: 85,
    about: "Three-car commuter units, a motor car with a cab at each end: the 447s across Rodalies, Valencia, Bilbao and other networks, the slower 446s in Madrid and Bilbao. Seats are for the whole unit.", source: `${ES}Serie_447_de_Renfe` },
  rf447: { model: "Series 447 trailer", type: "Electric multiple unit", builder: "CAF, Alstom, Siemens, ABB and Adtranz", built: "1992–2001",
    fleet: "183 Series 447 built", topSpeedMph: kmh(120), lengthFt: 79.3,
    about: "The unpowered middle car of a 446 or 447, three pairs of doors a side like the motor cars.", source: `${ES}Serie_447_de_Renfe` },
  rf450Cab: { model: "Series 450 and 451", type: "Double-deck electric multiple unit", builder: "GEC-Alsthom and CAF", built: "1993–1995",
    fleet: "24 six-car 450s, 12 three-car 451s", topSpeedMph: kmh(140), powerHp: kw(2960), seats: 1008, lengthFt: 87.2,
    about: "Spain's double-deck commuter units, first run as push-pull trains behind locomotives and later given motor cars. Madrid and Barcelona; the 451s only on Rodalies' R2. Seats are for a six-car 450.", source: `${ES}Serie_450_de_Renfe` },
  rf450: { model: "Series 450 double-deck trailer", type: "Double-deck electric multiple unit", builder: "GEC-Alsthom and CAF", built: "1993–1995",
    fleet: "24 six-car 450s, 12 three-car 451s", topSpeedMph: kmh(140), lengthFt: 87.2,
    about: "A double-deck trailer of the 450, its lower deck dropped between the trucks.", source: `${ES}Serie_450_de_Renfe` },
  rfMetCab: { model: "Metre-gauge Cercanías unit", type: "Electric or diesel multiple unit", builder: "Several (mostly CAF)",
    fleet: "Series 433–438 electric, 526–529 diesel",
    about: "The former FEVE narrow-gauge lines Renfe has run since 2013 use a mix of short electric and diesel units; Trainsheet draws them as one. Exact models vary by line.", source: `${WP}Renfe_Operadora` },
  rfMet: { model: "Metre-gauge Cercanías unit, middle car", type: "Electric or diesel multiple unit", builder: "Several (mostly CAF)",
    fleet: "Series 433–438 electric, 526–529 diesel",
    about: "A middle car of a metre-gauge unit, drawn generically.", source: `${WP}Renfe_Operadora` },
};
