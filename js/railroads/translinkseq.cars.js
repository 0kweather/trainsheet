// Queensland Rail's City network trains (scripts/railroads/translinkseq.py).
// Translink's feed names each train by its run ("1E25") and its vehicle id is
// a hash of the run, not a unit, so every train is drawn as what typically
// runs: an NGR six-car set. The roster below draws the older three-car
// units too. Drawn from each class's published dimensions and photographs
// of the current paint; the lettering is drawn as type, not copied from the
// operators' logos.

import { bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, pantograph, underframe, slats, flutes } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const QR = {
  white: "#f1f2f3", charcoal: "#2f3338", grey: "#8e959c", silver: "#b9bec4", steel: "#cfd3d8", roof: "#c9cdd2",
  yellow: "#f2c200", amber: "#f39a1e", red: "#c8102e", crimson: "#a6192e", blue: "#2a62b0", black: "#15181b", skirt: "#4a4f55",
};

// ---------- Drawing helpers ----------

const r2 = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering on a car side, h ft tall, centered at x, reading left to right
// even on a car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, italic = false, spacing = 0 } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" font-weight="${weight}"` +
  `${italic ? ' font-style="italic"' : ""}${spacing ? ` letter-spacing="${spacing}"` : ""} font-family="${SANS}" fill="${fill}">${text}</text>`;
// Queensland Rail's name as on its trains, after a small mark: a red
// square with two white wedges (drawn simply, not the logo artwork).
const qrName = (c, x, y, h, fill = QR.red) => {
  const k = c.mirrored ? -1 : 1, mx = x - k * h * 4.6;
  return rect(mx - h * 0.55, y - h * 0.55, h * 1.1, h * 1.1, QR.red, 0, `rx="${r2(h * 0.18)}"`) +
    path(poly([[mx - h * 0.35, y - h * 0.3], [mx + h * 0.35, y - h * 0.3], [mx, y + h * 0.35]]), "#ffffff") +
    letters(c, x + k * h * 0.4, y, h, "QueenslandRail", fill, { weight: 700 });
};
const endOf = (p) => (p[0] === "q" ? [p[3], p[4]] : p);
const above = (pts, fill, top = 18) => path(poly([...pts, [endOf(pts[pts.length - 1])[0], top], [pts[0][0], top]]), fill);

// Roof: an air-conditioning unit (a low housing, its two grilles, a seam
// along the lid); a pantograph on its insulated deck with the lightning
// arrester beside it and the roof cable along insulators; horns; an antenna.
function acUnit(x, w, roof, { h = 0.8, fill = "#c3c8ce" } = {}) {
  const t = roof + h, gw = Math.min(3, w * 0.28);
  return path(poly([[x, roof - 0.05], [x + w, roof - 0.05], [x + w - 0.25, t - 0.25], ["q", x + w - 0.4, t, x + w - 0.8, t], [x + 0.8, t], ["q", x + 0.4, t, x + 0.25, t - 0.25]]), fill, 0.4) +
    slats(x + 0.9, roof + 0.12, gw, h - 0.42, 0.3, "rgba(0,0,0,0.35)") + slats(x + w - 0.9 - gw, roof + 0.12, gw, h - 0.42, 0.3, "rgba(0,0,0,0.35)") +
    line(x + 0.7, t - 0.16, x + w - 0.7, t - 0.16, "rgba(255,255,255,0.5)", 0.4);
}
function panDeck(cx, roof, { facing = 1, cableTo = null } = {}) {
  let s = rect(cx - 3.3, roof - 0.05, 6.6, 0.35, "#8f969e", 0.4) + pantograph(cx, roof + 0.3, { facing });
  const ax = cx + 4.1 * facing;
  s += rect(ax - 0.2, roof, 0.4, 0.95, "#7d848c", 0.3) + lines([[ax - 0.27, roof + 0.32, ax + 0.27, roof + 0.32], [ax - 0.27, roof + 0.62, ax + 0.27, roof + 0.62]], "#4a5057", 0.6) + circle(ax, roof + 1.05, 0.16, "#5a6068");
  if (cableTo != null) {
    const a = Math.min(ax, cableTo), b = Math.max(ax, cableTo);
    s += line(a, roof + 0.5, b, roof + 0.5, "#3a3f45", 0.8) + seq(a + 2, 5, Math.max(0, Math.floor((b - a - 2) / 5))).map((x) => rect(x - 0.12, roof, 0.24, 0.5, "#7d848c")).join("");
  }
  return s;
}
const horns = (x, y) => rect(x, y, 1.2, 0.3, "#5a6068", 0.3) + path(poly([[x, y + 0.05], [x - 0.5, y - 0.1], [x - 0.5, y + 0.42], [x, y + 0.27]]), "#6a7078");
const antenna = (x, roof) => line(x, roof, x, roof + 0.9, "#3a3f45", 0.6) + rect(x - 0.3, roof - 0.02, 0.6, 0.15, "#5a6068");
// Under the floor: the equipment hung in the open (boxes, an air reservoir,
// cable conduit, a brake resistor grille); under each truck the yaw damper
// and brake unit; each side door's step plate and the door light over it.
const equipment = (x0, x1, top, { depth = 1.5, boxes = 3 } = {}) => underframe(x0, x1, top, { depth, boxes }) + line(x0, top - 0.25, x1, top - 0.25, "#3a3f45", 0.9) +
  slats(x0 + 0.8, top - depth + 0.2, Math.min(4, (x1 - x0) / 6), depth - 0.4, 0.3, "rgba(255,255,255,0.25)");
