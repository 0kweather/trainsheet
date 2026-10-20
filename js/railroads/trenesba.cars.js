// Trenes Argentinos' Buenos Aires trains (scripts/railroads/trenesba.py).
// SOFSE's arrivals name each service's unit, which js/railroads/trenesba.js
// passes as the train's one known car: "M15" on the Mitre and "RC12" on the
// Sarmiento (their CSR sets), "F134" on the Roca (a CSR set; two digits,
// "F04", a Toshiba set), "B950" on the San Martín (an SDD7 locomotive),
// "A710" or "A924" (a GM locomotive, on the Roca's diesel branches and the
// San Martín), "1001" on the Belgrano Sur (one CNR DMU; "D1426" two coupled,
// 1014 and 1026), "F702" and "7764" (its GM locomotives), "UTA3" on the
// Tren de la Costa. TYPICAL reads those names, and the line and the ends of
// the run, to give each train what really runs it; the rest is what that
// line or branch runs. Drawn from each class's published dimensions and
// photographs of the paint each wears today; the lettering is drawn as type,
// not copied from the operator's logo.

import { bilevel, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, door, truck, pantograph, underframe, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
// Trenes Argentinos' colors as photographed: its celeste (the light blue of
// the flag, a little deeper on the cars), white, the black window band, a
// dark gray skirt, a light gray roof; the San Martín's royal blue, the SDD7s'
// pale blue and yellow, red and white for the warning stripes.
const TA = { white: "#eef0f2", blue: "#2a78d2", sky: "#5aa9e6", navy: "#1f3a6e", royal: "#1f55b5", roof: "#b4bac1", skirt: "#33373c", yellow: "#f2c200",
  black: "#15181b", red: "#d22630", celeste: "#1f98e0", celesteDark: "#1675b8", roofGray: "#c9ced3", doorNavy: "#1c4ea6" };

// ---------- Drawing helpers ----------

const r2 = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering on a car side, h ft tall, centered at x, reading left to right
// even on a car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, spacing = 0 } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" font-weight="${weight}"` +
  `${spacing ? ` letter-spacing="${spacing}"` : ""} font-family="${SANS}" fill="${fill}">${text}</text>`;
const taName = (c, x, y, h, fill = TA.blue) => letters(c, x, y, h, "Trenes Argentinos", fill, { weight: 600 });
// The name on its black oval beside the cab door, as on the CSR units:
// "Trenes" over "Argentinos", white.
const taOval = (c, x, y, w = 4.6, h = 2.8) => rect(x, y, w, h, TA.black, 0, `rx="${r2(h / 2.2)}"`) +
  letters(c, x + w / 2, y + h * 0.64, 0.62, "Trenes", "#ffffff", { weight: 600 }) + letters(c, x + w / 2, y + h * 0.34, 0.62, "Argentinos", "#ffffff", { weight: 500 });
const endOf = (p) => (p[0] === "q" ? [p[3], p[4]] : p);
const above = (pts, fill, top = 18) => path(poly([...pts, [endOf(pts[pts.length - 1])[0], top], [pts[0][0], top]]), fill);
const below = (pts, fill) => path(poly([...pts, [endOf(pts[pts.length - 1])[0], -1], [pts[0][0], -1]]), fill);
const shift = (pts, dx, dy) => pts.map((p) => (p[0] === "q" ? ["q", p[1] + dx, p[2] + dy, p[3] + dx, p[4] + dy] : [p[0] + dx, p[1] + dy]));
// A curve walked backward, and a stripe w ft deep under a curve.
function rev(pts) {
  const out = [endOf(pts[pts.length - 1])];
  for (let i = pts.length - 1; i > 0; i--) {
    const p = pts[i], to = endOf(pts[i - 1]);
    out.push(p[0] === "q" ? ["q", p[1], p[2], to[0], to[1]] : to);
  }
  return out;
}
const ribbon = (pts, w, fill) => path(poly([...pts, ...rev(shift(pts, 0, -w))]), fill);
// Red and white diagonal stripes filling a polygon: the warning paint on
// Argentine locomotives' end beams and on the ends of coaches.
function chevrons(pts, { pitch = 1.3, w = 0.65, red = TA.red, white = "#f4f5f6", slope = 1 } = {}) {
  const d = poly(pts), id = newId();
  const ps = pts.map(endOf), xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), h = y1 - y0;
  let s = path(d, white) + `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`;
  for (let x = x0 - h - pitch; x < x1 + h; x += pitch) s += path(poly([[x, y0], [x + w, y0], [x + w + h * slope, y1], [x + h * slope, y1]]), red);
  return s + "</g>" + path(d, "none", 0.5);
}
// Argentina's flag, h ft tall: celeste, white, celeste, the sun in gold.
const flag = (x, y, h) => rect(x, y, h * 1.6, h, "#74acdf", 0.3) + rect(x, y + h / 3, h * 1.6, h / 3, "#ffffff") + circle(x + h * 0.8, y + h / 2, h * 0.11, "#f6b40e");

