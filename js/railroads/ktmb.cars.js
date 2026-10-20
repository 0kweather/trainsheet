// KTMB's trains (scripts/railroads/ktmb.py): the ETS electric sets (Classes
// 91, 93/1, 93/2 and 94), KTM Komuter's EMUs (Classes 92, 83 and 81), the
// Class 61 DMUs, and the locomotive-hauled trains (Class 25 and Class 26
// diesels, the power generator car, seated and sleeping coaches, and the
// generator wagon of the Pasir Gudang "hybrid" train). The feed names each
// train's set (vehicle.label "ETS202", "SCS21", "EMU23", "DMU06"), which
// js/railroads/ktmb.js passes as the car's type; the rest of the train is
// what that class runs as, and the set's number picks the batch or paint
// where a class has more than one (93/1 or 93/2, the ex-Skypark Class 83s).
// Drawn from each class's published dimensions and photographs of the
// current paint; the lettering is drawn as type, not copied from the
// operator's logo.

import { bilevel, newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, door, truck, pantograph, underframe, slats, flutes, locoCoupler } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const KTM = {
  silver: "#d5d9de", roof: "#a9b0b8", skirt: "#565c64", under: "#474c53", band: "#2c3137", black: "#15181b",
  navy: "#1d3570", blue: "#2457a8", royal: "#1f4fae", sky: "#3f7fd0", yellow: "#f6c400", gold: "#e0a800",
  red: "#d22630", orange: "#f0862a", white: "#f3f4f5", champagne: "#cfcbc1",
};

// ---------- Drawing helpers ----------

const r2 = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering on a car side, h ft tall, centered at x, reading left to right
// even on a car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700, italic = false, spacing = 0, family = SANS, stroke = null } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" font-weight="${weight}"` +
  `${italic ? ' font-style="italic"' : ""}${spacing ? ` letter-spacing="${spacing}"` : ""}${stroke ? ` stroke="${stroke}" stroke-width="0.06" paint-order="stroke"` : ""} font-family="${family}" fill="${fill}">${text}</text>`;
// KTM's mark as lettered on its trains: "KTM" in heavy italic capitals
// under a swept underline.
const ktmMark = (c, x, y, h, fill) => letters(c, x, y + h * 0.12, h, "KTM", fill, { weight: 900, italic: true, spacing: 0.02 }) +
  path(`M${r2(x - h * 1.25)} ${r2(y - h * 0.5)}Q${r2(x)} ${r2(y - h * 0.62)} ${r2(x + h * 1.35)} ${r2(y - h * 0.38)}L${r2(x + h * 1.3)} ${r2(y - h * 0.5)}Q${r2(x)} ${r2(y - h * 0.74)} ${r2(x - h * 1.25)} ${r2(y - h * 0.5)}Z`, fill);
// A closed shape over a curve (to the top of the drawing) or under it (to the rail).
const endOf = (p) => (p[0] === "q" ? [p[3], p[4]] : p);
const above = (pts, fill, top = 18) => path(poly([...pts, [endOf(pts[pts.length - 1])[0], top], [pts[0][0], top]]), fill);
const below = (pts, fill) => path(poly([...pts, [endOf(pts[pts.length - 1])[0], -1], [pts[0][0], -1]]), fill);
const shift = (pts, dx, dy) => pts.map((p) => (p[0] === "q" ? ["q", p[1] + dx, p[2] + dy, p[3] + dx, p[4] + dy] : [p[0] + dx, p[1] + dy]));

// Roof: an air-conditioning unit (a low housing, its two grilles, a seam
// along the lid); a pantograph on its insulated deck with the lightning
// arrester beside it and the roof cable running off along insulators;
// horns; an antenna.
function acUnit(x, w, roof, { h = 0.8, fill = "#c3c8ce" } = {}) {
  const t = roof + h, gw = Math.min(3, w * 0.28);
  return path(poly([[x, roof - 0.05], [x + w, roof - 0.05], [x + w - 0.25, t - 0.25], ["q", x + w - 0.4, t, x + w - 0.8, t], [x + 0.8, t], ["q", x + 0.4, t, x + 0.25, t - 0.25]]), fill, 0.4) +
    slats(x + 0.9, roof + 0.12, gw, h - 0.42, 0.3, "rgba(0,0,0,0.35)") + slats(x + w - 0.9 - gw, roof + 0.12, gw, h - 0.42, 0.3, "rgba(0,0,0,0.35)") +
    line(x + 0.7, t - 0.16, x + w - 0.7, t - 0.16, "rgba(255,255,255,0.5)", 0.4);
}
// down: the pantograph folded (a set hauled off the wires).
function panDeck(cx, roof, { facing = 1, cableTo = null, down = false } = {}) {
  let s = rect(cx - 3.3, roof - 0.05, 6.6, 0.35, "#8f969e", 0.4) + pantograph(cx, roof + 0.3, { facing, up: !down });
  const ax = cx + 4.1 * facing;
  s += rect(ax - 0.2, roof, 0.4, 0.95, "#7d848c", 0.3) + lines([[ax - 0.27, roof + 0.32, ax + 0.27, roof + 0.32], [ax - 0.27, roof + 0.62, ax + 0.27, roof + 0.62]], "#4a5057", 0.6) + circle(ax, roof + 1.05, 0.16, "#5a6068");
  if (cableTo != null) {
    const a = Math.min(ax, cableTo), b = Math.max(ax, cableTo);
    s += line(a, roof + 0.5, b, roof + 0.5, "#3a3f45", 0.8);
    s += seq(a + 2, 5, Math.max(0, Math.floor((b - a - 2) / 5))).map((x) => rect(x - 0.12, roof, 0.24, 0.5, "#7d848c")).join("");
  }
  return s;
}
const horns = (x, y) => rect(x, y, 1.2, 0.3, "#5a6068", 0.3) + path(poly([[x, y + 0.05], [x - 0.5, y - 0.1], [x - 0.5, y + 0.42], [x, y + 0.27]]), "#6a7078") +
  path(poly([[x + 1.2, y + 0.05], [x + 1.7, y - 0.1], [x + 1.7, y + 0.42], [x + 1.2, y + 0.27]]), "#6a7078");
