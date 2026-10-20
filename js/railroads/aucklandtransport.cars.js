// Auckland's trains (scripts/railroads/aucklandtransport.py): AT Metro's
// CAF electric units, and Te Huia, the Hamilton–Auckland train, with its
// locomotive, refurbished carriages and driving car. AT's feed names the AM
// unit at the front of each train (its AMP car's number, which is the unit's
// number) and the units coupled to it; each unit is drawn as its three cars.
// Te Huia's feed names no vehicles, so it is drawn as it usually runs.
// Trainsheet's own side views, from published dimensions and photographs of
// the current paint; the lettering is drawn as type, not copied from the
// operators' logos. KiwiRail's locomotives here (DL, DFB) are shared with
// Wellington's file (metlink.cars.js).

import { newId, bilevel } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, truck, pantograph, slats } from "../carart.js?v=dev";
import { letters, hvac, roofCover, panGear, horns, lamp, RED_LAMP, wiper, boxes } from "./digitraffic.cars.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const r2 = (v) => Math.round(v * 100) / 100;

// ===================== Shared detail =====================

// A body drawn with its cab on the left, turned round when the consist runs
// it the other way: a unit's cab faces outward at whichever end of the unit
// it is. right(c): whether this car's cab faces right.
export function facing(draw, right) {
  return (c) => {
    if (!right(c)) return draw({ ...c, cabL: true, cabR: false, coupledL: false });
    const m = { ...c, cabL: true, cabR: false, mirrored: !c.mirrored, coupledL: false, coupledR: c.coupledL };
    return `<g transform="matrix(-1 0 0 1 ${r2(c.L)} 0)">${draw(m)}</g>`;
  };
}
// In a train of n-car units, the last car of each unit faces right (a lone
// car drawn as a pair, the second).
export const unitEnd = (n) => (c) => (c.count % n === 0 ? c.index % n === n - 1 : c.index > 0 && c.index === c.count - 1);

// The front of a multiple unit at the left end: its automatic coupler run
// out to the face on its drawbar, the electrical head and air pipes beside
// it, the obstacle deflector under the front from x0 back to x1.
export function autoCoupler(x0, x1, sill, { y = 2.75, deflector = "#2a2d31" } = {}) {
  let s = path(poly([[x0 - 0.2, sill + 0.05], [x1, sill + 0.05], [x1 - 0.3, 0.75], [x0 + 0.7, 0.55], [x0 - 0.05, 1.25]]), deflector);
  s += line(x0 + 0.5, 1.0, x1 - 0.6, 1.1, "rgba(255,255,255,0.18)", 0.6);
  s += rect(0.4, y - 0.3, x0 + 0.4, 0.6, "#2a2d31") + rect(0, y - 0.62, 0.5, 1.24, "#2a2d31", 0, 'rx="0.14"') +
    rect(0.55, y + 0.38, 0.9, 0.42, "#5a6068", 0.3, 'rx="0.08"') + circle(0.25, y, 0.14, "#5a6068");
  return s;
}
// Between the trucks: equipment cases hung under the floor (boxes), a cable
// conduit along under the sill.
export const underGear = (x0, x1, sill, n = 4, depth = 1.35) => boxes(x0, x1, sill, n, depth) + line(x0, sill - 0.22, x1, sill - 0.22, "#3a3e44", 0.8);
// Per truck: a yaw damper and the brake unit beside the frame.
export const truckGear = (cx, sill) => line(cx - 4.6, sill - 0.5, cx - 1.9, sill - 0.5, "#5a6068", 0.9) + rect(cx + 1.6, 1.5, 1.0, 0.65, "#5a6068", 0, 'rx="0.15"');
// A radio aerial; a roof cable on insulators from a to b.
export const aerial = (x, roof) => rect(x - 0.3, roof - 0.03, 0.6, 0.14, "#4a5057") + line(x, roof + 0.1, x + 0.2, roof + 0.85, "#3a3f45", 0.6);
export function roofCable(a, b, roof, h = 0.45) {
  const segs = [];
  for (let x = Math.min(a, b) + 1.5; x < Math.max(a, b) - 0.5; x += 4.5) segs.push([x, roof, x, roof + h]);
  return lines(segs, "#7d848c", 0.8) + line(a, roof + h, b, roof + h, "#3a3f45", 0.8);
}
// A plug or sliding double door drawn leaf by leaf: the leaves' paint, their
// edges, a tall window in each (x, w, y0, y1 of the doorway); grab handles
// beside it (color), the door-open button.
export function leafDoor(x, w, y0, y1, { fill, glass = [0.42, 0.88], gw = 0.45, edge = "#2b2e33", handles = null, button = true } = {}) {
  const h = y1 - y0, lw = w / 2;
  let s = rect(x, y0, w, h, fill, 0.6, 'rx="0.12"') + line(x + lw, y0, x + lw, y1, edge, 0.7);
  for (const k of [0, 1]) {
    const gx = x + lw * k + lw * (0.5 - gw / 2);
    s += win(gx, y0 + h * glass[0], lw * gw, h * (glass[1] - glass[0]), 0.2);
  }
  if (handles) s += line(x - 0.35, y0 + h * 0.18, x - 0.35, y0 + h * 0.68, handles, 1.1) + line(x + w + 0.35, y0 + h * 0.18, x + w + 0.35, y0 + h * 0.68, handles, 1.1);
  if (button) s += rect(x + w + 0.15, y0 + h * 0.42, 0.28, 0.4, "#2b2e33", 0, 'rx="0.08"') + circle(x + w + 0.29, y0 + h * 0.48, 0.08, "#3fbf5a");
  return s;
}

// ===================== AT Metro: AM class =====================