// Roof: an air-conditioning unit (a low housing, its two grilles, a seam
// along the lid); a pantograph on its insulated deck with the lightning
// arrester beside it and the roof cable along insulators; horns; an antenna.
function acUnit(x, w, roof, { h = 0.8, fill = "#c3c8ce" } = {}) {
  const t = roof + h, gw = Math.min(3, w * 0.28);
  return path(poly([[x, roof - 0.05], [x + w, roof - 0.05], [x + w - 0.25, t - 0.25], ["q", x + w - 0.4, t, x + w - 0.8, t], [x + 0.8, t], ["q", x + 0.4, t, x + 0.25, t - 0.25]]), fill, 0.4) +
    slats(x + 0.9, roof + 0.12, gw, h - 0.42, 0.3, "rgba(0,0,0,0.35)") + slats(x + w - 0.9 - gw, roof + 0.12, gw, h - 0.42, 0.3, "rgba(0,0,0,0.35)") +
    line(x + 0.7, t - 0.16, x + w - 0.7, t - 0.16, "rgba(255,255,255,0.5)", 0.4);
}
function panDeck(cx, roof, { facing = 1, cableTo = null, up = true } = {}) {
  let s = rect(cx - 3.3, roof - 0.05, 6.6, 0.35, "#8f969e", 0.4) + pantograph(cx, roof + 0.3, { facing, up });
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
// Under the floor: the equipment in the open (boxes, an air reservoir,
// cable conduit, a resistor grille); under each truck the yaw damper and
// brake unit; each side door's step plate and the door light over it.
const equipment = (x0, x1, top, { depth = 1.5, boxes = 3 } = {}) => underframe(x0, x1, top, { depth, boxes }) + line(x0, top - 0.25, x1, top - 0.25, "#3a3f45", 0.9) +
  slats(x0 + 0.8, top - depth + 0.2, Math.min(4, (x1 - x0) / 6), depth - 0.4, 0.3, "rgba(255,255,255,0.25)");
const bogieGear = (cx, wb, top) => line(cx - wb / 2 - 0.6, top - 0.55, cx - 1.9, top - 0.55, "#5a6068", 1.0) + rect(cx + 1.7, 1.55, 1.1, 0.7, "#5a6068", 0, 'rx="0.15"');
const doorTrim = (doors, sill) => doors.map((d) => rect(d.x - 0.1, sill - 0.42, d.w + 0.2, 0.36, "#3a3f45") + rect(d.x + d.w / 2 - 0.3, d.y1 + 0.22, 0.6, 0.18, "#e8a317")).join("");
const lamp = (x, y, w, h, lens = "#fff6d0") => rect(x, y, w, h, "#e9edf0", 0.35, 'rx="0.15"') + circle(x + h / 2, y + h / 2, h * 0.3, lens);
const frontCoupler = (x, y = 2.85, reach = 2.0) => rect(x + 0.3, y - 0.3, reach, 0.6, "#2a2d31") + rect(x, y - 0.62, 0.55, 1.24, "#2a2d31", 0, 'rx="0.15"') + rect(x + 0.7, y + 0.35, 1.0, 0.32, "#5a6068") +
  path(`M${r2(x + 1.0)} ${r2(y - 0.3)}Q${r2(x + 0.8)} ${r2(y - 1.3)} ${r2(x + 1.8)} ${r2(y - 1.2)}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.8" vector-effect="non-scaling-stroke" stroke-linecap="round"');
const cabSkirt = (x0, x1, sill) => path(poly([[x0, sill + 0.05], [x1, sill + 0.05], [x1 - 0.2, 1.2], [x1 - 0.6, 0.7], [x0 + 0.3, 0.7], [x0 - 0.3, 1.6]]), "#33373c") +
  lines([[x0 - 0.1, 1.55, x1 - 0.4, 1.55], [x0, sill - 0.3, x1, sill - 0.3]], "#5a6068", 0.6);
// Third-rail cars: the shoe beams' cable conduit along the sill.
const shoeCable = (a, b, y) => line(a, y, b, y, "#2a2d31", 0.9);
// A main transformer hung under a 25 kV car: a deep tank with its cooling
// fins and the oil conservator on top.
const transformer = (x, w, top) => rect(x, top - 2.4, w, 2.3, "#41464d", 0.4, 'rx="0.2"') + slats(x + 0.6, top - 2.2, w - 1.2, 1.7, 0.35, "rgba(255,255,255,0.22)") +
  rect(x + w - 3.2, top - 0.75, 2.6, 0.55, "#5a6068", 0, 'rx="0.27"');

// A multiple unit's driving car (its nose on the left; the consist mirrors
// the one at the back) and its intermediate cars, from one spec(c): body
// (roof, sill, trucks), nose, cabLen, cab(c, g), paint(c, g, nose), detail(c,
// g, nose), and per car rows, doors and onRoof(c, g). A driving car's nose
// carries its own coupler, so no gangway is drawn on that end even where
// another unit is coupled to it.
function unit(spec, car, nose) {
  return (c) => {
    const sp = spec(c);
    return bilevel(nose ? { ...c, cabL: true, coupledL: false } : { ...c, cabL: false, cabR: false }, {
      ...sp, ...(nose ? {} : { nose: null, cab: null }), ...car, roofItems: [],
      paint: (c, g) => sp.paint(c, g, nose, car),
      extra: (c, g) => {
        const t = sp.trucks, a = t ? g.L / 2 - t.centers / 2 : 0, b = t ? g.L / 2 + t.centers / 2 : 0;
        let s = doorTrim(car.doors, sp.sill);
        if (t) s += bogieGear(a, t.wb, sp.sill) + bogieGear(b, t.wb, sp.sill) + equipment(a + 6.4, b - 6.4, sp.sill, { depth: 1.5, boxes: 4 }) + (t.shoe ? shoeCable(a - 4, b + 4, sp.sill - 0.15) : "");
        return s + (sp.detail ? sp.detail(c, g, nose, car) : "") + (car.under ? car.under(c, g) : "") + (car.onRoof ? car.onRoof(c, g) : "");
      },
    });
  };
}
const drivingCar = (spec, car) => unit(spec, car, true);
const middleCar = (spec, car) => unit(spec, car, false);
// A driving car turned around: in the middle of a train of two units its
// cab faces the next unit's, nose to nose.
const backward = (draw) => (c) => `<g transform="matrix(-1 0 0 1 ${c.L} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;

// Trenes Argentinos' paint on the Chinese-built units since 2015, as on
// photographs of 2019–2026 (it replaced the units' first "Nuevos
// Ferrocarriles Argentinos" and "Transporte Público" schemes): celeste body;
// the windows in a black band; low on the side a white band crossed by three
// celeste lines, which at a cab sweep up and forward into the white of the
// lower nose; a dark gray skirt under it; a light gray roof. Doors celeste
// (navy on the Belgrano Sur's DMUs). band: [bottom, top] of the black band;
// white: the white band's top; skirt: its bottom; cab: where a driving car's
// side starts behind its cab door (0 on other cars).
function taPaint(c, g, { roof, band, white, skirt, cab = 0, doors = [], doorFill = TA.celeste }) {
  const L = g.L, [b0, b1] = band;
  let s = rect(0, 0, L, roof + 2, TA.celeste) + rect(0, roof - 0.45, L, 3, TA.roofGray) + line(0, roof - 0.45, L, roof - 0.45, "rgba(0,0,0,0.22)", 0.5);
  s += rect(0, 0, L, skirt, TA.skirt) + rect(0, skirt - 0.12, L, 0.12, "#7d848c");
  const ys = [0.2, 0.45, 0.7].map((f) => skirt + (white - skirt) * f);
  if (cab) {
    // The white band swept up ahead of the cab door into the nose, and its
    // three lines curving up with it.
    s += path(poly([[0, skirt], [L, skirt], [L, white], [cab + 6.5, white], ["q", cab + 1.6, white, cab - 0.6, b0 - 0.3], [0, b0 - 0.3]]), TA.white);
    ys.forEach((y, i) => { s += ribbon([[cab - 1.6 - i * 0.7, y + 2.0 - i * 0.35], ["q", cab + 0.9, y, cab + 6.5, y], [L, y]], 0.3, TA.celeste); });
    s += rect(cab + 0.2, b0, L, b1 - b0, TA.black);
  } else {
    s += rect(0, skirt, L, white - skirt, TA.white) + ys.map((y) => rect(0, y - 0.3, L, 0.3, TA.celeste)).join("") + rect(0, b0, L, b1 - b0, TA.black);
  }
  for (const d of doors) s += rect(d.x - 0.12, d.y0, d.w + 0.24, d.y1 - d.y0 + 0.2, doorFill);
  return s;
}

// --- CSR Sifang EMUs (built at Qingdao, 2013-15): the Mitre's six-car sets
// (M01-M30) and the Sarmiento's nine-car sets (RC01-RC25), 405 cars, on 800 V
// third rail. Control cars 22.67 m, the others 21.8 m over couplers, 3.10 m
// wide, 3.79 m tall (Wikipedia, CSR EMU (Argentina)); three double doors a
// side; 120 km/h. Third-rail shoes on every truck. Paint as taPaint: the
// oval with the name between the cab door and the first passenger door
// (where an earlier version of this drawing had a window: photographs show
// the oval), a small yellow mark on the white band behind the cab.
const CSR = () => ({ roof: 12.4, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 51.0, wb: 8.2, d: 34, shoe: true }, diaphragm: [4.0, 11.4], badge: false,
  nose: [[1.4, 3.8], [0.9, 4.9], ["q", 0.8, 6.6, 1.4, 7.5], [3.4, 11.4], ["q", 4.1, 12.4, 5.8, 12.4]], cabLen: 6,
  cab: () => path(poly([[1.2, 7.1], ["q", 2.4, 9.6, 3.5, 11.6], [5.6, 11.6], [5.6, 7.3], ["q", 3.4, 6.9, 1.2, 7.1]]), TA.black) +
    path(poly([[2.6, 9.6], ["q", 3.0, 10.6, 3.6, 11.4], [5.4, 11.4], [5.4, 9.6]]), C.glassLight) + line(1.9, 7.5, 2.9, 9.4, "#0a0b0c", 0.8) +
    rect(3.8, 11.75, 1.7, 0.45, "#1d1f22", 0, 'rx="0.1"') + lamp(0.85, 5.3, 1.3, 0.75) + rect(0.9, 4.6, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.7) + cabSkirt(1.4, 5.0, 3.8) +
    rect(6.2, 4.3, 1.9, 6.9, "none", 0.5, 'rx="0.2"') + win(6.45, 7.7, 1.4, 2.5, 0.3) + line(8.4, 6.0, 8.4, 9.0, "currentColor", 0.6),
  paint: (c, g, nose, car) => taPaint(c, g, { roof: 12.4, band: [6.75, 10.4], white: 6.2, skirt: 4.25, cab: nose ? 8.2 : 0, doors: car.doors }),
  detail: (c, g, nose) => (nose ? taOval(c, 8.7, 7.15) + rect(9.0, 5.25, 1.6, 0.4, TA.yellow) : ""),
});
const csrDoor = (x) => ({ x, w: 4.3, y0: 3.9, y1: 10.6, leaves: 2, glassY: 0.42, glassH: 0.42 });
const csrRows = (xs) => [{ xs, y: 7.05, w: 3.9, h: 3.0, r: 0.35 }];
const csrCar = drivingCar(CSR, { rows: csrRows([...seq(18.6, 4.6, 4), ...seq(42.6, 4.6, 4), 67.6]), doors: [csrDoor(13.0), csrDoor(37.0), csrDoor(61.0)],
  onRoof: (c, g) => acUnit(22, 11, 12.4) + acUnit(48, 9, 12.4) + horns(6.4, 12.4) + antenna(8.6, 12.4) });
const csrMid = middleCar(CSR, { rows: csrRows([2.4, ...seq(14.0, 4.8, 4), ...seq(39.2, 4.8, 4), 65.4]), doors: [csrDoor(8.5), csrDoor(33.6), csrDoor(58.7)],
  onRoof: (c, g) => acUnit(18, 11, 12.4) + acUnit(46, 9, 12.4) });

// --- The Roca's CSR EMUs (300 cars, 2014-16; CSR body, CSR Zhuzhou
// traction motors), under 25 kV: three-car units (a driving motor car at
// each end, a trailer carrying two pantographs between them) and four-car
// units (the same with a second, plain trailer), run as seven-car trains of
// one of each; their cabs meet in the middle of the train. Driving cars
// 25.78 m and trailers 25.42 m over couplers (Spanish Wikipedia, "Unidad
// eléctrica múltiple CSR (Roca)", and the module makeup there and in
// leivag1991vehicles' history of the class, 2025), the same nose and
// height as the Mitre's; three double doors a side on every car
// (photographs); the trailer's pantographs over its trucks, one raised, its
// main transformer under the floor. Trains numbered from F120 (one
// photographed as "161A"). Paint as the Mitre's.
const ROCA = () => ({ ...CSR(), trucks: { centers: 57.4, wb: 8.2, d: 34 } });
const rocaRows = (xs) => [{ xs, y: 7.05, w: 4.1, h: 3.0, r: 0.35 }];
const rocaDrive = drivingCar(ROCA, { rows: rocaRows([...seq(20.6, 5.2, 4), ...seq(47.4, 5.2, 4), 74.2, 79.2]), doors: [csrDoor(14.8), csrDoor(41.6), csrDoor(68.4)],
  under: (c, g) => rect(36, 1.7, 9, 2.0, "#41464d", 0.4, 'rx="0.2"') + slats(36.6, 1.9, 7.8, 1.6, 0.35, "rgba(255,255,255,0.2)"),
  onRoof: (c, g) => acUnit(25, 11, 12.4) + acUnit(56, 10, 12.4) + horns(6.4, 12.4) + antenna(8.6, 12.4) });
const rocaTRows = rocaRows([1.8, 6.0, ...seq(16.2, 5.6, 4), ...seq(45.3, 5.6, 4), 74.5, 78.7]);
const rocaTDoors = [csrDoor(10.45), csrDoor(39.55), csrDoor(68.65)];
const rocaPan = middleCar(ROCA, { rows: rocaTRows, doors: rocaTDoors,
  under: (c, g) => transformer(g.L / 2 - 8.5, 17, 3.8),
  onRoof: (c, g) => panDeck(g.L - 13.0, 12.4, { facing: -1, cableTo: 16 }) + rect(9.7, 12.35, 6.6, 0.35, "#8f969e", 0.4) + pantograph(13.0, 12.7, { up: false }) +
    rect(30, 12.35, 2.4, 1.0, "#7d848c", 0.4, 'rx="0.2"') + acUnit(36, 11, 12.4) });
const rocaTrailer = middleCar(ROCA, { rows: rocaTRows, doors: rocaTDoors, onRoof: (c, g) => acUnit(20, 11, 12.4) + acUnit(52, 11, 12.4) });

// --- Toshiba EMUs, the Roca's first electric trains (Nippon Sharyo with
// Kinki, Tokyu, Kawasaki and Hitachi, Toshiba electrics; 1982-85, the extra
// trailers by Materfer): 25 m cars, three double doors a side (English and
// Spanish Wikipedia, "Toshiba EMU (Roca Line)"), run as seven-car trains of
// a three-car (motor, trailer, motor) and a four-car unit (motor, trailer,
// Materfer trailer, motor), with cabs at the units' outer ends; the
// pantograph and transformer on the trailer next to a cab car
// (photographs). Still about ten trains a day in 2026 alongside the CSR
// sets; the feed's two-digit Roca units (F03, F10) are theirs. Flat front
// with a door in the middle; the paint since 2014 (photographs, 2020):
// celeste above, the windows in dark gray panels, white below with three
// celeste lines, a gray skirt, red and white stripes on the pilot.
const TOSH = () => ({ roof: 12.6, sill: 3.9, cornerR: 1.0, end: 0.6, trucks: { centers: 57.4, wb: 7.5, d: 34 }, diaphragm: [4.2, 11.4], badge: false,
  nose: [[0.9, 3.9], [0.65, 4.3], [0.65, 11.7], ["q", 0.75, 12.6, 1.9, 12.6]], cabLen: 5,
  cab: () => rect(0.62, 7.6, 0.3, 3.4, TA.black) + win(1.5, 7.9, 2.5, 2.6, 0.3) + rect(1.4, 4.4, 2.8, 6.4, "none", 0.5, 'rx="0.15"') +
    path(poly([[0.66, 5.4], [1.3, 5.4], [1.3, 6.6], [0.66, 6.6]]), TA.celeste) + circle(0.98, 6.25, 0.24, "#fff6d0") + circle(0.98, 5.7, 0.2, "#e9edf0") +
    chevrons([[0.3, 1.5], [3.0, 1.5], [3.0, 3.9], [0.7, 3.9], [0.3, 3.2]]) + frontCoupler(0, 2.85, 1.2) +
    ribbon([[1.0, 7.2], ["q", 2.6, 6.35, 5.6, 6.35], [8, 6.35]], 0.3, TA.celeste),
  paint: (c, g, nose, car) => {
    const L = g.L;
    let s = rect(0, 0, L, 14, TA.celeste) + rect(0, 12.15, L, 2, "#97a2ae") + rect(0, 0, L, 4.3, "#4d545c") + rect(0, 4.3, L, 2.75, TA.white);
    for (const y of [4.85, 5.6, 6.35]) s += rect(0, y - 0.3, L, 0.3, TA.celeste);
    for (const [a, b] of car.panels) s += rect(a, 7.5, b - a, 3.4, "#4b525a", 0, 'rx="0.3"');
    for (const d of car.doors) s += rect(d.x - 0.12, d.y0, d.w + 0.24, d.y1 - d.y0 + 0.2, TA.celeste);
    return s;
  },
});
const toshDoor = (x) => ({ x, w: 4.3, y0: 4.0, y1: 10.5, leaves: 2, glassY: 0.45, glassH: 0.4 });
// Two-sash windows (a sliding lower pane under a fixed one) in groups.
const toshRows = (xs) => [{ xs, y: 7.75, w: 2.8, h: 2.9, r: 0.2 }];
const toshSash = (xs) => lines(xs.map((x) => [x + 0.1, 9.35, x + 2.7, 9.35]), "#7d848c", 0.8);
const TOSH_DOORS = [toshDoor(12.0), toshDoor(38.85), toshDoor(65.7)];
const toshMidXs = [...seq(17.0, 3.6, 6), ...seq(43.9, 3.6, 6), ...seq(71.0, 3.6, 3)];
const toshRoof = (L, roof) => rect(6, roof - 0.05, L - 12, 0.55, "#aab3bc", 0.4, 'rx="0.2"') + slats(6.4, roof + 0.05, L - 12.8, 0.4, 0.5, "rgba(0,0,0,0.3)");
const toshPanels = (first) => [first, [16.7, 38.0], [43.6, 64.9], [70.7, 81.3]];
const toshDrive = drivingCar(TOSH, { rows: toshRows([6.0, 8.9, ...toshMidXs]), doors: TOSH_DOORS, panels: toshPanels([5.7, 12.0]),
  under: (c, g) => rect(30, 1.8, 7, 1.9, "#41464d", 0.4, 'rx="0.2"') + slats(30.5, 2.0, 6, 1.5, 0.35, "rgba(255,255,255,0.2)"),
  onRoof: (c, g) => toshSash([6.0, 8.9, ...toshMidXs]) + toshRoof(g.L, 12.6) + horns(3.6, 12.6) });
const toshTXs = [1.4, 4.8, 8.2, ...toshMidXs];
const toshPan = middleCar(TOSH, { rows: toshRows(toshTXs), doors: TOSH_DOORS, panels: toshPanels([1.1, 11.3]),
  under: (c, g) => transformer(g.L / 2 - 8, 16, 3.9),
  onRoof: (c, g) => toshSash(toshTXs) + rect(6, 12.55, 22, 0.55, "#aab3bc", 0.4, 'rx="0.2"') + rect(50, 12.55, 26, 0.55, "#aab3bc", 0.4, 'rx="0.2"') +
    panDeck(g.L - 41, 12.6, { facing: -1, cableTo: 31 }) });
const toshTrailer = middleCar(TOSH, { rows: toshRows(toshTXs), doors: TOSH_DOORS, panels: toshPanels([1.1, 11.3]),
  onRoof: (c, g) => toshSash(toshTXs) + toshRoof(g.L, 12.6) });

// --- CNR (Tangshan) DMUs, the Belgrano Sur's (27 three-car units, 1001-1027,
// 2014-15), metre gauge: a motor car at each end (one with a bicycle space)
// and a trailer between, 65.76 m over the set, 3.0 m wide, 3.997 m tall,
// floor 1.215 m, truck centers 14.85 m (motor) and 15.5 m (trailer), 920 mm
// wheels, six double doors a side per set; 750 kW, 100 km/h
// (leivag1991vehicles, "Coche motor CNR del Belgrano Sur", 2018). Two run
// coupled on the González Catán branch (the feed's "D1426": 1014 and 1026),
// one alone to Marinos del Crucero General Belgrano. Corrected here from
// an earlier drawing 75.5 ft long, 12.8 ft tall, with a raked nose and white
// sides: photographs show an upright front (white, a celeste cap with two
// headlights, the windshield in black) and taPaint's sides with navy doors.
const CNR = (car) => ({ roof: 13.1, sill: 4.0, cornerR: 1.0, end: 0.6, trucks: { centers: car === "t" ? 50.9 : 48.7, wb: 8.2, d: 36 }, diaphragm: [4.2, 12.0], badge: false,
  nose: [[1.2, 4.0], [0.6, 4.7], [0.6, 8.6], ["q", 0.7, 9.6, 1.3, 10.2], [2.0, 12.2], ["q", 2.5, 13.1, 4.0, 13.1]], cabLen: 6.2,
  cab: () => path(poly([[0.62, 8.4], [0.62, 8.9], ["q", 0.75, 9.7, 1.3, 10.3], [2.05, 12.0], [5.4, 12.0], [5.4, 8.4]]), TA.black) +
    path(poly([[1.6, 10.6], [2.15, 11.8], [5.2, 11.8], [5.2, 10.6]]), C.glassLight) + line(1.2, 8.7, 1.8, 10.2, "#0a0b0c", 0.8) +
    above([[0.7, 12.0], [2.1, 12.0], [2.6, 13.0], [5.6, 13.0]], TA.celeste, 13.2) + circle(1.8, 12.45, 0.28, "#fff6d0", 0.3) +
    lamp(0.6, 6.0, 1.1, 0.7) + rect(0.6, 5.3, 0.45, 0.35, "#d8252d") + frontCoupler(0, 2.95, 1.6) + cabSkirt(1.2, 5.0, 4.0) +
    chevrons([[0.6, 1.0], [3.4, 1.0], [3.4, 2.0], [0.6, 2.0]], { red: "#1d1f22", white: "#e8b923", pitch: 0.9, w: 0.45 }) +
    rect(6.1, 4.4, 1.9, 6.9, "none", 0.5, 'rx="0.2"') + win(6.35, 8.0, 1.4, 2.4, 0.3),
  paint: (c, g, nose, car) => {
    let s = taPaint(c, g, { roof: 13.1, band: [7.0, 10.8], white: 6.4, skirt: 4.4, cab: nose ? 8.2 : 0, doors: car.doors, doorFill: TA.doorNavy });
    if (nose) s += path(poly([[-1, 4.0], [5.8, 4.0], [5.8, 12.0], [2.2, 12.0], ["q", 1.2, 10.3, 0.6, 8.5], [-1, 8.5]]), TA.white);
    return s;
  },
  detail: (c, g, nose) => (nose ? taOval(c, 9.0, 7.4, 4.4, 2.8) + rect(28, 13.05, 8, 0.6, "#8f969e", 0.4, 'rx="0.2"') + slats(28.4, 13.1, 7.2, 0.5, 0.3, "rgba(0,0,0,0.4)") +
    rect(37.0, 13.05, 0.45, 1.1, "#3a3f45") + rect(37.8, 13.05, 0.45, 1.1, "#3a3f45") + rect(22, 1.4, 11, 2.4, "currentColor", 0, 'opacity="0.8" rx="0.2"') +
    slats(22.6, 1.6, 4, 2.0, 0.3, "rgba(255,255,255,0.25)") : ""),
});
const cnrDoor = (x) => ({ x, w: 4.3, y0: 4.1, y1: 11.0, leaves: 2, glassY: 0.42, glassH: 0.42 });
const cnrCar = drivingCar(() => CNR("m"), { rows: [{ xs: [...seq(20.8, 5.0, 6), 58.4, 63.2, 68.0], y: 7.4, w: 3.8, h: 3.0, r: 0.35 }], doors: [cnrDoor(15.0), cnrDoor(52.6)],
  onRoof: (c, g) => acUnit(14, 9, 13.1) + acUnit(54, 9, 13.1) + horns(7.0, 13.1) + antenna(9.4, 13.1) });
const cnrMid = middleCar(() => CNR("t"), { rows: [{ xs: [1.4, 6.6, ...seq(19.0, 5.6, 6), 59.4, 64.6], y: 7.4, w: 3.8, h: 3.0, r: 0.35 }], doors: [cnrDoor(12.65), cnrDoor(53.55)],
  onRoof: (c, g) => acUnit(20, 11, 13.1) + acUnit(40, 11, 13.1) });

// --- CSR Qishuyan SDD7 locomotives (the San Martín's whole fleet of 24,
// B950-B973, 2013-14): Co-Co diesel-electric, 19.98 m long, 4.42 m tall,
// with a full-width body, a raked cab at the front and a flat end with small
// windows at the back; 1,678 kW, 120 km/h (leivag1991vehicles, "Los trenes
// chinos del San Martín", 2021). White, the cab end royal blue, its edge
// raking back from the cab door up to the roof; sky blue panels low along
// the side under the louvers; a yellow line along the sill that rises into
// the blue at the cab; red and white chevrons on the pilot.
function sdd7(c) {
  const L = c.L, sill = 4.4, base = 5.0, roof = 14.0;
  const tA = L / 2 - 18.5, tB = L / 2 + 18.5;
  let s = truck(tA, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 }) + truck(tB, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 });
  // Fuel tank with its gauge, main reservoirs, the frame, steps.
  s += path(poly([[L / 2 - 10, sill], [L / 2 + 10, sill], [L / 2 + 10, 2.4], ["q", L / 2 + 10, 1.6, L / 2 + 9.2, 1.6], [L / 2 - 9.2, 1.6], ["q", L / 2 - 10, 1.6, L / 2 - 10, 2.4]]), "#9aa1a9", 0.4);
  s += rect(L / 2 - 1.5, 2.4, 2.4, 0.9, "#5a6068", 0.3) + circle(L / 2 + 3, 3.0, 0.3, "#5a6068") + rect(L / 2 - 13.5, 2.7, 3.0, 1.0, "#7d848c", 0.3, 'rx="0.5"');
  s += rect(0.6, 3.4, L - 1.2, base - 3.4, "#7d848c", 0.4) + line(0.6, 4.35, L - 0.6, 4.35, "rgba(0,0,0,0.3)", 0.5);
  for (const x of [5.6, L - 7.6]) s += lines([[x, 1.6, x, 3.4], [x + 2, 1.6, x + 2, 3.4], [x, 1.7, x + 2, 1.7], [x, 2.5, x + 2, 2.5]], "#3d4249", 0.8);
  // The pilot with its chevrons and the coupler at the front; the back's
  // coupler where nothing is coupled (consist.js draws it where it is).
  const pil = poly([[0.6, base], [4.8, base], [4.6, 1.0], [0.9, 1.0], [0.3, 2.4]]);
  const pid = newId();
  s += path(pil, "#f4f5f6") + `<clipPath id="${pid}"><path d="${pil}"/></clipPath><g clip-path="url(#${pid})">` +
    seq(-3, 1.4, 7).map((x) => path(poly([[x, 1.0], [x + 0.7, 1.0], [x + 3.7, base], [x + 3.0, base]]), TA.red)).join("") + "</g>" + path(pil, "none", 0.6);
  if (!c.coupledL) s += rect(0, 2.55, 1.2, 0.6, "#2a2d31") + rect(0, 2.25, 0.45, 1.2, "#2a2d31", 0, 'rx="0.12"');
  if (!c.coupledR) s += rect(L - 2.4, 2.55, 2.4, 0.6, "#2a2d31") + rect(L - 0.45, 2.25, 0.45, 1.2, "#2a2d31", 0, 'rx="0.12"');
  const body = poly([[0.9, base], [L - 0.9, base], [L - 0.9, roof - 0.7], ["q", L - 0.9, roof, L - 1.6, roof], [5.8, roof], ["q", 4.6, roof, 4.1, 13.2], [1.5, 9.8], ["q", 0.9, 9.0, 0.9, 8.2]]);
  const id = newId();
  let liv = rect(0, 0, L, 18, TA.white) + rect(0, 13.3, L, 2, TA.roof);
  liv += rect(16, 6.2, L - 22, 2.3, TA.sky) + rect(0, base, L, 0.3, "#9aa1a9");
  // The blue cab end, its yellow edge line; the blue back end.
  liv += path(poly([[0, 5.3], [8.4, 5.3], ["q", 11.8, 5.5, 13.7, 8.0], [17.5, 13.4], [17.0, 13.4], ["q", 15.0, 10.4, 13.4, 8.2], ["q", 11.6, 5.8, 8.4, 5.6], [0, 5.6]]), TA.yellow) +
    path(poly([[0, 5.6], [8.4, 5.6], ["q", 11.6, 5.8, 13.4, 8.2], [17.0, 13.4], [0, 13.4]]), TA.royal) + rect(17, 5.3, L - 17, 0.3, TA.yellow) +
    path(poly([[L - 6.0, base], [L, base], [L, 14], [L - 3.0, 14], ["q", L - 5.6, 9.6, L - 6.0, base]]), TA.royal) + rect(0, 13.4, 24, 1.2, TA.royal);
  s += path(body, TA.white) + `<clipPath id="${id}"><path d="${body}"/></clipPath><g clip-path="url(#${id})">${liv}</g>`;
  // Cab: the raked windshield, side windows, the crew door; headlights in
  // the nose, the number board, horns. The back end's small windows.
  s += path(poly([[1.7, 10.0], [4.2, 13.1], [5.6, 13.1], [5.6, 10.0]]), TA.black) + path(poly([[2.9, 11.6], [4.2, 13.0], [5.5, 13.0], [5.5, 11.6]]), C.glassLight) + line(2.6, 10.3, 3.6, 12.2, "#0a0b0c", 0.8);
  s += win(6.4, 10.4, 2.6, 2.4, 0.3) + door(9.8, base + 0.4, 2.3, 8.0, { glassY: 0.68, glassH: 0.22 });
  s += rect(0.95, 6.8, 0.5, 0.9, "#e9edf0", 0.3) + rect(0.95, 7.9, 0.5, 0.4, "#d8252d") + rect(4.6, 13.35, 1.6, 0.45, "#1d1f22", 0, 'rx="0.1"') + horns(6.8, roof);
  s += win(L - 4.6, 11.0, 1.4, 1.6, 0.25) + win(L - 8.0, 11.0, 1.8, 1.6, 0.25) + door(L - 12.6, base + 0.4, 2.2, 8.0, { glassY: 0.68, glassH: 0.22 });
  // Louvers: the radiator and engine air intakes along the upper side, the
  // dynamic brake grille; "LSM" and the line's name on the sky blue.
  for (const [x, w] of [[16.0, 3.4], [20.0, 3.4], [27.6, 6.0], [34.4, 6.0], [41.2, 6.0], [L - 18.0, 5.0]]) s += rect(x, 9.6, w, 3.0, "rgba(0,0,0,0.12)", 0.4) + slats(x, 9.6, w, 3.0, 0.35, "rgba(0,0,0,0.35)");
  s += rect(49, 6.5, 4.6, 1.7, "rgba(0,0,0,0.12)", 0.4) + slats(49, 6.5, 4.6, 1.7, 0.35, "rgba(0,0,0,0.35)");
  s += letters(c, 24.0, 7.6, 1.0, "LSM", TA.navy, { weight: 800 }) + letters(c, 24.0, 6.6, 0.55, "Línea San Martín", TA.navy, { weight: 600 });
  // Roof: the radiator fans, the exhaust, the dynamic brake hatch.
  for (const x of [L - 12, L - 7]) s += path(`M${x - 2} ${roof}Q${x} ${roof + 0.7} ${x + 2} ${roof}Z`, C.steelDark, 0.4);
  s += rect(L / 2 - 4, roof - 0.05, 1.6, 0.8, "#3a3f45") + rect(28, roof - 0.05, 12, 0.35, C.steelDark, 0.4) + antenna(9, roof);
  return s + path(body, "none", 0.8);
}

