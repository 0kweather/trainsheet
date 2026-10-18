// KTMB's trains (scripts/railroads/ktmb.py): the ETS electric sets, KTM
// Komuter's EMUs, the Class 61 DMUs and the locomotive-hauled trains. The
// feed names each train's set (vehicle.label "ETS202", "SCS21", "EMU23",
// "DMU06"), which js/railroads/ktmb.js passes as the car's type; the rest of
// the train is what that class runs as. Drawn from each class's published
// dimensions; liveries simplified from the operator's current paint.

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, poly, win, truck, pantograph, underframe, lines, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const KTM = { white: "#f1f2f3", navy: "#1d3570", blue: "#2457a8", yellow: "#f6c400", red: "#d22630", grey: "#2b3036", roof: "#b4bac1", skirt: "#33373c" };

// A multiple unit's driving car (its nose on the left; the consist mirrors
// the one at the back) and its intermediate cars, from one spec: body (roof,
// sill, trucks), nose, cabLen, paint(c, g, nose), cab(c, g), and per car
// rows, doors, roofItems and extra.
// The two cars next to the driving cars carry the pantographs.
const besideCab = (c) => c.index === 1 || c.index === c.count - 2;
const drivingCar = (spec, car) => (c) => bilevel({ ...c, cabL: true }, { ...spec, ...car, paint: (c, g) => spec.paint(c, g, true) });
const middleCar = (spec, car) => (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...spec, nose: null, cab: null, ...car, paint: (c, g) => spec.paint(c, g, false) });

// ===================== ETS (electric intercity) =====================
// Six-car sets, two single-leaf plug doors a side on each car near its ends,
// a long row of big windows in a dark glazing band; 25 kV, metre gauge,
// about 13 ft to the roof. Trucks 52 ft 6 in apart on 34 in wheels.
// Class 93 (CRRC Zhuzhou, ETS 201-219, 2013-18): driving cars 24 m, the
// others 23 m; a long raked "sloped head" nose. White, a navy skirt under a
// yellow line, the navy sweeping up the nose to the windshield; pantographs
// on the two trailers next to the driving cars.
// Class 94 (ETS3, CRRC Zhuzhou with CRRC Batu Gajah, ETS 301-310, 2023-25):
// the same body in the flag's colors, red and white pinstripes low on the
// side, a navy panel with a yellow stripe at the cab.
// Class 91 (Hyundai Rotem with Mitsubishi Electric, ETS 101-105, 2008-09):
// about 22 m cars, a shorter, blunter nose; white over a navy skirt with a
// gold line.
const ETS = { roof: 13.0, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 52.5, wb: 8.2, d: 34 }, diaphragm: [3.6, 11.8], badge: false };
const ETS_NOSE = [[2.6, 3.3], [1.5, 4.4], ["q", 0.9, 5.6, 1.6, 6.6], [8.6, 12.2], ["q", 10.0, 13.0, 12.4, 13.0]];
const ETS91_NOSE = [[1.4, 3.3], [1.0, 4.6], [1.0, 7.0], ["q", 1.1, 8.0, 1.8, 8.6], [3.9, 12.0], ["q", 4.7, 13.0, 6.5, 13.0]];
const etsDoor = (x) => ({ x, w: 3.0, y0: 3.4, y1: 10.6, glassY: 0.5, glassH: 0.38, grabs: false });
const etsRows = (a, n) => [{ xs: seq(a, 6.3, n), y: 7.0, w: 4.6, h: 3.1, r: 0.45 }];
// The sloped nose's windshield and the cab side window.
const etsCab = () => path(poly([[3.3, 7.6], [8.3, 11.8], [9.7, 11.8], [5.6, 7.6]]), C.glass) + win(10.4, 8.0, 1.9, 2.6, 0.35);
const ets91Cab = () => path(poly([[2.0, 8.9], [3.8, 11.7], [4.9, 11.7], [4.9, 8.9]]), C.glass) + win(6.6, 7.8, 1.8, 2.8, 0.35);
function etsPaint(kind) {
  return (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, KTM.white) + rect(0, 12.2, L, 2, KTM.roof) + rect(nose ? 12 : 0, 6.8, L, 3.5, KTM.grey, 0, 'rx="0.4"');
    if (kind === "94") {
      s += rect(0, 0, L, 3.9, KTM.navy);
      for (let k = 0; k < 4; k++) s += rect(0, 4.1 + k * 0.55, L, 0.28, KTM.red);
      if (nose) s += path("M0 0L16.5 0L16.5 6.4Q14.6 6.4 13.4 7.6L6.4 13.2L0 13.2Z", KTM.navy) + path("M16.5 6.2L16.5 6.6Q14.8 6.6 13.6 7.8L6.6 13.4L6.1 13.4L13.2 7.4Q14.5 6.2 16.5 6.2Z", KTM.yellow);
      return s;
    }
    const navy = kind === "91" ? 4.8 : 5.0, line = kind === "91" ? "#c9a227" : KTM.yellow;
    s += rect(0, 0, L, navy, KTM.navy) + rect(0, navy, L, 0.32, line);
    if (nose) s += kind === "91"
      ? path(`M0 0L8.5 0L8.5 ${navy}Q4.2 ${navy} 2.6 8.4L1.6 13.2L0 13.2Z`, KTM.navy)
      : path(`M0 0L15 0L15 ${navy}L6.2 ${navy}Q3.6 ${navy} 2.4 7.4L0 7.4Z`, KTM.navy) + path(`M15 ${navy}L15 ${navy + 0.32}L6.3 ${navy + 0.32}Q3.9 ${navy + 0.32} 2.7 7.4L2.3 7.4Q3.5 ${navy} 6.2 ${navy}Z`, line);
    return s;
  };
}
const etsSpec = (kind) => ({ ...ETS, nose: kind === "91" ? ETS91_NOSE : ETS_NOSE, cabLen: kind === "91" ? 8 : 12,
  cab: kind === "91" ? ets91Cab : etsCab, paint: etsPaint(kind) });