const antenna = (x, roof) => line(x, roof, x, roof + 0.9, "#3a3f45", 0.6) + rect(x - 0.3, roof - 0.02, 0.6, 0.15, "#5a6068");

// Under the floor: body-colored fairings (seams, louvered covers), or the
// equipment hung in the open (boxes, an air reservoir, cable conduit).
function skirt(x0, x1, top, bottom, fill, { seam = 7, louvers = [] } = {}) {
  let s = rect(x0, bottom, x1 - x0, top - bottom, fill, 0.4, 'rx="0.15"');
  s += lines(seq(x0 + seam, seam, Math.max(0, Math.floor((x1 - x0 - 1) / seam))).map((x) => [x, bottom + 0.1, x, top - 0.05]), "rgba(0,0,0,0.35)", 0.5);
  for (const [a, w] of louvers) s += slats(a, bottom + 0.25, w, top - bottom - 0.5, 0.3, "rgba(0,0,0,0.4)");
  return s + line(x0 + 0.2, bottom + 0.12, x1 - 0.2, bottom + 0.12, "rgba(0,0,0,0.3)", 0.6);
}
function equipment(x0, x1, top, { depth = 1.5, boxes = 3 } = {}) {
  return underframe(x0, x1, top, { depth, boxes }) + line(x0, top - 0.25, x1, top - 0.25, "#3a3f45", 0.9) +
    slats(x0 + 0.8, top - depth + 0.2, Math.min(4, (x1 - x0) / 6), depth - 0.4, 0.3, "rgba(255,255,255,0.25)");
}
// Under each truck: the yaw damper to the body and the brake unit.
const bogieGear = (cx, wb, top) => line(cx - wb / 2 - 0.6, top - 0.55, cx - 1.9, top - 0.55, "#5a6068", 1.0) + rect(cx + 1.7, 1.55, 1.1, 0.7, "#5a6068", 0, 'rx="0.15"');
// Each side door's step plate under the sill and the door light over it.
const doorTrim = (doors, sill) => doors.map((d) => rect(d.x - 0.1, sill - 0.42, d.w + 0.2, 0.36, "#3a3f45") + rect(d.x + d.w / 2 - 0.3, d.y1 + 0.22, 0.6, 0.18, "#e8a317")).join("");
// A headlight cluster seen from the side, and a front coupler with its
// draft gear and air hoses (x: the coupler face).
const lamp = (pts, lens) => path(poly(pts), "#e9edf0", 0.35) + circle((pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2, 0.18, lens);
function frontCoupler(x, y = 2.85, reach = 2.6) {
  return rect(x + 0.3, y - 0.3, reach, 0.6, "#2a2d31") + rect(x, y - 0.62, 0.55, 1.24, "#2a2d31", 0, 'rx="0.15"') + rect(x + 0.7, y + 0.35, 1.1, 0.32, "#5a6068") +
    path(`M${r2(x + 1.0)} ${r2(y - 0.3)}Q${r2(x + 0.8)} ${r2(y - 1.3)} ${r2(x + 1.8)} ${r2(y - 1.2)}`, "none", 0, 'stroke="#2a2d31" stroke-width="0.8" vector-effect="non-scaling-stroke" stroke-linecap="round"');
}
// An obstacle deflector under a streamlined nose, from x0 back to x1.
const deflector = (x0, x1, sill) => path(poly([[x0, sill + 0.05], [x1, sill + 0.05], [x1 - 0.3, 1.0], [x1 - 0.8, 0.55], [x0 + 0.4, 0.55], [x0 - 0.5, 1.6]]), "#33373c") +
  line(x0 - 0.1, 1.5, x1 - 0.5, 1.5, "#5a6068", 0.6);

// A multiple unit's driving car (its nose on the left; the consist mirrors
// the one at the back) and its intermediate cars, from one spec: body (roof,
// sill, trucks), nose, cabLen, paint(c, g, nose), cab(c, g), detail(c, g,
// nose) and per car rows, doors and extra.
// The two cars next to the driving cars carry the pantographs.
const besideCab = (c) => c.index === 1 || c.index === c.count - 2;
function unit(spec, car, nose) {
  return (c) => bilevel(nose ? { ...c, cabL: true } : { ...c, cabL: false, cabR: false }, {
    ...spec, ...(nose ? {} : { nose: null, cab: null }), ...car, roofItems: [],
    paint: (c, g) => spec.paint(c, g, nose),
    extra: (c, g) => {
      const t = spec.trucks, a = g.L / 2 - t.centers / 2, b = g.L / 2 + t.centers / 2;
      return bogieGear(a, t.wb, spec.sill) + bogieGear(b, t.wb, spec.sill) + doorTrim(car.doors, spec.sill) +
        (spec.detail ? spec.detail(c, g, nose, { a, b }) : "") + (car.extra ? car.extra(c, g) : "");
    },
  });
}
const drivingCar = (spec, car) => unit(spec, car, true);
const middleCar = (spec, car) => unit(spec, car, false);

// ===================== ETS (electric intercity) =====================
// Six-car sets, two single-leaf plug doors a side on each car near its ends,
// a long row of big windows in a dark glazing band; 25 kV, metre gauge,
// about 13 ft to the roof. Trucks 52 ft 6 in apart on 34 in wheels; the
// equipment under the floor behind fairings.
// Class 93 (CRRC Zhuzhou, ETS 201-219, 2013-18): driving cars 24 m, the
// others 23 m; a long raked nose. Silver, a red over orange band low on the
// side over a gray skirt; the nose yellow, edged in navy, the yellow
// running back along the top of the side; the windshield a black mask over
// the nose; pantographs on the two trailers next to the driving cars.
// Class 94 (ETS3, CRRC Zhuzhou with CRRC Batu Gajah, ETS 301-310, 2023-25):
// a blunter nose in the flag's colors: silver, a navy band low on the side
// under two red pinstripes; the lower nose yellow, a red fin behind the
// black windshield and roof cap.
// Class 91 (Hyundai Rotem with Mitsubishi Electric, ETS 101-105, 2008-09):
// about 22 m cars, a shorter, blunter nose; silver, the cab end yellow, a
// blue band under a yellow line that sweeps up the nose to the headlights.
const ETS = { roof: 13.0, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 52.5, wb: 8.2, d: 34 }, diaphragm: [3.6, 11.8], badge: false };
const ETS_NOSE = [[2.6, 3.3], [1.5, 4.4], ["q", 0.9, 5.6, 1.6, 6.6], [8.6, 12.2], ["q", 10.0, 13.0, 12.4, 13.0]];
const ETS94_NOSE = [[2.2, 3.3], [1.2, 4.4], ["q", 0.8, 5.8, 1.3, 6.9], [6.4, 12.1], ["q", 7.4, 13.0, 9.8, 13.0]];
const ETS91_NOSE = [[1.4, 3.3], [1.0, 4.6], [1.0, 7.0], ["q", 1.1, 8.0, 1.8, 8.6], [3.9, 12.0], ["q", 4.7, 13.0, 6.5, 13.0]];
const etsDoor = (x) => ({ x, w: 3.0, y0: 3.4, y1: 10.6, glassY: 0.5, glassH: 0.38, grabs: false });
const etsRows = (a, n) => [{ xs: seq(a, 6.3, n), y: 7.0, w: 4.6, h: 3.1, r: 0.45 }];
// The window band; the roof's gray above the eave.
const etsBand = (L, x0) => rect(x0, 6.8, L, 3.5, KTM.band, 0, 'rx="0.4"') + lines([[x0 + 0.3, 6.85, L, 6.85]], "rgba(255,255,255,0.18)", 0.5);
function etsPaint(kind) {
  return (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, KTM.silver);
    if (kind === "93") {
      s += rect(0, 0, L, 3.95, KTM.skirt) + rect(0, 3.95, L, 0.85, KTM.orange) + rect(0, 4.8, L, 0.72, KTM.red);
      if (nose) {
        // The yellow nose, its navy edge sweeping up from the lower nose to
        // the eave and back along the top of the side.
        const edge = [[0, 4.25], [2.6, 4.25], ["q", 6.6, 4.5, 8.5, 7.0], [10.0, 9.6], ["q", 11.3, 11.3, 14.5, 11.3], [34, 11.55], [L, 11.85]];
        s += above(shift(edge, 0.3, -0.32), KTM.navy) + above(edge, KTM.yellow) + rect(14.0, 12.35, L, 2, KTM.roof);
      } else s += rect(0, 11.53, L, 0.32, KTM.navy) + rect(0, 11.85, L, 0.5, KTM.yellow) + rect(0, 12.35, L, 2, KTM.roof);
      return s + etsBand(L, nose ? 17.3 : 0);
    }
    if (kind === "94") {
      s += rect(0, 12.35, L, 2, KTM.roof) + rect(0, 0, L, 4.55, KTM.navy) + rect(0, 4.75, L, 0.2, KTM.red) + rect(0, 5.15, L, 0.2, KTM.red);
      if (nose) {
        // Yellow under the windshield, the red fin behind it.
        s += path(poly([[0, 3.0], [3.6, 3.0], ["q", 5.0, 4.6, 4.7, 7.4], [0, 7.4]]), KTM.yellow);
        s += path(poly([[3.6, 3.0], [6.0, 3.0], ["q", 7.4, 5.0, 8.6, 7.4], [12.7, 13.4], [10.2, 13.4], [5.6, 7.4], ["q", 5.2, 5.0, 3.6, 3.0]]), KTM.red);
      }
      return s + etsBand(L, nose ? 19.8 : 0);
    }
    // Class 91.
    s += rect(0, 12.35, L, 2, KTM.roof) + rect(0, 0, L, 3.9, KTM.skirt) + rect(0, 4.4, L, 1.0, KTM.blue) + rect(0, 5.55, L, 0.25, KTM.yellow);
    if (nose) {
      s += path(poly([[0, 3.9], [3.4, 3.9], ["q", 5.6, 4.6, 6.0, 7.0], [6.4, 11.2], ["q", 6.7, 12.6, 8.2, 13.4], [0, 13.4]]), KTM.yellow);
      s += path(poly([[9.0, 4.4], [9.0, 5.4], ["q", 4.0, 5.5, 1.0, 7.8], [1.0, 6.5], ["q", 3.6, 4.4, 9.0, 4.4]]), KTM.blue);
    }
    return s + etsBand(L, nose ? 8.6 : 0);
  };
}
// The cab, seen from the side: the windshield's black mask with the sky
// reflected in its upper part, the wiper, headlights and the crew door with
// its window; the deflector under the nose.
const ets93Cab = () => path(poly([[2.9, 7.25], ["q", 6.0, 10.4, 8.3, 11.95], [10.6, 11.95], ["q", 10.9, 10.8, 10.2, 9.2], ["q", 8.8, 7.3, 6.0, 7.05]]), KTM.black) +
  path(poly([[6.5, 10.0], ["q", 7.6, 11.1, 8.4, 11.6], [10.3, 11.6], ["q", 10.4, 10.7, 10.1, 10.0]]), C.glassLight) + line(4.6, 7.7, 6.4, 9.9, "#0a0b0c", 0.8) +
  lamp([[1.9, 5.5], [3.5, 6.2], [3.9, 5.95], [2.3, 5.2]], "#fff6d0") + rect(11.2, 4.2, 1.8, 7.3, "none", 0.5, 'rx="0.2"') + win(11.45, 8.3, 1.3, 2.3, 0.3) +
  line(13.3, 6.0, 13.3, 9.0, "currentColor", 0.6) + deflector(2.6, 5.6, 3.3) + line(1.4, 4.75, 3.5, 3.5, "rgba(0,0,0,0.35)", 0.5);