// --- The San Martín's CSR coaches (160 bought with the SDD7s, 2013-14),
// broad gauge, run seven to a train behind an SDD7 (or one of the two GM
// GT22CWs fitted with Scharfenberg couplers to haul them): intermediate
// coaches (78 seats) with three double doors a side, and at each end of the
// rake a coach with a van for bicycles and the generator at its outer end
// and two double doors a side, off center (leivag1991vehicles, 2021, and
// photographs). All royal blue, roof and air conditioners too, as delivered
// and as photographed at Cabred in 2020; "Trenes Argentinos" in white
// capitals by a door; red and white stripes on the outer end of an end coach.
// Corrected here from an earlier drawing with two doors a side and white
// upper sides, which no San Martín suburban coach wears (the white and blue
// coaches photographed at Retiro are CNR long-distance stock).
const SM_DOOR = (x) => ({ x, w: 4.3, y0: 3.95, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.4 });
const COACH = () => ({ roof: 12.6, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 33 }, diaphragm: [4.0, 11.6], badge: false,
  paint: (c, g, _nose, car) => {
    let s = rect(0, 0, g.L, 18, TA.royal) + rect(0, 0, g.L, 4.25, TA.skirt) + rect(0, 4.25, g.L, 0.1, "#7d848c") + line(0, 12.15, g.L, 12.15, "rgba(0,0,0,0.25)", 0.5);
    if (car.van) s += chevrons([[0.6, 4.3], [1.3, 4.3], [1.3, 12.1], [0.6, 12.1]]);
    return s;
  },
});
const smRows = (xs) => [{ xs, y: 7.1, w: 3.4, h: 3.0, r: 0.35 }];
const smName = (c, x) => letters(c, x, 11.3, 0.5, "TRENES", "#ffffff", { weight: 600 }) + letters(c, x, 10.65, 0.5, "ARGENTINOS", "#ffffff", { weight: 600 });
const smRoof = (L) => acUnit(4, 9, 12.6, { fill: "#2a5fc0" }) + acUnit(L - 13, 9, 12.6, { fill: "#2a5fc0" }) + rect(24, 12.55, 30, 0.25, "#2a5fc0", 0.4);
const csrCoach = unit(COACH, { doors: [SM_DOOR(7.0), SM_DOOR(38.0), SM_DOOR(69.1)], rows: smRows([2.4, ...seq(13.6, 6.2, 4), ...seq(44.6, 6.2, 4), 75.4]),
  onRoof: (c, g) => smRoof(g.L) + smName(c, 15.0) }, false);