const etsSet = (kind, carL, midL) => {
  const spec = etsSpec(kind), first = kind === "91" ? 13.0 : 17.5;
  const car = { rows: etsRows(first, Math.floor((carL - 6 - first) / 6.3)), doors: [etsDoor(kind === "91" ? 9.0 : 13.2), etsDoor(carL - 4.4)], roofItems: [[20, 12, 0.5]] };
  const mid = { rows: etsRows(7.2, Math.floor((midL - 13.0) / 6.3)), doors: [etsDoor(2.0), etsDoor(midL - 5.0)], roofItems: [[24, 14, 0.5]] };
  return {
    car: drivingCar(spec, car),
    mid: middleCar(spec, { ...mid, extra: (c, g) => (besideCab(c) ? pantograph(g.L - 13, 13.0, { facing: -1 }) : "") }),
  };
};
const E93 = etsSet("93", 78.7, 75.5), E94 = etsSet("94", 78.7, 75.5), E91 = etsSet("91", 72.9, 72.2);

// ===================== KTM Komuter =====================
// Class 92 (CSR Zhuzhou, SCS 01-38, 2010-12): six cars, driving cars 23.7 m,
// the others 22.8 m; three double-leaf doors a side; 25 kV, 125 km/h. White,
// a blue window band, a red band low on the side under a yellow line; the
// cab front in yellow with dark "tiger" stripes. Pantographs on the two
// motor cars next to the driving cars.
const SCS = { roof: 13.0, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 51.5, wb: 8.2, d: 34 }, diaphragm: [3.6, 11.8], badge: false,
  nose: [[1.6, 3.3], [1.0, 4.6], ["q", 0.9, 6.2, 1.5, 7.0], [4.6, 12.0], ["q", 5.4, 13.0, 7.2, 13.0]], cabLen: 8,
  cab: () => path(poly([[2.0, 7.6], [4.6, 11.7], [5.8, 11.7], [5.8, 7.6]]), C.glass) + win(6.6, 7.8, 1.4, 2.8, 0.3),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, KTM.white) + rect(0, 12.2, L, 2, KTM.roof) + rect(0, 6.8, L, 3.6, KTM.blue) +
      rect(0, 0, L, 3.8, KTM.skirt) + rect(0, 3.8, L, 1.3, KTM.red) + rect(0, 5.1, L, 0.3, KTM.yellow);
    if (nose) {
      s += path("M0 3.8L7.4 3.8L7.4 12.4L5.2 13.2L0 13.2Z", "#f2a900");
      s += lines([[1.2, 5.6, 3.4, 4.4], [1.1, 6.6, 4.4, 5.0], [3.0, 12.2, 5.6, 10.9], [4.0, 12.6, 6.6, 11.6]], "#1d1f22", 1.2);
    }
    return s;
  },
};
const scsDoor = (x) => ({ x, w: 4.3, y0: 3.4, y1: 10.6, leaves: 2, glassY: 0.45, glassH: 0.4 });
const scsWin = (xs) => [{ xs, y: 7.0, w: 4.3, h: 3.0, r: 0.4 }];
const SCS_CAR = { rows: scsWin([9.2, 21.5, 26.7, 31.9, 47.8, 53.0, 58.2, 65.6]), doors: [scsDoor(14.9), scsDoor(41.2), scsDoor(71.0)], roofItems: [[24, 12, 0.5]] };
const SCS_MID = { rows: scsWin([1.6, 13.4, 18.6, 23.8, 44.7, 49.9, 55.1, 66.8]), doors: [scsDoor(6.6), scsDoor(35.25), scsDoor(62.0)], roofItems: [[24, 12, 0.5]] };
const scs92Car = drivingCar(SCS, SCS_CAR);
const scs92Mid = middleCar(SCS, { ...SCS_MID, extra: (c) => (besideCab(c) ? pantograph(14, 13.0) : "") });

