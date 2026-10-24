// The Netherlands' trains (scripts/railroads/nl.py): NS's Intercity and
// Sprinter trains (railroad "ns") and the international trains (railroad
// "nlintl"). Trainsheet's own side views, from published dimensions and
// recent photographs (Wikimedia Commons, 2024-2026), at the shared scale
// (js/carart.js), each in its railroad's current paint, lettered here (no
// logo files).

import { newId } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, truck, pantograph, slats, win, coupledEnd } from "../carart.js?v=dev";
import { roofCover, panGear, lamp, RED_LAMP, hvac } from "./digitraffic.cars.js?v=dev";
import { mark, euroLoco } from "./czechia.cars.js?v=dev";
// ÖBB's Nightjet cars, as drawn for Switzerland.
import { TYPES as CHI_TYPES, MODELS as CHI_MODELS } from "./chintl.cars.js?v=dev";
// DB's ICE 3 and Eurostar's trains (sncf.cars.js) and SNCB's I11 coaches
// (sncb.cars.js), drawn for France and Belgium: borrowed when those files
// are there (each is its own country's), the trains left typical-less if not.
const optional = (file) => import(file).catch(() => ({ TYPES: {}, MODELS: {}, FACTS: {} }));
const [SNCF, SNCB] = await Promise.all([optional("./sncf.cars.js?v=dev"), optional("./sncb.cars.js?v=dev")]);

const n = (v) => Math.round(v * 100) / 100;
const F = 3.2808; // feet in a metre
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// NS's own type (NS Sans) is a rounded grotesque; Frutiger-like fallbacks.
const NSF = "NS Sans, Frutiger, Myriad Pro, Segoe UI, Helvetica Neue, Arial, sans-serif";

// ---------- Shared parts ----------
const clip = (d, inner) => {
  const id = newId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
};
// Text in a mark() group (y down, centered at its origin).
const txt = (x, y, h, text, fill, { weight = 700, family = SANS, anchor = "middle", spacing = 0, style = "", extra = "" } = {}) =>
  `<text x="${n(x)}" y="${n(y + h * 0.36)}" font-size="${n(h)}" text-anchor="${anchor}" font-weight="${weight}" letter-spacing="${spacing}" font-family="${family}" fill="${fill}"${style ? ` font-style="${style}"` : ""}${extra ? " " + extra : ""}>${text}</text>`;
const letters = (c, x, y, h, text, fill, o) => mark(c, x, y, txt(0, 0, h, text, fill, o));
// The body's shading (as carmodels.js's bodies): darker low, a sheen high.
function shade(lo, hi) {
  const id = newId();
  const stop = (o, color, v, fb) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${fb}" style="stop-opacity:var(${v},${fb})"/>`;
  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${lo}" x2="0" y2="${hi}">` +
    stop(0, "#000", "--car-shade-low", 0.16) + '<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>' +
    stop(0.8, "#fff", "--car-shade-high", 0.1) + '<stop offset="0.93" stop-color="#fff" stop-opacity="0"/>' + stop(1, "#000", "--car-shade-roof", 0.08) +
    `</linearGradient></defs><rect x="-5" y="${lo}" width="400" height="${n(hi - lo)}" fill="url(#${id})"/>`;
}
// A body: outline points (poly() style), the base color, the paint clipped
// to it (shaded), the outline in the theme's ink.
function body(pts, base, paint, lo = 0, hi = 14) {
  const d = poly(pts);
  return path(d, base) + clip(d, paint + shade(lo, hi)) + path(d, "none", 0.8);
}
// The bellows between two cars of a unit, from floor to top; side -1 at the
// left end, 1 at the right.
function bellows(xFace, side, floor, top, fill = "#24272b") {
  const w = 0.75, x = side < 0 ? xFace : xFace - w;
  return rect(x, floor, w, top - floor, fill, 0, 'rx="0.2"') + lines([[x + 0.25, floor + 0.3, x + 0.25, top - 0.3], [x + 0.5, floor + 0.3, x + 0.5, top - 0.3]], "#3c4046", 0.6);
}
// A window with rounded corners, the glass dark with the sky's reflection.
const glass = (x0, x1, y0, y1, r = 0.45, frame = "#16191c") =>
  rect(x0 - 0.1, y0 - 0.1, x1 - x0 + 0.2, y1 - y0 + 0.2, frame, 0, `rx="${n(r + 0.08)}"`) +
  rect(x0, y0, x1 - x0, y1 - y0, C.glass, 0, `rx="${n(r)}"`) + rect(x0 + 0.15, y0 + (y1 - y0) * 0.62, x1 - x0 - 0.3, (y1 - y0) * 0.28, C.glassLight, 0, `rx="${n(Math.min(r, 0.2))}" opacity="0.8"`);
// A bicycle pictogram, h ft tall, centered at (x, y).
const bike = (x, y, h, color) => {
  const r = h * 0.28, s = `fill="none" stroke="${color}" stroke-width="${n(h * 0.08)}"`;
  return `<g transform="translate(${n(x)} ${n(y)})"><circle cx="${n(-h * 0.45)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${s}/><circle cx="${n(h * 0.45)}" cy="${n(-h * 0.2)}" r="${n(r)}" ${s}/>` +
    `<path d="M${n(-h * 0.45)} ${n(-h * 0.2)}L${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.3)} ${n(h * 0.25)}L${n(h * 0.45)} ${n(-h * 0.2)}M${n(-h * 0.1)} ${n(h * 0.25)}L${n(h * 0.05)} ${n(-h * 0.2)}L${n(h * 0.3)} ${n(h * 0.25)}" ${s}/></g>`;
};
// A wheelchair pictogram (the ISO symbol, simplified), h ft tall.
const chair = (x, y, h, color) => `<g transform="translate(${n(x)} ${n(y)})" fill="none" stroke="${color}" stroke-width="${n(h * 0.09)}">` +
  `<circle cx="${n(h * 0.02)}" cy="${n(-h * 0.18)}" r="${n(h * 0.28)}"/><path d="M${n(-h * 0.1)} ${n(h * 0.42)}L${n(-h * 0.1)} ${n(-h * 0.02)}L${n(h * 0.25)} ${n(-h * 0.02)}L${n(h * 0.34)} ${n(-h * 0.4)}"/>` +
  `<circle cx="${n(-h * 0.1)}" cy="${n(h * 0.52)}" r="${n(h * 0.05)}" fill="${color}"/></g>`;

// ---------- NS: colors and the logo ----------
// NS yellow and NS blue (the paint in photographs: ultramarine, a little
// violet beside the brand's #003082); the sills' dark gray.
const NS = { yellow: "#ffc917", blue: "#213a95", dark: "#3a3a39", roof: "#8f959b", roofDark: "#4a4e54", white: "#f4f5f5", logo: "#e9ebec", black: "#16181a" };
// The NS logo (Gerard Wiggers, 1968): one line drawn as two arrows, the
// upper pointing left, the lower right, joined by a diagonal; w the width
// tip to tip. Drawn as a stroke, which is how it is built; it reads the same
// way on both sides of a train (mark() keeps it from mirroring).
const NS_LOGO = "M-0.188 -0.158L-0.285 -0.158L-0.451 0L-0.285 0.158L-0.105 0.158Q-0.05 0.158 -0.022 0.112L0.098 -0.112Q0.126 -0.158 0.18 -0.158L0.295 -0.158L0.451 0L0.295 0.158L0.181 0.158";
const nsLogo = (c, x, y, w, color) => mark(c, x, y, `<path d="${NS_LOGO}" transform="scale(${n(w)} ${n(-w)})" fill="none" stroke="${color}" stroke-width="0.074" stroke-linejoin="miter" stroke-miterlimit="6"/>`);

// ===================== ICNG (Alstom Coradia Stream High Capacity) =====================
// NS's Intercity Nieuwe Generatie (2023-): eight cars (3201-3227, and the
// ICNG-B 3301-3321 for Belgium, the ICNG-D 3351-3362 for Germany) 164.9 m,
// or five (3101-3149) 110 m; 200 km/h. Each half of the eight-car unit is
// a cab car, two short cars and a long car, the cab car and short cars on
// shared (Jakobs) trucks, the long car on its own truck where the halves
// meet (nl.wikipedia "Intercity Nieuwe Generatie"; measured from Commons
// photographs of 3314, car by car, at Brussel-Zuid, April 2025): cab cars
// 23.2 m, short cars 18.6 m, long cars 22.1 m. One wide (1.6 m) single
// door a side a car, two on the long car nearer the cab; first class in the
// third and sixth cars. The five-car units have a cab car and a long car
// at each end and a short first-class car between.
// Two paints: the first (3101-3149, 3201-3227): yellow, the windows in a
// blue band, a broad blue band along the top of the side, a yellow strip
// between them with the destination display, a dark gray sill; the cab's
// windshield in black and the blue sweeping up behind the cab door into
// the band along the top; the small blue NS logo low on each car and on the
// nose; white class numerals by the windows. The ICNG-B and -D came in the
// "Flow" paint the older units get at overhaul: yellow, the roof's edge
// blue and a blue line low along the side, blue doors, the cab's top blue
// with a light-blue flash, and a big white NS logo over the windows of each
// car; blue class numerals; a thin blue line over first class's windows.
const IC = {
  roof: 13.05, low: 1.31, archTop: 2.6, wheel: 32,
  winTop: 8.85, tall: 5.12, short: 5.87, cabWin: 6.43,
  doorLo: 2.43, doorHi: 10.2, doorW: 5.35,
  // The first paint's bands; Flow's.
  bandLo: 4.72, bandHi: 9.15, upper: 10.45, roofLine: 12.3, skirt: 2.75,
  flowTop: 11.65, flowLine: [2.72, 3.58],
};
const M = (m) => n(m * F);
// Each car of an eight-car unit as photographed (3314, Brussel-Zuid), left
// to right with the cab at the left, in metres from the left end: windows
// [a, b, kind] (t tall, s short over a truck, c the cab's), doors [a, b,
// pictogram], class numerals [x], the first-class line [a, b], the big
// logo's left tip (Flow), the display, roof boxes [a, b, tall], the
// trucks: "j" shared at an end, "o" its own (m in from the end), "cab".
// A car laid out from its other end (a cab car with its cab at the right,
// drawn as the mirror image of one with its cab at the left).
const turned = (k) => {
  const f = (x) => n(k.len - x);
  const span = ([a, b, ...r]) => [f(b), f(a), ...r];
  return { ...k, cab: !!k.cab, wins: k.wins.map(span), doors: k.doors.map(span), nums: k.nums.map(f), first: k.first && span(k.first),
    logo: k.logo == null ? null : n(k.len - k.logo - 5.12), display: k.display && span(k.display), boxes: k.boxes.map(span), hatch: k.hatch && span(k.hatch),
    pan: k.pan == null ? null : f(k.pan), trucks: { left: k.trucks.right, right: k.trucks.left } };
};
const ICNG_CARS = {
  // 94 84 56 14 (car 1 of 3314): the cab car, cab at the left.
  c1: { len: 23.2, cab: true, cls: "2", wins: [[4.41, 6.19, "c"], [6.43, 7.86, "c"], [10.87, 12.64, "t"], [13.24, 15.0, "t"], [15.59, 17.31, "t"], [17.9, 19.63, "t"], [20.54, 22.47, "s"]],
    doors: [[8.54, 10.19, "bike"]], nums: [12.92, 20.09], logo: 3.28, display: [13.47, 14.73], boxes: [[2.6, 6.3, 0], [6.4, 9.0, 0], [11.9, 16.9, 1]], trucks: { right: "j" } },
  // 94 84 56 16: a short car, the wheelchair places by its door.
  c2: { len: 18.6, cls: "2", wins: [[0.79, 2.85, "s"], [9.04, 10.4, "t"], [10.98, 12.71, "t"], [13.32, 15.01, "t"], [15.96, 17.85, "s"]],
    doors: [[3.94, 5.59, "chair"]], hatch: [7.72, 8.5], nums: [6.07, 15.48], logo: 7.3, display: [9.1, 10.36], boxes: [[6.4, 10.1, 0]], pan: 16.6, panUp: true, trucks: { left: "j", right: "j" } },
  // 94 84 56 17: the short first-class car.
  c3: { len: 18.6, cls: "1", wins: [[0.82, 2.9, "s"], [6.29, 8.07, "t"], [8.62, 10.39, "t"], [10.99, 12.76, "t"], [13.32, 15.01, "t"], [15.95, 17.83, "s"]],
    doors: [[3.98, 5.61, ""]], nums: [8.33, 15.5], first: [6.4, 18.34], logo: 8.33, display: [8.9, 10.2], boxes: [[2.0, 4.1, 0], [6.4, 10.4, 0]], trucks: { left: "j", right: "j" } },
  // 94 84 56 18: the long car, its own truck at the right (the middle of
  // the unit), its first seats (at the left) first class.
  c4: { len: 22.1, cls: "2", wins: [[0.87, 2.9, "s"], [6.27, 8.03, "t"], [8.64, 10.4, "t"], [10.99, 12.75, "t"], [16.05, 18.0, "s"], [18.71, 20.67, "s"]],
    doors: [[3.98, 5.58, "bike"], [13.43, 15.03, ""]], nums: [8.34, 18.35], first: [0.26, 2.9], logo: 8.34, display: [8.87, 10.17], boxes: [[6.3, 11.4, 1], [11.5, 17.1, 1]], trucks: { left: "j", right: 4.1 } },
  // 94 84 56 19: the other long car, its own truck at the left.
  c5: { len: 22.1, cls: "2", wins: [[1.53, 3.53, "s"], [4.26, 6.27, "s"], [7.24, 9.01, "t"], [9.6, 11.36, "t"], [11.96, 13.72, "t"], [14.3, 16.06, "t"], [19.36, 21.35, "s"]],
    doors: [[16.75, 18.32, ""]], nums: [3.89, 14.11], first: [19.42, 21.84], logo: 9.09, display: [12.19, 13.5], boxes: [[5.3, 10.9, 1], [11.9, 17.2, 1]], trucks: { left: 3.72, right: "j" } },
  // 94 84 56 20: the other first-class car.
  c6: { len: 18.6, cls: "1", wins: [[0.82, 2.8, "s"], [3.75, 5.49, "t"], [6.11, 7.83, "t"], [8.43, 10.17, "t"], [10.77, 12.52, "t"], [15.83, 17.82, "s"]],
    doors: [[13.2, 14.79, ""]], nums: [3.29, 10.49], first: [0.26, 12.42], logo: 5.53, display: [8.63, 9.95], boxes: [[7.5, 11.3, 0], [13.2, 14.5, 0]], trucks: { left: "j", right: "j" } },
  // 94 84 56 21: the other short car, its pantograph (lowered) at the left.
  c7: { len: 18.6, cls: "2", wins: [[0.78, 2.69, "s"], [3.64, 5.36, "t"], [5.94, 7.67, "t"], [8.27, 10.03, "t"], [10.62, 12.38, "t"], [15.74, 17.76, "s"]],
    doors: [[13.07, 14.69, ""]], nums: [3.17, 10.43], logo: 5.52, display: [8.53, 9.82], boxes: [[6.2, 11.1, 0]], pan: 2.0, panUp: false, trucks: { left: "j", right: "j" } },
  // 94 84 56 15: the other cab car, cab at the right.
  c8: { len: 23.2, cab: "right", cls: "2", wins: [[0.9, 2.93, "s"], [3.89, 5.67, "t"], [6.25, 8.03, "t"], [8.62, 10.41, "t"], [10.99, 12.78, "t"], [15.75, 17.14, "c"], [17.72, 19.11, "c"]],
    doors: [[13.47, 15.08, "bike"]], nums: [3.42, 10.71], logo: 15.21, display: [8.89, 10.18], boxes: [[6.4, 10.0, 0], [10.3, 13.9, 0], [14.3, 17.9, 1], [18.3, 20.6, 0]], trucks: { left: "j" } },
};
// The five-car unit (110 m): a cab car and a long car at each end (their
// doors as the eight-car's), the short first-class car between on its own
// trucks.
ICNG_CARS.d2 = { ...ICNG_CARS.c4, first: null };
ICNG_CARS.d3 = { ...ICNG_CARS.c6, trucks: { left: 3.9, right: 3.9 }, boxes: [[7.5, 11.3, 0]] };
ICNG_CARS.d4 = turned(ICNG_CARS.d2);
// The cab's nose, from the tip at x = 0 (measured on 3314's): points from
// the roof down, in feet.
const ICNG_NOSE = [[8.4, IC.roof], ["q", 6.9, IC.roof, 6.0, 12.6], [3.6, 11.2], ["q", 1.0, 8.6, 0.45, 7.9], ["q", 0, 7.0, 0, 5.6], [0, 4.2], ["q", 0, 2.6, 1.0, 2.15], [6.2, 1.9]];
const mirror = (c, draw) => `<g transform="matrix(-1 0 0 1 ${n(c.L)} 0)">${draw({ ...c, mirrored: !c.mirrored, coupledL: c.coupledR, coupledR: c.coupledL })}</g>`;