// The end coach, its van end on the left (the consist turns the one at the
// back): two small windows and "FURGÓN" with a bicycle sign by the van's
// door, then the passenger saloon.
const csrCoachFu = unit(COACH, { van: true, doors: [SM_DOOR(14.0), SM_DOOR(33.5)], rows: smRows([20.6, 26.8, ...seq(40.0, 6.2, 6)]),
  onRoof: (c, g) => smRoof(g.L) + [3.4, 7.4].map((x) => win(x, 9.2, 2.2, 1.5, 0.25)).join("") + letters(c, 7.0, 7.6, 0.75, "FURGÓN", "#ffffff", { weight: 600 }) +
    circle(5.4, 6.3, 0.45, "none", 0, 'stroke="#ffffff" stroke-width="0.6" vector-effect="non-scaling-stroke"') + circle(7.4, 6.3, 0.45, "none", 0, 'stroke="#ffffff" stroke-width="0.6" vector-effect="non-scaling-stroke"') +
    lines([[5.4, 6.3, 6.3, 7.0], [6.3, 7.0, 7.4, 6.3], [6.3, 7.0, 6.1, 7.3]], "#ffffff", 0.6) + smName(c, 46.0) }, false);

// --- Tren de la Costa (Maipú-Delta, 1995): nine two-car articulated units
// built by CAF, derived from the second series of Valencia's FGV 3700;
// 1,500 V overhead, standard gauge (Spanish Wikipedia, "Tren de la Costa").
// Each half on its own motor truck at the cab, the two sharing a truck at
// the joint; one double door a side on each half; a pantograph on one half,
// the equipment housing over the cab. Trenes Argentinos' blue, white low on
// the front, three white stripes along the lower side, the windshield in
// black. (Not Siemens-Mafersa: CAF built them.)
const CAF = () => ({ roof: 12.2, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: null, noTrucks: true, diaphragm: [3.6, 11.2], badge: false,
  nose: [[0.9, 3.4], [0.7, 4.5], [0.7, 9.6], ["q", 0.8, 11.2, 1.8, 11.9], ["q", 2.4, 12.2, 3.4, 12.2]], cabLen: 4,
  cab: () => path(poly([[0.75, 7.0], [0.75, 10.4], ["q", 0.9, 11.4, 1.8, 11.7], [4.2, 11.7], [4.2, 7.0]]), TA.black) + path(poly([[0.8, 9.6], [0.8, 10.4], ["q", 0.95, 11.3, 1.8, 11.5], [4.0, 11.5], [4.0, 9.6]]), C.glassLight) +
    line(1.3, 7.3, 1.9, 9.4, "#0a0b0c", 0.8) + lamp(0.75, 5.0, 1.2, 0.7) + rect(0.75, 4.3, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.6, 1.3) + cabSkirt(0.9, 4.2, 3.4),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, TA.blue) + rect(0, 11.6, L, 2, "#c9cdd2") + rect(0, 0, L, 3.75, TA.skirt);
    for (const y of [4.3, 5.0, 5.7]) s += rect(0, y, L, 0.28, "#f4f5f6");
    if (nose) s += path(poly([[0, -1], [4.6, -1], [4.6, 5.6], ["q", 4.6, 6.6, 3.6, 6.6], [0, 6.6]]), "#f4f5f6") + path(poly([[4.6, 4.0], ["q", 6.0, 4.4, 6.4, 6.4], [5.8, 6.4], ["q", 5.4, 4.9, 4.6, 4.6]]), "#f4f5f6");
    return s;
  },
});
const CAF_DOORS = [{ x: 16.4, w: 4.3, y0: 3.5, y1: 10.4, leaves: 2, glassY: 0.42, glassH: 0.42 }];
const cafCar = drivingCar(CAF, { rows: [{ xs: [5.0, 9.6, 26.0, 30.6, 35.2, 39.8], y: 6.9, w: 3.8, h: 3.0, r: 0.35 }], doors: CAF_DOORS,
  onRoof: (c, g) => truck(9.0, { wb: 7.2, d: 30, top: 3.4 }) + truck(g.L, { wb: 7.2, d: 30, top: 3.4 }) + bogieGear(9.0, 7.2, 3.4) +
    equipment(14.5, 43, 3.4, { depth: 1.3, boxes: 3 }) + rect(1.2, 12.15, 6.4, 1.0, "#e3e6e9", 0.4, 'rx="0.3"') + slats(1.8, 12.3, 5.2, 0.7, 0.3, "rgba(0,0,0,0.3)") +
    (c.mirrored ? acUnit(28, 9, 12.2) : panDeck(g.L - 13, 12.2, { facing: -1, cableTo: 24 })) + acUnit(14, 7, 12.2) + horns(8.6, 12.2) +
    letters(c, 32.8, 10.85, 0.75, "Trenes Argentinos", "#ffffff", { weight: 600 }) });