// Class 83 (Hyundai Precision with Marubeni, EMU 19-40, 1996-97): three
// cars, the driving motor cars 22.2 m, the trailer between them 23.2 m with
// the pantograph; a nearly upright front; two double doors a side. Blue
// and yellow: white sides over a yellow band and a blue skirt, the blue
// carried up the cab front.
const E83 = { roof: 12.9, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 50.0, wb: 8.0, d: 34 }, diaphragm: [3.7, 11.7], badge: false,
  nose: [[1.0, 3.4], [0.8, 4.5], [0.8, 9.2], ["q", 0.9, 11.2, 1.8, 12.2], ["q", 2.4, 12.9, 3.6, 12.9]], cabLen: 4.5,
  cab: () => path(poly([[1.0, 7.4], [1.0, 10.2], ["q", 1.2, 11.2, 1.9, 11.7], [3.4, 11.7], [3.4, 7.4]]), C.glass),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, KTM.white) + rect(0, 12.0, L, 2, KTM.roof) + rect(0, 0, L, 4.9, KTM.blue) + rect(0, 4.9, L, 1.1, KTM.yellow);
    if (nose) s += rect(0, 0, 4.0, 7.2, KTM.blue) + rect(4.0, 6.0, 0.25, 6.0, KTM.yellow);
    return s;
  },
};
const e83Door = (x) => ({ x, w: 4.2, y0: 3.5, y1: 10.5, leaves: 2, glassY: 0.45, glassH: 0.4 });
const e83Rows = (xs) => [{ xs, y: 7.0, w: 4.2, h: 2.9, r: 0.35 }];
const emu83Car = drivingCar(E83, { rows: e83Rows([5.4, 21.8, 27.2, 32.6, 38.0, 43.4, 60.0, 65.6]), doors: [e83Door(13.6), e83Door(51.4)], roofItems: [[22, 18, 0.5]] });
const emu83Mid = middleCar(E83, { rows: e83Rows([2.2, 17.4, 22.8, 28.2, 43.6, 49.0, 54.4, 69.6]), doors: [e83Door(9.6), e83Door(62.3)], roofItems: [[46, 10, 0.5]],
  extra: () => pantograph(16, 12.9) });