function icngCar(c, key, paint) {
  const k0 = ICNG_CARS[key];
  if (k0.cab === "right") return mirror(c, (cc) => icngDraw(cc, turned(k0), paint));
  return icngDraw(c, k0, paint);
}
function icngDraw(c, k, paint) {
  const L = c.L, flow = paint === "flow", cab = k.cab ? "left" : null;
  const X = (m) => M(m) / M(k.len) * L;
  const truckAt = (pos, side) => (pos === "j" ? (side < 0 ? 0 : L) : side < 0 ? M(pos) : L - M(pos));
  // The outline: the bottom rises over each truck; the nose at the left.
  const arches = [];
  if (k.trucks.left != null) arches.push(truckAt(k.trucks.left, -1));
  if (k.trucks.right != null) arches.push(truckAt(k.trucks.right, 1));
  arches.sort((a, b) => a - b);
  const R = IC.roof, x0 = cab ? 6.2 : 0.3, x1 = L - 0.3;
  const bottom = cab ? [[6.6, 2.9], [26.5, 2.9], [26.9, IC.low]] : [];
  for (const x of arches) {
    const a = x - 5.4, b = x + 5.4;
    if (a <= x0) bottom.push([x0, IC.archTop], [b - 0.4, IC.archTop], [b, IC.low]);
    else if (b >= x1) bottom.push([a, IC.low], [a + 0.4, IC.archTop], [x1, IC.archTop]);
    else bottom.push([a, IC.low], [a + 0.4, IC.archTop], [b - 0.4, IC.archTop], [b, IC.low]);
  }
  const startsHigh = cab || (bottom.length && bottom[0][0] === x0), endsHigh = bottom.length && bottom[bottom.length - 1][0] === x1;
  const pts = [...(cab ? [ICNG_NOSE[ICNG_NOSE.length - 1]] : []), ...(startsHigh ? [] : [[x0, IC.low]]), ...bottom, ...(endsHigh ? [] : [[x1, IC.low]]),
    [x1, R - 0.5], ["q", x1, R, x1 - 0.5, R], ...(cab ? ICNG_NOSE.slice(0, -1) : [[0.8, R], ["q", 0.3, R, 0.3, R - 0.5]])];
  // The paint.
  const ws = k.wins.map(([a, b, t]) => [X(a), X(b), t]);
  let p = "";
  if (flow) {
    p += rect(-1, IC.flowTop, L + 2, 6, NS.blue) + rect(-1, IC.flowLine[0], L + 2, IC.flowLine[1] - IC.flowLine[0], NS.blue) + rect(-1, 0, L + 2, IC.flowLine[0], NS.dark);
    if (cab) p += flowCab(c, L);
    // The big logo over the windows (under the glass).
    p += flowLogo(c, X(k.logo) + M(2.56), 7.2, M(5.12));
  } else {
    // The window band, the strip with the display, the band along the top.
    const lo = (t) => (t === "t" ? IC.tall : t === "s" ? IC.short : IC.cabWin) - 0.4;
    p += rect(-1, IC.upper, L + 2, 6, NS.blue) + rect(-1, IC.bandLo, L + 2, IC.bandHi - IC.bandLo, NS.blue) + rect(-1, 0, L + 2, IC.skirt, NS.dark);
    // Over the short windows the band's lower edge follows them up.
    p += rect(-1, IC.skirt, L + 2, IC.bandLo - IC.skirt, NS.yellow);
    void lo;
    if (cab) p += stdCab(c, L);
    p += line(-1, IC.roof - 0.35, L + 2, IC.roof - 0.35, "rgba(0,0,0,0.25)", 0.5);
  }
  // Roof above the side (the first paint's gray roof).
  if (!flow) p += rect(-1, IC.roofLine, L + 2, 2, NS.roof);
  // First class's line over the windows.
  if (k.first) p += rect(X(k.first[0]), (flow ? IC.winTop : IC.bandHi) + 0.28, X(k.first[1]) - X(k.first[0]), 0.16, flow ? NS.blue : NS.blue);
  if (k.first && !flow) p += rect(X(k.first[0]), IC.bandHi, X(k.first[1]) - X(k.first[0]), 0.28, NS.yellow);
  // Windows.
  for (const [a, b, t] of ws) p += glass(a, b, t === "t" ? IC.tall : t === "s" ? IC.short : IC.cabWin, IC.winTop, 0.5);
  // The hatch outline (c2).
  if (k.hatch) p += rect(X(k.hatch[0]), 3.0, X(k.hatch[1]) - X(k.hatch[0]), 7.0, "none", 0, 'rx="0.2" stroke="#16191c" stroke-width="0.12"');
  // Doors.
  for (const [a, b, pict] of k.doors) {
    const x0 = X(a), w = X(b) - X(a);
    p += rect(x0, IC.doorLo, w, IC.doorHi - IC.doorLo, flow ? NS.blue : NS.yellow, 0, 'rx="0.3" stroke="rgba(0,0,0,0.45)" stroke-width="0.12"');
    p += glass(x0 + (w - 2.55) / 2, x0 + (w + 2.55) / 2, 5.52, 9.07, 0.35);
    const ink = flow ? "#ffffff" : NS.blue;
    if (pict === "bike") p += bike(x0 + w / 2, 3.9, 0.9, ink);
    if (pict === "chair") p += chair(x0 + w / 2, 3.9, 0.85, ink);
    // The step below.
    p += rect(x0 + 0.2, IC.doorLo - 0.5, w - 0.4, 0.3, "#2a2d31");
  }
  // The display over the windows.
  if (k.display) p += rect(X(k.display[0]), 9.45, X(k.display[1]) - X(k.display[0]), 0.62, "#121416", 0, 'rx="0.1"') + rect(X(k.display[0]) + 0.3, 9.63, X(k.display[1]) - X(k.display[0]) - 0.6, 0.26, "#f08a2a", 0, 'opacity="0.85"');
  // Class numerals.
  for (const x of k.nums) p += letters(c, X(x), 8.2, 1.2, k.cls, flow ? NS.blue : "#ffffff", { weight: 700, family: NSF });
  // The first paint's small NS logo, low on each car (on the nose too).
  if (!flow) {
    const lx = cab ? X(k.len - 6.4) : X(k.len / 2);
    p += nsLogo(c, lx, 3.75, 1.5, NS.blue);
  }
  let s = body(pts, NS.yellow, p, 0.9, R);
  // Trucks.
  const tk = [];
  if (k.trucks.left != null) tk.push([truckAt(k.trucks.left, -1), k.trucks.left === "j" ? 8.5 : 8.2]);
  if (k.trucks.right != null) tk.push([truckAt(k.trucks.right, 1), k.trucks.right === "j" ? 8.5 : 8.2]);
  if (cab) tk.push([15.8, 7.4]);
  s = tk.map(([x, wb]) => truck(x, { wb, d: IC.wheel, top: IC.archTop })).join("") + s;
  // Roof: equipment boxes, the pantograph.
  for (const [a, b, tall] of k.boxes) s += roofCover(X(a), R, X(b) - X(a), tall ? 1.2 : 0.8, tall ? "#80868d" : NS.roofDark, 2);
  if (k.pan != null) s += pantograph(X(k.pan), R + 0.15, { up: k.panUp && c.wires !== false, facing: -1 }) + panGear(X(k.pan), R + 0.15, k.pan > k.len / 2 ? -1 : 1);
  // Cab details.
  if (cab) s += icngCabDetails(c, flow);
  // Bellows to the next car.
  if (c.coupledL && !cab) s += bellows(0, -1, 2.8, R - 0.6);
  if (c.coupledR) s += bellows(L, 1, 2.8, R - 0.6);
  return s;
}
// The first paint's cab (3114, 3120, 3138, 3219 in photographs): the
// windshield and cab side window in black down to the nose's shoulder,
// back to the cab door; the window band's lower edge sweeping up ahead of
// the first window to over the cab door, its upper edge rising to meet the
// band along the top, so the cab door stands under blue.
function stdCab(c, L) {
  return path(`M-1 0L17.0 0L17.0 ${IC.bandLo}Q12.2 ${IC.bandLo} 10.6 9.35L-1 9.6Z`, NS.yellow) +
    path(`M7.0 9.6L10.6 9.35Q12.2 ${IC.bandLo} 17.0 ${IC.bandLo}L17.0 ${IC.bandHi}L24.8 ${IC.bandHi}Q22.0 ${IC.upper} 19.0 ${IC.upper}L7.0 ${IC.upper}Z`, NS.blue) +
    // The yellow cap over the windshield, the black round it.
    rect(-1, 9.6, 8.2, 6, NS.yellow) + path(`M-1 7.7L2.0 7.85Q4.8 7.95 7.2 7.85L7.2 11.9Q5.5 12.4 4.6 12.7L-1 12.7Z`, NS.black) +
    nsLogo(c, 4.6, 5.9, 3.4, NS.blue);
}
// Flow's cab (3314 at Brussel-Zuid, 2025): blue over the top, its lower
// edge level along the nose's shoulder, then curving up behind the cab door
// into the roof's blue edge; a light-blue flash in it.
function flowCab(c, L) {
  return path(`M-1 7.65L11.4 8.05C14.5 8.2 16.5 10.9 20.5 ${IC.flowTop}L30 ${IC.flowTop}L30 14L-1 14Z`, NS.blue) +
    path(`M11.6 7.95L14.2 10.25L17.3 10.25L13.0 7.95Z`, "#4f8fd8") +
    // Under the cab the yellow runs down to the sill; the blue line low
    // along the side begins behind the cab door, tapering in.
    path(`M-1 0L18 0L18 ${IC.flowLine[1]}Q20.5 ${IC.flowLine[0] + 0.3} 23 ${IC.flowLine[0]}L23 -1L-1 -1Z`, NS.yellow) + rect(-1, 0, 25, 2.0, NS.dark);
}
// The big logo of Flow (5.12 m tip to tip over two windows), x its middle.
const flowLogo = (c, x, y, w) => nsLogo(c, x, y, w, NS.logo);
// The cab's glass, lamps, coupler and the cab door.
function icngCabDetails(c, flow) {
  // The windshield's edge along the slope, the cab's side window.
  let s = path(poly([[0.55, 7.95], [3.55, 11.15], [6.0, 12.55], [6.45, 12.3], [4.2, 11.0], [1.4, 8.1]]), "#1d2024") +
    path(poly([[3.3, 9.05], [5.75, 11.45], [6.45, 11.05], [6.45, 9.1]]), C.glass);
  // The headlamp in its dark pod at the nose's shoulder; the intake below.
  s += path(`M0.08 6.6Q0.15 7.45 1.0 7.45L1.45 7.2Q1.5 6.4 0.9 6.35Z`, "#1a1c1f") + lamp(0.35, 6.65, 0.6, 0.5);
  s += rect(1.6, 4.6, 1.9, 1.05, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.35)" stroke-width="0.1"');
  // The crew door behind the cab, its window and handles.
  s += rect(7.35, 4.1, 2.75, 6.2, "none", 0, 'rx="0.3" stroke="#16191c" stroke-width="0.14"') + glass(8.2, 9.2, 8.45, 9.8, 0.2) +
    line(7.15, 4.6, 7.15, 9.8, "#3a3d42", 0.9) + line(10.3, 4.6, 10.3, 9.8, "#3a3d42", 0.9);
  // The coupler (Scharfenberg) in its opening low in the nose.
  s += rect(-0.1, 2.4, 1.2, 1.3, "#1b1d20", 0, 'rx="0.25"');
  // The light cluster on the roof's front edge.
  s += rect(6.6, IC.roof - 0.05, 2.0, 0.45, "#2a2d31", 0, 'rx="0.2"');
  return s;
}