// --- CAF AM class (Civity family; Beasain, Spain, 2013-15 and 2019-20;
// Huehuetoca, Mexico, 2022-26): 95 three-car units, AM 103-714 (57),
// AM 810-973 (15) and AM 1005-1249 (23); each car carries its unit's
// number after its class, AMA 415, AMT 415, AMP 415. 25 kV AC, 3 ft 6 in
// gauge, 110 km/h. Formation AMA-AMT-AMP: the two driving motor cars
// 24.3 m (79 ft 9 in), the trailer between them 23.2 m, the train 72.03 m;
// 2.76 m wide, 3.99 m (13 ft 1 in) over the lowered pantograph; floor
// 1,100 mm, the AMT's middle section a low floor at 750 mm, level with the
// platforms; 860 mm wheels (Wikipedia, "New Zealand AM class electric
// multiple unit", and nzrailphotos.co.nz's AM class introduction for which
// car is which). The pantograph is on the AMP at its inner end, next to
// the AMT (photographs: AMP 509 at Kingsland, AM 415 at Takanini). Truck
// centers (about 56 ft) and the window and door positions are measured off
// broadside photographs and scaled to the car length.
// Two double sliding doors a side on every car, at about the quarter
// points; on a driving car, behind the cab, the crew door, the AT roundel,
// a narrow and a wide window, then four windows between the doors and two
// beyond. The AMT's doors open onto its low floor, and its middle bay
// carries a big roundel between the windows.
// AT Metro's paint: silver-gray; a navy band through the windows the length
// of every car, a pale band over it under a thin red line at the eave;
// silver below, with gray speed lines that end in small rings. The cab:
// yellow over the top (the twin headlights in a black pod in the yellow
// cap, the destination display under it), around the raked windshield and
// across the front under it, black lamp pods at its lower corners; a silver
// band curves down behind the windshield and back along the sill, and
// inside it the cab side is navy, around the cab window and the crew door
// with its yellow grab rails; a white stripe falls forward from the AT
// roundel past the crew door. Yellow doors. The AMT: navy right down to
// the sill between its doors, the speed lines in a lighter blue across it.
const AT = { navy: "#202b5c", silver: "#c6cacf", pale: "#e7e9eb", roof: "#b3b9bf", red: "#d0282e", yellow: "#f5c200", lines: "#979ea6",
  navyLine: "#46558c", black: "#16181b", skirt: "#3a3e44" };
const AM = { roof: 12.5, sill: 3.45, cornerR: 1.0, end: 0.6, trucks: { centers: 56.0, wb: 8.2, d: 34 }, diaphragm: [3.7, 11.2], badge: false };
// The AT roundel, drawn simply: a white disc ringed in navy, the letters AT,
// and the red, blue and green arcs round its edge.
function atRoundel(c, x, y, r) {
  const arc = (a0, a1, color, rr = r * 0.86) => {
    const p = (a) => [x + rr * Math.cos(a), y + rr * Math.sin(a)];
    const [ax, ay] = p(a0), [bx, by] = p(a1);
    return path(`M${r2(ax)} ${r2(ay)}A${r2(rr)} ${r2(rr)} 0 0 ${a1 > a0 ? 1 : 0} ${r2(bx)} ${r2(by)}`, "none", 0, `stroke="${color}" stroke-width="${r2(r * 0.13)}" stroke-linecap="butt"`);
  };
  return circle(x, y, r, "#ffffff") + circle(x, y, r * 0.97, "none", 0, `stroke="${AT.navy}" stroke-width="${r2(r * 0.07)}"`) +
    arc(0.35, 1.5, AT.red) + arc(3.5, 4.3, "#2a8fd6") + arc(4.3, 5.2, "#3aa856") + letters(c, x, y - r * 0.05, r * 1.05, "AT", AT.navy, { weight: 800, spacing: -0.05 * r });
}
// Speed lines low on the side, from a to b, each ending in a small ring at
// the b end (dir 1) or the a end (dir -1).
function speedLines(a, b, y0, color, dir = 1, n = 4, gap = 0.36) {
  let s = "";
  for (let k = 0; k < n; k++) {
    const y = y0 + k * gap, w = (b - a) * (1 - k * 0.12), x0 = dir > 0 ? a : b - w, x1 = x0 + w;
    s += line(x0, y, x1, y, color, 0.9) + circle(dir > 0 ? x1 + 0.12 : x0 - 0.12, y, 0.1, "none", 0, `stroke="${color}" stroke-width="0.5"`);
  }
  return s;
}
const amDoor = (x, y0 = 3.65) => leafDoor(x, 4.8, y0, 10.35, { fill: AT.yellow, glass: [0.3, 0.9], gw: 0.36, edge: "#b88f00" }) +
  rect(x + 0.4, y0 - 0.32, 4.0, 0.28, "#3a3e44");                      // step plate