// ===================== Class 61 DMU =====================
// CRRC Zhuzhou, DMU 01-13 (2018-20, the first two built in China, the rest
// at Batu Gajah): four cars, 93.5 m, two MAN power packs under the motor
// cars; a raked nose; two single plug doors a side on each car. White, a
// dark window band, a navy skirt under a red line; the navy and red sweep
// up the nose.
const D61 = { roof: 13.1, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 52.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.9], badge: false,
  nose: [[2.0, 3.4], [1.2, 4.5], ["q", 0.9, 5.8, 1.5, 6.8], [6.0, 12.2], ["q", 7.0, 13.1, 9.0, 13.1]], cabLen: 10,
  cab: () => path(poly([[2.3, 7.4], [5.9, 11.7], [7.2, 11.7], [4.5, 7.4]]), C.glass) + win(8.2, 7.9, 1.7, 2.7, 0.3),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, KTM.white) + rect(0, 12.3, L, 2, KTM.roof) + rect(nose ? 10.5 : 0, 6.8, L, 3.4, KTM.grey, 0, 'rx="0.4"') +
      rect(0, 0, L, 4.6, KTM.navy) + rect(0, 4.6, L, 0.45, KTM.red);
    if (nose) s += path("M0 0L12.0 0L12.0 4.6L6.0 4.6Q3.2 4.6 2.2 7.6L0 7.6Z", KTM.navy) + path("M12.0 4.6L12.0 5.05L6.1 5.05Q3.6 5.05 2.6 7.6L2.2 7.6Q3.2 4.6 6.0 4.6Z", KTM.red);
    return s;
  },
};
const d61Door = (x) => ({ x, w: 3.0, y0: 3.5, y1: 10.6, glassY: 0.5, glassH: 0.38, grabs: false });
const d61Rows = (a, n) => [{ xs: seq(a, 6.2, n), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }];
const dmu61Car = drivingCar(D61, { rows: d61Rows(14.6, 9), doors: [d61Door(11.0), d61Door(73.0)], roofItems: [[20, 10, 0.5]],
  extra: () => underframe(24, 54, 3.4, { depth: 1.6, boxes: 3 }) });
const dmu61Mid = middleCar(D61, { rows: d61Rows(7.4, 10), doors: [d61Door(2.0), d61Door(71.0)],
  roofItems: [[30, 9, 0.6]], extra: () => underframe(22, 54, 3.4, { depth: 1.7, boxes: 2 }) + slats(32, 13.1, 5, 0.6, 0.35, "rgba(0,0,0,0.35)") });

// ===================== Locomotive-hauled trains =====================
// The Ekspres Rakyat Timuran and Shuttle Tebrau: diesel locomotives (Class
// 26, also Classes 24 and 25) with air-conditioned coaches. Drawn on the
// Class 26 (ADtranz/Bombardier DE-AC33C, 26101-26120, 2003-04): 23.7 m,
// Co-Co, a cab at each end and a narrower hood between them with walkways
// along it. Navy blue, yellow on the cab ends, a white line along the
// walkway edge.
function ktmLoco(c) {
  const L = c.L, sill = 4.4, cab = 9.4, roof = 13.6, hood = 12.4;
  let s = truck(L / 2 - 21.5, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 }) + truck(L / 2 + 21.5, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 });
  // Fuel tank between the trucks; the end sills, steps and buffer beams.
  s += path(poly([[L / 2 - 12, sill], [L / 2 + 12, sill], [L / 2 + 12, 2.4], ["q", L / 2 + 12, 1.6, L / 2 + 11.2, 1.6], [L / 2 - 11.2, 1.6], ["q", L / 2 - 12, 1.6, L / 2 - 12, 2.4]]), "currentColor", 0, 'opacity="0.82"');
  s += rect(0.4, 2.2, L - 0.8, sill - 2.2 + 0.6, "currentColor", 0, 'opacity="0.9"') + rect(0.4, sill + 0.6, L - 0.8, 0.35, "#f4f4f4");
  const cabBox = (x0, x1, front) => poly(front < 0
    ? [[x0, sill + 0.95], [x1, sill + 0.95], [x1, roof], [x0 + 1.4, roof], ["q", x0 + 0.5, roof, x0 + 0.5, roof - 0.9], [x0 + 0.2, 9.4], [x0, sill + 0.95]]
    : [[x0, sill + 0.95], [x1, sill + 0.95], [x1 - 0.2, 9.4], [x1 - 0.5, roof - 0.9], ["q", x1 - 0.5, roof, x1 - 1.4, roof], [x0, roof]]);
  const hoodD = poly([[cab + 0.6, sill + 0.95], [L - cab - 0.6, sill + 0.95], [L - cab - 0.6, hood - 0.5], ["q", L - cab - 0.6, hood, L - cab - 1.1, hood], [cab + 1.1, hood], ["q", cab + 0.6, hood, cab + 0.6, hood - 0.5]]);
  s += path(hoodD, KTM.navy, 0.8) + rect(cab + 0.6, sill + 0.95, L - 2 * cab - 1.2, 0.4, "#f4f4f4");
  s += slats(cab + 3, 8.6, 10, 2.6, 0.35, "rgba(255,255,255,0.22)") + slats(L - cab - 13, 8.6, 10, 2.6, 0.35, "rgba(255,255,255,0.22)");
  for (const x of [cab + 16, cab + 24.5, cab + 33]) s += rect(x, sill + 1.8, 6.4, 4.6, "none", 0.45, 'rx="0.15"');
  for (const x of [L / 2 - 6, L / 2 + 2]) s += path(`M${x} ${hood}Q${x + 2} ${hood + 0.7} ${x + 4} ${hood}Z`, C.steelDark, 0.4);
  // Walkway handrail along the hood.
  s += lines([[cab + 0.8, 8.0, L - cab - 0.8, 8.0], ...seq(cab + 1, 9.6, 6).map((x) => [x, sill + 1.0, x, 8.0])], "currentColor", 0.5);
  for (const [x0, x1, f] of [[0.4, cab + 0.6, -1], [L - cab - 0.6, L - 0.4, 1]]) {
    const d = cabBox(x0, x1, f);
    s += path(d, KTM.navy) + path(poly(f < 0 ? [[x0, sill + 0.95], [x0 + 2.6, sill + 0.95], [x0 + 2.6, 8.8], [x0 + 0.15, 8.8]] : [[x1 - 2.6, sill + 0.95], [x1, sill + 0.95], [x1 - 0.15, 8.8], [x1 - 2.6, 8.8]]), KTM.yellow);
    s += win(f < 0 ? x0 + 1.0 : x1 - 2.6, 9.6, 1.6, 2.6, 0.3) + win(f < 0 ? x0 + 4.0 : x1 - 7.2, 9.6, 3.2, 2.4, 0.3);
    s += path(d, "none", 0.8);
  }
  return s;
}

