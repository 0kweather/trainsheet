// Trenes Argentinos' Buenos Aires trains (scripts/railroads/trenesba.py).
// SOFSE's arrivals name each service's unit ("M15" on the Mitre, "RC12" on
// the Sarmiento, "F134" on the Roca, "B950" on the San Martín, "1001" on the
// Belgrano Sur, "UTA3" on the Tren de la Costa), which
// js/railroads/trenesba.js passes as the train's one known car with its
// class; the rest is what that line runs. Drawn from each class's published
// dimensions and photographs of the current paint; the lettering is drawn
// as type, not copied from the operator's logo.

import { bilevel, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, door, truck, pantograph, underframe, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const TA = { white: "#eef0f2", blue: "#2a78d2", sky: "#5aa9e6", navy: "#1f3a6e", royal: "#1f55b5", roof: "#b4bac1", skirt: "#33373c", yellow: "#f2c200", black: "#15181b", red: "#d22630" };

// ---------- Drawing helpers ----------

const r2 = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering on a car side, h ft tall, centered at x, reading left to right
// even on a car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, spacing = 0 } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" font-weight="${weight}"` +
  `${spacing ? ` letter-spacing="${spacing}"` : ""} font-family="${SANS}" fill="${fill}">${text}</text>`;
const taName = (c, x, y, h, fill = TA.blue) => letters(c, x, y, h, "Trenes Argentinos", fill, { weight: 600 });
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

// A multiple unit's driving car (its nose on the left; the consist mirrors
// the one at the back) and its intermediate cars, from one spec(c): body
// (roof, sill, trucks), nose, cabLen, cab(c, g), paint(c, g, nose), detail(c,
// g, nose), and per car rows, doors and onRoof(c, g).
const ROCA = (c) => c.route === "Roca";
function unit(spec, car, nose) {
  return (c) => {
    const sp = spec(c);
    return bilevel(nose ? { ...c, cabL: true } : { ...c, cabL: false, cabR: false }, {
      ...sp, ...(nose ? {} : { nose: null, cab: null }), ...car, roofItems: [],
      paint: (c, g) => sp.paint(c, g, nose, car),
      extra: (c, g) => {
        const t = sp.trucks, a = t ? g.L / 2 - t.centers / 2 : 0, b = t ? g.L / 2 + t.centers / 2 : 0;
        let s = doorTrim(car.doors, sp.sill);
        if (t) s += bogieGear(a, t.wb, sp.sill) + bogieGear(b, t.wb, sp.sill) + equipment(a + 6.4, b - 6.4, sp.sill, { depth: 1.5, boxes: 4 }) + (t.shoe ? shoeCable(a - 4, b + 4, sp.sill - 0.15) : "");
        return s + (sp.detail ? sp.detail(c, g, nose, car) : "") + (car.onRoof ? car.onRoof(c, g) : "");
      },
    });
  };
}
const drivingCar = (spec, car) => unit(spec, car, true);
const middleCar = (spec, car) => unit(spec, car, false);

// The Chinese-built units' paint: white, a blue band along the top of the
// side, blue doors; navy and sky blue stripes low on the side that sweep up
// at the cab into the blue around the windshield.
function csrPaint(c, g, nose, car, { band = null } = {}) {
  const L = g.L;
  let s = rect(0, 0, L, 18, TA.white) + rect(0, 11.15, L, 1.0, TA.blue) + rect(0, 12.15, L, 2, TA.roof) + rect(0, 0, L, 4.25, TA.skirt) + rect(0, 4.25, L, 0.12, "#7d848c");
  const lo = nose ? [[0, 7.2], [2.6, 7.0], ["q", 7.6, 4.6, 14.0, 4.6], [L, 4.6]] : [[0, 4.6], [L, 4.6]];
  if (band) s += rect(nose ? 7.4 : 0, band[0], L, band[1], TA.blue);
  s += ribbon(shift(lo, 0, -0.45), 0.5, TA.navy) + ribbon(lo, 0.35, TA.sky);
  for (const d of car.doors) s += rect(d.x, d.y0, d.w, d.y1 - d.y0, TA.blue);
  if (nose) s += above([[0, 6.6], [2.4, 6.6], ["q", 6.0, 6.8, 7.0, 9.0], ["q", 7.6, 11.15, 9.6, 11.15], [12, 11.15]], TA.blue) + rect(10, 12.15, L, 2, TA.roof);
  return s;
}

// --- CSR Sifang EMUs (built at Qingdao, 2013-16): the Mitre's six-car and
// the Sarmiento's nine-car trains on 800 V third rail, the Roca's seven-car
// trains under 25 kV catenary. Control cars 22.67 m, the others 21.8 m;
// three double doors a side; 120 km/h. Third-rail shoes on the Mitre and
// Sarmiento cars, pantographs on the Roca's.
const CSR = (c) => ({ roof: 12.4, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 51.0, wb: 8.2, d: 34, shoe: !ROCA(c) }, diaphragm: [4.0, 11.4], badge: false,
  nose: [[1.4, 3.8], [0.9, 4.9], ["q", 0.8, 6.6, 1.4, 7.5], [3.4, 11.4], ["q", 4.1, 12.4, 5.8, 12.4]], cabLen: 6,
  cab: () => path(poly([[1.2, 7.1], ["q", 2.4, 9.6, 3.5, 11.6], [5.6, 11.6], [5.6, 7.3], ["q", 3.4, 6.9, 1.2, 7.1]]), TA.black) +
    path(poly([[2.6, 9.6], ["q", 3.0, 10.6, 3.6, 11.4], [5.4, 11.4], [5.4, 9.6]]), C.glassLight) + line(1.9, 7.5, 2.9, 9.4, "#0a0b0c", 0.8) +
    rect(3.8, 11.75, 1.7, 0.45, "#1d1f22", 0, 'rx="0.1"') + lamp(0.85, 5.3, 1.3, 0.75) + rect(0.9, 4.6, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 1.7) + cabSkirt(1.4, 5.0, 3.8) +
    rect(6.2, 4.3, 1.9, 6.9, "none", 0.5, 'rx="0.2"') + win(6.45, 7.7, 1.4, 2.5, 0.3) + line(8.4, 6.0, 8.4, 9.0, "currentColor", 0.6),
  paint: (c, g, nose, car) => csrPaint(c, g, nose, car),
  detail: (c, g, nose) => (nose ? taName(c, 30.0, 5.15, 0.9) : ""),
});
const csrDoor = (x) => ({ x, w: 4.3, y0: 3.9, y1: 10.6, leaves: 2, glassY: 0.42, glassH: 0.42 });
const csrRows = (xs) => [{ xs, y: 7.05, w: 3.9, h: 3.0, r: 0.35 }];
const csrCar = drivingCar(CSR, { rows: csrRows([7.2, ...seq(18.6, 4.6, 4), ...seq(42.6, 4.6, 4), 67.6]), doors: [csrDoor(13.0), csrDoor(37.0), csrDoor(61.0)],
  onRoof: (c, g) => acUnit(22, 11, 12.4) + acUnit(48, 9, 12.4) + horns(6.4, 12.4) + antenna(8.6, 12.4) });