// ===================== VIRM (double-deck Intercity) =====================
// NS's VIRM (Talbot / Bombardier, 1994-2009; "verlengd interregiomaterieel"):
// four-car (9401-9481, 9501-9525, 9547-9597) and six-car (8601-8681,
// 8701-8746) units, every car double-deck between a single-level entrance
// over each truck. Cars (nl.wikipedia "DD-IRM"): mBvk cab cars 27.26 m,
// ABv 26.46 m (ABv6 27.46 m), mBv7 26.96 m; four cars mBvk1 + ABv6 + ABv3 +
// mBvk2, six cars mBvk1 + ABv5 + mBv7 + ABv6 + ABv4 + mBvk2. A double door
// over each truck at each end of a car, a small window beyond it; seven
// to nine windows upstairs, smaller, and as many larger ones downstairs.
// Two paints in 2026: the VIRMm1 refit (2016-2020, 81 units): yellow, the
// upper deck's windows in a rounded blue band, the lower deck's in a deeper
// one that widens round each entrance, framing the door in blue; the NS
// logo in blue between the bands; the cab's top dark gray, the nose yellow.
// And Flow (the VIRMm2/3 refit, 2021-2023, and the VIRM-4 being done since):
// yellow, the cab's top blue, the roof's edge and a band low along the side
// blue, a big white NS logo on each car, blue doors. (Photographs: 9418 at
// Baexem and Hillegom, 8656 at 's-Hertogenbosch 2026; 8713 at Geldermalsen
// 2025, 8734 at Putten 2026, 9510 at Bathmen 2026.)
const VR = {
  roof: 15.1, low: 1.25, arch: 3.0, wheel: 36,
  up: [12.5, 13.95], upBand: [11.9, 14.4], lowWin: [4.3, 7.35], lowBand: [3.55, 9.35],
  doorLo: 3.4, doorHi: 10.3, DW: 4.6, balWin: [6.6, 9.5], grey: "#4b5157",
};
// A car: len (ft), cab (at the left), doors (left edges), balcony windows
// [a, b], the double-deck section [a, b] with its windows up [n] and down
// [n] (and a technical locker's place at the left), trucks (centers),
// first class [a, b], numerals, the pantograph.
function virmLayout(len, { cab = false, first = null, pan = null, nose = "virm" } = {}) {
  const t = 9.2;                      // trucks 2.8 m in from the ends
  const ddz = nose === "ddz";
  const bogies = cab ? [ddz ? 10.0 : 19.5, len - t] : [t, len - t];
  const doors = cab ? [ddz ? 7.0 : 17.2, len - t - VR.DW / 2] : [t - VR.DW / 2, len - t - VR.DW / 2];
  const balWins = cab ? [[len - 4.6, len - 1.6]] : [[1.6, 4.6], [len - 4.6, len - 1.6]];
  const deck = cab ? [ddz ? 14.6 : 24.4, len - 13.2] : [13.2, len - 13.2];
  return { len, cab, bogies, doors, balWins, deck, first, pan, nose, locker: cab && !ddz };
}
// Windows along the deck: n of width w, evenly spaced in [a, b].
const row = (a, b, nWin, w) => {
  const gap = (b - a - nWin * w) / (nWin + 1);
  return Array.from({ length: nWin }, (_, i) => a + gap + i * (w + gap));
};
const VIRM_NOSE0 = [[11.6, VR.roof], ["q", 9.6, VR.roof, 8.7, 14.6], [3.3, 10.5], ["q", 1.0, 9.7, 0.6, 8.4], [0.25, 5.2], ["q", 0, 2.7, 0.9, 1.9], [8.6, 1.7]];
function virmCar(c, k, paint) {
  const L = c.L, flow = paint === "flow", R = VR.roof, ddz = k.nose === "ddz";
  const VIRM_NOSE = ddz ? DDZ_NOSE : VIRM_NOSE0;
  // The outline: low between the trucks, up over them; the nose at a cab.
  const x0 = k.cab ? (ddz ? 1.2 : 8.6) : 0.3, x1 = L - 0.3;
  const over = (x) => [[x - 5.6, VR.low], [x - 4.6, VR.arch], [x + 4.6, VR.arch], [x + 5.6, VR.low]];
  const b0 = k.bogies[0], b1 = k.bogies[1];
  const pts = [...(k.cab ? [VIRM_NOSE[VIRM_NOSE.length - 1], [b0 - 4.6, 1.7], [b0 + 4.6, VR.arch], [b0 + 5.6, VR.low]] : [[x0, VR.arch], [b0 + 4.6, VR.arch], [b0 + 5.6, VR.low]]),
    [b1 - 5.6, VR.low], [b1 - 4.6, VR.arch], [x1, VR.arch], [x1, R - 1.2], ["q", x1, R, x1 - 1.2, R],
    ...(k.cab ? VIRM_NOSE.slice(0, -1) : [[x0 + 1.2, R], ["q", x0, R, x0, R - 1.2]])];
  void over;
  const [da, db] = k.deck;
  const upX = row(da + 0.6, db - 0.6, k.cab ? 7 : 9, 4.0), lowX = row(da + (k.locker ? 6.0 : 0.6), db - 0.6, k.cab ? 6 : 8, 4.3);
  let p = "";
  // The roof gray above the side.
  p += rect(-1, 14.75, L + 2, 3, NS.roof);
  if (flow) {
    p += rect(-1, 14.45, L + 2, 3, NS.blue) + rect(-1, 0, L + 2, 3.55, NS.blue);
    // The big logo over both decks.
    p += nsLogo(c, k.cab ? da + 16.5 : (da + db) / 2, 8.9, 25.0, NS.logo);
  } else {
    // The bands: upstairs round the windows; downstairs, widening round
    // each entrance into the door's frame.
    p += rect(da + 0.1, VR.upBand[0], db - da - 0.2, VR.upBand[1] - VR.upBand[0], NS.blue, 0, 'rx="1.0"');
    p += rect(da - 0.2, VR.lowBand[0], db - da + 0.4, VR.lowBand[1] - VR.lowBand[0], NS.blue);
    for (const d of k.doors) {
      const a = d - 0.75, b = d + VR.DW + 0.75, inner = d < L / 2 ? 1 : -1;
      p += rect(a, VR.doorLo - 0.55, b - a, VR.doorHi + 0.75 - (VR.doorLo - 0.55), NS.blue, 0, 'rx="0.9"');
      // The S-curves joining the frame to the band toward the deck.
      const e = inner > 0 ? b - 0.5 : a + 0.5, f = e + inner * 6.0;
      p += path(`M${n(e)} ${n(VR.doorHi + 0.75)}C${n(e + inner * 2.8)} ${n(VR.doorHi + 0.75)} ${n(f - inner * 2.6)} ${VR.lowBand[1]} ${n(f)} ${VR.lowBand[1]}L${n(f)} ${VR.lowBand[0]}` +
        `C${n(f - inner * 2.6)} ${VR.lowBand[0]} ${n(e + inner * 2.8)} ${n(VR.doorLo - 0.55)} ${n(e)} ${n(VR.doorLo - 0.55)}Z`, NS.blue);
    }
    for (const [a, b] of k.balWins) p += rect(a - 0.55, VR.balWin[0] - 0.55, b - a + 1.1, VR.balWin[1] - VR.balWin[0] + 1.1, NS.blue, 0, 'rx="0.7"');
    p += nsLogo(c, k.cab ? da + 16 : da + 9, 10.6, 2.7, NS.blue);
  }
  // First class: a thin blue line under the upper band.
  if (k.first) p += rect(k.first[0], VR.upBand[0] - 0.42, k.first[1] - k.first[0], 0.18, NS.blue);
  // The cab: its top dark gray (VIRMm1) or blue (Flow) down to the nose's
  // shoulder and back over the cab door; Flow's blue runs down behind the
  // first entrance.
  if (k.cab && ddz) p += path(`M-1 8.4L6.2 8.4L6.2 11.0L10.0 11.0L10.0 16L-1 16Z`, NS.blue);
  if (k.cab && !ddz) {
    p += path(`M-1 9.3L3.4 10.4L12.6 11.0Q19 11.4 23.5 12.6L23.5 16L-1 16Z`, flow ? NS.blue : VR.grey);
    // Flow: the blue down to the band at the sill behind the first entrance,
    // its edge slanting back as it rises, a light-blue flash along it.
    if (flow) p += path(`M-1 8.9L15.4 9.3L15.4 3.0L22.0 3.0L28.0 16L-1 16Z`, NS.blue) + path(`M22.0 3.3L24.4 3.3L30.4 14.5L28.0 16Z`, "#4f8fd8");
  }
  // Windows.
  for (const x of upX) p += glass(x, x + 4.0, VR.up[0], VR.up[1], 0.55);
  for (const x of lowX) p += glass(x, x + 4.3, VR.lowWin[0], VR.lowWin[1], 0.55);
  if (k.locker) p += rect(da + 0.6, VR.lowWin[0] - 0.3, 4.8, VR.lowWin[1] - VR.lowWin[0] + 0.6, "none", 0, 'rx="0.3" stroke="rgba(0,0,0,0.35)" stroke-width="0.1"') +
    line(da + 3.0, VR.lowWin[0] - 0.2, da + 3.0, VR.lowWin[1] + 0.2, "rgba(0,0,0,0.35)", 0.5);
  // The small window up the stairs at a cab car's first entrance.
  if (k.cab && !ddz) p += glass(da - 2.6, da - 0.8, 12.6, 13.9, 0.35);
  for (const [a, b] of k.balWins) p += glass(a, b, VR.balWin[0], VR.balWin[1], 0.45);
  // Doors: two leaves, a tall window in each.
  k.doors.forEach((d, i) => {
    const fill = flow && !(k.cab && i === 0) ? NS.blue : NS.yellow;
    p += rect(d, VR.doorLo, VR.DW, VR.doorHi - VR.doorLo, fill, 0, 'rx="0.25" stroke="rgba(0,0,0,0.5)" stroke-width="0.1"') + line(d + VR.DW / 2, VR.doorLo + 0.1, d + VR.DW / 2, VR.doorHi - 0.1, "rgba(0,0,0,0.5)", 0.6);
    for (const lx of [d + 0.55, d + VR.DW / 2 + 0.55]) p += glass(lx, lx + 1.1, 6.7, 9.05, 0.5);
  });
  // Class numerals, white in the bands (Flow: blue beside the windows).
  const nums = [[upX[1] + 4.6, 13.2], [upX[upX.length - 2] + 4.6, 13.2], [lowX[0] - 0.7, 6.4], [lowX[lowX.length - 2] + 4.95, 6.4]];
  for (const [x, y] of nums) {
    const cls = k.first && x > k.first[0] && x < k.first[1] ? "1" : "2";
    p += letters(c, x, y, 1.0, cls, flow ? NS.blue : "#ffffff", { weight: 700, family: NSF });
  }
  let s = body(pts, NS.yellow, p, 1.2, R);
  s = k.bogies.map((x) => truck(x, { wb: 8.2, d: VR.wheel, top: VR.arch })).join("") + s;
  // The cab: windshield, lamps, the crew door, coupler.
  if (k.cab && ddz) s += ddzCab(c);
  if (k.cab && !ddz) {
    s += path(poly([[1.2, 10.2], [3.6, 11.4], [8.2, 14.2], [9.3, 14.2], [9.3, 10.9], [3.6, 10.6]]), "#1d2024") + path(poly([[3.9, 10.95], [8.3, 13.9], [9.0, 13.9], [9.0, 11.05]]), C.glass);
    s += lamp(0.35, 6.0, 0.6, 0.5) + rect(0.2, 5.1, 0.5, 0.45, RED_LAMP, 0, 'rx="0.1"') + lamp(0.6, 9.1, 0.5, 0.42);
    s += rect(12.6, VR.doorLo + 0.2, 2.4, 6.8, "none", 0, 'rx="0.3" stroke="#16191c" stroke-width="0.14"') + glass(13.2, 14.4, 7.4, 9.6, 0.4) +
      line(12.35, 4.2, 12.35, 9.4, "#3a3d42", 0.9) + line(15.25, 4.2, 15.25, 9.4, "#3a3d42", 0.9);
    if (!c.coupledL) s += rect(-0.1, 2.5, 1.0, 1.3, "#1b1d20", 0, 'rx="0.25"');
    s += roofCover(9.0, R - 0.05, 7.5, 0.45, "#3d4247", 3);
  }
  if (k.pan != null) s += pantograph(k.pan, R + 0.1, { up: c.wires !== false, facing: k.pan < L / 2 ? 1 : -1 }) + panGear(k.pan, R + 0.1, k.pan < L / 2 ? 1 : -1);
  if (c.coupledL && !k.cab) s += bellows(0, -1, 3.6, R - 1.0);
  if (c.coupledR) s += bellows(L, 1, 3.6, R - 1.0);
  return s;
}
// ===================== DDZ (double-deck, refitted DD-AR) =====================
// NS's DDZ (1985-1992 double-deckers, refitted with new power cars and
// cab cars as "Dubbeldekker Zonering" 2011-2013; nl.wikipedia "Dubbeldekker
// Zonering"): 7501-7550 four cars (101.08 m) ABvk + Bv + ABv + mBk, 7601-
// 7621 six (153.88 m) with a Bv and an ABv more; Intercity 1700, 2800 and
// 3600 in 2026, until the new double-deckers come (2027). Coaches 26.4 m,
// the cab car 26.9 m, the power car about 21 m. The VIRMm1's paint on its
// body, upright cabs with their tops blue; the power car has one row of
// windows high in a blue band and plain yellow below (photographs: 7502 at
// Amsterdam, 7616 at Ellecom 2026, 7612 at Brummen 2026).
const DDZ_NOSE = [[3.4, VR.roof], ["q", 1.6, VR.roof, 1.4, 14.2], [1.25, 8.6], [1.2, 3.6], ["q", 1.2, 2.2, 2.0, 1.9], [8.6, 1.8]];
function ddzCab(c) {
  let s = path(poly([[1.35, 9.2], [1.35, 12.9], [2.5, 12.9], [2.5, 9.2]]), C.glass) + rect(1.25, 6.0, 0.4, 0.55, RED_LAMP, 0, 'rx="0.1"') + lamp(1.3, 6.6, 0.45, 0.45);
  s += rect(1.2, 2.6, 1.4, 1.6, "#24272b", 0, 'rx="0.2"') + rect(-0.1, 2.7, 1.4, 1.0, "#1b1d20", 0, 'rx="0.2"');
  return s;
}
// The power car (mBk): a cab, a crew door, one row of windows upstairs.
function ddzPower(c) {
  const L = c.L, R = VR.roof;
  const pts = [DDZ_NOSE[DDZ_NOSE.length - 1], [L - 0.3, 1.8], [L - 0.3, R - 1.2], ["q", L - 0.3, R, L - 1.5, R], ...DDZ_NOSE.slice(0, -1)];
  let p = rect(-1, 14.75, L + 2, 3, NS.roof) + path(`M-1 8.4L6.2 8.4L6.2 11.0L10.0 11.0L10.0 16L-1 16Z`, NS.blue);
  p += rect(13.0, 9.6, L - 21.5, 3.4, NS.blue, 0, 'rx="0.8"');
  for (const x of row(13.2, L - 8.7, 8, 3.6)) p += glass(x, x + 3.6, 10.1, 12.5, 0.5);
  p += nsLogo(c, 30, 7.6, 2.7, NS.blue);
  // Grilles low along the machinery, the crew doors.
  for (const x of [16, 27, 38, 49]) p += rect(x, 4.6, 7.5, 2.2, "rgba(0,0,0,0.12)", 0, 'rx="0.2"') + slats(x, 4.6, 7.5, 2.2, 0.35, "rgba(0,0,0,0.25)");
  for (const x of [8.0, L - 6.5]) p += rect(x, 3.2, 2.4, 9.0, "none", 0, 'rx="0.3" stroke="#16191c" stroke-width="0.14"') + glass(x + 0.5, x + 1.9, 9.6, 11.6, 0.3);
  let s = body(pts, NS.yellow, p, 1.8, R);
  s = [10.5, L - 10.5].map((x) => truck(x, { wb: 9.2, d: 40, kind: "loco", top: 1.8 })).join("") + s + ddzCab(c);
  s += pantograph(L - 22, R + 0.1, { up: c.wires !== false, facing: -1 }) + panGear(L - 22, R + 0.1, -1) + roofCover(22, R - 0.05, 18, 0.6, "#80868d", 3);
  if (c.coupledR) s += bellows(L, 1, 3.6, R - 1.0);
  return s;
}
// The cars, by NS's names (lengths in feet).
const VIRM_CARS = {
  mBvk: virmLayout(M(27.26), { cab: true }),
  ABv3: virmLayout(M(26.46), { first: [M(13.23), M(26.46) - 13.2], pan: M(26.46) - 6.0 }),
  ABv4: virmLayout(M(26.46), { first: [M(13.23), M(26.46) - 13.2] }),
  ABv5: virmLayout(M(26.46), { first: [13.2, M(13.23)], pan: 6.0 }),
  ABv6: virmLayout(M(27.46), { first: [13.2, M(13.73)], pan: 6.0 }),
  mBv7: virmLayout(M(26.96)),
};