// The small amber destination display over one door of each car.
const sideSign = (x) => rect(x, 10.5, 1.4, 0.4, "#121417", 0.3, 'rx="0.06"') + rect(x + 0.15, 10.6, 0.9, 0.2, "#f39a1e");
function amRoof(c, g, { pan, cab }) {
  const L = g.L, roof = g.roof;
  let s = hvac(cab ? 15.5 : 6.5, roof, 9.5, 0.45, "#a9afb6") + hvac(L - (cab ? 17.5 : 16.0), roof, 9.5, 0.45, "#a9afb6") + roofCover(L / 2 - 8, roof, 16, 0.3, "#b0b6bc", 3);
  if (pan) s += rect(L - 13.6, roof - 0.05, 8.2, 0.3, "#8f969e", 0.4) + pantograph(L - 9.4, roof + 0.25, { facing: 1 }) + panGear(L - 9.4, roof, -1) + roofCable(L - 15.5, L - 26, roof);
  if (cab) s += horns(7.6, roof) + aerial(10.2, roof);
  return s;
}
// A driving car, cab on the left: pan for the AMP.
function amCar(pan) {
  const rows = [{ xs: [15.4], y: 6.85, w: 1.6, h: 2.8, r: 0.35 }, { xs: [18.3], y: 6.85, w: 4.3, h: 2.8, r: 0.35 },
    { xs: seq(32.8, 5.75, 4), y: 6.85, w: 4.4, h: 2.8, r: 0.35 }, { xs: [64.5, 70.2], y: 6.85, w: 4.4, h: 2.8, r: 0.35 }];
  return (c) => bilevel(c, { ...AM, rows, doors: [], cabLen: 9,
    nose: [[1.35, 3.45], [1.1, 4.3], [1.1, 6.45], [1.35, 8.0], [2.35, 10.95], ["q", 2.85, 12.5, 5.2, 12.5]],
    paint: (c, g) => {
      const L = g.L;
      let s = rect(0, 0, L, 18, AT.silver) + rect(0, 10.25, L, 0.65, AT.pale) + rect(0, 10.9, L, 0.14, AT.red) + rect(0, 11.04, L, 3, AT.roof) +
        rect(0, 6.05, L, 4.2, AT.navy) + rect(0, 0, L, 3.75, AT.skirt);
      s += speedLines(19.5, 31.5, 4.35, AT.lines, 1) + speedLines(48.0, 56.0, 4.35, AT.lines, -1);
      // The cab side: navy inside the silver band that curves down behind
      // the windshield and back along the sill.
      s += path(poly([[5.4, 11.0], ["q", 5.0, 9.0, 5.3, 6.0], ["q", 5.6, 4.4, 7.4, 4.25], [14.0, 4.2], [15.2, 6.05], [15.2, 10.25], [5.6, 10.25]]), AT.navy);
      s += path(poly([[13.2, 3.75], [14.0, 3.75], [17.6, 8.0], [17.6, 8.7], [16.8, 8.7]]), "#ffffff") + path(poly([[11.6, 3.75], [12.2, 3.75], [15.6, 7.6], [15.0, 7.6]]), "#9aa3ad");
      // Yellow over the cab: the cap over the roof, the windshield's
      // surround and the panel under it; the red line runs on across the
      // front over the windshield.
      s += path(poly([[0, 10.9], [3.9, 10.9], ["q", 4.4, 11.2, 5.4, 11.0], ["q", 6.2, 11.5, 7.6, 12.6], [0, 12.6]]), AT.yellow) +
        path(poly([[0, 6.45], [4.6, 6.45], ["q", 4.5, 9.0, 4.0, 10.95], [0, 10.95]]), AT.yellow) + rect(0, 10.82, 4.2, 0.12, AT.red);
      return s;
    },
    cab: (c, g) => {
      // The windshield's edge seen from the side, the destination display and
      // headlight pod over it, the lamp pod at its foot.
      let s = path(poly([[1.4, 8.1], [2.35, 10.8], [3.05, 10.8], [2.15, 8.1]]), C.glass) + wiper(1.9, 8.4, 2.5, 10.2) +
        path(poly([[2.45, 10.98], [4.2, 10.98], [4.2, 11.5], [2.75, 11.5]]), AT.black) + rect(2.85, 11.1, 1.0, 0.25, "#f39a1e") +
        path(poly([[3.05, 11.65], [5.6, 11.65], [5.9, 12.2], ["q", 4.8, 12.45, 3.6, 12.35]]), AT.black) + circle(3.75, 11.98, 0.2, "#f6f2dc") +
        path(poly([[1.12, 6.6], [2.3, 6.6], [2.3, 7.85], [1.32, 7.85]]), AT.black) + lamp(1.3, 7.15, 0.45, 0.4) + lamp(1.3, 6.75, 0.4, 0.28, RED_LAMP);
      // Cab side window; the crew door with its window and yellow rails.
      s += win(6.2, 6.6, 2.0, 3.3, 0.5) + rect(9.5, 3.75, 2.1, 6.6, "none", 0.5, 'rx="0.2"') + win(9.85, 7.4, 1.4, 2.4, 0.3) +
        line(9.15, 4.5, 9.15, 8.6, AT.yellow, 1.1) + line(11.95, 4.5, 11.95, 8.6, AT.yellow, 1.1) + rect(11.0, 5.5, 0.3, 0.5, "#2b2e33");
      return s + atRoundel(c, 13.7, 8.75, 1.15) + letters(c, 12.2, 4.4, 0.32, "Auckland Transport", "#3a3f45", { weight: 600 }) +
        autoCoupler(1.35, 5.2, 3.45);
    },
    extra: (c, g) => {
      const t = AM.trucks, a = g.L / 2 - t.centers / 2, b = g.L / 2 + t.centers / 2;
      return amDoor(25.2) + amDoor(56.9) + sideSign(30.4) + truckGear(a, AM.sill) + truckGear(b, AM.sill) +
        underGear(a + 6.0, b - 6.0, AM.sill, pan ? 4 : 5, 1.4) + amRoof(c, g, { pan, cab: true });
    },
  });
}
// The AMT: low floor between the trucks (its underside dropped, the doors
// down to platform height), the big roundel in the middle bay.
function amtCar(c) {
  const L = c.L;
  return bilevel({ ...c, cabL: false, cabR: false }, { ...AM, drop: { a: 15.6, b: L - 15.6, y: 2.05 },
    rows: [{ xs: [3.2], y: 6.85, w: 1.6, h: 2.8, r: 0.35 }, { xs: [5.9, 11.0], y: 6.85, w: 4.4, h: 2.8, r: 0.35 },
      { xs: [24.3, 29.6, 42.2, 47.5], y: 6.85, w: 4.4, h: 2.8, r: 0.35 }, { xs: [60.7, 65.8], y: 6.85, w: 4.4, h: 2.8, r: 0.35 }, { xs: [71.3], y: 6.85, w: 1.6, h: 2.8, r: 0.35 }],
    doors: [],
    paint: (c, g) => {
      let s = rect(0, 0, L, 18, AT.silver) + rect(0, 10.25, L, 0.65, AT.pale) + rect(0, 10.9, L, 0.14, AT.red) + rect(0, 11.04, L, 3, AT.roof) +
        rect(0, 6.05, L, 4.2, AT.navy) + rect(0, 0, L, 3.75, AT.skirt);
      // Navy to the sill between the doors, its ends cut on a slant.
      s += path(poly([[14.6, 6.05], [16.4, 2.0], [L - 16.4, 2.0], [L - 14.6, 6.05]]), AT.navy);
      s += speedLines(23.0, 33.4, 3.0, AT.navyLine, -1, 5, 0.42) + speedLines(42.7, 53.0, 3.0, AT.navyLine, 1, 5, 0.42);
      for (const rr of [3.1, 3.45]) s += circle(L / 2, 6.9, rr, "none", 0, `stroke="${AT.navyLine}" stroke-width="0.12"`);
      return s;
    },
    extra: (c, g) => {
      const t = AM.trucks, a = L / 2 - t.centers / 2, b = L / 2 + t.centers / 2;
      return amDoor(18.0, 2.25) + amDoor(53.3, 2.25) + sideSign(23.2) + atRoundel(c, L / 2, 6.9, 2.75) + truckGear(a, AM.sill) + truckGear(b, AM.sill) +
        boxes(a + 5.0, a + 10.5, AM.sill, 1, 1.2) + boxes(b - 10.5, b - 5.0, AM.sill, 1, 1.2) + underGear(L / 2 - 6, L / 2 + 6, 2.05, 2, 0.5) +
        amRoof(c, g, { pan: false, cab: false });
    },
  });
}
const amEnd = unitEnd(3);
export const amaCar = facing(amCar(false), amEnd);
export const ampCar = facing(amCar(true), amEnd);