// KTM's air-conditioned intercity coaches (second-class seats, first class
// and day-night sleepers on the overnight train): a vestibule at each end,
// a long row of windows. White, a navy window band, a red line under it.
const KTM_COACH = { roof: 12.8, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 46.0, wb: 7.5, d: 33 }, diaphragm: [3.9, 11.6], badge: false,
  doors: [{ x: 1.3, w: 2.4, y0: 3.7, y1: 10.6, glassY: 0.55, glassH: 0.3 }, { x: 63.5, w: 2.4, y0: 3.7, y1: 10.6, glassY: 0.55, glassH: 0.3 }],
  rows: [{ xs: seq(6.4, 5.1, 11), y: 7.1, w: 3.9, h: 2.7, r: 0.35 }], roofItems: [[28, 11, 0.5]],
  paint: (c, g) => rect(0, 0, g.L, 17, KTM.white) + rect(0, 12.0, g.L, 2, KTM.roof) + rect(0, 6.8, g.L, 3.3, KTM.navy) + rect(0, 6.4, g.L, 0.3, KTM.red) + rect(0, 0, g.L, 4.4, KTM.skirt) };
const ktmCoach = (c) => bilevel(c, KTM_COACH);

export const TYPES = {
  ets93Car: { name: "KTM Class 93 (ETS) driving car", kind: "emu" },
  ets93Mid: { name: "KTM Class 93 (ETS) car", kind: "emu" },
  ets94Car: { name: "KTM Class 94 (ETS3) driving car", kind: "emu" },
  ets94Mid: { name: "KTM Class 94 (ETS3) car", kind: "emu" },
  ets91Car: { name: "KTM Class 91 (ETS) driving car", kind: "emu" },
  ets91Mid: { name: "KTM Class 91 (ETS) car", kind: "emu" },
  scs92Car: { name: "KTM Class 92 driving car", kind: "emu" },
  scs92Mid: { name: "KTM Class 92 car", kind: "emu" },
  emu83Car: { name: "KTM Class 83 driving car", kind: "emu" },
  emu83Mid: { name: "KTM Class 83 trailer", kind: "emu" },
  dmu61Car: { name: "KTM Class 61 DMU driving car", kind: "emu" },
  dmu61Mid: { name: "KTM Class 61 DMU motor car", kind: "emu" },
  ktmLoco: { name: "KTM diesel locomotive", kind: "diesel" },
  ktmCoach: { name: "KTM intercity coach", kind: "coach" },
};

