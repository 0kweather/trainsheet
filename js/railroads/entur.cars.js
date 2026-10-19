// Norway's passenger cars (Vy, Go-Ahead Norge, Flytoget and SJ Nord,
// scripts/railroads/entur.py): Trainsheet's own side views from each model's
// published dimensions. Norske tog owns nearly all of them and leases them
// to the operators, and each operator paints them its own way: Vy's deep
// green with a black front and its name in pale letters, Go-Ahead's navy
// streaked with light blue, SJ's anthracite (its El 18s silver), and
// Flytoget's silver over a dark window band. Flytoget's positions name
// the unit ("71-14"), so its trains are drawn as that model; the others'
// trains are what typically runs on their line.

import { bilevel, cabUnit, coachCar } from "../carmodels.js?v=dev";
import { rect, path, line, lines, poly, slats, win, truck, pantograph, C } from "../carart.js?v=dev";
import { bothEnds, lok2000, flirt, letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, emuFront, buffers, boxes, frames, strokes } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const ROOF = "#8f979f", MASK = "#17191c";
// Each operator's paint: body, a deeper shade for the skirt and front,
// an accent; decor(c, L, part) draws its graphic on a car side (clipped to
// the body) and mark(c, x, y, h) letters its name.
const LIVERY = {
  vy: { body: "#0f5247", deep: "#0a3a33", accent: "#7cc5a6", band: "#13302b", door: "#17675a",
    mark: (c, x, y, h) => letters(c, x, y, h, "vy", "#e3eeea", { weight: 800, spacing: -0.04 * h, stretch: 1.1 }),
    decor: (c, L) => rect(0, 4.55, L, 0.22, "#7cc5a6") },
  goaheadnorge: { body: "#1e2c5b", deep: "#131d40", accent: "#5aa5dc", band: "#141a30", door: "#2a3c78",
    mark: (c, x, y, h) => letters(c, x, y, h, "Go-Ahead", "#ffffff", { weight: 700, italic: true, spacing: -0.02 * h }),
    // Light blue streaks raking back across the side in two sweeps.
    decor: (c, L) => [0.42, 0.8].map((f) => strokes(L * f, 0, 13.0, 4, { w: 0.55, gap: 1.6, lean: 9.0, fills: ["#5aa5dc", "#9fd0f0", "#3d7cc4", "#9fd0f0"] })).join("") },
  sjnord: { body: "#3a3d42", deep: "#26282c", accent: "#c4c9ce", band: "#1c1e21", door: "#4a4e54",
    mark: (c, x, y, h) => letters(c, x, y, h, "SJ", "#ffffff", { weight: 800, spacing: 0.02 * h }),
    decor: (c, L) => rect(0, 5.0, L, 0.3, "#c4c9ce") + rect(0, 4.6, L, 0.12, "#8d949c") },
  flytoget: { body: "#c4c8cd", deep: "#6d6e71", accent: "#3d4146", band: "#2a2d31", door: "#b2b7bd",
    mark: (c, x, y, h) => letters(c, x, y, h, "flytoget", "#3d4146", { weight: 700, spacing: 0.01 * h }),
    decor: (c, L) => rect(0, 5.3, L, 0.16, "#6d6e71") },
};
const liv = (c) => LIVERY[c.agency] || LIVERY.vy;

// Common detail of the Norwegian units' cab ends: the windshield's glass,
// a sky reflection and wiper, headlights and a red marker low on the
// nose, a light over the windshield, the coupler under its deflector.
const cabFront = ({ glass, refl, wipe, low, top, noseX, sill }) =>
  path(poly(glass), C.glass) + (refl ? path(poly(refl), C.glassLight) : "") + wiper(...wipe) +
  lamp(low[0], low[1], 0.55, 0.42) + lamp(low[0] + 0.05, low[1] - 0.75, 0.38, 0.3, RED_LAMP) + (top ? lamp(top[0], top[1], 0.6, 0.25) : "") + emuFront(noseX, sill, { coupler: 3.1 });