// ===================== KiwiRail locomotives =====================

// A locomotive's body (the carmodels.js builders can't shape a hood unit):
// the outline filled, its livery clipped to it and shaded like the
// built-in drawings, soft shadow low and highlight high.
export function shell(d, base, liv, top = 13) {
  const id = newId();
  const shade = `<linearGradient id="${id}-s" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="${top}">` +
    '<stop offset="0.15" stop-color="#000" stop-opacity="0.16" style="stop-opacity:var(--car-shade-low,0.16)"/><stop offset="0.45" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.1" style="stop-opacity:var(--car-shade-high,0.1)"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.08" style="stop-opacity:var(--car-shade-roof,0.08)"/></linearGradient>';
  return path(d, base) + `<clipPath id="${id}"><path d="${d}"/></clipPath><defs>${shade}</defs>` +
    `<g clip-path="url(#${id})">${liv}<rect x="-5" y="0" width="200" height="${top + 2}" fill="url(#${id}-s)"/></g>` + path(d, "none", 0.8);
}
// KiwiRail's colors: its golden yellow, the red and the charcoal gray of the
// hood; the lettering white.
export const KR = { yellow: "#f2b400", red: "#d2432b", gray: "#4d5257", frame: "#24272b", grille: "rgba(20,22,25,0.55)" };
const grille = (x, y, w, h, gap = 0.4) => rect(x, y, w, h, KR.grille, 0.4) + slats(x, y, w, h, gap, "rgba(255,255,255,0.2)");
// KiwiRail's name big along a hood, white, its letters' feet cut by thin
// stripes (in the hood's own colors, drawn over the type), the fern's
// slanting strokes after it.
// split: where the hood's color changes from left to right.
function krName(c, x, y, h, split, left = KR.gray, right = KR.red) {
  let s = letters(c, x, y, h, "KiwiRail", "#ffffff", { weight: 700, spacing: 0.02 * h });
  const w = h * 3.9, a = x - w / 2;
  for (const k of [0.08, 0.2, 0.32]) {
    const y0 = y - h * 0.36 + h * k;
    s += rect(a, y0, Math.max(0, split - a), h * 0.05, left) + rect(Math.max(a, split), y0, Math.max(0, a + w - split), h * 0.05, right);
  }
  return s;
}
const fern = (x, y, h, dir = 1) => lines([0, 1, 2, 3, 4].map((k) => [x + dir * k * 0.42, y - h / 2 + k * 0.06, x + dir * (k * 0.42 + h * 0.55), y + h / 2]), "#ffffff", 0.9);
// Hand rails along a walkway, posts to the rail: from a to b at deck y.
const rails = (a, b, deck, h = 2.6) => {
  const segs = [[a, deck + h, b, deck + h]];
  for (let x = a; x <= b + 0.01; x += (b - a) / Math.max(1, Math.round((b - a) / 5))) segs.push([x, deck, x, deck + h]);
  return lines(segs, "#d9dcdf", 0.7);
};
// A diesel's exhaust stack and the dynamic brake or radiator fans on a
// hood's roof.
const stack = (x, top) => rect(x, top - 0.05, 1.4, 0.35, "#5a6068", 0.4, 'rx="0.08"') + rect(x + 0.35, top + 0.3, 0.7, 0.35, "#2a2d31");
const fan = (x, top, w = 4.2) => path(`M${r2(x - w / 2)} ${r2(top)}Q${r2(x)} ${r2(top + 0.7)} ${r2(x + w / 2)} ${r2(top)}Z`, "#5a6068", 0.4);
// A three-axle locomotive truck with its traction motors' and brake gear.
const locoTruck = (cx, sill, { wb = 12.2, d = 40 } = {}) => truck(cx, { wb, d, kind: "loco", top: sill, axles: 3 }) +
  rect(cx - 1.2, 1.9, 2.4, 0.7, "#3a3e44", 0, 'rx="0.12"');
// Air hoses and the coupler at a locomotive's front (x: the coupler face).
const krFront = (x, deck, dir = 1) => {
  const X = (v) => x + dir * v;
  return rect(Math.min(X(0), X(1.6)), 2.55, 1.6, 0.6, "#2a2d31") + rect(Math.min(X(0), X(0.5)), 2.2, 0.5, 1.3, "#2a2d31", 0, 'rx="0.12"') +
    path(`M${r2(X(1.3))} ${r2(deck - 0.6)}Q${r2(X(0.6))} ${r2(deck - 1.8)} ${r2(X(0.9))} ${r2(2.0)}`, "none", 0, 'stroke="#1b1d20" stroke-width="0.9" vector-effect="non-scaling-stroke" stroke-linecap="round"');
};