const ets94Cab = () => path(poly([[1.6, 7.4], ["q", 4.0, 10.6, 6.6, 13.2], [10.0, 13.2], [5.6, 7.4], ["q", 3.4, 7.0, 1.6, 7.4]]), KTM.black) +
  path(poly([[4.5, 10.6], ["q", 5.6, 11.9, 6.9, 12.9], [9.6, 12.9], [7.6, 10.6]]), C.glassLight) + line(3.0, 7.8, 4.6, 10.2, "#0a0b0c", 0.8) +
  lamp([[1.1, 6.0], [2.6, 6.6], [2.9, 6.3], [1.4, 5.7]], "#fff6d0") + rect(13.3, 4.2, 1.8, 7.3, "none", 0.5, 'rx="0.2"') + win(13.55, 8.3, 1.3, 2.3, 0.3) +
  deflector(2.2, 5.2, 3.3) + line(1.2, 4.8, 3.2, 3.5, "rgba(0,0,0,0.35)", 0.5);
const ets91Cab = () => path(poly([[1.2, 8.8], [3.6, 12.1], [5.4, 12.1], [5.4, 8.6], ["q", 3.0, 8.4, 1.2, 8.8]]), KTM.black) + path(poly([[2.6, 10.6], [3.8, 11.8], [5.1, 11.8], [5.1, 10.6]]), C.glassLight) +
  line(2.4, 9.0, 3.6, 10.9, "#0a0b0c", 0.8) + win(6.4, 7.9, 1.6, 2.7, 0.35) + rect(6.15, 4.2, 2.1, 7.2, "none", 0.5, 'rx="0.2"') +
  lamp([[0.95, 6.1], [1.9, 6.1], [1.9, 6.9], [0.95, 6.9]], "#fff6d0") + rect(0.95, 5.3, 0.4, 0.45, "#d8252d") + frontCoupler(0, 2.85, 1.6) + deflector(1.4, 4.4, 3.3);