// --- Adtranz Type 73 "Signatur" (22 four-car tilting units, 1999-2002):
// 108.5 m, end cars about 27.9 m and middle cars 26.3 m; a long, blunt nose
// with the windshield set well back in a black mask; a plug door a side
// behind the cab and at each end of the middle cars, big windows in a dark
// band; the tilting body over skirted bogies, air conditioning over each
// car, the pantographs on the middle cars. The operator's color, its
// deeper shade along the skirt and up the nose, its name by the door.
const T73 = { roof: 12.6, sill: 3.7, cornerR: 0.9, end: 0.6, trucks: { centers: 62.3, wb: 8.9, d: 36 }, diaphragm: [4.0, 11.5], badge: false };
const t73Paint = (nose) => (c, g) => {
  const L = g.L, k = liv(c);
  let s = rect(0, 0, L, 17, k.body) + rect(0, 11.7, L, 2, ROOF) + line(0, 11.7, L, 11.7, "rgba(0,0,0,0.2)", 0.5) +
    rect(0, 6.3, L, 3.4, k.band) + rect(0, 0, L, 4.4, k.deep) + rect(0, 4.4, L, 0.15, "rgba(0,0,0,0.25)") + k.decor(c, L, nose ? "cab" : "mid");
  if (nose) s += rect(0, 6.3, 12.0, 3.4, k.body) + path("M0 4.4L0 7.0L3.0 7.0Q6.4 6.0 9.6 4.4Z", k.deep) +
    path(poly([[2.2, 7.35], [6.1, 11.25], [9.6, 11.25], [9.6, 8.6], [5.0, 7.35]]), MASK) + k.mark(c, 26.0, 5.35, 1.15);
  else s += k.mark(c, 12.5, 5.35, 1.15);
  return s;
};
const t73Door = (x) => ({ x, w: 2.9, y0: 3.9, y1: 10.8, glassY: 0.55, glassH: 0.3, grabs: false });
const t73Under = (L) => boxes(L / 2 - 22, L / 2 + 22, 3.7, 4, 0.95) + path(`M${L / 2 - 26} 3.7L${L / 2 + 26} 3.7L${L / 2 + 25.5} 3.2L${L / 2 - 25.5} 3.2Z`, "#2f3338");
const type73Cab = (c) => bilevel({ ...c, cabL: true }, { ...T73,
  nose: [[2.2, 3.7], [0.9, 4.8], ["q", 0.45, 6.0, 1.4, 7.2], [6.2, 11.4], ["q", 7.6, 12.6, 10.4, 12.6]], cabLen: 11,
  rows: [{ xs: seq(17.6, 5.3, 13), y: 6.65, w: 4.2, h: 2.7, r: 0.35 }], doors: [t73Door(12.8)], paint: t73Paint(true),
  extra: (c, g) => t73Under(g.L) + hvac(30, g.roof, 13) + roofCover(60, g.roof, 10, 0.45) + horns(11.0, g.roof - 0.02),
  cab: () => cabFront({ glass: [[2.6, 7.7], [6.3, 10.95], [9.2, 10.95], [9.2, 8.9], [5.2, 7.7]], refl: [[3.0, 7.95], [5.0, 9.7], [5.8, 9.7], [4.0, 7.95]],
    wipe: [3.6, 8.0, 5.6, 10.2], low: [1.05, 5.35], top: [7.4, 11.75], noseX: 2.2, sill: 3.7 }),
});
const type73Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...T73,
  rows: [{ xs: seq(6.4, 5.3, 14), y: 6.65, w: 4.2, h: 2.7, r: 0.35 }], doors: [t73Door(1.8), t73Door(c.L - 4.7)], paint: t73Paint(false),
  extra: (c, g) => t73Under(g.L) + hvac(c.pan ? 50 : 36, g.roof, 13) + (c.pan ? pantograph(g.L / 2 - 8, g.roof) + panGear(g.L / 2 - 8, g.roof, 1) + roofCover(g.L / 2 + 0.5, g.roof, 4, 0.5) : roofCover(18, g.roof, 9, 0.45)),
});

// --- AnsaldoBreda Type 72 (36 four-car units, 2002-05): 85.6 m, end cars
// 22.0 m and middle cars 20.1 m, about 4.1 m tall; a short rounded nose
// with the windshield in a black mask, two double doors a side on every
// car, a dark window band; air conditioning at the car ends, the
// pantographs on the middle cars. The operator's paint, as the Type 73.
const T72 = { roof: 13.4, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 47.5, wb: 8.5, d: 33 }, diaphragm: [4.1, 12.0], badge: false };
const t72Paint = (nose) => (c, g) => {
  const L = g.L, k = liv(c);
  let s = rect(0, 0, L, 17, k.body) + rect(0, 12.5, L, 2, ROOF) + line(0, 12.5, L, 12.5, "rgba(0,0,0,0.2)", 0.5) +
    rect(0, 7.0, L, 3.4, k.band) + rect(0, 0, L, 4.5, k.deep) + k.decor(c, L);
  for (const dr of nose ? [11.2, L - 12.0] : [7.2, L - 12.4]) s += rect(dr - 0.15, 3.9, 4.7, 7.45, k.door);
  if (nose) s += path("M0 4.5L0 8.6L2.0 8.6Q4.0 7.2 6.4 6.6L6.4 4.5Z", k.deep) + path(poly([[1.6, 9.5], [3.5, 12.5], [6.0, 12.5], [6.0, 9.5]]), MASK) + rect(0, 7.0, 3.0, 2.5, k.body) +
    k.mark(c, 21.5, 5.6, 1.25);
  else s += k.mark(c, L * 0.27, 5.6, 1.25);
  return s;
};
const t72Door = (x) => ({ x, w: 4.4, y0: 4.0, y1: 11.2, leaves: 2, glassY: 0.4, glassH: 0.45 });
const type72Cab = (c) => bilevel({ ...c, cabL: true }, { ...T72,
  nose: [[1.0, 3.9], [0.8, 6.0], ["q", 0.8, 8.5, 1.8, 9.6], [3.6, 12.4], ["q", 4.4, 13.4, 6.0, 13.4]], cabLen: 6,
  rows: [{ xs: [7.8], y: 7.3, w: 2.0, h: 2.8, r: 0.35 }, { xs: seq(17.4, 5.0, 8), y: 7.3, w: 4.0, h: 2.8, r: 0.35 }, { xs: [c.L - 6.6], y: 7.3, w: 4.0, h: 2.8, r: 0.35 }],
  doors: [t72Door(11.2), t72Door(c.L - 12.0)], paint: t72Paint(true),
  extra: (c, g) => boxes(18, g.L - 18, g.sill, 3, 1.1) + hvac(7.5, g.roof, 9) + hvac(g.L - 16, g.roof, 9) + roofCover(28, g.roof, 12, 0.45),
  cab: () => cabFront({ glass: [[1.9, 9.9], [3.7, 12.2], [5.6, 12.2], [5.6, 9.9]], refl: [[2.3, 10.15], [3.2, 11.4], [3.8, 11.4], [2.9, 10.15]],
    wipe: [2.4, 10.0, 3.4, 11.8], low: [0.9, 6.3], top: [4.3, 12.8], noseX: 1.0, sill: 3.9 }),
});
const type72Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...T72,
  rows: [{ xs: [1.8], y: 7.3, w: 4.0, h: 2.8, r: 0.35 }, { xs: seq(13.2, 5.0, 8), y: 7.3, w: 4.0, h: 2.8, r: 0.35 }, { xs: [c.L - 5.8], y: 7.3, w: 4.0, h: 2.8, r: 0.35 }],
  doors: [t72Door(7.2), t72Door(c.L - 12.4)], paint: t72Paint(false),
  extra: (c, g) => boxes(16, g.L - 16, g.sill, 3, 1.1) + hvac(3.0, g.roof, 9) + hvac(g.L - 12, g.roof, 9) +
    (c.pan ? pantograph(g.L / 2, g.roof) + panGear(g.L / 2, g.roof, -1) : roofCover(24, g.roof, 12, 0.45)),
});