// --- DL class (CRRC Dalian with MTU 20V 4000R43 engines, 2009-2023): 73
// built, DL 9008 onward, 2,700 kW (3,600 hp), Co-Co, 18.12 m over the body
// and 18.5 m (60 ft 8 in) over the couplers, 108 t (Wikipedia, "New
// Zealand DL class locomotive"). A full-width cab at each end, its
// windshield raked back over a short sloping nose; between the cabs a hood
// with walkways and hand rails, the big radiator grille at the No. 2 end;
// the fuel tank between the trucks. KiwiRail's current paint: yellow cabs
// and frame, the hood charcoal gray at the No. 2 end and red at the No. 1,
// "KiwiRail" big in white along it and the fern's strokes after it; the
// number big in black on each cab side. Height (about 12 ft 9 in), truck
// centers (36 ft) and wheels (about 40 in) are scaled from photographs.
// From August 2026 DLs fitted for passenger work at 100 km/h haul Te Huia
// (the article above), in place of the DFBs.
export function dl(c) {
  const L = c.L, deck = 4.7, roof = 12.75, hood = 12.45;
  const d = poly([[0.7, 3.6], [0.7, 8.0], [1.0, 9.0], [2.2, 12.0], [2.8, roof], [8.6, roof], [8.6, hood],
    [L - 8.6, hood], [L - 8.6, roof], [L - 2.8, roof], [L - 2.2, 12.0], [L - 1.0, 9.0], [L - 0.7, 8.0], [L - 0.7, 3.6]]);
  let s = locoTruck(L / 2 - 18, 3.6) + locoTruck(L / 2 + 18, 3.6);
  // Fuel tank and reservoirs between the trucks.
  s += path(poly([[L / 2 - 9.5, 3.6], [L / 2 + 9.5, 3.6], [L / 2 + 9.5, 2.3], ["q", L / 2 + 9.5, 1.5, L / 2 + 8.7, 1.5], [L / 2 - 8.7, 1.5], ["q", L / 2 - 9.5, 1.5, L / 2 - 9.5, 2.3]]), KR.frame, 0, 'opacity="0.92"') +
    line(L / 2 - 9, 2.35, L / 2 + 9, 2.35, "rgba(255,255,255,0.14)", 0.6);
  let liv = rect(0, 0, L, 14, KR.yellow) + rect(8.6, deck, L / 2 - 4.6, 9, KR.gray) + rect(L / 2 + 4.0, deck, L / 2 - 12.6, 9, KR.red) +
    rect(0, 3.6, L, 0.35, KR.frame) + line(0, deck, L, deck, "rgba(0,0,0,0.3)", 0.5);
  for (const [x0, dir] of [[0, 1], [L, -1]]) {
    const X = (v) => x0 + dir * v;
    liv += path(poly([[X(1.05), 9.1], [X(2.25), 11.85], [X(3.3), 11.85], [X(3.3), 9.1]]), C.glass);
  }
  s += shell(d, KR.yellow, liv);
  // Cab side windows and doors, the number; the hood's doors, grilles,
  // rails; the lettering.
  for (const [x0, dir] of [[0, 1], [L, -1]]) {
    const X = (v) => x0 + dir * v, xl = Math.min(X(3.7), X(6.9));
    s += win(xl, 8.6, 3.2, 2.6, 0.45) + rect(Math.min(X(7.2), X(8.4)), deck + 0.2, 1.2, 7.2, "none", 0.5, 'rx="0.15"') + lamp(Math.min(X(0.8), X(1.3)), 7.2, 0.5, 0.42) +
      lamp(Math.min(X(0.8), X(1.2)), 6.5, 0.4, 0.3, RED_LAMP) + krFront(x0, deck, dir) + wiper(X(1.6), 9.3, X(2.2), 11.2);
  }
  s += grille(10.0, 6.0, 15.5, 6.0, 0.5) + lines(seq(26.5, 3.2, 9).map((x) => [x, deck + 0.3, x, hood - 0.4]), "rgba(0,0,0,0.22)", 0.45) +
    grille(L / 2 + 5, 10.2, 3.0, 1.4, 0.3) + grille(L / 2 + 11, 10.2, 3.0, 1.4, 0.3) + grille(L - 16, 10.2, 3.0, 1.4, 0.3);
  s += krName(c, L / 2 + 1.0, 8.7, 3.1, L / 2 + 4.0) + fern(L - 13.6, 8.6, 2.4) + rails(8.8, L - 8.8, deck);
  s += fan(16, hood) + fan(21, hood) + stack(L / 2 - 1, hood) + horns(3.4, roof) + aerial(L - 5, roof) + rect(L / 2 + 3, hood - 0.05, 10, 0.35, "#5a6068", 0.4, 'rx="0.1"');
  return s;
}