// Fairings between the trucks; air conditioning on every car, a pantograph
// deck on the two trailers beside the driving cars; horns and an antenna
// over the cab.
const etsDetail = (kind) => (c, g, nose, { a, b }) => {
  const L = g.L;
  let s = skirt(a + 6.3, b - 6.3, 3.35, 1.6, KTM.under, { seam: 6.5, louvers: [[a + 9, 3], [b - 12, 3]] });
  if (nose) s += acUnit(26, 11, 13.0) + acUnit(L - 22, 8, 13.0) + antenna(kind === "91" ? 9 : 15, 13.0);
  else if (besideCab(c)) s += acUnit(6, 9, 13.0) + panDeck(L - 13, 13.0, { facing: -1, cableTo: 22 });
  else s += acUnit(8, 9, 13.0) + acUnit(L - 17, 9, 13.0);
  if (nose) s += kind === "93" ? ktmMark(c, 24.4, 6.2, 0.85, KTM.navy) + letters(c, 29.4, 6.15, 0.95, "ETS", KTM.gold, { weight: 800, italic: true, stroke: KTM.navy })
    : kind === "94" ? ktmMark(c, 24.4, 6.15, 0.85, KTM.navy) + letters(c, 29.4, 6.1, 0.95, "ETS", KTM.red, { weight: 800, italic: true })
      : ktmMark(c, 16.0, 6.35, 0.8, KTM.navy) + letters(c, 20.8, 6.3, 0.9, "ETS", KTM.blue, { weight: 800, italic: true });
  return s;
};
const etsSpec = (kind) => ({ ...ETS, nose: kind === "91" ? ETS91_NOSE : kind === "94" ? ETS94_NOSE : ETS_NOSE, cabLen: kind === "91" ? 8 : 12,
  cab: kind === "91" ? ets91Cab : kind === "94" ? ets94Cab : ets93Cab, paint: etsPaint(kind), detail: etsDetail(kind) });
const etsSet = (kind, carL, midL) => {
  const spec = etsSpec(kind), first = kind === "91" ? 13.0 : 17.5;
  const car = { rows: etsRows(first, Math.floor((carL - 6 - first) / 6.3)), doors: [etsDoor(kind === "91" ? 9.0 : kind === "94" ? 16.6 : 14.0), etsDoor(carL - 4.4)] };
  if (kind === "94") car.rows = etsRows(20.0, Math.floor((carL - 6 - 20.0) / 6.3));
  const mid = { rows: etsRows(7.2, Math.floor((midL - 13.0) / 6.3)), doors: [etsDoor(2.0), etsDoor(midL - 5.0)] };
  return { car: drivingCar(spec, car), mid: middleCar(spec, mid) };
};
const E93 = etsSet("93", 78.7, 75.5), E94 = etsSet("94", 78.7, 75.5), E91 = etsSet("91", 72.9, 72.2);