// --- Stadler FLIRT, Types 74 (regional, 2+2 seats) and 75 (local, 2+3)
// (116 five-car units, 2010-22), and the bimodal Type 76 (14, 2020-21,
// with a car of diesel generators): the FLIRT sections (digitraffic.cars.js)
// in the operator's paint: Vy's deep green with the black mask, its name
// big and pale on the cab sections; SJ's anthracite with a silver line.
// The Norwegian sections are longer than the ones drawn (a five-car Type
// 74 or 75 is about 105 m).
const flirtK = (c) => {
  const k = liv(c);
  return { body: k.body, roof: ROOF, skirt: k.deep, door: k.door, mask: MASK,
    paint: (c, g, part) => k.decor(c, g.L, part) + (part === "cab" ? k.mark(c, 21.65, 8.3, c.agency === "vy" ? 3.4 : 1.6) + k.mark(c, 50.0, 4.75, 1.0) + rect(0, 3.0, 1.6, 2.4, k.deep) : part === "mid" ? k.mark(c, 37.0, 4.75, 1.0) : k.mark(c, g.L / 2, 4.6, 0.8)) };
};
const noFlirtCab = (c) => flirt(c, "cab", flirtK(c));
const noFlirtMid = (c) => flirt(c, "mid", flirtK(c));
const noFlirtPower = (c) => flirt(c, "power", flirtK(c));

// --- Adtranz Type 71 (Flytoget, 16 units, 1997-98): first three cars of
// about 27.4 m, a fourth added in 2008-09; a long pointed nose with the
// windshield far back, one plug door a side near the end of each car, big
// windows in a dark band. Flytoget's silver, gray along the skirt and
// lower nose, its name on the side.
const T71 = { roof: 12.9, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 62.0, wb: 8.9, d: 36 }, diaphragm: [4.2, 11.8], badge: false };
const t71Paint = (c, g) => {
  const L = g.L, k = LIVERY.flytoget;
  return rect(0, 0, L, 17, k.body) + rect(0, 12.0, L, 2, ROOF) + line(0, 12.0, L, 12.0, "rgba(0,0,0,0.2)", 0.5) + rect(0, 6.8, L, 3.3, k.band) +
    rect(0, 0, L, 4.6, "#8e9399") + rect(0, 4.6, L, 0.2, k.deep) + rect(0, 10.35, L, 0.14, "#e9ebed");
};
const t71Door = (x) => ({ x, w: 3.1, y0: 4.1, y1: 11.0, glassY: 0.55, glassH: 0.3, grabs: false });
const t71Under = (L) => boxes(L / 2 - 22, L / 2 + 22, 3.9, 4, 1.0);
const type71Cab = (c) => bilevel({ ...c, cabL: true }, { ...T71,
  nose: [[2.4, 3.9], [1.0, 5.0], ["q", 0.4, 6.4, 1.6, 7.6], [6.6, 11.8], ["q", 8.0, 12.9, 10.6, 12.9]], cabLen: 11,
  rows: [{ xs: seq(14.4, 5.7, 12), y: 7.0, w: 4.4, h: 2.9, r: 0.4 }], doors: [t71Door(c.L - 6.0)],
  paint: (c, g) => t71Paint(c, g) + rect(0, 6.8, 12.4, 3.3, LIVERY.flytoget.body) + path("M0 4.6L0 6.9L3.4 6.9Q6.6 6.0 9.4 4.6Z", "#8e9399") +
    path(poly([[2.4, 7.7], [6.4, 11.65], [9.9, 11.65], [9.9, 8.7], [5.2, 7.7]]), MASK) + LIVERY.flytoget.mark(c, 40.0, 5.6, 1.3),
  extra: (c, g) => t71Under(g.L) + hvac(28, g.roof, 13) + roofCover(56, g.roof, 9, 0.45) + horns(11.5, g.roof - 0.02),
  cab: () => cabFront({ glass: [[2.8, 8.0], [6.7, 11.4], [9.6, 11.4], [9.6, 9.0], [5.6, 8.0]], refl: [[3.2, 8.25], [5.2, 10.0], [6.0, 10.0], [4.2, 8.25]],
    wipe: [3.8, 8.3, 5.9, 10.6], low: [1.0, 5.4], top: [7.8, 12.05], noseX: 2.4, sill: 3.9 }),
});
const type71Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...T71,
  rows: [{ xs: seq(5.6, 5.7, 13), y: 7.0, w: 4.4, h: 2.9, r: 0.4 }], doors: [t71Door(c.L - 6.0)], paint: (c, g) => t71Paint(c, g) + LIVERY.flytoget.mark(c, 30.0, 5.6, 1.0),
  extra: (c, g) => t71Under(g.L) + hvac(c.pan ? 54 : 36, g.roof, 13) +
    (c.pan ? pantograph(g.L / 2 - 8, g.roof) + panGear(g.L / 2 - 8, g.roof, 1) : roofCover(20, g.roof, 9, 0.45)),
});