const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
const pan = (c) => (besideCab(c) ? "pan" : "");
export const MODELS = {
  ets93Car: M(E93.car, 78.7, true), ets93Mid: M(E93.mid, 75.5, false, pan),
  ets94Car: M(E94.car, 78.7, true), ets94Mid: M(E94.mid, 75.5, false, pan),
  ets91Car: M(E91.car, 72.9, true), ets91Mid: M(E91.mid, 72.2, false, pan),
  scs92Car: M(scs92Car, 77.75, true), scs92Mid: M(scs92Mid, 74.8, false, pan),
  emu83Car: M(emu83Car, 72.8, true), emu83Mid: M(emu83Mid, 76.1),
  dmu61Car: M(dmu61Car, 77.4, true), dmu61Mid: M(dmu61Mid, 76.0),
  ktmLoco: M(ktmLoco, 77.75), ktmCoach: M(ktmCoach, 67.3),
};

// The feed names sets, not numbered cars ("ETS202", "SCS21"); ktmb.js maps
// each to its class. These ranges are for the fleet roster: the ETS sets by
// their own numbers, the others by class and set (92001-92038 for SCS 01-38,
// 83019-83040 for EMU 19-40, 61001-61013 for DMU 01-13), and the Class 26
// locomotives by theirs.
export const FLEETS = {
  ktmb: [[101, 105, "ets91Car"], [201, 219, "ets93Car"], [301, 310, "ets94Car"], [61001, 61013, "dmu61Car"], [26101, 26120, "ktmLoco"]],
  ktmkomuter: [[92001, 92038, "scs92Car"], [83019, 83040, "emu83Car"]],
};