// --- GM hood units: the diesel branches' locomotives. EMD G22CW (broad
// gauge; ASTARSA, 1970s; Roca A701-A713, ex 7601-7613 and 79xx, A710 being
// ex 7938; Mitre A714-A715), the Belgrano Sur's G22CU (metre gauge, 7701-7796,
// GM and ASTARSA) and G22CU-2 (F701-F705, ex MF701-MF705, EMD London, 1990s):
// Co-Co, EMD 12-645, 1,500 hp, 15.51 m long, 3.772 m tall (leivag1991vehicles,
// "Locomotoras EMD-GM G22 en Argentina", 2022); three-axle trucks with 40 in
// wheels, 6 ft 6 in between axles (Wikipedia, EMD G22C Series). The GT22CW
// (A924, ex 9064, ASTARSA 1988, rebuilt 2019 with Scharfenberg couplers to
// haul the San Martín's CSR coaches; the Roca's A901-A912 too): turbocharged
// EMD 16-645, 2,250 hp, 17.374 m long, 4.03 m tall (leivag1991vehicles,
// "Locomotoras General Motors GT22 en Argentina", 2021). Truck centers
// (not published) set from photographs. Drawn short hood first: the low
// nose, the cab, the long hood with the engine room doors, the air intake
// louvers behind the cab and the radiator grilles at its far end; the
// fuel tank between the trucks; side buffers and a screw coupler at each
// end on the end beams; railings along the walkway. Trenes Argentinos'
// celeste (photographs of A701 in 2026 and of the Belgrano Sur's units):
// two white stripes along the nose and cab and at the long hood's end, the
// frame dark gray, red and white chevrons on the end beams; the Belgrano
// Sur's with Argentina's flag on the long hood.
function gmHood(c, k) {
  const L = c.L, deck = 4.7, sill = 3.5, [ca, cb] = k.cab;
  let s = "";
  for (const x of [L / 2 - k.centers / 2, L / 2 + k.centers / 2]) s += truck(x, { wb: 13.0, d: 40, kind: "loco", top: sill, axles: 3 });
  // The fuel tank, its gauge and filler; the air reservoirs ahead of it.
  const t0 = L / 2 - k.tank / 2, t1 = L / 2 + k.tank / 2;
  s += path(poly([[t0, sill], [t1, sill], [t1, 2.1], ["q", t1, 1.35, t1 - 0.75, 1.35], [t0 + 0.75, 1.35], ["q", t0, 1.35, t0, 2.1]]), "#41464d", 0.4) +
    line(t0 + 0.6, 2.75, t1 - 0.6, 2.75, "rgba(255,255,255,0.14)", 0.5) + rect(L / 2 + 2.5, 2.2, 1.4, 0.7, "#e9edf0", 0.3, 'rx="0.2"') + circle(L / 2 - 3, 2.6, 0.32, "#5a6068");
  s += rect(t0 - 3.6, 2.5, 3.2, 0.9, "#5a6068", 0.3, 'rx="0.45"') + rect(t1 + 0.4, 2.5, 3.2, 0.9, "#5a6068", 0.3, 'rx="0.45"');
  // Frame, end beams with chevrons, steps at the corners, buffers.
  s += rect(0.9, sill, L - 1.8, deck - sill, "#3a3f45", 0.4) + line(0.9, deck - 0.12, L - 0.9, deck - 0.12, "rgba(255,255,255,0.18)", 0.5);
  s += chevrons([[0.9, 1.6], [3.0, 1.6], [3.0, deck], [0.9, deck]], { slope: 1 }) + chevrons([[L - 3.0, 1.6], [L - 0.9, 1.6], [L - 0.9, deck], [L - 3.0, deck]], { slope: -1 });
  for (const x of [3.4, L - 5.4]) s += lines([[x, 1.4, x, sill], [x + 2, 1.4, x + 2, sill], [x, 1.5, x + 2, 1.5], [x, 2.45, x + 2, 2.45]], "#3d4249", 0.8);
  for (const [x, dir] of [[0.9, -1], [L - 0.9, 1]]) {
    s += rect(dir < 0 ? x - 0.7 : x, 3.75, 0.7, 0.42, "#2a2d31") + rect(dir < 0 ? x - 0.95 : x + 0.7, 3.35, 0.25, 1.22, "#2a2d31", 0, 'rx="0.1"');
  }
  // The hoods and cab, painted as one.
  const shortTop = k.short, nose = poly([[1.5, deck], [ca, deck], [ca, shortTop], [2.4, shortTop], ["q", 1.5, shortTop, 1.5, shortTop - 0.9]]);
  const cabD = poly([[ca, deck], [cb, deck], [cb, k.roof - 0.55], ["q", cb, k.roof, cb - 0.65, k.roof], [ca + 0.65, k.roof], ["q", ca, k.roof, ca, k.roof - 0.55]]);
  const longD = poly([[cb, deck], [L - 1.5, deck], [L - 1.5, k.hood - 0.7], ["q", L - 1.5, k.hood, L - 2.2, k.hood], [cb, k.hood]]);
  const body = nose + cabD + longD, id = newId();
  let liv = rect(0, 0, L, 18, TA.celeste);
  for (const y of [shortTop - 2.3, shortTop - 1.45]) liv += rect(0, y, cb + 7, 0.42, "#ffffff") + rect(L - 9, y, 9, 0.42, "#ffffff");
  s += path(body, TA.celeste) + `<clipPath id="${id}"><path d="${body}"/></clipPath><g clip-path="url(#${id})">${liv}</g>`;
  // Nose: its access doors, the headlight pair and number box on top.
  s += lines([[2.6, deck + 0.4, 2.6, shortTop - 0.5], [ca - 0.4, deck + 0.4, ca - 0.4, shortTop - 0.5]], "rgba(0,0,0,0.3)", 0.5) +
    rect(1.8, shortTop - 0.05, 1.2, 0.55, "#2a2d31", 0, 'rx="0.15"') + circle(2.4, shortTop + 0.25, 0.2, "#fff6d0");
  // Cab: windshield edge over the nose, two sliding side windows, the rear
  // windows' edge; horns on the roof.
  s += rect(ca - 0.05, shortTop + 0.4, 0.3, k.roof - shortTop - 1.3, TA.black) + win(ca + 0.6, shortTop + 0.45, 2.3, 2.1, 0.25) + win(ca + 3.15, shortTop + 0.45, 2.1, 2.1, 0.25) +
    line(ca + 2.95, shortTop + 0.3, ca + 2.95, shortTop + 2.7, "rgba(0,0,0,0.35)", 0.6) + horns(ca + 2.5, k.roof) + antenna(cb - 1.0, k.roof);
  // Long hood: engine room doors, latches; the intake louvers behind the
  // cab; the radiator grilles at the far end; the exhaust and fans on top.
  const doorsAt = seq(cb + 4.6, 3.1, Math.floor((L - 10 - cb - 4.6) / 3.1));
  s += lines(doorsAt.map((x) => [x, deck + 0.35, x, k.hood - 0.35]), "rgba(0,0,0,0.28)", 0.5) + doorsAt.map((x) => rect(x + 1.4, deck + 2.8, 0.25, 0.5, "#2a2d31")).join("");
  s += rect(cb + 0.8, k.hood - 3.3, 3.0, 2.6, "rgba(0,0,0,0.12)", 0.4) + slats(cb + 0.8, k.hood - 3.3, 3.0, 2.6, 0.32, "rgba(0,0,0,0.4)");
  s += rect(L - 8.6, deck + 2.4, 6.4, k.hood - deck - 2.9, "rgba(0,0,0,0.16)", 0.4) + slats(L - 8.6, deck + 2.4, 6.4, k.hood - deck - 2.9, 0.3, "rgba(0,0,0,0.45)");
  s += rect(L - 1.9, k.hood - 0.9, 0.4, 0.6, "#2a2d31") + circle(L - 1.7, k.hood - 0.15, 0.18, "#fff6d0");
  const ex = cb + (L - cb) * 0.42;
  s += rect(ex - 0.8, k.hood - 0.05, 1.6, k.turbo ? 0.75 : 0.5, "#2a2d31") + (k.turbo ? rect(ex + 1.6, k.hood - 0.05, 2.6, 0.4, "#5a6068", 0.3) : "");
  for (const x of k.turbo ? [L - 9.0, L - 4.6] : [L - 5.2]) s += path(`M${r2(x - 1.9)} ${r2(k.hood)}Q${r2(x)} ${r2(k.hood + 0.6)} ${r2(x + 1.9)} ${r2(k.hood)}Z`, "#8f969e", 0.4);
  s += letters(c, cb + (L - 9 - cb) * 0.55, (deck + k.hood) / 2 - 0.3, 0.8, "Trenes Argentinos", "#ffffff", { weight: 600 });
  if (k.flag) s += flag(cb + (L - 9 - cb) * 0.55 - 1.0, (deck + k.hood) / 2 + 0.7, 1.25);
  // Walkway railings: posts and two rails, in front of the hoods.
  const posts = seq(1.3, (L - 2.6) / Math.round((L - 2.6) / 4.2), Math.round((L - 2.6) / 4.2) + 1);
  s += lines([...posts.map((x) => [x, deck, x, deck + 3.1]), [1.3, deck + 3.1, L - 1.3, deck + 3.1], [1.3, deck + 1.6, L - 1.3, deck + 1.6]], "#23272b", 0.7);
  return s + path(body, "none", 0.8);
}
const G22 = { roof: 12.37, hood: 11.4, short: 9.2, cab: [6.4, 12.6], centers: 28.6, tank: 13 };
const g22cw = (c) => gmHood(c, G22);
const g22cu = (c) => gmHood(c, { ...G22, flag: true });
const gt22cw = (c) => gmHood(c, { roof: 13.2, hood: 12.2, short: 9.6, cab: [6.6, 13.0], centers: 33.6, tank: 16, turbo: true });