// --- CAF Oaris, Type 78 (Flytoget, 8 four-car units, 2021-23): 102 m,
// aluminium bodies, every car powered; a smooth raked nose, two double
// doors a side for luggage. Flytoget's newer scheme: silver, the window
// band and lower nose dark gray, a gray line along the skirt, the name
// big by the cab.
const T78 = { roof: 13.1, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 57.5, wb: 8.9, d: 33 }, diaphragm: [4.2, 12.0], badge: false };
const t78Paint = (c, g) => rect(0, 0, g.L, 17, "#c9cdd2") + rect(0, 12.2, g.L, 2, "#9aa1a9") + line(0, 12.2, g.L, 12.2, "rgba(0,0,0,0.2)", 0.5) +
  rect(0, 6.75, g.L, 3.5, "#2c2f33") + rect(0, 0, g.L, 4.6, "#3d4146") + rect(0, 4.6, g.L, 0.22, "#6d6e71");
const t78Door = (x) => ({ x, w: 4.6, y0: 4.0, y1: 11.1, leaves: 2, glassY: 0.4, glassH: 0.45, fill: "rgba(0,0,0,0.08)" });
const type78Cab = (c) => bilevel({ ...c, cabL: true }, { ...T78,
  nose: [[2.0, 3.9], [0.9, 5.2], ["q", 0.5, 6.8, 1.6, 8.0], [5.8, 12.0], ["q", 7.0, 13.1, 9.4, 13.1]], cabLen: 10,
  rows: [{ xs: seq(19.4, 5.5, 5), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }, { xs: seq(52.4, 5.5, 4), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }],
  doors: [t78Door(13.0), t78Door(c.L - 13.4)], paint: (c, g) => t78Paint(c, g) + path("M0 4.6L0 8.2L2.4 8.2Q6.0 7.4 11.0 6.75L13 6.75L13 4.6Z", "#3d4146") +
    path(poly([[2.0, 8.1], [5.6, 11.95], [9.2, 11.95], [9.2, 8.6], [5.0, 8.05]]), MASK) + LIVERY.flytoget.mark(c, 46.5, 11.25, 1.2),
  extra: (c, g) => boxes(18, g.L - 18, g.sill, 4, 1.0) + hvac(24, g.roof, 12) + roofCover(52, g.roof, 10, 0.5) + horns(10.0, g.roof - 0.02),
  cab: () => cabFront({ glass: [[2.3, 8.3], [5.9, 11.7], [8.8, 11.7], [8.8, 9.2], [5.0, 8.3]], refl: [[2.7, 8.55], [4.6, 10.4], [5.3, 10.4], [3.6, 8.55]],
    wipe: [3.2, 8.6, 5.0, 10.8], low: [0.95, 5.55], top: [7.0, 12.55], noseX: 2.0, sill: 3.9 }),
});
const type78Mid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...T78,
  rows: [{ xs: [2.6], y: 7.0, w: 4.4, h: 3.0, r: 0.4 }, { xs: seq(15.6, 5.5, 8), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }, { xs: [c.L - 7.2], y: 7.0, w: 4.4, h: 3.0, r: 0.4 }],
  doors: [t78Door(8.4), t78Door(c.L - 13.0)], paint: (c, g) => t78Paint(c, g) + LIVERY.flytoget.mark(c, g.L / 2, 11.25, 0.9),
  extra: (c, g) => boxes(16, g.L - 16, g.sill, 4, 1.0) + hvac(c.pan ? 46 : 20, g.roof, 12) +
    (c.pan ? pantograph(26, g.roof) + panGear(26, g.roof, -1) : roofCover(46, g.roof, 12, 0.5)),
});