// ===================== KTM Komuter =====================
// Class 92 (CSR Zhuzhou, SCS 01-38, 2010-12): six cars, driving cars 23.7 m,
// the others 22.8 m; three double-leaf doors a side; 25 kV, 125 km/h. White,
// a red line along the eave over a silver skirt; the cab front yellow, a
// blue band behind it from the roof down the cab side, a red sweep under
// it; blue and yellow slashes by the first door. The equipment hung in the
// open under the floor; pantographs on the two motor cars next to the
// driving cars.
const SCS = { roof: 13.0, sill: 3.3, cornerR: 1.0, end: 0.6, trucks: { centers: 51.5, wb: 8.2, d: 34 }, diaphragm: [3.6, 11.8], badge: false,
  nose: [[1.6, 3.3], [1.0, 4.6], ["q", 0.9, 6.2, 1.5, 7.0], [4.6, 12.0], ["q", 5.4, 13.0, 7.2, 13.0]], cabLen: 8,
  cab: () => path(poly([[1.7, 7.5], [4.4, 11.8], [6.2, 11.8], [6.2, 7.5], ["q", 3.8, 7.2, 1.7, 7.5]]), KTM.black) + path(poly([[3.3, 10.0], [4.5, 11.6], [6.0, 11.6], [6.0, 10.0]]), C.glassLight) +
    line(2.6, 7.8, 3.8, 10.2, "#0a0b0c", 0.8) + win(6.9, 7.8, 1.4, 2.8, 0.3) + rect(6.65, 4.0, 1.9, 7.4, "none", 0.5, 'rx="0.2"') +
    lamp([[0.95, 5.5], [2.0, 5.5], [2.0, 6.2], [0.95, 6.2]], "#fff6d0") + rect(1.0, 4.9, 0.45, 0.4, "#d8252d") + rect(4.6, 11.95, 1.8, 0.5, "#1d1f22", 0, 'rx="0.1"') +
    frontCoupler(0, 2.85, 1.7) + deflector(1.6, 4.6, 3.3),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, KTM.white) + rect(0, 12.35, L, 2, KTM.roof) + rect(0, 11.9, L, 0.32, KTM.red) + rect(0, 0, L, 3.9, "#a3aab2") + rect(0, 3.9, L, 0.15, "#7d848c");
    if (nose) {
      s += path(poly([[3.2, 3.9], ["q", 4.6, 5.6, 5.4, 8.2], ["q", 6.2, 11.4, 7.2, 13.6], [9.8, 13.6], ["q", 8.6, 11.4, 7.8, 8.2], ["q", 7.0, 5.6, 5.6, 3.9]]), KTM.blue);
      s += path(poly([[0, 13.6], [0, 3.9], [3.2, 3.9], ["q", 4.6, 5.6, 5.4, 8.2], ["q", 6.2, 11.4, 7.2, 13.6]]), KTM.yellow);
      s += path(poly([[0, 3.9], [0, 5.2], ["q", 6.0, 5.6, 16.0, 5.2], ["q", 9.0, 4.4, 4.0, 3.9]]), KTM.red);
      // Blue and yellow slashes by the first door.
      for (const [x, w, f] of [[10.6, 0.9, KTM.blue], [11.8, 0.35, KTM.yellow], [12.5, 0.9, KTM.blue]]) s += path(poly([[x, 4.2], [x + w, 4.2], [x + w + 1.6, 6.6], [x + 1.6, 6.6]]), f);
    }
    return s;
  },
  detail: (c, g, nose, { a, b }) => {
    const L = g.L;
    let s = equipment(a + 6.4, b - 6.4, 3.3, { depth: 1.5, boxes: 4 });
    if (nose) s += acUnit(18, 10, 13.0) + acUnit(50, 10, 13.0) + horns(8.6, 13.0) + antenna(10.6, 13.0) +
      letters(c, 26.6, 6.15, 0.95, "KTM", KTM.navy, { weight: 900, italic: true }) + letters(c, 31.6, 6.15, 0.95, "Komuter", KTM.blue, { weight: 700, italic: true });
    else if (besideCab(c)) s += acUnit(40, 10, 13.0) + panDeck(14, 13.0, { cableTo: 30 });
    else s += acUnit(16, 10, 13.0) + acUnit(L - 26, 10, 13.0);
    return s;
  },
};
const scsDoor = (x) => ({ x, w: 4.3, y0: 3.4, y1: 10.6, leaves: 2, glassY: 0.45, glassH: 0.4 });
const scsWin = (xs) => [{ xs, y: 7.0, w: 4.3, h: 3.0, r: 0.4 }];
const SCS_CAR = { rows: scsWin([9.2, 21.5, 26.7, 31.9, 47.8, 53.0, 58.2, 65.6]), doors: [scsDoor(14.9), scsDoor(41.2), scsDoor(71.0)] };
const SCS_MID = { rows: scsWin([1.6, 13.4, 18.6, 23.8, 44.7, 49.9, 55.1, 66.8]), doors: [scsDoor(6.6), scsDoor(35.25), scsDoor(62.0)] };
const scs92Car = drivingCar(SCS, SCS_CAR);
const scs92Mid = middleCar(SCS, SCS_MID);

