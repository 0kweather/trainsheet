// Queensland Rail's City network trains (scripts/railroads/translinkseq.py).
// Translink's feed names each train by its run ("1E25") and its vehicle id is
// a hash of the run, not a unit, so every train is drawn as what typically
// runs on its line (TYPICAL below): an NGR six-car set on most, the older
// three-car units where NGRs can't run. Every class in service has its own
// drawing. Drawn from each class's published dimensions and photographs
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
  return (c) => bilevel(nose ? { ...c, cabL: true, cabR: false } : { ...c, cabL: false, cabR: false }, {
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

// --- The three-car units. Two run coupled as a six-car train on most
// lines; one alone on the Rosewood shuttle. Each unit is a driving car, a
// middle car with the pantograph and a second driving car facing the other
// way: drawn as an "A" driving car (its cab on the left), the middle car and
// a "B" driving car (the A car's drawing mirrored, its cab on the right), so
// two units coupled meet cab to cab as they do.
//
// Downer EDI Rail and Bombardier IMU160 (161-188, 28 units) and SMU260
// (261-296, 36 units), built at Maryborough 2007-11 to the design of
// Transperth's B-series: the driving cars 24.21 m and the middle car 24.0 m
// (72.42 m a unit; Wikipedia), 2.7 m wide, 3.9 m to the roof; DM-T-DM with
// the pantograph on the middle trailer (railtram.com.au: IM5/IM7/IM8 cars);
// two double doors a side, 1274 mm wide (Queensland Rail's accessibility
// pages). Outside the two classes are one design: Queensland Rail
// describes the IMU160 as the SMU260 with toilets and luggage racks. The
// IMU160's published layout puts a unisex toilet between the cab and the
// first doors of one driving car (the leading one is drawn with it): its
// window there is frosted. Their paint (photos of 164, 167, 184, 266, 272,
// 277 and 290 on Wikimedia Commons): the rounded nose yellow, its
// windshield in a black mask that wraps round onto the cab side, the
// yellow edged behind by a crimson sweep that runs into a crimson band along
// the top of the side; the cab side and the lower nose silver; ribbed
// stainless sides; yellow doors with a dark fern motif down the middle and
// a red panel beside each door.
const IMU = { roof: 12.8, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 54.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.6], badge: false,
  nose: [[1.0, 3.4], [0.8, 4.6], [0.8, 8.2], ["q", 0.9, 10.2, 1.8, 11.6], ["q", 2.6, 12.8, 4.2, 12.8]], cabLen: 5,
  // The windshield's edge at the nose; behind the yellow, the black mask
  // wrapping onto the cab side round the cab side window; the crew door.
  cab: () => path(poly([[0.8, 8.3], ["q", 0.9, 10.2, 1.8, 11.6], [2.4, 11.6], ["q", 1.4, 10.2, 1.3, 8.3]]), QR.black) +
    path(poly([[2.6, 7.3], [2.6, 9.9], ["q", 2.9, 11.0, 3.6, 11.6], [4.2, 11.6], [4.2, 7.3]]), QR.black) + win(2.9, 7.7, 1.1, 2.4, 0.25) +
    rect(1.9, 11.95, 1.8, 0.45, "#1d1f22", 0, 'rx="0.1"') + win(4.8, 7.6, 1.5, 2.6, 0.3) + rect(4.55, 3.9, 2.0, 7.4, "none", 0.5, 'rx="0.2"') +
    lamp(0.85, 5.4, 1.2, 0.7) + rect(0.85, 4.75, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.4) + cabSkirt(1.0, 4.6, 3.4),
  paint: (c, g, nose, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, QR.steel) + flutes(0, L, 3.7, 6.6, 0.27) + flutes(0, L, 10.5, 11.5, 0.27) + rect(0, 11.6, L, 1.5, QR.crimson) + rect(0, 12.6, L, 2, QR.roof) +
      rect(0, 0, L, 3.75, QR.skirt);
    // A red panel beside each door, on the side toward the middle of the car.
    car.doors.forEach((d, i) => { s += rect(i ? d.x - 1.3 : d.x + d.w + 0.4, 6.9, 0.9, 3.2, QR.red, 0, 'rx="0.15"'); });
    // The cab: its side smooth silver, the yellow round the nose, the
    // crimson sweep behind it, the lower nose silver.
    if (nose) s += rect(0, 3.4, 6.7, 8.2, "#c4c9ce") + line(6.7, 3.5, 6.7, 11.5, "rgba(0,0,0,0.25)", 0.5) +
      path(poly([[-1, 4.3], [2.3, 4.3], [2.3, 8.0], ["q", 2.5, 10.4, 3.6, 11.6], ["q", 4.5, 12.5, 6.0, 13.4], [-1, 13.4]]), QR.yellow) +
      path(poly([[2.3, 8.8], ["q", 2.5, 10.4, 3.6, 11.6], ["q", 4.5, 12.5, 6.0, 13.4], [7.0, 13.4], ["q", 5.2, 12.4, 4.3, 11.6], ["q", 3.1, 10.6, 2.9, 8.8]]), QR.crimson) +
      path(poly([[-1, 3.2], [2.6, 3.2], [2.3, 4.3], [-1, 4.4]]), QR.silver);
    return s;
  },
  detail: (c, g, nose, car) => chevrons(car.doors),
};
// --- Walkers Limited SMU200 (201-212, 1994-95) and SMU220 (221-250,
// 1999-2001), IMU100 (101-110, 1996-97) and IMU120 (121-124, 2001-02), all
// built at Maryborough: three cars, 72.4 m a unit, 2.7 m wide, 3.9 m high
// (Wikipedia). The SMU200s and IMU100s are DM-M-DT, both motor cars ahead
// of an unpowered driving trailer (Bo'Bo'+Bo'Bo'+2'2', ABB electrics); the
// SMU220s and IMU120s DM-T-DM like the newer units (Bombardier MITRAC). The
// flat front is yellow back to the crew door, its windows in black, a
// louvred grille on the roof dome; the sides ribbed stainless; the same
// yellow doors with the fern motif and red panels beside them. What tells
// them apart from the side (photos of 202, 208, 212, 224, 229, 247, 104,
// 105 and 123): behind the crew door the SMUs have a two-pane window and a
// tall vertical louvre, the IMU100s the window without the louvre, and the
// IMU120's leading car (IM8123) a single narrow window and a blank panel
// (its toilet compartment); its other driving car is drawn as the IMU100's.
// The SMU220s have a single air-conditioning module in the middle of each
// car (Wikipedia); the SMU200s and IMUs are drawn with two.
const WALKERS = { ...IMU, nose: [[0.8, 3.4], [0.6, 4.6], [0.6, 10.6], ["q", 0.7, 12.0, 1.6, 12.5], ["q", 2.2, 12.8, 3.4, 12.8]], cabLen: 4,
  cab: () => path(poly([[0.65, 7.4], [0.65, 11.3], [3.6, 11.3], [3.6, 7.4]]), QR.black) + path(poly([[0.7, 10.0], [0.7, 11.1], [3.4, 11.1], [3.4, 10.0]]), C.glassLight) +
    line(1.2, 7.6, 1.8, 9.8, "#0a0b0c", 0.8) + slats(0.9, 12.0, 2.4, 0.6, 0.3, "rgba(0,0,0,0.45)") + win(4.4, 7.6, 1.4, 2.6, 0.3) + rect(4.15, 3.9, 1.9, 7.4, "none", 0.5, 'rx="0.2"') +
    lamp(0.65, 5.4, 1.2, 0.7) + rect(0.65, 4.75, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.4) + cabSkirt(0.8, 4.4, 3.4),
  paint: (c, g, nose, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, QR.steel) + flutes(0, L, 3.7, 6.9, 0.27) + flutes(0, L, 10.2, 12.0, 0.27) + rect(0, 12.2, L, 2, QR.roof) + rect(0, 0, L, 3.75, QR.skirt);
    car.doors.forEach((d, i) => { s += rect(i ? d.x - 1.3 : d.x + d.w + 0.4, 7.2, 0.9, 3.0, QR.red, 0, 'rx="0.15"'); });
    if (nose) s += path(poly([[0, -1], [6.2, -1], [6.2, 11.0], ["q", 6.2, 12.2, 7.2, 12.2], [7.2, 13.4], [0, 13.4]]), QR.yellow) + line(6.2, 3.4, 6.2, 11.0, "rgba(0,0,0,0.3)", 0.5);
    return s;
  },
  detail: (c, g, nose, car) => chevrons(car.doors),
};
const yellowDoor = (x) => ({ ...qrDoor(x), fill: QR.yellow });
// What is behind the crew door, from 7.0 to 16.2 ft: a two-pane window
// (SMU, IMU100), with the louvre beside it (SMU), or the IMU120's narrow
// window and blank panel. The IMU160's toilet frosts the first window.
const pane2 = (x, y, w, h) => win(x, y, w, h, 0.3) + line(x + w / 2, y + 0.06, x + w / 2, y + h - 0.06, C.gasket, 0.9);
const frosted = (x, y, w, h) => win(x, y, w, h, 0.35) + rect(x + 0.12, y + 0.12, w - 0.24, h - 0.24, "#dfe3e6", 0, 'rx="0.2" opacity="0.92"');
const behind = {
  smu: () => pane2(7.2, 7.3, 6.4, 2.6) + rect(14.3, 6.9, 1.2, 3.6, "#c3c9d0", 0.4, 'rx="0.12"') + slats(14.4, 7.0, 1.0, 3.4, 0.22, "rgba(0,0,0,0.45)"),
  imu100: () => pane2(7.2, 7.3, 6.4, 2.6),
  imu120: () => win(9.4, 7.3, 1.9, 2.6, 0.3) + rect(12.0, 6.9, 2.2, 3.6, "none", 0.5, 'rx="0.2"'),
  toilet: () => frosted(7.0, 7.0, 4.6, 3.2),
};
// A unit's three drawings: a = the A driving car's extra (behind the
// cab), b = the B car's; ac: air-conditioning units [x, w] on each car.
function threeCar(spec, { w, h, a = null, b = null, ac = [[24, 10], [46, 10]], acMid = [[36, 10], [60, 10]] }) {
  const y = spec === WALKERS ? 7.3 : 7.0;
  const rows = (xs) => [{ xs, y, w, h, r: 0.35 }];
  const lead = [7.0, 11.9, ...seq(23.4, 5.4, 6), 63.2, 68.6, 74.0];
  const driving = (extra) => drivingCar(spec, { rows: rows(extra ? lead.slice(2) : lead), doors: [yellowDoor(17.0), yellowDoor(57.0)],
    onRoof: (c, g) => ac.map(([x, aw]) => acUnit(x, aw, spec.roof)).join("") + horns(5.2, spec.roof) + antenna(8.4, spec.roof) + (extra ? extra(c, g) : "") });
  const carA = driving(a), carB0 = driving(b);
  // The B car is the A car turned round: drawn facing forward, mirrored.
  const carB = (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${carB0({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;
  const mid = middleCar(spec, { rows: rows([2.0, 7.4, ...seq(23.6, 5.4, 6), 62.6, 68.0, 73.4]), doors: [yellowDoor(17.4), yellowDoor(56.7)],
    onRoof: (c, g) => panDeck(14, spec.roof, { cableTo: 30 }) + acMid.map(([x, aw]) => acUnit(x, aw, spec.roof)).join("") });
  return { carA, carB, mid };
}
// The IMU160's toilet window keeps its place in the row: drawn frosted
// over the first window, with the second as usual.
const IMU160 = threeCar(IMU, { w: 4.6, h: 3.2, a: () => behind.toilet() + win(11.9, 7.0, 4.6, 3.2, 0.35) });
const SMU260 = threeCar(IMU, { w: 4.6, h: 3.2 });
const WALK = { w: 4.2, h: 2.6 };
const SMU200 = threeCar(WALKERS, { ...WALK, a: behind.smu, b: behind.smu });
const SMU220 = threeCar(WALKERS, { ...WALK, a: behind.smu, b: behind.smu, ac: [[30, 12]], acMid: [[40, 12]] });
const IMU100 = threeCar(WALKERS, { ...WALK, a: behind.imu100, b: behind.imu100 });
const IMU120 = threeCar(WALKERS, { ...WALK, a: behind.imu120, b: behind.imu100 });

export const TYPES = {
  ngrCar: { name: "NGR driving car", kind: "emu" },
  ngrMid: { name: "NGR car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  ngrCar: M(ngrCar, 82.3, true), ngrMid: M(ngrMid, 78.74, false, (c) => (motor(c) ? "pan" : "")),
};
// Each three-car class: its A and B driving cars and middle car, as
// <prefix>A, <prefix>B and <prefix>Mid.
const CLASSES = { imu160: ["IMU160", IMU160], smu260: ["SMU260", SMU260], smu200: ["SMU200", SMU200], smu220: ["SMU220", SMU220],
  imu100: ["IMU100", IMU100], imu120: ["IMU120", IMU120] };
for (const [k, [name, u]] of Object.entries(CLASSES)) {
  TYPES[`${k}A`] = { name: `${name} driving car`, kind: "emu" };
  TYPES[`${k}B`] = { name: `${name} driving car`, kind: "emu" };
  TYPES[`${k}Mid`] = { name: `${name} middle car`, kind: "emu" };
  MODELS[`${k}A`] = M(u.carA, 79.4);
  MODELS[`${k}B`] = M(u.carB, 79.4);
  MODELS[`${k}Mid`] = M(u.mid, 78.74);
}
// Unit numbers, for the fleet roster (the feed names no units).
export const FLEETS = {
  translinkseq: [[701, 775, "ngrCar"], [161, 188, "imu160A"], [261, 296, "smu260A"], [201, 212, "smu200A"], [221, 250, "smu220A"],
    [101, 110, "imu100A"], [121, 124, "imu120A"]],
};

// What runs where. Translink's feed names runs, not units, so each line
// gets what usually runs on it. The 75 NGRs run most trains on every line
// but two: Queensland Rail told Parliament (question on notice 868, August
// 2024) that they can't run on the Ferny Grove line (platform gaps, and
// Newmarket's and Keperra's platforms are too short), so not on the
// Beenleigh line paired with it either, and that the Rosewood shuttle runs
// three-car units because its platforms are too short for six cars. Those
// lines get the three-car fleets, which also fill in for NGRs anywhere.
// Gympie North trains are interurban IMUs (toilets, high-backed seats).
// The QTMP trains being built at Torbanlea are due in passenger service in
// 2027, so none run yet.
const unit3 = (k) => [[`${k}A`, 1], [`${k}Mid`, 1], [`${k}B`, 1]];
const six = (k) => [...unit3(k), ...unit3(k)];
const NGR_SET = [["ngrCar", 1], ["ngrMid", 4], ["ngrCar", 1]];
const OLDER = "the older three-car units (SMU200, SMU220, SMU260, IMU100, IMU120, IMU160)";
export const TYPICAL = {
  translinkseq: (t) => {
    const r = t.route || "", ends = `${t.origin || ""} ${t.destination || ""}`;
    if (/Rosewood/.test(r)) return { label: "One three-car unit, usually an SMU260 (Rosewood's platforms are too short for six cars)", units: unit3("smu260") };
    if (/Ferny Grove|Beenleigh/.test(r)) return { label: `Six cars: two coupled three-car units, any of ${OLDER}; drawn as two SMU260s (NGRs can't run here)`, units: six("smu260") };
    if (/Gympie/.test(ends)) return { label: "Six cars: two coupled interurban IMUs, usually IMU160s (some IMU100s or IMU120s)", units: six("imu160") };
    if (/Sunshine Coast|Gold Coast|Airport/.test(r)) return { label: "NGR six-car train (some trains two coupled IMU160s or other three-car units)", units: NGR_SET };
    return { label: `NGR six-car train (some trains two coupled three-car units: ${OLDER.replace("the older three-car units ", "")})`, units: NGR_SET };
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const NGR_FACTS = { model: "New Generation Rollingstock (NGR)", type: "Electric multiple unit", builder: "Bombardier Transportation (Savli, India)", built: "2015–2019",
  fleet: "75 six-car sets (701–775)", topSpeedMph: 87, seats: 454, lengthFt: 479.6,
  about: "Queensland Rail's newest and largest fleet: six-car trains with accessible toilets in the two middle cars, in service since December 2017. They run on every City network line but Ferny Grove, Beenleigh and the Rosewood shuttle.",
  source: `${WIKI}New_Generation_Rollingstock` };
const IMU160_FACTS = { model: "IMU160", type: "Electric multiple unit", builder: "Downer EDI Rail and Bombardier (Maryborough)", built: "2007–2011",
  fleet: "28 three-car units (161–188)", topSpeedMph: 81, powerHp: 1931, lengthFt: 237.6,
  about: "Interurban three-car units with a toilet, luggage racks and high-backed seats, usually run in pairs as six-car trains on the longer lines: the Gold Coast, the Sunshine Coast and Gympie North. Outside they match the SMU260.",
  source: `${WIKI}Interurban_multiple_unit` };
const SMU260_FACTS = { model: "SMU260", type: "Electric multiple unit", builder: "Downer EDI Rail and Bombardier (Maryborough)", built: "2008–2011",
  fleet: "36 three-car units (261–296)", topSpeedMph: 81, powerHp: 1931, seats: 236, lengthFt: 237.6,
  about: "Suburban three-car units, the IMU160 without its toilet and luggage racks, and able to run coupled to one. Usually two run together as a six-car train; one alone runs the Rosewood shuttle.",
  source: `${WIKI}Suburban_multiple_unit` };
const SMU200_FACTS = { model: "SMU200", type: "Electric multiple unit", builder: "Walkers Limited (Maryborough), ABB electrics", built: "1994–1995",
  fleet: "12 three-car units (201–212)", topSpeedMph: 62, powerHp: 1931, seats: 240, lengthFt: 237.5,
  about: "Suburban three-car units brought in quickly in 1994 to ease a shortage of trains, two motor cars and a driving trailer, limited to 100 km/h. Usually two run coupled as a six-car train.",
  source: `${WIKI}Suburban_multiple_unit` };
const SMU220_FACTS = { model: "SMU220", type: "Electric multiple unit", builder: "Walkers Limited (Maryborough), Bombardier electrics", built: "1999–2001",
  fleet: "30 three-car units (221–250)", topSpeedMph: 62, powerHp: 1931, seats: 236, lengthFt: 237.5,
  about: "Suburban three-car units bought for the Caboolture line's third track, which replaced Brisbane's last locomotive-hauled suburban carriages. Usually two run coupled as a six-car train.",
  source: `${WIKI}Suburban_multiple_unit` };
const IMU100_FACTS = { model: "IMU100", type: "Electric multiple unit", builder: "Walkers Limited (Maryborough), ABB electrics", built: "1996–1997",
  fleet: "10 three-car units (101–110)", topSpeedMph: 87, powerHp: 1931, lengthFt: 237.5,
  about: "Interurban three-car units built for the Gold Coast line, with luggage racks, accessible toilets and high-backed seats, good for 140 km/h. They no longer run coupled to IMU120s.",
  source: `${WIKI}Interurban_multiple_unit` };
const IMU120_FACTS = { model: "IMU120", type: "Electric multiple unit", builder: "Walkers Limited (Maryborough), Bombardier electrics", built: "2001–2002",
  fleet: "4 three-car units (121–124)", topSpeedMph: 87, powerHp: 1931, lengthFt: 237.5,
  about: "Four interurban units ordered for the Airtrain line to Brisbane Airport, with one toilet per unit and luggage racks. They now run anywhere on the network.",
  source: `${WIKI}Interurban_multiple_unit` };
const SHEETS = { imu160: IMU160_FACTS, smu260: SMU260_FACTS, smu200: SMU200_FACTS, smu220: SMU220_FACTS, imu100: IMU100_FACTS, imu120: IMU120_FACTS };
const part = (facts, name) => ({ ...facts, model: `${facts.model}, ${name}` });
export const FACTS = { ngrCar: NGR_FACTS, ngrMid: NGR_FACTS };
for (const [k, sheet] of Object.entries(SHEETS)) {
  FACTS[`${k}A`] = part(sheet, "driving car");
  FACTS[`${k}B`] = part(sheet, "driving car");
  FACTS[`${k}Mid`] = part(sheet, "middle car");
}