// --- The diesel branches' coaches: Materfer suburban coaches (Córdoba, from
// the 1960s, rebuilt), broad gauge, three to a train behind a G22CW on the
// Roca's Temperley-Haedo, Ezeiza-Cañuelas, Bosques-Gutiérrez and Alejandro
// Korn-Chascomús runs, one of them with a guard's van (enelSubte, "El
// ramal Temperley-Haedo", and Spanish Wikipedia, "Línea Roca"), and on the
// Mitre's and Sarmiento's diesel runs. No published length: about 24 m over
// couplers, from photographs against the locomotive. Single sliding doors,
// one by an end and two along the side; small two-sash windows in gray
// frames. The paint (photograph of A701 and its train, 2026): celeste; the
// windows in a black band; a white band low on the side with three celeste
// lines; a dark gray skirt; red and white stripes on the ends; "TRENES
// ARGENTINOS" in white capitals over the band.
const TF = { roof: 12.8, sill: 3.9, cornerR: 1.2, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 36 }, diaphragm: [4.2, 11.6], badge: false };
const tfDoor = (x) => ({ x, w: 2.8, y0: 4.0, y1: 10.9, leaves: 1, glassY: 0.55, glassH: 0.3, fill: "rgba(0,0,0,0.12)" });
const tfWin = (x) => rect(x, 7.15, 3.6, 2.85, "#aab1b8", 0.3, 'rx="0.2"') + win(x + 0.3, 8.65, 3.0, 1.1, 0.15) + win(x + 0.3, 7.4, 3.0, 1.1, 0.15);
function tfCoachOf({ doors, wins, van = null }) {
  return (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...TF, doors, rows: [],
    paint: (c, g) => {
      const L = g.L;
      let s = rect(0, 0, L, 14, TA.celeste) + rect(0, TF.roof - 0.6, L, 2, TA.roofGray) + rect(0, 0, L, 4.5, TA.skirt) + rect(0, 4.5, L, 2.1, TA.white) +
        [4.85, 5.4, 5.95].map((y) => rect(0, y, L, 0.26, TA.celeste)).join("") + rect(0, 6.95, L, 3.35, TA.black);
      for (const d of doors) s += rect(d.x - 0.15, d.y0, d.w + 0.3, d.y1 - d.y0 + 0.15, TA.celesteDark);
      if (van) s += rect(van[0], 6.95, van[1] - van[0], 3.35, TA.celeste);
      return s + chevrons([[0.6, 4.5], [1.4, 4.5], [1.4, 12.0], [0.6, 12.0]]) + chevrons([[L - 1.4, 4.5], [L - 0.6, 4.5], [L - 0.6, 12.0], [L - 1.4, 12.0]], { slope: -1 });
    },
    extra: (c, g) => {
      const a = g.L / 2 - TF.trucks.centers / 2, b = g.L / 2 + TF.trucks.centers / 2;
      let s = wins.map(tfWin).join("") + bogieGear(a, 8.2, TF.sill) + bogieGear(b, 8.2, TF.sill) + underframe(a + 6, b - 6, TF.sill, { depth: 1.3, boxes: 3 }) +
        doors.map((d) => rect(d.x - 0.1, TF.sill - 1.2, d.w + 0.2, 0.25, "#3a3f45") + rect(d.x + 0.2, TF.sill - 0.75, d.w - 0.4, 0.2, "#3a3f45")).join("");
      s += letters(c, g.L * 0.5, 11.05, 0.55, "TRENES ARGENTINOS", "#ffffff", { weight: 600 }) +
        seq(4, 9.5, Math.floor((g.L - 6) / 9.5)).map((x) => path(`M${r2(x)} ${TF.roof - 0.02}Q${r2(x + 0.8)} ${TF.roof + 0.45} ${r2(x + 1.6)} ${TF.roof - 0.02}Z`, "#9aa1a9", 0.3)).join("");
      if (van) s += door(van[0] + 1.0, 4.1, 5.6, 6.6, { leaves: 2, glassY: 0.62, glassH: 0.22, grabs: false }) + win(van[1] - 3.0, 8.4, 1.9, 1.3, 0.2) +
        letters(c, (van[0] + van[1]) / 2, 11.05, 0.55, "FURGÓN", "#ffffff", { weight: 600 });
      return s;
    } });
}
const tfCoach = tfCoachOf({ doors: [tfDoor(1.9), tfDoor(24.0), tfDoor(51.6)], wins: [...seq(5.2, 4.6, 4), ...seq(28.2, 4.6, 5), ...seq(55.8, 4.6, 4)] });
// With the van at one end: its double door, a small barred window.
const tfVan = tfCoachOf({ doors: [tfDoor(20.2), tfDoor(47.8)], wins: [...seq(24.4, 4.6, 5), ...seq(52.0, 4.6, 5)], van: [1.4, 19.0] });