// Class 83 (Hyundai Precision with Marubeni, EMU 19-40, 1996-97): three
// cars, the driving motor cars 22.2 m, the trailer between them 23.2 m with
// the pantograph; a nearly upright fiberglass front; two double doors a
// side. Corrugated stainless sides, a blue window band with a white chevron
// behind the cab and a yellow line over it; the cab end yellow all over.
const E83 = { roof: 12.9, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 50.0, wb: 8.0, d: 34 }, diaphragm: [3.7, 11.7], badge: false,
  nose: [[1.0, 3.4], [0.8, 4.5], [0.8, 9.2], ["q", 0.9, 11.2, 1.8, 12.2], ["q", 2.4, 12.9, 3.6, 12.9]], cabLen: 4.5,
  cab: () => path(poly([[0.9, 7.2], [0.9, 10.3], ["q", 1.1, 11.3, 1.9, 11.8], [3.7, 11.8], [3.7, 7.2]]), KTM.black) + path(poly([[1.0, 9.9], ["q", 1.2, 11.1, 2.0, 11.6], [3.5, 11.6], [3.5, 9.9]]), C.glassLight) +
    line(1.5, 7.5, 2.1, 9.8, "#0a0b0c", 0.8) + lamp([[0.85, 5.3], [1.9, 5.3], [1.9, 6.1], [0.85, 6.1]], "#ffd8a0") + rect(1.2, 6.5, 2.0, 0.55, "#1d3570", 0, 'rx="0.1"') +
    frontCoupler(0, 2.85, 1.3) + rect(0.6, 1.8, 3.2, 1.6, "#3a3f45", 0.4) + rect(4.0, 4.0, 1.0, 6.8, "none", 0.5, 'rx="0.2"'),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, "#cfd3d8") + flutes(0, L, 3.6, 6.4, 0.27) + flutes(0, L, 10.95, 12.2, 0.27) + rect(0, 12.2, L, 2, KTM.roof) + rect(0, 0, L, 3.65, "#9aa1a9");
    s += rect(0, 6.75, L, 3.65, "#2a55a6") + rect(0, 10.55, L, 0.28, KTM.yellow);
    if (nose) {
      s += path("M12.6 6.9L11.2 6.9L9.8 8.55L11.2 10.25L12.6 10.25L11.2 8.55Z", "#f4f5f6");
      s += path(poly([[0, -1], [5.2, -1], [5.2, 11.4], ["q", 5.2, 13.6, 3.6, 13.6], [0, 13.6]]), "#f2b705") + line(5.2, 3.4, 5.2, 11.4, "rgba(0,0,0,0.3)", 0.5);
    }
    return s;
  },
  detail: (c, g, nose, { a, b }) => {
    const L = g.L;
    let s = equipment(a + 6.2, b - 6.2, 3.4, { depth: 1.4, boxes: nose ? 4 : 3 });
    if (nose) s += acUnit(16, 9, 12.9) + acUnit(L - 24, 9, 12.9) + horns(6.4, 12.9) + antenna(9, 12.9) + letters(c, 30.0, 5.6, 0.95, "KTM Komuter", KTM.navy, { weight: 800, italic: true });
    else s += panDeck(16, 12.9, { cableTo: 34 }) + acUnit(40, 9, 12.9) + acUnit(L - 14, 9, 12.9);
    return s;
  },
};
const e83Door = (x) => ({ x, w: 4.2, y0: 3.5, y1: 10.5, leaves: 2, glassY: 0.45, glassH: 0.4 });
const e83Rows = (xs) => [{ xs, y: 7.0, w: 4.2, h: 2.9, r: 0.35 }];
const emu83Car = drivingCar(E83, { rows: e83Rows([5.4, 21.8, 27.2, 32.6, 38.0, 43.4, 60.0, 65.6]), doors: [e83Door(13.6), e83Door(51.4)] });
const emu83Mid = middleCar(E83, { rows: e83Rows([2.2, 17.4, 22.8, 28.2, 43.6, 49.0, 54.4, 69.6]), doors: [e83Door(9.6), e83Door(62.3)] });

// ===================== Class 61 DMU =====================
// CRRC Zhuzhou, DMU 01-13 (2018-20, the first two built in China, the rest
// at Batu Gajah): four cars, 93.5 m, two MAN power packs under the motor
// cars; a raked nose; two single plug doors a side on each car. Champagne
// silver, a dark window band, a gray skirt; royal blue along the top of the
// side over a yellow line, the blue sweeping down over the cab and nose.
// The motor cars' radiators and exhausts on the roof over their engines.
const D61 = { roof: 13.1, sill: 3.4, cornerR: 1.0, end: 0.6, trucks: { centers: 52.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.9], badge: false,
  nose: [[2.0, 3.4], [1.2, 4.5], ["q", 0.9, 5.8, 1.5, 6.8], [6.0, 12.2], ["q", 7.0, 13.1, 9.0, 13.1]], cabLen: 10,
  cab: () => path(poly([[2.2, 7.3], ["q", 4.4, 10.4, 5.8, 12.0], [8.0, 12.0], ["q", 7.6, 9.4, 5.6, 7.2], ["q", 3.8, 7.0, 2.2, 7.3]]), KTM.black) +
    path(poly([[4.2, 10.3], [5.7, 11.8], [7.8, 11.8], ["q", 7.6, 10.9, 7.2, 10.3]]), C.glassLight) + line(3.4, 7.6, 4.6, 9.9, "#0a0b0c", 0.8) +
    win(8.6, 7.9, 1.6, 2.7, 0.3) + rect(8.35, 4.1, 2.1, 7.4, "none", 0.5, 'rx="0.2"') + line(10.8, 6.0, 10.8, 9.0, "currentColor", 0.6) +
    lamp([[1.4, 5.4], [3.0, 5.9], [3.2, 5.6], [1.6, 5.1]], "#fff6d0") + rect(1.15, 4.75, 0.5, 0.35, "#d8252d") + frontCoupler(0, 2.85, 2.0) + deflector(2.0, 5.2, 3.4),
  paint: (c, g, nose) => {
    const L = g.L;
    let s = rect(0, 0, L, 18, KTM.champagne) + rect(0, 0, L, 3.9, "#7c8189") + rect(0, 3.9, L, 0.14, "#5a6068");
    const edge = nose ? [[0, 5.6], [2.8, 5.4], ["q", 8.4, 5.2, 10.8, 8.8], ["q", 12.2, 11.4, 16.0, 11.9], [L, 12.05]] : [[0, 12.05], [L, 12.05]];
    s += above(shift(edge, 0.25, -0.32), KTM.yellow) + above(edge, KTM.royal) + rect(nose ? 13 : 0, 13.0, L, 2, "#8f98a3");
    if (!nose) s += rect(0, 11.45, L, 0.2, KTM.red);
    return s + rect(nose ? 12.6 : 0, 6.8, L, 3.4, KTM.band, 0, 'rx="0.4"');
  },
  detail: (c, g, nose, { a, b }) => {
    const L = g.L;
    let s = "";
    if (nose) {
      s += equipment(a + 6.4, b - 6.4, 3.4, { depth: 1.5, boxes: 3 }) + acUnit(20, 10, 13.1) + acUnit(50, 9, 13.1) + horns(10.6, 13.1) + antenna(12.8, 13.1);
      s += ktmMark(c, 24.0, 6.2, 0.85, KTM.royal);
    } else {
      // The power pack: engine and transmission, the fuel tank beside them.
      s += rect(a + 7, 1.2, 14, 2.2, "currentColor", 0, 'opacity="0.82" rx="0.2"') + slats(a + 8, 1.5, 6, 1.6, 0.3, "rgba(255,255,255,0.25)") +
        rect(a + 22, 1.6, 9, 1.8, "#3a3f45", 0.4, 'rx="0.8"') + equipment(a + 32, b - 6.4, 3.4, { depth: 1.4, boxes: 2 });
      // Radiator and its fan grille, the exhaust stacks, an air-conditioning unit.
      s += rect(30, 13.05, 9, 0.6, "#8f969e", 0.4, 'rx="0.2"') + slats(30.4, 13.1, 8.2, 0.5, 0.3, "rgba(0,0,0,0.4)") +
        rect(40.0, 13.05, 0.45, 1.0, "#3a3f45") + rect(40.8, 13.05, 0.45, 1.0, "#3a3f45") + acUnit(8, 9, 13.1) + acUnit(L - 18, 9, 13.1);
    }
    return s;
  },
};
const d61Door = (x) => ({ x, w: 3.0, y0: 3.5, y1: 10.6, glassY: 0.5, glassH: 0.38, grabs: false });
const d61Rows = (a, n) => [{ xs: seq(a, 6.2, n), y: 7.0, w: 4.4, h: 3.0, r: 0.4 }];
const dmu61Car = drivingCar(D61, { rows: d61Rows(14.6, 9), doors: [d61Door(11.0), d61Door(73.0)] });
const dmu61Mid = middleCar(D61, { rows: d61Rows(7.4, 10), doors: [d61Door(2.0), d61Door(71.0)] });

