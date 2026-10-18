// Queensland Rail's City network trains (scripts/railroads/translinkseq.py).
// Translink's feed names each train by its run ("1E25") and its vehicle id is
// a hash of the run, not a unit, so every train is drawn as what typically
// runs: an NGR six-car set. The roster below draws the older three-car
// units too. Drawn from each class's published dimensions; liveries
// simplified from Queensland Rail's current paint.

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, path, poly, win, pantograph } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
// White, a charcoal window band, a gray skirt; the doors in yellow.
const QR = { white: "#f1f2f3", band: "#2e3238", skirt: "#4a4f55", yellow: "#f2c200", roof: "#b4bac1" };

const drivingCar = (spec, car) => (c) => bilevel({ ...c, cabL: true }, { ...spec, ...car, paint: (c, g) => spec.paint(c, g, true) });
const middleCar = (spec, car) => (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...spec, nose: null, cab: null, ...car, paint: (c, g) => spec.paint(c, g, false) });
const qrDoor = (x) => ({ x, w: 4.6, y0: 3.5, y1: 10.5, leaves: 2, glassY: 0.42, glassH: 0.42, fill: QR.yellow });
function qrPaint(c, g, nose, { band = [6.8, 3.6], bandX = 7, noseBlack = null } = {}) {
  const L = g.L;
  let s = rect(0, 0, L, 17, QR.white) + rect(0, 12.1, L, 2, QR.roof) + rect(0, 0, L, 4.2, QR.skirt) + rect(0, 4.2, L, 0.25, QR.yellow) +
    rect(nose ? bandX : 0, band[0], L, band[1], QR.band, 0, 'rx="0.4"');
  if (nose && noseBlack) s += path(noseBlack, QR.band);
  return s;
}

// --- Bombardier NGR (New Generation Rollingstock, 701-775, built at Savli,
// India, 2015-19): six cars, the driving motor cars 25.085 m, the others
// 24 m; formation DM-T-M-M-T-DM, a pantograph on each M car; two double
// doors a side on each car; a raked nose under a big windshield set in
// black. 25 kV, 3 ft 6 in gauge, about 12 ft 11 in to the roof.
const NGR = { roof: 12.9, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.7], badge: false,
  nose: [[1.4, 3.4], [0.9, 4.6], ["q", 0.8, 6.5, 1.4, 7.4], [3.8, 11.8], ["q", 4.6, 12.9, 6.4, 12.9]], cabLen: 7,
  cab: () => path(poly([[1.8, 7.6], [4.0, 11.4], [5.4, 11.4], [5.4, 7.6]]), C.glass) + win(6.4, 7.6, 1.6, 2.6, 0.3),
  paint: (c, g, nose) => qrPaint(c, g, nose, { noseBlack: "M0 6.9L8.6 6.9L8.6 12.9L4.8 12.9Q2.6 10.4 1.2 7.6Z" }),
};
const ngrRows = (xs) => [{ xs, y: 6.95, w: 4.7, h: 3.3, r: 0.4 }];
const ngrCar = drivingCar(NGR, { rows: ngrRows([9.4, 14.8, ...seq(27.0, 5.5, 6), 66.8, 72.4]), doors: [qrDoor(21.0), qrDoor(60.5)], roofItems: [[26, 16, 0.5]] });
const NGR_MID = { rows: ngrRows([3.4, 9.4, ...seq(24.6, 5.4, 6), 63.0, 68.6]), doors: [qrDoor(17.4), qrDoor(56.7)], roofItems: [[22, 16, 0.5]] };
// The two M cars, third from each end, carry the pantographs.
const motor = (c) => c.index === 2 || c.index === c.count - 3;
const ngrMid = middleCar(NGR, { ...NGR_MID, extra: (c) => (motor(c) ? pantograph(14, 12.9) : "") });

// --- Downer EDI Rail and Bombardier IMU160 (161-188) and SMU260 (261-296),
// built at Maryborough 2007-11: three cars, the driving cars 24.21 m and
// the middle car 24 m with the pantograph; two double doors a side; a
// gently raked front. The IMUs (interurbans) have toilets and high-backed
// seats, the SMUs (suburbans) not; outside they look alike.
// --- Walkers SMU200 (201-212) and SMU220 (221-250), and IMU100 (101-110)
// and IMU120 (121-124), built at Maryborough 1994-2002: the same layout
// with a flatter front and smaller windows.
const IMU = { roof: 12.8, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 54.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.6], badge: false,
  nose: [[1.0, 3.4], [0.8, 4.6], [0.8, 8.2], ["q", 0.9, 10.2, 1.8, 11.6], ["q", 2.6, 12.8, 4.2, 12.8]], cabLen: 5,
  cab: () => path(poly([[1.0, 7.5], [1.0, 9.8], ["q", 1.2, 10.9, 2.2, 11.5], [3.8, 11.5], [3.8, 7.5]]), C.glass) + win(4.8, 7.6, 1.5, 2.6, 0.3),
  paint: (c, g, nose) => qrPaint(c, g, nose, { bandX: 4.2, noseBlack: "M0 6.9L4.4 6.9L4.4 12.8L0 12.8Z" }),
};
const WALKERS = { ...IMU, nose: [[0.8, 3.4], [0.6, 4.6], [0.6, 10.6], ["q", 0.7, 12.0, 1.6, 12.5], ["q", 2.2, 12.8, 3.4, 12.8]], cabLen: 4,
  cab: () => win(0.9, 7.6, 2.4, 3.4, 0.3) + win(4.2, 7.6, 1.4, 2.6, 0.3),
  paint: (c, g, nose) => qrPaint(c, g, nose, { band: [7.1, 2.9], bandX: 3.4, noseBlack: "M0 7.1L3.6 7.1L3.6 11.6L0 11.6Z" }) };