// --- The Tren Universitario de La Plata's railcars (the Roca's La Plata-
// Hospital San Juan de Dios shuttle): NOHAB (Trollhättan) diesel railcars of
// 1948, the 0100 series (photographed as 105), refurbished and back in
// service in February 2026 (El Día, 2 February 2026). A single car with a
// cab at each end, a rounded bus-like front with the radiator grille
// between buffers; about 20.5 m long (estimated from photographs; no
// published figure found). Celeste window band, white below with celeste
// lines, a pale gray roof with the name on a white band at each end, yellow
// and black stripes on the pilots.
const NOHAB = { roof: 12.0, sill: 3.6, cornerR: 2.4, end: 0.5, trucks: { centers: 44, wb: 8.0, d: 36 }, diaphragm: [4.0, 11.0], badge: false };
const nohabDoors = [{ x: 7.6, w: 2.6, y0: 3.7, y1: 10.6, leaves: 1, glassY: 0.6, glassH: 0.28 }, { x: 56.8, w: 2.6, y0: 3.7, y1: 10.6, leaves: 1, glassY: 0.6, glassH: 0.28 }];
const nohabCar = (c) => bilevel({ ...c, cabL: true, cabR: true }, { ...NOHAB, doors: nohabDoors, cabLen: 4,
  rows: [{ xs: [11.4, ...seq(15.4, 4.0, 10)], y: 7.6, w: 3.2, h: 2.7, r: 0.4 }, { xs: [2.0, 63.6], y: 7.6, w: 2.4, h: 2.7, r: 0.5 }],
  paint: (c, g) => {
    const L = g.L;
    let s = rect(0, 0, L, 14, TA.white) + rect(0, 7.1, L, 3.9, TA.celeste) + rect(0, 10.95, L, 2, "#bcc3ca") + rect(0, 0, L, 4.1, "#5a6068") +
      [4.9, 5.6, 6.3].map((y) => rect(0, y, L, 0.26, TA.celeste)).join("");
    for (const x of [0, L - 9]) s += rect(x, 10.95, 9, 0.75, TA.white);
    return s;
  },
  cab: (c, g) => chevrons([[0.4, 1.3], [3.0, 1.3], [3.0, 3.6], [0.4, 3.6]], { red: "#1d1f22", white: "#e8b923", pitch: 1.0, w: 0.5 }) + rect(0, 3.75, 0.5, 0.4, "#2a2d31") + rect(-0.2, 3.45, 0.25, 1.0, "#2a2d31", 0, 'rx="0.1"') +
    rect(0.3, 4.3, 0.35, 2.4, "#c3c8ce", 0.3) + lamp(0.25, 5.1, 0.7, 0.6) + circle(1.8, 12.05, 0.35, "#e9edf0", 0.3) + rect(1.4, 11.6, 0.8, 0.25, "#2a2d31") +
    letters(c, 5.0, 11.33, 0.42, "Trenes Argentinos", TA.celeste, { weight: 600 }),
  extra: (c, g) => {
    const a = g.L / 2 - NOHAB.trucks.centers / 2, b = g.L / 2 + NOHAB.trucks.centers / 2;
    return bogieGear(a, 8.0, NOHAB.sill) + bogieGear(b, 8.0, NOHAB.sill) + underframe(a + 6, b - 6, NOHAB.sill, { depth: 1.4, boxes: 3 }) +
      rect(g.L / 2 - 4, 1.3, 8, 2.2, "currentColor", 0, 'opacity="0.82" rx="0.2"') + slats(g.L / 2 - 3.4, 1.5, 3, 1.8, 0.3, "rgba(255,255,255,0.25)") +
      rect(g.L / 2 + 6, 11.95, 0.5, 0.9, "#2a2d31") + rect(20, 11.95, 26, 0.3, "#9aa1a9", 0.3);
  } });

