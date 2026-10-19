// Adelaide Metro's trains (scripts/railroads/adelaidemetro.py). Its feed's
// vehicle label is the lead railcar's or set's number (3013, 4002), which
// js/railroads/adelaidemetro.js passes as the train's one known car: the
// number picks the class, the rest is what that class runs as. Drawn from
// each class's published dimensions and photographs of the current paint;
// the emblem and lettering are drawn simply, not copied from the logo.

import { bilevel, married } from "../carmodels.js?v=dev";
import { C, rect, circle, path, line, lines, poly, win, pantograph, underframe, flutes, slats } from "../carart.js?v=dev";

const seq = (from, pitch, n) => Array.from({ length: n }, (_, i) => from + i * pitch);
const AM = { steel: "#cfd3d8", red: "#d2232a", deep: "#a8191f", blue: "#1f3f8a", green: "#7cc242", yellow: "#f2c200", roof: "#a9b0b8", skirt: "#3a3f45", black: "#15181b" };

// ---------- Drawing helpers ----------

const r2 = (v) => Math.round(v * 100) / 100;
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
// Lettering on a car side, h ft tall, centered at x, reading left to right
// even on a car drawn mirrored.
const letters = (c, x, y, h, text, fill, { weight = 700 } = {}) =>
  `<text transform="translate(${r2(x)} ${r2(y)}) scale(${c.mirrored ? -1 : 1} -1)" y="${r2(h * 0.36)}" font-size="${r2(h)}" text-anchor="middle" font-weight="${weight}" font-family="${SANS}" fill="${fill}">${text}</text>`;