// --- DFB class (General Motors Diesel, London, Ontario, 1979-81 as the DF
// class; rebuilt with turbochargers 1992-97 as DFT, those fitted with fire
// suppression for passenger work since 2016 classed DFB): 7008-7348, GM
// 12-645E3C, 1,800 kW (2,400 hp), Co-Co, 16.7 m (54 ft 9 in), 113 km/h
// (Wikipedia, "New Zealand DF class locomotive (1979)"). A hood unit: the
// short hood low ahead of the cab, the long hood behind with the radiators
// and their fans at the far end; walkways and hand rails along both sides.
// KiwiRail's paint: yellow at both ends (the short hood, the cab and a bay
// behind it, the radiator end), the middle of the long hood red then
// charcoal, "KiwiRail" across them in white with the fern's strokes; the
// number big on the cab side. They haul the Wairarapa Connection and, until
// August 2026, Te Huia. Heights (cab roof 12 ft 6 in, long hood 10 ft 7 in,
// short hood 8 ft 7 in, walkway 4 ft 5 in) scaled from photographs of
// DFB 7200 at Wellington.
export function dfb(c) {
  const L = c.L, deck = 4.4, roof = 12.5, hood = 10.6, nose = 8.6;
  const d = poly([[1.6, deck], [L - 1.2, deck], [L - 1.2, hood - 0.4], ["q", L - 1.2, hood, L - 1.6, hood], [13.4, hood], [13.4, roof - 0.3],
    ["q", 13.4, roof, 13.1, roof], [7.4, roof], ["q", 7.0, roof, 7.0, roof - 0.4], [7.0, nose], [2.2, nose], ["q", 1.6, nose, 1.6, nose - 0.5]]);
  let s = locoTruck(L / 2 - 14.2, deck - 0.8, { wb: 11.4 }) + locoTruck(L / 2 + 14.2, deck - 0.8, { wb: 11.4 });
  // Frame under the walkway; the fuel tank and reservoirs.
  s += rect(1.0, deck - 1.0, L - 1.8, 1.0, KR.yellow, 0.5) + line(1.0, deck - 0.5, L - 0.8, deck - 0.5, "rgba(0,0,0,0.2)", 0.5);
  s += path(poly([[L / 2 - 8.0, deck - 1.0], [L / 2 + 8.0, deck - 1.0], [L / 2 + 8.0, 2.0], ["q", L / 2 + 8.0, 1.3, L / 2 + 7.3, 1.3], [L / 2 - 7.3, 1.3], ["q", L / 2 - 8.0, 1.3, L / 2 - 8.0, 2.0]]), KR.frame, 0, 'opacity="0.92"') +
    rect(L / 2 - 11.0, deck - 1.75, 2.6, 0.7, "#5a6068", 0.3, 'rx="0.35"');
  let liv = rect(0, 0, L, 14, KR.yellow) + rect(17.6, deck, 9.6, 8, KR.red) + rect(27.2, deck, 10.4, 8, KR.gray) + line(0, deck + 0.02, L, deck + 0.02, "rgba(0,0,0,0.3)", 0.5);
  liv += path(poly([[7.0, 9.4], [7.0, 11.8], [9.0, 11.8], [9.0, 9.4]]), C.glass);
  s += shell(d, KR.yellow, liv);
  // Short hood: the number boards' and headlights' box on the cab front,
  // the lower headlights and markers; the cab's side window and door; the
  // long hood's doors, intakes and radiator grilles; rails and lettering.
  s += rect(6.6, 11.3, 0.4, 1.4, "#e2a800", 0.4) + lamp(6.3, 11.6, 0.4, 0.5) + lamp(1.65, 6.4, 0.45, 0.5) + lamp(1.65, 5.6, 0.35, 0.3, RED_LAMP) +
    rect(5.8, 12.0, 0.9, 0.45, "#d9b23a", 0.3) + path(`M5.4 12.3L6.0 12.15L6.0 12.6L5.4 12.5Z`, "#b9874a");
  s += win(9.6, 9.3, 2.8, 2.3, 0.45) + rect(9.4, deck + 0.3, 3.4, 4.3, "none", 0.45);
  s += lines(seq(14.0, 2.8, 9).map((x) => [x, deck + 0.3, x, hood - 0.5]), "rgba(0,0,0,0.25)", 0.45) + grille(14.2, 8.4, 2.2, 1.6, 0.3) +
    grille(L - 15.2, 5.0, 12.0, 4.8, 0.5) + grille(L - 25.0, 8.6, 6.0, 1.4, 0.3);
  s += krName(c, 27.4, 7.5, 2.5, 27.2, KR.red, KR.gray) + fern(18.4, 7.4, 2.0) + rails(1.8, 6.8, deck, 2.4) + rails(13.6, L - 1.8, deck, 2.4);
  s += fan(L - 10.5, hood, 3.8) + fan(L - 5.6, hood, 3.8) + stack(L / 2 + 1.2, hood) + horns(9.0, roof) + aerial(11.5, roof) + krFront(0.2, deck, 1) +
    rect(L - 1.4, 2.55, 1.4, 0.6, "#2a2d31");
  return s;
}

// ===================== Te Huia =====================

// --- The British Rail Mark 2 carriages in New Zealand (BRCW and BREL,
// Derby, 1964-75; bought by Tranz Rail and rebuilt for 3 ft 6 in gauge,
// the bodies lowered 25 cm onto new bogies): 19.66 m (64 ft 6 in) over the
// body, 2.82 m wide, 3.58-3.65 m tall, floor 1.00-1.08 m (Wikipedia, "New
// Zealand British Rail Mark 2 carriage"). Auckland's SA cars and SD
// driving cars (Hillside, about 2001-05) were given two pairs of sliding
// doors a side; when the AM class replaced them, Hutt Workshops refurbished
// eleven for Te Huia (2021): SR coaches (50 seats and a toilet), SRC café
// cars (20 seats and a servery) and SRV driving cars (cycle space, a
// generator room and the cab), in three sets, SRV 5893 / SR 5847 / SR 6061
// / SRC 5889, SRV 5993 / SR 3285 / SR 5801 / SRC 3436 and SRV 5859 /
// SR 5746 / SR 6015 / SRC 5994 (Wikipedia, "Te Huia"). The Mark 2's body:
// slightly bowed sides, a deep rounded roof, gangways at the ends; on the
// SR the doors stand at about the third points, two windows toward each end
// and three between them. The SRV's cab, built on the SD, is a flat yellow
// front with a dark band across the windshields over a horizontal grille,
// gray below. Te Huia's paint: silver-gray with a charcoal huia, the
// extinct bird the train is named for, perched big on each car; the doors'
// frames yellow; "Te Huia, Connecting Waikato & Auckland" in charcoal.
export const MK2 = { roof: 11.9, sill: 3.05, cornerR: 1.4, end: 0.5, trucks: { centers: 46.5, wb: 8.5, d: 31 }, diaphragm: [3.4, 10.6], badge: false };
const TH = { silver: "#cfd2d5", roof: "#a3a9af", band: "#b9bdc2", charcoal: "#34373b", yellow: "#f2b705", skirt: "#4a4e54", ivory: "#ece3cb", wattle: "#e8892b" };
// The huia, drawn simply: a dark bird perched leaning forward, its long
// curved ivory bill, the orange wattle at its base, the white band across
// the end of its tail. (x, y): the head; s: size in feet per unit; dir 1
// faces right.
function huia(x, y, s, dir = 1) {
  const P = (u, v) => [x + dir * u * s, y + v * s];
  const body = poly([P(0.85, 0.55), ["q", ...P(-0.2, 1.05), ...P(-1.0, 0.1)], ["q", ...P(-3.2, -1.2), ...P(-3.7, -4.2)], ["q", ...P(-3.9, -5.6), ...P(-4.5, -7.9)],
    P(-3.2, -7.9), ["q", ...P(-2.6, -5.8), ...P(-1.4, -4.8)], ["q", ...P(0.7, -3.0), ...P(1.05, -0.3)]]);
  const tail = poly([P(-4.15, -6.75), P(-2.85, -6.75), P(-3.2, -7.9), P(-4.5, -7.9)]);
  const bill = `M${r2(P(0.85, 0.3)[0])} ${r2(P(0.85, 0.3)[1])}Q${r2(P(2.7, 0.3)[0])} ${r2(P(2.7, 0.3)[1])} ${r2(P(3.4, -1.9)[0])} ${r2(P(3.4, -1.9)[1])}`;
  return path(body, TH.charcoal) + path(tail, "#f4f4f2") + path(bill, "none", 0, `stroke="${TH.ivory}" stroke-width="${r2(0.6 * s)}" stroke-linecap="round"`) +
    circle(...P(0.75, -0.2), 0.3 * s, TH.wattle) + circle(...P(0.1, 0.4), 0.1 * s, "#f4f4f2");
}
const thName = (c, x, y) => letters(c, x, y, 0.95, "Te Huia", TH.charcoal, { weight: 800, spacing: -0.02 }) +
  letters(c, x, y - 0.75, 0.3, "Connecting Waikato &amp; Auckland", TH.charcoal, { weight: 600 });