const threeCar = (spec, { w, h }) => {
  const rows = (xs) => [{ xs, y: spec === WALKERS ? 7.3 : 7.0, w, h, r: 0.35 }];
  return {
    car: drivingCar(spec, { rows: rows([7.0, 11.9, ...seq(23.4, 5.4, 6), 63.2, 68.6, 74.0]), doors: [qrDoor(17.0), qrDoor(57.0)], roofItems: [[24, 16, 0.5]] }),
    mid: middleCar(spec, { rows: rows([2.0, 7.4, ...seq(23.6, 5.4, 6), 62.6, 68.0, 73.4]), doors: [qrDoor(17.4), qrDoor(56.7)],
      roofItems: [[46, 12, 0.5]], extra: () => pantograph(14, spec.roof) }),
  };
};
const IMU160 = threeCar(IMU, { w: 4.6, h: 3.2 }), OLDER = threeCar(WALKERS, { w: 4.2, h: 2.6 });

export const TYPES = {
  ngrCar: { name: "NGR driving car", kind: "emu" },
  ngrMid: { name: "NGR car", kind: "emu" },
  imuCar: { name: "IMU160 or SMU260 driving car", kind: "emu" },
  imuMid: { name: "IMU160 or SMU260 middle car", kind: "emu" },
  smuCar: { name: "SMU200/220 or IMU100/120 driving car", kind: "emu" },
  smuMid: { name: "SMU200/220 or IMU100/120 middle car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ngrCar: M(ngrCar, 82.3, true), ngrMid: M(ngrMid, 78.74, false, (c) => (motor(c) ? "pan" : "")),
  imuCar: M(IMU160.car, 79.4, true), imuMid: M(IMU160.mid, 78.74),
  smuCar: M(OLDER.car, 79.4, true), smuMid: M(OLDER.mid, 78.74),
};
// Unit numbers, for the fleet roster (the feed names no units).
export const FLEETS = {
  translinkseq: [[701, 775, "ngrCar"], [161, 188, "imuCar"], [261, 296, "imuCar"], [101, 110, "smuCar"], [121, 124, "smuCar"], [201, 212, "smuCar"], [221, 250, "smuCar"]],
};
const THREE = { imuCar: ["imuCar", "imuMid"], smuCar: ["smuCar", "smuMid"] };
export const TYPICAL = {
  translinkseq: (t, reported) => {
    if (THREE[reported]) {
      const [car, mid] = THREE[reported];
      return { label: "Three-car unit, usually two coupled", units: [[car, 1], [mid, 1], [car, 1]] };
    }
    return { label: "NGR six-car train (some runs use two coupled three-car SMU or IMU units)",
      units: [["ngrCar", 1], ["ngrMid", 4], ["ngrCar", 1]] };
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const NGR_FACTS = { model: "New Generation Rollingstock (NGR)", type: "Electric multiple unit", builder: "Bombardier Transportation (Savli, India)", built: "2015–2019",
  fleet: "75 six-car sets (701–775)", topSpeedMph: 87, seats: 454, lengthFt: 479.6,
  about: "Queensland Rail's newest and largest fleet: six-car trains with accessible toilets in the two middle cars, in service since December 2017. They run on every City network line, from the Sunshine Coast to the Gold Coast.",
  source: `${WIKI}New_Generation_Rollingstock` };
const IMU_FACTS = { model: "IMU160 / SMU260", type: "Electric multiple unit", builder: "Downer EDI Rail and Bombardier (Maryborough)", built: "2007–2011",
  fleet: "28 IMU160 (161–188) and 36 SMU260 (261–296) three-car units", topSpeedMph: 81, powerHp: 1931, lengthFt: 237.6,
  about: "Three-car units built in Maryborough, usually run in pairs as six-car trains. The interurban IMU160s have toilets and high-backed seats for the longer lines; the suburban SMU260s have neither.",
  source: `${WIKI}Interurban_multiple_unit` };
const SMU_FACTS = { model: "SMU200/220 and IMU100/120", type: "Electric multiple unit", builder: "Walkers Limited (Maryborough)", built: "1994–2002",
  fleet: "42 SMU (201–212, 221–250) and 14 IMU (101–110, 121–124) three-car units", topSpeedMph: 62, powerHp: 1931, lengthFt: 237.6,
  about: "The older three-car units, built by Walkers in Maryborough with ABB and ADtranz. The suburban SMUs are limited to 100 km/h; the interurban IMU100 and IMU120 sets run at up to 140 km/h.",
  source: `${WIKI}Suburban_multiple_unit` };
const each = (keys, sheet) => Object.fromEntries(keys.map((k) => [k, sheet]));
export const FACTS = {
  ...each(["ngrCar", "ngrMid"], NGR_FACTS),
  ...each(["imuCar", "imuMid"], IMU_FACTS),
  ...each(["smuCar", "smuMid"], SMU_FACTS),
};