// ===================== Locomotive-hauled trains =====================
// The Ekspres Rakyat Timuran and Shuttle Tebrau: diesel locomotives (Class
// 26, also Classes 24 and 25) with air-conditioned coaches. Drawn on the
// Class 26 (ADtranz/Bombardier DE-AC33C "Blue Tiger", 26101-26120,
// 2003-04): 23.7 m, Co-Co, a cab at each end and a narrower hood between
// them with walkways along it. KTMB's silver, a navy band along the middle
// edged in red and yellow, a dark gray frame; the cab ends striped alike.
function ktmLoco(c) {
  const L = c.L, sill = 4.4, cab = 9.4, roof = 13.6, hood = 12.4;
  const tA = L / 2 - 21.5, tB = L / 2 + 21.5;
  let s = truck(tA, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 }) + truck(tB, { wb: 12.4, d: 40, kind: "loco", top: sill, axles: 3 });
  // Fuel tank between the trucks, its gauge and filler; the main reservoirs
  // beside it; the frame, steps at each end and the end beams.
  s += path(poly([[L / 2 - 12, sill], [L / 2 + 12, sill], [L / 2 + 12, 2.4], ["q", L / 2 + 12, 1.6, L / 2 + 11.2, 1.6], [L / 2 - 11.2, 1.6], ["q", L / 2 - 12, 1.6, L / 2 - 12, 2.4]]), "#3d4249", 0.4);
  s += rect(L / 2 - 2, 2.4, 2.4, 0.9, "#7d848c", 0.3) + circle(L / 2 + 3, 3.0, 0.3, "#7d848c") + line(L / 2 - 11.6, 3.7, L / 2 + 11.6, 3.7, "rgba(255,255,255,0.18)", 0.5);
  for (const x of [L / 2 - 16.5, L / 2 + 13.0]) s += rect(x, 2.7, 3.5, 1.0, "#4a5057", 0.3, 'rx="0.5"');
  s += rect(0.4, 3.4, L - 0.8, sill - 3.4 + 0.95, "#3d4249", 0.4);
  for (const x of [1.4, L - 3.4]) s += lines([[x, 1.6, x, 3.4], [x + 2, 1.6, x + 2, 3.4], [x, 1.7, x + 2, 1.7], [x, 2.5, x + 2, 2.5]], "#3d4249", 0.8);
  // End beams with the coupler where nothing is coupled (consist.js draws
  // it where the next car is), headlights and marker lights on the beam.
  for (const [x, side, coupled] of [[0, -1, c.coupledL], [L, 1, c.coupledR]]) {
    if (!coupled) s += rect(side < 0 ? x : x - 2.4, 2.55, 2.4, 0.6, "#2a2d31") + rect(side < 0 ? x : x - 0.45, 2.25, 0.45, 1.2, "#2a2d31", 0, 'rx="0.12"');
  }
  const cabBox = (x0, x1, front) => poly(front < 0
    ? [[x0, sill + 0.95], [x1, sill + 0.95], [x1, roof], [x0 + 1.4, roof], ["q", x0 + 0.5, roof, x0 + 0.5, roof - 0.9], [x0 + 0.2, 9.4], [x0, sill + 0.95]]
    : [[x0, sill + 0.95], [x1, sill + 0.95], [x1 - 0.2, 9.4], [x1 - 0.5, roof - 0.9], ["q", x1 - 0.5, roof, x1 - 1.4, roof], [x0, roof]]);
  const hoodD = poly([[cab + 0.6, sill + 0.95], [L - cab - 0.6, sill + 0.95], [L - cab - 0.6, hood - 0.5], ["q", L - cab - 0.6, hood, L - cab - 1.1, hood], [cab + 1.1, hood], ["q", cab + 0.6, hood, cab + 0.6, hood - 0.5]]);
  // Paint, clipped to each body part: silver, the navy band edged in red
  // and yellow, a darker roof.
  const stripe = (top) => rect(0, 7.2, L, 1.5, KTM.navy) + rect(0, 8.75, L, 0.3, KTM.red) + rect(0, 6.85, L, 0.3, KTM.yellow) + rect(0, top - 0.5, L, 2, "#8f98a3");
  const clip = (d, inner) => { const id = newId(); return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
  s += path(hoodD, "#cdd2d7", 0.8) + clip(hoodD, stripe(hood) + rect(0, sill + 0.95, L, 0.4, "#9aa1a9"));
  // Hood doors and louvers: the radiator intakes at the back, the engine
  // room and inertial filter doors, the dynamic brake grille, the KTM mark.
  s += slats(L - cab - 13, 9.4, 10, 2.4, 0.35, "rgba(0,0,0,0.3)") + rect(L - cab - 13, 9.4, 10, 2.4, "none", 0.45) + slats(cab + 3, 9.4, 6, 2.4, 0.35, "rgba(0,0,0,0.3)") + rect(cab + 3, 9.4, 6, 2.4, "none", 0.45);
  for (const x of seq(cab + 10.5, 7.2, 5)) s += rect(x, sill + 1.6, 6.4, 4.6, "none", 0.45, 'rx="0.15"') + line(x + 5.6, sill + 3.4, x + 5.6, sill + 4.4, "currentColor", 0.6);
  s += ktmMark(c, L / 2, 10.6, 1.1, KTM.navy);
  // Roof: radiator fans at the back, the exhaust, the dynamic brake hatch.
  for (const x of [L - cab - 11.5, L - cab - 6.5]) s += path(`M${x - 2} ${hood}Q${x} ${hood + 0.7} ${x + 2} ${hood}Z`, C.steelDark, 0.4) + line(x - 1.4, hood + 0.25, x + 1.4, hood + 0.25, "rgba(0,0,0,0.35)", 0.4);
  s += rect(L / 2 - 2, hood - 0.05, 1.6, 0.8, "#3a3f45") + rect(cab + 3, hood - 0.05, 8, 0.35, C.steelDark, 0.4);
  // Walkway handrails along the hood.
  s += lines([[cab + 0.8, 8.4, L - cab - 0.8, 8.4], ...seq(cab + 1, 9.6, 6).map((x) => [x, sill + 1.0, x, 8.4])], "currentColor", 0.5);
  for (const [x0, x1, f] of [[0.4, cab + 0.6, -1], [L - cab - 0.6, L - 0.4, 1]]) {
    const d = cabBox(x0, x1, f), nose = f < 0 ? x0 : x1, k = -f;
    s += path(d, "#cdd2d7") + clip(d, stripe(roof));
    // Windshield, cab side window, door; headlights and marker lights; horns
    // on the cab roof; a number board.
    s += win(f < 0 ? x0 + 0.9 : x1 - 2.5, 9.7, 1.6, 2.6, 0.3) + win(f < 0 ? x0 + 4.4 : x1 - 7.6, 9.7, 3.2, 2.4, 0.3);
    s += door(f < 0 ? x0 + 3.5 : x1 - 5.7, sill + 1.2, 2.2, 7.4, { glassY: 0.62, glassH: 0.28, grabs: true });
    s += rect(nose + k * 0.15 - (k < 0 ? 0.6 : 0), 5.8, 0.6, 0.8, "#e9edf0", 0.3) + rect(nose + k * 0.15 - (k < 0 ? 0.6 : 0), 6.7, 0.6, 0.35, "#d8252d");
    s += horns(f < 0 ? x0 + 3.2 : x1 - 4.4, roof) + rect(f < 0 ? x0 + 1.0 : x1 - 2.6, roof - 0.8, 1.6, 0.55, "#1d1f22", 0, 'rx="0.1"');
    s += path(d, "none", 0.8);
  }
  return s;
}