const bogieGear = (cx, wb, top) => line(cx - wb / 2 - 0.6, top - 0.55, cx - 1.9, top - 0.55, "#5a6068", 1.0) + rect(cx + 1.7, 1.55, 1.1, 0.7, "#5a6068", 0, 'rx="0.15"');
const doorTrim = (doors, sill) => doors.map((d) => rect(d.x - 0.1, sill - 0.42, d.w + 0.2, 0.36, "#3a3f45") + rect(d.x + d.w / 2 - 0.3, d.y1 + 0.22, 0.6, 0.18, "#e8a317")).join("");
// Headlight, front coupler (x: its face) with draft gear and hoses.
const lamp = (x, y, w, h, lens = "#fff6d0") => rect(x, y, w, h, "#e9edf0", 0.35, 'rx="0.15"') + circle(x + h / 2, y + h / 2, h * 0.3, lens);
const frontCoupler = (x, y = 2.85, reach = 2.0) => rect(x + 0.3, y - 0.3, reach, 0.6, "#2a2d31") + rect(x, y - 0.62, 0.55, 1.24, "#2a2d31", 0, 'rx="0.15"') + rect(x + 0.7, y + 0.35, 1.0, 0.32, "#5a6068") +
  path(`M${r2(x + 1.0)} ${r2(y - 0.3)}Q${r2(x + 0.8)} ${r2(y - 1.3)} ${r2(x + 1.8)} ${r2(y - 1.2)}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.8" vector-effect="non-scaling-stroke" stroke-linecap="round"');
// The anticlimber and the skirt under a cab front, from x0 back to x1.
const cabSkirt = (x0, x1, sill) => path(poly([[x0, sill + 0.05], [x1, sill + 0.05], [x1 - 0.2, 1.2], [x1 - 0.6, 0.7], [x0 + 0.3, 0.7], [x0 - 0.3, 1.6]]), "#33373c") +
  lines([[x0 - 0.1, 1.55, x1 - 0.4, 1.55], [x0, sill - 0.3, x1, sill - 0.3]], "#5a6068", 0.6);
// Queensland Rail's doors: yellow, the leaves edged dark, a chevron of
// warning stripes on the older units' doors.
const chevrons = (doors) => doors.map((d) => lines([0.3, 0.7].map((k) => {
  const x = d.x + d.w * k, y = d.y0 + (d.y1 - d.y0) * 0.24;
  return [[x - 0.45, y - 0.5, x, y], [x, y, x + 0.45, y - 0.5]];
}).flat(), "#2b2e33", 0.9)).join("");

// A multiple unit's driving car (its nose on the left; the consist mirrors
// the one at the back) and its intermediate cars, from one spec: body (roof,
// sill, trucks), nose, cabLen, paint(c, g, nose), cab(c, g), detail(c, g,
// nose, car) and per car rows, doors and onRoof(c, g).
function unit(spec, car, nose) {
  return (c) => bilevel(nose ? { ...c, cabL: true } : { ...c, cabL: false, cabR: false }, {
    ...spec, ...(nose ? {} : { nose: null, cab: null }), ...car, roofItems: [],
    paint: (c, g) => spec.paint(c, g, nose, car),
    extra: (c, g) => {
      const t = spec.trucks, a = g.L / 2 - t.centers / 2, b = g.L / 2 + t.centers / 2;
      return bogieGear(a, t.wb, spec.sill) + bogieGear(b, t.wb, spec.sill) + doorTrim(car.doors, spec.sill) +
        equipment(a + 6.4, b - 6.4, spec.sill, { depth: 1.5, boxes: 4 }) + (spec.detail ? spec.detail(c, g, nose, car) : "") + (car.onRoof ? car.onRoof(c, g) : "");
    },
  });
}
const drivingCar = (spec, car) => unit(spec, car, true);
const middleCar = (spec, car) => unit(spec, car, false);

// --- Bombardier NGR (New Generation Rollingstock, 701-775, built at Savli,
// India, 2015-19): six cars, the driving motor cars 25.085 m, the others
// 24 m; formation DM-T-M-M-T-DM, a pantograph on each M car; two double
// doors a side on each car; a raked nose under a big windshield set in
// black. 25 kV, 3 ft 6 in gauge, about 12 ft 11 in to the roof.
// Translink's paint: the sides charcoal over silver gray, the big windows
// in the charcoal; a white roof, a white panel at each end of every car;
// the doors framed in yellow and amber with a red and a blue strip beside
// them; the cab white, its windshield in a black mask, a yellow and amber
// swoosh rising from under the headlights up the back of the cab.
const NGR = { roof: 12.9, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.7], badge: false,
  nose: [[1.4, 3.4], [0.9, 4.6], ["q", 0.8, 6.5, 1.4, 7.4], [3.8, 11.8], ["q", 4.6, 12.9, 6.4, 12.9]], cabLen: 7,
  cab: () => path(poly([[1.2, 6.6], ["q", 2.6, 9.6, 4.2, 12.2], ["q", 4.8, 12.6, 6.0, 12.6], [7.6, 12.6], [7.6, 7.0], ["q", 4.0, 6.4, 1.2, 6.6]]), QR.black) +
    path(poly([[3.0, 9.9], ["q", 3.6, 11.0, 4.4, 12.0], [7.3, 12.0], [7.3, 9.9]]), C.glassLight) + line(2.2, 7.0, 3.4, 9.6, "#0a0b0c", 0.8) +
    rect(5.3, 11.9, 2.0, 0.5, "#1d1f22", 0, 'rx="0.1"') + lines([[5.5, 12.15, 7.1, 12.15]], "#f5a623", 0.6) +
    lamp(0.85, 5.0, 1.3, 0.75) + rect(0.9, 4.4, 0.55, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.8) + cabSkirt(1.4, 5.6, 3.4) +
    rect(8.1, 3.9, 2.1, 7.4, "none", 0.5, 'rx="0.2"') + win(8.35, 7.6, 1.6, 2.6, 0.3) + line(10.5, 6.0, 10.5, 9.0, "currentColor", 0.6),
  paint: (c, g, nose, car) => {
    const L = g.L, x0 = nose ? 11.0 : 1.2, x1 = L - 1.2;
    let s = rect(0, 0, L, 18, QR.white) + rect(x0, 3.4, x1 - x0, 3.25, QR.silver) + rect(x0, 6.65, x1 - x0, 5.0, QR.charcoal) + rect(x0, 6.5, x1 - x0, 0.15, "#d7dbdf") +
      rect(0, 0, L, 3.9, QR.skirt);
    // The door frames, and the red and blue strips beside them.
    for (const d of car.doors) {
      s += rect(d.x - 0.55, d.y0, 0.3, d.y1 - d.y0 + 0.35, QR.yellow) + rect(d.x - 0.25, d.y0, 0.25, d.y1 - d.y0 + 0.35, QR.amber) +
        rect(d.x + d.w, d.y0, 0.25, d.y1 - d.y0 + 0.35, QR.amber) + rect(d.x + d.w + 0.25, d.y0, 0.3, d.y1 - d.y0 + 0.35, QR.yellow) +
        rect(d.x + d.w + 0.75, 6.65, 0.35, 5.0, QR.red) + rect(d.x - 1.1, 6.65, 0.35, 5.0, QR.blue);
    }
    if (nose) s += path(poly([[0.6, 4.2], ["q", 4.6, 4.4, 7.0, 6.2], ["q", 9.2, 8.2, 9.8, 12.9], [10.9, 12.9], ["q", 10.6, 7.6, 7.8, 5.0], ["q", 5.6, 3.6, 0.6, 3.6]]), QR.yellow) +
      path(poly([[0.6, 3.6], ["q", 5.6, 3.6, 7.8, 5.0], ["q", 10.6, 7.6, 10.9, 12.9], [11.6, 12.9], ["q", 11.4, 7.0, 8.4, 4.4], ["q", 6.0, 3.0, 0.6, 3.1]]), QR.amber);
    return s;
  },
  detail: (c, g, nose) => (nose ? letters(c, 41.0, 5.05, 1.1, "TRANSLink", QR.charcoal, { weight: 800 }) : ""),
};
const qrDoor = (x) => ({ x, w: 4.6, y0: 3.5, y1: 10.5, leaves: 2, glassY: 0.42, glassH: 0.42, fill: "rgba(0,0,0,0.12)" });
const ngrRows = (xs) => [{ xs, y: 6.95, w: 4.7, h: 3.9, r: 0.4 }];
// The two M cars, third from each end, carry the pantographs.
const motor = (c) => c.index === 2 || c.index === c.count - 3;
const ngrCar = drivingCar(NGR, { rows: ngrRows([13.6, ...seq(27.0, 5.5, 6), 66.8, 72.4]), doors: [qrDoor(21.0), qrDoor(60.5)],
  onRoof: (c, g) => acUnit(24, 11, 12.9) + acUnit(56, 10, 12.9) + horns(8.0, 12.9) + antenna(10.4, 12.9) });
const ngrMid = middleCar(NGR, { rows: ngrRows([3.4, 9.4, ...seq(24.6, 5.4, 6), 63.0, 68.6]), doors: [qrDoor(17.4), qrDoor(56.7)],
  onRoof: (c, g) => (motor(c) ? panDeck(14, 12.9, { cableTo: 30 }) + acUnit(46, 11, 12.9) : acUnit(10, 11, 12.9) + acUnit(52, 11, 12.9)) });

// --- Downer EDI Rail and Bombardier IMU160 (161-188) and SMU260 (261-296),
// built at Maryborough 2007-11: three cars, the driving cars 24.21 m and
// the middle car 24 m with the pantograph; two double doors a side; a
// gently raked front. The IMUs (interurbans) have toilets and high-backed
// seats, the SMUs (suburbans) not; outside they look alike: ribbed
// stainless sides, a crimson band along the top of the side, the cab end
// yellow with its windshield in black; yellow doors with a red panel
// beside each.
// --- Walkers SMU200 (201-212) and SMU220 (221-250), and IMU100 (101-110)
// and IMU120 (121-124), built at Maryborough 1994-2002: the same layout
// with a flatter yellow front, smaller windows and plain stainless sides.
const IMU = { roof: 12.8, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 54.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.6], badge: false,
  nose: [[1.0, 3.4], [0.8, 4.6], [0.8, 8.2], ["q", 0.9, 10.2, 1.8, 11.6], ["q", 2.6, 12.8, 4.2, 12.8]], cabLen: 5,
  cab: () => path(poly([[0.85, 7.3], [0.85, 9.8], ["q", 1.1, 11.1, 2.2, 11.8], [4.1, 11.8], [4.1, 7.3]]), QR.black) + path(poly([[0.9, 9.8], ["q", 1.2, 11.0, 2.2, 11.6], [3.9, 11.6], [3.9, 9.8]]), C.glassLight) +
    line(1.4, 7.6, 2.0, 9.6, "#0a0b0c", 0.8) + rect(1.9, 11.95, 1.8, 0.45, "#1d1f22", 0, 'rx="0.1"') + win(4.8, 7.6, 1.5, 2.6, 0.3) + rect(4.55, 3.9, 2.0, 7.4, "none", 0.5, 'rx="0.2"') +
    lamp(0.85, 5.4, 1.2, 0.7) + rect(0.85, 4.75, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.4) + cabSkirt(1.0, 4.6, 3.4),
  paint: (c, g, nose, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, QR.steel) + flutes(0, L, 3.7, 6.6, 0.27) + flutes(0, L, 10.5, 11.5, 0.27) + rect(0, 11.6, L, 1.5, QR.crimson) + rect(0, 12.6, L, 2, QR.roof) +
      rect(0, 0, L, 3.75, QR.skirt);
    for (const d of car.doors) s += rect(d.x + d.w + 0.4, 6.9, 0.9, 3.2, QR.red, 0, 'rx="0.15"');
    if (nose) s += path(poly([[0, -1], [6.6, -1], [6.6, 10.6], ["q", 6.6, 11.8, 7.8, 11.8], [7.8, 13.4], [0, 13.4]]), QR.yellow) + line(6.6, 3.4, 6.6, 10.6, "rgba(0,0,0,0.3)", 0.5);
    return s;
  },
  detail: (c, g, nose, car) => chevrons(car.doors) + (nose ? qrName(c, 37.5, 5.4, 0.95) : ""),
};
const WALKERS = { ...IMU, nose: [[0.8, 3.4], [0.6, 4.6], [0.6, 10.6], ["q", 0.7, 12.0, 1.6, 12.5], ["q", 2.2, 12.8, 3.4, 12.8]], cabLen: 4,
  cab: () => path(poly([[0.65, 7.4], [0.65, 11.3], [3.6, 11.3], [3.6, 7.4]]), QR.black) + path(poly([[0.7, 10.0], [0.7, 11.1], [3.4, 11.1], [3.4, 10.0]]), C.glassLight) +
    line(1.2, 7.6, 1.8, 9.8, "#0a0b0c", 0.8) + slats(0.9, 12.0, 2.4, 0.6, 0.3, "rgba(0,0,0,0.45)") + win(4.4, 7.6, 1.4, 2.6, 0.3) + rect(4.15, 3.9, 1.9, 7.4, "none", 0.5, 'rx="0.2"') +
    lamp(0.65, 5.4, 1.2, 0.7) + rect(0.65, 4.75, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.4) + cabSkirt(0.8, 4.4, 3.4),
  paint: (c, g, nose, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, QR.steel) + flutes(0, L, 3.7, 6.9, 0.27) + flutes(0, L, 10.2, 12.0, 0.27) + rect(0, 12.2, L, 2, QR.roof) + rect(0, 0, L, 3.75, QR.skirt);
    if (nose) s += path(poly([[0, -1], [6.2, -1], [6.2, 11.0], ["q", 6.2, 12.2, 7.2, 12.2], [7.2, 13.4], [0, 13.4]]), QR.yellow) + line(6.2, 3.4, 6.2, 11.0, "rgba(0,0,0,0.3)", 0.5);
    return s;
  },
  detail: (c, g, nose, car) => chevrons(car.doors) + (nose ? qrName(c, 37.5, 5.6, 0.95) : ""),
};
const yellowDoor = (x) => ({ ...qrDoor(x), fill: QR.yellow });
const threeCar = (spec, { w, h }) => {
  const rows = (xs) => [{ xs, y: spec === WALKERS ? 7.3 : 7.0, w, h, r: 0.35 }];
  return {
    car: drivingCar(spec, { rows: rows([7.0, 11.9, ...seq(23.4, 5.4, 6), 63.2, 68.6, 74.0]), doors: [yellowDoor(17.0), yellowDoor(57.0)],
      onRoof: (c, g) => acUnit(24, 10, spec.roof) + acUnit(46, 10, spec.roof) + horns(5.2, spec.roof) + antenna(8.4, spec.roof) }),
    mid: middleCar(spec, { rows: rows([2.0, 7.4, ...seq(23.6, 5.4, 6), 62.6, 68.0, 73.4]), doors: [yellowDoor(17.4), yellowDoor(56.7)],
      onRoof: (c, g) => panDeck(14, spec.roof, { cableTo: 30 }) + acUnit(36, 10, spec.roof) + acUnit(60, 10, spec.roof) }),
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
