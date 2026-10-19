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

export const TYPES = {
  atAmp: { name: "AM class driving motor car (AMP)", kind: "emu" },
  atAmt: { name: "AM class trailer (AMT)", kind: "emu" },
  atAma: { name: "AM class driving motor car (AMA)", kind: "emu" },
};
const M = (draw, len, variant = null) => ({ draw, len, oneEnd: false, variant });
export const MODELS = {
  atAmp: M(ampCar, 79.72, (c) => (amEnd(c) ? "r" : "")),
  atAmt: M(amtCar, 76.12),
  atAma: M(amaCar, 79.72, (c) => (amEnd(c) ? "r" : "")),
};
// AT's feed names each unit by its AMP car's number, the unit's own:
// AM 103-714, 810-973 and 1005-1249.
export const FLEETS = {
  atmetro: [[103, 714, "atAmp"], [810, 973, "atAmp"], [1005, 1249, "atAmp"]],
};
const AM_UNIT = [["atAmp", 1], ["atAmt", 1], ["atAma", 1]];
export const TYPICAL = {
  atmetro: (t) => {
    const reported = t.cars?.units || t.cars?.numbers?.length || 0;
    const units = Math.min(3, Math.max(1, reported || 2));
    const label = reported ? `AM class electric train, ${units === 1 ? "one three-car unit" : `${units} three-car units coupled`}` : "AM class electric train, usually two three-car units (6 cars)";
    return { label, units: Array.from({ length: units }, () => AM_UNIT).flat() };
  },
};
export const FACTS = {};