const DDZ_CARS = {
  ABvk: virmLayout(M(26.9), { cab: true, nose: "ddz", first: [14.6, 40] }),
  Bv: virmLayout(M(26.4)),
  ABv: virmLayout(M(26.4), { first: [13.2, M(13.2)] }),
};

// ===================== Single-deck units: ICMm, SLT, SNG, FLIRT =====================
// One builder: a car's outline (a cab at the left, or none), its trucks
// (own, or Jakobs shared at an end: "j"), windows, doors, and the paint.
// Positions in metres from the car's left end, as photographed.
// ICMm (Koploper, 1977-1994, refitted 2006-2011; 3-car 40xx 80.6 m, 4-car
// 42xx 107.1 m; still on the Intercitys north and east, to retire by 2030):
// yellow, the windows in one blue band rounded at its front end behind the
// cab, the roof and the high cab's top dark gray, a dark gray sill; yellow
// double doors near each end of each car, the NS logo in blue low.
// (Photographs: 4210 at Weesp and 4211 at Amersfoort, 2026.)
// The Sprinters (SLT 2401-2469, 2601-2662, 69.36/100.54 m; SNG 2301-2368,
// 3001-3050, 2701-2788, 59.56/75.76 m; FLIRT 2201-2233, 2501-2525): white,
// the windows in a blue band, a white line over it under the gray roof, a
// yellow line low over the dark gray sill, yellow doors; the SNG's cab top
// yellow since 2021-2022, the FLIRT's yellow, the SLT's white with blue
// sweeping down to its nose. All on Jakobs trucks. (Photographs: SLT 2651 at
// Weesp 2026, SNG 3050 at Sassenheim 2026, FLIRT 2503 at Tilburg 2026.)
const SP = {
  icm: { roof: 13.1, low: 2.9, arch: 3.6, wheel: 36, win: [6.3, 9.55], band: [5.6, 10.3], door: [3.6, 10.6], skirt: 3.4, base: NS.yellow, bandFill: NS.blue },
  slt: { roof: 12.55, low: 1.4, arch: 2.7, wheel: 30, win: [4.6, 8.6], band: [4.0, 9.4], white: 10.4, yline: [1.9, 2.25], door: [1.65, 9.2], skirt: 1.75, base: NS.white, bandFill: NS.blue },
  sng: { roof: 12.75, low: 1.4, arch: 2.7, wheel: 30, win: [4.55, 8.75], band: [3.75, 10.1], white: 11.05, yline: [1.9, 2.25], door: [1.65, 9.45], skirt: 1.75, base: NS.white, bandFill: NS.blue },
  flirt: { roof: 13.4, low: 1.5, arch: 2.8, wheel: 30, win: [4.8, 9.0], band: [4.1, 10.6], white: 11.6, yline: [2.0, 2.35], door: [1.8, 9.8], skirt: 1.85, base: NS.white, bandFill: NS.blue },
};
const SP_NOSE = {
  icm: (R) => [[10.2, R], ["q", 8.6, R, 8.2, 12.2], [7.0, 11.8], [5.0, 11.4], ["q", 1.6, 11.2, 1.1, 9.8], [0.6, 4.2], ["q", 0.4, 2.6, 1.6, 2.3], [7.2, 2.3]],
  slt: (R) => [[7.6, R], ["q", 5.6, R, 4.6, 11.4], [2.3, 8.6], ["q", 1.0, 7.1, 0.7, 5.2], [0.55, 2.9], ["q", 0.6, 1.6, 1.8, 1.4], [5.4, 1.4]],
  sng: (R) => [[8.4, R], ["q", 6.6, R, 5.6, 11.8], [2.6, 8.4], ["q", 1.1, 7.0, 0.8, 5.4], [0.6, 2.9], ["q", 0.6, 1.6, 1.8, 1.4], [5.6, 1.4]],
  flirt: (R) => [[7.2, R], ["q", 5.2, R, 4.4, 12.4], [2.4, 9.4], ["q", 1.2, 7.8, 0.9, 6.4], [0.6, 3.2], ["q", 0.6, 1.8, 1.8, 1.5], [5.6, 1.5]],
};
function spCar(c, type, k) {
  const L = c.L, S = SP[type], R = S.roof, X = (m) => M(m) / M(k.len) * L;
  const cab = !!k.cab, nose = cab ? SP_NOSE[type](R) : null;
  const tx = k.trucks.map((t) => (t === "j0" ? 0 : t === "j1" ? L : X(t)));
  const x0 = cab ? nose[nose.length - 1][0] : 0.3, x1 = L - 0.3;
  const bot = [];
  for (const x of [...tx].sort((a, b) => a - b)) {
    const a = x - 5.0, b = x + 5.0;
    if (a <= x0) bot.push([x0, S.arch], [b - 0.4, S.arch], [b, S.low]);
    else if (b >= x1) bot.push([a, S.low], [a + 0.4, S.arch], [x1, S.arch]);
    else bot.push([a, S.low], [a + 0.4, S.arch], [b - 0.4, S.arch], [b, S.low]);
  }
  const hi0 = bot.length && bot[0][0] === x0, hi1 = bot.length && bot[bot.length - 1][0] === x1;
  const pts = [...(cab ? [nose[nose.length - 1]] : []), ...(hi0 ? [] : [[x0, S.low]]), ...bot, ...(hi1 ? [] : [[x1, S.low]]),
    [x1, R - 0.6], ["q", x1, R, x1 - 0.6, R], ...(cab ? nose.slice(0, -1) : [[0.9, R], ["q", 0.3, R, 0.3, R - 0.6]])];
  let p = "";
  if (type === "icm") {
    p += rect(-1, 11.55, L + 2, 4, NS.roofDark) + rect(-1, 0, L + 2, S.skirt, NS.dark);
    const a = cab ? X(6.4) : -1;
    p += rect(a, S.band[0], L + 1 - a, S.band[1] - S.band[0], NS.blue, 0, cab ? `rx="${n((S.band[1] - S.band[0]) / 2)}"` : "");
    if (cab) p += rect(a + 3, S.band[0], L, S.band[1] - S.band[0], NS.blue) + path(`M-1 11.0L8.2 11.55L8.2 16L-1 16Z`, NS.roofDark);
  } else if (S.paint) {
    p += S.paint(c, L, cab, X);
  } else {
    p += rect(-1, S.white + 0.55, L + 2, 4, NS.roof) + rect(-1, S.band[0], L + 2, S.band[1] - S.band[0], NS.blue) +
      rect(-1, S.yline[0], L + 2, S.yline[1] - S.yline[0], NS.yellow) + rect(-1, 0, L + 2, S.skirt, NS.dark);
    if (cab) p += spCabPaint(type, S);
  }
  for (const [a, b, y0 = S.win[0], y1 = S.win[1]] of k.wins) p += glass(X(a), X(b), y0, y1, 0.45);
  for (const [a, b] of k.doors) {
    const x = X(a), w = X(b) - X(a);
    p += rect(x, S.door[0], w, S.door[1] - S.door[0], S.doorFill || NS.yellow, 0, 'rx="0.25" stroke="rgba(0,0,0,0.45)" stroke-width="0.1"') + line(x + w / 2, S.door[0] + 0.1, x + w / 2, S.door[1] - 0.1, "rgba(0,0,0,0.5)", 0.6);
    for (const lx of [x + 0.4, x + w / 2 + 0.35]) p += glass(lx, lx + w / 2 - 0.75, S.door[0] + 2.4, S.door[1] - 0.9, 0.35);
  }
  for (const [x, cls] of k.nums || []) p += letters(c, X(x), S.win[1] - 0.75, 0.95, cls, S.numFill || "#ffffff", { weight: 700, family: S.font || NSF });
  if (k.first && S.firstLine !== false) p += rect(X(k.first[0]), S.win[1] + 0.3, X(k.first[1]) - X(k.first[0]), 0.16, S.firstLine || "#ffffff");
  if (S.over) p += S.over(c, L, cab, X, k);
  if (k.logo != null && S.logo !== false) p += nsLogo(c, X(k.logo), type === "icm" ? 4.4 : (S.yline[1] + S.band[0]) / 2, type === "icm" ? 2.4 : 3.6, NS.blue);
  let s = body(pts, S.base, p, S.low, R);
  s = tx.map((x) => truck(x, { wb: type === "icm" ? 8.2 : 8.4, d: S.wheel, top: S.arch })).join("") + s;
  if (cab) s += spCab(c, type, S, nose);
  for (const [a, b] of k.roof || []) s += roofCover(X(a), R, X(b) - X(a), 0.7, "#80868d", 2);
  if (k.pan != null) s += pantograph(X(k.pan), R + 0.1, { up: c.wires !== false, facing: -1 }) + panGear(X(k.pan), R + 0.1, -1);
  if (c.coupledL && !cab) s += bellows(0, -1, S.low + 0.6, R - 0.6);
  if (c.coupledR) s += bellows(L, 1, S.low + 0.6, R - 0.6);
  return s;
}
// The Sprinters' cab paint.
function spCabPaint(type, S) {
  // The lower nose dark gray under the lamps.
  const chin = path(`M-1 -1L-1 4.0L2.0 4.0Q4.0 3.6 5.6 ${S.skirt}L5.6 -1Z`, "#4a4f55");
  // SNG: white behind the cab door, the blue starting in a point behind it.
  if (type === "sng") return rect(-1, S.band[0] - 0.1, 13.0, S.band[1] - S.band[0] + 0.2, NS.white) + path(`M10.4 ${S.band[1]}L13.4 ${S.band[1]}L13.4 ${S.band[0]}L12.6 ${S.band[0]}Z`, NS.blue) +
    path(`M-1 5.9L3.4 6.2Q6.6 7.8 8.6 ${S.white + 0.6}L8.6 16L-1 16Z`, NS.yellow) + path(`M-1 8.2L2.7 8.4L5.4 11.6L5.4 16L-1 16Z`, NS.black) + chin;
  if (type === "flirt") return rect(-1, S.band[0] - 0.1, 14.2, S.band[1] - S.band[0] + 0.2, NS.white) + path(`M13.2 ${S.band[1]}Q11.6 ${S.band[1]} 11.6 ${(S.band[0] + S.band[1]) / 2}Q11.6 ${S.band[0]} 13.2 ${S.band[0]}Z`, NS.blue) +
    path(`M-1 5.9L3.2 6.1Q9.6 6.6 11.4 ${S.white + 0.6}L11.4 16L-1 16Z`, NS.yellow) + path(`M-1 8.8L2.6 9.1L4.6 12.2L4.6 16L-1 16Z`, NS.black) + chin;
  // SLT: white, the blue round the windshield and down the nose's side,
  // the band beginning behind the cab door with a rounded end.
  return rect(-1, S.band[0] - 0.1, 10.0, S.band[1] - S.band[0] + 0.2, NS.white) +
    path(`M-1 7.0L1.6 7.2Q3.0 8.8 4.6 11.4L6.0 11.4L6.0 9.2Q4.2 8.4 2.6 6.4L-1 6.0Z`, NS.blue) +
    path(`M11.8 ${S.band[1]}Q9.8 ${S.band[1]} 9.8 ${(S.band[0] + S.band[1]) / 2}Q9.8 ${S.band[0]} 11.8 ${S.band[0]}Z`, NS.blue) +
    path(`M-1 8.4L2.4 8.6L4.4 11.2L5.5 ${S.white + 0.55}L-1 16Z`, NS.black) + chin;
}
function spCab(c, type, S, nose) {
  let s = "";
  if (type === "icm") {
    // The high cab's windshield, the gangway doors' outline in the nose.
    s += path(poly([[5.2, 11.5], [7.3, 11.95], [7.9, 12.5], [7.9, 11.5]]), C.glass) + rect(0.9, 4.0, 0.25, 6.4, "rgba(0,0,0,0.25)") +
      lamp(0.65, 5.0, 0.55, 0.55) + rect(0.6, 4.2, 0.45, 0.4, RED_LAMP, 0, 'rx="0.1"');
    s += rect(-0.1, 2.8, 1.2, 1.2, "#1b1d20", 0, 'rx="0.25"');
    return s;
  }
  const g = S.glass || (type === "slt" ? [[2.6, 8.9], [4.4, 11.3], [5.7, 11.6], [5.7, 8.9]] : type === "sng" ? [[2.9, 8.7], [5.3, 11.4], [6.6, 11.6], [6.6, 8.8]] : [[2.8, 9.6], [4.4, 12.0], [5.6, 12.1], [5.6, 9.6]]);
  s += path(poly(g), C.glass) + lamp(0.7, 5.3, 0.6, 0.5) + rect(0.65, 4.5, 0.45, 0.38, RED_LAMP, 0, 'rx="0.1"');
  s += rect(-0.1, 2.3, 1.2, 1.2, "#1b1d20", 0, 'rx="0.25"');
  return s;
}
// Layouts (metres).
const SP_CARS = {
  // ICMm: cab car 27.3 m, middle cars 26.0 m (one with first class).
  icmCab: { len: 27.3, cab: true, trucks: [4.0, 24.4], wins: [[7.6, 9.0], [11.9, 13.2], [13.8, 15.1], [15.7, 17.0], [17.6, 18.9], [19.5, 20.8], [21.4, 22.7], [23.3, 24.4]], doors: [[9.6, 11.2], [25.2, 26.8]], nums: [[13.5, "2"], [21.1, "2"]], logo: 14.0, pan: 13.0 },
  icmMid: { len: 26.0, trucks: [2.9, 23.1], wins: [[3.0, 4.3], [4.9, 6.2], [6.8, 8.1], [8.7, 10.0], [10.6, 11.9], [12.5, 13.8], [14.4, 15.7], [16.3, 17.6], [18.2, 19.5], [20.1, 21.4], [22.0, 23.3]], doors: [[0.5, 2.1], [23.9, 25.5]], nums: [[6.5, "2"], [19.8, "2"]], logo: 13.0 },
  icmFirst: { len: 26.0, trucks: [2.9, 23.1], wins: [[3.0, 4.6], [5.2, 6.8], [7.4, 9.0], [9.6, 11.2], [12.6, 14.2], [14.8, 16.4], [17.0, 18.6], [19.2, 20.8], [21.4, 23.0]], doors: [[0.5, 2.1], [23.9, 25.5]], nums: [[5.0, "1"], [11.9, "1"], [20.9, "2"]], first: [2.6, 12.4], logo: 13.0 },
  // SLT: cab car 19.2 m (first class behind the cab, its one door at the
  // inner end), middle cars 15.5 m with two doors.
  sltCab: { len: 19.2, cab: true, trucks: [2.6, "j1"], wins: [[4.0, 4.9], [5.6, 7.4], [7.9, 9.7], [12.4, 14.1], [14.6, 16.3], [16.8, 18.6]], doors: [[10.3, 11.8]], nums: [[6.6, "1"], [13.2, "2"]], first: [5.6, 9.7], logo: 7.65 },
  sltMid: { len: 15.5, trucks: ["j0", "j1"], wins: [[2.9, 4.6], [5.1, 6.8], [8.7, 10.4], [10.9, 12.6]], doors: [[0.8, 2.3], [13.2, 14.7]], nums: [[5.9, "2"]], logo: 7.75, roof: [[5.4, 10.0]] },
  sltMidP: { len: 15.5, trucks: ["j0", "j1"], wins: [[2.9, 4.6], [5.1, 6.8], [8.7, 10.4], [10.9, 12.6]], doors: [[0.8, 2.3], [13.2, 14.7]], nums: [[5.9, "2"]], logo: 7.75, pan: 7.7 },
  // SNG: cab car 22.1 m, two doors; the middle car 15.5 m, two doors.
  sngCab: { len: 22.1, cab: true, trucks: [2.6, "j1"], wins: [[4.6, 6.4], [9.2, 10.9], [11.4, 13.1], [13.6, 15.3], [18.6, 20.3], [20.8, 21.7]], doors: [[7.2, 8.6], [16.4, 17.8]], nums: [[11.2, "2"], [18.3, "2"]], logo: 12.3 },
  sngMid: { len: 15.5, trucks: ["j0", "j1"], wins: [[0.6, 1.6], [4.2, 5.9], [6.4, 8.1], [8.6, 10.3], [13.8, 14.9]], doors: [[2.2, 3.6], [11.0, 12.4]], nums: [[6.2, "2"]], logo: 7.2, pan: 7.4 },
  sngMid2: { len: 15.5, trucks: ["j0", "j1"], wins: [[0.6, 1.6], [4.2, 5.9], [6.4, 8.1], [8.6, 10.3], [13.8, 14.9]], doors: [[2.2, 3.6], [11.0, 12.4]], nums: [[6.2, "2"]], logo: 7.2, roof: [[4.0, 10.0]] },
  // FLIRT (NS, 3 and 4 cars): cab car 23.0 m, first class behind the cab;
  // middle cars 17.3 m.
  flCab: { len: 23.0, cab: true, trucks: [3.0, "j1"], wins: [[5.3, 6.2], [6.8, 8.6], [9.1, 10.9], [13.6, 15.4], [15.9, 17.7], [18.2, 20.0], [20.5, 22.3]], doors: [[11.5, 13.0]], nums: [[8.9, "1"], [15.7, "2"]], first: [6.8, 10.9], logo: 14.4 },
  flMid: { len: 17.3, trucks: ["j0", "j1"], wins: [[2.9, 4.7], [5.2, 7.0], [7.5, 9.3], [9.8, 11.6], [12.1, 13.9]], doors: [[0.8, 2.3], [14.6, 16.1]], nums: [[7.2, "2"]], logo: 13.2, pan: 8.6 },
  flMid2: { len: 17.3, trucks: ["j0", "j1"], wins: [[2.9, 4.7], [5.2, 7.0], [7.5, 9.3], [9.8, 11.6], [12.1, 13.9]], doors: [[0.8, 2.3], [14.6, 16.1]], nums: [[7.2, "2"]], logo: 13.2, roof: [[5.0, 12.0]] },
};