export const TYPES = {
  csrCar: { name: "CSR control car", kind: "emu" },
  csrMid: { name: "CSR car", kind: "emu" },
  taRocaCar: { name: "CSR driving motor car", kind: "emu" },
  taRocaCarB: { name: "CSR driving motor car", kind: "emu" },
  taRocaPan: { name: "CSR trailer with pantographs", kind: "emu" },
  taRocaT: { name: "CSR trailer", kind: "emu" },
  taToshCar: { name: "Toshiba driving motor car", kind: "emu" },
  taToshCarB: { name: "Toshiba driving motor car", kind: "emu" },
  taToshPan: { name: "Toshiba trailer with pantograph", kind: "emu" },
  taToshT: { name: "Toshiba trailer (Materfer)", kind: "emu" },
  cnrCar: { name: "CNR DMU driving car", kind: "emu" },
  cnrMid: { name: "CNR DMU trailer", kind: "emu" },
  sdd7: { name: "CSR SDD7 locomotive", kind: "diesel" },
  csrCoach: { name: "CSR coach", kind: "coach" },
  taCsrCoachFu: { name: "CSR coach with van", kind: "coach" },
  cafCar: { name: "CAF articulated car", kind: "emu" },
  taG22cw: { name: "EMD G22CW locomotive", kind: "diesel" },
  taG22cu: { name: "EMD G22CU locomotive", kind: "diesel" },
  taG22cu2: { name: "EMD G22CU-2 locomotive", kind: "diesel" },
  taGt22cw: { name: "EMD GT22CW locomotive", kind: "diesel" },
  taCoach: { name: "Materfer coach", kind: "coach" },
  taCoachVan: { name: "Materfer coach with van", kind: "coach" },
  taBsCoach: { name: "Metre-gauge coach", kind: "coach" },
  taNohab: { name: "NOHAB railcar", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  csrCar: M(csrCar, 74.4, true), csrMid: M(csrMid, 71.5),
  taRocaCar: M(rocaDrive, 84.58, true), taRocaCarB: M(backward(rocaDrive), 84.58), taRocaPan: M(rocaPan, 83.4), taRocaT: M(rocaTrailer, 83.4),
  taToshCar: M(toshDrive, 82.0, true), taToshCarB: M(backward(toshDrive), 82.0), taToshPan: M(toshPan, 82.0), taToshT: M(toshTrailer, 82.0),
  cnrCar: M(cnrCar, 72.6, true), cnrMid: M(cnrMid, 70.5),
  sdd7: M(sdd7, 65.6), csrCoach: M(csrCoach, 80.4), taCsrCoachFu: M(csrCoachFu, 80.4, true),
  cafCar: M(cafCar, 49.0, true),
  taG22cw: M(g22cw, 50.9), taG22cu: M(g22cu, 50.9), taG22cu2: M(g22cu, 50.9), taGt22cw: M(gt22cw, 57.0),
  taCoach: M(tfCoach, 78.0), taCoachVan: M(tfVan, 78.0, true), taBsCoach: M(tfCoach, 78.0),
  taNohab: M(nohabCar, 67.3),
};
// Numbers the feed gives as plain integers: the Belgrano Sur's DMUs and its
// G22CUs (the G22CU-2s come as "F70x", the others' as letters and numbers,
// read by TYPICAL).
export const FLEETS = { trenesba: [[1001, 1027, "cnrCar"], [7701, 7796, "taG22cu"]] };

const set = (label, ...units) => ({ label, units });
const ROCA7 = [["taRocaCar", 1], ["taRocaPan", 1], ["taRocaCarB", 1], ["taRocaCar", 1], ["taRocaPan", 1], ["taRocaT", 1], ["taRocaCar", 1]];
const TOSH7 = [["taToshCar", 1], ["taToshPan", 1], ["taToshCarB", 1], ["taToshCar", 1], ["taToshPan", 1], ["taToshT", 1], ["taToshCar", 1]];
const DMU = [["cnrCar", 1], ["cnrMid", 1], ["cnrCar", 1]];
// A GM locomotive with Materfer coaches: n coaches, the last with the van.
const hauled = (loco, n, van = true) => [[loco, 1], ["taCoach", van ? n - 1 : n], ...(van ? [["taCoachVan", 1]] : [])];
// The Roca's diesel branches by their ends; the Tren Universitario.
const ROCA_DIESEL = /Haedo|Cañuelas|Lobos|Monte|Gutiérrez|Chascomús/i;
const UNIVERSITARIO = /Policl|San Juan de Dios|Diagonal|Universitari|Arana/i;
const MITRE_DIESEL = /Zárate|Capilla|Escobar.*Zárate|Villa Ballester.*Zárate|Matheu|Pilar.*Capilla/i;
const SARMIENTO_DIESEL = /Mercedes|Suipacha|Bragado|Lobos/i;
const ends = (t) => `${t.origin || ""} ${t.destination || ""}`;
export const TYPICAL = {
  // The unit the feed names decides where it can; else the line and where
  // the train runs.
  trenesba: (t, reported) => {
    const r = t.route || "", unitName = String(t.cars?.numbers?.[0] || ""), e = ends(t);
    const g22 = /^A7\d\d$/.test(unitName), gt22 = /^A9\d\d$/.test(unitName);
    if (r === "Roca") {
      if (UNIVERSITARIO.test(e)) return set("NOHAB railcar of 1948, one car (Tren Universitario)", ["taNohab", 1]);
      if (g22 || gt22 || ROCA_DIESEL.test(e)) {
        const loco = gt22 ? "taGt22cw" : "taG22cw", name = gt22 ? "EMD GT22CW" : "EMD G22CW";
        if (/Gutiérrez/i.test(e)) return set(`${name} locomotive with two Materfer coaches and one with a van`, ...hauled(loco, 3));
        if (/Haedo/i.test(e)) return set(`${name} locomotive with three Materfer coaches, one with a van`, ...hauled(loco, 3));
        return set(`${name} locomotive with Materfer coaches, usually three`, ...hauled(loco, 3, !/Cañuelas|Lobos|Monte|Chascomús/i.test(e)));
      }
      if (/^F\d\d$/.test(unitName)) return set("Toshiba electric train, 7 cars (a 3-car and a 4-car unit)", ...TOSH7);
      return set(`CSR electric train, usually 7 cars (a 3-car and a 4-car unit)${reported ? "" : "; some trains are Toshiba sets"}`, ...ROCA7);
    }
    if (r === "Mitre") {
      if (g22 || gt22 || MITRE_DIESEL.test(e)) return set(`${gt22 ? "EMD GT22CW" : "EMD G22CW"} locomotive with Materfer coaches, usually three`, ...hauled(gt22 ? "taGt22cw" : "taG22cw", 3, false));
      return set("6-car CSR electric train", ["csrCar", 1], ["csrMid", 4], ["csrCar", 1]);
    }
    if (r === "Sarmiento") {
      if (g22 || gt22 || SARMIENTO_DIESEL.test(e)) return set(`GM locomotive (${gt22 ? "GT22CW" : "G22CW"} drawn; older GM units also run) with Materfer coaches, usually three`, ...hauled(gt22 ? "taGt22cw" : "taG22cw", 3, false));
      return set("9-car CSR electric train", ["csrCar", 1], ["csrMid", 7], ["csrCar", 1]);
    }
    if (r === "San Martín") {
      const loco = gt22 ? "taGt22cw" : "sdd7";
      return set(`${gt22 ? "EMD GT22CW" : "CSR SDD7"} locomotive with seven CSR coaches`, [loco, 1], ["taCsrCoachFu", 1], ["csrCoach", 5], ["taCsrCoachFu", 1]);
    }
    if (r === "Belgrano Sur") {
      if (/^F?70\d$/.test(unitName)) return set("EMD G22CU-2 locomotive with metre-gauge coaches, usually six", ["taG22cu2", 1], ["taBsCoach", 6]);
      if (reported === "taG22cu" || /^F?77\d\d$/.test(unitName)) return set("EMD G22CU locomotive with metre-gauge coaches, usually six", ["taG22cu", 1], ["taBsCoach", 6]);
      if (/^D\d{4}$/.test(unitName)) return set("Two CNR three-car DMUs coupled, 6 cars", ...DMU, ...DMU);
      if (reported === "cnrCar") return set("CNR three-car DMU", ...DMU);
      if (/Belgrano|Marinos/i.test(e)) return set("CNR three-car DMU", ...DMU);
      return set("Two CNR three-car DMUs coupled, 6 cars (some trains locomotive-hauled)", ...DMU, ...DMU);
    }
    if (r === "Tren de la Costa") return set("CAF two-car articulated unit", ["cafCar", 2]);
    return null;
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const ES = "https://es.wikipedia.org/wiki/";
const LEIVA = "http://leivag1991vehicles.blogspot.com/";
const CSR_FACTS = { model: "CSR EMU", type: "Electric multiple unit", builder: "CSR Sifang (Qingdao, China)", built: "2013–2015",
  fleet: "405 cars: 30 six-car Mitre sets, 25 nine-car Sarmiento sets", topSpeedMph: 74.6, seats: 72, lengthFt: 71.5,
  about: "The Chinese-built trains that replaced the old Japanese and British fleets on the Mitre and the Sarmiento from 2014: six cars on the Mitre, nine on the Sarmiento, taking 800 V from a third rail.",
  source: `${WIKI}CSR_EMU_(Argentina)` };
const ROCA_FACTS = { model: "CSR EMU (Roca)", type: "Electric multiple unit", builder: "CSR (China), traction by CSR Zhuzhou", built: "2014–2016",
  fleet: "300 cars in three- and four-car units", topSpeedMph: 74.6, lengthFt: 84.6,
  about: "The Roca's 25 kV trains, run as seven-car trains of a three-car and a four-car unit coupled cab to cab. Each unit's middle trailer carries two pantographs and the transformer; the driving cars are the motor cars.",
  source: `${ES}Unidad_el%C3%A9ctrica_m%C3%BAltiple_CSR_(Roca)` };
const TOSH_FACTS = { model: "Toshiba EMU (Roca)", type: "Electric multiple unit", builder: "Nippon Sharyo and partners, Toshiba electrics; extra trailers by Materfer", built: "1982–1985",
  topSpeedMph: 74.6, lengthFt: 82,
  about: "The trains that opened the Roca's electric service in 1985, seven cars in a three- and a four-car unit. The CSR sets have replaced most of them, but about ten still run every day.",
  source: `${WIKI}Toshiba_EMU_(Roca_Line)` };
const CNR_FACTS = { model: "CNR DMU", type: "Diesel multiple unit", builder: "CNR Tangshan", built: "2014–2015", fleet: "27 three-car units (1001–1027)",
  topSpeedMph: 62, powerHp: 1006, seats: 114, lengthFt: 72.6,
  about: "Three-car diesel trains, two driving motor cars with a trailer between, on the Belgrano Sur, Buenos Aires' metre-gauge line to González Catán and Marinos del Crucero General Belgrano. Two usually run coupled; GM locomotives with older coaches run some trains.",
  source: `${LEIVA}2018/10/coche-motor-cnr-del-belgrano-sur.html` };
const SDD7_FACTS = { model: "CSR SDD7", type: "Diesel-electric locomotive", builder: "CSR Qishuyan", built: "2013–2014", fleet: "24 (B950–B973)", topSpeedMph: 74.6, powerHp: 2250, lengthFt: 65.6,
  about: "Chinese Co-Co locomotives that arrived with 160 new coaches to renew the whole San Martín line, from Retiro to Pilar and Cabred, in 2014.",
  source: `${WIKI}CSR_SDD7` };
const COACH_FACTS = { model: "CSR coach", type: "Passenger coach", builder: "CSR", built: "2013–2014", fleet: "160", seats: 78,
  about: "The San Martín's locomotive-hauled coaches, bought from China with the SDD7s; three double doors a side. Their high floors meant the platforms from Retiro to Pilar were rebuilt.",
  source: `${LEIVA}2021/11/1031-los-trenes-chinos-del-san-martin.html` };
const FU_FACTS = { ...COACH_FACTS, model: "CSR coach with van", seats: 40,
  about: "The coach at each end of a San Martín train: a van for bicycles and the generator at its outer end, two double doors a side and about forty seats. A Scharfenberg coupler at the van end couples it to the locomotive." };
const CAF_FACTS = { model: "CAF Tren de la Costa unit", type: "Electric multiple unit", builder: "CAF", built: "1990s", fleet: "9 two-car units",
  about: "Two-car articulated trains derived from Valencia's FGV 3700 series, built for the Tren de la Costa when it opened in 1995 along the old Bartolomé Mitre branch by the River Plate.",
  source: `${WIKI}Tren_de_la_Costa` };
const G22_FACTS = { model: "EMD G22CW", type: "Diesel-electric locomotive", builder: "ASTARSA (GM licence)", built: "1970s", fleet: "A701–A715 in suburban service",
  powerHp: 1500, lengthFt: 50.9,
  about: "General Motors hood units built in Argentina, the workhorses of Buenos Aires' diesel branches: the Roca's Temperley–Haedo, Cañuelas, Gutiérrez and Chascomús runs and the Mitre's, each with a few Materfer coaches.",
  source: `${WIKI}EMD_G22C_Series` };
const G22CU_FACTS = { ...G22_FACTS, model: "EMD G22CU", builder: "General Motors and ASTARSA", fleet: "96 built (7701–7796)",
  about: "The metre-gauge G22, built for the Belgrano railway; a few haul Belgrano Sur trains of older coaches beside the CNR railcars." };
const G22CU2_FACTS = { ...G22CU_FACTS, model: "EMD G22CU-2", builder: "EMD (London, Ontario)", fleet: "5 (F701–F705, ex MF701–MF705)",
  about: "Canadian-built G22CU-2s bought for the Belgrano Sur in the 1990s, still hauling some of its trains." };
const GT22_FACTS = { model: "EMD GT22CW", type: "Diesel-electric locomotive", builder: "ASTARSA (GM licence)", built: "1972–1988", powerHp: 2250, lengthFt: 57,
  about: "The turbocharged, longer sister of the G22. A924, built in 1988, was rebuilt in 2019 with Scharfenberg couplers to haul the San Martín's Chinese coaches when an SDD7 is short.",
  source: `${LEIVA}2021/08/984-locomotoras-general-motors-gt22-en.html` };
const TF_FACTS = { model: "Materfer coach", type: "Passenger coach", builder: "Materfer (Córdoba)",
  about: "Rebuilt suburban coaches that run behind GM locomotives on the diesel branches around Buenos Aires, usually three to a train, one of them with a guard's van.",
  source: "https://enelsubte.com/noticias/el-ramal-temperley-haedo-la-linea-h-del-conurbano/" };
const BS_FACTS = { model: "Belgrano Sur coach", type: "Passenger coach", builder: "Materfer (Fiat-Concord), Werkspoor and Aerfer",
  about: "The Belgrano Sur's older metre-gauge coaches, their doors fitted with plates to reach the raised platforms. Drawn alike here: the types differ in detail, and the feed doesn't say which run.",
  source: `${LEIVA}2018/10/coche-motor-cnr-del-belgrano-sur.html` };
const NOHAB_FACTS = { model: "NOHAB railcar", type: "Diesel railcar", builder: "NOHAB (Trollhättan, Sweden)", built: "1948",
  about: "The Swedish-built railcar that runs La Plata's Tren Universitario, from the Roca's La Plata station past the university to the San Juan de Dios hospital. Overhauled in January 2026.",
  source: `${WIKI}University_train_of_La_Plata` };
export const FACTS = {
  csrCar: CSR_FACTS, csrMid: CSR_FACTS, taRocaCar: ROCA_FACTS, taRocaCarB: ROCA_FACTS, taRocaPan: { ...ROCA_FACTS, lengthFt: 83.4 }, taRocaT: { ...ROCA_FACTS, lengthFt: 83.4 },
  taToshCar: TOSH_FACTS, taToshCarB: TOSH_FACTS, taToshPan: TOSH_FACTS, taToshT: TOSH_FACTS,
  cnrCar: CNR_FACTS, cnrMid: { ...CNR_FACTS, lengthFt: 70.5 },
  sdd7: SDD7_FACTS, csrCoach: COACH_FACTS, taCsrCoachFu: FU_FACTS, cafCar: CAF_FACTS,
  taG22cw: G22_FACTS, taG22cu: G22CU_FACTS, taG22cu2: G22CU2_FACTS, taGt22cw: GT22_FACTS,
  taCoach: TF_FACTS, taCoachVan: TF_FACTS, taBsCoach: BS_FACTS, taNohab: NOHAB_FACTS,
};