const csrMid = middleCar(CSR, { rows: csrRows([2.4, ...seq(14.0, 4.8, 4), ...seq(39.2, 4.8, 4), 65.4]), doors: [csrDoor(8.5), csrDoor(33.6), csrDoor(58.7)],
  onRoof: (c, g) => (ROCA(c) && c.pan ? panDeck(g.L - 12, 12.4, { facing: -1, cableTo: 50 }) + acUnit(20, 11, 12.4) : acUnit(18, 11, 12.4) + acUnit(46, 9, 12.4)) });

// --- CNR (Tangshan) DMUs, the Belgrano Sur's (27 three-car units from
// 1001, 2014-15): two driving motor cars and a trailer, a raked nose, two
// double doors a side; engines under the motor cars, their radiators and
// exhausts on the roof; 100 km/h. White with the windows in a blue band,
// blue doors, the navy and sky blue stripes low on the side.
const CNR = () => ({ roof: 12.8, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 52.0, wb: 8.2, d: 33 }, diaphragm: [4.0, 11.8], badge: false,
  nose: [[1.8, 3.8], [1.1, 4.9], ["q", 0.9, 6.4, 1.6, 7.3], [4.6, 11.8], ["q", 5.4, 12.8, 7.2, 12.8]], cabLen: 7,
  cab: () => path(poly([[1.5, 7.0], ["q", 3.0, 9.6, 4.6, 12.0], [6.9, 12.0], [6.9, 7.2], ["q", 4.2, 6.8, 1.5, 7.0]]), TA.black) +
    path(poly([[3.4, 9.8], ["q", 4.0, 10.9, 4.8, 11.8], [6.7, 11.8], [6.7, 9.8]]), C.glassLight) + line(2.4, 7.4, 3.6, 9.6, "#0a0b0c", 0.8) +
    lamp(1.0, 5.3, 1.4, 0.75) + rect(1.05, 4.6, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 2.0) + cabSkirt(1.8, 5.6, 3.8) +
    rect(7.4, 4.3, 1.9, 7.2, "none", 0.5, 'rx="0.2"') + win(7.65, 7.7, 1.4, 2.6, 0.3) + line(9.6, 6.0, 9.6, 9.0, "currentColor", 0.6),
  paint: (c, g, nose, car) => csrPaint(c, g, nose, car, { band: [6.8, 3.6] }),
  detail: (c, g, nose, { doors }) => (nose ? taName(c, 35.0, 5.15, 0.9) + rect(28, 12.75, 8, 0.6, "#8f969e", 0.4, 'rx="0.2"') + slats(28.4, 12.8, 7.2, 0.5, 0.3, "rgba(0,0,0,0.4)") +
    rect(37.0, 12.75, 0.45, 1.1, "#3a3f45") + rect(37.8, 12.75, 0.45, 1.1, "#3a3f45") + rect(22, 1.3, 11, 2.3, "currentColor", 0, 'opacity="0.8" rx="0.2"') : ""),
});
const cnrDoor = (x) => ({ x, w: 4.3, y0: 3.9, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 });
const cnrCar = drivingCar(CNR, { rows: [{ xs: [9.4, ...seq(24.0, 4.9, 6), 60.4, 65.3], y: 7.1, w: 4.1, h: 3.0, r: 0.35 }], doors: [cnrDoor(15.6), cnrDoor(54.4)],
  onRoof: (c, g) => acUnit(14, 9, 12.8) + acUnit(56, 9, 12.8) + horns(7.6, 12.8) + antenna(9.8, 12.8) });