// ===================== Types, models =====================
const Mo = (draw, len, oneEnd = false, variant = null) => ({ draw, len: n(len), oneEnd, variant });
// A twin drawn turned round (its layout mirrored, its lettering still
// reading left to right): for units coupled the other way about.
const turnedModel = (m) => ({ ...m, oneEnd: false, draw: (c) => mirror(c, m.draw) });
export const TYPES = {}, MODELS = {};
const add = (key, type, model, twin = true) => {
  TYPES[key] = type; MODELS[key] = model;
  if (twin) { TYPES[`${key}R`] = { ...type }; MODELS[`${key}R`] = turnedModel(model); }
};
for (const [paint, tag, label] of [["std", "", ""], ["flow", "F", ", Flow paint"]]) {
  for (const key of Object.keys(ICNG_CARS)) {
    const k = ICNG_CARS[key], first = k.cls === "1" || !!k.first;
    const what = k.cab ? "cab car" : k.cls === "1" ? "first-class car" : k.len > 20 ? "car" : "car";
    add(`nlIcng${tag}${key}`, { name: `ICNG ${what}${label}`, kind: "emu", ...(first ? { amenities: ["first"] } : {}) },
      Mo((c) => icngCar(c, key, paint), M(k.len)));
  }
}
for (const [paint, tag, label] of [["m1", "", ", VIRMm1 paint"], ["flow", "F", ", Flow paint"]]) {
  for (const [key, k] of Object.entries(VIRM_CARS)) {
    const what = k.cab ? "cab car (mBvk)" : key === "mBv7" ? "motor car (mBv)" : `car with first class (${key})`;
    add(`nlVirm${tag}${key}`, { name: `VIRM ${what}${label}`, kind: "bilevel", emu: true, ...(k.first ? { amenities: ["first"] } : {}), ...(k.pan ? { pan: true } : {}) },
      Mo((c) => virmCar(c, k, paint), k.len));
  }
}
add("nlDdzABvk", { name: "DDZ cab car with first class (ABvk)", kind: "bilevel", cab: true, amenities: ["first"] }, Mo((c) => virmCar(c, DDZ_CARS.ABvk, "m1"), DDZ_CARS.ABvk.len));
add("nlDdzBv", { name: "DDZ second-class car (Bv)", kind: "bilevel" }, Mo((c) => virmCar(c, DDZ_CARS.Bv, "m1"), DDZ_CARS.Bv.len));
add("nlDdzABv", { name: "DDZ car with first class (ABv)", kind: "bilevel", amenities: ["first"] }, Mo((c) => virmCar(c, DDZ_CARS.ABv, "m1"), DDZ_CARS.ABv.len));
add("nlDdzmBk", { name: "DDZ power car (mBk)", kind: "electric", pan: true }, Mo(ddzPower, M(21.4)));
const SP_NAMES = {
  icmCab: ["icm", "ICMm (Koploper) cab car", "emu", null], icmMid: ["icm", "ICMm (Koploper) car", "emu", null], icmFirst: ["icm", "ICMm (Koploper) car with first class", "emu", ["first"]],
  sltCab: ["slt", "SLT (Sprinter Lighttrain) cab car with first class", "emu", ["first"]], sltMid: ["slt", "SLT car", "emu", null], sltMidP: ["slt", "SLT car with pantograph", "emu", null],
  sngCab: ["sng", "SNG (Sprinter Nieuwe Generatie) cab car", "emu", null], sngMid: ["sng", "SNG car with pantograph", "emu", null], sngMid2: ["sng", "SNG car", "emu", null],
  flCab: ["flirt", "FLIRT (NS) cab car with first class", "emu", ["first"]], flMid: ["flirt", "FLIRT (NS) car with pantograph", "emu", null], flMid2: ["flirt", "FLIRT (NS) car", "emu", null],
};
for (const [key, [type, name, kind, amenities]] of Object.entries(SP_NAMES)) {
  const k = SP_CARS[key];
  add(`nl${key[0].toUpperCase()}${key.slice(1)}`, { name, kind, ...(amenities ? { amenities } : {}), ...(k.pan != null ? { pan: true } : {}) }, Mo((c) => spCar(c, type, k), M(k.len)));
}

// ===================== Locomotives for the international trains =====================
// NS International's Siemens Vectron MS (193 7xx/9xx, leased from ELL and
// others since 2021; photographs: 193 956 at Mehrhoog 2026, 193 737 at
// Deventer 2024): in NS's Flow paint, yellow, the cab's top blue down to
// the windshield's foot, a blue line low along the body, a blue panel at
// one end with the big white NS logo; it hauls the Nightjets to and from
// Amsterdam as far as Köln or Oberhausen.
const NOSE_VECTRON = [[1.4, 4.1], [1.4, 7.3], ["q", 1.45, 8.3, 2.1, 9.0], [3.0, 12.3], ["q", 3.3, 12.9, 4.3, 12.9]];
const vecBase = (L) => rect(-1, 0, L + 2, 20, NS.yellow) + rect(-1, 11.75, L + 2, 3, "#5a5e63") + rect(-1, 0, L + 2, 4.75, "#3e4144") + rect(-1, 4.75, L + 2, 0.4, NS.blue);
const vectronNs = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  // The blue end: the cab's top down to the windshield's foot and back past
  // the cab door, its edge then sweeping up to the roof; a light-blue flash.
  paintR: (cc, L) => vecBase(L) + rect(-1, 11.75, 21.5, 3, NS.blue) + path(`M-1 8.5L2.4 8.7L12.0 8.7C16.0 8.7 19.0 10.4 24.0 11.75L-1 11.75Z`, NS.blue) + path(`M14.6 8.95L17.4 8.95L22.2 11.45L20.0 11.45Z`, "#4f8fd8"),
  // The other end: only a blue cap over the cab.
  paint: (cc, L) => vecBase(L) + path(`M-1 11.0L3.4 11.0Q5.6 11.0 6.4 11.75L-1 11.75Z`, NS.blue),
  over: (cc, L) => nsLogo(cc, L * 0.54, 8.3, 12.8, NS.logo),
  grilles: [],
});
// SNCB's HLE 28 (Bombardier TRAXX F140 MS, class 186 leased with its
// Belgian number, 2801-2825): the EuroCity Brussel-Zuid-Rotterdam with I11
// coaches (2805 at Rotterdam, 2808 at Breda, 2026): light gray, the cab ends
// turquoise back past the cab door, a red band and yellow wedge on the nose.
const NOSE_TRAXX = [[1.2, 4.1], [1.0, 7.7], ["q", 1.05, 8.6, 1.7, 9.1], [2.5, 12.2], ["q", 2.8, 12.9, 3.9, 12.9]];
const SN_TEAL = "#16b3a5";
const hle28 = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_TRAXX, rake: [[1.7, 9.1], [2.5, 12.2]], centers: 34.25, door: 5.4, wheel: 49, surround: "#2b2f33",
  // The turquoise ends, their edge slanting back toward the roof; the
  // nose's red band at its foot.
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#c9cdd0") + rect(-1, 0, L + 2, 5.0, "#3a3d42") +
    path(`M-1 5.0L11.4 5.0L14.2 12.9L-1 12.9Z`, SN_TEAL) + path(`M-1 5.0L1.6 5.0L1.4 5.9L-1 5.9Z`, "#d71f26"),
  grilles: [[-6.0, 5.0, 10.0, 11.4], [1.0, 5.0, 10.0, 11.4]], grilleFill: "rgba(20,22,25,0.18)",
});
add("nlVectronNs", { name: "Siemens Vectron (193), NS International", kind: "electric", pan: true }, Mo(vectronNs, M(18.98)), false);
add("nlHle28", { name: "SNCB HLE 28 (TRAXX, class 186) locomotive", kind: "electric", pan: true }, Mo(hle28, M(18.9)), false);
// ===================== The neighbours' and the open-access trains =====================
// Each on the single-deck builder above, in its own paint (photographs):
// R-net's FLIRTs (NS's 2010-2015, two cars, Gouda–Alphen a/d Rijn; 2015 at
// Gouda 2026, 2010 at Rietveld 2026): dark gray, the cab's front and its
// top red back over the cab, red doors, R·NET in white behind the cab,
// white class numerals, a light gray bar over first class.
// VIAS's multi-system FLIRT 3s (ET 25 2301-2307, the seven of the RE 19's
// 21 cleared for the Netherlands; 2301 at Arnhem 2025, 2303 at Empel-Rees
// 2025, both as RE 19): silver-gray, the side black from the floor to the
// roof's edge over a green line, a green wedge behind the cab, green doors,
// a yellow bar over first class (VIAS is lettered on the front, not the side). (The 22xx units,
// with a red slash, stay on the German side to Bocholt.)
// eurobahn's FLIRT 3 (ET 4.01-4.xx, the RB 61 Hengelo–Bielefeld since
// December 2025; 4.01, 4.02, 4.06 at Hengelo and Herford 2026): turquoise,
// a white panel behind the cab with "eurobahn" in blue.
// eurobahn's first FLIRTs (ET 7.xx, five cars, the RE 13 Venlo–Hamm; 7.10
// at Breyell): silver, the windows in a dark band, orange-yellow doors and
// a yellow front.
// DB's Talent (643, two cars, the RB 64 Enschede–Münster/Dortmund; at
// Enschede de Eschmarke): traffic red, a light gray skirt.
const RN = { gray: "#3c4145", red: "#e1261c", bar: "#c9cdd0" };
const VI = { pale: "#d6dad8", black: "#1f2523", green: "#4cc43c", yellow: "#f2c200" };
const EB = { teal: "#2ea7c7", white: "#eef1f2", blue: "#1f4f8f", silver: "#c8cccf", band: "#33373c", door: "#f0a51b", yellow: "#ffd200" };
const TAL = { red: "#ec0016", gray: "#c9ced2" };
const flCabGlass = [[2.8, 9.6], [4.4, 12.0], [5.6, 12.1], [5.6, 9.6]];
Object.assign(SP, {
  rnet: { ...SP.flirt, base: RN.gray, doorFill: RN.red, logo: false, firstLine: false,
    paint: (c, L, cab) => rect(-1, 0, L + 2, 20, RN.gray) + rect(-1, SP.flirt.white + 0.55, L + 2, 4, "#5a5f64") + rect(-1, 0, L + 2, 1.85, "#2a2d30") +
      (cab ? path(`M-1 1.8L1.4 1.8Q2.0 6.0 3.0 8.4L9.6 8.7L9.6 16L-1 16Z`, RN.red) + path(`M-1 8.8L2.6 9.1L4.6 12.2L4.6 16L-1 16Z`, NS.black) : ""),
    over: (c, L, cab, X, k) => (k.first ? rect(X(k.first[0]), SP.flirt.win[1] + 0.45, X(k.first[1]) - X(k.first[0]), 0.35, RN.bar) : "") +
      (cab ? letters(c, X(4.9), 5.6, 0.95, "R·NET", "#ffffff", { weight: 500, spacing: "0.06em" }) : "") },
  vias: { ...SP.flirt, base: VI.pale, doorFill: VI.green, logo: false, firstLine: false,
    paint: (c, L, cab) => rect(-1, 0, L + 2, 20, VI.pale) + rect(-1, 2.95, L + 2, SP.flirt.white + 0.55 - 2.95, VI.black) + rect(-1, 2.55, L + 2, 0.4, VI.green) +
      rect(-1, SP.flirt.white + 0.55, L + 2, 4, "#a9b0ad") + rect(-1, 0, L + 2, 1.85, "#4a4f52") +
      (cab ? path(`M-1 2.55L6.6 2.55Q7.6 8.0 8.0 13.5L-1 13.5Z`, VI.pale) + path(`M13.4 2.95L17.0 2.95L13.4 ${SP.flirt.white + 0.55}L12.6 ${SP.flirt.white + 0.55}Z`, VI.green) +
        path(`M-1 8.8L2.6 9.1L4.6 12.2L4.6 16L-1 16Z`, NS.black) + path(`M-1 7.0L2.2 7.3L4.2 7.9L4.2 8.3L2.0 7.7L-1 7.5Z`, VI.green) : ""),
    over: (c, L, cab, X, k) => (k.first ? rect(X(k.first[0]), SP.flirt.win[1] + 0.45, 4.6, 0.45, VI.yellow) : "")  },
  eb4: { ...SP.flirt, base: EB.teal, doorFill: EB.teal, logo: false, firstLine: false,
    paint: (c, L, cab) => rect(-1, 0, L + 2, 20, EB.teal) + rect(-1, SP.flirt.white + 0.55, L + 2, 4, "#9aa3a8") + rect(-1, 0, L + 2, 1.85, "#2b3a44") +
      (cab ? rect(9.6, 2.0, 7.4, 9.8, EB.white) + rect(17.0, 2.0, 0.5, 9.8, "#8d979c") + rect(17.8, 2.0, 0.3, 9.8, "#8d979c") + path(`M-1 8.8L2.6 9.1L4.6 12.2L4.6 16L-1 16Z`, NS.black) : ""),
    over: (c, L, cab) => (cab ? letters(c, 13.3, 7.4, 0.95, "eurobahn", EB.blue, { weight: 500 }) : "") },
  eb7: { ...SP.flirt, roof: 13.7, base: EB.silver, doorFill: EB.door, logo: false, firstLine: false, glass: [[2.3, 8.2], [3.4, 10.6], [4.6, 12.1], [6.2, 12.8], [5.6, 10.6], [4.6, 8.6]],
    paint: (c, L, cab) => rect(-1, 0, L + 2, 20, EB.silver) + rect(-1, 4.3, L + 2, 5.2, EB.band) + rect(-1, 11.9, L + 2, 4, "#a3a8ad") + rect(-1, 0, L + 2, 1.9, "#4a4e52") +
      (cab ? path(`M-1 5.6L4.4 5.6Q6.6 8.6 7.4 13.8L-1 13.8Z`, EB.yellow) : ""),
    over: (c, L, cab) => (cab ? letters(c, 12.0, 10.4, 0.8, "eurobahn", "#2a6f8f", { weight: 600 }) : "") },
  talent: { roof: 12.6, low: 1.9, arch: 3.1, wheel: 30, win: [5.0, 8.9], door: [2.0, 9.6], base: TAL.red, doorFill: TAL.red, logo: false, firstLine: false,
    glass: [[2.4, 8.6], [4.0, 11.0], [5.4, 11.3], [5.4, 8.8]], skirt: 1.9,
    paint: (c, L) => rect(-1, 0, L + 2, 20, TAL.red) + rect(-1, 0, L + 2, 3.0, TAL.gray) + rect(-1, 11.6, L + 2, 4, "#b8bdc1") + (cabLeft(c) ? path(`M-1 8.6L2.4 8.8L4.4 11.4L-1 11.4Z`, NS.black) : ""),
    over: () => "" },
});
const cabLeft = () => true;
SP_NOSE.rnet = SP_NOSE.vias = SP_NOSE.eb4 = SP_NOSE.flirt;
SP_NOSE.eb7 = () => [[8.6, 13.7], [6.9, 13.55], [5.5, 13.0], [4.3, 12.0], [3.1, 10.5], [2.15, 8.7], [1.5, 6.9], [1.15, 5.3], [1.15, 3.4], [1.7, 1.5], [5.6, 1.5]];
SP_NOSE.talent = (R) => [[7.0, R], ["q", 4.6, R, 3.6, 11.0], [1.8, 8.4], ["q", 0.6, 6.6, 0.6, 4.6], [0.6, 3.2], ["q", 0.7, 1.9, 2.0, 1.9], [5.4, 1.9]];
Object.assign(SP_CARS, {
  rnCab: { len: 21.4, cab: true, trucks: [3.0, "j1"], wins: [[5.0, 5.9], [7.0, 8.6], [8.9, 10.5], [12.4, 14.0], [14.3, 15.9], [16.2, 17.8], [20.0, 21.0]], doors: [[10.9, 12.1], [18.3, 19.5]],
    nums: [[8.75, "1"], [14.1, "2"]], first: [7.0, 10.5], pan: 17.0 },
  rnCab2: { len: 21.4, cab: true, trucks: [3.0, "j1"], wins: [[5.0, 5.9], [7.0, 8.6], [8.9, 10.5], [12.4, 14.0], [14.3, 15.9], [16.2, 17.8], [20.0, 21.0]], doors: [[10.9, 12.1], [18.3, 19.5]],
    nums: [[11.0, "2"], [14.1, "2"]] },
  eb7Cab: { len: 19.8, cab: true, trucks: [3.2, "j1"], wins: [[5.4, 6.4], [9.0, 10.6], [11.0, 12.6], [13.0, 14.6], [15.0, 16.6], [17.0, 18.6]], doors: [[6.9, 8.3]], nums: [[10.8, "1"], [16.8, "2"]], first: [9.0, 12.6] },
  eb7Mid: { len: 16.6, trucks: ["j0", "j1"], wins: [[0.6, 2.2], [4.4, 6.0], [6.4, 8.0], [8.6, 10.2], [10.6, 12.2], [14.4, 16.0]], doors: [[2.6, 4.0], [12.6, 14.0]], nums: [[8.3, "2"]] },
  eb7MidP: { len: 16.6, trucks: ["j0", "j1"], wins: [[0.6, 2.2], [4.4, 6.0], [6.4, 8.0], [8.6, 10.2], [10.6, 12.2], [14.4, 16.0]], doors: [[2.6, 4.0], [12.6, 14.0]], nums: [[8.3, "2"]], pan: 8.3 },
  talCab: { len: 17.3, cab: true, trucks: [2.8, "j1"], wins: [[5.2, 6.8], [7.2, 8.8], [11.2, 12.8], [13.2, 14.8], [15.2, 16.8]], doors: [[9.2, 10.6]], nums: [[7.0, "2"]] },
});
const XB_NAMES = {
  rnCab: ["rnet", "R-net FLIRT (NS) cab car with first class", ["first"]], rnCab2: ["rnet", "R-net FLIRT (NS) cab car", null],
  viCab: ["vias", "VIAS FLIRT 3 (ET 25 23xx) cab car with first class", ["first"], "flCab"], viMid: ["vias", "VIAS FLIRT 3 (ET 25) car with pantograph", null, "flMid"],
  e4Cab: ["eb4", "eurobahn FLIRT 3 (ET 4) cab car with first class", ["first"], "flCab"], e4Mid: ["eb4", "eurobahn FLIRT 3 (ET 4) car with pantograph", null, "flMid"], e4Mid2: ["eb4", "eurobahn FLIRT 3 (ET 4) car", null, "flMid2"],
  eb7Cab: ["eb7", "eurobahn FLIRT (ET 7) cab car with first class", ["first"]], eb7Mid: ["eb7", "eurobahn FLIRT (ET 7) car", null], eb7MidP: ["eb7", "eurobahn FLIRT (ET 7) car with pantograph", null],
  talCab: ["talent", "DB Talent (643) car", null],
};
for (const [key, [type, name, amenities, layout]] of Object.entries(XB_NAMES)) {
  const k = SP_CARS[layout || key];
  add(`nl${key[0].toUpperCase()}${key.slice(1)}`, { name, kind: "emu", ...(amenities ? { amenities } : {}), ...(k.pan != null ? { pan: true } : {}) }, Mo((c) => spCar(c, type, k), M(k.len)));
}