// Auckland's sliding doors as kept on the SR cars: two gray leaves with tall
// windows, the frame either side and the sill yellow.
const thDoor = (x) => rect(x - 0.4, 3.25, 0.35, 6.75, TH.yellow) + rect(x + 4.65, 3.25, 0.35, 6.75, TH.yellow) + rect(x - 0.4, 3.15, 5.4, 0.3, TH.yellow) +
  leafDoor(x, 4.6, 3.45, 9.95, { fill: "#c3c7cb", glass: [0.42, 0.9], gw: 0.42, button: true });
export const mk2Gear = (c, g, gen = false) => {
  const t = MK2.trucks, a = g.L / 2 - t.centers / 2, b = g.L / 2 + t.centers / 2;
  return truckGear(a, MK2.sill) + truckGear(b, MK2.sill) + (gen ? rect(a + 5, MK2.sill - 1.8, 10, 1.8, "#3a3e44", 0.4, 'rx="0.12"') + slats(a + 5.4, MK2.sill - 1.6, 9.2, 1.4, 0.35, "rgba(255,255,255,0.2)") +
    underGear(a + 16, b - 5, MK2.sill, 3, 1.2) : underGear(a + 5, b - 5, MK2.sill, 4, 1.2)) + hvac(g.L / 2 - 6, MK2.roof - 0.15, 12, 0.5, "#9aa1a9");
};
const mk2Paint = (c, g) => rect(0, 0, g.L, 18, TH.silver) + rect(0, 10.5, g.L, 3, TH.roof) + line(0, 10.5, g.L, 10.5, "rgba(0,0,0,0.2)", 0.5) + rect(0, 0, g.L, 3.35, TH.skirt);
const SR_ROWS = (xs) => [{ xs, y: 6.2, w: 3.0, h: 3.0, r: 0.5 }];
export const thSr = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...MK2, rows: SR_ROWS([6.4, 11.4, 24.1, 31.3, 38.5, 51.2, 56.2]), doors: [],
  paint: (c, g) => mk2Paint(c, g) + huia(52.0, 10.0, 0.88, -1),
  extra: (c, g) => thDoor(16.7) + thDoor(44.3) + thName(c, 33.0, 4.6) + mk2Gear(c, g) });
export const thSrc = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...MK2, rows: SR_ROWS([6.4, 11.4, 26.0, 33.6, 51.2, 56.2]), doors: [],
  paint: (c, g) => mk2Paint(c, g) + rect(39.4, 6.0, 2.6, 3.4, "#b9bdc2", 0, 'rx="0.3"') + huia(10.8, 10.0, 0.88, 1),
  extra: (c, g) => thDoor(16.7) + thDoor(44.3) + letters(c, 40.7, 7.7, 0.55, "Café", TH.charcoal, { weight: 700 }) + thName(c, 33.0, 4.6) + mk2Gear(c, g) });
// The SRV, cab on the left: no windows between the cab and the first doors
// (the generator room and cycle space behind the crew door).
const thSrvLeft = (c) => bilevel(c, { ...MK2, rows: SR_ROWS([24.1, 31.3, 38.5, 51.2, 56.2]), doors: [], cabLen: 5,
  nose: [[1.1, 3.05], [0.9, 4.0], [0.9, 10.2], ["q", 1.0, 11.75, 2.9, 11.9]],
  paint: (c, g) => mk2Paint(c, g) + path(poly([[0, 4.5], [3.0, 4.5], [3.0, 10.4], ["q", 3.0, 11.2, 3.6, 11.9], [0, 12]]), TH.yellow) +
    rect(0, 3.0, 3.0, 1.5, "#6b7077") + huia(10.6, 10.0, 0.88, 1) + huia(40.4, 10.0, 0.88, -1),
  cab: (c, g) => path(poly([[0.9, 7.7], [1.7, 7.7], [1.7, 10.35], [0.95, 10.35]]), "#2f3236") + rect(0.9, 6.2, 0.55, 0.32, "#3b3f45") +
    lamp(0.95, 5.2, 0.4, 0.4) + lamp(0.95, 4.65, 0.32, 0.28, RED_LAMP) + rect(3.6, 3.4, 2.3, 6.6, "none", 0.5, 'rx="0.15"') + win(3.95, 6.3, 1.6, 3.3, 0.3) +
    autoCoupler(1.1, 3.6, 3.05, { y: 2.6 }) + horns(3.5, 11.9),
  extra: (c, g) => thDoor(16.7) + thDoor(44.3) + thName(c, 34.0, 4.6) + mk2Gear(c, g, true) });
export const thSrv = facing(thSrvLeft, (c) => c.index > 0 && c.index === c.count - 1);