// --- El 18 (22, 2241-2262, 1996-97): the Swiss Re 460, as Finland's Sr2
// (digitraffic.cars.js): 18.5 m. Vy's are deep green over a black skirt
// with the name pale on the side; Go-Ahead's navy streaked with light
// blue; SJ's silver with an anthracite front and skirt and SJ in black.
const el18 = (c) => lok2000(c, (h) => {
  const k = liv(h), sj = h.agency === "sjnord";
  return { body: sj ? "#c3c7cc" : k.body, roof: ROOF,
    livery: (h, L) => sj
      ? rect(0, 0, L, 5.6, k.body) + path("M0 5.6L0 8.7L2.2 8.7Q4.6 7.4 7.2 5.6Z", k.body) + rect(0, 5.6, L, 0.18, "#8d949c")
      : k.decor(h, L, "loco") + rect(0, 0, L, 5.2, k.deep) + path("M0 5.2L0 8.7L2.0 8.7Q4.2 7.0 6.6 5.2Z", k.deep),
    mark: (h) => sj ? letters(h, 22.0, 9.0, 1.8, "SJ", "#26282c", { weight: 800 }) : k.mark(h, 22.0, 6.6, h.agency === "goaheadnorge" ? 1.3 : 2.4) };
});

// --- Strømmen Type 7 coaches (B7, 1982-88): the long-distance trains'
// cars behind an El 18 or a Di 4, about 24.5 m, an end door a side at each
// end, wide windows, side buffers and screw couplers, the air-conditioning
// housings at the ends of the roof, battery and heating boxes under the
// floor. The operator's paint over a dark window band, its name midway.
const b7 = (c) => {
  const k = liv(c);
  return coachCar(c, {
    roof: 12.9, sill: 3.9, end: 0.6, endR: 1.0, eave: 12.1, roofBand: ROOF, trucks: { centers: 56.0, wb: 8.2, d: 36 }, base: k.body,
    stripes: [[6.85, 3.25, k.band], [0, 4.6, k.deep], [4.6, 0.2, "rgba(0,0,0,0.25)"]],
    livery: (c, { x0, x1 }) => k.decor(c, c.L, "coach") + rect(6.0, 6.85, c.L - 12.0, 3.25, k.band) + frames(seq(6.6, 6.15, 11), 7.05, 4.6, 2.85, 0.12, "#101214") + k.mark(c, c.L / 2, 5.4, 1.1),
    rows: [{ a: 6.2, b: c.L - 6.2, y: 7.05, w: 4.6, h: 2.85, pitch: 6.15, r: 0.35 }],
    doors: [{ x: 1.6, w: 2.6, y: 4.05, h: 6.9 }, { x: c.L - 4.2, w: 2.6, y: 4.05, h: 6.9 }], badge: false,
    extra: (c) => hvac(3.0, 12.9, 8) + hvac(c.L - 11.0, 12.9, 8) + buffers(0, -1) + buffers(c.L, 1) + boxes(17, c.L - 17, 3.9, 2, 0.6, "#2f3338") +
      rect(5.0, 10.6, 0.5, 0.5, "#e8a33a", 0.3, 'rx="0.1"') + rect(c.L - 5.5, 10.6, 0.5, 0.5, "#e8a33a", 0.3, 'rx="0.1"'),
  });
};

// --- Henschel Di 4 (5, 4.651-4.655, 1980-81): a 20.8 m diesel-electric
// locomotive with a cab at each end, an EMD engine and generator inside,
// Co-Co bogies; the radiator grilles high on the side, the exhaust and
// fans on the roof, the fuel tank between the bogies, side buffers. SJ's
// anthracite with a silver band and SJ on the side.
const di4 = (c) => bothEnds(c, (h) => {
  const L = h.L, sill = 4.3, roof = 13.4, k = liv(h);
  return cabUnit(h, {
    roof, sill, rearR: 1.0,
    nose: [[1.4, sill], [1.2, 7.8], [2.6, 11.9], ["q", 3.0, roof, 4.2, roof]],
    base: k.body, trucks: { centers: 36.0, wb: 12.6, d: 40 },
    paint: () => rect(0, 6.2, L, 0.9, k.accent) + rect(0, roof - 0.55, L, 1, ROOF) + rect(0, sill, L, 0.45, "#1d1f22") +
      path(poly([[1.35, 8.1], [2.55, 11.75], [5.7, 11.75], [5.7, 8.1]]), MASK) + (h.half === 0 ? k.mark(h, 18.5, 9.4, 1.6) : ""),
    glass: [[[1.55, 8.4], [2.7, 11.5], [5.4, 11.5], [5.4, 8.4]]],
    sideWin: [[6.1, 8.7, 1.7, 2.1]],
    doors: [[8.0, 2.2, sill + 0.35, 11.6]],
    grilles: [[12.4, 9.0, 8.4, 2.6, 0.35], [22.0, 9.6, 8.4, 2.0, 0.35]],
    panels: [[11.9, 5.0, 9.4, 3.5], [21.6, 5.0, 9.2, 3.5]],
    fans: [L / 2 - 4.5], horn: 4.6,
    tank: [19.0, L - 19.0, 1.6],
    extra: () => rect(L / 2 - 1.4, roof - 0.05, 1.2, 0.8, "currentColor") + rect(L / 2 - 1.6, roof + 0.7, 1.6, 0.18, "currentColor") +
      lamp(1.0, 6.0, 0.45, 0.5) + lamp(1.05, 5.2, 0.35, 0.3, RED_LAMP) + lamp(3.0, 12.8, 0.6, 0.25) + wiper(2.0, 8.6, 2.8, 10.9) + buffers(0, -1, { y: 3.55 }),
  });
});
// cabUnit draws two-axle trucks; a Di 4 rides on three-axle ones, drawn over them.
const di4Trucks = (L) => [-1, 1].map((k) => truck(L / 2 + k * 18.0, { wb: 12.6, d: 40, kind: "loco", top: 4.3, axles: 3 })).join("");