// ---------- Hauled coaches (UIC, 26.4 m) ----------
// GoVolta's coaches (ex-SNCB I10, rebuilt by Brouwer, since March 2026;
// photographs at Westervoort, Mehrhoog, Praest 2026): sky blue, the
// windows in one dark band, a deep blue skyline along the foot, an orange
// and yellow sweep by the door, "GoVolta" and its class in white.
// European Sleeper (2026, coaches leased from RDC and others through Train
// Charter; Paris-Nord and Berlin, April 2026): the seat cars (Bomdz) white
// with the windows in navy over a green stripe, "european sleeper" low; the
// couchettes (Bvcmz 248) and sleeping cars (WLAB33s) bright blue, gray roofs,
// "Liegewagen"/"Schlafwagen" and the Train Charter mark in white.
const COACH = { roof: 13.2, sill: 3.9, wheel: 36 };
function uicCoach(c, o) {
  const L = c.L, R = COACH.roof;
  const pts = [[0.4, COACH.sill], [L - 0.4, COACH.sill], [L - 0.4, R - 1.1], ["q", L - 0.4, R, L - 1.6, R], [1.6, R], ["q", 0.4, R, 0.4, R - 1.1]];
  let p = o.paint(c, L);
  for (const [a, b, y0 = 7.2, y1 = 10.4] of o.wins(L)) p += glass(a, b, y0, y1, 0.45);
  for (const x of [1.6, L - 4.2]) p += rect(x, 4.2, 2.6, 7.4, o.door || "rgba(0,0,0,0.05)", 0, 'rx="0.25" stroke="rgba(0,0,0,0.45)" stroke-width="0.1"') + glass(x + 0.65, x + 1.95, 8.0, 10.2, 0.35);
  if (o.over) p += o.over(c, L);
  let s = [11.4, L - 11.4].map((x) => truck(x, { wb: 8.2, d: COACH.wheel, top: COACH.sill })).join("") + body(pts, o.base, p, COACH.sill, R);
  s += rect(L / 2 - 8, R - 0.05, 16, 0.5, "#9aa1a8", 0.4, 'rx="0.2"');
  for (const x of [0, L]) s += rect(x === 0 ? -0.2 : L - 0.9, 3.0, 1.1, 0.55, "currentColor");
  if (c.coupledL) s += bellows(0, -1, 4.2, R - 1.2);
  if (c.coupledR) s += bellows(L, 1, 4.2, R - 1.2);
  return s;
}
const rowOf = (a, b, nW, w) => row(a, b, nW, w).map((x) => [x, x + w]);
const GV = { sky: "#3fb3e6", deep: "#1f4fa8", orange: "#f39a1e", yellow: "#ffd21f" };
const gvCoach = (c) => uicCoach(c, { base: GV.sky, wins: (L) => rowOf(6.0, L - 6.0, 12, 3.6), door: GV.sky,
  paint: (cc, L) => rect(-1, 0, L + 2, 20, GV.sky) + rect(5.0, 6.8, L - 10, 4.0, "#262b30", 0, 'rx="0.4"') + rect(-1, 12.3, L + 2, 3, "#c3c8cc") +
    // The skyline along the foot: steps of deep blue.
    path(`M-1 3.9L-1 5.6L10 5.6L10 6.2L14 6.2L14 5.4L22 5.4L22 6.4L24 6.4L24 5.6L36 5.6L36 6.1L40 6.1L40 5.3L52 5.3L52 6.3L55 6.3L55 5.5L66 5.5L66 6.0L70 6.0L70 5.4L${n(L + 1)} 5.4L${n(L + 1)} 3.9Z`, GV.deep) +
    path(`M${n(L - 6.0)} 3.9Q${n(L - 9.0)} 8.0 ${n(L - 5.2)} 12.3L${n(L - 4.2)} 12.3Q${n(L - 7.4)} 8.0 ${n(L - 4.6)} 3.9Z`, GV.orange) + rect(L - 4.4, 3.9, 0.6, 8.4, GV.yellow),
  over: (cc, L) => letters(cc, 12.0, 4.6, 0.9, "GoVolta", "#ffffff", { weight: 800 }) + letters(cc, 17.2, 4.6, 0.6, "COMFORT", GV.yellow, { weight: 700 }) });
const ES = { navy: "#25318f", green: "#35c23a", white: "#eef0ee", blue: "#1f6fd0", ink: "#4b2346" };
const esSeat = (c) => uicCoach(c, { base: ES.white, wins: (L) => rowOf(6.2, L - 6.2, 11, 4.2),
  paint: (cc, L) => rect(-1, 0, L + 2, 20, ES.white) + rect(-1, 6.6, L + 2, 5.4, ES.navy) + rect(-1, 6.1, L + 2, 0.5, ES.green) + rect(-1, 12.3, L + 2, 3, "#c3c8cc"),
  over: (cc, L) => letters(cc, L - 22, 5.2, 0.6, "european sleeper", ES.ink, { weight: 500 }) + letters(cc, L - 7.2, 9.2, 1.1, "2", "#ffffff", { weight: 600 }) });
const esCouchette = (c) => uicCoach(c, { base: ES.blue, door: ES.blue, wins: (L) => rowOf(6.4, L - 6.4, 10, 3.8),
  paint: (cc, L) => rect(-1, 0, L + 2, 20, ES.blue) + rect(-1, 12.3, L + 2, 3, "#b9bec3"),
  over: (cc, L) => letters(cc, L - 14, 5.6, 0.6, "Liegewagen", "#ffffff", { weight: 600 }) });
const esSleeper = (c) => uicCoach(c, { base: ES.blue, door: ES.blue, wins: (L) => rowOf(6.4, L - 6.4, 11, 2.8).map(([a, b]) => [a, b, 7.6, 10.2]),
  paint: (cc, L) => rect(-1, 0, L + 2, 20, ES.blue) + rect(-1, 12.3, L + 2, 3, "#b9bec3"),
  over: (cc, L) => letters(cc, 14, 5.6, 0.75, "train charter", "#ffffff", { weight: 800 }) + letters(cc, L - 14, 5.6, 0.6, "Schlafwagen", "#ffffff", { weight: 600 }) });
add("nlGvCoach", { name: "GoVolta coach (ex-SNCB I10)", kind: "coach" }, Mo(gvCoach, M(26.4)), false);
add("nlEsSeat", { name: "European Sleeper seat car (Bomdz)", kind: "coach" }, Mo(esSeat, M(26.4)), false);
add("nlEsCouchette", { name: "European Sleeper couchette car (Bvcmz 248)", kind: "coach", amenities: ["sleepers"] }, Mo(esCouchette, M(26.4)), false);
add("nlEsSleeper", { name: "European Sleeper sleeping car (WLAB33s)", kind: "coach", amenities: ["sleepers"] }, Mo(esSleeper, M(26.4)), false);
// Their locomotives: GoVolta's Railpool Vectron (193 317: DB red, a blue
// Railpool panel behind one cab), European Sleeper's Railpool TRAXX AC3
// (188 121: silver, a blue panel behind the cab, "train charter" in big
// rounded blue letters along the side).
const vectronRp = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_VECTRON, rake: [[2.1, 9.0], [3.0, 12.3]], centers: 32.5, door: 5.6, surround: "#1d2024",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#e2231a") + rect(-1, 11.75, L + 2, 3, "#5a5e63") + rect(-1, 0, L + 2, 4.75, "#3e4144"),
  paintR: (cc, L) => rect(-1, 0, L + 2, 20, "#e2231a") + rect(-1, 11.75, L + 2, 3, "#5a5e63") + rect(-1, 0, L + 2, 4.75, "#3e4144") + rect(9.4, 4.75, 3.4, 7.0, "#1f5fbf"),
  over: (cc, L) => letters(cc, L - 11.1, 9.6, 0.5, "RAILPOOL", "#ffffff", { weight: 700 }), grilles: [],
});
const traxxTc = (c) => euroLoco(c, {
  roof: 12.9, sill: 4.1, nose: NOSE_TRAXX, rake: [[1.7, 9.1], [2.5, 12.2]], centers: 34.25, door: 5.4, wheel: 49, surround: "#2b2f33",
  paint: (cc, L) => rect(-1, 0, L + 2, 20, "#c6c9cc") + rect(-1, 0, L + 2, 4.8, "#3a3d42") + rect(8.6, 4.8, 2.6, 7.6, "#2f7fd0"),
  over: (cc, L) => letters(cc, L / 2 + 3, 8.4, 2.6, "train charter", "#1e6cc0", { weight: 900, family: "Arial Rounded MT Bold, Nunito, Helvetica Neue, Arial, sans-serif" }), grilles: [],
});
add("nlVectronRp", { name: "Railpool Vectron (193), GoVolta's locomotive", kind: "electric", pan: true }, Mo(vectronRp, M(18.98)), false);
add("nlTraxxTc", { name: "Railpool TRAXX AC3 (188), European Sleeper's locomotive", kind: "electric", pan: true }, Mo(traxxTc, M(18.9)), false);