// KTM's air-conditioned intercity coaches (second-class seats, first class
// and day-night sleepers on the overnight train): a vestibule at each end,
// a long row of windows. Silver like the locomotives, the navy band edged
// in red and yellow under the windows, a gray roof; an air-conditioning
// unit at each end of the roof, the generator and battery boxes under the
// floor.
const KTM_COACH = { roof: 12.8, sill: 3.6, cornerR: 1.0, end: 0.6, trucks: { centers: 46.0, wb: 7.5, d: 33 }, diaphragm: [3.9, 11.6], badge: false,
  doors: [{ x: 1.3, w: 2.4, y0: 3.7, y1: 10.6, glassY: 0.55, glassH: 0.3 }, { x: 63.5, w: 2.4, y0: 3.7, y1: 10.6, glassY: 0.55, glassH: 0.3 }],
  rows: [{ xs: seq(6.4, 5.1, 11), y: 7.1, w: 3.9, h: 2.7, r: 0.35 }], roofItems: [],
  paint: (c, g) => rect(0, 0, g.L, 18, KTM.silver) + rect(0, 12.1, g.L, 2, "#8f98a3") + rect(0, 0, g.L, 3.9, "#7c8189") +
    rect(0, 5.0, g.L, 1.35, KTM.navy) + rect(0, 6.4, g.L, 0.26, KTM.red) + rect(0, 4.7, g.L, 0.26, KTM.yellow) + rect(0, 6.95, g.L, 3.05, "#9aa1a9", 0, 'rx="0.3"'),
  extra: (c, g) => {
    const L = g.L, a = L / 2 - 23, b = L / 2 + 23;
    let s = bogieGear(a, 7.5, 3.6) + bogieGear(b, 7.5, 3.6) + doorTrim(KTM_COACH.doors, 3.6) + equipment(a + 6, b - 6, 3.6, { depth: 1.5, boxes: 4 });
    s += acUnit(5.5, 9, 12.8) + acUnit(L - 14.5, 9, 12.8) + rect(24, 12.75, 19, 0.25, C.steelDark, 0.4) + ktmMark(c, L / 2, 5.75, 0.85, "#f4f5f6");
    return s;
  },
};
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