// --- Bombardier Talent, Type 93 (15 two-car units, 2000-02): 38.2 m, the
// two cars sharing a bogie at the joint, a low floor between, a diesel
// engine under each with its radiator and exhaust on the roof; a rounded
// nose with the windshield in a black mask, a double door a side in each
// car. The operator's paint, its deeper shade low and over the nose.
const type93 = (c) => {
  const k = liv(c);
  return bilevel({ ...c, cabL: true }, {
    roof: 12.6, sill: 2.9, cornerR: 1.0, end: 0.6, noTrucks: true, diaphragm: [3.2, 11.6], badge: false,
    nose: [[1.4, 2.9], [0.9, 4.8], ["q", 0.8, 6.8, 1.8, 8.0], [4.4, 11.6], ["q", 5.3, 12.6, 7.2, 12.6]], cabLen: 7,
    rows: [{ xs: [8.6], y: 6.4, w: 2.2, h: 3.4, r: 0.4 }, { xs: seq(18.6, 5.3, 3), y: 6.4, w: 4.4, h: 3.4, r: 0.4 }, { xs: seq(41.0, 5.3, 3), y: 6.4, w: 4.4, h: 3.4, r: 0.4 }],
    doors: [{ x: 35.0, w: 4.2, y0: 2.9, y1: 10.4, leaves: 2, glassY: 0.4, glassH: 0.45 }],
    paint: (c, g) => rect(0, 0, g.L, 17, k.body) + rect(0, 11.8, g.L, 2, ROOF) + k.decor(c, g.L, "dmu") + rect(0, 0, g.L, 3.9, k.deep) +
      path("M0 3.9L0 7.9L2.4 7.9Q4.6 6.0 7.4 5.0L7.4 3.9Z", k.deep) + rect(34.85, 2.9, 4.5, 7.6, k.door) +
      frames([8.6], 6.4, 2.2, 3.4) + frames([...seq(18.6, 5.3, 3), ...seq(41.0, 5.3, 3)], 6.4, 4.4, 3.4) +
      path(poly([[1.6, 7.85], [4.3, 11.55], [7.2, 11.55], [7.2, 7.85]]), MASK) + k.mark(c, 27.0, 4.6, 1.1),
    cab: () => cabFront({ glass: [[2.0, 8.3], [4.5, 11.3], [6.6, 11.3], [6.6, 8.3]], refl: [[2.4, 8.55], [3.6, 10.0], [4.2, 10.0], [3.0, 8.55]],
      wipe: [2.5, 8.5, 3.7, 10.6], low: [0.95, 5.3], top: [5.2, 11.95], noseX: 1.4, sill: 2.9 }),
    extra: (c, g) => truck(12.0, { wb: 8.2, d: 30, top: 2.9 }) + truck(g.L, { wb: 8.5, d: 30, top: 2.9 }) +
      roofCover(18, g.roof, 11, 0.75, "#8d949c", 3) + slats(18.8, g.roof + 0.1, 9.4, 0.5, 0.4, "rgba(0,0,0,0.35)") + rect(30.0, g.roof, 0.5, 1.0, "currentColor") +
      hvac(43, g.roof, 9) + boxes(20, 33, 2.9, 2, 0.75) + rect(43.0, 1.3, 9.0, 1.2, "#2f3338", 0.4, 'rx="0.3"'),
  });
};

export const TYPES = {
  noType73Cab: { name: "Type 73 end car", kind: "emu" },
  noType73Mid: { name: "Type 73 car", kind: "emu", pan: true },
  noType72Cab: { name: "Type 72 end car", kind: "emu" },
  noType72Mid: { name: "Type 72 car", kind: "emu", pan: true },
  noType74Cab: { name: "Type 74 (Stadler FLIRT) cab section", kind: "emu", pan: true },
  noType74Mid: { name: "Type 74 (Stadler FLIRT) section", kind: "emu", pan: true },
  noType75Cab: { name: "Type 75 (Stadler FLIRT) cab section", kind: "emu", pan: true },
  noType75Mid: { name: "Type 75 (Stadler FLIRT) section", kind: "emu", pan: true },
  noType76Cab: { name: "Type 76 (Stadler FLIRT) cab section", kind: "emu", pan: true },
  noType76Mid: { name: "Type 76 (Stadler FLIRT) section", kind: "emu", pan: true },
  noType76Power: { name: "Type 76 generator car", kind: "module" },
  noType71: { name: "Type 71 end car", kind: "emu" },
  noType71Mid: { name: "Type 71 car", kind: "emu", pan: true },
  noType78: { name: "Type 78 (CAF Oaris) end car", kind: "emu" },
  noType78Mid: { name: "Type 78 (CAF Oaris) car", kind: "emu", pan: true },
  noEl18: { name: "El 18 electric locomotive", kind: "electric", pan: true },
  noB7: { name: "Type 7 (B7) coach", kind: "coach" },
  noDi4: { name: "Di 4 diesel locomotive", kind: "diesel" },
  noType93: { name: "Type 93 (Bombardier Talent) car", kind: "emu" },
};