// Borrowed: Nightjet, ICE 3, Eurostar, I11 (registered under their own keys).
for (const src of [{ TYPES: CHI_TYPES, MODELS: CHI_MODELS }, SNCF, SNCB]) {
  for (const key of Object.keys(src.TYPES || {})) if (/^(atNjo|atNjn|snIce3|snE320|snPbka|i11|am75|ice3neo)/.test(key) && src.MODELS[key]) { TYPES[key] = { ...src.TYPES[key] }; MODELS[key] = src.MODELS[key]; }
}

// DB's ICE 3neo (class 408, Siemens Velaro MS, 2023-): Amsterdam–Frankfurt
// and, since November 2025, Amsterdam–Berlin (8003 at Praest, 8012 at
// Weesp, 8041 at Deurningen, 2025-2026). Its body and paint are the Velaro
// D's (class 407) as sncf.cars.js draws it; named here as what runs.
for (const [k, from, name] of [["nlIce408End", "snIce3End", "ICE 3neo (DB class 408) end car"], ["nlIce408Mid", "snIce3Mid", "ICE 3neo car"], ["nlIce408Pan", "snIce3Pan", "ICE 3neo car with pantograph"]]) {
  if (SNCF.MODELS?.[from]) { TYPES[k] = { ...SNCF.TYPES[from], name }; MODELS[k] = SNCF.MODELS[from]; }
}

// ===================== Whole units (for a formation feed) =====================
// The units as NS runs them, cars in order from the cab at the left: a
// feed naming each unit (InfoPlus's MaterieelSoort and Aanduiding, below)
// draws the whole unit as one piece, so units coupled together stand apart
// as they are.
const UNIT_CARS = {
  Icng8: ["nlIcngc1", "nlIcngc2", "nlIcngc3", "nlIcngc4", "nlIcngc5", "nlIcngc6", "nlIcngc7", "nlIcngc8"],
  IcngF8: ["nlIcngFc1", "nlIcngFc2", "nlIcngFc3", "nlIcngFc4", "nlIcngFc5", "nlIcngFc6", "nlIcngFc7", "nlIcngFc8"],
  Icng5: ["nlIcngc1", "nlIcngd2", "nlIcngd3", "nlIcngd4", "nlIcngc8"],
  Virm4: ["nlVirmmBvk", "nlVirmABv6", "nlVirmABv3", "nlVirmmBvkR"],
  Virm6: ["nlVirmmBvk", "nlVirmABv5", "nlVirmmBv7", "nlVirmABv6", "nlVirmABv4", "nlVirmmBvkR"],
  VirmF4: ["nlVirmFmBvk", "nlVirmFABv6", "nlVirmFABv3", "nlVirmFmBvkR"],
  VirmF6: ["nlVirmFmBvk", "nlVirmFABv5", "nlVirmFmBv7", "nlVirmFABv6", "nlVirmFABv4", "nlVirmFmBvkR"],
  Ddz4: ["nlDdzABvk", "nlDdzBv", "nlDdzABv", "nlDdzmBkR"],
  Ddz6: ["nlDdzABvk", "nlDdzBv", "nlDdzABv", "nlDdzBv", "nlDdzABv", "nlDdzmBkR"],
  Icm3: ["nlIcmCab", "nlIcmFirst", "nlIcmCabR"],
  Icm4: ["nlIcmCab", "nlIcmFirst", "nlIcmMid", "nlIcmCabR"],
  Slt4: ["nlSltCab", "nlSltMidP", "nlSltMid", "nlSltCabR"],
  Slt6: ["nlSltCab", "nlSltMidP", "nlSltMid", "nlSltMid", "nlSltMidP", "nlSltCabR"],
  Sng3: ["nlSngCab", "nlSngMid", "nlSngCabR"],
  Sng4: ["nlSngCab", "nlSngMid", "nlSngMid2", "nlSngCabR"],
  Flirt3: ["nlFlCab", "nlFlMid", "nlFlCabR"],
  Flirt4: ["nlFlCab", "nlFlMid", "nlFlMid2", "nlFlCabR"],
};
const UNIT_NAMES = {
  Icng8: "ICNG, eight cars", IcngF8: "ICNG-B, eight cars (Flow paint)", Icng5: "ICNG, five cars", Virm4: "VIRM, four cars (VIRMm1)", Virm6: "VIRM, six cars (VIRMm1)",
  VirmF4: "VIRM, four cars (Flow paint)", VirmF6: "VIRM, six cars (Flow paint)", Ddz4: "DDZ, four cars", Ddz6: "DDZ, six cars", Icm3: "ICMm (Koploper), three cars",
  Icm4: "ICMm (Koploper), four cars", Slt4: "SLT, four cars", Slt6: "SLT, six cars", Sng3: "SNG, three cars", Sng4: "SNG, four cars", Flirt3: "FLIRT, three cars", Flirt4: "FLIRT, four cars",
};
function unitDraw(keys) {
  const lens = keys.map((k) => MODELS[k].len);
  return (c) => {
    let x = 0, s = "";
    keys.forEach((k, i) => {
      const cc = { ...c, L: lens[i], index: i, count: keys.length, lead: false, cabL: false, cabR: false, mirrored: false, coupledL: i > 0 || c.coupledL, coupledR: i < keys.length - 1 || c.coupledR };
      s += `<g transform="translate(${n(x)} 0)">${MODELS[k].draw(cc)}</g>`;
      x += lens[i];
    });
    return s;
  };
}
for (const [u, keys] of Object.entries(UNIT_CARS)) {
  const first = keys.some((k) => TYPES[k].amenities?.includes("first"));
  add(`nlUnit${u}`, { name: UNIT_NAMES[u], kind: TYPES[keys[1]].kind === "bilevel" ? "bilevel" : "emu", emu: true, ...(first ? { amenities: ["first"] } : {}) },
    { draw: unitDraw(keys), len: n(keys.reduce((a, k) => a + MODELS[k].len, 0)), oneEnd: false, variant: null }, false);
}

// ---------- Vehicles by number ----------
// NS's unit numbers (the number on the cab: "9418", "2651"), as InfoPlus
// gives them: [first, last, unit type].
export const FLEETS = {
  ns: [
    [3101, 3149, "nlUnitIcng5"], [3201, 3227, "nlUnitIcng8"], [3301, 3321, "nlUnitIcngF8"], [3351, 3362, "nlUnitIcngF8"],
    // VIRMm1 (8601-8681, 9401-9481); VIRMm2/3 in Flow (8701-8746, 9501-9525);
    // the VIRM-4 (9547-9597), being refitted into Flow since late 2025, drawn
    // as the VIRMm1 until each is done (its original bands differ a little).
    [8601, 8681, "nlUnitVirm6"], [8701, 8746, "nlUnitVirmF6"], [9401, 9481, "nlUnitVirm4"], [9501, 9525, "nlUnitVirmF4"], [9547, 9597, "nlUnitVirm4"],
    [7501, 7550, "nlUnitDdz4"], [7601, 7621, "nlUnitDdz6"], [4011, 4099, "nlUnitIcm3"], [4201, 4250, "nlUnitIcm4"],
    [2401, 2469, "nlUnitSlt4"], [2601, 2662, "nlUnitSlt6"], [2301, 2368, "nlUnitSng3"], [3001, 3050, "nlUnitSng3"], [2701, 2788, "nlUnitSng4"],
    [2201, 2233, "nlUnitFlirt3"], [2501, 2525, "nlUnitFlirt4"],
  ],
};
FLEETS.nlintl = FLEETS.ns.filter(([a]) => a >= 3301 && a <= 3362);

// ---------- A reported formation ----------
// InfoPlus DVS (scripts/railroads/nl.py, "Formations"): ONE ENTRY PER UNIT,
// in running order; model "<MaterieelSoort> <MaterieelAanduiding>" ("VIRM
// 6", "SLT 4", "ICNG 8B", "SNG 3T", "FLIRT FFF 4"), number the unit's
// ("9564") or "" for other railways'. The number picks the paint (VIRMm1 or
// Flow); the model the unit when the number is missing or unknown.
const MODEL_UNITS = [
  [/^ICNG\s*8\s*[BD]/i, "IcngF8"], [/^ICNG\s*8/i, "Icng8"], [/^ICNG\s*5/i, "Icng5"],
  [/^VIRM\s*4/i, "Virm4"], [/^VIRM\s*6/i, "Virm6"], [/^DDZ\s*4/i, "Ddz4"], [/^DDZ\s*6/i, "Ddz6"],
  [/^ICM\s*3/i, "Icm3"], [/^ICM\s*4/i, "Icm4"], [/^SLT\s*4/i, "Slt4"], [/^SLT\s*6/i, "Slt6"],
  [/^SNG\s*3/i, "Sng3"], [/^SNG\s*4/i, "Sng4"], [/^FLIRT\s*FFF\s*3/i, "Flirt3"], [/^FLIRT\s*FFF\s*4/i, "Flirt4"],
];
const byNumber = (agency, number) => {
  const k = Number(String(number || "").replace(/\D/g, "").replace(/^0+/, "").slice(-4));
  if (!k) return null;
  return (FLEETS.ns.find(([a, b]) => k >= a && k <= b) || [])[2] || null;
};
const unitFormation = (car) => {
  const m = String(car.model || "").trim();
  const fromModel = MODEL_UNITS.find(([re]) => re.test(m))?.[1];
  const fromNumber = byNumber("ns", car.number);
  // The number decides when it agrees with the model's kind of unit.
  if (fromNumber && (!fromModel || fromNumber.replace(/^nlUnit/, "").replace(/F(?=\d)/, "") === fromModel.replace(/F(?=\d)/, ""))) return fromNumber;
  return fromModel ? `nlUnit${fromModel}` : null;
};
export const FORMATION = {
  ns: (car) => unitFormation(car),
  // The international trains: NS's ICNG-Bs on the Eurocity Direct; the
  // others (ICE, Eurostar, ÖBB) come without numbers and are drawn typical.
  nlintl: (car) => (/^ICNG/i.test(String(car.model || "")) ? unitFormation(car) : null),
};

// ---------- Typical trains ----------
const set = (label, ...units) => ({ label, units });
const unitOf = (u) => UNIT_CARS[u].map((k) => [k, 1]);
const units = (label, ...us) => set(label, ...us.flatMap(unitOf));
// What runs on each train series in the 2026 timetable (the series, the
// number in hundreds; NS's 18xxxx and 70xxxx extra and replacement trains
// by the series they stand in for): nl.wikipedia's ICNG, DDZ and ICM
// articles (ICNG: 700, 1100, 1800, 2400, 11800, 12400, the Eurocity Direct;
// DDZ: 1700, 2800, 3600; the ICMm on the Intercitys to Groningen and
// Leeuwarden), the rest of the Intercitys VIRMs; the Sprinters by the
// lines' usual units, which the depots swap freely.
const IC_SERIES = {
  Icm: [500, 600, 1500], Icng: [1800, 2400, 9700, 11800, 12400], Icng700: [700], Icng1100: [1100],
  Ddz: [1700, 2800, 3600, 28400],
};
const SPR_SERIES = {
  Slt: [4000, 4100, 4300, 4600, 4800, 4900, 5000, 5100, 5200, 5400, 5500, 5700, 5800, 6000, 7300, 7400, 8100, 8200, 8300, 8400, 8800, 8900, 14800, 24200, 28300, 28800],
  Flirt: [6400, 6500, 6600, 7600, 16500, 28700],
};
const seriesOf = (t) => {
  const k = Number(String(t.number || "").match(/\d+/)?.[0] || 0);
  return Math.floor((k >= 100000 ? k % 10000 : k) / 100) * 100;
};
const VIRM_IC = units("Usually VIRM double-deckers: a six-car and a four-car unit (VIRMm1 paint; the refitted ones in Flow)", "Virm6", "Virm4");
const ICM_IC = units("Usually ICMm (Koploper) units, a four-car and a three-car", "Icm4", "Icm3");
const DDZ_IC = units("Usually a DDZ double-decker, six cars (some trains a four-car more)", "Ddz6");
const ICNG8 = units("An ICNG, eight cars (some trains two)", "Icng8");
const ICNG_700 = units("An ICNG, eight cars (since 2026; some trains still VIRMs)", "Icng8");
const ICNG_1100 = units("ICNGs: an eight-car and a five-car unit", "Icng8", "Icng5");
const SNG = units("Usually an SNG (Sprinter Nieuwe Generatie), four cars", "Sng4");
const SLT = units("Usually an SLT (Sprinter Lighttrain), six cars", "Slt6");
const FLIRT = units("Usually a FLIRT, four cars (often with a three-car)", "Flirt4");
const BY_UNIT = Object.fromEntries(Object.keys(UNIT_CARS).map((u) => [u, units(UNIT_NAMES[u], u)]));
const fromReported = (reported) => {
  if (!reported) return null;
  const k = reported.replace(/R$/, "");
  if (k.startsWith("nlUnit")) return BY_UNIT[k.slice(6)] || null;
  const u = Object.keys(UNIT_CARS).find((x) => UNIT_CARS[x].some((c) => c.replace(/R$/, "") === k));
  return u ? BY_UNIT[u] : null;
};
const has = (k) => !!(TYPES[k] && MODELS[k]);
const allThere = (s) => (s.units.every(([k]) => has(k)) ? s : null);
// The international trains.
// The ICE 3neo as sncb.cars.js draws it (first class at the Frankfurt end,
// the front of a train leaving Amsterdam); France's Velaro D the fallback.
const ICE3NEO_BE = set("ICE 3neo (DB class 408), eight cars: first class at the German end",
  ["ice3neoEnd1", 1], ["ice3neoFirst", 1], ["ice3neoBistro", 1], ["ice3neoSecond", 1], ["ice3neoPan", 1], ["ice3neoSecond", 2], ["ice3neoEnd2R", 1]);
const ICE3NEO_BE_IN = set(ICE3NEO_BE.label, ["ice3neoEnd2", 1], ["ice3neoSecond", 2], ["ice3neoPan", 1], ["ice3neoSecond", 1], ["ice3neoBistro", 1], ["ice3neoFirst", 1], ["ice3neoEnd1R", 1]);
const ICE3NEO = set("ICE 3neo (DB class 408), eight cars", ["nlIce408End", 1], ["nlIce408Pan", 1], ["nlIce408Mid", 4], ["nlIce408Pan", 1], ["nlIce408End", 1]);
const E320 = set("Eurostar e320, sixteen cars (London trains)", ["snE320End", 1], ["snE320Pan", 1], ["snE320Mid", 4], ["snE320Pan", 1], ["snE320Mid", 2], ["snE320Pan", 1], ["snE320Mid", 4], ["snE320Pan", 1], ["snE320End", 1]);
const RED = set("Eurostar's red trains (ex-Thalys PBKA), two power cars and eight trailers", ["snPbkaPower", 1], ["snPbkaTrailer", 8], ["snPbkaPower", 1]);
const NJ_NEW = set("Nightjet, new generation: NS International's Vectron and seven cars (sleeping cars, couchettes with mini cabins, the multi-function car, the seat car with its cab)",
  ["nlVectronNs", 1], ["atNjnSleeper", 2], ["atNjnCouchette", 3], ["atNjnMulti", 1], ["atNjnSeatCab", 1]);