const cnrMid = middleCar(CNR, { rows: [{ xs: [2.4, 7.4, ...seq(21.0, 4.9, 6), 57.8, 62.8, 67.8], y: 7.1, w: 4.1, h: 3.0, r: 0.35 }], doors: [cnrDoor(13.6), cnrDoor(52.0)],
  onRoof: (c, g) => acUnit(20, 11, 12.8) + acUnit(44, 11, 12.8) });

// --- CSR Qishuyan SDD7 locomotives (the San Martín's whole fleet of 24,
// 2013-14): Co-Co diesel-electric with a full-width body, a raked cab at
// the front and a flat end with small windows at the back; 1,678 kW, 120
// km/h. White, the cab end royal blue, its edge raking back from the cab
// door up to the roof; sky blue panels low along the side under the
// louvers; a yellow line along the sill that rises into the blue at the
// cab; red and white chevrons on the pilot.
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

// The San Martín's CSR coaches (160 bought with the SDD7s, 2013-14): a
// vestibule with a double door a side near each end for the high
// platforms; white over royal blue, a sky blue line at the windows' foot,
// a gray roof; air conditioning at each end of the roof.
const COACH_DOORS = [{ x: 13.0, w: 4.3, y0: 3.9, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 }, { x: 62.7, w: 4.3, y0: 3.9, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 }];
const COACH = () => ({ roof: 12.6, sill: 3.8, cornerR: 1.0, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 33 }, diaphragm: [4.0, 11.6], badge: false,
  doors: COACH_DOORS, rows: [{ xs: [2.4, 7.4, ...seq(19.2, 5.0, 8), 68.8, 73.8], y: 7.1, w: 4.0, h: 3.0, r: 0.35 }],
  paint: (c, g) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, TA.white) + rect(0, 0, L, 6.6, TA.royal) + rect(0, 6.6, L, 0.3, TA.sky) + rect(0, 12.2, L, 2, TA.roof) + rect(0, 0, L, 4.25, TA.skirt);
    for (const d of COACH_DOORS) s += rect(d.x - 0.3, d.y0, d.w + 0.6, d.y1 - d.y0 + 0.3, TA.royal);
    return s;
  },
});
const csrCoach = unit(COACH, { doors: COACH_DOORS, onRoof: (c, g) => acUnit(4, 9, 12.6) + acUnit(g.L - 13, 9, 12.6) + rect(24, 12.55, 30, 0.25, C.steelDark, 0.4) +
  taName(c, 40, 5.4, 0.95, "#ffffff") }, false);

// --- Tren de la Costa (Maipú-Delta, 1995): nine two-car articulated units
// built by CAF, derived from the second series of Valencia's FGV 3700;
// 1,500 V overhead, standard gauge. Each half on its own motor truck at the
// cab, the two sharing a truck at the joint; one double door a side on each
// half; a pantograph on one half, the equipment housing over the cab.
// Trenes Argentinos' blue, white low on the front, three white stripes
// along the lower side, the windshield in black.
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