const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  noType73Cab: M(type73Cab, 91.5, true),
  noType73Mid: M(type73Mid, 86.3),
  noType72Cab: M(type72Cab, 72.1, true),
  noType72Mid: M(type72Mid, 66.0),
  noType74Cab: M(noFlirtCab, 70.5, true),
  noType74Mid: M(noFlirtMid, 51.5),
  noType75Cab: M(noFlirtCab, 70.5, true),
  noType75Mid: M(noFlirtMid, 51.5),
  noType76Cab: M(noFlirtCab, 70.5, true),
  noType76Mid: M(noFlirtMid, 51.5),
  noType76Power: M(noFlirtPower, 22),
  noType71: M(type71Cab, 90.0, true),
  noType71Mid: M(type71Mid, 90.0),
  noType78: M(type78Cab, 87.6, true),
  noType78Mid: M(type78Mid, 79.7),
  noEl18: M(el18, 60.7),
  noB7: M(b7, 80.4),
  noDi4: M((c) => di4(c) + di4Trucks(c.L), 68.2),
  noType93: M(type93, 62.7, true),
};

// [first, last, type]: locomotive numbers, and Flytoget's units as their
// feed writes them without the dash (the parser passes "71-14" with its
// model, js/railroads/entur.js).
const EL18 = [2241, 2262, "noEl18"];
export const FLEETS = {
  vy: [EL18],
  goaheadnorge: [EL18],
  sjnord: [EL18, [4651, 4655, "noDi4"]],
  flytoget: [[7101, 7116, "noType71"], [7801, 7808, "noType78"]],
};

// What runs where (the operators' fleets as Wikipedia and Norske tog list
// them): Vy's local lines Type 75s (the L1 Type 72s), its regional RE and
// RX trains Type 74s, the Bergen Line an El 18 with B7 coaches, the
// Gothenburg trains Type 73s; Go-Ahead's Jæren line Type 72s and its
// Sørland Line Type 73s; SJ Nord's Dovre Line an El 18 with B7s, the
// Nordland Line a Di 4 with B7s, the Trøndelag lines Type 76s and the Røros
// line and Saltenpendelen Type 93s.
const set = (label, ...units) => ({ label, units });
const FLIRT5 = (n) => set(`Five-car Type ${n} FLIRT`, [`noType${n}Cab`, 1], [`noType${n}Mid`, 3], [`noType${n}Cab`, 1]);
const T76 = set("Type 76 bimodal FLIRT", ["noType76Cab", 1], ["noType76Mid", 1], ["noType76Power", 1], ["noType76Mid", 2], ["noType76Cab", 1]);
const T73_SET = set("Four-car Type 73", ["noType73Cab", 1], ["noType73Mid", 2], ["noType73Cab", 1]);
const T72_SET = set("Four-car Type 72", ["noType72Cab", 1], ["noType72Mid", 2], ["noType72Cab", 1]);
const T71_SET = set("Four-car Type 71", ["noType71", 1], ["noType71Mid", 2], ["noType71", 1]);
const T78_SET = set("Four-car Type 78 (CAF Oaris)", ["noType78", 1], ["noType78Mid", 2], ["noType78", 1]);
const EL18_SET = set("El 18 locomotive with Type 7 coaches", ["noEl18", 1], ["noB7", 6]);
const DI4_SET = set("Di 4 locomotive with Type 7 coaches", ["noDi4", 1], ["noB7", 4]);
const T93_SET = set("Two-car Type 93 (Talent)", ["noType93", 2]);
const BY_TYPE = {
  noType73Cab: T73_SET, noType73Mid: T73_SET, noType72Cab: T72_SET, noType72Mid: T72_SET, noType74Cab: FLIRT5(74), noType74Mid: FLIRT5(74),
  noType75Cab: FLIRT5(75), noType75Mid: FLIRT5(75), noType76Cab: T76, noType76Mid: T76, noType76Power: T76, noType71: T71_SET, noType71Mid: T71_SET,
  noType78: T78_SET, noType78Mid: T78_SET, noEl18: EL18_SET, noB7: EL18_SET, noDi4: DI4_SET, noType93: T93_SET,
};
export const TYPICAL = {
  vy: (t, reported) => {
    const r = t.route || "";
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (r === "F4") return EL18_SET;
    if (r === "F1") return T73_SET;
    if (r === "L1") return T72_SET;
    return /^R[EX]/.test(r) ? FLIRT5(74) : FLIRT5(75);
  },
  goaheadnorge: (t, reported) => BY_TYPE[reported] || (t.route === "L5" ? T72_SET : T73_SET),
  flytoget: (t, reported) => BY_TYPE[reported] || T71_SET,
  sjnord: (t, reported) => {
    const r = t.route || "";
    if (BY_TYPE[reported]) return BY_TYPE[reported];
    if (r === "F6") return EL18_SET;
    if (r === "F7") return DI4_SET;
    if (r === "R70" || r === "R71") return T76;
    return T93_SET;
  },
};