const ETS_SETS = {
  ets91Car: ["Class 91", "ets91"], ets93Car: ["Class 93", "ets93"], ets94Car: ["Class 94 (ETS3)", "ets94"],
};
const six = (k) => [[`${k}Car`, 1], [`${k}Mid`, 4], [`${k}Car`, 1]];
export const TYPICAL = {
  // The set the feed names decides; else the line.
  ktmb: (t, reported) => {
    const kind = ETS_SETS[reported] ? "ets" : reported === "dmu61Car" ? "dmu" : reported === "ktmLoco" ? "loco"
      : t.route === "ETS" ? "ets" : t.route === "Intercity Shuttle" ? "dmu" : "loco";
    if (kind === "ets") {
      const [name, k] = ETS_SETS[reported] || ETS_SETS.ets93Car;
      return { label: `Six-car KTM ${name} ETS set${reported ? "" : " (some trains Class 91 or 94)"}`, units: six(k) };
    }
    if (kind === "dmu") {
      return { label: "Four-car KTM Class 61 DMU", units: [["dmu61Car", 1], ["dmu61Mid", 2], ["dmu61Car", 1]] };
    }
    if (t.route === "Shuttle Tebrau") {
      return { label: "Diesel locomotives at each end with air-conditioned coaches", units: [["ktmLoco", 1], ["ktmCoach", 4], ["ktmLoco", 1]] };
    }
    return { label: "Diesel locomotive with seated and sleeper coaches", units: [["ktmLoco", 1], ["ktmCoach", 7]] };
  },
  // Class 92 sets run the Klang Valley lines; the northern lines and Shuttle
  // Selatan are mostly Class 83 three-car sets, with some Class 92s.
  ktmkomuter: (t, reported) => {
    const old = reported ? reported === "emu83Car" : /Padang Besar|Ipoh|Selatan/.test(t.route || "");
    return old
      ? { label: "Three-car KTM Class 83 EMU (some trains Class 92)", units: [["emu83Car", 1], ["emu83Mid", 1], ["emu83Car", 1]] }
      : { label: "Six-car KTM Class 92 EMU", units: six("scs92") };
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const ETS93 = { model: "KTM Class 93", type: "Electric multiple unit (ETS)", builder: "CRRC Zhuzhou", built: "2013–2018", fleet: "19 six-car sets (ETS 201–219)",
  topSpeedMph: 87, powerHp: 3433, seats: 320, lengthFt: 459.3,
  about: "KTMB's main ETS fleet, built in China in two batches: ten sets first, then nine ETS2 sets with a business-class car. They run the electrified West Coast line from Padang Besar to JB Sentral at up to 140 km/h.",
  source: `${WIKI}KTM_Class_93` };
const ETS94 = { model: "KTM Class 94 (ETS3)", type: "Electric multiple unit (ETS)", builder: "CRRC Zhuzhou and CRRC Rolling Stock Centre, Batu Gajah", built: "2023–2025",
  fleet: "10 six-car sets (ETS 301–310)", topSpeedMph: 87, powerHp: 3433, seats: 312, lengthFt: 459.3,
  about: "The newest ETS sets: the first two built in China, the other eight assembled in Batu Gajah, Perak. They entered service in August 2025 on the line south to Kluang and JB Sentral, painted in the colours of Malaysia's flag.",
  source: `${WIKI}KTM_Class_94` };
const ETS91 = { model: "KTM Class 91", type: "Electric multiple unit (ETS)", builder: "Hyundai Rotem and Mitsubishi Electric", built: "2008–2009",
  fleet: "5 six-car sets (ETS 101–105)", topSpeedMph: 87, powerHp: 3218, seats: 350, lengthFt: 434.8,
  about: "The first ETS trains, which opened KTMB's electric intercity service in 2010. They are the smallest of the ETS fleets, with shorter cars and a blunter nose than the Chinese-built sets.",
  source: `${WIKI}KTM_Class_91` };
const SCS92 = { model: "KTM Class 92", type: "Electric multiple unit", builder: "CSR Zhuzhou", built: "2010–2012", fleet: "38 six-car sets (SCS 01–38)",
  topSpeedMph: 77.7, powerHp: 3433, seats: 328, lengthFt: 454.7,
  about: "KTM Komuter's main fleet, six-car trains with three double doors a side on each car. They run most Seremban and Port Klang line trains around Kuala Lumpur and some in the north.",
  source: `${WIKI}KTM_Class_92` };
const EMU83 = { model: "KTM Class 83", type: "Electric multiple unit", builder: "Hyundai Precision and Marubeni", built: "1996–1997", fleet: "22 three-car sets built (EMU 19–40), about 14 in service",
  topSpeedMph: 77.7, powerHp: 1609, seats: 216, lengthFt: 224.4,
  about: "Three-car sets from the 1990s with the pantograph on the middle trailer. Most now run the northern Komuter lines around Butterworth, Ipoh and Padang Besar and the shuttles in Johor.",
  source: `${WIKI}KTM_Class_83` };
const DMU61 = { model: "KTM Class 61", type: "Diesel multiple unit", builder: "CRRC Zhuzhou", built: "2018–2020", fleet: "13 four-car sets (DMU 01–13)",
  topSpeedMph: 74.6, seats: 218, lengthFt: 306.8,
  about: "Four-car diesel trains with MAN power packs under the two middle cars, the first two built in China and the rest at Batu Gajah. They run the intercity shuttles on the unelectrified East Coast line between Tumpat, Gua Musang, Kuala Lipis and Gemas.",
  source: `${WIKI}KTM_Class_61` };
const LOCO = { model: "KTM Class 26", type: "Diesel-electric locomotive", builder: "ADtranz and Bombardier", built: "2003–2004", fleet: "20 (26101–26120)",
  topSpeedMph: 74.6, lengthFt: 77.8,
  about: "A Co-Co road locomotive with a cab at each end, the Malaysian version of the Blue Tiger. KTMB's overnight Ekspres Rakyat Timuran and the Shuttle Tebrau are hauled by these or by the older Class 24 and 25 locomotives.",
  source: `${WIKI}ADtranz_DE-AC33C` };
const COACH = { model: "KTM intercity coach", type: "Passenger coach",
  about: "KTMB's air-conditioned coaches for its locomotive-hauled trains: second-class seats, first class and day-night sleepers with 40 berths a car on the Ekspres Rakyat Timuran.",
  source: `${WIKI}KTM_Intercity` };
const each = (keys, sheet) => Object.fromEntries(keys.map((k) => [k, sheet]));
export const FACTS = {
  ...each(["ets93Car", "ets93Mid"], ETS93),
  ...each(["ets94Car", "ets94Mid"], ETS94),
  ...each(["ets91Car", "ets91Mid"], ETS91),
  ...each(["scs92Car", "scs92Mid"], SCS92),
  ...each(["emu83Car", "emu83Mid"], EMU83),
  ...each(["dmu61Car", "dmu61Mid"], DMU61),
  ktmLoco: LOCO, ktmCoach: COACH,
};