export const TYPES = {
  csrCar: { name: "CSR control car", kind: "emu" },
  csrMid: { name: "CSR car", kind: "emu", pan: true },
  cnrCar: { name: "CNR DMU driving car", kind: "emu" },
  cnrMid: { name: "CNR DMU trailer", kind: "emu" },
  sdd7: { name: "CSR SDD7 locomotive", kind: "diesel" },
  csrCoach: { name: "CSR coach", kind: "coach" },
  cafCar: { name: "CAF articulated car", kind: "emu" },
};
const M = (draw, len, oneEnd = false, variant = null) => ({ draw, len, oneEnd, variant });
export const MODELS = {
  csrCar: M(csrCar, 74.4, true, (c) => (ROCA(c) ? "ac" : "")), csrMid: M(csrMid, 71.5, false, (c) => (ROCA(c) ? "ac" : "")),
  cnrCar: M(cnrCar, 75.5, true), cnrMid: M(cnrMid, 75.5),
  sdd7: M(sdd7, 68.9), csrCoach: M(csrCoach, 80.4),
  cafCar: M(cafCar, 49.0, true),
};
// The Belgrano Sur's DMUs are the only units named by plain numbers.
export const FLEETS = { trenesba: [[1001, 1027, "cnrCar"]] };

const csr = (n) => ({ label: `${n}-car CSR electric train`, units: [["csrCar", 1], ["csrMid", n - 2], ["csrCar", 1]] });
const CSR_CARS = { Mitre: 6, Sarmiento: 9, Roca: 7 };
const BY_CLASS = {
  sdd7: { label: "CSR SDD7 locomotive with CSR coaches", units: [["sdd7", 1], ["csrCoach", 7]] },
  cnrCar: { label: "CNR three-car DMU, often two coupled (some trains locomotive-hauled)", units: [["cnrCar", 1], ["cnrMid", 1], ["cnrCar", 1]] },
  cafCar: { label: "CAF two-car articulated unit", units: [["cafCar", 2]] },
};
const BY_LINE = { "San Martín": "sdd7", "Belgrano Sur": "cnrCar", "Tren de la Costa": "cafCar" };
export const TYPICAL = {
  // The unit the feed names decides; else the line.
  trenesba: (t, reported) => {
    const k = reported || BY_LINE[t.route] || (CSR_CARS[t.route] ? "csrCar" : null);
    if (k === "csrCar") return csr(CSR_CARS[t.route] || 6);
    return BY_CLASS[k] || null;
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const CSR_FACTS = { model: "CSR EMU", type: "Electric multiple unit", builder: "CSR Sifang (Qingdao, China)", built: "2013–2016",
  fleet: "Over 700 cars", topSpeedMph: 74.6, seats: 72, lengthFt: 71.5,
  about: "The Chinese-built trains that replaced the old Japanese fleets on Buenos Aires' electric lines from 2014: six cars on the Mitre, nine on the Sarmiento, seven on the Roca. The Mitre and Sarmiento cars take 800 V from a third rail; the Roca's run under 25 kV wires and have stronger motors.",
  source: `${WIKI}CSR_EMU_(Argentina)` };
const CNR_FACTS = { model: "CNR DMU", type: "Diesel multiple unit", builder: "CNR Corporation", built: "2014–2015", fleet: "27 three-car units (from 1001)",
  topSpeedMph: 62,
  about: "Three-car diesel trains, two driving motor cars with a trailer between, bought in 2013 for the Belgrano Sur, Buenos Aires' metre-gauge line to González Catán and Marcos Paz. Its older locomotive-hauled sets still run some trains.",
  source: `${WIKI}CNR_diesel_multiple_unit` };
const SDD7_FACTS = { model: "CSR SDD7", type: "Diesel-electric locomotive", builder: "CSR Qishuyan", built: "2013–2014", fleet: "24", topSpeedMph: 74.6, powerHp: 2250,
  about: "Chinese Co-Co locomotives that arrived with 160 new coaches to renew the whole San Martín line, from Retiro to Pilar and Cabred, in 2014.",
  source: `${WIKI}CSR_SDD7` };
const COACH_FACTS = { model: "CSR coach", type: "Passenger coach", builder: "CSR", built: "2013–2014", fleet: "160", seats: 78,
  about: "The San Martín's locomotive-hauled coaches, bought from China with the SDD7s. Their high floors meant the platforms from Retiro to Pilar were rebuilt.",
  source: "https://es.wikipedia.org/wiki/L%C3%ADnea_San_Mart%C3%ADn" };
const CAF_FACTS = { model: "CAF Tren de la Costa unit", type: "Electric multiple unit", builder: "CAF", built: "1990s", fleet: "9 two-car units",
  about: "Two-car articulated trains derived from Valencia's FGV 3700 series, built for the Tren de la Costa when it opened in 1995 along the old Bartolomé Mitre branch by the River Plate.",
  source: `${WIKI}Tren_de_la_Costa` };
export const FACTS = {
  csrCar: CSR_FACTS, csrMid: CSR_FACTS, cnrCar: CNR_FACTS, cnrMid: CNR_FACTS,
  sdd7: SDD7_FACTS, csrCoach: COACH_FACTS, cafCar: CAF_FACTS,
};