const NJ_OLD = set("Nightjet (classic cars): NS International's Vectron, sleeping cars, couchettes, a seat car",
  ["nlVectronNs", 1], ["atNjoSleeper", 2], ["atNjoCouchette", 2], ["atNjoCoach", 1]);
const EC = set("EuroCity (NMBS/SNCB): an HLE 28 (TRAXX) and I11 coaches, first class next to the locomotive",
  ["nlHle28", 1], ["i11A", 1], ["i11B", 5]);
const S32 = set("NMBS AM75, four cars", ["am75a", 1], ["am75b", 1], ["am75c", 1], ["am75dR", 1]);
const RNET = set("R-net FLIRT (NS), two cars (often two units)", ["nlRnCab", 1], ["nlRnCab2R", 1]);
const VIAS = set("VIAS FLIRT 3 (ET 25 23xx, multi-system), three cars (often two units)", ["nlViCab", 1], ["nlViMid", 1], ["nlViCabR", 1]);
const EB4 = set("eurobahn FLIRT 3 (ET 4), four cars", ["nlE4Cab", 1], ["nlE4Mid", 1], ["nlE4Mid2", 1], ["nlE4CabR", 1]);
const EB7 = set("eurobahn FLIRT (ET 7), five cars", ["nlEb7Cab", 1], ["nlEb7Mid", 1], ["nlEb7MidP", 1], ["nlEb7Mid", 1], ["nlEb7CabR", 1]);
const TALENT = set("DB Talent (643), two cars (often two units)", ["nlTalCab", 1], ["nlTalCabR", 1]);
const GOVOLTA = set("GoVolta: a Railpool Vectron and rebuilt ex-SNCB I10 coaches", ["nlVectronRp", 1], ["nlGvCoach", 8]);
const ESLEEPER = set("European Sleeper: a Railpool TRAXX and leased coaches (seats, couchettes, sleeping cars)", ["nlTraxxTc", 1], ["nlEsSeat", 2], ["nlEsCouchette", 4], ["nlEsSleeper", 3]);
export const TYPICAL = {
  ns: (t, reported) => {
    const r = t.route || "";
    if (!r && reported) return fromReported(reported);
    const ser = seriesOf(t);
    const ends = `${t.origin || ""} ${t.destination || ""}`;
    if (/Intercity/.test(r)) {
      if (IC_SERIES.Icng.includes(ser) || /direct/.test(r)) return ICNG8;
      if (IC_SERIES.Icng1100.includes(ser)) return ICNG_1100;
      if (IC_SERIES.Icng700.includes(ser)) return ICNG_700;
      if (IC_SERIES.Ddz.includes(ser)) return DDZ_IC;
      if (IC_SERIES.Icm.includes(ser)) return ICM_IC;
      return VIRM_IC;
    }
    if (/R-net/.test(r)) return RNET;
    if (/Sprinter/.test(r)) {
      if (SPR_SERIES.Flirt.includes(ser)) return FLIRT;
      if (SPR_SERIES.Slt.includes(ser)) return SLT;
      if (/Weert|Deurne|Nijmegen|Wijchen|Venlo|Horst/.test(ends)) return FLIRT;
      return SNG;
    }
    return reported ? fromReported(reported) : null;
  },
  nlintl: (t, reported) => {
    const r = t.route || "", k = Number(String(t.number || "").match(/\d+/)?.[0] || 0);
    if (!r && reported) return fromReported(reported);
    if (r === "Eurocity Direct") return units("Eurocity Direct: an ICNG-B, eight cars (Flow paint)", "IcngF8");
    if (r === "ICE") return allThere(/Amsterdam|Utrecht|Arnhem/.test(t.destination || "") ? ICE3NEO_BE_IN : ICE3NEO_BE) || allThere(ICE3NEO);
    if (r === "Eurostar") return allThere(k >= 9100 && k < 9200 ? E320 : RED);
    if (r === "Nightjet") return allThere(k === 402 || k === 403 ? NJ_OLD : NJ_NEW);
    if (r === "EuroCity") return allThere(EC);
    if (/S32/.test(r)) return allThere(S32);
    if (/RE19/.test(r)) return VIAS;
    if (/RB61/.test(r)) return EB4;
    if (/RE13/.test(r)) return EB7;
    if (/RB64/.test(r)) return TALENT;
    if (r === "GoVolta") return GOVOLTA;
    if (r === "European Sleeper") return ESLEEPER;
    return reported ? fromReported(reported) : null;
  },
};
// The sets for the drawing harness and fleet samples.
export const SAMPLE_SETS = { ...BY_UNIT, ICE3NEO, E320, RED, NJ_NEW, NJ_OLD, EC, RNET, VIAS, EB4, EB7, TALENT, GOVOLTA, ESLEEPER };

// ---------- Fact sheets ----------
const NLWP = "https://nl.wikipedia.org/wiki/";
const F_ICNG = { model: "Alstom Coradia Stream High Capacity (NS ICNG)", type: "Electric multiple unit", builder: "Alstom", built: "2019–2026", fleet: "109 units (49 of five cars, 60 of eight)",
  topSpeedMph: 124, source: `${NLWP}Intercity_Nieuwe_Generatie` };
const F_VIRM = { model: "VIRM (Talbot / Bombardier double-deck Intercity)", type: "Double-deck electric multiple unit", builder: "Talbot, Bombardier", built: "1994–2009, refitted 2016–2028", fleet: "178 units (98 of four cars, 80 of six)",
  topSpeedMph: 99, source: `${NLWP}DD-IRM` };
const F_DDZ = { model: "DDZ (Dubbeldekker Zonering)", type: "Double-deck electric multiple unit", builder: "Talbot (coaches), Bombardier (power cars)", built: "1985–1992, refitted 2011–2013", fleet: "47 units (four and six cars)",
  topSpeedMph: 87, source: `${NLWP}Dubbeldekker_Zonering` };
const F_ICM = { model: "ICMm (Koploper)", type: "Electric multiple unit", builder: "Talbot, Werkspoor", built: "1977–1994, refitted 2006–2011", topSpeedMph: 99, source: `${NLWP}Intercitymaterieel` };
const F_SLT = { model: "Sprinter Lighttrain (SLT)", type: "Electric multiple unit", builder: "Bombardier and Siemens", built: "2009–2011", fleet: "131 units (69 of four cars, 62 of six)", topSpeedMph: 99, source: `${NLWP}Sprinter_Lighttrain` };
const F_SNG = { model: "CAF Civity (Sprinter Nieuwe Generatie)", type: "Electric multiple unit", builder: "CAF", built: "2018–2023", fleet: "206 units (118 of three cars, 88 of four)", topSpeedMph: 99, source: `${NLWP}Sprinter_Nieuwe_Generatie` };
const F_FL = { model: "Stadler FLIRT 3 (NS)", type: "Electric multiple unit", builder: "Stadler Rail", built: "2016–2017", fleet: "58 units (33 of three cars, 25 of four)", topSpeedMph: 99, source: "https://en.wikipedia.org/wiki/Stadler_FLIRT" };
export const FACTS = {};
const fact = (prefix, base, about) => { for (const k of Object.keys(TYPES)) if (k.startsWith(prefix)) FACTS[k] = { ...base, about: about(k) }; };
fact("nlIcng", F_ICNG, (k) => (/F/.test(k.slice(6, 7)) ? "In Flow paint: the ICNG-B (3301-3321) for Belgium on the Eurocity Direct Amsterdam/Lelystad–Brussel-Zuid, the ICNG-D (3351-3362) for Germany." :
  "NS's new Intercity, on the Intercity direct over the HSL-Zuid and Den Haag–Eindhoven, and since 2026 Schiphol–Groningen; first class in the middle of the unit."));
fact("nlVirm", F_VIRM, (k) => (/^nlVirmF/.test(k) ? "A VIRM refitted 2021-2023 (VIRMm2/3) in NS's Flow paint: blue doors, the big white logo." : "A VIRMm1 (refitted 2016-2020), NS's most common Intercity, coupled up to three units."));
fact("nlDdz", F_DDZ, () => "The DDZ on the Intercitys Den Haag–Enschede, Rotterdam–Utrecht and Vlissingen–Zwolle, until the new double-deckers (DDNG) arrive from 2027.");
fact("nlIcm", F_ICM, () => "The Koploper, its cab high over a nose that opens for a gangway when units couple; on the Intercitys to the north and east until 2030.");
fact("nlSlt", F_SLT, () => "NS's Sprinter Lighttrain, low-floor on Jakobs trucks, on the Randstad's Sprinters.");
fact("nlSng", F_SNG, () => "The Sprinter Nieuwe Generatie, low-floor on Jakobs trucks, its front yellow since 2021-2022.");
fact("nlFl", F_FL, () => "NS's FLIRTs, bought when the SNG came late, on the Sprinters of Brabant and Gelderland.");
fact("nlUnit", { model: "NS unit", type: "Electric multiple unit", source: `${NLWP}Nederlandse_Spoorwegen` }, (k) => `${UNIT_NAMES[k.slice(6).replace(/R$/, "")] || "An NS unit"}, as InfoPlus reports it.`);
FACTS.nlVectronNs = { model: "Siemens Vectron MS (193)", type: "Electric locomotive", builder: "Siemens Mobility", built: "2017–2021", topSpeedMph: 124, lengthFt: 62.3, source: "https://en.wikipedia.org/wiki/Siemens_Vectron",
  about: "NS International's leased Vectrons in NS's Flow paint, hauling the Nightjets between Amsterdam and Köln or Oberhausen." };
FACTS.nlHle28 = { model: "Bombardier TRAXX F140 MS (SNCB HLE 28)", type: "Electric locomotive", builder: "Bombardier", built: "2008–2009", topSpeedMph: 124, lengthFt: 62.0, source: "https://nl.wikipedia.org/wiki/HLE_28",
  about: "SNCB's leased TRAXX locomotives on the EuroCity Brussel-Zuid–Antwerpen–Rotterdam with I11 coaches." };
for (const src of [SNCF, SNCB, { FACTS: {} }]) for (const [k, f] of Object.entries(src.FACTS || {})) if (TYPES[k] && !FACTS[k] && /^(snIce3|snE320|snPbka|i11|am75|ice3neo)/.test(k)) FACTS[k] = f;
for (const k of ["nlIce408End", "nlIce408Mid", "nlIce408Pan"]) if (TYPES[k]) FACTS[k] = { model: "Siemens Velaro MS (DB class 408, ICE 3neo)", type: "High-speed electric multiple unit", builder: "Siemens Mobility", built: "2022–2029",
  topSpeedMph: 199, source: "https://de.wikipedia.org/wiki/DB-Baureihe_408", about: "DB's ICE 3neo, eight cars, on the ICEs Amsterdam–Köln–Frankfurt and Amsterdam–Berlin." };
const XF = (model, builder, built, about, source) => ({ model, type: "Electric multiple unit", builder, built, about, source });
Object.assign(FACTS, {
  nlRnCab: XF("Stadler FLIRT 3 (NS, R-net)", "Stadler Rail", "2017–2018", "NS's two-car FLIRTs for R-net's Gouda–Alphen a/d Rijn Sprinters, in R-net's gray and red.", "https://en.wikipedia.org/wiki/R-net"),
  nlViCab: XF("Stadler FLIRT 3 (VIAS ET 25)", "Stadler Rail", "2016–2017", "VIAS's FLIRTs on the RE 19 Rhein-IJssel-Express, Düsseldorf/Duisburg–Emmerich–Arnhem.", "https://de.wikipedia.org/wiki/Rhein-IJssel-Express"),
  nlE4Cab: XF("Stadler FLIRT 3 (eurobahn ET 4)", "Stadler Rail", "2024–2025", "eurobahn's new FLIRTs on the RB 61 Hengelo–Bad Bentheim–Rheine–Osnabrück–Bielefeld.", "https://de.wikipedia.org/wiki/Eurobahn"),
  nlEb7Cab: XF("Stadler FLIRT (eurobahn ET 7)", "Stadler Rail", "2007–2009", "eurobahn's five-car FLIRTs on the RE 13 Venlo–Mönchengladbach–Düsseldorf–Hagen–Hamm.", "https://de.wikipedia.org/wiki/Eurobahn"),
  nlTalCab: { model: "Bombardier Talent (DB 643)", type: "Diesel multiple unit", builder: "Bombardier (Talbot)", built: "1996–2004", source: "https://de.wikipedia.org/wiki/Bombardier_Talent",
    about: "DB Regio's Talents on the RB 64 Euregio-Bahn Enschede–Gronau–Münster (–Dortmund)." },
  nlGvCoach: { model: "SNCB I10, rebuilt (GoVolta)", type: "Passenger coach", builder: "BN (Brugeoise et Nivelles); rebuilt by Brouwer Technology", built: "1987, rebuilt 2025–2026", lengthFt: 86.6,
    source: "https://en.wikipedia.org/wiki/GoVolta", about: "GoVolta's open-access Amsterdam–Berlin train (since March 2026), hauled by a leased Vectron." },
  nlEsSeat: { model: "UIC seat car (Bomdz)", type: "Passenger coach", lengthFt: 86.6, source: "https://en.wikipedia.org/wiki/European_Sleeper", about: "A seat car of European Sleeper's Brussel–Amsterdam–Berlin–Praha night train." },
  nlEsCouchette: { model: "Couchette car (Bvcmz 248, ex-DB)", type: "Night train coach", lengthFt: 86.6, source: "https://en.wikipedia.org/wiki/European_Sleeper", about: "A leased couchette car (RDC/BTEX) of European Sleeper." },
  nlEsSleeper: { model: "Sleeping car (WLAB33s)", type: "Night train coach", lengthFt: 86.6, source: "https://en.wikipedia.org/wiki/European_Sleeper", about: "A leased sleeping car (RDC/BTEX) of European Sleeper." },
  nlVectronRp: { model: "Siemens Vectron (Railpool 193)", type: "Electric locomotive", builder: "Siemens Mobility", lengthFt: 62.3, source: "https://en.wikipedia.org/wiki/Siemens_Vectron", about: "Leased by Keolis for GoVolta's trains." },
  nlTraxxTc: { model: "Bombardier TRAXX AC3 (Railpool 188)", type: "Electric locomotive", builder: "Bombardier (Alstom)", lengthFt: 62.0, source: "https://en.wikipedia.org/wiki/Bombardier_TRAXX", about: "Leased by Train Charter Services for European Sleeper." },
});
for (const k of ["nlViMid", "nlViCabR"]) FACTS[k] = FACTS.nlViCab;
for (const k of ["nlE4Mid", "nlE4Mid2", "nlE4CabR"]) FACTS[k] = FACTS.nlE4Cab;
for (const k of ["nlEb7Mid", "nlEb7MidP", "nlEb7CabR"]) FACTS[k] = FACTS.nlEb7Cab;
for (const k of ["nlRnCabR", "nlRnCab2", "nlRnCab2R"]) FACTS[k] = FACTS.nlRnCab;
FACTS.nlTalCabR = FACTS.nlTalCab;