// Fact sheets in mph, hp and ft, from the published km/h, kW and m.
const WIKI = "https://en.wikipedia.org/wiki/";
const NORSKE_TOG = "https://no.wikipedia.org/wiki/Norske_tog";
export const FACTS = {
  noType73Cab: { model: "Adtranz Type 73 (Signatur)", type: "Tilting electric multiple unit", builder: "Adtranz, Strømmen", built: "1999–2002",
    fleet: "22 four-car units (16 A, 6 B)", topSpeedMph: 130.5, powerHp: 3548, lengthFt: 355.9,
    about: "Norway's tilting long-distance and regional train. Go-Ahead runs it on the Sørland Line, SJ Nord on the Dovre Line and Vy on some of its own routes; the B series was built for the Østfold Line.",
    source: WIKI + "NSB_Class_73" },
  noType72Cab: { model: "AnsaldoBreda Type 72", type: "Electric multiple unit", builder: "AnsaldoBreda", built: "2002–2005", fleet: "36 four-car units",
    topSpeedMph: 99.4, lengthFt: 280.7,
    about: "A commuter unit built in Italy. Vy runs it on line L1 around Oslo and Go-Ahead on the Jæren line south of Stavanger.",
    source: WIKI + "NSB_Class_72" },
  noType74Cab: { model: "Stadler FLIRT (Type 74)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2010–2022", fleet: "53 five-car units",
    topSpeedMph: 124.3, powerHp: 6035,
    about: "The regional version of Norway's FLIRT, seated two and two since 2014. It runs Vy's RE trains through Oslo, such as Drammen–Lillehammer and Skien–Eidsvoll.",
    source: WIKI + "Stadler_FLIRT" },
  noType75Cab: { model: "Stadler FLIRT (Type 75)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2012–2020", fleet: "63 five-car units (20 of them Type 75-2)",
    topSpeedMph: 124.3, powerHp: 6035,
    about: "The local version of Norway's FLIRT, with five seats abreast. It runs most of Vy's commuter lines around Oslo and Bergen.",
    source: WIKI + "Stadler_FLIRT" },
  noType76Cab: { model: "Stadler FLIRT (Type 76)", type: "Bimodal multiple unit", builder: "Stadler Rail", built: "2020–2021", fleet: "14 units",
    about: "A FLIRT that runs on overhead power or on diesel generators in an extra car. SJ Nord runs it on the Trøndelag commuter trains and on the Meråker and Røros lines.",
    source: NORSKE_TOG },
  noType71: { model: "Adtranz Type 71", type: "Electric multiple unit", builder: "Adtranz, Strømmen", built: "1997–1998", fleet: "16 units",
    topSpeedMph: 130.5, powerHp: 3547, seats: 244,
    about: "Flytoget's airport express train between Oslo Airport, Oslo S and Drammen, built as three cars and lengthened to four in 2008–09. Norske tog now owns the fleet.",
    source: WIKI + "NSB_Class_71" },
  noType78: { model: "CAF Oaris (Type 78)", type: "Electric multiple unit", builder: "CAF", built: "2021–2023", fleet: "8 four-car units",
    topSpeedMph: 152.2, powerHp: 7081, seats: 248, lengthFt: 334.6,
    about: "Flytoget's newer airport trains, every car powered, approved for 245 km/h but run at the line's 210. They were withdrawn weeks after entering service in June 2021 when cracks were found in their underframes, and returned later.",
    source: "https://railwaygazette.com/high-speed/caf-oaris-emus-enter-service-with-flytoget/59266.article" },
  noEl18: { model: "El 18", type: "Electric locomotive", builder: "Adtranz and SLM", built: "1996–1997", fleet: "22, 2241–2262",
    topSpeedMph: 124.3, powerHp: 7241, lengthFt: 60.7,
    about: "A Norwegian version of the Swiss Re 460. It hauls the long-distance trains with Type 7 coaches: Vy's on the Bergen Line, Go-Ahead's on the Sørland Line and SJ Nord's on the Dovre Line.",
    source: WIKI + "NSB_El_18" },
  noB7: { model: "Strømmen Type 7 coach (B7)", type: "Coach", builder: "Strømmen", built: "1982–1988", fleet: "58",
    about: "The coaches of Norway's locomotive-hauled long-distance trains, behind El 18s and, on the Nordland Line, Di 4s.",
    source: NORSKE_TOG },
  noDi4: { model: "Henschel Di 4", type: "Diesel-electric locomotive", builder: "Henschel (BBC electrics, GM engine)", built: "1980–1981", fleet: "5, 4.651–4.655",
    topSpeedMph: 87, powerHp: 3285, lengthFt: 68.2,
    about: "Norway's only diesel locomotives in passenger service. SJ Nord runs them with Type 7 coaches on the Nordland Line between Trondheim and Bodø.",
    source: WIKI + "NSB_Di_4" },
  noType93: { model: "Bombardier Talent (Type 93)", type: "Diesel multiple unit", builder: "Bombardier", built: "2000–2002", fleet: "15 two-car units",
    topSpeedMph: 87, powerHp: 821, seats: 76, lengthFt: 125.4,
    about: "Two-car diesel units on the lines without wires. SJ Nord rents 13 of them for the Nordland, Rauma and Røros lines.",
    source: WIKI + "NSB_Class_93" },
};
// A unit's other cars share its sheet, named for the part they are.
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
for (const [k, of, name] of [["noType73Mid", "noType73Cab", "middle car"], ["noType72Mid", "noType72Cab", "middle car"],
  ["noType74Mid", "noType74Cab", "intermediate section"], ["noType75Mid", "noType75Cab", "intermediate section"],
  ["noType76Mid", "noType76Cab", "intermediate section"], ["noType76Power", "noType76Cab", "generator car"], ["noType71Mid", "noType71", "middle car"],
  ["noType78Mid", "noType78", "middle car"]]) FACTS[k] = part(FACTS[of], name);