// Adelaide Metro's name after a round emblem in its four colors (drawn
// simply, not the logo artwork), x the emblem's center.
function amName(c, x, y, h) {
  const r = h * 0.62, k = c.mirrored ? -1 : 1;
  const seg = (a0, a1, fill) => {
    const p = (a) => [x + r * Math.cos(a), y + r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return path(`M${r2(x)} ${r2(y)}L${r2(x0)} ${r2(y0)}A${r2(r)} ${r2(r)} 0 0 1 ${r2(x1)} ${r2(y1)}Z`, fill);
  };
  const q = Math.PI / 2;
  return circle(x, y, r + 0.08, "#ffffff") + seg(0, q, AM.red) + seg(q, 2 * q, "#f39a1e") + seg(2 * q, 3 * q, AM.green) + seg(3 * q, 4 * q, "#2a62b0") +
    circle(x, y, r * 0.42, "#ffffff") + letters(c, x + k * (r + h * 3.1), y, h, "Adelaide Metro", "#1d2024");
}

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
// Every car's running gear and doors, plus its own details.
const gear = (spec, doors) => (c, g) => {
  const t = spec.trucks, a = g.L / 2 - t.centers / 2, b = g.L / 2 + t.centers / 2;
  return bogieGear(a, t.wb, spec.sill) + bogieGear(b, t.wb, spec.sill) + doorTrim(doors, spec.sill);
};

// --- Bombardier (later Alstom) 4000 class, built at Dandenong, Victoria:
// 22 sets in 2013-15 and 12 more in 2019-23 (4001-4034). Three cars,
// DM-T-DM, the driving cars 25.255 m and the trailer 24.71 m with the
// pantograph; two double doors a side on each car; a raked front. 25 kV,
// broad gauge. Ribbed stainless sides, a red band along the top of the
// side; the cab red back past the crew door, blue under a white line low on
// the front, the windshield in a black mask; a blue stripe down the middle
// of each door.
const E4K = { roof: 13.2, sill: 3.7, cornerR: 1.0, end: 0.6, trucks: { centers: 58.0, wb: 8.5, d: 34 }, diaphragm: [4.0, 12.0], badge: false,
  nose: [[1.5, 3.7], [0.9, 4.9], ["q", 0.8, 6.7, 1.5, 7.7], [4.0, 12.1], ["q", 4.8, 13.2, 6.6, 13.2]], cabLen: 7,
  cab: () => path(poly([[1.3, 7.2], ["q", 2.8, 10.0, 4.3, 12.4], [6.4, 12.4], [6.4, 7.6], ["q", 3.8, 7.0, 1.3, 7.2]]), AM.black) +
    path(poly([[3.0, 10.2], ["q", 3.6, 11.3, 4.4, 12.1], [6.2, 12.1], [6.2, 10.2]]), C.glassLight) + line(2.2, 7.6, 3.4, 9.9, "#0a0b0c", 0.8) +
    rect(4.6, 12.5, 1.7, 0.45, "#1d1f22", 0, 'rx="0.1"') + lamp(0.85, 5.7, 1.4, 0.75) + rect(0.9, 5.1, 0.55, 0.35, "#d8252d") +
    frontCoupler(0, 2.85, 1.8) + cabSkirt(1.5, 5.4, 3.7) + rect(6.9, 4.2, 2.0, 7.6, "none", 0.5, 'rx="0.2"') + win(7.15, 8.0, 1.5, 2.6, 0.3) + line(9.2, 6.4, 9.2, 9.4, "currentColor", 0.6),
};
function paint4k(c, g, nose, doors) {
  const L = g.L;
  let s = rect(0, 0, L, 18, AM.steel) + flutes(0, L, 4.2, 6.9, 0.27) + flutes(0, L, 10.7, 11.9, 0.27) + rect(0, 12.0, L, 1.3, AM.red) + rect(0, 13.15, L, 2, AM.roof) +
    rect(0, 0, L, 4.1, AM.skirt) + rect(0, 4.1, L, 0.12, "#7d848c") + rect(nose ? 9.6 : 0, 7.0, L, 3.6, "#2b2f34", 0, 'rx="0.4"');
  for (const d of doors) s += rect(d.x + d.w / 2 - 0.3, d.y0, 0.6, d.y1 - d.y0, AM.blue);
  if (nose) s += path(poly([[0, -1], [9.4, -1], [9.4, 12.0], ["q", 9.4, 13.4, 10.6, 13.4], [0, 13.4]]), AM.red) +
    path(poly([[0, -1], [6.6, -1], [6.6, 4.6], ["q", 6.0, 5.4, 4.8, 5.4], [0, 5.4]]), AM.blue) + path(poly([[0, 5.4], [4.8, 5.4], ["q", 6.0, 5.4, 6.6, 4.6], [6.6, 4.95], ["q", 6.1, 5.7, 4.8, 5.7], [0, 5.7]]), "#f4f5f6");
  return s;
}
const door4k = (x) => ({ x, w: 4.6, y0: 3.8, y1: 10.8, leaves: 2, glassY: 0.42, glassH: 0.42 });
const rows4k = (xs) => [{ xs, y: 7.2, w: 4.6, h: 3.2, r: 0.4 }];
const DOORS_4K = [door4k(21.4), door4k(61.6)], DOORS_4K_MID = [door4k(19.2), door4k(58.6)];
const e4kCar = (c) => bilevel({ ...c, cabL: true }, { ...E4K, paint: (c, g) => paint4k(c, g, true, DOORS_4K),
  rows: rows4k([14.6, ...seq(27.6, 5.6, 6), 67.4, 72.8]), doors: DOORS_4K, roofItems: [],
  extra: (c, g) => gear(E4K, DOORS_4K)(c, g) + equipment(18, 64, 3.7, { depth: 1.5, boxes: 4 }) + acUnit(26, 11, 13.2) + acUnit(56, 10, 13.2) + horns(8.0, 13.2) + antenna(10.6, 13.2) +
    amName(c, 36.4, 5.5, 1.0) });
const e4kMid = (c) => bilevel({ ...c, cabL: false, cabR: false }, { ...E4K, nose: null, cab: null, paint: (c, g) => paint4k(c, g, false, DOORS_4K_MID),
  rows: rows4k([2.0, 7.6, 12.8, ...seq(25.6, 5.5, 6), 64.8, 70.2, 75.6]), doors: DOORS_4K_MID, roofItems: [],
  extra: (c, g) => gear(E4K, DOORS_4K_MID)(c, g) + equipment(17, 63, 3.7, { depth: 1.6, boxes: 3 }) + slats(40, 2.4, 6, 1.1, 0.3, "rgba(255,255,255,0.25)") +
    panDeck(14, 13.2, { cableTo: 30 }) + acUnit(36, 11, 13.2) + acUnit(62, 11, 13.2) + amName(c, 36.4, 5.5, 1.0) });

// --- Comeng and Clyde Engineering 3000 class (3001-3030) and 3100 class
// (3101-3140), built 1987-96: 25.77 m diesel railcars in stainless steel,
// the 3000s single cars with a cab at each end, the 3100s married pairs
// with a cab at the outer end only. Two double doors a side, a flat front
// with two big windshield panes. Converted to hybrid drive; 50 cars remain
// (3009-3030, 3113-3140) on the Belair, Grange, Outer Harbor and Port Dock
// lines. Current paint: fluted stainless low on the side, a lime green
// window band, a red band along the top of the side; the cab end red,
// wrapping around the corner, blue low on the front; the doors green over
// blue, edged in yellow. Two air-conditioning units and the exhaust stacks
// on the roof; under the floor the engine and its radiator, the fuel tank.
const DIESEL_DOORS = [{ x: 21.0, w: 4.6, y0: 3.9, y1: 10.7, leaves: 2, glassY: 0.45, glassH: 0.4 }, { x: 58.9, w: 4.6, y0: 3.9, y1: 10.7, leaves: 2, glassY: 0.45, glassH: 0.4 }];
const DIESEL = { roof: 13.0, sill: 3.8, cornerR: 1.1, end: 0.6, trucks: { centers: 60.0, wb: 8.5, d: 34 }, diaphragm: [4.0, 11.9], badge: false, cabLen: 4.5,
  doors: DIESEL_DOORS, rows: [{ xs: [6.0, 12.2, ...seq(28.0, 5.8, 5), 66.8, 73.0], y: 7.3, w: 4.4, h: 2.9, r: 0.35 }], roofItems: [],
  paint: (c, g) => {
    const L = g.L;
    let s = rect(0, 0, L, 17, "#d5d9de") + flutes(0, L, 4.0, 6.6, 0.27) + rect(0, 6.75, L, 3.8, AM.green) + rect(0, 10.55, L, 1.2, "#c3c8ce") +
      rect(0, 11.75, L, 1.3, AM.red) + rect(0, 12.95, L, 2, C.steelShade) + rect(0, 0, L, 3.95, AM.skirt);
    for (const d of DIESEL_DOORS) s += rect(d.x - 0.25, d.y0, d.w + 0.5, d.y1 - d.y0 + 0.2, AM.yellow) + rect(d.x, d.y0, d.w, 2.6, AM.blue) + rect(d.x, d.y0 + 2.6, d.w, d.y1 - d.y0 - 2.6, AM.green);
    return s;
  },
  // The cab end: red around the corner, blue low on the front, the
  // windshield's edge, the cab side window, a headlight, the crew's grab.
  cab: (c, { x0 }) => rect(x0, 3.8, 2.2, 9.25, AM.red) + rect(x0, 3.8, 0.55, 1.6, AM.blue) + rect(x0, 7.4, 0.5, 3.4, C.glass) + win(x0 + 1.6, 7.3, 2.4, 3.1, 0.3) +
    rect(x0 + 0.05, 6.2, 0.45, 0.7, "#e9edf0", 0.3) + rect(x0 + 0.05, 11.4, 0.45, 0.5, "#1d1f22") + line(x0 + 4.4, 5.6, x0 + 4.4, 9.0, "currentColor", 0.6) +
    horns(x0 + 1.4, 13.0) + frontCoupler(x0 - 0.6, 2.85, 1.6) + cabSkirt(x0 + 0.4, x0 + 4.0, 3.8),
  extra: (c, g) => {
    const L = g.L;
    // The engine and transmission, the radiator with its fan, the fuel
    // tank, the battery boxes; on the roof the exhaust stacks and the
    // air-conditioning units.
    return gear(DIESEL, DIESEL_DOORS)(c, g) + rect(26, 1.3, 13, 2.4, "currentColor", 0, 'opacity="0.82" rx="0.2"') + slats(27, 1.6, 5, 1.8, 0.3, "rgba(255,255,255,0.25)") +
      rect(40, 1.6, 5.5, 2.1, "#4a5057", 0.4, 'rx="0.2"') + slats(40.3, 1.8, 4.9, 1.7, 0.3, "rgba(0,0,0,0.45)") + rect(46.5, 1.9, 9, 1.7, "#3a3f45", 0.4, 'rx="0.8"') +
      underframe(56, 62, 3.8, { depth: 1.3, boxes: 1, tanks: false }) + line(20, 3.55, 62, 3.55, "#3a3f45", 0.9) +
      acUnit(17, 10, 13.0, { h: 0.9, fill: "#e3e6e9" }) + acUnit(L - 27, 10, 13.0, { h: 0.9, fill: "#e3e6e9" }) +
      rect(40.4, 12.95, 0.45, 1.4, "#3a3f45") + rect(41.3, 12.95, 0.45, 1.4, "#3a3f45") + rect(40.0, 12.95, 2.2, 0.3, "#5a6068") + antenna(L / 2 + 4, 13.0) +
      amName(c, 45.4, 5.3, 1.0);
  },
};
const adl3000 = (c) => bilevel({ ...c, cabL: true, cabR: true }, DIESEL);
const adl3100 = married((c) => bilevel(c, DIESEL));

export const TYPES = {
  adl4000Car: { name: "4000 class driving car", kind: "emu" },
  adl4000Mid: { name: "4000 class trailer", kind: "emu" },
  adl3000: { name: "3000 class railcar", kind: "emu" },
  adl3100: { name: "3100 class railcar", kind: "emu" },
};
const M = (draw, len, oneEnd = false) => ({ draw, len, oneEnd, variant: null });
export const MODELS = {
  adl4000Car: M(e4kCar, 82.86, true), adl4000Mid: M(e4kMid, 81.07),
  adl3000: M(adl3000, 84.55), adl3100: M(adl3100, 84.55),
};
export const FLEETS = {
  adelaidemetro: [[4001, 4034, "adl4000Car"], [3001, 3030, "adl3000"], [3101, 3140, "adl3100"]],
};
const set4k = [["adl4000Car", 1], ["adl4000Mid", 1], ["adl4000Car", 1]];
export const TYPICAL = {
  // The electrified lines (Seaford, Flinders, Gawler) have the 4000 class,
  // one set or two; the others the diesel railcars, two to four cars.
  adelaidemetro: (t, reported) => {
    const electric = reported ? reported === "adl4000Car" : /Seaford|Flinders|Gawler/.test(t.route || "");
    if (electric) return { label: "4000 class three-car electric set (at busy times two coupled)", units: set4k };
    if (reported === "adl3000") return { label: "3000 class railcars, coupled to make two to four cars", units: [["adl3000", 2]] };
    return { label: "3100 class railcar pairs (some trains 3000 class single cars)", units: [["adl3100", 2]] };
  },
};

const WIKI = "https://en.wikipedia.org/wiki/";
const E4K_FACTS = { model: "4000 class", type: "Electric multiple unit", builder: "Bombardier Transportation, later Alstom (Dandenong)", built: "2013–2015, 2019–2023",
  fleet: "34 three-car sets (4001–4034)", topSpeedMph: 68.4, powerHp: 2146, seats: 240, lengthFt: 246.8,
  about: "Adelaide's electric trains, built in Victoria in two batches: 22 sets for the Seaford and Flinders lines, then 12 more when the Gawler line was electrified in 2022. Each set is three cars, and two can run coupled.",
  source: `${WIKI}Adelaide_Metro_4000_class` };
const DIESEL_FACTS = (k) => ({ model: k === "adl3000" ? "3000 class" : "3100 class", type: "Diesel railcar (hybrid)", builder: "Comeng and Clyde Engineering", built: "1987–1996",
  fleet: k === "adl3000" ? "30 built (3001–3030), 22 in service" : "40 built (3101–3140), 28 in service", topSpeedMph: 56,
  powerHp: k === "adl3000" ? 1046 : 2092, lengthFt: 84.5,
  about: k === "adl3000"
    ? "Stainless-steel diesel railcars with a cab at each end, so one car can run alone; most trains couple two to four. Converted to hybrid drive, they run the lines not yet electrified until their planned retirement around 2030."
    : "The married-pair version of Adelaide's stainless diesel railcars, each car with a cab at its outer end. Converted to hybrid drive, they run the Belair, Grange, Outer Harbor and Port Dock lines.",
  source: `${WIKI}3000_class_railcar` });
export const FACTS = {
  adl4000Car: E4K_FACTS, adl4000Mid: E4K_FACTS,
  adl3000: DIESEL_FACTS("adl3000"), adl3100: DIESEL_FACTS("adl3100"),
};