export const TYPES = {
  krDl: { name: "DL class locomotive", kind: "diesel" },
  krDfb: { name: "DFB class locomotive", kind: "diesel" },
  thSrv: { name: "SRV driving car", kind: "coach", cab: true },
  thSr: { name: "SR carriage", kind: "coach" },
  thSrc: { name: "SRC café car", kind: "coach", amenities: ["cafe"] },
  atAmp: { name: "AM class driving motor car (AMP)", kind: "emu" },
  atAmt: { name: "AM class trailer (AMT)", kind: "emu" },
  atAma: { name: "AM class driving motor car (AMA)", kind: "emu" },
};
const M = (draw, len, variant = null) => ({ draw, len, oneEnd: false, variant });
export const MODELS = {
  krDl: { ...M(dl, 60.7), oneEnd: true },
  krDfb: { ...M(dfb, 54.8), oneEnd: true },
  thSrv: M(thSrv, 65.6, (c) => (c.index > 0 && c.index === c.count - 1 ? "r" : "")),
  thSr: M(thSr, 65.6),
  thSrc: M(thSrc, 65.6),
  atAmp: M(ampCar, 79.72, (c) => (amEnd(c) ? "r" : "")),
  atAmt: M(amtCar, 76.12),
  atAma: M(amaCar, 79.72, (c) => (amEnd(c) ? "r" : "")),
};
// AT's feed names each unit by its AMP car's number, the unit's own:
// AM 103-714, 810-973 and 1005-1249.
// Te Huia's: its carriages by their numbers, the DLs (9008 onward) and the
// DFBs (7008-7348), should the feed name them.
const each = (nums, key) => nums.map((n) => [n, n, key]);
export const FLEETS = {
  atmetro: [[103, 714, "atAmp"], [810, 973, "atAmp"], [1005, 1249, "atAmp"]],
  tehuia: [...each([5893, 5993, 5859], "thSrv"), ...each([5889, 3436, 5994], "thSrc"), ...each([5847, 6061, 3285, 5801, 5746, 6015], "thSr"),
    [9008, 9999, "krDl"], [7008, 7348, "krDfb"]],
};
const AM_UNIT = [["atAmp", 1], ["atAmt", 1], ["atAma", 1]];
export const TYPICAL = {
  atmetro: (t) => {
    const reported = t.cars?.units || t.cars?.numbers?.length || 0;
    const units = Math.min(3, Math.max(1, reported || 2));
    const label = reported ? `AM class electric train, ${units === 1 ? "one three-car unit" : `${units} three-car units coupled`}` : "AM class electric train, usually two three-car units (6 cars)";
    return { label, units: Array.from({ length: units }, () => AM_UNIT).flat() };
  },
  // A set of four carriages, the SRV driving car at one end and the
  // locomotive at the other: a DL since August 2026 (a DFB, should the feed
  // name one). Which end the locomotive runs at isn't published; it is
  // drawn at the Auckland end, where the DLs were brought in to lead under
  // ETCS, so it leads trains to the Strand and pushes those to Hamilton.
  tehuia: (t, reported) => {
    const loco = reported === "krDfb" ? "krDfb" : "krDl", name = loco === "krDl" ? "DL" : "DFB";
    const set = [["thSrv", 1], ["thSr", 2], ["thSrc", 1], [loco, 1]];
    const north = /Strand|Auckland|Britomart|Puhinui/i.test(t.destination || "");
    return { label: `${name} locomotive with three refurbished carriages and an SRV driving car`, units: north ? set.reverse() : set };
  },
};
const kmh = (v) => Math.round((v / 1.609344) * 10) / 10, kw = (v) => Math.round(v / 0.7457);
const WP = "https://en.wikipedia.org/wiki/";
const AM_FACTS = { model: "AM class (CAF Civity)", type: "Electric multiple unit", builder: "CAF (Beasain, Spain; Huehuetoca, Mexico)", built: "2013–2015, 2019–2020, 2022–2026",
  fleet: "95 three-car units (AM 103–714, 810–973, 1005–1249)", topSpeedMph: kmh(110), powerHp: kw(1520), seats: 230, lengthFt: 236.3,
  about: "Auckland's electric trains, a driving motor car at each end (the AMP with the pantograph, the AMA without) and a low-floor trailer between, usually run as six cars. Seats are a unit's. The last of the 23 Mexican-built units arrived in 2026, ready for the City Rail Link.",
  source: `${WP}New_Zealand_AM_class_electric_multiple_unit` };
const SR_FACTS = { model: "SR carriage (British Rail Mark 2)", type: "Passenger coach", builder: "British Rail; rebuilt by Hillside, refurbished by Hutt Workshops", built: "1971–1975, rebuilt 2001–2005, refurbished 2021",
  fleet: "Three four-car Te Huia sets", seats: 50, lengthFt: 64.5,
  about: "Former Auckland suburban carriages (SA class), themselves rebuilt British Rail Mark 2s, refurbished for Te Huia with their sliding doors kept for wheelchairs and bicycles.",
  source: `${WP}Te_Huia` };
export const FACTS = {
  atAmp: AM_FACTS, atAmt: AM_FACTS, atAma: AM_FACTS,
  thSr: SR_FACTS,
  thSrc: { ...SR_FACTS, model: "SRC café car (British Rail Mark 2)", seats: 20, about: "Te Huia's café car: a servery, an accessible toilet and 20 seats, rebuilt from an Auckland SA carriage." },
  thSrv: { ...SR_FACTS, model: "SRV driving car (British Rail Mark 2)", type: "Driving trailer", seats: 28,
    about: "The cab car at the far end of a Te Huia set from its locomotive, rebuilt from an Auckland SD driving car: cycle storage, a generator room, a staff office and 28 fixed seats." },
  krDl: { model: "DL class", type: "Diesel-electric locomotive", builder: "CRRC Dalian (MTU engines)", built: "2009–2023", fleet: "73 built",
    topSpeedMph: kmh(100), powerHp: kw(2700), lengthFt: 60.7,
    about: "KiwiRail's main North Island locomotive, with a cab at each end. Some, fitted with ETCS and cleared for 100 km/h, took over Te Huia from the DFBs in August 2026.",
    source: `${WP}New_Zealand_DL_class_locomotive` },
  krDfb: { model: "DFB class (rebuilt EMD GT22MC)", type: "Diesel-electric locomotive", builder: "General Motors Diesel, London, Ontario", built: "1979–1981, rebuilt 1992–1997",
    fleet: "DFT/DFB 7008–7348", topSpeedMph: kmh(113), powerHp: kw(1800), lengthFt: 54.8,
    about: "DF class locomotives rebuilt with turbochargers as DFTs; those fitted with fire suppression for passenger trains are DFBs. They haul the Wairarapa Connection and the Capital Connection.",
    source: `${WP}New_Zealand_DF_class_locomotive_(1979)` },
};
